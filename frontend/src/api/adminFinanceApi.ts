import type {
  AdminFinanceReconciliationSummary,
  AdminFinanceSummary,
  AdminFinanceTransaction,
  AdminTopUpReconciliation,
  FinanceExportDownload,
  FinanceRange,
  FinanceTopUpFilters,
  FinanceTransactionFilters,
  PageResponse,
} from "../types/adminFinance";
import { httpClient } from "./httpClient";

function compactParams<T extends object>(values: T) {
  return Object.fromEntries(
    Object.entries(values).filter(([, value]) => value !== undefined && value !== null && value !== ""),
  );
}

function exportFilename(value: unknown) {
  if (typeof value !== "string") return "finance-transactions.csv";
  return value.match(/filename="?([^";]+)"?/i)?.[1] ?? "finance-transactions.csv";
}

export const adminFinanceApi = {
  getSummary: async (range: FinanceRange) =>
    (await httpClient.get<AdminFinanceSummary>("/admin/finance/summary", { params: compactParams(range) })).data,

  getReconciliationSummary: async (range: FinanceRange) =>
    (
      await httpClient.get<AdminFinanceReconciliationSummary>("/admin/finance/reconciliation-summary", {
        params: compactParams(range),
      })
    ).data,

  listTransactions: async (filters: FinanceTransactionFilters) =>
    (
      await httpClient.get<PageResponse<AdminFinanceTransaction>>("/admin/finance/transactions", {
        params: compactParams(filters),
      })
    ).data,

  getTransaction: async (id: number) =>
    (await httpClient.get<AdminFinanceTransaction>(`/admin/finance/transactions/${id}`)).data,

  listTopUps: async (filters: FinanceTopUpFilters) =>
    (
      await httpClient.get<PageResponse<AdminTopUpReconciliation>>("/admin/finance/topups", {
        params: compactParams(filters),
      })
    ).data,

  listOrphanTopUpCredits: async (range: FinanceRange) =>
    (
      await httpClient.get<PageResponse<AdminFinanceTransaction>>("/admin/finance/topups/orphan-credits", {
        params: compactParams({ ...range, page: 0, size: 20 }),
      })
    ).data,

  exportTransactions: async (filters: FinanceTransactionFilters): Promise<FinanceExportDownload> => {
    const { page: _page, size: _size, ...exportFilters } = filters;
    const response = await httpClient.get<Blob>("/admin/finance/transactions/export", {
      params: compactParams(exportFilters),
      responseType: "blob",
    });
    return {
      blob: response.data,
      filename: exportFilename(response.headers["content-disposition"]),
    };
  },
};
