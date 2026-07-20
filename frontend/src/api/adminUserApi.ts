import { httpClient } from "./httpClient";
import {
  AdminUserDetail,
  CreateUserAdminRequest,
  UpdateUserProfileAdminRequest,
  PageResponse,
  UserRoleHistoryItem,
  AccountStatusHistoryItem,
  AccountEnforcementAction,
  AccountTransitionRequest,
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
  roleNames: string[],
  reason: string
): Promise<AdminUserDetail> => {
  const response = await httpClient.put<AdminUserDetail>(`/admin/users/${id}/roles`, {
    roleNames,
    reason,
  });
  return response.data;
};

export const enforceAdminUserAccount = async (
  id: number,
  action: AccountEnforcementAction,
  data: AccountTransitionRequest,
): Promise<AdminUserDetail> =>
  (await httpClient.post<AdminUserDetail>(`/admin/users/${id}/${action}`, data)).data;

export const getAdminUserStatusHistory = async (id: number): Promise<AccountStatusHistoryItem[]> =>
  (await httpClient.get<AccountStatusHistoryItem[]>(`/admin/users/${id}/status-history`)).data;
