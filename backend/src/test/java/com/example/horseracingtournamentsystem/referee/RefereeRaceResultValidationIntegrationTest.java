package com.example.horseracingtournamentsystem.referee;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.horseracingtournamentsystem.championship.entity.TournamentParticipant;
import com.example.horseracingtournamentsystem.championship.repository.TournamentParticipantRepository;
import com.example.horseracingtournamentsystem.horse.entity.Horse;
import com.example.horseracingtournamentsystem.horse.repository.HorseRepository;
import com.example.horseracingtournamentsystem.race.entity.Race;
import com.example.horseracingtournamentsystem.race.enums.RaceStatus;
import com.example.horseracingtournamentsystem.race.entity.RaceParticipant;
import com.example.horseracingtournamentsystem.race.repository.RaceParticipantRepository;
import com.example.horseracingtournamentsystem.race.repository.RaceRepository;
import com.example.horseracingtournamentsystem.tournament.entity.Tournament;
import com.example.horseracingtournamentsystem.tournament.repository.TournamentRepository;
import com.example.horseracingtournamentsystem.tournamentregistration.entity.TournamentRegistration;
import com.example.horseracingtournamentsystem.tournamentregistration.repository.TournamentRegistrationRepository;
import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.user.repository.UserRepository;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class RefereeRaceResultValidationIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TournamentRepository tournamentRepository;

    @Autowired
    private RaceRepository raceRepository;

    @Autowired
    private HorseRepository horseRepository;

    @Autowired
    private TournamentRegistrationRepository registrationRepository;

    @Autowired
    private TournamentParticipantRepository tournamentParticipantRepository;

    @Autowired
    private RaceParticipantRepository raceParticipantRepository;

    private Race race;
    private RaceParticipant firstParticipant;
    private RaceParticipant secondParticipant;

    @BeforeEach
    void setUp() {
        User admin = verifiedUser("result-admin@test.local");
        User referee = verifiedUser("result-referee@test.local");
        User owner = verifiedUser("result-owner@test.local");
        User firstJockey = verifiedUser("result-jockey-1@test.local");
        User secondJockey = verifiedUser("result-jockey-2@test.local");

        Tournament tournament = Tournament.create(
                "Result Validation Cup",
                "RESULT-VALIDATION",
                "Operational result validation",
                "Validation Track",
                LocalDate.now(),
                LocalDate.now().plusDays(2),
                LocalDateTime.now().minusDays(1),
                LocalDateTime.now().plusDays(1),
                20,
                admin
        );
        tournament.publishSchedule();
        tournament = tournamentRepository.save(tournament);

        race = Race.create(
                tournament,
                "Validation Round",
                "RESULT-ROUND",
                LocalDateTime.now().plusHours(1),
                1200,
                8,
                admin
        );
        race.assignReferee(referee);
        race.updateStatus(RaceStatus.FINISHED);
        race = raceRepository.save(race);

        firstParticipant = createParticipant(tournament, race, owner, firstJockey, "Validator One", "RV-1", admin);
        secondParticipant = createParticipant(tournament, race, owner, secondJockey, "Validator Two", "RV-2", admin);
    }

    @Test
    @WithMockUser(username = "result-referee@test.local", roles = "REFEREE")
    void rejectsEmptyResultPackage() throws Exception {
        mockMvc.perform(post("/api/v1/referee/races/{raceId}/results/submit", race.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "requiresAdminReview": false,
                                  "results": []
                                }
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "result-referee@test.local", roles = "REFEREE")
    void rejectsDuplicateFinishPositions() throws Exception {
        mockMvc.perform(post("/api/v1/referee/races/{raceId}/results/submit", race.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "requiresAdminReview": false,
                                  "results": [
                                    {"participantId": %d, "position": 1, "rawFinishTimeSeconds": 73.125, "penaltySeconds": 0, "status": "FINISHED"},
                                    {"participantId": %d, "position": 1, "rawFinishTimeSeconds": 74.220, "penaltySeconds": 0, "status": "FINISHED"}
                                  ]
                                }
                                """.formatted(firstParticipant.getId(), secondParticipant.getId())))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "result-referee@test.local", roles = "REFEREE")
    void rejectsMissingParticipantResult() throws Exception {
        mockMvc.perform(post("/api/v1/referee/races/{raceId}/results/submit", race.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "requiresAdminReview": false,
                                  "results": [
                                    {"participantId": %d, "position": 1, "rawFinishTimeSeconds": 73.125, "penaltySeconds": 0, "status": "FINISHED"}
                                  ]
                                }
                                """.formatted(firstParticipant.getId())))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "result-referee@test.local", roles = "REFEREE")
    void rejectsNegativePenalty() throws Exception {
        mockMvc.perform(post("/api/v1/referee/races/{raceId}/results/submit", race.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "requiresAdminReview": false,
                                  "results": [
                                    {"participantId": %d, "position": 1, "rawFinishTimeSeconds": 73.125, "penaltySeconds": -1, "status": "FINISHED"},
                                    {"participantId": %d, "position": 2, "rawFinishTimeSeconds": 74.220, "penaltySeconds": 0, "status": "FINISHED"}
                                  ]
                                }
                                """.formatted(firstParticipant.getId(), secondParticipant.getId())))
                .andExpect(status().isBadRequest());
    }

    private RaceParticipant createParticipant(
            Tournament tournament,
            Race race,
            User owner,
            User jockey,
            String horseName,
            String registrationCode,
            User reviewer
    ) {
        Horse horse = horseRepository.save(Horse.create(
                owner,
                horseName,
                registrationCode,
                "Thoroughbred",
                "MALE",
                LocalDate.now().minusYears(5),
                "Bay"
        ));
        TournamentRegistration registration = TournamentRegistration.pending(tournament, horse, owner, "Ready");
        registration.approve(reviewer);
        registration = registrationRepository.save(registration);

        TournamentParticipant tournamentParticipant = tournamentParticipantRepository.save(
                TournamentParticipant.active(registration, jockey, null)
        );
        return raceParticipantRepository.save(RaceParticipant.registered(race, tournamentParticipant, null));
    }

    private User verifiedUser(String email) {
        return userRepository.findByEmail(email).orElseGet(() -> {
            User user = User.pending(email, email, "hash");
            user.verifyEmail();
            return userRepository.save(user);
        });
    }
}
