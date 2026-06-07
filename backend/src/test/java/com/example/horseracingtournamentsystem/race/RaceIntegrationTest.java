package com.example.horseracingtournamentsystem.race;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.example.horseracingtournamentsystem.race.repository.RaceRepository;
import com.example.horseracingtournamentsystem.race.entity.Race;
import com.example.horseracingtournamentsystem.prediction.entity.PredictionSettlementJob;
import com.example.horseracingtournamentsystem.prediction.entity.RacePrediction;
import com.example.horseracingtournamentsystem.prediction.repository.PredictionSettlementJobRepository;
import com.example.horseracingtournamentsystem.prediction.repository.RacePredictionRepository;
import com.example.horseracingtournamentsystem.points.service.PointsService;
import com.example.horseracingtournamentsystem.security.JwtService;
import com.example.horseracingtournamentsystem.tournament.entity.Tournament;
import com.example.horseracingtournamentsystem.tournament.repository.TournamentRepository;
import com.example.horseracingtournamentsystem.user.entity.Role;
import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.user.repository.RoleRepository;
import com.example.horseracingtournamentsystem.user.repository.UserRepository;
import com.example.horseracingtournamentsystem.user.repository.UserRoleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Set;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class RaceIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private RaceRepository raceRepository;

    @Autowired
    private RacePredictionRepository racePredictionRepository;

    @Autowired
    private PredictionSettlementJobRepository settlementJobRepository;

    @Autowired
    private PointsService pointsService;

    @Autowired
    private TournamentRepository tournamentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRoleRepository userRoleRepository;

    private String adminToken;
    private String spectatorToken;
    private Tournament tournament;
    private User adminUser;

    @BeforeEach
    void setUp() {
        raceRepository.deleteAll();
        tournamentRepository.deleteAll();
        userRoleRepository.deleteAll();
        roleRepository.deleteAll();
        userRepository.deleteAll();

        Role adminRole = roleRepository.save(Role.of("ADMIN", "Admin"));
        Role specRole = roleRepository.save(Role.of("SPECTATOR", "Spectator"));

        adminUser = User.pending("Admin User", "admin@example.com", "hash");
        adminUser.verifyEmail();
        adminUser = userRepository.save(adminUser);
        userRoleRepository.save(com.example.horseracingtournamentsystem.user.entity.UserRole.active(adminUser, adminRole, adminUser));

        User specUser = User.pending("Spectator User", "spec@example.com", "hash");
        specUser.verifyEmail();
        specUser = userRepository.save(specUser);
        userRoleRepository.save(com.example.horseracingtournamentsystem.user.entity.UserRole.active(specUser, specRole, adminUser));

        adminToken = jwtService.generateToken(adminUser.getEmail(), Set.of("ADMIN"));
        spectatorToken = jwtService.generateToken(specUser.getEmail(), Set.of("SPECTATOR"));

        tournament = Tournament.create(
                "Main Cup", "MC_01", "Main Cup Desc", "Tracks",
                LocalDate.now(), LocalDate.now().plusDays(10),
                LocalDateTime.now(), LocalDateTime.now().plusDays(2),
                20, adminUser
        );
        tournament = tournamentRepository.save(tournament);
    }

    @Test
    void adminCanCreateRace() throws Exception {
        String body = String.format("""
                {
                    "tournamentId": %d,
                    "name": "Grand Sprint",
                    "code": "SPRINT_01",
                    "raceDateTime": "2026-06-15T14:30:00",
                    "distanceMeters": 1200,
                    "maxParticipants": 12
                }
                """, tournament.getId());

        mockMvc.perform(post("/api/v1/admin/races")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Grand Sprint"))
                .andExpect(jsonPath("$.status").value("SCHEDULED"));
    }

    @Test
    void createRaceFailsIfTournamentDoesNotExist() throws Exception {
        String body = """
                {
                    "tournamentId": 9999,
                    "name": "Grand Sprint",
                    "code": "SPRINT_01",
                    "raceDateTime": "2026-06-15T14:30:00",
                    "distanceMeters": 1200,
                    "maxParticipants": 12
                }
                """;

        mockMvc.perform(post("/api/v1/admin/races")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isNotFound());
    }

    @Test
    void adminCanListRacesForOneTournamentOnly() throws Exception {
        Tournament otherTournament = tournamentRepository.save(Tournament.create(
                "Autumn Cup", "AC_01", "Autumn Cup Desc", "West Track",
                LocalDate.now().plusDays(20), LocalDate.now().plusDays(30),
                LocalDateTime.now().plusDays(20), LocalDateTime.now().plusDays(22),
                18, adminUser
        ));

        raceRepository.save(Race.create(
                tournament, "Round 1", "MC_R1", LocalDateTime.of(2026, 6, 15, 14, 30),
                1200, 12, adminUser
        ));
        raceRepository.save(Race.create(
                otherTournament, "Other Round", "AC_R1", LocalDateTime.of(2026, 7, 15, 14, 30),
                1400, 12, adminUser
        ));

        mockMvc.perform(get("/api/v1/admin/races")
                        .param("tournamentId", tournament.getId().toString())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Round 1"))
                .andExpect(jsonPath("$[0].code").value("MC_R1"))
                .andExpect(jsonPath("$[1]").doesNotExist());
    }

    @Test
    void adminCanAdvanceRaceOperationsStatus() throws Exception {
        Race race = raceRepository.save(Race.create(
                tournament, "Round 2", "MC_R2", LocalDateTime.of(2026, 6, 16, 14, 30),
                1600, 12, adminUser
        ));

        mockMvc.perform(put("/api/v1/admin/races/{id}/status", race.getId())
                        .param("status", "CHECKING")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CHECKING"));

        mockMvc.perform(put("/api/v1/admin/races/{id}/status", race.getId())
                        .param("status", "PUBLISHED")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken))
                .andExpect(status().isBadRequest());
    }

    @Test
    void leavingScheduledStateLocksPendingPredictions() throws Exception {
        Race race = raceRepository.save(Race.create(
                tournament, "Prediction Lock Round", "MC_LOCK", LocalDateTime.of(2026, 6, 17, 14, 30),
                1600, 12, adminUser
        ));
        User spectator = userRepository.findByEmail("spec@example.com").orElseThrow();
        RacePrediction prediction = racePredictionRepository.save(RacePrediction.create(
                race, spectator, RacePrediction.TYPE_WINNER, 101L, null, null, 5
        ));

        mockMvc.perform(put("/api/v1/admin/races/{id}/status", race.getId())
                        .param("status", "CHECKING")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CHECKING"));

        RacePrediction reloaded = racePredictionRepository.findById(prediction.getId()).orElseThrow();
        org.assertj.core.api.Assertions.assertThat(reloaded.getStatus()).isEqualTo(RacePrediction.STATUS_LOCKED);
        org.assertj.core.api.Assertions.assertThat(reloaded.getLockedAt()).isNotNull();
    }

    @Test
    void cancellingRaceRefundsPendingPredictions() throws Exception {
        Race race = raceRepository.save(Race.create(
                tournament, "Prediction Refund Round", "MC_REFUND", LocalDateTime.of(2026, 6, 18, 14, 30),
                1600, 12, adminUser
        ));
        User spectator = userRepository.findByEmail("spec@example.com").orElseThrow();
        pointsService.initializeAccount(spectator, 100);
        RacePrediction prediction = racePredictionRepository.save(RacePrediction.create(
                race, spectator, RacePrediction.TYPE_WINNER, 101L, null, null, 5
        ));

        mockMvc.perform(put("/api/v1/admin/races/{id}/status", race.getId())
                        .param("status", "CANCELLED")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));

        RacePrediction reloaded = racePredictionRepository.findById(prediction.getId()).orElseThrow();
        org.assertj.core.api.Assertions.assertThat(reloaded.getStatus()).isEqualTo(RacePrediction.STATUS_REFUNDED);
    }

    @Test
    void confirmingRaceResultCreatesOneSettlementJob() throws Exception {
        Race race = raceRepository.save(Race.create(
                tournament, "Prediction Settlement Round", "MC_SETTLE", LocalDateTime.of(2026, 6, 19, 14, 30),
                1600, 12, adminUser
        ));
        race.updateStatus("FINISHED");
        raceRepository.save(race);

        mockMvc.perform(put("/api/v1/admin/races/{id}/status", race.getId())
                        .param("status", "RESULT_SUBMITTED")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken))
                .andExpect(status().isOk());

        mockMvc.perform(put("/api/v1/admin/races/{id}/status", race.getId())
                        .param("status", "RESULT_CONFIRMED")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("RESULT_CONFIRMED"));

        PredictionSettlementJob job = settlementJobRepository.findByRaceId(race.getId()).orElseThrow();
        org.assertj.core.api.Assertions.assertThat(job.getStatus()).isEqualTo(PredictionSettlementJob.STATUS_PENDING);

        mockMvc.perform(put("/api/v1/admin/races/{id}/status", race.getId())
                        .param("status", "PUBLISHED")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken))
                .andExpect(status().isOk());

        org.assertj.core.api.Assertions.assertThat(settlementJobRepository.findByRaceId(race.getId())).isPresent();
    }
}
