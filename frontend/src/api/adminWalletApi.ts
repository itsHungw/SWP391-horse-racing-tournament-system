import { httpClient } from "./httpClient";
import type {
  AdminWithdrawalReview,
  AdminWithdrawalRow,
  AdminWithdrawalSummary,
  ApproveWithdrawalBody,
  ConfirmWithdrawalPayment,
  PageResponse,
  RejectWithdrawalBody,
  WithdrawalAdminFilters,
  WithdrawalExportDownload,
  WithdrawalExportFilters,
  WithdrawalExportPreview,
} from "../types/wallet";

const FALLBACK_EXPORT_NAME = "withdrawals.xlsx";
const SAFE_XLSX_NAME = /^[A-Za-z0-9][A-Za-z0-9._-]{0,119}\.xlsx$/i;

function compactParams(filters: WithdrawalAdminFilters | WithdrawalExportFilters) {
  return Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== undefined && value !== ""),
  );
}

function safeDownloadName(contentDisposition?: string) {
  const candidate = contentDisposition?.match(/filename="?([^";]+)"?/i)?.[1]?.trim();
  return candidate && SAFE_XLSX_NAME.test(candidate) ? candidate : FALLBACK_EXPORT_NAME;
}

export const adminWalletApi = {
  listWithdrawals: async (filters: WithdrawalAdminFilters) =>
    (
      await httpClient.get<PageResponse<AdminWithdrawalRow>>("/admin/withdrawals", {
        params: compactParams(filters),
      })
    ).data,

  getSummary: async () =>
    (await httpClient.get<AdminWithdrawalSummary>("/admin/withdrawals/summary")).data,

  getReview: async (id: number) =>
    (await httpClient.get<AdminWithdrawalReview>(`/admin/withdrawals/${id}`)).data,

  approve: async (id: number, body: ApproveWithdrawalBody) =>
    (await httpClient.post<AdminWithdrawalReview>(`/admin/withdrawals/${id}/approve`, body)).data,

  reject: async (id: number, body: RejectWithdrawalBody) =>
    (await httpClient.post<AdminWithdrawalReview>(`/admin/withdrawals/${id}/reject`, body)).data,

  markPaid: async (id: number, body: ConfirmWithdrawalPayment) => {
    const data = new FormData();
    data.append("transferReference", body.transferReference);
    data.append("internalNote", body.internalNote);
    data.append("mismatchAcknowledged", String(body.mismatchAcknowledged));
    data.append("idempotencyKey", body.idempotencyKey);
    data.append("receipt", body.receipt);
    return (await httpClient.post<AdminWithdrawalReview>(
      `/admin/withdrawals/${id}/mark-paid`,
      data,
    )).data;
  },

  getExportPreview: async (filters: WithdrawalExportFilters) =>
    (
      await httpClient.get<WithdrawalExportPreview>("/admin/withdrawals/export/preview", {
        params: compactParams(filters),
      })
    ).data,

  downloadExport: async (filters: WithdrawalExportFilters): Promise<WithdrawalExportDownload> => {
    const response = await httpClient.get<Blob>("/admin/withdrawals/export", {
      params: compactParams(filters),
      responseType: "blob",
    });
    return {
      blob: response.data,
      filename: safeDownloadName(response.headers["content-disposition"]),
    };
  },
};
