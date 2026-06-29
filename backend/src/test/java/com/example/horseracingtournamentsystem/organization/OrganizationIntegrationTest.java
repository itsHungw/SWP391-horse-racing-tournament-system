package com.example.horseracingtournamentsystem.organization;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.horseracingtournamentsystem.organization.entity.Organization;
import com.example.horseracingtournamentsystem.organization.repository.OrganizationRepository;
import com.example.horseracingtournamentsystem.security.JwtService;
import com.example.horseracingtournamentsystem.testsupport.TestDatabaseCleaner;
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
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class OrganizationIntegrationTest {

    private static final String ORGANIZER_SEPARATION_MESSAGE =
            "Personal participation accounts cannot register organizer workspaces. Use a separate account for organizing.";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRoleRepository userRoleRepository;

    @Autowired
    private OrganizationRepository organizationRepository;

    private User admin;
    private User participant;
    private String adminToken;
    private String participantToken;

    @BeforeEach
    void setUp() {
        TestDatabaseCleaner.clean(jdbcTemplate);
        organizationRepository.deleteAll();
        userRoleRepository.deleteAll();
        roleRepository.deleteAll();
        userRepository.deleteAll();

        Role adminRole = roleRepository.save(Role.of("ADMIN", "Administrator"));
        Role spectatorRole = roleRepository.save(Role.of("SPECTATOR", "Spectator"));
        Role jockeyRole = roleRepository.save(Role.of("JOCKEY", "Jockey"));
        roleRepository.save(Role.of("ORGANIZER", "Organizer"));

        admin = userRepository.save(User.pending("Admin User", "admin@example.com", "hash"));
        admin.verifyEmail();
        userRoleRepository.save(UserRole.active(admin, adminRole, admin));

        participant = userRepository.save(User.pending("Minh Quan", "quan@example.com", "hash", "0909123456"));
        participant.verifyEmail();
        userRoleRepository.save(UserRole.active(participant, spectatorRole, admin));
        userRoleRepository.save(UserRole.active(participant, jockeyRole, admin));

        adminToken = jwtService.generateToken(admin.getEmail(), Set.of("ADMIN"));
        participantToken = jwtService.generateToken(participant.getEmail(), Set.of("SPECTATOR", "JOCKEY"));
    }

    @Test
    void personalRoleAccountCannotRegisterOrganization() throws Exception {
        mockMvc.perform(post("/api/v1/organizations")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + participantToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(organizationRequest()))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value(ORGANIZER_SEPARATION_MESSAGE));
    }

    @Test
    void adminCannotApproveOrganizationForPersonalRoleAccount() throws Exception {
        Organization organization = organizationRepository.save(Organization.application(
                participant,
                "ORG_TEST",
                "Quan Racing Office",
                "KYB-2026-001",
                "office@example.com",
                "0909123456",
                "Local racing operator",
                "/api/v1/files/private/kyb.pdf",
                null,
                "We operate local race meetings and can provide officials, scheduling, and field management."
        ));

        mockMvc.perform(post("/api/v1/admin/organizations/{id}/approve", organization.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value(ORGANIZER_SEPARATION_MESSAGE));
    }

    private String organizationRequest() {
        return """
                {
                    "name": "Quan Racing Office",
                    "licenseNumber": "KYB-2026-001",
                    "contactEmail": "office@example.com",
                    "contactPhone": "0909123456",
                    "description": "Local racing operator",
                    "evidenceUrl": "/api/v1/files/private/kyb.pdf",
                    "applicationNote": "We operate local race meetings and can provide officials, scheduling, and field management."
                }
                """;
    }
}
