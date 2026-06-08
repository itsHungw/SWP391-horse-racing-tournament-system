import { httpClient } from "./httpClient";
import { RoleRequest, RequestedRole } from "../types/roleRequest";

export async function getMyRoleRequests(): Promise<RoleRequest[]> {
  const response = await httpClient.get<RoleRequest[]>("/role-requests/my");
  return response.data;
}

export async function submitRoleRequest(
  requestedRole: RequestedRole,
  reason: string,
  resumeUrl: string,
): Promise<RoleRequest> {
  const response = await httpClient.post<RoleRequest>("/role-requests", { requestedRole, reason, resumeUrl });
  return response.data;
}

export async function uploadResumeDocument(file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await httpClient.post<{ url: string }>("/files/upload?category=ROLE_REQUEST_RESUME", formData);
  return response.data;
}
