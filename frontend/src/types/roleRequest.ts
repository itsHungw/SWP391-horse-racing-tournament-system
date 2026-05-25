export type RoleRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
export type CvReviewStatus = 'NOT_REVIEWED' | 'PASSED';

export type RequestedRole = 'HORSE_OWNER' | 'JOCKEY' | 'REFEREE';

export interface RoleRequest {
  id: number;
  userId: number;
  userEmail?: string;
  requestedRole: RequestedRole;
  status: RoleRequestStatus;
  cvReviewStatus?: CvReviewStatus;
  reason?: string;
  rejectReason?: string;
  resumeUrl?: string;
  createdAt: string;
  updatedAt?: string;
}
