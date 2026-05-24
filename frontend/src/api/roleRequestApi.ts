import { httpClient } from "./httpClient";
import { RoleRequest, RequestedRole } from "../types/roleRequest";

export async function getMyRoleRequests(): Promise<RoleRequest[]> {
  const response = await httpClient.get<RoleRequest[]>("/role-requests/my");
  return response.data;
}

export async function submitRoleRequest(requestedRole: RequestedRole, reason: string): Promise<RoleRequest> {
  const response = await httpClient.post<RoleRequest>("/role-requests", { requestedRole, reason });
  return response.data;
}
