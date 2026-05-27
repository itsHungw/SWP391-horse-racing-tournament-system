import { httpClient } from "./httpClient";
import {
  AdminUserDetail,
  CreateUserAdminRequest,
  UpdateUserProfileAdminRequest,
  PageResponse,
  UserRoleHistoryItem,
} from "../types/adminUser";

export const getAdminUsers = async (
  query = "",
  status = "",
  role = "",
  page = 0,
  size = 10
): Promise<PageResponse<AdminUserDetail>> => {
  const response = await httpClient.get<PageResponse<AdminUserDetail>>("/admin/users", {
    params: {
      query,
      status: status || undefined,
      role: role || undefined,
      page,
      size,
    },
  });
  return response.data;
};

export const getAdminUserDetail = async (id: number): Promise<AdminUserDetail> => {
  const response = await httpClient.get<AdminUserDetail>(`/admin/users/${id}`);
  return response.data;
};

export const getAdminUserRoleHistory = async (id: number): Promise<UserRoleHistoryItem[]> => {
  const response = await httpClient.get<UserRoleHistoryItem[]>(`/admin/users/${id}/history`);
  return response.data;
};

export const createAdminUser = async (data: CreateUserAdminRequest): Promise<AdminUserDetail> => {
  const response = await httpClient.post<AdminUserDetail>("/admin/users", data);
  return response.data;
};

export const updateAdminUserProfile = async (
  id: number,
  data: UpdateUserProfileAdminRequest
): Promise<AdminUserDetail> => {
  const response = await httpClient.put<AdminUserDetail>(`/admin/users/${id}/profile`, data);
  return response.data;
};

export const updateAdminUserRoles = async (
  id: number,
  roleIds: number[],
  reason: string
): Promise<AdminUserDetail> => {
  const response = await httpClient.put<AdminUserDetail>(`/admin/users/${id}/roles`, {
    roleIds,
    reason,
  });
  return response.data;
};

export const deleteAdminUser = async (id: number): Promise<void> => {
  await httpClient.delete(`/admin/users/${id}`);
};
