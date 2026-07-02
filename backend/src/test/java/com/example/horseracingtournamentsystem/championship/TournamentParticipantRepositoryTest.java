package com.example.horseracingtournamentsystem.championship;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.example.horseracingtournamentsystem.championship.entity.TournamentParticipant;
import com.example.horseracingtournamentsystem.championship.enums.TournamentParticipantStatus;
import com.example.horseracingtournamentsystem.championship.repository.TournamentParticipantRepository;
import com.example.horseracingtournamentsystem.horse.entity.Horse;
import com.example.horseracingtournamentsystem.horse.repository.HorseRepository;
import com.example.horseracingtournamentsystem.tournament.entity.Tournament;
import com.example.horseracingtournamentsystem.tournament.repository.TournamentRepository;
import com.example.horseracingtournamentsystem.tournamentregistration.entity.TournamentRegistration;
import com.example.horseracingtournamentsystem.tournamentregistration.repository.TournamentRegistrationRepository;
import com.example.horseracingtournamentsystem.testsupport.TestDatabaseCleaner;
import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.user.repository.UserRepository;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@SpringBootTest
@Transactional
class TournamentParticipantRepositoryTest {

    @Autowired
    private TournamentParticipantRepository participantRepository;

    @Autowired
    private TournamentRegistrationRepository registrationRepository;

    @Autowired
    private HorseRepository horseRepository;

    @Autowired
    private TournamentRepository tournamentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private User owner;
    private User jockey;
    private User admin;
    private Tournament tournament;
    private Horse horse;
    private TournamentRegistration approvedRegistration;

    @BeforeEach
    void setUp() {
        TestDatabaseCleaner.clean(jdbcTemplate);

        admin = verifiedUser("Admin User", "admin@example.com");
        owner = verifiedUser("Stable Owner", "owner@example.com");
        jockey = verifiedUser("Pool Jockey", "jockey@example.com");

        tournament = Tournament.create(
                "Spring Cup",
                "SPRING_CUP",
                "Championship season",
                "Saigon Track",
                LocalDate.now().plusDays(10),
                LocalDate.now().plusDays(20),
                LocalDateTime.now().minusDays(1),
                LocalDateTime.now().plusDays(5),
                20,
                admin
        );
        tournament.openRegistration();
        tournament = tournamentRepository.save(tournament);

        horse = horseRepository.save(Horse.create(
                owner,
                "Thunder Bolt",
                "TB-001",
                "Thoroughbred",
                "MALE",
                LocalDate.of(2020, 1, 1),
                "Bay"
        ));

        approvedRegistration = TournamentRegistration.pending(tournament, horse, owner, "Ready for championship.");
        approvedRegistration.approve(admin);
        approvedRegistration = registrationRepository.save(approvedRegistration);
    }

    @Test
    void persistsOfficialHorseJockeyPairForChampionship() {
        TournamentParticipant participant = TournamentParticipant.active(approvedRegistration, jockey, 91L);

        TournamentParticipant saved = participantRepository.saveAndFlush(participant);

        assertEquals(TournamentParticipantStatus.ACTIVE, saved.getStatus());
        assertEquals(0, saved.getPoints());
        assertEquals(91L, saved.getJockeyInvitationId());
        assertEquals(tournament.getId(), saved.getTournament().getId());
        assertEquals(approvedRegistration.getId(), saved.getTournamentRegistration().getId());
        assertEquals(horse.getId(), saved.getHorse().getId());
        assertEquals(owner.getId(), saved.getOwner().getId());
        assertEquals(jockey.getId(), saved.getJockey().getId());
        assertTrue(participantRepository.existsByTournament_IdAndHorse_Id(tournament.getId(), horse.getId()));
        assertTrue(participantRepository.existsByTournament_IdAndJockey_Id(tournament.getId(), jockey.getId()));

        List<TournamentParticipant> participants =
                participantRepository.findAllByTournament_IdOrderByCreatedAtDesc(tournament.getId());
        assertEquals(1, participants.size());
        assertEquals(saved.getId(), participants.get(0).getId());
    }

    @Test
    void refusesParticipantCreationFromRegistrationThatIsNotApproved() {
        TournamentRegistration pendingRegistration =
                TournamentRegistration.pending(tournament, horse, owner, "Still waiting for admin review.");

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> TournamentParticipant.active(pendingRegistration, jockey, 92L)
        );

        assertEquals("Only approved horse registrations can become tournament participants", exception.getReason());
    }

    private User verifiedUser(String fullName, String email) {
        User user = User.pending(fullName, email, "hash");
        user.verifyEmail();
        return userRepository.save(user);
    }
}
