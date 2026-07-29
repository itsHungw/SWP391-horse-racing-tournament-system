package com.example.horseracingtournamentsystem.race;

import static org.assertj.core.api.Assertions.assertThat;

import com.example.horseracingtournamentsystem.championship.entity.TournamentParticipant;
import com.example.horseracingtournamentsystem.championship.repository.TournamentParticipantRepository;
import com.example.horseracingtournamentsystem.horse.entity.Horse;
import com.example.horseracingtournamentsystem.horse.repository.HorseRepository;
import com.example.horseracingtournamentsystem.race.entity.Race;
import com.example.horseracingtournamentsystem.race.entity.RaceParticipant;
import com.example.horseracingtournamentsystem.race.enums.ParticipantStatus;
import com.example.horseracingtournamentsystem.race.repository.RaceParticipantRepository;
import com.example.horseracingtournamentsystem.race.repository.RaceRepository;
import com.example.horseracingtournamentsystem.tournament.entity.Tournament;
import com.example.horseracingtournamentsystem.tournament.repository.TournamentRepository;
import com.example.horseracingtournamentsystem.tournamentregistration.entity.TournamentRegistration;
import com.example.horseracingtournamentsystem.tournamentregistration.repository.TournamentRegistrationRepository;
import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.user.repository.UserRepository;
import jakarta.persistence.EntityManager;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

/**
 * Thứ tự runner phải xác định và theo lane, không theo thứ tự chèn.
 *
 * Bug gốc: repository sắp theo created_at. Participant của một race được tạo trong cùng
 * một transaction nên mọi created_at bằng nhau, khiến ORDER BY thành no-op và DB trả về
 * theo thứ tự heap — thứ tự này đổi mỗi lần UPDATE một dòng, nên runner table lộn xộn dần.
 * Test dựng lại đúng điều kiện đó: chèn cùng transaction, gán lane ngược thứ tự chèn.
 */
@SpringBootTest
@Transactional
class RaceParticipantOrderingIntegrationTest {

    @Autowired
    private RaceRepository raceRepository;

    @Autowired
    private RaceParticipantRepository raceParticipantRepository;

    @Autowired
    private TournamentRepository tournamentRepository;

    @Autowired
    private TournamentRegistrationRepository tournamentRegistrationRepository;

    @Autowired
    private TournamentParticipantRepository tournamentParticipantRepository;

    @Autowired
    private HorseRepository horseRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private EntityManager entityManager;

    private User adminUser;
    private Race race;

    @BeforeEach
    void setUp() {
        raceRepository.deleteAll();
        tournamentRepository.deleteAll();
        userRepository.deleteAll();

        adminUser = User.pending("Admin User", "ordering-admin@example.com", "hash");
        adminUser.verifyEmail();
        adminUser = userRepository.save(adminUser);

        Tournament tournament = tournamentRepository.save(Tournament.create(
                "Ordering Cup", "ORDERING_CUP", "Ordering Cup Desc", "Tracks",
                LocalDate.now(), LocalDate.now().plusDays(10),
                LocalDateTime.now(), LocalDateTime.now().plusDays(2),
                20, adminUser
        ));

        race = raceRepository.save(Race.create(
                tournament, "Ordering Sprint", "ORDERING_SPRINT",
                LocalDateTime.now().plusDays(2), 1200, 12, adminUser
        ));
    }

    @Test
    void returnsParticipantsInLaneOrderNotInsertionOrder() {
        // Chèn 4 participant trong cùng transaction -> created_at bằng nhau.
        RaceParticipant first = createParticipant("Alpha", "ORD-ALPHA");
        RaceParticipant second = createParticipant("Bravo", "ORD-BRAVO");
        RaceParticipant third = createParticipant("Charlie", "ORD-CHARLIE");
        RaceParticipant fourth = createParticipant("Delta", "ORD-DELTA");

        // Lane ngược thứ tự chèn: nếu query sắp theo created_at/id thì kết quả sẽ ra 4,3,2,1.
        assignLane(first, 4);
        assignLane(second, 3);
        assignLane(third, 2);
        assignLane(fourth, 1);

        assertThat(lanesOf(raceParticipantRepository.findAllByRaceOrderByLane(race.getId())))
                .containsExactly(1, 2, 3, 4);

        assertThat(lanesOf(raceParticipantRepository.findAllByRaceAndStatusNotOrderByLane(
                race.getId(), ParticipantStatus.WITHDRAWN)))
                .containsExactly(1, 2, 3, 4);
    }

    @Test
    void fallsBackToIdOrderWhenLaneNotAssigned() {
        // Không có gì trong app ghi lane_number, nên dữ liệu thật luôn để trống cột này.
        // Khi đó thứ tự phải rơi về id tăng dần — ổn định, không đổi khi UPDATE dòng.
        RaceParticipant first = createParticipant("Echo", "ORD-ECHO");
        RaceParticipant second = createParticipant("Foxtrot", "ORD-FOXTROT");
        RaceParticipant third = createParticipant("Golf", "ORD-GOLF");

        // Sửa một dòng ở giữa: với ORDER BY created_at cũ, Postgres dời dòng này về cuối heap.
        jdbcTemplate.update("UPDATE race_participants SET check_note = ? WHERE id = ?",
                "touched", second.getId());
        entityManager.clear();

        assertThat(raceParticipantRepository.findAllByRaceOrderByLane(race.getId()))
                .extracting(RaceParticipant::getId)
                .containsExactly(first.getId(), second.getId(), third.getId());
    }

    private List<Integer> lanesOf(List<RaceParticipant> participants) {
        return participants.stream().map(RaceParticipant::getLaneNumber).toList();
    }

    /** lane_number không có setter trên entity (app chưa có tính năng gán số áo). */
    private void assignLane(RaceParticipant participant, int lane) {
        entityManager.flush();
        jdbcTemplate.update("UPDATE race_participants SET lane_number = ? WHERE id = ?",
                lane, participant.getId());
        entityManager.clear();
    }

    private RaceParticipant createParticipant(String horseName, String registrationCode) {
        User jockey = User.pending(
                registrationCode + " Jockey", registrationCode.toLowerCase() + "@example.com", "hash");
        jockey.verifyEmail();
        jockey = userRepository.save(jockey);

        Horse horse = horseRepository.save(Horse.create(
                adminUser, horseName, registrationCode, "Thoroughbred", "MALE",
                LocalDate.now().minusYears(5), "Bay"
        ));

        TournamentRegistration registration =
                TournamentRegistration.pending(race.getTournament(), horse, adminUser, "Ready");
        registration.approve(adminUser);
        registration = tournamentRegistrationRepository.save(registration);

        TournamentParticipant tournamentParticipant = tournamentParticipantRepository.save(
                TournamentParticipant.active(registration, jockey, null)
        );

        return raceParticipantRepository.save(RaceParticipant.registered(race, tournamentParticipant, null));
    }
}
