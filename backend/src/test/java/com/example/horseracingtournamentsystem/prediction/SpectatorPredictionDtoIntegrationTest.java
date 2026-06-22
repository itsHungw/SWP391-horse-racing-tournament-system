package com.example.horseracingtournamentsystem.prediction;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.horseracingtournamentsystem.prediction.entity.RacePrediction;
import com.example.horseracingtournamentsystem.prediction.repository.RacePredictionRepository;
import com.example.horseracingtournamentsystem.race.entity.Race;
import com.example.horseracingtournamentsystem.race.repository.RaceRepository;
import com.example.horseracingtournamentsystem.tournament.entity.Tournament;
import com.example.horseracingtournamentsystem.tournament.repository.TournamentRepository;
import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.user.repository.UserRepository;
import java.time.LocalDate;
import java.time.LocalDateTime;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class SpectatorPredictionDtoIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TournamentRepository tournamentRepository;

    @Autowired
    private RaceRepository raceRepository;

    @Autowired
    private RacePredictionRepository predictionRepository;

    @BeforeEach
    void setUp() {
        User admin = verifiedUser("prediction-admin@test.local");
        User spectator = verifiedUser("prediction-spectator@test.local");
        Tournament tournament = tournamentRepository.save(Tournament.create(
                "Prediction DTO Cup",
                "PRED-DTO",
                "Prediction DTO test",
                "DTO Track",
                LocalDate.now(),
                LocalDate.now().plusDays(3),
                LocalDateTime.now().minusDays(1),
                LocalDateTime.now().plusDays(1),
                20,
                admin
        ));
        Race race = raceRepository.save(Race.create(
                tournament,
                "DTO Round",
                "PRED-DTO-R1",
                LocalDateTime.now().plusHours(3),
                1000,
                8,
                admin
        ));
        predictionRepository.save(RacePrediction.create(race, spectator, RacePrediction.TYPE_WINNER, 10L, 1, null, null, null, null, 5));
    }

    @Test
    @WithMockUser(username = "prediction-spectator@test.local", roles = "SPECTATOR")
    void myPredictionsReturnDtoWithoutEntityGraphs() throws Exception {
        mockMvc.perform(get("/api/v1/predictions/my"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].raceId").exists())
                .andExpect(jsonPath("$[0].raceName").value("DTO Round"))
                .andExpect(jsonPath("$[0].predictionType").value("WINNER"))
                .andExpect(jsonPath("$[0].race").doesNotExist())
                .andExpect(jsonPath("$[0].spectator").doesNotExist());
    }

    private User verifiedUser(String email) {
        return userRepository.findByEmail(email).orElseGet(() -> {
            User user = User.pending(email, email, "hash");
            user.verifyEmail();
            return userRepository.save(user);
        });
    }
}
