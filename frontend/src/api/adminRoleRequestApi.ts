import { httpClient } from "./httpClient";
import { RoleRequest } from "../types/adminRoleRequest";

export const getRoleRequests = async (status?: string): Promise<RoleRequest[]> => {
  const response = await httpClient.get<RoleRequest[]>("/admin/role-requests", {
    params: status ? { status } : {},
  });
  return response.data;
};

export const approveRequest = async (id: number): Promise<void> => {
  await httpClient.post(`/admin/role-requests/${id}/approve`);
};

export const rejectRequest = async (id: number, reason: string): Promise<void> => {
  await httpClient.post(`/admin/role-requests/${id}/reject`, { reason });
};
