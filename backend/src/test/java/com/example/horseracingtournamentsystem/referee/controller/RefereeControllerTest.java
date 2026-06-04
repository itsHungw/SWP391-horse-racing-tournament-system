package com.example.horseracingtournamentsystem.referee.controller;

import com.example.horseracingtournamentsystem.race.entity.Race;
import com.example.horseracingtournamentsystem.race.repository.RaceRepository;
import com.example.horseracingtournamentsystem.tournament.entity.Tournament;
import com.example.horseracingtournamentsystem.tournament.repository.TournamentRepository;
import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.user.repository.UserRepository;
import java.time.LocalDate;
import java.time.LocalDateTime;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class RefereeControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TournamentRepository tournamentRepository;

    @Autowired
    private RaceRepository raceRepository;

    @Test
    void getAssignedRaces_withoutAuthToken_returnsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/v1/referee/races"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = "SPECTATOR")
    void getAssignedRaces_withSpectatorRole_returnsForbidden() throws Exception {
        mockMvc.perform(get("/api/v1/referee/races"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "REFEREE")
    void getAssignedRaces_withRefereeRole_returnsOk() throws Exception {
        mockMvc.perform(get("/api/v1/referee/races"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "referee-flow@test.local", roles = "REFEREE")
    void transitionNextStep_fromScheduled_returnsNewState() throws Exception {
        User admin = createUser("admin-flow@test.local");
        User referee = createUser("referee-flow@test.local");
        Tournament tournament = Tournament.create(
                "Referee Flow Cup",
                "REF-FLOW",
                "Referee flow",
                "Test Track",
                LocalDate.now(),
                LocalDate.now().plusDays(2),
                LocalDateTime.now().minusDays(1),
                LocalDateTime.now().plusDays(1),
                20,
                admin
        );
        tournament.publishSchedule();
        tournamentRepository.save(tournament);
        Race race = Race.create(
                tournament,
                "Round 1",
                "REF-RACE-1",
                LocalDateTime.now().plusHours(1),
                800,
                12,
                admin
        );
        race.assignReferee(referee);
        raceRepository.save(race);

        mockMvc.perform(post("/api/v1/referee/races/" + race.getId() + "/next-step"))
                .andExpect(status().isOk());
    }

    private User createUser(String email) {
        User user = User.pending(email, email, "password");
        user.verifyEmail();
        return userRepository.save(user);
    }
}
