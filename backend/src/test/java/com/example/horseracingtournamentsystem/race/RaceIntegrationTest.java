package com.example.horseracingtournamentsystem.race;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.example.horseracingtournamentsystem.championship.entity.TournamentParticipant;
import com.example.horseracingtournamentsystem.championship.repository.TournamentParticipantRepository;
import com.example.horseracingtournamentsystem.horse.entity.Horse;
import com.example.horseracingtournamentsystem.horse.repository.HorseRepository;
import com.example.horseracingtournamentsystem.race.entity.RaceParticipant;
import com.example.horseracingtournamentsystem.race.repository.RaceParticipantRepository;
import com.example.horseracingtournamentsystem.race.repository.RaceRepository;
import com.example.horseracingtournamentsystem.race.entity.Race;
import com.example.horseracingtournamentsystem.result.entity.RaceResult;
import com.example.horseracingtournamentsystem.result.repository.RaceResultRepository;
import com.example.horseracingtournamentsystem.prediction.entity.PredictionSettlementJob;
import com.example.horseracingtournamentsystem.prediction.entity.RacePrediction;
import com.example.horseracingtournamentsystem.prediction.repository.PredictionSettlementJobRepository;
import com.example.horseracingtournamentsystem.prediction.repository.RacePredictionRepository;
import com.example.horseracingtournamentsystem.point.service.PointAccountService;
import com.example.horseracingtournamentsystem.security.JwtService;
import com.example.horseracingtournamentsystem.tournament.entity.Tournament;
import com.example.horseracingtournamentsystem.tournament.repository.TournamentRepository;
import com.example.horseracingtournamentsystem.tournamentregistration.entity.TournamentRegistration;
import com.example.horseracingtournamentsystem.tournamentregistration.repository.TournamentRegistrationRepository;
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
import java.math.BigDecimal;
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
    private RaceParticipantRepository raceParticipantRepository;

    @Autowired
    private RaceResultRepository raceResultRepository;

    @Autowired
    private HorseRepository horseRepository;

    @Autowired
    private TournamentRegistrationRepository tournamentRegistrationRepository;

    @Autowired
    private TournamentParticipantRepository tournamentParticipantRepository;

    @Autowired
    private RacePredictionRepository racePredictionRepository;

    @Autowired
    private PredictionSettlementJobRepository settlementJobRepository;

    @Autowired
    private PointAccountService pointsService;

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
    void publicRaceDiscoverySeparatesUpcomingFromResults() throws Exception {
        Race upcoming = raceRepository.save(Race.create(
                tournament, "Emerald Sprint", "EMERALD_SPRINT",
                LocalDateTime.now().plusDays(2), 1200, 12, adminUser
        ));
        Race result = Race.create(
                tournament, "Heritage Mile", "HERITAGE_MILE",
                LocalDateTime.now().minusDays(2), 1600, 12, adminUser
        );
        result.updateStatus("RESULT_SUBMITTED");
        raceRepository.save(result);

        mockMvc.perform(get("/api/v1/races/search")
                        .param("scope", "UPCOMING")
                        .param("tournamentId", tournament.getId().toString())
                        .param("search", "emerald")
                        .param("sortBy", "NEXT_RACE")
                        .param("page", "0")
                        .param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].id").value(upcoming.getId()))
                .andExpect(jsonPath("$.content[0].participantCount").value(0))
                .andExpect(jsonPath("$.content[0].predictionOpen").value(true))
                .andExpect(jsonPath("$.content[0].resultOfficial").value(false));

        mockMvc.perform(get("/api/v1/races/search")
                        .param("scope", "RESULTS")
                        .param("sortBy", "LATEST_RESULT")
                        .param("page", "0")
                        .param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].name").value("Heritage Mile"))
                .andExpect(jsonPath("$.content[0].resultOfficial").value(false));
    }

    @Test
    void publicResultDiscoveryFiltersOfficialResultsByHorseAndJockey() throws Exception {
        Race emeraldRace = Race.create(
                tournament, "Emerald Final", "EMERALD_FINAL",
                LocalDateTime.now().minusDays(2), 1200, 12, adminUser
        );
        emeraldRace.updateStatus("RESULT_CONFIRMED");
        emeraldRace = raceRepository.save(emeraldRace);
        RaceParticipant emerald = createParticipant(emeraldRace, "Emerald King", "EMERALD-KING");
        RaceResult emeraldResult = RaceResult.create(emeraldRace, emerald, adminUser);
        emeraldResult.submit(
                1, new BigDecimal("72.341"), BigDecimal.ZERO, new BigDecimal("72.341"),
                RaceResult.RESULT_STATUS_FINISHED, RaceResult.STATUS_CONFIRMED, adminUser, "private"
        );
        raceResultRepository.save(emeraldResult);

        Race silverRace = Race.create(
                tournament, "Silver Final", "SILVER_FINAL",
                LocalDateTime.now().minusDays(1), 1400, 12, adminUser
        );
        silverRace.updateStatus("RESULT_CONFIRMED");
        silverRace = raceRepository.save(silverRace);
        RaceParticipant silver = createParticipant(silverRace, "Silver Reef", "SILVER-REEF");
        RaceResult silverResult = RaceResult.create(silverRace, silver, adminUser);
        silverResult.submit(
                1, new BigDecimal("81.120"), BigDecimal.ZERO, new BigDecimal("81.120"),
                RaceResult.RESULT_STATUS_FINISHED, RaceResult.STATUS_CONFIRMED, adminUser, "private"
        );
        raceResultRepository.save(silverResult);

        mockMvc.perform(get("/api/v1/races/search")
                        .param("scope", "RESULTS")
                        .param("horse", "emerald")
                        .param("jockey", "emerald-king jockey"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].id").value(emeraldRace.getId()))
                .andExpect(jsonPath("$.content[0].winner.horseName").value("Emerald King"));
    }

    @Test
    void publicCalendarRangeReturnsRacesForVisibleDay() throws Exception {
        LocalDate day = LocalDate.now().plusDays(3);
        raceRepository.save(Race.create(
                tournament, "Morning Sprint", "CALENDAR_AM",
                day.atTime(9, 0), 1200, 12, adminUser
        ));
        Race live = Race.create(
                tournament, "Evening Live", "CALENDAR_PM",
                day.atTime(18, 0), 1600, 12, adminUser
        );
        live.updateStatus("ONGOING");
        raceRepository.save(live);

        mockMvc.perform(get("/api/v1/races/search")
                        .param("scope", "UPCOMING")
                        .param("from", day.toString())
                        .param("to", day.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.content[0].name").value("Morning Sprint"))
                .andExpect(jsonPath("$.content[1].name").value("Evening Live"));
    }

    @Test
    void publicRaceDiscoveryExposesPredictionAvailabilityWithoutAuthentication() throws Exception {
        Race race = raceRepository.save(Race.create(
                tournament, "Eligibility Sprint", "ELIGIBILITY_SPRINT",
                LocalDateTime.now().plusDays(2), 1200, 12, adminUser
        ));
        mockMvc.perform(get("/api/v1/races/search").param("scope", "UPCOMING"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(race.getId()))
                .andExpect(jsonPath("$.content[0].predictionOpen").value(true));
    }

    @Test
    void publicResultsHideSubmittedOrderAndExposeConfirmedOrderWithoutNotes() throws Exception {
        Race race = Race.create(
                tournament, "Official Result Round", "OFFICIAL_RESULT",
                LocalDateTime.now().minusHours(2), 1200, 12, adminUser
        );
        race.updateStatus("RESULT_SUBMITTED");
        race = raceRepository.save(race);
        RaceParticipant participant = createParticipant(race, "Emerald King", "EMERALD-KING");
        RaceResult result = RaceResult.create(race, participant, adminUser);
        result.submit(
                1, new BigDecimal("72.341"), BigDecimal.ZERO, new BigDecimal("72.341"),
                RaceResult.RESULT_STATUS_FINISHED, RaceResult.STATUS_SUBMITTED, adminUser, "private referee note"
        );
        result = raceResultRepository.save(result);

        mockMvc.perform(get("/api/v1/races/{id}/results", race.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.official").value(false))
                .andExpect(jsonPath("$.entries").isEmpty())
                .andExpect(jsonPath("$.entries[0].note").doesNotExist());

        race.updateStatus("RESULT_CONFIRMED");
        raceRepository.save(race);
        result.submit(
                1, new BigDecimal("72.341"), BigDecimal.ZERO, new BigDecimal("72.341"),
                RaceResult.RESULT_STATUS_FINISHED, RaceResult.STATUS_CONFIRMED, adminUser, "still private"
        );
        raceResultRepository.save(result);

        mockMvc.perform(get("/api/v1/races/{id}/results", race.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.official").value(true))
                .andExpect(jsonPath("$.entries[0].position").value(1))
                .andExpect(jsonPath("$.entries[0].horseName").value("Emerald King"))
                .andExpect(jsonPath("$.entries[0].finishTimeSeconds").value(72.341))
                .andExpect(jsonPath("$.entries[0].note").doesNotExist())
                .andExpect(jsonPath("$.entries[0].submittedBy").doesNotExist());
    }

    @Test
    void publicRacingSummaryReturnsCompactAggregate() throws Exception {
        tournament.openRegistration();
        tournamentRepository.save(tournament);
        raceRepository.save(Race.create(
                tournament, "Summary Round One", "SUMMARY_ONE",
                LocalDateTime.now().plusDays(2), 1200, 12, adminUser
        ));
        raceRepository.save(Race.create(
                tournament, "Summary Round Two", "SUMMARY_TWO",
                LocalDateTime.now().plusDays(4), 1600, 12, adminUser
        ));

        mockMvc.perform(get("/api/v1/racing-summary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.raceCount").value(2))
                .andExpect(jsonPath("$.raceDayCount").value(2))
                .andExpect(jsonPath("$.championshipCount").value(1))
                .andExpect(jsonPath("$.seasonFinale").value(tournament.getEndDate().toString()));
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

        PredictionSettlementJob job = settlementJobRepository.findByRace_Id(race.getId()).orElseThrow();
        org.assertj.core.api.Assertions.assertThat(job.getStatus()).isEqualTo(PredictionSettlementJob.STATUS_PENDING);

        mockMvc.perform(put("/api/v1/admin/races/{id}/status", race.getId())
                        .param("status", "PUBLISHED")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken))
                .andExpect(status().isOk());

        org.assertj.core.api.Assertions.assertThat(settlementJobRepository.findByRace_Id(race.getId())).isPresent();
    }

    private RaceParticipant createParticipant(Race race, String horseName, String registrationCode) {
        User jockey = User.pending(registrationCode + " Jockey", registrationCode.toLowerCase() + "@example.com", "hash");
        jockey.verifyEmail();
        jockey = userRepository.save(jockey);
        Horse horse = horseRepository.save(Horse.create(
                adminUser, horseName, registrationCode, "Thoroughbred", "MALE",
                LocalDate.now().minusYears(5), "Bay"
        ));
        TournamentRegistration registration = TournamentRegistration.pending(tournament, horse, adminUser, "Ready");
        registration.approve(adminUser);
        registration = tournamentRegistrationRepository.save(registration);
        TournamentParticipant tournamentParticipant = tournamentParticipantRepository.save(
                TournamentParticipant.active(registration, jockey, null)
        );
        return raceParticipantRepository.save(RaceParticipant.registered(race, tournamentParticipant, null));
    }
}
