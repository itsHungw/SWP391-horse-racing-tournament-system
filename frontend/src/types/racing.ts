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
  imageUrl?: string;
  evidenceUrl?: string;
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

export type HorseMultipartPayload = Omit<HorsePayload, "imageUrl" | "evidenceUrl"> & {
  imageFile: File;
  evidenceFile: File;
};

export type HorseDocumentType =
  | "OWNERSHIP_CERTIFICATE"
  | "HEALTH_CERTIFICATE"
  | "COGGINS"
  | "REGISTRATION_CERTIFICATE"
  | "OTHER";

export type HorseDocument = {
  id: number;
  horseId: number;
  horseName?: string;
  documentType: HorseDocumentType;
  referenceNumber: string;
  issueDate: string;
  expiryDate: string;
  issuer: string;
  fileUrl: string;
  notes?: string;
  createdAt?: string;
};

export type HorseDocumentPayload = {
  documentType: HorseDocumentType;
  referenceNumber: string;
  issueDate: string;
  expiryDate: string;
  issuer: string;
  notes?: string;
  documentFile: File;
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

export type RaceStatus =
  | "SCHEDULED"
  | "CHECKING"
  | "READY"
  | "ONGOING"
  | "FINISHED"
  | "RESULT_SUBMITTED"
  | "RESULT_CONFIRMED"
  | "PUBLISHED"
  | "CANCELLED";

export type Race = {
  id: number;
  tournamentId: number;
  tournamentName: string;
  name: string;
  code: string;
  raceDateTime: string;
  distanceMeters: number;
  maxParticipants: number;
  status: RaceStatus | string;
  creatorName?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type RacePayload = {
  tournamentId: number;
  name: string;
  code: string;
  raceDateTime: string;
  distanceMeters: number;
  maxParticipants: number;
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

export type JockeyPoolApplicationStatus = "PENDING" | "APPROVED_FOR_POOL" | "REJECTED" | "WITHDRAWN";

export type JockeyPoolApplication = {
  id: number;
  championshipId: number;
  championshipName: string;
  jockeyId: number;
  jockeyName: string;
  jockeyEmail?: string;
  jockeyAvatarUrl?: string;
  message?: string;
  status: JockeyPoolApplicationStatus;
  reviewedBy?: number;
  reviewedAt?: string;
  rejectionReason?: string;
  createdAt?: string;
  updatedAt?: string;
  withdrawnAt?: string;
};

export type PageResponse<T> = {
  content: T[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
};
