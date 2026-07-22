import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { adminWalletApi } from "../../../api/adminWalletApi";
import type { AdminWithdrawalReview } from "../../../types/wallet";
import { WithdrawalReviewModal } from "./WithdrawalReviewModal";

vi.mock("../../../api/adminWalletApi", () => ({ adminWalletApi: { getReview: vi.fn(), approve: vi.fn(), reject: vi.fn(), markPaid: vi.fn() } }));
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

describe("WithdrawalReviewModal", () => {
  beforeEach(() => {
    vi.mocked(adminWalletApi.getReview).mockResolvedValue(highRiskReview);
    vi.mocked(adminWalletApi.approve).mockResolvedValue(approvedReview);
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
    expect(onClose).not.toHaveBeenCalled();
  });

  it("opens an approved withdrawal directly on payment", async () => {
    vi.mocked(adminWalletApi.getReview).mockResolvedValue(approvedReview);
    render(<WithdrawalReviewModal id={22} onClose={vi.fn()} onUpdated={vi.fn()} />);

    const dialog = await screen.findByRole("dialog", { name: /withdrawal #22 review/i });
    expect(await within(dialog).findByText(/payment details/i)).toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: /^approve/i })).not.toBeInTheDocument();
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
