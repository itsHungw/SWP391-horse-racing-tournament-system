package com.example.horseracingtournamentsystem.common.enums;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.example.horseracingtournamentsystem.championship.entity.JockeyInvitation;
import com.example.horseracingtournamentsystem.championship.entity.JockeyTournamentApplication;
import com.example.horseracingtournamentsystem.championship.entity.TournamentParticipant;
import com.example.horseracingtournamentsystem.championship.enums.JockeyApplicationStatus;
import com.example.horseracingtournamentsystem.championship.enums.JockeyInvitationStatus;
import com.example.horseracingtournamentsystem.championship.enums.TournamentParticipantStatus;
import com.example.horseracingtournamentsystem.blog.entity.Blog;
import com.example.horseracingtournamentsystem.prediction.entity.PredictionSettlementJob;
import com.example.horseracingtournamentsystem.prediction.entity.RacePrediction;
import com.example.horseracingtournamentsystem.prediction.enums.PredictionSettlementJobStatus;
import com.example.horseracingtournamentsystem.prediction.enums.PredictionStatus;
import com.example.horseracingtournamentsystem.race.entity.Race;
import com.example.horseracingtournamentsystem.race.entity.RaceParticipant;
import com.example.horseracingtournamentsystem.race.enums.ParticipantCheckStatus;
import com.example.horseracingtournamentsystem.race.enums.ParticipantConfirmationStatus;
import com.example.horseracingtournamentsystem.race.enums.ParticipantStatus;
import com.example.horseracingtournamentsystem.race.enums.RaceStatus;
import com.example.horseracingtournamentsystem.result.entity.RaceResult;
import com.example.horseracingtournamentsystem.result.enums.ResultFinishStatus;
import com.example.horseracingtournamentsystem.result.enums.ResultRecordStatus;
import com.example.horseracingtournamentsystem.tournament.entity.Tournament;
import com.example.horseracingtournamentsystem.tournament.enums.TournamentStatus;
import com.example.horseracingtournamentsystem.tournamentregistration.entity.TournamentRegistration;
import com.example.horseracingtournamentsystem.tournamentregistration.enums.RegistrationStatus;
import com.example.horseracingtournamentsystem.user.entity.HorseOwnerProfile;
import com.example.horseracingtournamentsystem.user.entity.RoleRequest;
import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.user.entity.UserRole;
import com.example.horseracingtournamentsystem.user.entity.UserRoleHistory;
import com.example.horseracingtournamentsystem.user.enums.ProfileStatus;
import com.example.horseracingtournamentsystem.user.enums.RoleRequestStatus;
import com.example.horseracingtournamentsystem.user.enums.UserRoleStatus;
import com.example.horseracingtournamentsystem.user.enums.UserStatus;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import java.lang.reflect.Field;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.ObjectMapper;

class EnumStatusContractTest {

    @Test
    void migratedStatusFieldsUseStringBackedEnums() throws Exception {
        assertStringEnumField(User.class, "status", UserStatus.class);
        assertStringEnumField(UserRole.class, "status", UserRoleStatus.class);
        assertStringEnumField(UserRoleHistory.class, "oldStatus", UserRoleStatus.class);
        assertStringEnumField(UserRoleHistory.class, "newStatus", UserRoleStatus.class);
        assertStringEnumField(RoleRequest.class, "status", RoleRequestStatus.class);
        assertStringEnumField(HorseOwnerProfile.class, "status", ProfileStatus.class);
        assertStringEnumField(Tournament.class, "status", TournamentStatus.class);
        assertStringEnumField(TournamentRegistration.class, "status", RegistrationStatus.class);
        assertStringEnumField(JockeyTournamentApplication.class, "status", JockeyApplicationStatus.class);
        assertStringEnumField(JockeyInvitation.class, "status", JockeyInvitationStatus.class);
        assertStringEnumField(TournamentParticipant.class, "status", TournamentParticipantStatus.class);
        assertStringEnumField(Race.class, "status", RaceStatus.class);
        assertStringEnumField(RaceParticipant.class, "checkStatus", ParticipantCheckStatus.class);
        assertStringEnumField(RaceParticipant.class, "confirmationStatus", ParticipantConfirmationStatus.class);
        assertStringEnumField(RaceParticipant.class, "status", ParticipantStatus.class);
        assertStringEnumField(RaceResult.class, "resultStatus", ResultFinishStatus.class);
        assertStringEnumField(RaceResult.class, "status", ResultRecordStatus.class);
        assertStringEnumField(RacePrediction.class, "status", PredictionStatus.class);
        assertStringEnumField(PredictionSettlementJob.class, "status", PredictionSettlementJobStatus.class);
    }

    @Test
    void statusEnumsKeepTheExistingJsonStringContract() throws Exception {
        ObjectMapper objectMapper = new ObjectMapper();

        assertEquals("\"ACTIVE\"", objectMapper.writeValueAsString(UserStatus.ACTIVE));
        assertEquals("\"SCHEDULE_PUBLISHED\"", objectMapper.writeValueAsString(TournamentStatus.SCHEDULE_PUBLISHED));
        assertEquals("\"RESULT_CONFIRMED\"", objectMapper.writeValueAsString(RaceStatus.RESULT_CONFIRMED));
        assertEquals("\"REFUNDED\"", objectMapper.writeValueAsString(PredictionStatus.REFUNDED));
    }

    @Test
    void cleanupMigrationUsesOnlyPersistableTournamentStatuses() throws Exception {
        try (var input = getClass().getClassLoader()
                .getResourceAsStream("db/migration/V6__cleanup_enum_statuses.sql")) {
            assertNotNull(input, "V6 enum cleanup migration must be packaged");
            String migration = new String(input.readAllBytes(), StandardCharsets.UTF_8);

            assertFalse(migration.contains("SET status = 'UPCOMING'"));
            assertTrue(migration.contains("SET status = 'SCHEDULE_PUBLISHED'"));
            assertTrue(migration.contains("SET status = 'PARTICIPANTS_LOCKED'"));
            assertTrue(migration.contains("Unsupported tournaments.status value for TournamentStatus"));
        }
    }

    @Test
    void currentStatusValidationMigrationAllowsOrganizerApprovalStatuses() throws Exception {
        try (var input = getClass().getClassLoader()
                .getResourceAsStream("db/migration/V19__validate_current_status_enums.sql")) {
            assertNotNull(input, "V19 current status validation migration must be packaged");
            String migration = new String(input.readAllBytes(), StandardCharsets.UTF_8);

            assertTrue(migration.contains("'PENDING_APPROVAL'"));
            assertTrue(migration.contains("'APPROVED'"));
            assertTrue(migration.contains("Unsupported tournaments.status value for TournamentStatus"));
        }
    }

    @Test
    void blogContentMappingDoesNotUseSqlServerColumnDefinition() throws Exception {
        Field content = Blog.class.getDeclaredField("content");
        jakarta.persistence.Column column = content.getAnnotation(jakarta.persistence.Column.class);

        assertNotNull(column, "Blog.content must declare its database column");
        assertFalse(column.columnDefinition().toUpperCase(java.util.Locale.ROOT).contains("NVARCHAR"));
    }

    @Test
    void cleanupMigrationNormalizesLegacyApprovedJockeyApplications() throws Exception {
        try (var input = getClass().getClassLoader()
                .getResourceAsStream("db/migration/V6__cleanup_enum_statuses.sql")) {
            assertNotNull(input, "V6 enum cleanup migration must be packaged");
            String migration = new String(input.readAllBytes(), StandardCharsets.UTF_8);

            assertTrue(migration.contains("SET status = 'APPROVED_FOR_POOL'"));
            assertTrue(migration.contains("WHERE status = 'APPROVED'"));
            assertTrue(migration.contains("SET check_status = 'NOT_CHECKED'"));
            assertTrue(migration.contains("WHERE check_status = 'PENDING'"));
        }
    }

    @Test
    void demoSeedUsesCanonicalStatusesAndHasOneTransactionEnvelope() throws Exception {
        Path demoSeed = findRepositoryFile("demo_data_script.sql");
        String sql = Files.readString(demoSeed, StandardCharsets.UTF_8);

        assertTrue(sql.contains("DO $$"));
        assertTrue(sql.contains("BEGIN"));
        assertTrue(sql.contains("END $$;"));
        assertFalse(sql.contains("SCHEDULED_PUBLIC"));
        assertFalse(sql.contains("SCHEDULED_PRIVATE"));
        assertTrue(sql.contains("'SCHEDULE_PUBLISHED'"));
        assertTrue(sql.contains("'SCHEDULED'"));

        String jockeyApplications = sql.substring(
                sql.indexOf("INSERT INTO jockey_tournament_applications("),
                sql.indexOf("INSERT INTO jockey_invitations("));
        assertFalse(jockeyApplications.contains("'APPROVED'"));
        assertTrue(jockeyApplications.contains("'APPROVED_FOR_POOL'"));

        // Neo vào "13. BLOG" chứ không phải tiêu đề dài: section 13 từng tên là
        // "13. BLOG + SPECTATOR PREDICTION DEMO", nay seed không tạo prediction nữa nên
        // phần đó đã bỏ. Anchor ngắn khớp cả hai, và indexOf trả -1 sẽ làm substring nổ
        // ngay thay vì âm thầm bỏ qua assert.
        int raceParticipantsStart = sql.indexOf("INSERT INTO race_participants(");
        int blogSectionStart = sql.indexOf("13. BLOG");
        assertTrue(raceParticipantsStart >= 0, "seed phai co INSERT INTO race_participants(");
        assertTrue(blogSectionStart > raceParticipantsStart, "seed phai co section 13. BLOG sau section 12");

        String raceParticipants = sql.substring(raceParticipantsStart, blogSectionStart);
        assertFalse(raceParticipants.contains("'PENDING'"));
        assertTrue(raceParticipants.contains("'NOT_CHECKED'"));

        // Seed không được tạo tiền: số dư không có topup_orders hay hành động admin nào
        // đối chiếu thì lịch sử giao dịch không dựng lại được số dư.
        assertFalse(sql.contains("INSERT INTO wallets("), "seed khong duoc tao vi");
        assertFalse(sql.contains("INSERT INTO wallet_transactions("), "seed khong duoc tao giao dich vi");
        assertFalse(sql.contains("INSERT INTO race_predictions("), "seed khong duoc tao du doan (moi du doan la mot lenh tru tien)");
        assertFalse(sql.contains("INSERT INTO prediction_settlement_jobs("), "seed khong duoc tao settlement job");
    }

    private void assertStringEnumField(Class<?> entityType, String fieldName, Class<? extends Enum<?>> enumType)
            throws NoSuchFieldException {
        Field field = entityType.getDeclaredField(fieldName);
        Enumerated enumerated = field.getAnnotation(Enumerated.class);

        assertEquals(enumType, field.getType(), entityType.getSimpleName() + "." + fieldName + " must be typed");
        assertNotNull(enumerated, entityType.getSimpleName() + "." + fieldName + " must declare @Enumerated");
        assertEquals(EnumType.STRING, enumerated.value(), entityType.getSimpleName() + "." + fieldName);
    }

    private Path findRepositoryFile(String fileName) {
        Path workingDirectory = Path.of(System.getProperty("user.dir")).toAbsolutePath().normalize();
        for (Path candidate : new Path[] {
                workingDirectory.resolve(fileName),
                workingDirectory.resolve("..").resolve(fileName).normalize()
        }) {
            if (Files.isRegularFile(candidate)) {
                return candidate;
            }
        }
        throw new AssertionError("Repository file not found: " + fileName);
    }

    private int occurrences(String value, String token) {
        return value.split(java.util.regex.Pattern.quote(token), -1).length - 1;
    }
}
