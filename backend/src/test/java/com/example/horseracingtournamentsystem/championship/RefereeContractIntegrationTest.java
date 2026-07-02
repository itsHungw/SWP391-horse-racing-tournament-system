package com.example.horseracingtournamentsystem.championship;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.horseracingtournamentsystem.championship.entity.RefereeContract;
import com.example.horseracingtournamentsystem.championship.repository.RefereeContractRepository;
import com.example.horseracingtournamentsystem.horse.entity.Horse;
import com.example.horseracingtournamentsystem.horse.repository.HorseRepository;
import com.example.horseracingtournamentsystem.organization.entity.Organization;
import com.example.horseracingtournamentsystem.organization.repository.OrganizationRepository;
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
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class RefereeContractIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private RefereeContractRepository refereeContractRepository;

    @Autowired
    private TournamentRegistrationRepository registrationRepository;

    @Autowired
    private HorseRepository horseRepository;

    @Autowired
    private TournamentRepository tournamentRepository;

    @Autowired
    private OrganizationRepository organizationRepository;

    @Autowired
    private UserRoleRepository userRoleRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRepository userRepository;

    private User admin;
    private User organizer;
    private User referee;
    private Tournament tournament;
    private String refereeToken;

    @BeforeEach
    void setUp() {
        TestDatabaseCleaner.clean(jdbcTemplate);
        refereeContractRepository.deleteAll();
        registrationRepository.deleteAll();
        horseRepository.deleteAll();
        tournamentRepository.deleteAll();
        organizationRepository.deleteAll();
        userRoleRepository.deleteAll();
        roleRepository.deleteAll();
        userRepository.deleteAll();

        Role adminRole = roleRepository.save(Role.of("ADMIN", "Admin"));
        Role organizerRole = roleRepository.save(Role.of("ORGANIZER", "Organizer"));
        Role refereeRole = roleRepository.save(Role.of("REFEREE", "Referee"));
        Role ownerRole = roleRepository.save(Role.of("HORSE_OWNER", "Horse owner"));

        admin = verifiedUser("Admin User", "admin-ref-contract@example.com");
        organizer = verifiedUser("Organizer User", "organizer-ref-contract@example.com");
        referee = verifiedUser("Dual Role Referee", "referee-contract@example.com");

        userRoleRepository.save(UserRole.active(admin, adminRole, admin));
        userRoleRepository.save(UserRole.active(organizer, organizerRole, admin));
        userRoleRepository.save(UserRole.active(referee, refereeRole, admin));
        userRoleRepository.save(UserRole.active(referee, ownerRole, admin));

        Organization organization = Organization.application(
                organizer,
                "ORG_REF_CONTRACT",
                "Referee Contract Org",
                "LIC-REF-1",
                "org@example.com",
                "0909000000",
                "Licensed organizer",
                "/files/org.pdf",
                null,
                "Ready for review"
        );
        organization.approve(admin);
        organization = organizationRepository.save(organization);

        tournament = Tournament.create(
                "Referee Contract Cup",
                "REF_CONTRACT_CUP",
                "Contract test tournament",
                "Saigon Track",
                LocalDate.now().plusDays(10),
                LocalDate.now().plusDays(20),
                LocalDateTime.now().minusDays(1),
                LocalDateTime.now().plusDays(5),
                20,
                organizer
        );
        tournament.assignOrganization(organization);
        tournament.openRegistration();
        tournament = tournamentRepository.save(tournament);

        refereeToken = jwtService.generateToken(referee.getEmail(), Set.of("REFEREE", "HORSE_OWNER"));
    }

    @Test
    void refereeCannotAcceptContractWhenAlreadyParticipatingAsOwnerInSameTournament() throws Exception {
        Horse horse = horseRepository.save(Horse.create(
                referee,
                "Conflict Horse",
                "REF_CONFLICT_HORSE",
                "Thoroughbred",
                "MALE",
                LocalDate.of(2020, 1, 1),
                "Bay"
        ));
        registrationRepository.save(TournamentRegistration.pending(tournament, horse, referee, "Owner entry."));
        RefereeContract contract = refereeContractRepository.save(RefereeContract.invite(
                tournament,
                referee,
                organizer,
                null,
                "Please officiate this tournament."
        ));

        mockMvc.perform(post("/api/v1/referee/contracts/{id}/accept", contract.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + refereeToken))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value(
                        "You are already participating in this tournament as HORSE_OWNER. "
                                + "Use that dashboard or leave that participation before joining with another role."));
    }

    private User verifiedUser(String fullName, String email) {
        User user = User.pending(fullName, email, "hash");
        user.verifyEmail();
        return userRepository.save(user);
    }
}
