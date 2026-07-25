import { beforeEach, describe, expect, it, vi } from "vitest";

import { adminFinanceApi } from "./adminFinanceApi";
import { httpClient } from "./httpClient";

vi.mock("./httpClient", () => ({
  httpClient: { get: vi.fn() },
}));

describe("adminFinanceApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends the selected reporting range to the summary endpoint", async () => {
    vi.mocked(httpClient.get).mockResolvedValue({ data: {} });

    await adminFinanceApi.getSummary({ from: "2026-07-01", to: "2026-07-31" });

    expect(httpClient.get).toHaveBeenCalledWith("/admin/finance/summary", {
      params: { from: "2026-07-01", to: "2026-07-31" },
    });
  });

  it("loads reconciliation alert counts for the selected range", async () => {
    vi.mocked(httpClient.get).mockResolvedValue({ data: {} });

    await adminFinanceApi.getReconciliationSummary({ from: "2026-07-01", to: "2026-07-31" });

    expect(httpClient.get).toHaveBeenCalledWith("/admin/finance/reconciliation-summary", {
      params: { from: "2026-07-01", to: "2026-07-31" },
    });
  });

  it("forwards the selected top-up reconciliation issue", async () => {
    vi.mocked(httpClient.get).mockResolvedValue({ data: { content: [] } });

    await adminFinanceApi.listTopUps({
      from: "2026-07-01",
      to: "2026-07-31",
      reconciliationStatus: "MISSING_WALLET_CREDIT",
      query: "",
      page: 0,
      size: 20,
    });

    expect(httpClient.get).toHaveBeenCalledWith("/admin/finance/topups", {
      params: {
        from: "2026-07-01",
        to: "2026-07-31",
        reconciliationStatus: "MISSING_WALLET_CREDIT",
        page: 0,
        size: 20,
      },
    });
  });

  it("sends orphan-credit pagination", async () => {
    vi.mocked(httpClient.get).mockResolvedValue({ data: { content: [], totalElements: 0, totalPages: 0 } });

    await adminFinanceApi.listOrphanTopUpCredits({
      from: "2026-07-01",
      to: "2026-07-31",
      page: 2,
      size: 20,
    });

    expect(httpClient.get).toHaveBeenCalledWith("/admin/finance/topups/orphan-credits", {
      params: { from: "2026-07-01", to: "2026-07-31", page: 2, size: 20 },
    });
  });

  it("keeps active reconciliation filters and removes empty values", async () => {
    vi.mocked(httpClient.get).mockResolvedValue({ data: { content: [] } });

    await adminFinanceApi.listTransactions({
      from: "2026-07-01",
      to: "2026-07-31",
      query: "spectator@example.com",
      type: "BET_PLACED",
      referenceType: "",
      page: 2,
      size: 20,
    });

    expect(httpClient.get).toHaveBeenCalledWith("/admin/finance/transactions", {
      params: {
        from: "2026-07-01",
        to: "2026-07-31",
        query: "spectator@example.com",
        type: "BET_PLACED",
        page: 2,
        size: 20,
      },
    });
  });

  it("downloads a CSV with the same active transaction filters", async () => {
    vi.mocked(httpClient.get).mockResolvedValue({
      data: new Blob(["ledger"]),
      headers: { "content-disposition": "attachment; filename=\"finance-transactions.csv\"" },
    });

    const download = await adminFinanceApi.exportTransactions({
      from: "2026-07-01",
      to: "2026-07-31",
      type: "TOPUP",
      page: 0,
      size: 20,
    });

    expect(httpClient.get).toHaveBeenCalledWith("/admin/finance/transactions/export", {
      params: { from: "2026-07-01", to: "2026-07-31", type: "TOPUP" },
      responseType: "blob",
    });
    expect(download.filename).toBe("finance-transactions.csv");
  });
});
