import { httpClient } from "./httpClient";
import type { Withdrawal, WithdrawalStatus } from "../types/wallet";

export const adminWalletApi = {
  listWithdrawals: async (status?: WithdrawalStatus) => {
    const response = await httpClient.get<Withdrawal[]>("/admin/withdrawals", {
      params: status ? { status } : {},
    });
    return response.data;
  },

  approve: async (id: number) => {
    const response = await httpClient.post<Withdrawal>(`/admin/withdrawals/${id}/approve`);
    return response.data;
  },

  reject: async (id: number, note: string) => {
    const response = await httpClient.post<Withdrawal>(`/admin/withdrawals/${id}/reject`, { note });
    return response.data;
  },

  markPaid: async (id: number) => {
    const response = await httpClient.post<Withdrawal>(`/admin/withdrawals/${id}/mark-paid`);
    return response.data;
  },
};
