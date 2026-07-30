import { httpClient } from "./httpClient";
import type {
  BankAccount,
  BankDirectoryItem,
  TopUpReceipt,
  Wallet,
  WalletSummary,
  WalletTransaction,
  WalletTransactionDetail,
  Withdrawal,
} from "../types/wallet";

export const walletApi = {
  getMyWallet: async () => {
    const response = await httpClient.get<Wallet>("/wallet/me");
    return response.data;
  },

  getMyTransactions: async () => {
    const response = await httpClient.get<WalletTransaction[]>("/wallet/me/transactions");
    return response.data;
  },

  getTransactionDetail: async (id: number) => {
    const response = await httpClient.get<WalletTransactionDetail>(`/wallet/me/transactions/${id}`);
    return response.data;
  },

  createTopUp: async (amount: number) => {
    const response = await httpClient.post<{ paymentUrl: string }>("/wallet/topup", { amount });
    return response.data;
  },

  getTopUpReceipt: async (txnRef: string) =>
    (await httpClient.get<TopUpReceipt>(`/wallet/topups/${encodeURIComponent(txnRef)}/receipt`)).data,

  getSummary: async () => {
    const response = await httpClient.get<WalletSummary>("/wallet/me/summary");
    return response.data;
  },

  getMyWithdrawals: async () => {
    const response = await httpClient.get<Withdrawal[]>("/wallet/withdrawals");
    return response.data;
  },

  createWithdrawal: async (amount: number, bankAccountId: number) => {
    const response = await httpClient.post<Withdrawal>("/wallet/withdrawals", { amount, bankAccountId });
    return response.data;
  },

  cancelWithdrawal: async (id: number) => {
    const response = await httpClient.post<Withdrawal>(`/wallet/withdrawals/${id}/cancel`);
    return response.data;
  },

  getBankAccounts: async () => {
    const response = await httpClient.get<BankAccount[]>("/wallet/bank-accounts");
    return response.data;
  },

  getBankDirectory: async () => {
    const response = await httpClient.get<BankDirectoryItem[]>("/wallet/bank-accounts/directory");
    return response.data;
  },

  addBankAccount: async (data: {
    bankCode: string;
    accountNumber: string;
    accountHolder: string;
    label?: string | null;
  }) => {
    const response = await httpClient.post<BankAccount>("/wallet/bank-accounts", data);
    return response.data;
  },

  deleteBankAccount: async (id: number) => {
    await httpClient.delete(`/wallet/bank-accounts/${id}`);
  },
};
