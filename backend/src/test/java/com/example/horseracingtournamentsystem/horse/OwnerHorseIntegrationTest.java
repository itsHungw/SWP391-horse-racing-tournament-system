package com.example.horseracingtournamentsystem.horse;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.horseracingtournamentsystem.horse.repository.HorseRepository;
import com.example.horseracingtournamentsystem.security.JwtService;
import com.example.horseracingtournamentsystem.user.entity.Role;
import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.user.entity.UserRole;
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
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class OwnerHorseIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private HorseRepository horseRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRoleRepository userRoleRepository;

    private String ownerToken;
    private String spectatorToken;
    private User ownerUser;

    @BeforeEach
    void setUp() {
        horseRepository.deleteAll();
        userRoleRepository.deleteAll();
        roleRepository.deleteAll();
        userRepository.deleteAll();

        Role ownerRole = roleRepository.save(Role.of("HORSE_OWNER", "Horse Owner"));
        Role spectatorRole = roleRepository.save(Role.of("SPECTATOR", "Spectator"));

        ownerUser = User.pending("Owner User", "owner@example.com", "hash");
        ownerUser.verifyEmail();
        ownerUser = userRepository.save(ownerUser);
        userRoleRepository.save(UserRole.active(ownerUser, ownerRole, ownerUser));

        User spectatorUser = User.pending("Spectator User", "spectator@example.com", "hash");
        spectatorUser.verifyEmail();
        spectatorUser = userRepository.save(spectatorUser);
        userRoleRepository.save(UserRole.active(spectatorUser, spectatorRole, ownerUser));

        ownerToken = jwtService.generateToken(ownerUser.getEmail(), Set.of("HORSE_OWNER"));
        spectatorToken = jwtService.generateToken(spectatorUser.getEmail(), Set.of("SPECTATOR"));
    }

    @Test
    void ownerCreatesPendingHorseWithoutOwnerId() throws Exception {
        String body = """
                {
                    "name": "Nova",
                    "gender": "FEMALE",
                    "imageUrl": "https://cdn.example.com/nova.jpg",
                    "evidenceUrl": "https://cdn.example.com/nova.pdf"
                }
                """;

        mockMvc.perform(post("/api/v1/owner/horses")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Nova"))
                .andExpect(jsonPath("$.ownerId").value(ownerUser.getId()))
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.imageUrl").value("https://cdn.example.com/nova.jpg"))
                .andExpect(jsonPath("$.evidenceUrl").value("https://cdn.example.com/nova.pdf"));
    }

    @Test
    void missingEvidenceReturnsValidationError() throws Exception {
        String body = """
                {
                    "name": "Nova",
                    "gender": "FEMALE",
                    "imageUrl": "https://cdn.example.com/nova.jpg"
                }
                """;

        mockMvc.perform(post("/api/v1/owner/horses")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Validation failed"))
                .andExpect(jsonPath("$.fieldErrors.evidenceUrl").value("Evidence URL is required"));
    }

    @Test
    void spectatorCannotCreateOwnerHorse() throws Exception {
        String body = """
                {
                    "name": "Nova",
                    "gender": "FEMALE",
                    "imageUrl": "https://cdn.example.com/nova.jpg",
                    "evidenceUrl": "https://cdn.example.com/nova.pdf"
                }
                """;

        mockMvc.perform(post("/api/v1/owner/horses")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + spectatorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isForbidden());
    }
}
