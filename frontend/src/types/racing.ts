export type HorseStatus = "PENDING" | "APPROVED" | "REJECTED" | "INACTIVE" | "SUSPENDED";

export type Horse = {
  id: number;
  ownerId?: number;
  ownerName?: string;
  name: string;
  registrationCode?: string;
  breed?: string;
  gender: "MALE" | "FEMALE" | string;
  dateOfBirth?: string;
  color?: string;
  heightCm?: number;
  weightKg?: number;
  healthStatus?: string;
  imageUrl?: string;
  evidenceUrl?: string;
  medicalNote?: string;
  description?: string;
  status: HorseStatus;
  rejectionReason?: string;
  approvedAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type HorsePayload = {
  name: string;
  gender: "MALE" | "FEMALE" | "";
  imageUrl: string;
  evidenceUrl: string;
  registrationCode?: string;
  breed?: string;
  dateOfBirth?: string;
  color?: string;
  heightCm?: number;
  weightKg?: number;
  healthStatus?: string;
  medicalNote?: string;
  description?: string;
};

export type Tournament = {
  id: number;
  name: string;
  code?: string;
  description?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  registrationStartAt?: string;
  registrationEndAt?: string;
  maxHorses?: number;
  status: string;
};

export type TournamentRegistrationStatus = "PENDING" | "APPROVED" | "REJECTED" | "WITHDRAWN";

export type TournamentRegistration = {
  id: number;
  tournamentId: number;
  tournamentName: string;
  horseId: number;
  horseName: string;
  horseImageUrl?: string;
  horseEvidenceUrl?: string;
  ownerId?: number;
  ownerName?: string;
  note?: string;
  status: TournamentRegistrationStatus;
  rejectionReason?: string;
  createdAt?: string;
  reviewedAt?: string;
};

export type TournamentRegistrationPayload = {
  tournamentId: number;
  horseId: number;
  note?: string;
};
