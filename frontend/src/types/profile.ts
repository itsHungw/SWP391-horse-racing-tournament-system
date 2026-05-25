export interface Profile {
  fullName: string;
  phone: string;
  gender?: string;
  dateOfBirth?: string;
  address: string;
  avatarUrl?: string;
  roles?: string[];
  profileCompleted: boolean;
  phoneVerified: boolean;
  ageVerified: boolean;
}

export interface UpdateProfileRequest {
  fullName: string;
  phone: string;
  gender: string;
  dateOfBirth: string;
  address: string;
  avatarUrl?: string;
}
