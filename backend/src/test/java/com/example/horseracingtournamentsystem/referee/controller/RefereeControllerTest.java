package com.example.horseracingtournamentsystem.referee.controller;

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
    @WithMockUser(roles = "REFEREE")
    void transitionNextStep_fromScheduled_returnsNewState() throws Exception {
        mockMvc.perform(post("/api/v1/referee/races/2/next-step"))
                .andExpect(status().isOk());
    }
}
