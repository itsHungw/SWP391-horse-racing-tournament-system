import { httpClient } from "./httpClient";
import type { AccountStatus } from "../types/auth";

export type AccountRestriction = {
  accountStatus: AccountStatus;
  publicReason: string | null;
  effectiveAt: string | null;
  walletStatus: "ACTIVE" | "LOCKED";
};

export async function getAccountRestriction() {
  return (await httpClient.get<AccountRestriction>("/me/account-restriction")).data;
}
