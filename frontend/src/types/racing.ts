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
  maxHorsesPerOwner?: number;
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

export type JockeyChampionshipApplicationStatus = JockeyPoolApplicationStatus | "NOT_APPLIED";

export type JockeyChampionship = {
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
  maxHorsesPerOwner?: number;
  status: string;
  applicationStatus: JockeyChampionshipApplicationStatus;
  applicationId?: number;
  applicationMessage?: string;
  rejectionReason?: string;
  applicationCreatedAt?: string;
  reviewedAt?: string;
  approvedPoolCount: number;
  applicationWindowOpen: boolean;
  canApply: boolean;
};

export type JockeyInvitationStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "EXPIRED";

export type JockeyInvitation = {
  id: number;
  championshipId: number;
  championshipName: string;
  horseRegistrationId: number;
  horseId: number;
  horseName: string;
  ownerId: number;
  ownerName: string;
  jockeyId: number;
  jockeyName: string;
  jockeyApplicationId: number;
  message?: string;
  agreementUrl?: string;
  agreementFileName?: string;
  status: JockeyInvitationStatus;
  readAt?: string;
  acceptedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type OwnerContractPayload = {
  horseRegistrationId: number;
  jockeyApplicationId: number;
  message?: string;
  agreementUrl?: string;
  agreementFileName?: string;
};

export type LockParticipantsResponse = {
  championshipId: number;
  createdParticipants: number;
};

export type TournamentParticipant = {
  id: number;
  championshipId: number;
  championshipName: string;
  horseRegistrationId: number;
  horseId: number;
  horseName: string;
  ownerId: number;
  ownerName: string;
  jockeyId: number;
  jockeyName: string;
  jockeyInvitationId?: number;
  status: "ACTIVE" | "WITHDRAWN" | "DISQUALIFIED" | string;
  points: number;
  createdAt?: string;
  updatedAt?: string;
};

export type JockeyScheduleItem = {
  raceParticipantId: number;
  raceId: number;
  raceName: string;
  raceCode?: string;
  raceAt: string;
  distanceMeters: number;
  raceStatus: RaceStatus | string;
  championshipId: number;
  championshipName: string;
  championshipStatus: string;
  horseId: number;
  horseName: string;
  ownerId: number;
  ownerName: string;
  startNumber?: number;
  laneNumber?: number;
  confirmationStatus: string;
  checkStatus: string;
  participantStatus: string;
};

export type PageResponse<T> = {
  content: T[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
};
