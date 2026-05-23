import { httpClient } from "./httpClient";
import { RoleRequest, RequestedRole } from "../types/roleRequest";

const USE_MOCK = true;

const mockRequests: RoleRequest[] = [];

export async function getMyRoleRequests(): Promise<RoleRequest[]> {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 300));
    return [...mockRequests];
  }
  const response = await httpClient.get<RoleRequest[]>("/role-requests/my");
  return response.data;
}

export async function submitRoleRequest(requestedRole: RequestedRole, reason: string): Promise<RoleRequest> {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 500));
    const newReq: RoleRequest = {
      id: mockRequests.length + 1,
      userId: 101,
      requestedRole,
      status: "PENDING",
      rejectReason: "",
      createdAt: new Date().toISOString()
    };
    mockRequests.unshift(newReq);
    return newReq;
  }
  const response = await httpClient.post<RoleRequest>("/role-requests", { requestedRole, reason });
  return response.data;
}
