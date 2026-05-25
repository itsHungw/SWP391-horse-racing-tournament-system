import { describe, expect, it, vi } from "vitest";
import { getRoleRequests, approveRequest, passCvReview, rejectRequest } from "./adminRoleRequestApi";
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
    expect(httpClient.get).toHaveBeenCalledWith("/admin/role-requests", {
      params: { status: "PENDING" },
    });
    expect(result).toEqual(mockData);
  });

  it("approveRequest calls the correct endpoint", async () => {
    vi.mocked(httpClient.post).mockResolvedValue({});
    await approveRequest(123);
    expect(httpClient.post).toHaveBeenCalledWith("/admin/role-requests/123/approve");
  });

  it("rejectRequest calls the correct endpoint and payload", async () => {
    vi.mocked(httpClient.post).mockResolvedValue({});
    await rejectRequest(123, "Lý do");
    expect(httpClient.post).toHaveBeenCalledWith("/admin/role-requests/123/reject", {
      reason: "Lý do",
    });
  });

  it("passCvReview calls the correct endpoint and payload", async () => {
    const mockData = { id: 123, cvReviewStatus: "PASSED" };
    vi.mocked(httpClient.post).mockResolvedValue({ data: mockData });

    const result = await passCvReview(123, "CV passed.");

    expect(httpClient.post).toHaveBeenCalledWith("/admin/role-requests/123/pass-cv", {
      cvReviewNote: "CV passed.",
    });
    expect(result).toEqual(mockData);
  });
});
