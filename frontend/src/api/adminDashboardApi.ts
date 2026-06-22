import { httpClient } from "./httpClient";

export type DashboardMetrics = {
  pendingRoleRequests: number;
  pendingRoleRequestsDetail: string;
  upcomingTournaments: number;
  upcomingTournamentsDetail: string;
  activeUsers: number;
  activeUsersDetail: string;
  blogDrafts: number;
  blogDraftsDetail: string;
};

export type DashboardQueueRow = {
  id: number;
  name: string;
  email: string;
  role: string;
  submitted: string;
  status: string;
};

export type AdminDashboardResponse = {
  metrics: DashboardMetrics;
  queueRows: DashboardQueueRow[];
  alerts: string[];
};

export const adminDashboardApi = {
  getDashboardData: async (): Promise<AdminDashboardResponse> => {
    const response = await httpClient.get<AdminDashboardResponse>("/admin/dashboard");
    return response.data;
  },
};
