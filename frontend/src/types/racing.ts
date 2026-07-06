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
  organizationId?: number;
  organizationName?: string;
  approvedAt?: string;
  rejectionReason?: string;
  totalPrizePool?: number;
};

export type OrganizationStatus = "PENDING" | "ACTIVE" | "SUSPENDED" | "REJECTED";

export type Organization = {
  id: number;
  code: string;
  name: string;
  status: OrganizationStatus;
  licenseNumber?: string;
  contactEmail?: string;
  contactPhone?: string;
  logoUrl?: string;
  evidenceUrl?: string;
  description?: string;
  applicationNote?: string;
  rejectionReason?: string;
  ownerId?: number;
  ownerName?: string;
  approvedById?: number;
  approvedAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type RegisterOrganizationPayload = {
  name: string;
  licenseNumber?: string;
  contactEmail?: string;
  contactPhone?: string;
  description?: string;
  evidenceUrl?: string;
  logoUrl?: string;
  applicationNote: string;
};

export type RefereeContractStatus = "PENDING" | "ACTIVE" | "DECLINED" | "TERMINATED";

export type RefereeContract = {
  id: number;
  tournamentId: number;
  tournamentName?: string;
  refereeId: number;
  refereeName?: string;
  invitedById?: number;
  status: RefereeContractStatus;
  agreementUrl?: string;
  reason?: string;
  createdAt?: string;
  respondedAt?: string;
  terminatedAt?: string;
};

export type InviteRefereePayload = {
  refereeId: number;
  message?: string;
  agreementUrl?: string;
};

export type RefereeDirectoryEntry = {
  refereeId: number;
  fullName: string;
  email: string;
  licenseNumber?: string;
  experienceYears?: number;
  certification?: string;
};

export type TournamentSummary = {
  id: number;
  name: string;
  code?: string;
  description?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  registrationEndAt?: string;
  maxHorses?: number;
  status: string;
  totalPrizePool?: number;
  raceCount: number;
  participantCount: number;
  nextRace?: {
    id: number;
    name: string;
    raceDateTime: string;
    status: string;
  } | null;
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
  refereeId?: number | null;
  refereeName?: string | null;
  creatorName?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type RaceSummary = {
  id: number;
  name: string;
  roundName?: string | null;
  code: string;
  tournamentId: number;
  tournamentName: string;
  raceDateTime: string;
  location?: string;
  distanceMeters: number;
  maxParticipants: number;
  participantCount: number;
  status: RaceStatus | string;
  predictionOpen: boolean;
  predictionCloseTime: string;
  resultOfficial: boolean;
  winner?: {
    horseName: string;
    jockeyName?: string | null;
    finishTimeSeconds?: number | null;
  } | null;
};

export type PublicRaceResult = {
  raceId: number;
  official: boolean;
  publishedAt?: string | null;
  entries: Array<{
    raceParticipantId?: number | null;
    startNumber?: number | null;
    laneNumber?: number | null;
    position?: number | null;
    horseName: string;
    jockeyName?: string | null;
    finishTimeSeconds?: number | null;
    penaltySeconds?: number | null;
    points: number;
    resultStatus: string;
  }>;
};

export type RaceMediaStatus = "DRAFT" | "PUBLISHED";

export type RaceMediaVerificationStatus = "UNVERIFIED" | "VERIFIED" | "FAILED";

export type RaceMediaProvider = "YOUTUBE";

export type RaceMediaPayload = {
  url: string;
  title?: string | null;
};

export type RaceMediaResponse = {
  id: number;
  raceId: number;
  provider: RaceMediaProvider;
  providerVideoId: string;
  sourceUrl: string;
  embedUrl: string;
  title?: string | null;
  providerTitle?: string | null;
  thumbnailUrl?: string | null;
  status: RaceMediaStatus;
  verificationStatus: RaceMediaVerificationStatus;
  providerErrorCode?: string | null;
  message?: string | null;
  canPublish: boolean;
  publishBlockedReason?: string | null;
  lastVerifiedAt?: string | null;
  publishedAt?: string | null;
  publishedByName?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type RaceMediaValidateResponse = {
  provider: RaceMediaProvider;
  providerVideoId: string;
  embedUrl: string;
  providerTitle?: string | null;
  thumbnailUrl?: string | null;
  verificationStatus: RaceMediaVerificationStatus;
  providerErrorCode?: string | null;
  message?: string | null;
};

export type RaceMediaPublicResponse = {
  raceId: number;
  provider: RaceMediaProvider;
  providerVideoId: string;
  embedUrl: string;
  title?: string | null;
  providerTitle?: string | null;
  thumbnailUrl?: string | null;
  publishedAt?: string | null;
};

export type PublicRacingSummary = {
  raceCount: number;
  raceDayCount: number;
  championshipCount: number;
  seasonFinale?: string | null;
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
  totalPrizePool?: number;
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

export type RaceParticipant = {
  id: number;
  raceId: number;
  horseId: number;
  horseName: string;
  ownerId: number;
  ownerName: string;
  jockeyId?: number | null;
  jockeyName?: string | null;
  startNumber?: number | null;
  laneNumber?: number | null;
  confirmationStatus?: string;
  checkStatus?: string;
  status: string;
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

export type OwnerHorseUpdateRequest = {
  name: string;
  breed?: string;
  gender: "MALE" | "FEMALE" | string;
  dateOfBirth?: string;
  color?: string;
  heightCm?: number;
  weightKg?: number;
  healthStatus?: string;
  medicalNote?: string;
  description?: string;
  imageUrl?: string;
  evidenceUrl?: string;
};
