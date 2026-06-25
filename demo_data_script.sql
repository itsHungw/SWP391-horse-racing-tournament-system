/*
    HORSE RACING TOURNAMENT SYSTEM - FULL DEMO DATA
    PostgreSQL

    Dữ liệu chính (lifecycle tiêu biểu — đã đồng bộ với enum sau merge):
    - 01 ADMIN, 01 REFEREE, 01 SPECTATOR, 08 HORSE_OWNER, 08 JOCKEY
    - 04 ORGANIZER + 03 user trạng thái khác (SUSPENDED / BANNED / PENDING_EMAIL_VERIFY)
    - 04 organizations (ACTIVE / PENDING / SUSPENDED / REJECTED)
    - 02 giải chính (8 owner-horse-jockey, 8 race) + 07 giải phủ các pha
      (DRAFT / PENDING_APPROVAL / APPROVED / OPEN_REGISTRATION / ONGOING / COMPLETED / POSTPONED)
    - referee_contracts đủ PENDING / ACTIVE / DECLINED / TERMINATED
    - role_requests đủ PENDING / APPROVED / REJECTED / CANCELLED
    - Race 1 của giải A đã PUBLISHED: race_results + referee_report + pre_race_checks
      + violation + prediction_settlement_job + dự đoán đã chấm (CORRECT / INCORRECT)

    Mật khẩu mẫu cho toàn bộ tài khoản:
    BCrypt: $2a$12$SIzd3JpjQSPzLKmp3u30cOylqxatSJmktQ5YVwOCN9cxSRV.8gHkW

    LƯU Ý:
    - Chạy Flyway migrations (tạo bảng) trước, sau đó mới chạy script này.
    - Script dành cho database mới hoặc database chưa có các email/code bên dưới.
    - Toàn bộ phần DML nằm trong một khối DO atomic: lỗi ở bất kỳ câu lệnh nào
      sẽ tự động rollback cả khối (thay cho TRY/CATCH của T-SQL).
*/

DO $$
DECLARE
    v_now timestamp(6) := localtimestamp;
    v_pw  varchar(255) := '$2a$12$SIzd3JpjQSPzLKmp3u30cOylqxatSJmktQ5YVwOCN9cxSRV.8gHkW';

    v_admin_id     bigint;
    v_referee_id   bigint;
    v_spectator_id bigint;

    v_org1_owner bigint;
    v_org2_owner bigint;
    v_org3_owner bigint;
    v_org4_owner bigint;

    v_active_org_id bigint;

    v_tourn_a     bigint;
    v_tourn_b     bigint;
    v_lc_approved bigint;
    v_lc_open     bigint;
    v_lc_ongoing  bigint;

    v_first_race_id          bigint;
    v_winner_participant_id  bigint;
    v_second_participant_id  bigint;
    v_third_participant_id   bigint;
BEGIN
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
        ('SPECTATOR',   'Spectator'),
        ('ORGANIZER',   'Organizer')
    ) AS v(name, description)
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
    (true, '1990-01-15', true, true, true, v_now, v_now, 'MALE',   '0901000001', 'ACTIVE', 'admin@horseracing.com',     'Alexander Sterling', NULL, 'London, United Kingdom', v_pw),
    (true, '1985-04-20', true, true, true, v_now, v_now, 'MALE',   '0901000002', 'ACTIVE', 'referee@horseracing.com',   'Jonathan Whitmore',  NULL, 'London, United Kingdom', v_pw),
    (true, '2000-09-12', true, true, true, v_now, v_now, 'FEMALE', '0901000003', 'ACTIVE', 'spectator@horseracing.com', 'Sophia Bennett',     NULL, 'London, United Kingdom', v_pw),

    (true, '1982-02-01', true, true, true, v_now, v_now, 'MALE',   '0912000001', 'ACTIVE', 'owner1@gmail.com', 'Oliver Kensington',  NULL, 'Mayfair, London', v_pw),
    (true, '1984-03-02', true, true, true, v_now, v_now, 'FEMALE', '0912000002', 'ACTIVE', 'owner2@gmail.com', 'Charlotte Beaumont', NULL, 'Nice, France', v_pw),
    (true, '1981-04-03', true, true, true, v_now, v_now, 'MALE',   '0912000003', 'ACTIVE', 'owner3@gmail.com', 'William Harrington', NULL, 'Dublin, Ireland', v_pw),
    (true, '1986-05-04', true, true, true, v_now, v_now, 'FEMALE', '0912000004', 'ACTIVE', 'owner4@gmail.com', 'Isabella Montgomery',NULL, 'Madrid, Spain', v_pw),
    (true, '1983-06-05', true, true, true, v_now, v_now, 'MALE',   '0912000005', 'ACTIVE', 'owner5@gmail.com', 'Henry Caldwell',     NULL, 'Florence, Italy', v_pw),
    (true, '1987-07-06', true, true, true, v_now, v_now, 'FEMALE', '0912000006', 'ACTIVE', 'owner6@gmail.com', 'Amelia Sinclair',    NULL, 'Edinburgh, Scotland', v_pw),
    (true, '1980-08-07', true, true, true, v_now, v_now, 'MALE',   '0912000007', 'ACTIVE', 'owner7@gmail.com', 'Edward Kingsley',    NULL, 'Vienna, Austria', v_pw),
    (true, '1988-09-08', true, true, true, v_now, v_now, 'FEMALE', '0912000008', 'ACTIVE', 'owner8@gmail.com', 'Victoria Ashford',   NULL, 'Geneva, Switzerland', v_pw),

    (true, '1996-01-11', true, true, true, v_now, v_now, 'MALE',   '0923000001', 'ACTIVE', 'jockey1@gmail.com', 'Liam Carter',     NULL, 'Newmarket, United Kingdom', v_pw),
    (true, '1997-02-12', true, true, true, v_now, v_now, 'FEMALE', '0923000002', 'ACTIVE', 'jockey2@gmail.com', 'Emma Collins',    NULL, 'Newmarket, United Kingdom', v_pw),
    (true, '1995-03-13', true, true, true, v_now, v_now, 'MALE',   '0923000003', 'ACTIVE', 'jockey3@gmail.com', 'Noah Bennett',    NULL, 'Newmarket, United Kingdom', v_pw),
    (true, '1998-04-14', true, true, true, v_now, v_now, 'FEMALE', '0923000004', 'ACTIVE', 'jockey4@gmail.com', 'Olivia Hayes',    NULL, 'Newmarket, United Kingdom', v_pw),
    (true, '1994-05-15', true, true, true, v_now, v_now, 'MALE',   '0923000005', 'ACTIVE', 'jockey5@gmail.com', 'Ethan Brooks',    NULL, 'Newmarket, United Kingdom', v_pw),
    (true, '1999-06-16', true, true, true, v_now, v_now, 'FEMALE', '0923000006', 'ACTIVE', 'jockey6@gmail.com', 'Ava Richardson',  NULL, 'Newmarket, United Kingdom', v_pw),
    (true, '1993-07-17', true, true, true, v_now, v_now, 'MALE',   '0923000007', 'ACTIVE', 'jockey7@gmail.com', 'Lucas Morgan',    NULL, 'Newmarket, United Kingdom', v_pw),
    (true, '1996-08-18', true, true, true, v_now, v_now, 'FEMALE', '0923000008', 'ACTIVE', 'jockey8@gmail.com', 'Mia Thompson',    NULL, 'Newmarket, United Kingdom', v_pw),

    (true, '1979-03-10', true, true, true, v_now, v_now, 'MALE',   '0934000001', 'ACTIVE',               'organizer1@horseracing.com', 'Reginald Pembroke', NULL, 'Ascot, United Kingdom',   v_pw),
    (true, '1983-06-22', true, true, true, v_now, v_now, 'FEMALE', '0934000002', 'ACTIVE',               'organizer2@horseracing.com', 'Beatrice Langford', NULL, 'Chantilly, France',       v_pw),
    (true, '1975-11-05', true, true, true, v_now, v_now, 'MALE',   '0934000003', 'ACTIVE',               'organizer3@horseracing.com', 'Cornelius Vane',    NULL, 'Dublin, Ireland',         v_pw),
    (true, '1981-08-19', true, true, true, v_now, v_now, 'FEMALE', '0934000004', 'ACTIVE',               'organizer4@horseracing.com', 'Lavinia Cross',     NULL, 'Milan, Italy',            v_pw),
    (true, '1992-02-02', true, true, true, v_now, v_now, 'MALE',   '0945000001', 'SUSPENDED',            'suspended@horseracing.com',  'Marcus Doyle',      NULL, 'Leeds, United Kingdom',   v_pw),
    (true, '1990-07-07', true, true, true, v_now, v_now, 'FEMALE', '0945000002', 'BANNED',               'banned@horseracing.com',     'Frances Webb',      NULL, 'Cardiff, Wales',          v_pw),
    (false,'2001-12-01', false,false,false, v_now, v_now, 'MALE',  '0945000003', 'PENDING_EMAIL_VERIFY', 'pending@horseracing.com',    'Toby Fenwick',      NULL, 'Bristol, United Kingdom', v_pw);

    SELECT id INTO v_admin_id     FROM users WHERE email = 'admin@horseracing.com';
    SELECT id INTO v_referee_id   FROM users WHERE email = 'referee@horseracing.com';
    SELECT id INTO v_spectator_id FROM users WHERE email = 'spectator@horseracing.com';

    /* ================================================================
       3. USER ROLES
       ================================================================ */
    INSERT INTO user_roles(user_id, role_id, status, assigned_at, assigned_by)
    SELECT u.id, r.id, 'ACTIVE', v_now, v_admin_id
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
    SELECT ur.id, NULL, 'ACTIVE', v_now, v_admin_id, 'Initial international demo dataset'
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
        v_now,
        v_admin_id,
        v_now,
        v_now,
        p.owner_id,
        u.phone,
        'APPROVED',
        CONCAT('OWNER-LIC-', lpad(p.rn::text, 2, '0')),
        u.email,
        CASE p.rn WHEN 1 THEN 'Sterling Crown Racing' WHEN 2 THEN 'Beaumont Equestrian' WHEN 3 THEN 'Harrington Thoroughbreds' WHEN 4 THEN 'Montgomery Racing Club' WHEN 5 THEN 'Caldwell Bloodstock' WHEN 6 THEN 'Sinclair Elite Racing' WHEN 7 THEN 'Kingsley Heritage Stud' ELSE 'Ashford Grand Racing' END,
        u.full_name,
        CASE p.rn WHEN 1 THEN 'Silvercrest Stables' WHEN 2 THEN 'Bluebell Manor' WHEN 3 THEN 'Royal Oak Stables' WHEN 4 THEN 'Golden Meadow Farm' WHEN 5 THEN 'Ironwood Racing Yard' WHEN 6 THEN 'Moonlight Downs' WHEN 7 THEN 'Highland Crown Stables' ELSE 'Rosewood Estate' END,
        CONCAT('/uploads/owners/owner-', p.rn, '-license.pdf'),
        CONCAT('/images/stables/stable-', p.rn, '.png'),
        CONCAT('International racehorse owner with ', 5 + p.rn, ' years of professional stable management experience.'),
        u.address,
        CONCAT('Approved international owner profile number ', p.rn, '.'),
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
        10, v_now, v_admin_id, v_now, v_now,
        v_referee_id, 'ACTIVE', 'REF-LIC-001',
        '/uploads/referee/referee-license.pdf',
        'International Thoroughbred Racing Officials Certification',
        NULL,
        'Senior race official responsible for all scheduled championship rounds.'
    );

    /* ================================================================
       6. HORSES - MỖI OWNER ĐÚNG 01 HORSE
       ================================================================ */
    WITH OwnerRows AS (
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
        (CURRENT_DATE - (4 + (rn % 3)) * INTERVAL '1 year')::date,
        155 + rn,
        440 + rn * 4,
        v_now,
        v_admin_id,
        v_now,
        v_now,
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
        CONCAT('HORSE-', lpad(rn::text, 2, '0')),
        CASE rn
            WHEN 1 THEN 'Midnight Sovereign'
            WHEN 2 THEN 'Aurora Belle'
            WHEN 3 THEN 'Crimson Dynasty'
            WHEN 4 THEN 'Silver Mirage'
            WHEN 5 THEN 'Imperial Valor'
            WHEN 6 THEN 'Golden Tempest'
            WHEN 7 THEN 'Storm Chaser'
            ELSE 'Celestial Crown'
        END,
        CONCAT('/uploads/horses/horse-', rn, '-evidence.pdf'),
        CONCAT('/images/horses/horse-', rn, '.jpg'),
        CONCAT('Elite thoroughbred racehorse selected for international championship entry number ', rn, '.'),
        'Passed full veterinary examination and cleared for competition.',
        NULL
    FROM OwnerRows;

    /* ================================================================
       7. WALLETS + SEED BALANCES (tiền thật VND)
       ================================================================ */
    INSERT INTO wallets(user_id, balance, status, updated_at)
    SELECT u.id,
           CASE WHEN u.id = v_spectator_id THEN 1000000 ELSE 100000 END,
           'ACTIVE',
           v_now
    FROM users u
    WHERE u.email LIKE '%@horseracing.com'
       OR u.email LIKE 'owner%@gmail.com'
       OR u.email LIKE 'jockey%@gmail.com';

    INSERT INTO wallet_transactions(
        amount, created_at, reference_id, user_id, reference_type,
        transaction_type, balance_after, description
    )
    SELECT
        CASE WHEN u.id = v_spectator_id THEN 1000000 ELSE 100000 END,
        v_now,
        NULL,
        u.id,
        'SEED',
        'ADMIN_ADJUSTMENT',
        CASE WHEN u.id = v_spectator_id THEN 1000000 ELSE 100000 END,
        'Initial demo balance'
    FROM users u
    WHERE u.email LIKE '%@horseracing.com'
       OR u.email LIKE 'owner%@gmail.com'
       OR u.email LIKE 'jockey%@gmail.com';

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
        CURRENT_DATE + 40,
        8, 1,
        CURRENT_DATE + 5,
        v_now, v_admin_id,
        v_now + INTERVAL '3 days',
        v_now - INTERVAL '20 days',
        v_now,
        'SCHEDULE_PUBLISHED',
        'HRT-CHAMPIONSHIP-2026-A',
        'Royal Ascendancy Cup 2026',
        'An international eight-round championship featuring eight elite owners, jockeys and thoroughbred horses.',
        'Newmarket Racecourse, United Kingdom'
    ),
    (
        CURRENT_DATE + 80,
        8, 1,
        CURRENT_DATE + 45,
        v_now, v_admin_id,
        v_now + INTERVAL '35 days',
        v_now - INTERVAL '10 days',
        v_now,
        'SCHEDULE_PUBLISHED',
        'HRT-CHAMPIONSHIP-2026-B',
        'Continental Crown Championship 2026',
        'A prestigious continental racing series with eight confirmed competitors in every scheduled round.',
        'Chantilly Racecourse, France'
    );

    /* ================================================================
       9. BẢNG GHÉP 8 OWNER - 8 HORSE - 8 JOCKEY (temp table)
       ================================================================ */
    CREATE TEMP TABLE tmp_pairs(
        rn        int PRIMARY KEY,
        owner_id  bigint NOT NULL,
        horse_id  bigint NOT NULL,
        jockey_id bigint NOT NULL
    ) ON COMMIT DROP;

    WITH owners AS (
        SELECT id,
               ROW_NUMBER() OVER (ORDER BY email) rn
        FROM users
        WHERE email LIKE 'owner%@gmail.com'
    ),
    jockeys AS (
        SELECT id,
               ROW_NUMBER() OVER (ORDER BY email) rn
        FROM users
        WHERE email LIKE 'jockey%@gmail.com'
    ),
    horserows AS (
        SELECT h.id,
               h.owner_id,
               ROW_NUMBER() OVER (ORDER BY h.registration_code) rn
        FROM horses h
        WHERE h.registration_code LIKE 'HORSE-%'
    )
    INSERT INTO tmp_pairs(rn, owner_id, horse_id, jockey_id)
    SELECT o.rn, o.id, h.id, j.id
    FROM owners o
    JOIN horserows h ON h.rn = o.rn AND h.owner_id = o.id
    JOIN jockeys j ON j.rn = o.rn;

    /* ================================================================
       10. REGISTRATION, JOCKEY APPLICATION, INVITATION, PARTICIPANT
       ================================================================ */
    INSERT INTO tournament_registrations(
        created_at, horse_id, owner_id, reviewed_at, reviewed_by,
        tournament_id, updated_at, status, note, rejection_reason
    )
    SELECT
        v_now, p.horse_id, p.owner_id, v_now, v_admin_id,
        t.id, v_now, 'APPROVED',
        'Registration approved for the official championship entry list.',
        NULL
    FROM tournaments t
    CROSS JOIN tmp_pairs p
    WHERE t.code IN ('HRT-CHAMPIONSHIP-2026-A', 'HRT-CHAMPIONSHIP-2026-B');

    INSERT INTO jockey_tournament_applications(
        created_at, jockey_id, reviewed_at, reviewed_by,
        tournament_id, updated_at, withdrawn_at,
        status, message, rejection_reason
    )
    SELECT
        v_now, p.jockey_id, v_now, v_admin_id,
        t.id, v_now, NULL,
        'APPROVED_FOR_POOL',
        'Jockey application reviewed and approved for the championship roster.',
        NULL
    FROM tournaments t
    CROSS JOIN tmp_pairs p
    WHERE t.code IN ('HRT-CHAMPIONSHIP-2026-A', 'HRT-CHAMPIONSHIP-2026-B');

    INSERT INTO jockey_invitations(
        accepted_at, created_at, horse_id, jockey_application_id,
        jockey_id, owner_id, read_at, rejected_at, tournament_id,
        tournament_registration_id, updated_at, status,
        agreement_url, message, rejection_reason, agreement_file_name
    )
    SELECT
        v_now,
        v_now,
        p.horse_id,
        ja.id,
        p.jockey_id,
        p.owner_id,
        v_now,
        NULL,
        t.id,
        tr.id,
        v_now,
        'ACCEPTED',
        CONCAT('/uploads/agreements/tournament-', t.id, '-pair-', p.rn, '.pdf'),
        CONCAT('Official riding invitation for ', t.name, ' - partnership number ', p.rn),
        NULL,
        CONCAT('agreement-', t.code, '-', p.rn, '.pdf')
    FROM tournaments t
    CROSS JOIN tmp_pairs p
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
        v_now,
        p.horse_id,
        p.jockey_id,
        ji.id,
        p.owner_id,
        t.id,
        tr.id,
        v_now,
        'ACTIVE'
    FROM tournaments t
    CROSS JOIN tmp_pairs p
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
    INSERT INTO races(
        distance_meter, max_participants, min_participants, race_number,
        created_at, created_by, race_at, referee_id, tournament_id,
        updated_at, status, track_condition, code, round_name,
        track_name, name, note
    )
    SELECT
        1200 + (num.n - 1) * 100,
        8,
        8,
        num.n,
        v_now,
        v_admin_id,
        t.start_date::timestamp + INTERVAL '9 hours' + (num.n * 3) * INTERVAL '1 day',
        v_referee_id,
        t.id,
        v_now,
        'SCHEDULED',
        CASE num.n % 4
            WHEN 1 THEN 'DRY'
            WHEN 2 THEN 'GOOD'
            WHEN 3 THEN 'SOFT'
            ELSE 'WET'
        END,
        CONCAT(t.code, '-R', lpad(num.n::text, 2, '0')),
        CONCAT('Round ', num.n),
        CASE WHEN t.code LIKE '%-A' THEN 'Newmarket Rowley Mile' ELSE 'Chantilly Grand Course' END,
        CONCAT(t.name, ' - Race ', num.n),
        'Public scheduled race available for spectators and prediction activities.'
    FROM tournaments t
    CROSS JOIN generate_series(1, 8) AS num(n)
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
        (50.00 + p.rn * 0.50)::numeric(5,2),
        v_now,
        p.horse_id,
        ji.id,
        p.jockey_id,
        p.owner_id,
        r.id,
        v_now,
        'NOT_CHECKED',
        'CONFIRMED',
        'APPROVED',
        'Awaiting official pre-race inspection.'
    FROM races r
    JOIN tournaments t ON t.id = r.tournament_id
    CROSS JOIN tmp_pairs p
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
        v_admin_id,
        v_now,
        v_now,
        'PUBLISHED',
        'Official guide to following the championship and submitting race predictions.',
        'Welcome to the international horse racing championship. Review the race schedule, participant profiles and prediction rules before each round.',
        'international-racing-championship-guide-2026',
        '/images/blogs/guide-2026.jpg',
        'International Racing Championship Guide 2026'
    );

    SELECT r.id INTO v_first_race_id
    FROM races r
    JOIN tournaments t ON t.id = r.tournament_id
    WHERE t.code = 'HRT-CHAMPIONSHIP-2026-A'
    ORDER BY r.race_number
    LIMIT 1;

    SELECT id INTO v_winner_participant_id
    FROM race_participants
    WHERE race_id = v_first_race_id
    ORDER BY lane_number
    LIMIT 1;

    SELECT id INTO v_second_participant_id
    FROM race_participants
    WHERE race_id = v_first_race_id
    ORDER BY lane_number
    OFFSET 1 LIMIT 1;

    SELECT id INTO v_third_participant_id
    FROM race_participants
    WHERE race_id = v_first_race_id
    ORDER BY lane_number
    OFFSET 2 LIMIT 1;

    INSERT INTO race_predictions(
        entry_cost_points, reward_points, created_at, evaluated_at,
        locked_at, predicted_second_id, predicted_third_id,
        predicted_winner_id, race_id, spectator_id, updated_at,
        prediction_type, status
    )
    VALUES
    (
        10, 0, v_now, NULL, NULL,
        NULL, NULL,
        v_winner_participant_id, v_first_race_id, v_spectator_id, v_now,
        'WINNER', 'PENDING'
    ),
    (
        20, 0, v_now, NULL, NULL,
        v_second_participant_id, v_third_participant_id,
        v_winner_participant_id, v_first_race_id, v_spectator_id, v_now,
        'TOP3', 'PENDING'
    );

    UPDATE wallets
    SET balance = balance - 30,
        updated_at = v_now
    WHERE user_id = v_spectator_id;

    INSERT INTO wallet_transactions(
        amount, created_at, reference_id, user_id,
        reference_type, transaction_type, balance_after, description
    )
    SELECT
        -entry_cost_points,
        created_at,
        id,
        spectator_id,
        'RACE_PREDICTION',
        'BET_PLACED',
        NULL,
        CONCAT('Bet on ', prediction_type)
    FROM race_predictions
    WHERE spectator_id = v_spectator_id
      AND race_id = v_first_race_id;

    /* ================================================================
       15. ORGANIZER LAYER — user_roles, organizations, gắn giải vào tổ chức
       ================================================================ */
    SELECT id INTO v_org1_owner FROM users WHERE email = 'organizer1@horseracing.com';
    SELECT id INTO v_org2_owner FROM users WHERE email = 'organizer2@horseracing.com';
    SELECT id INTO v_org3_owner FROM users WHERE email = 'organizer3@horseracing.com';
    SELECT id INTO v_org4_owner FROM users WHERE email = 'organizer4@horseracing.com';

    INSERT INTO user_roles(user_id, role_id, status, assigned_at, assigned_by)
    SELECT u.id, r.id, 'ACTIVE', v_now, v_admin_id
    FROM users u
    JOIN roles r ON r.name = 'ORGANIZER'
    WHERE u.email LIKE 'organizer%@horseracing.com';

    INSERT INTO user_roles(user_id, role_id, status, assigned_at, assigned_by)
    SELECT u.id, r.id, 'ACTIVE', v_now, v_admin_id
    FROM users u
    JOIN roles r ON r.name = 'SPECTATOR'
    WHERE u.email IN ('suspended@horseracing.com', 'banned@horseracing.com', 'pending@horseracing.com');

    INSERT INTO organizations(
        owner_user_id, approved_by, created_at, updated_at, approved_at, deleted_at,
        status, code, name, license_number, contact_email, contact_phone,
        logo_url, evidence_url, description, application_note, rejection_reason
    )
    VALUES
    (v_org1_owner, v_admin_id, v_now, v_now, v_now, NULL, 'ACTIVE',    'ORG-ROYAL',       'Royal Racing Club',        'ORG-LIC-001', 'club@royalracing.com',    '0934000001', '/images/orgs/royal.png',       '/uploads/orgs/royal-kyb.pdf',       'Premier UK organizer running flagship championships.', 'KYB documents verified.',          NULL),
    (v_org2_owner, NULL,       v_now, v_now, NULL,  NULL, 'PENDING',   'ORG-CONTINENTAL', 'Continental Turf Society', 'ORG-LIC-002', 'info@continentalturf.eu', '0934000002', '/images/orgs/continental.png', '/uploads/orgs/continental-kyb.pdf', 'Awaiting platform onboarding approval.',               'Submitted for review, pending KYB.', NULL),
    (v_org3_owner, v_admin_id, v_now, v_now, v_now,  NULL, 'SUSPENDED', 'ORG-EMERALD',     'Emerald Isle Racing',      'ORG-LIC-003', 'ops@emeraldracing.ie',    '0934000003', '/images/orgs/emerald.png',     '/uploads/orgs/emerald-kyb.pdf',     'Suspended pending compliance review.',                 'Approved then suspended for audit.', NULL),
    (v_org4_owner, v_admin_id, v_now, v_now, NULL,  NULL, 'REJECTED',  'ORG-MERIDIAN',    'Meridian Equestrian',      NULL,          'hello@meridianeq.it',     '0934000004', NULL,                           '/uploads/orgs/meridian-kyb.pdf',    'Application rejected.',                                 'Incomplete KYB submission.',         'License number could not be verified.');

    SELECT id INTO v_active_org_id FROM organizations WHERE code = 'ORG-ROYAL';

    UPDATE tournaments
    SET organization_id = v_active_org_id,
        created_by      = v_org1_owner,
        approved_by     = v_admin_id,
        approved_at     = v_now,
        updated_at      = v_now
    WHERE code IN ('HRT-CHAMPIONSHIP-2026-A', 'HRT-CHAMPIONSHIP-2026-B');

    /* ----- 7 giải shell phủ đủ các pha vòng đời (thuộc tổ chức ACTIVE) ----- */
    INSERT INTO tournaments(
        end_date, max_horses, max_horses_per_owner, start_date, created_at, created_by,
        registration_end_at, registration_start_at, updated_at, status, code, name,
        description, location, organization_id, approved_by, approved_at, rejection_reason
    )
    VALUES
    (CURRENT_DATE + 70, 8, 1, CURRENT_DATE + 40, v_now, v_org1_owner, v_now + INTERVAL '30 days', v_now + INTERVAL '10 days', v_now, 'DRAFT',             'HRT-LC-DRAFT',     'Spring Maiden Trophy (Draft)',          'Draft tournament still being prepared by the organizer.',    'Newmarket Racecourse, United Kingdom', v_active_org_id, NULL,       NULL,  NULL),
    (CURRENT_DATE + 75, 8, 1, CURRENT_DATE + 45, v_now, v_org1_owner, v_now + INTERVAL '35 days', v_now + INTERVAL '12 days', v_now, 'PENDING_APPROVAL',  'HRT-LC-PENDING',   'Summer Distance Cup (Pending Approval)','Submitted to admin for launch approval (Cong 2 / BR-17).',   'Ascot Racecourse, United Kingdom',     v_active_org_id, NULL,       NULL,  NULL),
    (CURRENT_DATE + 80, 8, 1, CURRENT_DATE + 50, v_now, v_org1_owner, v_now + INTERVAL '40 days', v_now + INTERVAL '14 days', v_now, 'APPROVED',          'HRT-LC-APPROVED',  'Autumn Sprint Series (Approved)',       'Approved by admin, organizer about to open registration.',   'York Racecourse, United Kingdom',      v_active_org_id, v_admin_id, v_now, NULL),
    (CURRENT_DATE + 50, 8, 1, CURRENT_DATE + 20, v_now, v_org1_owner, v_now + INTERVAL '10 days', v_now - INTERVAL '2 days',  v_now, 'OPEN_REGISTRATION', 'HRT-LC-OPEN',      'Winter Classic (Open Registration)',    'Registration window currently open for owners and jockeys.', 'Chantilly Racecourse, France',         v_active_org_id, v_admin_id, v_now, NULL),
    (CURRENT_DATE + 8,  8, 1, CURRENT_DATE - 6,  v_now, v_org1_owner, v_now - INTERVAL '12 days', v_now - INTERVAL '25 days', v_now, 'ONGOING',           'HRT-LC-ONGOING',   'Grand Prix Championship (Ongoing)',     'Championship currently in progress.',                        'Longchamp Racecourse, France',         v_active_org_id, v_admin_id, v_now, NULL),
    (CURRENT_DATE - 10, 8, 1, CURRENT_DATE - 40, v_now, v_org1_owner, v_now - INTERVAL '45 days', v_now - INTERVAL '60 days', v_now, 'COMPLETED',         'HRT-LC-COMPLETED', 'Heritage Gold Cup (Completed)',         'Concluded championship retained for history.',               'Newmarket Racecourse, United Kingdom', v_active_org_id, v_admin_id, v_now, NULL),
    (CURRENT_DATE + 90, 8, 1, CURRENT_DATE + 60, v_now, v_org1_owner, v_now + INTERVAL '50 days', v_now + INTERVAL '20 days', v_now, 'POSTPONED',         'HRT-LC-POSTPONED', 'Coastal Invitational (Postponed)',      'Postponed due to scheduling.',                               'Deauville Racecourse, France',         v_active_org_id, v_admin_id, v_now, NULL);

    /* ----- referee_contracts: đủ PENDING / ACTIVE / DECLINED / TERMINATED ----- */
    SELECT id INTO v_tourn_a     FROM tournaments WHERE code = 'HRT-CHAMPIONSHIP-2026-A';
    SELECT id INTO v_tourn_b     FROM tournaments WHERE code = 'HRT-CHAMPIONSHIP-2026-B';
    SELECT id INTO v_lc_approved FROM tournaments WHERE code = 'HRT-LC-APPROVED';
    SELECT id INTO v_lc_open     FROM tournaments WHERE code = 'HRT-LC-OPEN';
    SELECT id INTO v_lc_ongoing  FROM tournaments WHERE code = 'HRT-LC-ONGOING';

    INSERT INTO referee_contracts(
        tournament_id, referee_id, invited_by, terminated_by, created_at, updated_at,
        responded_at, terminated_at, status, agreement_url, reason
    )
    VALUES
    (v_tourn_a,     v_referee_id, v_org1_owner, NULL,         v_now, v_now, v_now, NULL,  'ACTIVE',     '/uploads/contracts/ref-tourn-a.pdf', 'Season-long officiating contract.'),
    (v_tourn_b,     v_referee_id, v_org1_owner, NULL,         v_now, v_now, v_now, NULL,  'ACTIVE',     '/uploads/contracts/ref-tourn-b.pdf', 'Season-long officiating contract.'),
    (v_lc_approved, v_referee_id, v_org1_owner, NULL,         v_now, v_now, NULL,  NULL,  'PENDING',    NULL,                                 'Invitation awaiting referee response.'),
    (v_lc_open,     v_referee_id, v_org1_owner, NULL,         v_now, v_now, v_now, NULL,  'DECLINED',   NULL,                                 'Referee declined due to a schedule conflict.'),
    (v_lc_ongoing,  v_referee_id, v_org1_owner, v_org1_owner, v_now, v_now, v_now, v_now, 'TERMINATED', '/uploads/contracts/ref-ongoing.pdf', 'Contract terminated mid-season by the organizer.');

    /* ================================================================
       16. ROLE REQUESTS — đủ PENDING / APPROVED / REJECTED / CANCELLED
       ================================================================ */
    INSERT INTO role_requests(
        created_at, cv_reviewed_at, cv_reviewed_by, reviewed_at, reviewed_by, updated_at,
        user_id, cv_review_status, status, requested_role, resume_url, admin_note, cv_review_note, reason
    )
    VALUES
    (v_now, NULL,  NULL,       NULL,  NULL,       v_now, v_spectator_id,                                                       'NOT_REVIEWED', 'PENDING',   'JOCKEY',      '/uploads/cv/spectator-jockey.pdf', NULL,                                     NULL,            'I would like to compete as a jockey.'),
    (v_now, v_now, v_admin_id, v_now, v_admin_id, v_now, (SELECT id FROM users WHERE email = 'suspended@horseracing.com'),     'PASSED',       'APPROVED',  'HORSE_OWNER', '/uploads/cv/owner-request.pdf',    'Approved by admin.',                     'CV verified.', 'Requesting horse owner privileges.'),
    (v_now, NULL,  NULL,       v_now, v_admin_id, v_now, (SELECT id FROM users WHERE email = 'banned@horseracing.com'),        'NOT_REVIEWED', 'REJECTED',  'REFEREE',     '/uploads/cv/referee-request.pdf',  'Rejected: insufficient certification.',  NULL,            'Requesting referee licensing.'),
    (v_now, NULL,  NULL,       NULL,  NULL,       v_now, (SELECT id FROM users WHERE email = 'pending@horseracing.com'),       'NOT_REVIEWED', 'CANCELLED', 'JOCKEY',      NULL,                               NULL,                                     NULL,            'Withdrew the application.');

    /* ================================================================
       17. RESULTS SHOWCASE — Race 1 của giải A đã PUBLISHED
       (race_results + referee_report + pre_race_checks + violation +
        settlement job + dự đoán đã chấm CORRECT/INCORRECT + standings)
       ================================================================ */
    UPDATE races       SET status = 'PUBLISHED', updated_at = v_now WHERE id = v_first_race_id;
    UPDATE tournaments SET status = 'ONGOING',   updated_at = v_now WHERE code = 'HRT-CHAMPIONSHIP-2026-A';

    INSERT INTO race_results(
        finish_time_seconds, penalty_seconds, points, position, prize_points,
        raw_finish_time_seconds, confirmed_at, confirmed_by, created_at, participant_id,
        published_at, race_id, submitted_at, submitted_by, updated_at,
        result_status, status, note
    )
    SELECT
        (70 + x.position)::numeric(10,3),
        0,
        x.points,
        x.position,
        CASE x.position WHEN 1 THEN 1000 WHEN 2 THEN 600 WHEN 3 THEN 300 ELSE 0 END,
        (70 + x.position)::numeric(10,3),
        v_now, v_admin_id, v_now, x.id, v_now, v_first_race_id, v_now, v_referee_id, v_now,
        'FINISHED', 'PUBLISHED', 'Official published result.'
    FROM (
        SELECT rp.id,
               CASE rp.lane_number WHEN 2 THEN 3 WHEN 3 THEN 2 ELSE rp.lane_number END AS position,
               CASE (CASE rp.lane_number WHEN 2 THEN 3 WHEN 3 THEN 2 ELSE rp.lane_number END)
                    WHEN 1 THEN 25 WHEN 2 THEN 18 WHEN 3 THEN 15 WHEN 4 THEN 12
                    WHEN 5 THEN 10 WHEN 6 THEN 8  WHEN 7 THEN 6  ELSE 4 END AS points
        FROM race_participants rp
        WHERE rp.race_id = v_first_race_id
    ) x;

    INSERT INTO referee_reports(
        confirmed_at, confirmed_by, created_at, race_id, referee_id, submitted_at,
        updated_at, status, title, ai_summary, rejection_reason, summary
    )
    VALUES(
        v_now, v_admin_id, v_now, v_first_race_id, v_referee_id, v_now, v_now, 'CONFIRMED',
        'Round 1 Official Report', 'Clean race; one minor crowding incident.', NULL,
        'All eight runners completed. Result confirmed and published.'
    );

    INSERT INTO pre_race_checks(
        equipment_ok, health_ok, horse_identity_ok, jockey_identity_ok, weight_ok,
        checked_at, created_at, participant_id, race_id, referee_id, result, note
    )
    SELECT true, true, true, true, true, v_now, v_now, rp.id, v_first_race_id, v_referee_id, 'PASSED', 'Pre-race inspection passed.'
    FROM race_participants rp
    WHERE rp.race_id = v_first_race_id;

    INSERT INTO violations(
        created_at, occurred_at, participant_id, race_id, reported_by, updated_at,
        severity, violation_type, penalty, description
    )
    SELECT v_now, v_now, rp.id, v_first_race_id, v_referee_id, v_now,
        'MINOR', 'CROWDING', 'Official warning', 'Minor crowding on the final bend; warning issued.'
    FROM race_participants rp
    WHERE rp.race_id = v_first_race_id
    ORDER BY rp.lane_number
    LIMIT 1;

    INSERT INTO prediction_settlement_jobs(
        failed_count, processed_count, retry_count, rewarded_count, completed_at,
        created_at, race_id, started_at, updated_at, status, error_message
    )
    VALUES(0, 2, 0, 1, v_now, v_now, v_first_race_id, v_now, v_now, 'COMPLETED', NULL);

    UPDATE race_predictions
    SET status = 'CORRECT', reward_points = 50, evaluated_at = v_now, locked_at = v_now, updated_at = v_now
    WHERE race_id = v_first_race_id AND prediction_type = 'WINNER';

    UPDATE race_predictions
    SET status = 'INCORRECT', reward_points = 0, evaluated_at = v_now, locked_at = v_now, updated_at = v_now
    WHERE race_id = v_first_race_id AND prediction_type = 'TOP3';

    UPDATE wallets
    SET balance = balance + 50, updated_at = v_now
    WHERE user_id = v_spectator_id;

    INSERT INTO wallet_transactions(
        amount, created_at, reference_id, user_id, reference_type, transaction_type, balance_after, description
    )
    SELECT 50, v_now, id, v_spectator_id, 'RACE_PREDICTION', 'BET_PAYOUT', NULL,
        'Winner bet payout for published race.'
    FROM race_predictions
    WHERE race_id = v_first_race_id AND prediction_type = 'WINNER';

    UPDATE tournament_participants tp
    SET points = rr.points, updated_at = v_now
    FROM race_participants rp
    JOIN race_results rr ON rr.participant_id = rp.id
    WHERE rp.horse_id = tp.horse_id
      AND rp.jockey_id = tp.jockey_id
      AND rp.race_id = v_first_race_id
      AND tp.tournament_id = v_tourn_a;
END $$;

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
