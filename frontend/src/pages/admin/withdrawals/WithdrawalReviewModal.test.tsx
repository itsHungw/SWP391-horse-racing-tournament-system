import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { adminWalletApi } from "../../../api/adminWalletApi";
import type { AdminWithdrawalReview } from "../../../types/wallet";
import { createReceiptOcr } from "./payment/receiptOcr";
import { WithdrawalReviewModal } from "./WithdrawalReviewModal";

vi.mock("../../../api/adminWalletApi", () => ({ adminWalletApi: { getReview: vi.fn(), approve: vi.fn(), reject: vi.fn(), markPaid: vi.fn() } }));
vi.mock("../../../components/AuthenticatedImage", () => ({
  AuthenticatedImage: ({ alt }: { alt: string }) => <img alt={alt} />,
}));
vi.mock("./payment/receiptOcr", () => ({ createReceiptOcr: vi.fn() }));
vi.mock("qrcode.react", () => ({
  QRCodeCanvas: ({ value, ...props }: { value: string; "aria-label": string }) => (
    <canvas data-value={value} aria-label={props["aria-label"]} />
  ),
}));

const highRiskReview: AdminWithdrawalReview = {
  id: 22, amount: 420000, status: "REQUESTED", requestedAt: "2026-07-21T12:00:00", reviewedAt: null, paidAt: null,
  user: { id: 7, name: "Mai Tran", email: "mai@example.com", status: "ACTIVE", createdAt: "2026-01-01T00:00:00" },
  wallet: { balance: 900000, status: "ACTIVE" },
  destination: { bankCode: "VCB", bankName: "Vietcombank", accountHolder: "MAI TRAN", accountNumber: "0123456789", displayText: "MAI TRAN", legacy: false },
  risk: { level: "HIGH", findings: [{ code: "SHARED", severity: "HIGH", title: "Shared destination", explanation: "Shared by users.", evidence: "2 users", suggestedCheck: "Verify ownership." }], contextMarkers: [] },
  aggregates: { requestCount: 2, totalRequested: 500000, paidCount: 0, totalPaid: 0, rejectedOrCancelledCount: 0 },
  recentWithdrawals: [], actions: [],
  paymentInstruction: null,
  paymentEvidence: null,
};

const approvedReview: AdminWithdrawalReview = {
  ...highRiskReview,
  status: "APPROVED",
  reviewedAt: "2026-07-21T12:05:00",
  paymentInstruction: {
    available: true,
    unavailableReason: null,
    payload: "000201010212...CRC",
    transferContent: "WD000022",
    bankCode: "VCB",
    bankName: "Vietcombank",
    accountHolder: "MAI TRAN",
    accountNumber: "0123456789",
    amount: 420000,
  },
};

const paidReview: AdminWithdrawalReview = {
  ...approvedReview,
  status: "PAID",
  paidAt: "2026-07-21T12:15:00",
  paymentInstruction: null,
  paymentEvidence: {
    transferReference: "FT-20260721-001",
    receiptUrl: "/api/v1/files/private/receipt.png",
    checksum: "abc",
    paidAt: "2026-07-21T12:15:00",
  },
};

describe("WithdrawalReviewModal", () => {
  beforeEach(() => {
    vi.mocked(adminWalletApi.getReview).mockResolvedValue(highRiskReview);
    vi.mocked(adminWalletApi.approve).mockResolvedValue(approvedReview);
    vi.mocked(createReceiptOcr).mockResolvedValue({
      recognize: vi.fn().mockResolvedValue({
        rawText: "Ma giao dich FT-20260723-001",
        referenceCandidates: [{ value: "FT-20260723-001", confidence: 0.92 }],
        amount: 420_000,
        transferContent: "WD000022",
        transactionTime: "23/07/2026 14:31",
        confidence: "HIGH",
      }),
      terminate: vi.fn().mockResolvedValue(undefined),
    });
  });

  it("guards a high-risk approval with acknowledgement and an internal note", async () => {
    render(<WithdrawalReviewModal id={22} onClose={vi.fn()} onUpdated={vi.fn()} />);
    const dialog = await screen.findByRole("dialog", { name: /withdrawal #22 review/i });
    const approve = within(dialog).getByRole("button", { name: /approve & continue to payment/i });
    expect(approve).toBeDisabled();
    fireEvent.click(within(dialog).getByRole("checkbox", { name: /reviewed the risk flags/i }));
    fireEvent.change(within(dialog).getByLabelText(/internal note/i), { target: { value: "Verified ownership by case review" } });
    expect(approve).toBeEnabled();
  });

  it("stays open and advances to payment after approval", async () => {
    const onClose = vi.fn();
    render(<WithdrawalReviewModal id={22} onClose={onClose} onUpdated={vi.fn()} />);
    const dialog = await screen.findByRole("dialog", { name: /withdrawal #22 review/i });
    fireEvent.click(within(dialog).getByRole("checkbox", { name: /reviewed the risk flags/i }));
    fireEvent.change(within(dialog).getByLabelText(/internal note/i), {
      target: { value: "Verified ownership by case review" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: /approve & continue to payment/i }));

    expect(await within(dialog).findByLabelText(/vietqr for withdrawal 22/i)).toBeInTheDocument();
    const progress = within(dialog).getByRole("navigation", { name: /withdrawal progress/i });
    expect(within(progress).getByRole("listitem", { current: "step" })).toHaveTextContent("Transfer & receipt");
    expect(within(dialog).getByRole("button", { name: /view review details/i })).toBeInTheDocument();
    expect(within(dialog).queryByRole("heading", { name: /risk evidence/i })).not.toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("opens an approved withdrawal directly on payment", async () => {
    vi.mocked(adminWalletApi.getReview).mockResolvedValue(approvedReview);
    render(<WithdrawalReviewModal id={22} onClose={vi.fn()} onUpdated={vi.fn()} />);

    const dialog = await screen.findByRole("dialog", { name: /withdrawal #22 review/i });
    expect(await within(dialog).findByRole("heading", { name: /transfer details/i })).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: /view review details/i })).toBeInTheDocument();
    expect(within(dialog).queryByRole("heading", { name: /risk evidence/i })).not.toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: /^approve/i })).not.toBeInTheDocument();
  });

  it("shows the approved review read-only and returns to the preserved payment workspace", async () => {
    vi.mocked(adminWalletApi.getReview).mockResolvedValue(approvedReview);
    render(<WithdrawalReviewModal id={22} onClose={vi.fn()} onUpdated={vi.fn()} />);

    const dialog = await screen.findByRole("dialog", { name: /withdrawal #22 review/i });
    const receipt = new File(["image"], "receipt.png", { type: "image/png" });
    fireEvent.change(within(dialog).getByLabelText(/receipt image/i), {
      target: { files: [receipt] },
    });
    expect(await within(dialog).findByDisplayValue("FT-20260723-001")).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole("button", { name: /view approved review/i }));
    expect(within(dialog).getByRole("heading", { name: /approved review record/i })).toBeInTheDocument();
    expect(within(dialog).getByRole("heading", { name: /risk evidence/i })).toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: /approve & continue|reject withdrawal/i })).not.toBeInTheDocument();
    expect(within(dialog).getByText("Receipt and confirmation")).not.toBeVisible();

    fireEvent.click(within(dialog).getByRole("button", { name: /return to transfer/i }));
    expect(within(dialog).getByRole("heading", { name: /receipt and confirmation/i })).toBeVisible();
    expect(within(dialog).getByText("receipt.png")).toBeInTheDocument();
  });

  it("opens a paid withdrawal on the completed step", async () => {
    vi.mocked(adminWalletApi.getReview).mockResolvedValue(paidReview);
    render(<WithdrawalReviewModal id={22} onClose={vi.fn()} onUpdated={vi.fn()} />);

    const dialog = await screen.findByRole("dialog", { name: /withdrawal #22 review/i });
    const progress = within(dialog).getByRole("navigation", { name: /withdrawal progress/i });
    expect(within(progress).getByRole("listitem", { current: "step" })).toHaveTextContent("Completed");
    expect(within(dialog).getByRole("heading", { name: "Payment complete" })).toBeInTheDocument();
  });

  it("asks before backdrop dismissal when action fields are dirty", async () => {
    const onClose = vi.fn();
    render(<WithdrawalReviewModal id={22} onClose={onClose} onUpdated={vi.fn()} />);
    const dialog = await screen.findByRole("dialog", { name: /withdrawal #22 review/i });
    fireEvent.change(within(dialog).getByLabelText(/internal note/i), { target: { value: "Still reviewing" } });
    fireEvent.click(screen.getByTestId("withdrawal-review-backdrop"));
    expect(screen.getByRole("dialog", { name: /discard unsaved review changes/i })).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("closes from the backdrop when there are no unsaved fields", async () => {
    const onClose = vi.fn();
    render(<WithdrawalReviewModal id={22} onClose={onClose} onUpdated={vi.fn()} />);
    await screen.findByRole("dialog", { name: /withdrawal #22 review/i });
    fireEvent.click(screen.getByTestId("withdrawal-review-backdrop"));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
