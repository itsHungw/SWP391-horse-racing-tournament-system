import { afterEach, describe, expect, it, vi } from "vitest";

import { httpClient } from "./httpClient";
import { updateAdminUserRoles } from "./adminUserApi";

vi.mock("./httpClient", () => ({
  httpClient: {
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
});
