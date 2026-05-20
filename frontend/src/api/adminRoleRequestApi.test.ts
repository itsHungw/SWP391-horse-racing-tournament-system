import { describe, expect, it, vi } from "vitest";
import { getRoleRequests, approveRequest, rejectRequest } from "./adminRoleRequestApi";
import { httpClient } from "./httpClient";

vi.mock("./httpClient", () => ({
  httpClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe("adminRoleRequestApi", () => {
  it("getRoleRequests fetches requests list with status query parameter", async () => {
    const mockData = [{ id: 1, fullName: "Minh Quan", status: "PENDING" }];
    vi.mocked(httpClient.get).mockResolvedValue({ data: mockData });

    const result = await getRoleRequests("PENDING");
    expect(httpClient.get).toHaveBeenCalledWith("/api/admin/role-requests", {
      params: { status: "PENDING" },
    });
    expect(result).toEqual(mockData);
  });

  it("approveRequest calls the correct endpoint", async () => {
    vi.mocked(httpClient.post).mockResolvedValue({});
    await approveRequest(123);
    expect(httpClient.post).toHaveBeenCalledWith("/api/admin/role-requests/123/approve");
  });

  it("rejectRequest calls the correct endpoint and payload", async () => {
    vi.mocked(httpClient.post).mockResolvedValue({});
    await rejectRequest(123, "Lý do");
    expect(httpClient.post).toHaveBeenCalledWith("/api/admin/role-requests/123/reject", {
      reason: "Lý do",
    });
  });
});
