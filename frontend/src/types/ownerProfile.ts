export type OwnerProfileStatus = "NOT_SUBMITTED" | "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";

export interface OwnerProfile {
  stableName?: string;
  organizationName?: string;
  ownerName?: string;
  description?: string;
  contactPhone?: string;
  contactEmail?: string;
  contactAddress?: string;
  licenseNumber?: string;
  experienceYears?: number;
  bio?: string;
  evidenceUrl?: string;
  logoUrl?: string;
  status: OwnerProfileStatus;
  rejectionReason?: string;
  approvedBy?: number;
  approvedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateOwnerProfileRequest {
  stableName: string;
  ownerName: string;
  description?: string;
  contactPhone: string;
  contactEmail: string;
  contactAddress: string;
  logoUrl?: string;
}
