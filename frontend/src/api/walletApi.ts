import { httpClient } from "./httpClient";
import type { Wallet, WalletTransaction, Withdrawal } from "../types/wallet";

export const walletApi = {
  getMyWallet: async () => {
    const response = await httpClient.get<Wallet>("/wallet/me");
    return response.data;
  },

  getMyTransactions: async () => {
    const response = await httpClient.get<WalletTransaction[]>("/wallet/me/transactions");
    return response.data;
  },

  createTopUp: async (amount: number) => {
    const response = await httpClient.post<{ paymentUrl: string }>("/wallet/topup", { amount });
    return response.data;
  },

  getMyWithdrawals: async () => {
    const response = await httpClient.get<Withdrawal[]>("/wallet/withdrawals");
    return response.data;
  },

  createWithdrawal: async (amount: number, bankInfo: string) => {
    const response = await httpClient.post<Withdrawal>("/wallet/withdrawals", { amount, bankInfo });
    return response.data;
  },
};
