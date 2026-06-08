import { httpClient } from "./httpClient";
import { Profile, RefereeProfileInfo, UpdateProfileRequest, UpdateRefereeProfileRequest } from "../types/profile";

const USE_MOCK = false;

const mockProfile: Profile = {
  fullName: "Nguyen Van A",
  phone: "0987654321",
  gender: "MALE",
  dateOfBirth: "2000-01-02",
  address: "District 1, Ho Chi Minh City",
  avatarUrl: "",
  roles: ["SPECTATOR"],
  profileCompleted: false,
  phoneVerified: false,
  ageVerified: true,
};

export async function getMyProfile(): Promise<Profile> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return { ...mockProfile };
  }

  const response = await httpClient.get<Profile>("/users/me/profile");
  return response.data;
}

export async function uploadAvatar(file: File): Promise<{ url: string }> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 800));
    return { url: URL.createObjectURL(file) };
  }

  const formData = new FormData();
  formData.append("file", file);

  const response = await httpClient.post<{ url: string }>("/files/upload?category=AVATAR", formData);
  return response.data;
}

export async function uploadRefereeEvidence(file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await httpClient.post<{ url: string }>("/files/upload?category=REFEREE_EVIDENCE", formData);
  return response.data;
}

export async function updateMyProfile(data: UpdateProfileRequest): Promise<Profile> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    mockProfile.fullName = data.fullName;
    mockProfile.phone = data.phone;
    mockProfile.gender = data.gender;
    mockProfile.dateOfBirth = data.dateOfBirth;
    mockProfile.address = data.address;
    if (data.avatarUrl) {
      mockProfile.avatarUrl = data.avatarUrl;
    }
    mockProfile.profileCompleted = true;
    return { ...mockProfile };
  }

  const response = await httpClient.put<Profile>("/users/me/profile", data);
  return response.data;
}

export async function updateMyRefereeProfile(data: UpdateRefereeProfileRequest): Promise<RefereeProfileInfo> {
  const response = await httpClient.put<RefereeProfileInfo>("/users/me/referee-profile", data);
  return response.data;
}
