package com.example.horseracingtournamentsystem.horse;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.example.horseracingtournamentsystem.horse.entity.Horse;
import com.example.horseracingtournamentsystem.horse.repository.HorseRepository;
import com.example.horseracingtournamentsystem.security.JwtService;
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
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.Set;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class HorseIntegrationTest {

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

    @Autowired
    private com.example.horseracingtournamentsystem.notification.repository.NotificationRepository notificationRepository;

    private String adminToken;
    private String spectatorToken;
    private String ownerToken;
    private User ownerUser;

    @BeforeEach
    void setUp() {
        notificationRepository.deleteAll();
        horseRepository.deleteAll();
        userRoleRepository.deleteAll();
        roleRepository.deleteAll();
        userRepository.deleteAll();

        Role adminRole = roleRepository.save(Role.of("ADMIN", "Admin"));
        Role specRole = roleRepository.save(Role.of("SPECTATOR", "Spectator"));
        Role ownerRole = roleRepository.save(Role.of("HORSE_OWNER", "Horse Owner"));

        User adminUser = User.pending("Admin User", "admin@example.com", "hash");
        adminUser.verifyEmail();
        adminUser = userRepository.save(adminUser);
        userRoleRepository.save(com.example.horseracingtournamentsystem.user.entity.UserRole.active(adminUser, adminRole, adminUser));

        ownerUser = User.pending("Owner User", "owner@example.com", "hash");
        ownerUser.verifyEmail();
        ownerUser = userRepository.save(ownerUser);
        userRoleRepository.save(com.example.horseracingtournamentsystem.user.entity.UserRole.active(ownerUser, ownerRole, adminUser));

        adminToken = jwtService.generateToken(adminUser.getEmail(), Set.of("ADMIN"));
        ownerToken = jwtService.generateToken(ownerUser.getEmail(), Set.of("HORSE_OWNER"));
        spectatorToken = jwtService.generateToken(ownerUser.getEmail(), Set.of("SPECTATOR"));
    }

    @Test
    void adminCanCreateHorse() throws Exception {
        String body = String.format("""
                {
                    "ownerId": %d,
                    "name": "Secretariat",
                    "breed": "Thoroughbred",
                    "gender": "MALE",
                    "dateOfBirth": "1970-03-30",
                    "color": "Chestnut"
                }
                """, ownerUser.getId());

        mockMvc.perform(post("/api/v1/admin/horses")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Secretariat"))
                .andExpect(jsonPath("$.status").value("APPROVED"));
    }

    @Test
    void publicEndPointsReturnsOnlyApprovedHorses() throws Exception {
        Horse horse = Horse.create(ownerUser, "Draft Horse", "H_CODE_1", "Thoroughbred", "MALE", LocalDate.now(), "Black");
        org.springframework.test.util.ReflectionTestUtils.setField(horse, "status", "INACTIVE");
        horseRepository.save(horse);

        mockMvc.perform(get("/api/v1/horses"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void adminApprovesPendingHorse() throws Exception {
        Horse horse = Horse.create(ownerUser, "Nova", "H_CODE_2", "Thoroughbred", "FEMALE", LocalDate.of(2020, 3, 1), "Bay");
        ReflectionTestUtils.setField(horse, "status", "PENDING");
        horse = horseRepository.save(horse);

        mockMvc.perform(post("/api/v1/admin/horses/{id}/approve", horse.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPROVED"))
                .andExpect(jsonPath("$.approvedBy").exists())
                .andExpect(jsonPath("$.approvedAt").exists());

        org.junit.jupiter.api.Assertions.assertEquals(1, notificationRepository.countByRecipient_EmailAndReadAtIsNull("owner@example.com"));
        var notif = notificationRepository.findAll().get(0);
        org.junit.jupiter.api.Assertions.assertEquals("HORSE_APPROVED", notif.getType());
        org.junit.jupiter.api.Assertions.assertEquals("HORSE", notif.getReferenceType());
    }

    @Test
    void adminRejectsPendingHorseWithReason() throws Exception {
        Horse horse = Horse.create(ownerUser, "Nova", "H_CODE_3", "Thoroughbred", "FEMALE", LocalDate.of(2020, 3, 1), "Bay");
        ReflectionTestUtils.setField(horse, "status", "PENDING");
        horse = horseRepository.save(horse);

        mockMvc.perform(post("/api/v1/admin/horses/{id}/reject", horse.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"Missing health certificate\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("REJECTED"))
                .andExpect(jsonPath("$.rejectionReason").value("Missing health certificate"));

        org.junit.jupiter.api.Assertions.assertEquals(1, notificationRepository.countByRecipient_EmailAndReadAtIsNull("owner@example.com"));
        var notif = notificationRepository.findAll().stream().filter(n -> "HORSE_REJECTED".equals(n.getType())).findFirst().orElseThrow();
        org.junit.jupiter.api.Assertions.assertEquals("HORSE", notif.getReferenceType());
    }

    @Test
    void adminCannotReviewApprovedHorseAgain() throws Exception {
        Horse horse = Horse.create(ownerUser, "Nova", "H_CODE_4", "Thoroughbred", "FEMALE", LocalDate.of(2020, 3, 1), "Bay");
        horse = horseRepository.save(horse);

        mockMvc.perform(post("/api/v1/admin/horses/{id}/approve", horse.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Only pending horses can be reviewed"));
    }

    @Test
    void ownerCanUpdateOwnHorse() throws Exception {
        Horse horse = Horse.create(ownerUser, "Old Name", "H_CODE_UPD_1", "Thoroughbred", "MALE", LocalDate.of(2018, 5, 10), "Brown");
        horse = horseRepository.save(horse);

        String updateBody = """
                {
                    "name": "New Name",
                    "breed": "Quarter Horse",
                    "gender": "FEMALE",
                    "dateOfBirth": "2019-06-12",
                    "color": "Grey",
                    "heightCm": 160,
                    "weightKg": 500,
                    "healthStatus": "Healthy",
                    "medicalNote": "Updated Note",
                    "description": "Updated Description"
                }
                """;

        mockMvc.perform(put("/api/v1/owner/horses/{id}", horse.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("New Name"))
                .andExpect(jsonPath("$.breed").value("Quarter Horse"))
                .andExpect(jsonPath("$.gender").value("FEMALE"))
                .andExpect(jsonPath("$.color").value("Grey"))
                .andExpect(jsonPath("$.status").value("PENDING"));
    }

    @Test
    void cannotUpdateOtherOwnerHorse() throws Exception {
        User otherOwner = User.pending("Other Owner", "other@example.com", "hash");
        otherOwner.verifyEmail();
        otherOwner = userRepository.save(otherOwner);

        Horse horse = Horse.create(otherOwner, "Other Horse", "H_CODE_UPD_2", "Thoroughbred", "MALE", LocalDate.now(), "Brown");
        horse = horseRepository.save(horse);

        String updateBody = """
                {
                    "name": "Hacked Name",
                    "gender": "MALE"
                }
                """;

        mockMvc.perform(put("/api/v1/owner/horses/{id}", horse.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateBody))
                .andExpect(status().isNotFound());
    }
}
