/*
    HORSE RACING TOURNAMENT SYSTEM - FULL DEMO DATA
    SQL Server

    Dữ liệu chính:
    - 01 ADMIN
    - 01 REFEREE
    - 01 SPECTATOR
    - 08 HORSE_OWNER
    - 08 JOCKEY
    - Mỗi owner có đúng 01 horse
    - 02 tournaments
    - Mỗi tournament có 08 tournament participants
    - Mỗi tournament có 08 races
    - Mỗi race có đủ 08 race participants
    - Tournament và Race dùng status = SCHEDULED_PUBLIC

    Mật khẩu mẫu cho toàn bộ tài khoản:
    BCrypt: $2a$10$w81.mS.iJ5d3iXbN8/3Y.eml8yO./c1N2.h3nN5x/6Z.K1Z/O5Y7S

    LƯU Ý:
    - Chạy file schema tạo bảng trước, sau đó mới chạy script này.
    - Script dành cho database mới hoặc database chưa có các email/code bên dưới.
*/

SET NOCOUNT ON;
SET XACT_ABORT ON;

BEGIN TRY
    BEGIN TRANSACTION;

    DECLARE @Now DATETIME2(7) = SYSDATETIME();
    DECLARE @PasswordHash VARCHAR(255) = '$2a$12$72ymaJnr3b8PMdt9m6XyAuYCi2zHwIl0.vmjydB0XH1Gdl4m5Ffzm';

    /* ================================================================
       1. ROLES
       ================================================================ */
    INSERT INTO roles(name, description)
    SELECT v.name, v.description
    FROM (VALUES
        ('ADMIN',       'Administrator'),/*
    HORSE RACING TOURNAMENT SYSTEM - FULL DEMO DATA
    SQL Server

    Dữ liệu chính:
    - 01 ADMIN
    - 01 REFEREE
    - 01 SPECTATOR
    - 08 HORSE_OWNER
    - 08 JOCKEY
    - Mỗi owner có đúng 01 horse
    - 02 tournaments
    - Mỗi tournament có 08 tournament participants
    - Mỗi tournament có 08 races
    - Mỗi race có đủ 08 race participants
    - Tournament và Race dùng status = SCHEDULED_PUBLIC

    Mật khẩu mẫu cho toàn bộ tài khoản:
    BCrypt: $2a$10$w81.mS.iJ5d3iXbN8/3Y.eml8yO./c1N2.h3nN5x/6Z.K1Z/O5Y7S

    LƯU Ý:
    - Chạy file schema tạo bảng trước, sau đó mới chạy script này.
    - Script dành cho database mới hoặc database chưa có các email/code bên dưới.
*/

SET NOCOUNT ON;
SET XACT_ABORT ON;

BEGIN TRY
    BEGIN TRANSACTION;

    DECLARE @Now DATETIME2(7) = SYSDATETIME();
    DECLARE @PasswordHash VARCHAR(255) = '$2a$10$w81.mS.iJ5d3iXbN8/3Y.eml8yO./c1N2.h3nN5x/6Z.K1Z/O5Y7S';

    /* ================================================================
       1. ROLES
       ================================================================ */
    INSERT INTO roles(name, description)
    SELECT v.name, v.description
    FROM (VALUES
        ('ADMIN',       'Administrator'),
        ('HORSE_OWNER', 'Horse owner'),
        ('JOCKEY',      'Jockey'),
        ('REFEREE',     'Race referee'),
        ('SPECTATOR',   'Spectator')
    ) v(name, description)
    WHERE NOT EXISTS (
        SELECT 1 FROM roles r WHERE r.name = v.name
    );

    /* ================================================================
       2. USERS
       ================================================================ */
    INSERT INTO users(
        age_verified, date_of_birth, email_verified, phone_verified,
        profile_completed, created_at, updated_at, gender, phone,
        status, email, full_name, avatar_url, address, password_hash
    )
    VALUES
    (1, '1990-01-15', 1, 1, 1, @Now, @Now, 'MALE',   '0901000001', 'ACTIVE', 'admin@horseracing.com',     N'Alexander Sterling',     NULL, N'London, United Kingdom', @PasswordHash),
    (1, '1985-04-20', 1, 1, 1, @Now, @Now, 'MALE',   '0901000002', 'ACTIVE', 'referee@horseracing.com',   N'Jonathan Whitmore',  NULL, N'London, United Kingdom', @PasswordHash),
    (1, '2000-09-12', 1, 1, 1, @Now, @Now, 'FEMALE', '0901000003', 'ACTIVE', 'spectator@horseracing.com', N'Sophia Bennett',    NULL, N'London, United Kingdom', @PasswordHash),

    (1, '1982-02-01', 1, 1, 1, @Now, @Now, 'MALE',   '0912000001', 'ACTIVE', 'owner1@gmail.com', N'Oliver Kensington', NULL, N'Mayfair, London', @PasswordHash),
    (1, '1984-03-02', 1, 1, 1, @Now, @Now, 'FEMALE', '0912000002', 'ACTIVE', 'owner2@gmail.com', N'Charlotte Beaumont',   NULL, N'Nice, France', @PasswordHash),
    (1, '1981-04-03', 1, 1, 1, @Now, @Now, 'MALE',   '0912000003', 'ACTIVE', 'owner3@gmail.com', N'William Harrington',  NULL, N'Dublin, Ireland', @PasswordHash),
    (1, '1986-05-04', 1, 1, 1, @Now, @Now, 'FEMALE', '0912000004', 'ACTIVE', 'owner4@gmail.com', N'Isabella Montgomery', NULL, N'Madrid, Spain', @PasswordHash),
    (1, '1983-06-05', 1, 1, 1, @Now, @Now, 'MALE',   '0912000005', 'ACTIVE', 'owner5@gmail.com', N'Henry Caldwell',   NULL, N'Florence, Italy', @PasswordHash),
    (1, '1987-07-06', 1, 1, 1, @Now, @Now, 'FEMALE', '0912000006', 'ACTIVE', 'owner6@gmail.com', N'Amelia Sinclair',  NULL, N'Edinburgh, Scotland', @PasswordHash),
    (1, '1980-08-07', 1, 1, 1, @Now, @Now, 'MALE',   '0912000007', 'ACTIVE', 'owner7@gmail.com', N'Edward Kingsley',  NULL, N'Vienna, Austria', @PasswordHash),
    (1, '1988-09-08', 1, 1, 1, @Now, @Now, 'FEMALE', '0912000008', 'ACTIVE', 'owner8@gmail.com', N'Victoria Ashford',  NULL, N'Geneva, Switzerland', @PasswordHash),

    (1, '1996-01-11', 1, 1, 1, @Now, @Now, 'MALE',   '0923000001', 'ACTIVE', 'jockey1@gmail.com', N'Liam Carter',  NULL, N'Newmarket, United Kingdom', @PasswordHash),
    (1, '1997-02-12', 1, 1, 1, @Now, @Now, 'FEMALE', '0923000002', 'ACTIVE', 'jockey2@gmail.com', N'Emma Collins', NULL, N'Newmarket, United Kingdom', @PasswordHash),
    (1, '1995-03-13', 1, 1, 1, @Now, @Now, 'MALE',   '0923000003', 'ACTIVE', 'jockey3@gmail.com', N'Noah Bennett',NULL, N'Newmarket, United Kingdom', @PasswordHash),
    (1, '1998-04-14', 1, 1, 1, @Now, @Now, 'FEMALE', '0923000004', 'ACTIVE', 'jockey4@gmail.com', N'Olivia Hayes',    NULL, N'Newmarket, United Kingdom', @PasswordHash),
    (1, '1994-05-15', 1, 1, 1, @Now, @Now, 'MALE',   '0923000005', 'ACTIVE', 'jockey5@gmail.com', N'Ethan Brooks',   NULL, N'Newmarket, United Kingdom', @PasswordHash),
    (1, '1999-06-16', 1, 1, 1, @Now, @Now, 'FEMALE', '0923000006', 'ACTIVE', 'jockey6@gmail.com', N'Ava Richardson', NULL, N'Newmarket, United Kingdom', @PasswordHash),
    (1, '1993-07-17', 1, 1, 1, @Now, @Now, 'MALE',   '0923000007', 'ACTIVE', 'jockey7@gmail.com', N'Lucas Morgan', NULL, N'Newmarket, United Kingdom', @PasswordHash),
    (1, '1996-08-18', 1, 1, 1, @Now, @Now, 'FEMALE', '0923000008', 'ACTIVE', 'jockey8@gmail.com', N'Mia Thompson',   NULL, N'Newmarket, United Kingdom', @PasswordHash);

    DECLARE @AdminId BIGINT = (SELECT id FROM users WHERE email = 'admin@horseracing.com');
    DECLARE @RefereeId BIGINT = (SELECT id FROM users WHERE email = 'referee@horseracing.com');
    DECLARE @SpectatorId BIGINT = (SELECT id FROM users WHERE email = 'spectator@horseracing.com');

    /* ================================================================
       3. USER ROLES
       ================================================================ */
    INSERT INTO user_roles(user_id, role_id, status, assigned_at, assigned_by)
    SELECT u.id, r.id, 'ACTIVE', @Now, @AdminId
    FROM users u
    JOIN roles r ON
        (u.email = 'admin@horseracing.com'     AND r.name = 'ADMIN') OR
        (u.email = 'referee@horseracing.com'   AND r.name = 'REFEREE') OR
        (u.email = 'spectator@horseracing.com' AND r.name = 'SPECTATOR') OR
        (u.email LIKE 'owner%@gmail.com'        AND r.name = 'HORSE_OWNER') OR
        (u.email LIKE 'jockey%@gmail.com'       AND r.name = 'JOCKEY');

    INSERT INTO user_role_history(
        user_role_id, old_status, new_status, changed_at, changed_by, reason
    )
    SELECT ur.id, NULL, 'ACTIVE', @Now, @AdminId, N'Initial international demo dataset'
    FROM user_roles ur;

    /* ================================================================
       4. OWNER PROFILES
       ================================================================ */
    INSERT INTO horse_owner_profiles(
        experience_years, approved_at, approved_by, created_at, updated_at,
        user_id, contact_phone, status, license_number, contact_email,
        organization_name, owner_name, stable_name, evidence_url, logo_url,
        bio, contact_address, description, rejection_reason
    )
    SELECT
        5 + p.rn,
        @Now,
        @AdminId,
        @Now,
        @Now,
        p.owner_id,
        u.phone,
        'ACTIVE',
        CONCAT('OWNER-LIC-', RIGHT('00' + CAST(p.rn AS VARCHAR(2)), 2)),
        u.email,
        CASE p.rn WHEN 1 THEN N'Sterling Crown Racing' WHEN 2 THEN N'Beaumont Equestrian' WHEN 3 THEN N'Harrington Thoroughbreds' WHEN 4 THEN N'Montgomery Racing Club' WHEN 5 THEN N'Caldwell Bloodstock' WHEN 6 THEN N'Sinclair Elite Racing' WHEN 7 THEN N'Kingsley Heritage Stud' ELSE N'Ashford Grand Racing' END,
        u.full_name,
        CASE p.rn WHEN 1 THEN N'Silvercrest Stables' WHEN 2 THEN N'Bluebell Manor' WHEN 3 THEN N'Royal Oak Stables' WHEN 4 THEN N'Golden Meadow Farm' WHEN 5 THEN N'Ironwood Racing Yard' WHEN 6 THEN N'Moonlight Downs' WHEN 7 THEN N'Highland Crown Stables' ELSE N'Rosewood Estate' END,
        CONCAT('/uploads/owners/owner-', p.rn, '-license.pdf'),
        CONCAT('/images/stables/stable-', p.rn, '.png'),
        CONCAT(N'International racehorse owner with ', 5 + p.rn, N' years of professional stable management experience.'),
        u.address,
        CONCAT(N'Approved international owner profile number ', p.rn, N'.'),
        NULL
    FROM (
        SELECT id AS owner_id,
               ROW_NUMBER() OVER (ORDER BY email) AS rn
        FROM users
        WHERE email LIKE 'owner%@gmail.com'
    ) p
    JOIN users u ON u.id = p.owner_id;

    /* ================================================================
       5. REFEREE PROFILE
       ================================================================ */
    INSERT INTO referee_profiles(
        experience_years, approved_at, approved_by, created_at, updated_at,
        user_id, status, license_number, evidence_url, certification,
        rejection_reason, bio
    )
    VALUES(
        10, @Now, @AdminId, @Now, @Now,
        @RefereeId, 'ACTIVE', 'REF-LIC-001',
        '/uploads/referee/referee-license.pdf',
        N'International Thoroughbred Racing Officials Certification',
        NULL,
        N'Senior race official responsible for all scheduled championship rounds.'
    );

    /* ================================================================
       6. HORSES - MỖI OWNER ĐÚNG 01 HORSE
       ================================================================ */
    ;WITH OwnerRows AS (
        SELECT id AS owner_id,
               ROW_NUMBER() OVER (ORDER BY email) AS rn
        FROM users
        WHERE email LIKE 'owner%@gmail.com'
    )
    INSERT INTO horses(
        date_of_birth, height_cm, weight_kg, approved_at, approved_by,
        created_at, updated_at, owner_id, gender, status, color,
        health_status, breed, registration_code, name, evidence_url,
        image_url, description, medical_note, rejection_reason
    )
    SELECT
        DATEADD(YEAR, -(4 + (rn % 3)), CAST(GETDATE() AS DATE)),
        155 + rn,
        440 + rn * 4,
        @Now,
        @AdminId,
        @Now,
        @Now,
        owner_id,
        CASE WHEN rn % 2 = 0 THEN 'FEMALE' ELSE 'MALE' END,
        'APPROVED',
        CASE rn
            WHEN 1 THEN 'BLACK'
            WHEN 2 THEN 'BAY'
            WHEN 3 THEN 'CHESTNUT'
            WHEN 4 THEN 'GREY'
            WHEN 5 THEN 'DARK_BAY'
            WHEN 6 THEN 'PALOMINO'
            WHEN 7 THEN 'BROWN'
            ELSE 'WHITE'
        END,
        'HEALTHY',
        'THOROUGHBRED',
        CONCAT('HORSE-', RIGHT('00' + CAST(rn AS VARCHAR(2)), 2)),
        CASE rn
            WHEN 1 THEN N'Midnight Sovereign'
            WHEN 2 THEN N'Aurora Belle'
            WHEN 3 THEN N'Crimson Dynasty'
            WHEN 4 THEN N'Silver Mirage'
            WHEN 5 THEN N'Imperial Valor'
            WHEN 6 THEN N'Golden Tempest'
            WHEN 7 THEN N'Storm Chaser'
            ELSE N'Celestial Crown'
        END,
        CONCAT('/uploads/horses/horse-', rn, '-evidence.pdf'),
        CONCAT('/images/horses/horse-', rn, '.jpg'),
        CONCAT(N'Elite thoroughbred racehorse selected for international championship entry number ', rn, N'.'),
        N'Passed full veterinary examination and cleared for competition.',
        NULL
    FROM OwnerRows;

    /* ================================================================
       7. POINT SETTINGS + POINT ACCOUNTS
       ================================================================ */
    INSERT INTO point_settings(setting_key, setting_value, updated_at, updated_by, description)
    SELECT v.setting_key, v.setting_value, @Now, @AdminId, v.description
    FROM (VALUES
        ('FIRST_LOGIN_BONUS', 100, N'Điểm thưởng lần đăng nhập đầu tiên'),
        ('BLOG_REWARD_POINTS', 20, N'Điểm thưởng đọc blog'),
        ('DAILY_BLOG_REWARD_LIMIT', 100, N'Giới hạn điểm blog mỗi ngày'),
        ('PREDICTION_WINNER_ENTRY_COST', 10, N'Chi phí dự đoán Winner'),
        ('PREDICTION_TOP3_ENTRY_COST', 20, N'Chi phí dự đoán Top 3'),
        ('PREDICTION_WINNER_REWARD', 50, N'Thưởng dự đoán Winner đúng'),
        ('PREDICTION_TOP3_EXACT_REWARD', 150, N'Thưởng Top 3 đúng thứ tự'),
        ('PREDICTION_TOP3_ANY_ORDER_REWARD', 80, N'Thưởng Top 3 đúng không cần thứ tự')
    ) v(setting_key, setting_value, description)
    WHERE NOT EXISTS (
        SELECT 1 FROM point_settings ps WHERE ps.setting_key = v.setting_key
    );

    UPDATE point_settings
    SET updated_by = @AdminId,
        updated_at = @Now
    WHERE updated_by IS NULL;

    INSERT INTO user_point_accounts(user_id, point_balance, updated_at)
    SELECT id,
           CASE WHEN id = @SpectatorId THEN 1000 ELSE 100 END,
           @Now
    FROM users;

    INSERT INTO point_transactions(
        amount, created_at, reference_id, user_id, reference_type,
        transaction_type, description
    )
    SELECT
        CASE WHEN id = @SpectatorId THEN 1000 ELSE 100 END,
        @Now,
        NULL,
        id,
        'SEED',
        'ADMIN_ADJUSTMENT',
        N'Initial demo point allocation'
    FROM users;

    /* ================================================================
       8. TOURNAMENTS
       ================================================================ */
    INSERT INTO tournaments(
        end_date, max_horses, max_horses_per_owner, start_date,
        created_at, created_by, registration_end_at,
        registration_start_at, updated_at, status, code,
        name, description, location
    )
    VALUES
    (
        DATEADD(DAY, 40, CAST(GETDATE() AS DATE)),
        8, 1,
        DATEADD(DAY, 5, CAST(GETDATE() AS DATE)),
        @Now, @AdminId,
        DATEADD(DAY, 3, @Now),
        DATEADD(DAY, -20, @Now),
        @Now,
        'SCHEDULED_PUBLIC',
        'HRT-CHAMPIONSHIP-2026-A',
        N'Royal Ascendancy Cup 2026',
        N'An international eight-round championship featuring eight elite owners, jockeys and thoroughbred horses.',
        N'Newmarket Racecourse, United Kingdom'
    ),
    (
        DATEADD(DAY, 80, CAST(GETDATE() AS DATE)),
        8, 1,
        DATEADD(DAY, 45, CAST(GETDATE() AS DATE)),
        @Now, @AdminId,
        DATEADD(DAY, 35, @Now),
        DATEADD(DAY, -10, @Now),
        @Now,
        'SCHEDULED_PUBLIC',
        'HRT-CHAMPIONSHIP-2026-B',
        N'Continental Crown Championship 2026',
        N'A prestigious continental racing series with eight confirmed competitors in every scheduled round.',
        N'Chantilly Racecourse, France'
    );

    /* ================================================================
       9. BẢNG GHÉP 8 OWNER - 8 HORSE - 8 JOCKEY
       ================================================================ */
    DECLARE @Pairs TABLE(
        rn INT PRIMARY KEY,
        owner_id BIGINT NOT NULL,
        horse_id BIGINT NOT NULL,
        jockey_id BIGINT NOT NULL
    );

    ;WITH Owners AS (
        SELECT id,
               ROW_NUMBER() OVER (ORDER BY email) rn
        FROM users
        WHERE email LIKE 'owner%@gmail.com'
    ),
    Jockeys AS (
        SELECT id,
               ROW_NUMBER() OVER (ORDER BY email) rn
        FROM users
        WHERE email LIKE 'jockey%@gmail.com'
    ),
    HorseRows AS (
        SELECT h.id,
               h.owner_id,
               ROW_NUMBER() OVER (ORDER BY h.registration_code) rn
        FROM horses h
        WHERE h.registration_code LIKE 'HORSE-%'
    )
    INSERT INTO @Pairs(rn, owner_id, horse_id, jockey_id)
    SELECT o.rn, o.id, h.id, j.id
    FROM Owners o
    JOIN HorseRows h ON h.rn = o.rn AND h.owner_id = o.id
    JOIN Jockeys j ON j.rn = o.rn;

    /* ================================================================
       10. REGISTRATION, JOCKEY APPLICATION, INVITATION, PARTICIPANT
       ================================================================ */
    INSERT INTO tournament_registrations(
        created_at, horse_id, owner_id, reviewed_at, reviewed_by,
        tournament_id, updated_at, status, note, rejection_reason
    )
    SELECT
        @Now, p.horse_id, p.owner_id, @Now, @AdminId,
        t.id, @Now, 'APPROVED',
        N'Registration approved for the official championship entry list.',
        NULL
    FROM tournaments t
    CROSS JOIN @Pairs p
    WHERE t.code IN ('HRT-CHAMPIONSHIP-2026-A', 'HRT-CHAMPIONSHIP-2026-B');

    INSERT INTO jockey_tournament_applications(
        created_at, jockey_id, reviewed_at, reviewed_by,
        tournament_id, updated_at, withdrawn_at,
        status, message, rejection_reason
    )
    SELECT
        @Now, p.jockey_id, @Now, @AdminId,
        t.id, @Now, NULL,
        'APPROVED',
        N'Jockey application reviewed and approved for the championship roster.',
        NULL
    FROM tournaments t
    CROSS JOIN @Pairs p
    WHERE t.code IN ('HRT-CHAMPIONSHIP-2026-A', 'HRT-CHAMPIONSHIP-2026-B');

    INSERT INTO jockey_invitations(
        accepted_at, created_at, horse_id, jockey_application_id,
        jockey_id, owner_id, read_at, rejected_at, tournament_id,
        tournament_registration_id, updated_at, status,
        agreement_url, message, rejection_reason, agreement_file_name
    )
    SELECT
        @Now,
        @Now,
        p.horse_id,
        ja.id,
        p.jockey_id,
        p.owner_id,
        @Now,
        NULL,
        t.id,
        tr.id,
        @Now,
        'ACCEPTED',
        CONCAT('/uploads/agreements/tournament-', t.id, '-pair-', p.rn, '.pdf'),
        CONCAT(N'Official riding invitation for ', t.name, N' - partnership number ', p.rn),
        NULL,
        CONCAT('agreement-', t.code, '-', p.rn, '.pdf')
    FROM tournaments t
    CROSS JOIN @Pairs p
    JOIN tournament_registrations tr
      ON tr.tournament_id = t.id
     AND tr.horse_id = p.horse_id
     AND tr.owner_id = p.owner_id
    JOIN jockey_tournament_applications ja
      ON ja.tournament_id = t.id
     AND ja.jockey_id = p.jockey_id
    WHERE t.code IN ('HRT-CHAMPIONSHIP-2026-A', 'HRT-CHAMPIONSHIP-2026-B');

    INSERT INTO tournament_participants(
        points, created_at, horse_id, jockey_id, jockey_invitation_id,
        owner_id, tournament_id, tournament_registration_id,
        updated_at, status
    )
    SELECT
        0,
        @Now,
        p.horse_id,
        p.jockey_id,
        ji.id,
        p.owner_id,
        t.id,
        tr.id,
        @Now,
        'ACTIVE'
    FROM tournaments t
    CROSS JOIN @Pairs p
    JOIN tournament_registrations tr
      ON tr.tournament_id = t.id
     AND tr.horse_id = p.horse_id
    JOIN jockey_invitations ji
      ON ji.tournament_id = t.id
     AND ji.horse_id = p.horse_id
     AND ji.jockey_id = p.jockey_id
    WHERE t.code IN ('HRT-CHAMPIONSHIP-2026-A', 'HRT-CHAMPIONSHIP-2026-B');

    /* ================================================================
       11. 8 RACES CHO MỖI TOURNAMENT
       ================================================================ */
    DECLARE @Numbers TABLE(n INT PRIMARY KEY);
    INSERT INTO @Numbers(n) VALUES (1),(2),(3),(4),(5),(6),(7),(8);

    INSERT INTO races(
        distance_meter, max_participants, min_participants, race_number,
        created_at, created_by, race_at, referee_id, tournament_id,
        updated_at, status, track_condition, code, round_name,
        track_name, name, note
    )
    SELECT
        1200 + (n.n - 1) * 100,
        8,
        8,
        n.n,
        @Now,
        @AdminId,
        DATEADD(DAY, n.n * 3,
                DATEADD(HOUR, 9, CAST(t.start_date AS DATETIME2))),
        @RefereeId,
        t.id,
        @Now,
        'SCHEDULED_PUBLIC',
        CASE n.n % 4
            WHEN 1 THEN 'DRY'
            WHEN 2 THEN 'GOOD'
            WHEN 3 THEN 'SOFT'
            ELSE 'WET'
        END,
        CONCAT(t.code, '-R', RIGHT('00' + CAST(n.n AS VARCHAR(2)), 2)),
        CONCAT(N'Round ', n.n),
        CASE WHEN t.code LIKE '%-A' THEN N'Newmarket Rowley Mile' ELSE N'Chantilly Grand Course' END,
        CONCAT(t.name, N' - Race ', n.n),
        N'Public scheduled race available for spectators and prediction activities.'
    FROM tournaments t
    CROSS JOIN @Numbers n
    WHERE t.code IN ('HRT-CHAMPIONSHIP-2026-A', 'HRT-CHAMPIONSHIP-2026-B');

    /* ================================================================
       12. MỖI RACE ĐỦ 8 PARTICIPANTS
       ================================================================ */
    INSERT INTO race_participants(
        lane_number, start_number, weight_carried_kg, created_at,
        horse_id, invitation_id, jockey_id, owner_id, race_id,
        updated_at, check_status, confirmation_status, status, check_note
    )
    SELECT
        p.rn,
        p.rn,
        CAST(50.00 + p.rn * 0.50 AS NUMERIC(5,2)),
        @Now,
        p.horse_id,
        ji.id,
        p.jockey_id,
        p.owner_id,
        r.id,
        @Now,
        'PENDING',
        'CONFIRMED',
        'ACTIVE',
        N'Awaiting official pre-race inspection.'
    FROM races r
    JOIN tournaments t ON t.id = r.tournament_id
    CROSS JOIN @Pairs p
    JOIN jockey_invitations ji
      ON ji.tournament_id = t.id
     AND ji.horse_id = p.horse_id
     AND ji.jockey_id = p.jockey_id
    WHERE t.code IN ('HRT-CHAMPIONSHIP-2026-A', 'HRT-CHAMPIONSHIP-2026-B');

    /* ================================================================
       13. BLOG + SPECTATOR PREDICTION DEMO
       ================================================================ */
    INSERT INTO blogs(
        author_id, created_at, updated_at, status,
        summary, content, slug, thumbnail, title
    )
    VALUES(
        @AdminId,
        @Now,
        @Now,
        'PUBLISHED',
        N'Official guide to following the championship and submitting race predictions.',
        N'Welcome to the international horse racing championship. Review the race schedule, participant profiles and prediction rules before each round.',
        'international-racing-championship-guide-2026',
        '/images/blogs/guide-2026.jpg',
        N'International Racing Championship Guide 2026'
    );

    DECLARE @FirstRaceId BIGINT = (
        SELECT TOP 1 r.id
        FROM races r
        JOIN tournaments t ON t.id = r.tournament_id
        WHERE t.code = 'HRT-CHAMPIONSHIP-2026-A'
        ORDER BY r.race_number
    );

    DECLARE @WinnerParticipantId BIGINT = (
        SELECT TOP 1 id
        FROM race_participants
        WHERE race_id = @FirstRaceId
        ORDER BY lane_number
    );

    DECLARE @SecondParticipantId BIGINT = (
        SELECT id
        FROM (
            SELECT id, ROW_NUMBER() OVER (ORDER BY lane_number) rn
            FROM race_participants
            WHERE race_id = @FirstRaceId
        ) x
        WHERE rn = 2
    );

    DECLARE @ThirdParticipantId BIGINT = (
        SELECT id
        FROM (
            SELECT id, ROW_NUMBER() OVER (ORDER BY lane_number) rn
            FROM race_participants
            WHERE race_id = @FirstRaceId
        ) x
        WHERE rn = 3
    );

    INSERT INTO race_predictions(
        entry_cost_points, reward_points, created_at, evaluated_at,
        locked_at, predicted_second_id, predicted_third_id,
        predicted_winner_id, race_id, spectator_id, updated_at,
        prediction_type, status
    )
    VALUES
    (
        10, 0, @Now, NULL, NULL,
        NULL, NULL,
        @WinnerParticipantId, @FirstRaceId, @SpectatorId, @Now,
        'WINNER', 'PENDING'
    ),
    (
        20, 0, @Now, NULL, NULL,
        @SecondParticipantId, @ThirdParticipantId,
        @WinnerParticipantId, @FirstRaceId, @SpectatorId, @Now,
        'TOP3', 'PENDING'
    );

    UPDATE user_point_accounts
    SET point_balance = point_balance - 30,
        updated_at = @Now
    WHERE user_id = @SpectatorId;

    INSERT INTO point_transactions(
        amount, created_at, reference_id, user_id,
        reference_type, transaction_type, description
    )
    SELECT
        -entry_cost_points,
        created_at,
        id,
        spectator_id,
        'RACE_PREDICTION',
        'PREDICTION_ENTRY',
        CONCAT(N'Prediction entry cost for ', prediction_type)
    FROM race_predictions
    WHERE spectator_id = @SpectatorId
      AND race_id = @FirstRaceId;

    COMMIT TRANSACTION;

    /* ================================================================
       14. KIỂM TRA KẾT QUẢ
       ================================================================ */
    SELECT 'Users' AS data_group, COUNT(*) AS total FROM users
    UNION ALL
    SELECT 'Owners', COUNT(*) FROM users WHERE email LIKE 'owner%@gmail.com'
    UNION ALL
    SELECT 'Jockeys', COUNT(*) FROM users WHERE email LIKE 'jockey%@gmail.com'
    UNION ALL
    SELECT 'Horses', COUNT(*) FROM horses WHERE registration_code LIKE 'HORSE-%'
    UNION ALL
    SELECT 'Tournaments', COUNT(*) FROM tournaments WHERE code LIKE 'HRT-CHAMPIONSHIP-2026-%'
    UNION ALL
    SELECT 'Tournament participants', COUNT(*)
      FROM tournament_participants tp
      JOIN tournaments t ON t.id = tp.tournament_id
     WHERE t.code LIKE 'HRT-CHAMPIONSHIP-2026-%'
    UNION ALL
    SELECT 'Races', COUNT(*)
      FROM races r
      JOIN tournaments t ON t.id = r.tournament_id
     WHERE t.code LIKE 'HRT-CHAMPIONSHIP-2026-%'
    UNION ALL
    SELECT 'Race participants', COUNT(*)
      FROM race_participants rp
      JOIN races r ON r.id = rp.race_id
      JOIN tournaments t ON t.id = r.tournament_id
     WHERE t.code LIKE 'HRT-CHAMPIONSHIP-2026-%';

    SELECT
        t.code AS tournament_code,
        t.status AS tournament_status,
        (SELECT COUNT(*)
           FROM tournament_participants tp
          WHERE tp.tournament_id = t.id) AS tournament_participants,
        (SELECT COUNT(*)
           FROM races r
          WHERE r.tournament_id = t.id) AS races,
        (SELECT COUNT(*)
           FROM race_participants rp
           JOIN races r ON r.id = rp.race_id
          WHERE r.tournament_id = t.id) AS total_race_participant_rows
    FROM tournaments t
    WHERE t.code LIKE 'HRT-CHAMPIONSHIP-2026-%'
    ORDER BY t.code;

    SELECT
        t.code AS tournament_code,
        r.race_number,
        r.code AS race_code,
        r.status AS race_status,
        COUNT(rp.id) AS participant_count
    FROM races r
    JOIN tournaments t ON t.id = r.tournament_id
    LEFT JOIN race_participants rp ON rp.race_id = r.id
    WHERE t.code LIKE 'HRT-CHAMPIONSHIP-2026-%'
    GROUP BY t.code, r.race_number, r.code, r.status
    ORDER BY t.code, r.race_number;

END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;

    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorLine INT = ERROR_LINE();
    DECLARE @ErrorNumber INT = ERROR_NUMBER();

    DECLARE @ThrowMessage NVARCHAR(2048) =
        CONCAT(N'Seed data thất bại. Error ', @ErrorNumber,
               N' tại line ', @ErrorLine, N': ', @ErrorMessage);

    THROW 51000, @ThrowMessage, 1;
END CATCH;

        ('HORSE_OWNER', 'Horse owner'),
        ('JOCKEY',      'Jockey'),
        ('REFEREE',     'Race referee'),
        ('SPECTATOR',   'Spectator')
    ) v(name, description)
    WHERE NOT EXISTS (
        SELECT 1 FROM roles r WHERE r.name = v.name
    );

    /* ================================================================
       2. USERS
       ================================================================ */
    INSERT INTO users(
        age_verified, date_of_birth, email_verified, phone_verified,
        profile_completed, created_at, updated_at, gender, phone,
        status, email, full_name, avatar_url, address, password_hash
    )
    VALUES
    (1, '1990-01-15', 1, 1, 1, @Now, @Now, 'MALE',   '0901000001', 'ACTIVE', 'admin@horseracing.com',     N'Alexander Sterling',     NULL, N'London, United Kingdom', @PasswordHash),
    (1, '1985-04-20', 1, 1, 1, @Now, @Now, 'MALE',   '0901000002', 'ACTIVE', 'referee@horseracing.com',   N'Jonathan Whitmore',  NULL, N'London, United Kingdom', @PasswordHash),
    (1, '2000-09-12', 1, 1, 1, @Now, @Now, 'FEMALE', '0901000003', 'ACTIVE', 'spectator@horseracing.com', N'Sophia Bennett',    NULL, N'London, United Kingdom', @PasswordHash),

    (1, '1982-02-01', 1, 1, 1, @Now, @Now, 'MALE',   '0912000001', 'ACTIVE', 'owner1@gmail.com', N'Oliver Kensington', NULL, N'Mayfair, London', @PasswordHash),
    (1, '1984-03-02', 1, 1, 1, @Now, @Now, 'FEMALE', '0912000002', 'ACTIVE', 'owner2@gmail.com', N'Charlotte Beaumont',   NULL, N'Nice, France', @PasswordHash),
    (1, '1981-04-03', 1, 1, 1, @Now, @Now, 'MALE',   '0912000003', 'ACTIVE', 'owner3@gmail.com', N'William Harrington',  NULL, N'Dublin, Ireland', @PasswordHash),
    (1, '1986-05-04', 1, 1, 1, @Now, @Now, 'FEMALE', '0912000004', 'ACTIVE', 'owner4@gmail.com', N'Isabella Montgomery', NULL, N'Madrid, Spain', @PasswordHash),
    (1, '1983-06-05', 1, 1, 1, @Now, @Now, 'MALE',   '0912000005', 'ACTIVE', 'owner5@gmail.com', N'Henry Caldwell',   NULL, N'Florence, Italy', @PasswordHash),
    (1, '1987-07-06', 1, 1, 1, @Now, @Now, 'FEMALE', '0912000006', 'ACTIVE', 'owner6@gmail.com', N'Amelia Sinclair',  NULL, N'Edinburgh, Scotland', @PasswordHash),
    (1, '1980-08-07', 1, 1, 1, @Now, @Now, 'MALE',   '0912000007', 'ACTIVE', 'owner7@gmail.com', N'Edward Kingsley',  NULL, N'Vienna, Austria', @PasswordHash),
    (1, '1988-09-08', 1, 1, 1, @Now, @Now, 'FEMALE', '0912000008', 'ACTIVE', 'owner8@gmail.com', N'Victoria Ashford',  NULL, N'Geneva, Switzerland', @PasswordHash),

    (1, '1996-01-11', 1, 1, 1, @Now, @Now, 'MALE',   '0923000001', 'ACTIVE', 'jockey1@gmail.com', N'Liam Carter',  NULL, N'Newmarket, United Kingdom', @PasswordHash),
    (1, '1997-02-12', 1, 1, 1, @Now, @Now, 'FEMALE', '0923000002', 'ACTIVE', 'jockey2@gmail.com', N'Emma Collins', NULL, N'Newmarket, United Kingdom', @PasswordHash),
    (1, '1995-03-13', 1, 1, 1, @Now, @Now, 'MALE',   '0923000003', 'ACTIVE', 'jockey3@gmail.com', N'Noah Bennett',NULL, N'Newmarket, United Kingdom', @PasswordHash),
    (1, '1998-04-14', 1, 1, 1, @Now, @Now, 'FEMALE', '0923000004', 'ACTIVE', 'jockey4@gmail.com', N'Olivia Hayes',    NULL, N'Newmarket, United Kingdom', @PasswordHash),
    (1, '1994-05-15', 1, 1, 1, @Now, @Now, 'MALE',   '0923000005', 'ACTIVE', 'jockey5@gmail.com', N'Ethan Brooks',   NULL, N'Newmarket, United Kingdom', @PasswordHash),
    (1, '1999-06-16', 1, 1, 1, @Now, @Now, 'FEMALE', '0923000006', 'ACTIVE', 'jockey6@gmail.com', N'Ava Richardson', NULL, N'Newmarket, United Kingdom', @PasswordHash),
    (1, '1993-07-17', 1, 1, 1, @Now, @Now, 'MALE',   '0923000007', 'ACTIVE', 'jockey7@gmail.com', N'Lucas Morgan', NULL, N'Newmarket, United Kingdom', @PasswordHash),
    (1, '1996-08-18', 1, 1, 1, @Now, @Now, 'FEMALE', '0923000008', 'ACTIVE', 'jockey8@gmail.com', N'Mia Thompson',   NULL, N'Newmarket, United Kingdom', @PasswordHash);

    DECLARE @AdminId BIGINT = (SELECT id FROM users WHERE email = 'admin@horseracing.com');
    DECLARE @RefereeId BIGINT = (SELECT id FROM users WHERE email = 'referee@horseracing.com');
    DECLARE @SpectatorId BIGINT = (SELECT id FROM users WHERE email = 'spectator@horseracing.com');

    /* ================================================================
       3. USER ROLES
       ================================================================ */
    INSERT INTO user_roles(user_id, role_id, status, assigned_at, assigned_by)
    SELECT u.id, r.id, 'ACTIVE', @Now, @AdminId
    FROM users u
    JOIN roles r ON
        (u.email = 'admin@horseracing.com'     AND r.name = 'ADMIN') OR
        (u.email = 'referee@horseracing.com'   AND r.name = 'REFEREE') OR
        (u.email = 'spectator@horseracing.com' AND r.name = 'SPECTATOR') OR
        (u.email LIKE 'owner%@gmail.com'        AND r.name = 'HORSE_OWNER') OR
        (u.email LIKE 'jockey%@gmail.com'       AND r.name = 'JOCKEY');

    INSERT INTO user_role_history(
        user_role_id, old_status, new_status, changed_at, changed_by, reason
    )
    SELECT ur.id, NULL, 'ACTIVE', @Now, @AdminId, N'Initial international demo dataset'
    FROM user_roles ur;

    /* ================================================================
       4. OWNER PROFILES
       ================================================================ */
    INSERT INTO horse_owner_profiles(
        experience_years, approved_at, approved_by, created_at, updated_at,
        user_id, contact_phone, status, license_number, contact_email,
        organization_name, owner_name, stable_name, evidence_url, logo_url,
        bio, contact_address, description, rejection_reason
    )
    SELECT
        5 + p.rn,
        @Now,
        @AdminId,
        @Now,
        @Now,
        p.owner_id,
        u.phone,
        'ACTIVE',
        CONCAT('OWNER-LIC-', RIGHT('00' + CAST(p.rn AS VARCHAR(2)), 2)),
        u.email,
        CASE p.rn WHEN 1 THEN N'Sterling Crown Racing' WHEN 2 THEN N'Beaumont Equestrian' WHEN 3 THEN N'Harrington Thoroughbreds' WHEN 4 THEN N'Montgomery Racing Club' WHEN 5 THEN N'Caldwell Bloodstock' WHEN 6 THEN N'Sinclair Elite Racing' WHEN 7 THEN N'Kingsley Heritage Stud' ELSE N'Ashford Grand Racing' END,
        u.full_name,
        CASE p.rn WHEN 1 THEN N'Silvercrest Stables' WHEN 2 THEN N'Bluebell Manor' WHEN 3 THEN N'Royal Oak Stables' WHEN 4 THEN N'Golden Meadow Farm' WHEN 5 THEN N'Ironwood Racing Yard' WHEN 6 THEN N'Moonlight Downs' WHEN 7 THEN N'Highland Crown Stables' ELSE N'Rosewood Estate' END,
        CONCAT('/uploads/owners/owner-', p.rn, '-license.pdf'),
        CONCAT('/images/stables/stable-', p.rn, '.png'),
        CONCAT(N'International racehorse owner with ', 5 + p.rn, N' years of professional stable management experience.'),
        u.address,
        CONCAT(N'Approved international owner profile number ', p.rn, N'.'),
        NULL
    FROM (
        SELECT id AS owner_id,
               ROW_NUMBER() OVER (ORDER BY email) AS rn
        FROM users
        WHERE email LIKE 'owner%@gmail.com'
    ) p
    JOIN users u ON u.id = p.owner_id;

    /* ================================================================
       5. REFEREE PROFILE
       ================================================================ */
    INSERT INTO referee_profiles(
        experience_years, approved_at, approved_by, created_at, updated_at,
        user_id, status, license_number, evidence_url, certification,
        rejection_reason, bio
    )
    VALUES(
        10, @Now, @AdminId, @Now, @Now,
        @RefereeId, 'ACTIVE', 'REF-LIC-001',
        '/uploads/referee/referee-license.pdf',
        N'International Thoroughbred Racing Officials Certification',
        NULL,
        N'Senior race official responsible for all scheduled championship rounds.'
    );

    /* ================================================================
       6. HORSES - MỖI OWNER ĐÚNG 01 HORSE
       ================================================================ */
    ;WITH OwnerRows AS (
        SELECT id AS owner_id,
               ROW_NUMBER() OVER (ORDER BY email) AS rn
        FROM users
        WHERE email LIKE 'owner%@gmail.com'
    )
    INSERT INTO horses(
        date_of_birth, height_cm, weight_kg, approved_at, approved_by,
        created_at, updated_at, owner_id, gender, status, color,
        health_status, breed, registration_code, name, evidence_url,
        image_url, description, medical_note, rejection_reason
    )
    SELECT
        DATEADD(YEAR, -(4 + (rn % 3)), CAST(GETDATE() AS DATE)),
        155 + rn,
        440 + rn * 4,
        @Now,
        @AdminId,
        @Now,
        @Now,
        owner_id,
        CASE WHEN rn % 2 = 0 THEN 'FEMALE' ELSE 'MALE' END,
        'APPROVED',
        CASE rn
            WHEN 1 THEN 'BLACK'
            WHEN 2 THEN 'BAY'
            WHEN 3 THEN 'CHESTNUT'
            WHEN 4 THEN 'GREY'
            WHEN 5 THEN 'DARK_BAY'
            WHEN 6 THEN 'PALOMINO'
            WHEN 7 THEN 'BROWN'
            ELSE 'WHITE'
        END,
        'HEALTHY',
        'THOROUGHBRED',
        CONCAT('HORSE-', RIGHT('00' + CAST(rn AS VARCHAR(2)), 2)),
        CASE rn
            WHEN 1 THEN N'Midnight Sovereign'
            WHEN 2 THEN N'Aurora Belle'
            WHEN 3 THEN N'Crimson Dynasty'
            WHEN 4 THEN N'Silver Mirage'
            WHEN 5 THEN N'Imperial Valor'
            WHEN 6 THEN N'Golden Tempest'
            WHEN 7 THEN N'Storm Chaser'
            ELSE N'Celestial Crown'
        END,
        CONCAT('/uploads/horses/horse-', rn, '-evidence.pdf'),
        CONCAT('/images/horses/horse-', rn, '.jpg'),
        CONCAT(N'Elite thoroughbred racehorse selected for international championship entry number ', rn, N'.'),
        N'Passed full veterinary examination and cleared for competition.',
        NULL
    FROM OwnerRows;

    /* ================================================================
       7. POINT SETTINGS + POINT ACCOUNTS
       ================================================================ */
    INSERT INTO point_settings(setting_key, setting_value, updated_at, updated_by, description)
    SELECT v.setting_key, v.setting_value, @Now, @AdminId, v.description
    FROM (VALUES
        ('FIRST_LOGIN_BONUS', 100, N'Điểm thưởng lần đăng nhập đầu tiên'),
        ('BLOG_REWARD_POINTS', 20, N'Điểm thưởng đọc blog'),
        ('DAILY_BLOG_REWARD_LIMIT', 100, N'Giới hạn điểm blog mỗi ngày'),
        ('PREDICTION_WINNER_ENTRY_COST', 10, N'Chi phí dự đoán Winner'),
        ('PREDICTION_TOP3_ENTRY_COST', 20, N'Chi phí dự đoán Top 3'),
        ('PREDICTION_WINNER_REWARD', 50, N'Thưởng dự đoán Winner đúng'),
        ('PREDICTION_TOP3_EXACT_REWARD', 150, N'Thưởng Top 3 đúng thứ tự'),
        ('PREDICTION_TOP3_ANY_ORDER_REWARD', 80, N'Thưởng Top 3 đúng không cần thứ tự')
    ) v(setting_key, setting_value, description)
    WHERE NOT EXISTS (
        SELECT 1 FROM point_settings ps WHERE ps.setting_key = v.setting_key
    );

    UPDATE point_settings
    SET updated_by = @AdminId,
        updated_at = @Now
    WHERE updated_by IS NULL;

    INSERT INTO user_point_accounts(user_id, point_balance, updated_at)
    SELECT id,
           CASE WHEN id = @SpectatorId THEN 1000 ELSE 100 END,
           @Now
    FROM users;

    INSERT INTO point_transactions(
        amount, created_at, reference_id, user_id, reference_type,
        transaction_type, description
    )
    SELECT
        CASE WHEN id = @SpectatorId THEN 1000 ELSE 100 END,
        @Now,
        NULL,
        id,
        'SEED',
        'ADMIN_ADJUSTMENT',
        N'Initial demo point allocation'
    FROM users;

    /* ================================================================
       8. TOURNAMENTS
       ================================================================ */
    INSERT INTO tournaments(
        end_date, max_horses, max_horses_per_owner, start_date,
        created_at, created_by, registration_end_at,
        registration_start_at, updated_at, status, code,
        name, description, location
    )
    VALUES
    (
        DATEADD(DAY, 40, CAST(GETDATE() AS DATE)),
        8, 1,
        DATEADD(DAY, 5, CAST(GETDATE() AS DATE)),
        @Now, @AdminId,
        DATEADD(DAY, 3, @Now),
        DATEADD(DAY, -20, @Now),
        @Now,
        'SCHEDULED_PUBLIC',
        'HRT-CHAMPIONSHIP-2026-A',
        N'Royal Ascendancy Cup 2026',
        N'An international eight-round championship featuring eight elite owners, jockeys and thoroughbred horses.',
        N'Newmarket Racecourse, United Kingdom'
    ),
    (
        DATEADD(DAY, 80, CAST(GETDATE() AS DATE)),
        8, 1,
        DATEADD(DAY, 45, CAST(GETDATE() AS DATE)),
        @Now, @AdminId,
        DATEADD(DAY, 35, @Now),
        DATEADD(DAY, -10, @Now),
        @Now,
        'SCHEDULED_PUBLIC',
        'HRT-CHAMPIONSHIP-2026-B',
        N'Continental Crown Championship 2026',
        N'A prestigious continental racing series with eight confirmed competitors in every scheduled round.',
        N'Chantilly Racecourse, France'
    );

    /* ================================================================
       9. BẢNG GHÉP 8 OWNER - 8 HORSE - 8 JOCKEY
       ================================================================ */
    DECLARE @Pairs TABLE(
        rn INT PRIMARY KEY,
        owner_id BIGINT NOT NULL,
        horse_id BIGINT NOT NULL,
        jockey_id BIGINT NOT NULL
    );

    ;WITH Owners AS (
        SELECT id,
               ROW_NUMBER() OVER (ORDER BY email) rn
        FROM users
        WHERE email LIKE 'owner%@gmail.com'
    ),
    Jockeys AS (
        SELECT id,
               ROW_NUMBER() OVER (ORDER BY email) rn
        FROM users
        WHERE email LIKE 'jockey%@gmail.com'
    ),
    HorseRows AS (
        SELECT h.id,
               h.owner_id,
               ROW_NUMBER() OVER (ORDER BY h.registration_code) rn
        FROM horses h
        WHERE h.registration_code LIKE 'HORSE-%'
    )
    INSERT INTO @Pairs(rn, owner_id, horse_id, jockey_id)
    SELECT o.rn, o.id, h.id, j.id
    FROM Owners o
    JOIN HorseRows h ON h.rn = o.rn AND h.owner_id = o.id
    JOIN Jockeys j ON j.rn = o.rn;

    /* ================================================================
       10. REGISTRATION, JOCKEY APPLICATION, INVITATION, PARTICIPANT
       ================================================================ */
    INSERT INTO tournament_registrations(
        created_at, horse_id, owner_id, reviewed_at, reviewed_by,
        tournament_id, updated_at, status, note, rejection_reason
    )
    SELECT
        @Now, p.horse_id, p.owner_id, @Now, @AdminId,
        t.id, @Now, 'APPROVED',
        N'Registration approved for the official championship entry list.',
        NULL
    FROM tournaments t
    CROSS JOIN @Pairs p
    WHERE t.code IN ('HRT-CHAMPIONSHIP-2026-A', 'HRT-CHAMPIONSHIP-2026-B');

    INSERT INTO jockey_tournament_applications(
        created_at, jockey_id, reviewed_at, reviewed_by,
        tournament_id, updated_at, withdrawn_at,
        status, message, rejection_reason
    )
    SELECT
        @Now, p.jockey_id, @Now, @AdminId,
        t.id, @Now, NULL,
        'APPROVED',
        N'Jockey application reviewed and approved for the championship roster.',
        NULL
    FROM tournaments t
    CROSS JOIN @Pairs p
    WHERE t.code IN ('HRT-CHAMPIONSHIP-2026-A', 'HRT-CHAMPIONSHIP-2026-B');

    INSERT INTO jockey_invitations(
        accepted_at, created_at, horse_id, jockey_application_id,
        jockey_id, owner_id, read_at, rejected_at, tournament_id,
        tournament_registration_id, updated_at, status,
        agreement_url, message, rejection_reason, agreement_file_name
    )
    SELECT
        @Now,
        @Now,
        p.horse_id,
        ja.id,
        p.jockey_id,
        p.owner_id,
        @Now,
        NULL,
        t.id,
        tr.id,
        @Now,
        'ACCEPTED',
        CONCAT('/uploads/agreements/tournament-', t.id, '-pair-', p.rn, '.pdf'),
        CONCAT(N'Official riding invitation for ', t.name, N' - partnership number ', p.rn),
        NULL,
        CONCAT('agreement-', t.code, '-', p.rn, '.pdf')
    FROM tournaments t
    CROSS JOIN @Pairs p
    JOIN tournament_registrations tr
      ON tr.tournament_id = t.id
     AND tr.horse_id = p.horse_id
     AND tr.owner_id = p.owner_id
    JOIN jockey_tournament_applications ja
      ON ja.tournament_id = t.id
     AND ja.jockey_id = p.jockey_id
    WHERE t.code IN ('HRT-CHAMPIONSHIP-2026-A', 'HRT-CHAMPIONSHIP-2026-B');

    INSERT INTO tournament_participants(
        points, created_at, horse_id, jockey_id, jockey_invitation_id,
        owner_id, tournament_id, tournament_registration_id,
        updated_at, status
    )
    SELECT
        0,
        @Now,
        p.horse_id,
        p.jockey_id,
        ji.id,
        p.owner_id,
        t.id,
        tr.id,
        @Now,
        'ACTIVE'
    FROM tournaments t
    CROSS JOIN @Pairs p
    JOIN tournament_registrations tr
      ON tr.tournament_id = t.id
     AND tr.horse_id = p.horse_id
    JOIN jockey_invitations ji
      ON ji.tournament_id = t.id
     AND ji.horse_id = p.horse_id
     AND ji.jockey_id = p.jockey_id
    WHERE t.code IN ('HRT-CHAMPIONSHIP-2026-A', 'HRT-CHAMPIONSHIP-2026-B');

    /* ================================================================
       11. 8 RACES CHO MỖI TOURNAMENT
       ================================================================ */
    DECLARE @Numbers TABLE(n INT PRIMARY KEY);
    INSERT INTO @Numbers(n) VALUES (1),(2),(3),(4),(5),(6),(7),(8);

    INSERT INTO races(
        distance_meter, max_participants, min_participants, race_number,
        created_at, created_by, race_at, referee_id, tournament_id,
        updated_at, status, track_condition, code, round_name,
        track_name, name, note
    )
    SELECT
        1200 + (n.n - 1) * 100,
        8,
        8,
        n.n,
        @Now,
        @AdminId,
        DATEADD(DAY, n.n * 3,
                DATEADD(HOUR, 9, CAST(t.start_date AS DATETIME2))),
        @RefereeId,
        t.id,
        @Now,
        'SCHEDULED_PUBLIC',
        CASE n.n % 4
            WHEN 1 THEN 'DRY'
            WHEN 2 THEN 'GOOD'
            WHEN 3 THEN 'SOFT'
            ELSE 'WET'
        END,
        CONCAT(t.code, '-R', RIGHT('00' + CAST(n.n AS VARCHAR(2)), 2)),
        CONCAT(N'Round ', n.n),
        CASE WHEN t.code LIKE '%-A' THEN N'Newmarket Rowley Mile' ELSE N'Chantilly Grand Course' END,
        CONCAT(t.name, N' - Race ', n.n),
        N'Public scheduled race available for spectators and prediction activities.'
    FROM tournaments t
    CROSS JOIN @Numbers n
    WHERE t.code IN ('HRT-CHAMPIONSHIP-2026-A', 'HRT-CHAMPIONSHIP-2026-B');

    /* ================================================================
       12. MỖI RACE ĐỦ 8 PARTICIPANTS
       ================================================================ */
    INSERT INTO race_participants(
        lane_number, start_number, weight_carried_kg, created_at,
        horse_id, invitation_id, jockey_id, owner_id, race_id,
        updated_at, check_status, confirmation_status, status, check_note
    )
    SELECT
        p.rn,
        p.rn,
        CAST(50.00 + p.rn * 0.50 AS NUMERIC(5,2)),
        @Now,
        p.horse_id,
        ji.id,
        p.jockey_id,
        p.owner_id,
        r.id,
        @Now,
        'PENDING',
        'CONFIRMED',
        'ACTIVE',
        N'Awaiting official pre-race inspection.'
    FROM races r
    JOIN tournaments t ON t.id = r.tournament_id
    CROSS JOIN @Pairs p
    JOIN jockey_invitations ji
      ON ji.tournament_id = t.id
     AND ji.horse_id = p.horse_id
     AND ji.jockey_id = p.jockey_id
    WHERE t.code IN ('HRT-CHAMPIONSHIP-2026-A', 'HRT-CHAMPIONSHIP-2026-B');

    /* ================================================================
       13. BLOG + SPECTATOR PREDICTION DEMO
       ================================================================ */
    INSERT INTO blogs(
        author_id, created_at, updated_at, status,
        summary, content, slug, thumbnail, title
    )
    VALUES(
        @AdminId,
        @Now,
        @Now,
        'PUBLISHED',
        N'Official guide to following the championship and submitting race predictions.',
        N'Welcome to the international horse racing championship. Review the race schedule, participant profiles and prediction rules before each round.',
        'international-racing-championship-guide-2026',
        '/images/blogs/guide-2026.jpg',
        N'International Racing Championship Guide 2026'
    );

    DECLARE @FirstRaceId BIGINT = (
        SELECT TOP 1 r.id
        FROM races r
        JOIN tournaments t ON t.id = r.tournament_id
        WHERE t.code = 'HRT-CHAMPIONSHIP-2026-A'
        ORDER BY r.race_number
    );

    DECLARE @WinnerParticipantId BIGINT = (
        SELECT TOP 1 id
        FROM race_participants
        WHERE race_id = @FirstRaceId
        ORDER BY lane_number
    );

    DECLARE @SecondParticipantId BIGINT = (
        SELECT id
        FROM (
            SELECT id, ROW_NUMBER() OVER (ORDER BY lane_number) rn
            FROM race_participants
            WHERE race_id = @FirstRaceId
        ) x
        WHERE rn = 2
    );

    DECLARE @ThirdParticipantId BIGINT = (
        SELECT id
        FROM (
            SELECT id, ROW_NUMBER() OVER (ORDER BY lane_number) rn
            FROM race_participants
            WHERE race_id = @FirstRaceId
        ) x
        WHERE rn = 3
    );

    INSERT INTO race_predictions(
        entry_cost_points, reward_points, created_at, evaluated_at,
        locked_at, predicted_second_id, predicted_third_id,
        predicted_winner_id, race_id, spectator_id, updated_at,
        prediction_type, status
    )
    VALUES
    (
        10, 0, @Now, NULL, NULL,
        NULL, NULL,
        @WinnerParticipantId, @FirstRaceId, @SpectatorId, @Now,
        'WINNER', 'PENDING'
    ),
    (
        20, 0, @Now, NULL, NULL,
        @SecondParticipantId, @ThirdParticipantId,
        @WinnerParticipantId, @FirstRaceId, @SpectatorId, @Now,
        'TOP3', 'PENDING'
    );

    UPDATE user_point_accounts
    SET point_balance = point_balance - 30,
        updated_at = @Now
    WHERE user_id = @SpectatorId;

    INSERT INTO point_transactions(
        amount, created_at, reference_id, user_id,
        reference_type, transaction_type, description
    )
    SELECT
        -entry_cost_points,
        created_at,
        id,
        spectator_id,
        'RACE_PREDICTION',
        'PREDICTION_ENTRY',
        CONCAT(N'Prediction entry cost for ', prediction_type)
    FROM race_predictions
    WHERE spectator_id = @SpectatorId
      AND race_id = @FirstRaceId;

    COMMIT TRANSACTION;

    /* ================================================================
       14. KIỂM TRA KẾT QUẢ
       ================================================================ */
    SELECT 'Users' AS data_group, COUNT(*) AS total FROM users
    UNION ALL
    SELECT 'Owners', COUNT(*) FROM users WHERE email LIKE 'owner%@gmail.com'
    UNION ALL
    SELECT 'Jockeys', COUNT(*) FROM users WHERE email LIKE 'jockey%@gmail.com'
    UNION ALL
    SELECT 'Horses', COUNT(*) FROM horses WHERE registration_code LIKE 'HORSE-%'
    UNION ALL
    SELECT 'Tournaments', COUNT(*) FROM tournaments WHERE code LIKE 'HRT-CHAMPIONSHIP-2026-%'
    UNION ALL
    SELECT 'Tournament participants', COUNT(*)
      FROM tournament_participants tp
      JOIN tournaments t ON t.id = tp.tournament_id
     WHERE t.code LIKE 'HRT-CHAMPIONSHIP-2026-%'
    UNION ALL
    SELECT 'Races', COUNT(*)
      FROM races r
      JOIN tournaments t ON t.id = r.tournament_id
     WHERE t.code LIKE 'HRT-CHAMPIONSHIP-2026-%'
    UNION ALL
    SELECT 'Race participants', COUNT(*)
      FROM race_participants rp
      JOIN races r ON r.id = rp.race_id
      JOIN tournaments t ON t.id = r.tournament_id
     WHERE t.code LIKE 'HRT-CHAMPIONSHIP-2026-%';

    SELECT
        t.code AS tournament_code,
        t.status AS tournament_status,
        (SELECT COUNT(*)
           FROM tournament_participants tp
          WHERE tp.tournament_id = t.id) AS tournament_participants,
        (SELECT COUNT(*)
           FROM races r
          WHERE r.tournament_id = t.id) AS races,
        (SELECT COUNT(*)
           FROM race_participants rp
           JOIN races r ON r.id = rp.race_id
          WHERE r.tournament_id = t.id) AS total_race_participant_rows
    FROM tournaments t
    WHERE t.code LIKE 'HRT-CHAMPIONSHIP-2026-%'
    ORDER BY t.code;

    SELECT
        t.code AS tournament_code,
        r.race_number,
        r.code AS race_code,
        r.status AS race_status,
        COUNT(rp.id) AS participant_count
    FROM races r
    JOIN tournaments t ON t.id = r.tournament_id
    LEFT JOIN race_participants rp ON rp.race_id = r.id
    WHERE t.code LIKE 'HRT-CHAMPIONSHIP-2026-%'
    GROUP BY t.code, r.race_number, r.code, r.status
    ORDER BY t.code, r.race_number;

END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;

    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorLine INT = ERROR_LINE();
    DECLARE @ErrorNumber INT = ERROR_NUMBER();

    DECLARE @ThrowMessage NVARCHAR(2048) =
        CONCAT(N'Seed data thất bại. Error ', @ErrorNumber,
               N' tại line ', @ErrorLine, N': ', @ErrorMessage);

    THROW 51000, @ThrowMessage, 1;
END CATCH;
