import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { AdminWithdrawalReview } from "../../../types/wallet";
import { WithdrawalCompactSummary } from "./WithdrawalCompactSummary";

const approvedReview: AdminWithdrawalReview = {
  id: 22,
  amount: 420000,
  status: "APPROVED",
  requestedAt: "2026-07-21T12:00:00",
  reviewedAt: "2026-07-21T12:05:00",
  paidAt: null,
  user: { id: 7, name: "Mai Tran", email: "mai@example.com", status: "ACTIVE", createdAt: "2026-01-01T00:00:00" },
  wallet: { balance: 900000, status: "ACTIVE" },
  destination: { bankCode: "VCB", bankName: "Vietcombank", accountHolder: "MAI TRAN", accountNumber: "0123456789", displayText: "MAI TRAN · 0123456789 · Vietcombank (VCB)", legacy: false },
  risk: { level: "HIGH", findings: [{ code: "SHARED", severity: "HIGH", title: "Shared destination", explanation: "Shared by users.", evidence: "2 users", suggestedCheck: "Verify ownership." }], contextMarkers: [] },
  aggregates: { requestCount: 2, totalRequested: 500000, paidCount: 0, totalPaid: 0, rejectedOrCancelledCount: 0 },
  recentWithdrawals: [],
  actions: [],
  paymentInstruction: { available: true, unavailableReason: null, payload: "000201010212...CRC", transferContent: "WD000022", bankCode: "VCB", bankName: "Vietcombank", accountHolder: "MAI TRAN", accountNumber: "0123456789", amount: 420000 },
  paymentEvidence: null,
};

describe("WithdrawalCompactSummary", () => {
  it("keeps payout facts visible and review evidence collapsed", () => {
    render(<WithdrawalCompactSummary review={approvedReview} />);

    expect(screen.getByRole("heading", { name: "Mai Tran" })).toBeInTheDocument();
    expect(screen.getByText("420,000 VND")).toBeInTheDocument();
    expect(screen.getByText(/vietcombank · 0123456789/i)).toBeInTheDocument();
    expect(screen.getByText("Elevated")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /risk evidence/i })).not.toBeInTheDocument();
  });

  it("discloses the reviewed evidence without changing workflow state", () => {
    render(<WithdrawalCompactSummary review={approvedReview} />);

    fireEvent.click(screen.getByRole("button", { name: /view review details/i }));

    expect(screen.getByRole("heading", { name: /risk evidence/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /decision timeline/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /hide review details/i })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });
});
