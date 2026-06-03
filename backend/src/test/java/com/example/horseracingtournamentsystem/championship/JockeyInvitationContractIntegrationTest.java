package com.example.horseracingtournamentsystem.championship;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.horseracingtournamentsystem.championship.entity.JockeyTournamentApplication;
import com.example.horseracingtournamentsystem.championship.repository.JockeyInvitationRepository;
import com.example.horseracingtournamentsystem.championship.repository.JockeyTournamentApplicationRepository;
import com.example.horseracingtournamentsystem.championship.repository.TournamentParticipantRepository;
import com.example.horseracingtournamentsystem.horse.entity.Horse;
import com.example.horseracingtournamentsystem.horse.repository.HorseRepository;
import com.example.horseracingtournamentsystem.security.JwtService;
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
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class JockeyInvitationContractIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private TournamentParticipantRepository participantRepository;

    @Autowired
    private JockeyInvitationRepository invitationRepository;

    @Autowired
    private JockeyTournamentApplicationRepository jockeyApplicationRepository;

    @Autowired
    private TournamentRegistrationRepository registrationRepository;

    @Autowired
    private HorseRepository horseRepository;

    @Autowired
    private TournamentRepository tournamentRepository;

    @Autowired
    private UserRoleRepository userRoleRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRepository userRepository;

    private String adminToken;
    private String ownerToken;
    private String jockeyToken;
    private User admin;
    private User owner;
    private User jockey;
    private Tournament tournament;
    private Horse horse;
    private TournamentRegistration approvedRegistration;
    private TournamentRegistration pendingRegistration;
    private JockeyTournamentApplication approvedJockeyApplication;

    @BeforeEach
    void setUp() {
        participantRepository.deleteAll();
        invitationRepository.deleteAll();
        jockeyApplicationRepository.deleteAll();
        registrationRepository.deleteAll();
        horseRepository.deleteAll();
        tournamentRepository.deleteAll();
        userRoleRepository.deleteAll();
        roleRepository.deleteAll();
        userRepository.deleteAll();

        Role adminRole = roleRepository.save(Role.of("ADMIN", "Admin"));
        Role ownerRole = roleRepository.save(Role.of("HORSE_OWNER", "Horse Owner"));
        Role jockeyRole = roleRepository.save(Role.of("JOCKEY", "Jockey"));

        admin = verifiedUser("Admin User", "admin@example.com");
        owner = verifiedUser("Sunrise Stable", "owner@example.com");
        jockey = verifiedUser("Nguyen Van A", "jockey@example.com");

        userRoleRepository.save(UserRole.active(admin, adminRole, admin));
        userRoleRepository.save(UserRole.active(owner, ownerRole, admin));
        userRoleRepository.save(UserRole.active(jockey, jockeyRole, admin));

        tournament = Tournament.create(
                "Spring Cup 2026",
                "SPRING_2026",
                "Championship assignment season",
                "Belmont Park",
                LocalDate.now().plusDays(10),
                LocalDate.now().plusDays(40),
                LocalDateTime.now().minusDays(2),
                LocalDateTime.now().plusDays(2),
                20,
                admin
        );
        tournament.openRegistration();
        tournament = tournamentRepository.save(tournament);

        horse = horseRepository.save(Horse.create(
                owner,
                "Thunder Bolt",
                "TB-2026",
                "Thoroughbred",
                "MALE",
                LocalDate.of(2020, 1, 1),
                "Bay"
        ));

        approvedRegistration = TournamentRegistration.pending(tournament, horse, owner, "Ready.");
        approvedRegistration.approve(admin);
        approvedRegistration = registrationRepository.save(approvedRegistration);

        pendingRegistration = registrationRepository.save(
                TournamentRegistration.pending(tournament, horse, owner, "Still pending.")
        );

        approvedJockeyApplication = JockeyTournamentApplication.pending(tournament, jockey, "Available all season.");
        approvedJockeyApplication.approve(admin);
        approvedJockeyApplication = jockeyApplicationRepository.save(approvedJockeyApplication);

        adminToken = jwtService.generateToken(admin.getEmail(), Set.of("ADMIN"));
        ownerToken = jwtService.generateToken(owner.getEmail(), Set.of("HORSE_OWNER"));
        jockeyToken = jwtService.generateToken(jockey.getEmail(), Set.of("JOCKEY"));
    }

    @Test
    void ownerSendsChampionshipAssignmentContractToApprovedPoolJockey() throws Exception {
        mockMvc.perform(post("/api/v1/owner/championships/{id}/contracts", tournament.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(contractBody(approvedRegistration, approvedJockeyApplication)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.championshipId").value(tournament.getId()))
                .andExpect(jsonPath("$.horseRegistrationId").value(approvedRegistration.getId()))
                .andExpect(jsonPath("$.horseName").value("Thunder Bolt"))
                .andExpect(jsonPath("$.ownerName").value("Sunrise Stable"))
                .andExpect(jsonPath("$.jockeyName").value("Nguyen Van A"))
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.message").value("We would like you to ride Thunder Bolt."))
                .andExpect(jsonPath("$.agreementUrl").value("https://cdn.example.com/contracts/spring.pdf"))
                .andExpect(jsonPath("$.agreementFileName").value("spring-assignment.pdf"));
    }

    @Test
    void ownerCannotSendContractForHorseRegistrationThatIsNotApproved() throws Exception {
        mockMvc.perform(post("/api/v1/owner/championships/{id}/contracts", tournament.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(contractBody(pendingRegistration, approvedJockeyApplication)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Horse registration must be approved before sending a contract"));
    }

    @Test
    void jockeyReviewsAndAcceptsContractFromInbox() throws Exception {
        long contractId = createContract();

        mockMvc.perform(get("/api/v1/jockey/contracts")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + jockeyToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(contractId))
                .andExpect(jsonPath("$[0].status").value("PENDING"))
                .andExpect(jsonPath("$[0].championshipName").value("Spring Cup 2026"))
                .andExpect(jsonPath("$[0].horseName").value("Thunder Bolt"));

        mockMvc.perform(post("/api/v1/jockey/contracts/{id}/accept", contractId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + jockeyToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACCEPTED"))
                .andExpect(jsonPath("$.acceptedAt").exists());

        assertTrue(participantRepository.findAllByTournament_IdOrderByCreatedAtDesc(tournament.getId()).isEmpty());
    }

    @Test
    void jockeyRejectsContractWithReason() throws Exception {
        long contractId = createContract();

        mockMvc.perform(post("/api/v1/jockey/contracts/{id}/reject", contractId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + jockeyToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"Schedule conflict.\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("REJECTED"))
                .andExpect(jsonPath("$.rejectionReason").value("Schedule conflict."))
                .andExpect(jsonPath("$.rejectedAt").exists());
    }

    @Test
    void adminLocksAcceptedContractsIntoOfficialParticipants() throws Exception {
        long contractId = createContract();
        mockMvc.perform(post("/api/v1/jockey/contracts/{id}/accept", contractId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + jockeyToken))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/admin/championships/{id}/lock-participants", tournament.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.championshipId").value(tournament.getId()))
                .andExpect(jsonPath("$.createdParticipants").value(1));

        assertTrue(participantRepository.existsByTournament_IdAndHorse_Id(tournament.getId(), horse.getId()));
        assertTrue(participantRepository.existsByTournament_IdAndJockey_Id(tournament.getId(), jockey.getId()));
    }

    private long createContract() throws Exception {
        String json = mockMvc.perform(post("/api/v1/owner/championships/{id}/contracts", tournament.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(contractBody(approvedRegistration, approvedJockeyApplication)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();

        return Long.parseLong(json.replaceAll(".*\"id\":(\\d+).*", "$1"));
    }

    private String contractBody(TournamentRegistration registration, JockeyTournamentApplication application) {
        return """
                {
                  "horseRegistrationId": %d,
                  "jockeyApplicationId": %d,
                  "message": "We would like you to ride Thunder Bolt.",
                  "agreementUrl": "https://cdn.example.com/contracts/spring.pdf",
                  "agreementFileName": "spring-assignment.pdf"
                }
                """.formatted(registration.getId(), application.getId());
    }

    private User verifiedUser(String fullName, String email) {
        User user = User.pending(fullName, email, "hash");
        user.verifyEmail();
        return userRepository.save(user);
    }
}
