import { httpClient } from "./httpClient";
import { Profile } from "../types/profile";

const USE_MOCK = true;

const mockProfile: Profile = {
  fullName: "Nguyễn Văn A",
  phone: "0987654321",
  address: "Đường số 1, Quận 1, TPHCM",
  avatarUrl: "",
  profileCompleted: false
};

export async function getMyProfile(): Promise<Profile> {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 300));
    return { ...mockProfile };
  }
  const response = await httpClient.get<Profile>("/users/me/profile");
  return response.data;
}

export async function uploadAvatar(file: File): Promise<{ url: string }> {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 800));
    return { url: URL.createObjectURL(file) };
  }
  const formData = new FormData();
  formData.append("file", file);
  const response = await httpClient.post<{ url: string }>("/files/upload?category=AVATAR", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return response.data;
}

export async function updateMyProfile(data: Omit<Profile, "profileCompleted">): Promise<Profile> {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 500));
    mockProfile.fullName = data.fullName;
    mockProfile.phone = data.phone;
    mockProfile.address = data.address;
    if (data.avatarUrl) mockProfile.avatarUrl = data.avatarUrl;
    mockProfile.profileCompleted = true;
    return { ...mockProfile };
  }
  const response = await httpClient.put<Profile>("/users/me/profile", data);
  return response.data;
}
