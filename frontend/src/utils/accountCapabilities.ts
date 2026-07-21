import type { AccountStatus } from "../types/auth";

export function accountCapabilities(status: AccountStatus) {
  return {
    canOpenWorkspace: status !== "BANNED",
    canMutateBusinessData: status === "ACTIVE",
    canTopUp: status === "ACTIVE",
    canWithdraw: true,
    canViewRestriction: status !== "ACTIVE",
  };
}
