package com.example.horseracingtournamentsystem.tournamentregistration;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.horseracingtournamentsystem.horse.entity.Horse;
import com.example.horseracingtournamentsystem.horse.entity.HorseDocument;
import com.example.horseracingtournamentsystem.horse.repository.HorseDocumentRepository;
import com.example.horseracingtournamentsystem.horse.repository.HorseRepository;
import com.example.horseracingtournamentsystem.security.JwtService;
import com.example.horseracingtournamentsystem.testsupport.TestDatabaseCleaner;
import com.example.horseracingtournamentsystem.tournament.entity.Tournament;
import com.example.horseracingtournamentsystem.tournament.repository.TournamentRepository;
import com.example.horseracingtournamentsystem.tournamentregistration.entity.TournamentRegistration;
import com.example.horseracingtournamentsystem.tournamentregistration.repository.TournamentRegistrationRepository;
import com.example.horseracingtournamentsystem.user.entity.Role;
import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.user.entity.UserRole;
import com.example.horseracingtournamentsystem.user.repository.RoleRepository;
import com.example.horseracingtournamentsystem.user.repository.UserRepository;
import com.example.horseracingtournamentsystem.user.repository.UserRoleRepository;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Set;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.util.JsonPathExpectationsHelper;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class TournamentRegistrationIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private HorseRepository horseRepository;

    @Autowired
    private HorseDocumentRepository horseDocumentRepository;

    @Autowired
    private TournamentRepository tournamentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRoleRepository userRoleRepository;

    @Autowired
    private TournamentRegistrationRepository registrationRepository;

    private String adminToken;
    private String ownerToken;
    private User adminUser;
    private User ownerUser;
    private User anotherOwnerUser;
    private Tournament openTournament;
    private Horse approvedHorse;
    private Horse pendingHorse;
    private Horse anotherOwnerHorse;

    @BeforeEach
    void setUp() {
        TestDatabaseCleaner.clean(jdbcTemplate);
        horseDocumentRepository.deleteAll();
        horseRepository.deleteAll();
        tournamentRepository.deleteAll();
        userRoleRepository.deleteAll();
        roleRepository.deleteAll();
        userRepository.deleteAll();

        Role adminRole = roleRepository.save(Role.of("ADMIN", "Admin"));
        Role ownerRole = roleRepository.save(Role.of("HORSE_OWNER", "Horse Owner"));

        adminUser = User.pending("Admin User", "admin@example.com", "hash");
        adminUser.verifyEmail();
        adminUser = userRepository.save(adminUser);
        userRoleRepository.save(UserRole.active(adminUser, adminRole, adminUser));

        ownerUser = User.pending("Owner User", "owner@example.com", "hash");
        ownerUser.verifyEmail();
        ownerUser = userRepository.save(ownerUser);
        userRoleRepository.save(UserRole.active(ownerUser, ownerRole, adminUser));

        anotherOwnerUser = User.pending("Another Owner", "another-owner@example.com", "hash");
        anotherOwnerUser.verifyEmail();
        anotherOwnerUser = userRepository.save(anotherOwnerUser);
        userRoleRepository.save(UserRole.active(anotherOwnerUser, ownerRole, adminUser));

        openTournament = Tournament.create(
                "Spring Cup",
                "SPRING_CUP",
                "Open registration tournament",
                "Saigon Track",
                LocalDate.now().plusDays(10),
                LocalDate.now().plusDays(15),
                LocalDateTime.now().minusDays(1),
                LocalDateTime.now().plusDays(7),
                20,
                adminUser
        );
        openTournament.openRegistration();
        openTournament = tournamentRepository.save(openTournament);

        approvedHorse = horseRepository.save(Horse.create(
                ownerUser,
                "Approved Horse",
                "H_APPROVED",
                "Thoroughbred",
                "MALE",
                LocalDate.of(2020, 1, 1),
                "Bay"
        ));

        pendingHorse = Horse.create(
                ownerUser,
                "Pending Horse",
                "H_PENDING",
                "Thoroughbred",
                "FEMALE",
                LocalDate.of(2021, 1, 1),
                "Black"
        );
        ReflectionTestUtils.setField(pendingHorse, "status", "PENDING");
        pendingHorse = horseRepository.save(pendingHorse);

        anotherOwnerHorse = horseRepository.save(Horse.create(
                anotherOwnerUser,
                "Another Horse",
                "H_OTHER",
                "Thoroughbred",
                "MALE",
                LocalDate.of(2019, 1, 1),
                "Chestnut"
        ));

        adminToken = jwtService.generateToken(adminUser.getEmail(), Set.of("ADMIN"));
        ownerToken = jwtService.generateToken(ownerUser.getEmail(), Set.of("HORSE_OWNER"));
    }

    @Test
    void ownerRegistersApprovedOwnHorseIntoOpenTournament() throws Exception {
        addRequiredMedicalDocuments(approvedHorse, openTournament.getEndDate().plusDays(1));

        mockMvc.perform(post("/api/v1/owner/tournament-registrations")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registrationBody(approvedHorse)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.tournamentId").value(openTournament.getId()))
                .andExpect(jsonPath("$.horseId").value(approvedHorse.getId()))
                .andExpect(jsonPath("$.ownerId").value(ownerUser.getId()))
                .andExpect(jsonPath("$.status").value("PENDING"));
    }

    @Test
    void ownerCannotRegisterHorseMissingRequiredMedicalDocuments() throws Exception {
        mockMvc.perform(post("/api/v1/owner/tournament-registrations")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registrationBody(approvedHorse)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Missing required medical documents: Coggins and Health Certificate"));
    }

    @Test
    void ownerCannotRegisterHorseWithMedicalDocumentsExpiringBeforeTournamentEnds() throws Exception {
        addRequiredMedicalDocuments(approvedHorse, openTournament.getEndDate().minusDays(1));

        mockMvc.perform(post("/api/v1/owner/tournament-registrations")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registrationBody(approvedHorse)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Medical documents must be valid through the tournament end date"));
    }

    @Test
    void ownerCannotRegisterPendingHorse() throws Exception {
        mockMvc.perform(post("/api/v1/owner/tournament-registrations")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registrationBody(pendingHorse)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Horse must be approved before tournament registration"));
    }

    @Test
    void ownerCannotRegisterAnotherOwnersHorse() throws Exception {
        mockMvc.perform(post("/api/v1/owner/tournament-registrations")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registrationBody(anotherOwnerHorse)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Horse does not belong to current owner"));
    }

    @Test
    void ownerCannotExceedTournamentHorseLimitPerOwner() throws Exception {
        Horse secondHorse = createApprovedOwnerHorse("Second Horse", "H_SECOND");
        Horse thirdHorse = createApprovedOwnerHorse("Third Horse", "H_THIRD");
        addRequiredMedicalDocuments(approvedHorse, openTournament.getEndDate().plusDays(1));
        addRequiredMedicalDocuments(secondHorse, openTournament.getEndDate().plusDays(1));
        addRequiredMedicalDocuments(thirdHorse, openTournament.getEndDate().plusDays(1));

        mockMvc.perform(post("/api/v1/owner/tournament-registrations")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registrationBody(approvedHorse)))
                .andExpect(status().isCreated());
        mockMvc.perform(post("/api/v1/owner/tournament-registrations")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registrationBody(secondHorse)))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/v1/owner/tournament-registrations")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registrationBody(thirdHorse)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Owner horse registration limit reached for this tournament"));
    }

    @Test
    void ownerCanWithdrawPendingRegistration() throws Exception {
        long registrationId = createPendingRegistration();

        mockMvc.perform(post("/api/v1/owner/tournament-registrations/{id}/withdraw", registrationId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("WITHDRAWN"));
    }

    @Test
    void ownerGetsPaginatedTournamentRegistrations() throws Exception {
        for (int index = 1; index <= 9; index++) {
            Tournament tournament = tournamentRepository.save(Tournament.create(
                    "Cup " + index,
                    "CUP_" + index,
                    "Paged tournament " + index,
                    "Saigon Track",
                    LocalDate.now().plusDays(index + 10L),
                    LocalDate.now().plusDays(index + 12L),
                    LocalDateTime.now().minusDays(1),
                    LocalDateTime.now().plusDays(7),
                    20,
                    adminUser
            ));
            registrationRepository.save(TournamentRegistration.pending(tournament, approvedHorse, ownerUser, "Ready"));
        }
        registrationRepository.save(TournamentRegistration.pending(openTournament, anotherOwnerHorse, anotherOwnerUser, "Other"));

        mockMvc.perform(get("/api/v1/owner/tournament-registrations")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + ownerToken)
                        .param("page", "1")
                        .param("size", "4"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(4))
                .andExpect(jsonPath("$.totalElements").value(9))
                .andExpect(jsonPath("$.size").value(4))
                .andExpect(jsonPath("$.number").value(1));
    }

    @Test
    void ownerCanReregisterAfterWithdrawnRegistration() throws Exception {
        long originalRegistrationId = createPendingRegistration();

        mockMvc.perform(post("/api/v1/owner/tournament-registrations/{id}/withdraw", originalRegistrationId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("WITHDRAWN"));

        MvcResult result = mockMvc.perform(post("/api/v1/owner/tournament-registrations")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registrationBody(approvedHorse)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andReturn();

        long resubmittedId = extractRegistrationId(result);
        assertEquals(originalRegistrationId, resubmittedId);
        assertEquals(1L, registrationRepository.count());
    }

    @Test
    void adminApprovesPendingRegistration() throws Exception {
        long registrationId = createPendingRegistration();

        mockMvc.perform(post("/api/v1/admin/tournament-registrations/{id}/approve", registrationId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPROVED"))
                .andExpect(jsonPath("$.reviewedAt").exists());
    }

    @Test
    void adminRejectsPendingRegistrationWithReason() throws Exception {
        long registrationId = createPendingRegistration();

        mockMvc.perform(post("/api/v1/admin/tournament-registrations/{id}/reject", registrationId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"Tournament slot requires updated health evidence.\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("REJECTED"))
                .andExpect(jsonPath("$.rejectionReason").value("Tournament slot requires updated health evidence."));
    }

    @Test
    void ownerCanReregisterAfterRejectedRegistration() throws Exception {
        long originalRegistrationId = createPendingRegistration();

        mockMvc.perform(post("/api/v1/admin/tournament-registrations/{id}/reject", originalRegistrationId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"Missing health documents.\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("REJECTED"));

        MvcResult result = mockMvc.perform(post("/api/v1/owner/tournament-registrations")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registrationBody(approvedHorse)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andReturn();

        long resubmittedId = extractRegistrationId(result);
        assertEquals(originalRegistrationId, resubmittedId);
        assertEquals(1L, registrationRepository.count());
    }

    @Test
    void adminCannotReviewApprovedRegistrationAgain() throws Exception {
        long registrationId = createPendingRegistration();

        mockMvc.perform(post("/api/v1/admin/tournament-registrations/{id}/approve", registrationId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/admin/tournament-registrations/{id}/approve", registrationId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Only pending registrations can be reviewed"));
    }

    private long createPendingRegistration() throws Exception {
        addRequiredMedicalDocuments(approvedHorse, openTournament.getEndDate().plusDays(1));

        MvcResult result = mockMvc.perform(post("/api/v1/owner/tournament-registrations")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registrationBody(approvedHorse)))
                .andExpect(status().isCreated())
                .andReturn();

        return extractRegistrationId(result);
    }

    private long extractRegistrationId(MvcResult result) throws Exception {
        return ((Number) new JsonPathExpectationsHelper("$.id")
                .evaluateJsonPath(result.getResponse().getContentAsString())).longValue();
    }

    private void addRequiredMedicalDocuments(Horse horse, LocalDate expiryDate) {
        horseDocumentRepository.save(HorseDocument.create(
                horse,
                ownerUser,
                "COGGINS",
                "COG-2026-001",
                LocalDate.now().minusDays(10),
                expiryDate,
                "Saigon Equine Clinic",
                "/uploads/horses/documents/coggins.pdf",
                null
        ));
        horseDocumentRepository.save(HorseDocument.create(
                horse,
                ownerUser,
                "HEALTH_CERTIFICATE",
                "HC-2026-001",
                LocalDate.now().minusDays(10),
                expiryDate,
                "Saigon Equine Clinic",
                "/uploads/horses/documents/health.pdf",
                null
        ));
    }

    private Horse createApprovedOwnerHorse(String name, String registrationCode) {
        return horseRepository.save(Horse.create(
                ownerUser,
                name,
                registrationCode,
                "Thoroughbred",
                "MALE",
                LocalDate.of(2020, 1, 1),
                "Bay"
        ));
    }

    private String registrationBody(Horse horse) {
        return String.format("""
                {
                    "tournamentId": %d,
                    "horseId": %d,
                    "note": "Ready for review"
                }
                """, openTournament.getId(), horse.getId());
    }
}
