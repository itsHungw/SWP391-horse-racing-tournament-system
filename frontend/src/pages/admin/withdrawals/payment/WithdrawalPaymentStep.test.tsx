import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { adminWalletApi } from "../../../../api/adminWalletApi";
import type { AdminWithdrawalReview } from "../../../../types/wallet";
import { createReceiptOcr } from "./receiptOcr";
import { WithdrawalPaymentStep } from "./WithdrawalPaymentStep";

vi.mock("qrcode.react", () => ({
  QRCodeCanvas: ({ value, ...props }: { value: string; "aria-label": string }) => (
    <canvas data-value={value} aria-label={props["aria-label"]} />
  ),
}));

vi.mock("../../../../api/adminWalletApi", () => ({
  adminWalletApi: { markPaid: vi.fn(), reject: vi.fn() },
}));

vi.mock("./receiptOcr", () => ({ createReceiptOcr: vi.fn() }));

const approvedReview: AdminWithdrawalReview = {
  id: 123,
  amount: 250_000,
  status: "APPROVED",
  requestedAt: "2026-07-23T10:00:00",
  reviewedAt: "2026-07-23T10:05:00",
  paidAt: null,
  user: { id: 7, name: "Mai Tran", email: "mai@example.com", status: "ACTIVE", createdAt: "2026-01-01T00:00:00" },
  wallet: { balance: 500_000, status: "ACTIVE" },
  destination: {
    bankCode: "VCB",
    bankName: "Vietcombank",
    accountHolder: "MAI TRAN",
    accountNumber: "0123456789",
    displayText: "MAI TRAN · 0123456789 · Vietcombank (VCB)",
    legacy: false,
  },
  risk: { level: "LOW", findings: [], contextMarkers: [] },
  aggregates: { requestCount: 1, totalRequested: 250_000, paidCount: 0, totalPaid: 0, rejectedOrCancelledCount: 0 },
  recentWithdrawals: [],
  actions: [],
  paymentInstruction: {
    available: true,
    unavailableReason: null,
    payload: "000201010212...CRC",
    transferContent: "WD000123",
    bankCode: "VCB",
    bankName: "Vietcombank",
    accountHolder: "MAI TRAN",
    accountNumber: "0123456789",
    amount: 250_000,
  },
  paymentEvidence: null,
};

const matchedExtraction = {
  rawText: "Ma giao dich FT-20260723-001",
  referenceCandidates: [{ value: "FT-20260723-001", confidence: 0.92 }],
  amount: 250_000,
  transferContent: "WD000123",
  transactionTime: "23/07/2026 14:31",
  confidence: "HIGH" as const,
};

describe("WithdrawalPaymentStep", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createReceiptOcr).mockResolvedValue({
      recognize: vi.fn().mockResolvedValue(matchedExtraction),
      terminate: vi.fn().mockResolvedValue(undefined),
    });
    vi.mocked(adminWalletApi.markPaid).mockResolvedValue({
      ...approvedReview,
      status: "PAID",
      paymentInstruction: null,
      paymentEvidence: {
        transferReference: "FT-20260723-001",
        receiptUrl: "/api/v1/files/private/receipt.png",
        checksum: "abc",
        paidAt: "2026-07-23T14:31:00",
      },
    });
    vi.mocked(adminWalletApi.reject).mockResolvedValue({
      ...approvedReview,
      status: "REJECTED",
      paymentInstruction: null,
    });
  });

  it("presents VietQR and receipt work as one admin payment workspace", () => {
    render(<WithdrawalPaymentStep review={approvedReview} onPaid={vi.fn()} onStateChange={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "Transfer details" })).toBeInTheDocument();
    expect(screen.getByText("VietQR · NAPAS 247")).toBeInTheDocument();
    expect(screen.getByLabelText(/vietqr for withdrawal 123/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Receipt and confirmation" })).toBeInTheDocument();
  });

  it("renders trusted QR, OCRs locally and confirms a matched receipt", async () => {
    const onPaid = vi.fn();
    render(<WithdrawalPaymentStep review={approvedReview} onPaid={onPaid} onStateChange={vi.fn()} />);

    expect(screen.getByLabelText(/vietqr for withdrawal 123/i)).toBeInTheDocument();
    expect(screen.getByText("WD000123")).toBeInTheDocument();

    const receipt = new File(["image"], "receipt.png", { type: "image/png" });
    fireEvent.change(screen.getByLabelText(/receipt image/i), { target: { files: [receipt] } });

    expect(await screen.findByDisplayValue("FT-20260723-001")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /confirm paid/i }));

    await waitFor(() => {
      expect(adminWalletApi.markPaid).toHaveBeenCalledWith(123, expect.objectContaining({
        transferReference: "FT-20260723-001",
        receipt,
        mismatchAcknowledged: false,
      }));
      expect(onPaid).toHaveBeenCalled();
    });
  });

  it("blocks confirmation until an unreadable amount is acknowledged by hand", async () => {
    vi.mocked(createReceiptOcr).mockResolvedValue({
      recognize: vi.fn().mockResolvedValue({ ...matchedExtraction, amount: null, confidence: "MEDIUM" as const }),
      terminate: vi.fn().mockResolvedValue(undefined),
    });
    render(<WithdrawalPaymentStep review={approvedReview} onPaid={vi.fn()} onStateChange={vi.fn()} />);

    fireEvent.change(screen.getByLabelText(/receipt image/i), {
      target: { files: [new File(["image"], "receipt.png", { type: "image/png" })] },
    });

    expect(await screen.findByDisplayValue("FT-20260723-001")).toBeInTheDocument();
    expect(await screen.findByText(/could not be read in full/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /confirm paid/i })).toBeDisabled();

    fireEvent.click(screen.getByRole("checkbox", { name: /i checked the amount and transfer content/i }));
    fireEvent.change(screen.getByLabelText(/internal note/i), {
      target: { value: "Amount read manually off the receipt: 250,000 VND" },
    });

    expect(screen.getByRole("button", { name: /confirm paid/i })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: /confirm paid/i }));

    await waitFor(() => {
      expect(adminWalletApi.markPaid).toHaveBeenCalledWith(123, expect.objectContaining({
        mismatchAcknowledged: true,
      }));
    });
  });

  it("keeps manual transfer usable when QR is unavailable", () => {
    render(
      <WithdrawalPaymentStep
        review={{
          ...approvedReview,
          paymentInstruction: {
            ...approvedReview.paymentInstruction!,
            available: false,
            payload: null,
            unavailableReason: "BANK_BIN_UNAVAILABLE",
          },
        }}
        onPaid={vi.fn()}
        onStateChange={vi.fn()}
      />,
    );

    expect(screen.getByText(/qr unavailable/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /copy account number/i })).toBeEnabled();
  });

  it("allows OCR initialization to be retried after a transient failure", async () => {
    vi.mocked(createReceiptOcr).mockRejectedValueOnce(new Error("language data unavailable"));
    render(<WithdrawalPaymentStep review={approvedReview} onPaid={vi.fn()} onStateChange={vi.fn()} />);

    fireEvent.change(screen.getByLabelText(/receipt image/i), {
      target: { files: [new File(["first"], "first.png", { type: "image/png" })] },
    });
    expect(await screen.findByText(/ocr could not read this image/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /remove receipt image/i }));
    fireEvent.change(screen.getByLabelText(/receipt image/i), {
      target: { files: [new File(["second"], "second.png", { type: "image/png" })] },
    });

    expect(await screen.findByDisplayValue("FT-20260723-001")).toBeInTheDocument();
    expect(createReceiptOcr).toHaveBeenCalledTimes(2);
  });

  it("rejects and refunds only after confirming no transfer was made", async () => {
    const onPaid = vi.fn();
    render(<WithdrawalPaymentStep review={approvedReview} onPaid={onPaid} onStateChange={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /cannot complete payment/i }));
    fireEvent.change(screen.getByLabelText(/reason shown to user/i), {
      target: { value: "The destination account is invalid" },
    });
    fireEvent.click(screen.getByRole("checkbox", { name: /no transfer was made/i }));
    fireEvent.click(screen.getByRole("button", { name: /reject & refund/i }));

    await waitFor(() => {
      expect(adminWalletApi.reject).toHaveBeenCalledWith(123, {
        publicReason: "The destination account is invalid",
        internalNote: "No transfer was made; payout rejected from the payment step.",
        noTransferConfirmed: true,
      });
      expect(onPaid).toHaveBeenCalled();
    });
  });
});
