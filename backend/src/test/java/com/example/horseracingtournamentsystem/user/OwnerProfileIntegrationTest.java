package com.example.horseracingtournamentsystem.user;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.horseracingtournamentsystem.security.JwtService;
import com.example.horseracingtournamentsystem.user.entity.Role;
import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.user.repository.HorseOwnerProfileRepository;
import com.example.horseracingtournamentsystem.user.repository.RoleRepository;
import com.example.horseracingtournamentsystem.user.repository.UserRepository;
import com.example.horseracingtournamentsystem.user.repository.UserRoleRepository;
import java.util.Set;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class OwnerProfileIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRoleRepository userRoleRepository;

    @Autowired
    private HorseOwnerProfileRepository horseOwnerProfileRepository;

    private String token;
    private User user;

    @BeforeEach
    void setUp() {
        horseOwnerProfileRepository.deleteAll();
        userRoleRepository.deleteAll();
        roleRepository.deleteAll();
        userRepository.deleteAll();

        Role spectatorRole = roleRepository.save(Role.of("SPECTATOR", "Spectator"));
        user = User.pending("Owner Candidate", "owner-candidate@example.com", "hash");
        user.verifyEmail();
        user = userRepository.save(user);
        userRoleRepository.save(com.example.horseracingtournamentsystem.user.entity.UserRole.active(user, spectatorRole, user));

        token = jwtService.generateToken(user.getEmail(), Set.of("SPECTATOR"));
    }

    @Test
    void getOwnerProfileReturnsNotFoundWhenMissing() throws Exception {
        mockMvc.perform(get("/api/v1/users/me/owner-profile")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Owner profile not found"));
    }
}
