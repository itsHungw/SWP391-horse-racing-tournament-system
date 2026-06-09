package com.example.horseracingtournamentsystem.dashboard.service;

import com.example.horseracingtournamentsystem.blog.entity.BlogStatus;
import com.example.horseracingtournamentsystem.blog.repository.BlogRepository;
import com.example.horseracingtournamentsystem.dashboard.dto.AdminDashboardResponse;
import com.example.horseracingtournamentsystem.dashboard.dto.AdminDashboardResponse.DashboardMetrics;
import com.example.horseracingtournamentsystem.dashboard.dto.AdminDashboardResponse.DashboardQueueRow;
import com.example.horseracingtournamentsystem.tournament.repository.TournamentRepository;
import com.example.horseracingtournamentsystem.user.entity.RoleRequest;
import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.user.repository.RoleRequestRepository;
import com.example.horseracingtournamentsystem.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminDashboardService {

    private final RoleRequestRepository roleRequestRepository;
    private final TournamentRepository tournamentRepository;
    private final UserRepository userRepository;
    private final BlogRepository blogRepository;

    @Transactional(readOnly = true)
    public AdminDashboardResponse getDashboardData() {
        long pendingRoleRequests = roleRequestRepository.countByStatus(RoleRequest.STATUS_PENDING);
        long upcomingTournaments = tournamentRepository.countByStatusInAndDeletedAtIsNull(List.of("DRAFT", "OPEN_REGISTRATION", "SCHEDULE_PUBLISHED", "PARTICIPANTS_LOCKED"));
        long activeUsers = userRepository.countByStatusAndDeletedAtIsNull(User.STATUS_ACTIVE);
        long blogDrafts = blogRepository.countByStatus(BlogStatus.DRAFT);

        DashboardMetrics metrics = new DashboardMetrics(
                pendingRoleRequests,
                "Requires attention",
                upcomingTournaments,
                "Awaiting race days",
                activeUsers,
                "Active platform users",
                blogDrafts,
                "Awaiting review"
        );

        List<RoleRequest> topPending = roleRequestRepository.findTop5ByStatusOrderByCreatedAtDesc(RoleRequest.STATUS_PENDING);
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM dd, yyyy");
        List<DashboardQueueRow> queueRows = topPending.stream().map(req -> new DashboardQueueRow(
                req.getId(),
                req.getUser().getFullName(),
                req.getUser().getEmail(),
                req.getRequestedRole(),
                req.getCreatedAt().format(formatter),
                "Needs review"
        )).toList();

        List<String> alerts = new ArrayList<>();
        if (pendingRoleRequests > 5) {
            alerts.add("High volume of pending role requests (" + pendingRoleRequests + "). Please review soon.");
        }
        if (blogDrafts > 10) {
            alerts.add("Many blog drafts (" + blogDrafts + ") are waiting to be published.");
        }
        if (upcomingTournaments == 0) {
            alerts.add("No upcoming tournaments found. Consider creating a new one.");
        }

        return new AdminDashboardResponse(metrics, queueRows, alerts);
    }
}
