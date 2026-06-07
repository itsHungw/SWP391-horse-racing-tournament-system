import { httpClient } from "./httpClient";
import type { OwnerProfile, UpdateOwnerProfileRequest } from "../types/ownerProfile";

export async function getMyOwnerProfile(): Promise<OwnerProfile | null> {
  try {
    const response = await httpClient.get<OwnerProfile>("/users/me/owner-profile");
    return response.data;
  } catch (error: any) {
    if (error?.response?.status === 404 || error?.response?.status === 500) {
      return null;
    }

    throw error;
  }
}

export async function updateMyOwnerProfile(data: UpdateOwnerProfileRequest): Promise<OwnerProfile> {
  const response = await httpClient.put<OwnerProfile>("/users/me/owner-profile", data);
  return response.data;
}

export async function uploadOwnerEvidence(file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await httpClient.post<{ url: string }>("/files/upload?category=OWNER_EVIDENCE", formData);
  return response.data;
}

export async function uploadStableLogo(file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await httpClient.post<{ url: string }>("/files/upload?category=STABLE_LOGO", formData);
  return response.data;
}
