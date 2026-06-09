package com.example.horseracingtournamentsystem.dashboard.dto;

import java.util.List;

public record AdminDashboardResponse(
    DashboardMetrics metrics,
    List<DashboardQueueRow> queueRows,
    List<String> alerts
) {
    public record DashboardMetrics(
        long pendingRoleRequests,
        String pendingRoleRequestsDetail,
        long upcomingTournaments,
        String upcomingTournamentsDetail,
        long activeUsers,
        String activeUsersDetail,
        long blogDrafts,
        String blogDraftsDetail
    ) {}

    public record DashboardQueueRow(
        Long id,
        String name,
        String email,
        String role,
        String submitted,
        String status
    ) {}
}
