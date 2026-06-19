package com.example.horseracingtournamentsystem.championship;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.horseracingtournamentsystem.blog.repository.BlogRepository;
import com.example.horseracingtournamentsystem.blog.repository.UserBlogRewardRepository;
import com.example.horseracingtournamentsystem.blog.repository.UserDailyPointLimitRepository;
import com.example.horseracingtournamentsystem.championship.entity.JockeyTournamentApplication;
import com.example.horseracingtournamentsystem.championship.repository.JockeyTournamentApplicationRepository;
import com.example.horseracingtournamentsystem.point.repository.PointTransactionRepository;
import com.example.horseracingtournamentsystem.point.repository.UserPointAccountRepository;
import com.example.horseracingtournamentsystem.race.entity.Race;
import com.example.horseracingtournamentsystem.race.enums.RaceStatus;
import com.example.horseracingtournamentsystem.race.repository.RaceRepository;
import com.example.horseracingtournamentsystem.security.JwtService;
import com.example.horseracingtournamentsystem.tournament.entity.Tournament;
import com.example.horseracingtournamentsystem.tournament.repository.TournamentRepository;
import com.example.horseracingtournamentsystem.user.entity.Role;
import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.user.entity.UserRole;
import com.example.horseracingtournamentsystem.user.repository.RoleRepository;
import com.example.horseracingtournamentsystem.user.repository.UserRepository;
import com.example.horseracingtournamentsystem.user.repository.UserRoleRepository;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Set;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AdminChampionshipWorkspaceIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private RaceRepository raceRepository;

    @Autowired
    private JockeyTournamentApplicationRepository jockeyApplicationRepository;

    @Autowired
    private TournamentRepository tournamentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRoleRepository userRoleRepository;

    @Autowired
    private BlogRepository blogRepository;

    @Autowired
    private UserBlogRewardRepository userBlogRewardRepository;

    @Autowired
    private UserDailyPointLimitRepository userDailyPointLimitRepository;

    @Autowired
    private PointTransactionRepository pointTransactionRepository;

    @Autowired
    private UserPointAccountRepository userPointAccountRepository;

    private String adminToken;
    private User adminUser;

    @BeforeEach
    void setUp() {
        jockeyApplicationRepository.deleteAll();
        raceRepository.deleteAll();
        tournamentRepository.deleteAll();
        userRoleRepository.deleteAll();
        userBlogRewardRepository.deleteAll();
        userDailyPointLimitRepository.deleteAll();
        blogRepository.deleteAll();
        pointTransactionRepository.deleteAll();
        userPointAccountRepository.deleteAll();
        roleRepository.deleteAll();
        userRepository.deleteAll();

        Role adminRole = roleRepository.save(Role.of("ADMIN", "Admin"));

        adminUser = User.pending("Admin User", "admin@example.com", "hash");
        adminUser.verifyEmail();
        adminUser = userRepository.save(adminUser);
        userRoleRepository.save(UserRole.active(adminUser, adminRole, adminUser));

        adminToken = jwtService.generateToken(adminUser.getEmail(), Set.of("ADMIN"));
    }

    @Test
    void adminCanOpenChampionshipWorkspace() throws Exception {
        Tournament tournament = Tournament.create(
                "Summer Championship 2026", "SUMMER_2026", "Season championship", "Belmont Park",
                LocalDate.of(2026, 6, 1), LocalDate.of(2026, 8, 20),
                LocalDateTime.of(2026, 5, 1, 9, 0), LocalDateTime.of(2026, 5, 25, 18, 0),
                20, adminUser
        );
        tournament.startOngoing();
        tournament = tournamentRepository.save(tournament);

        Race publishedRound = Race.create(
                tournament, "Round 1 - Opening Sprint", "SUM_R1", LocalDateTime.of(2026, 6, 6, 11, 0),
                1600, 12, adminUser
        );
        publishedRound.updateStatus(RaceStatus.PUBLISHED);
        raceRepository.save(publishedRound);

        Race currentRound = raceRepository.save(Race.create(
                tournament, "Round 2 - Belmont Stakes", "SUM_R2", LocalDateTime.of(2026, 6, 13, 11, 0),
                1800, 12, adminUser
        ));

        raceRepository.save(Race.create(
                tournament, "Round 3 - Final Cup", "SUM_R3", LocalDateTime.of(2026, 6, 20, 11, 0),
                2000, 12, adminUser
        ));

        mockMvc.perform(get("/api/v1/admin/championships/{id}/workspace", tournament.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(tournament.getId()))
                .andExpect(jsonPath("$.name").value("Summer Championship 2026"))
                .andExpect(jsonPath("$.status").value("ONGOING"))
                .andExpect(jsonPath("$.phase").value("ONGOING"))
                .andExpect(jsonPath("$.phaseLabel").value("Racing"))
                .andExpect(jsonPath("$.currentRound.id").value(currentRound.getId()))
                .andExpect(jsonPath("$.currentRound.name").value("Round 2 - Belmont Stakes"))
                .andExpect(jsonPath("$.currentRound.status").value("SCHEDULED"))
                .andExpect(jsonPath("$.currentRound.isOfficial").value(true))
                .andExpect(jsonPath("$.nextAction.code").value("START_CHECKS"))
                .andExpect(jsonPath("$.nextAction.label").value("Start Operational Checks"))
                .andExpect(jsonPath("$.nextAction.target").value("ROUND_CONTROL_CENTER"))
                .andExpect(jsonPath("$.nextAction.roundId").value(currentRound.getId()))
                .andExpect(jsonPath("$.counts.pendingRegistrations").value(0))
                .andExpect(jsonPath("$.counts.approvedRegistrations").value(0))
                .andExpect(jsonPath("$.counts.participants").value(0))
                .andExpect(jsonPath("$.counts.rounds").value(3))
                .andExpect(jsonPath("$.counts.publishedRounds").value(1))
                .andExpect(jsonPath("$.readiness.hasRounds").value(true))
                .andExpect(jsonPath("$.readiness.registrationsClosed").value(true))
                .andExpect(jsonPath("$.readiness.participantsLocked").value(true))
                .andExpect(jsonPath("$.readiness.standingsReady").value(true));
    }

    @Test
    void workspaceCountsHorseAndJockeyApplications() throws Exception {
        Role jockeyRole = roleRepository.save(Role.of("JOCKEY", "Jockey"));
        User firstJockey = saveActiveUser("First Jockey", "first-jockey@example.com");
        User secondJockey = saveActiveUser("Second Jockey", "second-jockey@example.com");
        userRoleRepository.save(UserRole.active(firstJockey, jockeyRole, adminUser));
        userRoleRepository.save(UserRole.active(secondJockey, jockeyRole, adminUser));

        Tournament tournament = Tournament.create(
                "Spring Cup 2026", "SPRING_APPS_2026", "Applications championship", "Saigon Track",
                LocalDate.of(2026, 3, 1), LocalDate.of(2026, 5, 30),
                LocalDateTime.of(2026, 2, 1, 9, 0), LocalDateTime.of(2026, 2, 20, 18, 0),
                20, adminUser
        );
        tournament.openRegistration();
        tournament = tournamentRepository.save(tournament);

        jockeyApplicationRepository.save(JockeyTournamentApplication.pending(tournament, firstJockey, "Ready."));
        JockeyTournamentApplication approved = JockeyTournamentApplication.pending(tournament, secondJockey, "Full season.");
        approved.approve(adminUser);
        jockeyApplicationRepository.save(approved);

        mockMvc.perform(get("/api/v1/admin/championships/{id}/workspace", tournament.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.counts.pendingRegistrations").value(0))
                .andExpect(jsonPath("$.counts.approvedRegistrations").value(0))
                .andExpect(jsonPath("$.counts.pendingJockeyApplications").value(1))
                .andExpect(jsonPath("$.counts.approvedJockeyPool").value(1))
                .andExpect(jsonPath("$.nextAction.code").value("REVIEW_APPLICATIONS"))
                .andExpect(jsonPath("$.nextAction.label").value("Review Applications"))
                .andExpect(jsonPath("$.nextAction.target").value("APPLICATIONS"));
    }

    private User saveActiveUser(String fullName, String email) {
        User user = User.pending(fullName, email, "hash");
        user.verifyEmail();
        return userRepository.save(user);
    }
}
