import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { adminWalletApi } from "../../api/adminWalletApi";
import type { AdminWithdrawalReview, AdminWithdrawalRow } from "../../types/wallet";
import { AdminWithdrawalsPage } from "./AdminWithdrawalsPage";

vi.mock("../../api/adminWalletApi", () => ({
  adminWalletApi: {
    listWithdrawals: vi.fn(),
    getSummary: vi.fn(),
    getReview: vi.fn(),
    approve: vi.fn(),
    reject: vi.fn(),
    markPaid: vi.fn(),
    getExportPreview: vi.fn(),
    downloadExport: vi.fn(),
  },
}));

vi.mock("../../layouts/AdminLayout", () => ({
  AdminLayout: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const rows: AdminWithdrawalRow[] = [
  {
    id: 22,
    userId: 7,
    userName: "Mai Tran",
    userEmail: "mai@example.com",
    amount: 420000,
    status: "REQUESTED",
    bankCode: "VCB",
    bankName: "Vietcombank",
    accountHolder: "MAI TRAN",
    maskedAccountNumber: "•••• 6789",
    risk: {
      level: "HIGH",
      findings: [
        {
          code: "SHARED_DESTINATION",
          severity: "HIGH",
          title: "Destination is shared by multiple users",
          explanation: "The same destination appears on another account.",
          evidence: "2 distinct users",
          suggestedCheck: "Verify account ownership.",
        },
      ],
      contextMarkers: [],
    },
    requestedAt: "2026-07-21T12:00:00",
  },
  {
    id: 23,
    userId: 8,
    userName: "An Le",
    userEmail: "an@example.com",
    amount: 150000,
    status: "REQUESTED",
    bankCode: "TCB",
    bankName: "Techcombank",
    accountHolder: "AN LE",
    maskedAccountNumber: "•••• 4455",
    risk: { level: "LOW", findings: [], contextMarkers: ["FIRST_WITHDRAWAL"] },
    requestedAt: "2026-07-21T11:00:00",
  },
];

const review: AdminWithdrawalReview = {
  id: 22,
  amount: 420000,
  status: "REQUESTED",
  requestedAt: "2026-07-21T12:00:00",
  reviewedAt: null,
  paidAt: null,
  user: {
    id: 7,
    name: "Mai Tran",
    email: "mai@example.com",
    status: "ACTIVE",
    createdAt: "2026-01-01T00:00:00",
  },
  wallet: { balance: 900000, status: "ACTIVE" },
  destination: {
    bankCode: "VCB",
    bankName: "Vietcombank",
    accountHolder: "MAI TRAN",
    accountNumber: "0123456789",
    displayText: "MAI TRAN · 0123456789 · Vietcombank (VCB)",
    legacy: false,
  },
  risk: rows[0].risk,
  aggregates: {
    requestCount: 4,
    totalRequested: 900000,
    paidCount: 2,
    totalPaid: 300000,
    rejectedOrCancelledCount: 1,
  },
  recentWithdrawals: [{ id: 22, amount: 420000, status: "REQUESTED", requestedAt: "2026-07-21T12:00:00" }],
  actions: [
    {
      id: 1,
      action: "CREATED",
      oldStatus: null,
      newStatus: "REQUESTED",
      actorId: 7,
      actorName: "Mai Tran",
      publicReason: null,
      internalNote: null,
      transferReference: null,
      riskLevel: "LOW",
      riskSnapshot: { level: "LOW", findings: [], contextMarkers: [] },
      createdAt: "2026-07-21T12:00:00",
    },
  ],
  paymentInstruction: null,
  paymentEvidence: null,
};

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location-search">{location.search}</output>;
}

describe("AdminWithdrawalsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(adminWalletApi.listWithdrawals).mockResolvedValue({
      content: rows,
      totalElements: 2,
      totalPages: 1,
      number: 0,
      size: 20,
    });
    vi.mocked(adminWalletApi.getSummary).mockResolvedValue({
      needsReview: 7,
      readyToPay: 3,
      pendingValue: 2450000,
      highRisk: 2,
    });
    vi.mocked(adminWalletApi.getReview).mockResolvedValue(review);
    vi.mocked(adminWalletApi.getExportPreview).mockResolvedValue({
      operationsRows: 2,
      paymentQueueRows: 1,
      paidReconciliationRows: 0,
      containsSensitiveData: true,
    });
    vi.mocked(adminWalletApi.downloadExport).mockResolvedValue({
      blob: new Blob(["xlsx"]),
      filename: "withdrawals.xlsx",
    });
  });

  it("renders independent metrics and a masked risk-aware queue from URL filters", async () => {
    render(
      <MemoryRouter initialEntries={["/admin/withdrawals?status=REQUESTED&page=1"]}>
        <AdminWithdrawalsPage />
      </MemoryRouter>,
    );

    expect((await screen.findAllByText("Needs review")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("•••• 6789").length).toBeGreaterThan(0);
    expect(screen.getAllByText("High risk").length).toBeGreaterThan(0);
    expect(adminWalletApi.listWithdrawals).toHaveBeenCalledWith(
      expect.objectContaining({ status: "REQUESTED", page: 0 }),
    );
    expect(screen.getAllByRole("button", { name: /review withdrawal #22/i }).length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: /quick approve withdrawal #22/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /quick approve withdrawal #23/i })).not.toBeInTheDocument();
  });

  it("opens the large review dialog and shows explainable risk evidence", async () => {
    render(
      <MemoryRouter>
        <AdminWithdrawalsPage />
      </MemoryRouter>,
    );
    fireEvent.click((await screen.findAllByRole("button", { name: /review withdrawal #22/i }))[0]);

    const dialog = await screen.findByRole("dialog", { name: /withdrawal #22 review/i });
    expect(within(dialog).getByText("Destination is shared by multiple users")).toBeInTheDocument();
    expect(within(dialog).getByText("2 distinct users")).toBeInTheDocument();
    expect(within(dialog).getByLabelText(/internal note/i)).toBeInTheDocument();
  });

  it("opens a review from the URL and removes only that deep-link when closed", async () => {
    render(
      <MemoryRouter initialEntries={["/admin/withdrawals?status=APPROVED&review=22"]}>
        <AdminWithdrawalsPage />
        <LocationProbe />
      </MemoryRouter>,
    );

    const dialog = await screen.findByRole("dialog", { name: /withdrawal #22 review/i });
    expect(adminWalletApi.getReview).toHaveBeenCalledWith(22);
    fireEvent.click(within(dialog).getByRole("button", { name: /close review/i }));

    await waitFor(() => {
      expect(screen.getByTestId("location-search")).toHaveTextContent("status=APPROVED");
      expect(screen.getByTestId("location-search")).not.toHaveTextContent("review=");
    });
  });

  it("preserves the open review while filters change and ignores invalid review IDs", async () => {
    const { unmount } = render(
      <MemoryRouter initialEntries={["/admin/withdrawals?status=REQUESTED&review=22"]}>
        <AdminWithdrawalsPage />
        <LocationProbe />
      </MemoryRouter>,
    );

    await screen.findByRole("dialog", { name: /withdrawal #22 review/i });
    fireEvent.click(await screen.findByRole("button", { name: /ready to pay/i }));
    await waitFor(() => {
      const search = screen.getByTestId("location-search").textContent ?? "";
      expect(search).toContain("status=APPROVED");
      expect(search).toContain("review=22");
    });

    unmount();
    vi.mocked(adminWalletApi.getReview).mockClear();
    render(
      <MemoryRouter initialEntries={["/admin/withdrawals?review=22x"]}>
        <AdminWithdrawalsPage />
      </MemoryRouter>,
    );
    await screen.findByRole("heading", { name: /withdrawal operations/i, level: 1 });
    expect(adminWalletApi.getReview).not.toHaveBeenCalled();
  });

  it("previews and confirms a sensitive three-sheet export", async () => {
    render(
      <MemoryRouter initialEntries={["/admin/withdrawals?status=APPROVED&from=2026-07-01"]}>
        <AdminWithdrawalsPage />
      </MemoryRouter>,
    );
    fireEvent.click(await screen.findByRole("button", { name: /export excel/i }));

    expect(await screen.findByText("Payment queue")).toBeInTheDocument();
    expect(screen.getByText("Paid reconciliation")).toBeInTheDocument();
    expect(screen.getByText("Operations archive")).toBeInTheDocument();
    expect(await screen.findByText(/contains full bank account details/i)).toBeInTheDocument();
    expect(adminWalletApi.getExportPreview).toHaveBeenCalledWith(
      expect.objectContaining({ status: "APPROVED", from: "2026-07-01" }),
    );
    const acknowledge = screen.getByRole("checkbox", {
      name: /understand this export contains sensitive data/i,
    });
    fireEvent.click(acknowledge);
    fireEvent.click(screen.getByRole("button", { name: /download workbook/i }));
    await waitFor(() => expect(adminWalletApi.downloadExport).toHaveBeenCalled());
  });
});
