import { afterEach, describe, expect, it, vi } from "vitest";

import { httpClient } from "./httpClient";
import {
  creditAdminUserWallet,
  getAdminUserWalletTransactions,
  updateAdminUserRoles,
} from "./adminUserApi";

vi.mock("./httpClient", () => ({
  httpClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

describe("adminUserApi", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("updates roles by stable role name instead of database ids", async () => {
    vi.mocked(httpClient.put).mockResolvedValueOnce({ data: { id: 7, roles: ["SPECTATOR", "JOCKEY"] } });

    await updateAdminUserRoles(7, ["SPECTATOR", "JOCKEY"], "Approved request.");

    expect(httpClient.put).toHaveBeenCalledWith("/admin/users/7/roles", {
      roleNames: ["SPECTATOR", "JOCKEY"],
      reason: "Approved request.",
    });
  });

  it("credits a user wallet with an audited reason", async () => {
    vi.mocked(httpClient.post).mockResolvedValueOnce({
      data: { amount: 250000, balanceBefore: 100000, balanceAfter: 350000 },
    });

    await creditAdminUserWallet(7, 250000, "VNPay callback failed");

    expect(httpClient.post).toHaveBeenCalledWith("/admin/users/7/wallet/credit", {
      amount: 250000,
      reason: "VNPay callback failed",
    });
  });

  it("loads a paginated complete wallet ledger", async () => {
    vi.mocked(httpClient.get).mockResolvedValueOnce({
      data: { content: [], totalPages: 0, totalElements: 0, size: 20, number: 1 },
    });

    await getAdminUserWalletTransactions(7, 1, 20);

    expect(httpClient.get).toHaveBeenCalledWith("/admin/users/7/wallet-transactions", {
      params: { page: 1, size: 20 },
    });
  });
});
