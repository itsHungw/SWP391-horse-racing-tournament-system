export interface RefereeProfileInfo {
  licenseNumber: string;
  certification: string;
  experienceYears: number;
  bio: string;
  evidenceUrl?: string;
  status: "PENDING" | "ACTIVE" | "REJECTED" | "SUSPENDED" | "INACTIVE";
  approvedAt?: string;
}

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
  refereeProfile?: RefereeProfileInfo;
}

export interface UpdateProfileRequest {
  fullName: string;
  phone: string;
  gender: string;
  dateOfBirth: string;
  address: string;
  avatarUrl?: string;
}

export interface UpdateRefereeProfileRequest {
  licenseNumber?: string;
  certification?: string;
  experienceYears: number;
  bio?: string;
  evidenceUrl?: string;
}
