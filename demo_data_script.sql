/*
    HORSE RACING TOURNAMENT SYSTEM - FULL DEMO DATA
    PostgreSQL

    Dữ liệu chính (lifecycle tiêu biểu — đã đồng bộ với enum sau merge):
    - 01 ADMIN, 01 REFEREE, 01 SPECTATOR, 08 HORSE_OWNER, 08 JOCKEY
    - 04 ORGANIZER + 03 user trạng thái khác (SUSPENDED / BANNED / PENDING_EMAIL_VERIFY)
    - 04 organizations (ACTIVE / PENDING / SUSPENDED / REJECTED)
    - 02 giải chính (8 owner-horse-jockey, 8 race, 8 participant mỗi race)
    - 03 giải phủ pha đầu vòng đời: DRAFT / PENDING_APPROVAL / OPEN_REGISTRATION
      (giải OPEN_REGISTRATION có registration + jockey application thật đang chờ xét)
    - referee_contracts đủ PENDING / ACTIVE / DECLINED / TERMINATED
    - role_requests đủ PENDING / APPROVED / REJECTED / CANCELLED
    - Race 1 của giải A đã PUBLISHED: race_results + referee_report + pre_race_checks
      + violation, mọi timestamp neo vào giờ đua thật

    KHÔNG SEED TIỀN — CỐ Ý:
    Script này không tạo dòng nào trong wallets, wallet_transactions, topup_orders,
    race_predictions, prediction_settlement_jobs, withdrawal_requests. Ví tự sinh với
    balance 0 khi user mở trang (WalletService.getOrCreateAccount). Lý do: số dư seed
    thẳng vào DB không có topup_orders hay hành động admin nào đối chiếu, nên lịch sử
    giao dịch không dựng lại được số dư — ledger tiền thật phải do app ghi. Muốn demo
    nạp/cược thì nạp qua VNPay sandbox rồi đặt cược trên race chưa diễn ra.

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

    v_tourn_a    bigint;
    v_tourn_b    bigint;
    v_lc_draft   bigint;
    v_lc_pending bigint;
    v_lc_open    bigint;

    /* Race 1 giải A: showcase kết quả đã publish. Mọi timestamp của showcase neo vào
       v_first_race_at (giờ đua thật) thay vì v_now, để không sinh ra "kết quả chính thức
       của cuộc đua chưa diễn ra". */
    v_first_race_id bigint;
    v_first_race_at timestamp(6);
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
    -- (true, '1990-01-15', true, true, true, v_now, v_now, 'MALE',   '0901000001', 'ACTIVE', 'admin@gmail.com',     'Alexander Sterling', NULL, 'London, United Kingdom', v_pw),
    (true, '1985-04-20', true, true, true, v_now, v_now, 'MALE',   '0901000002', 'ACTIVE', 'referee@gmail.com',   'Jonathan Whitmore',  NULL, 'London, United Kingdom', v_pw),
    (true, '2000-09-12', true, true, true, v_now, v_now, 'FEMALE', '0901000003', 'ACTIVE', 'spectator@gmail.com', 'Sophia Bennett',     NULL, 'London, United Kingdom', v_pw),

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

    (true, '1979-03-10', true, true, true, v_now, v_now, 'MALE',   '0934000001', 'ACTIVE',               'organizer1@gmail.com', 'Reginald Pembroke', NULL, 'Ascot, United Kingdom',   v_pw),
    (true, '1983-06-22', true, true, true, v_now, v_now, 'FEMALE', '0934000002', 'ACTIVE',               'organizer2@gmail.com', 'Beatrice Langford', NULL, 'Chantilly, France',       v_pw),
    (true, '1975-11-05', true, true, true, v_now, v_now, 'MALE',   '0934000003', 'ACTIVE',               'organizer3@gmail.com', 'Cornelius Vane',    NULL, 'Dublin, Ireland',         v_pw),
    (true, '1981-08-19', true, true, true, v_now, v_now, 'FEMALE', '0934000004', 'ACTIVE',               'organizer4@gmail.com', 'Lavinia Cross',     NULL, 'Milan, Italy',            v_pw),
    (true, '1992-02-02', true, true, true, v_now, v_now, 'MALE',   '0945000001', 'SUSPENDED',            'suspended@gmail.com',  'Marcus Doyle',      NULL, 'Leeds, United Kingdom',   v_pw),
    (true, '1990-07-07', true, true, true, v_now, v_now, 'FEMALE', '0945000002', 'BANNED',               'banned@gmail.com',     'Frances Webb',      NULL, 'Cardiff, Wales',          v_pw),
    (false,'2001-12-01', false,false,false, v_now, v_now, 'MALE',  '0945000003', 'PENDING_EMAIL_VERIFY', 'pending@horseracing.com',    'Toby Fenwick',      NULL, 'Bristol, United Kingdom', v_pw);

    SELECT id INTO v_admin_id     FROM users WHERE email = 'admin@gmail.com';
    SELECT id INTO v_referee_id   FROM users WHERE email = 'referee@gmail.com';
    SELECT id INTO v_spectator_id FROM users WHERE email = 'spectator@gmail.com';

    IF v_admin_id IS NULL OR v_referee_id IS NULL OR v_spectator_id IS NULL THEN
        RAISE EXCEPTION 'Seed lookup failed: admin_id=%, referee_id=%, spectator_id=%. Emails found in users table: %',
            v_admin_id, v_referee_id, v_spectator_id,
            (SELECT string_agg(email, ', ') FROM users WHERE email IN ('admin@gmail.com', 'referee@gmail.com', 'spectator@gmail.com'));
    END IF;

    /* ================================================================
       3. USER ROLES
       ================================================================ */
    INSERT INTO user_roles(user_id, role_id, status, assigned_at, assigned_by)
    SELECT u.id, r.id, 'ACTIVE', v_now, v_admin_id
    FROM users u
    JOIN roles r ON
        (u.email = 'admin@gmail.com'     AND r.name = 'ADMIN') OR
        (u.email = 'referee@gmail.com'   AND r.name = 'REFEREE') OR
        (u.email = 'spectator@gmail.com' AND r.name = 'SPECTATOR') OR
        (u.email LIKE 'owner%@gmail.com'        AND r.name = 'HORSE_OWNER') OR
        (u.email LIKE 'jockey%@gmail.com'       AND r.name = 'JOCKEY')
    /* user_roles không có unique (user_id, role_id), nên nếu admin đã được
       DevDataSeeder gán role ADMIN ở local thì insert này sẽ tạo dòng ADMIN thứ hai.
       Guard lại để chạy được trên DB đã có admin sẵn. */
    WHERE NOT EXISTS (
        SELECT 1 FROM user_roles ur
        WHERE ur.user_id = u.id AND ur.role_id = r.id
    );

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
       7. VÍ — CỐ Ý KHÔNG SEED
       ================================================================
       Không tạo dòng nào trong wallets / wallet_transactions. Ví tự sinh với balance 0
       ở lần đọc đầu tiên (WalletService.getOrCreateAccount), nên mọi user vẫn mở được
       trang ví ngay sau seed. Số dư seed thẳng vào DB sẽ không có topup_orders hay hành
       động admin nào đối chiếu (ADMIN_ADJUSTMENT chỉ tồn tại trong enum, không endpoint
       nào tạo ra nó) — tức là số dư mà lịch sử giao dịch không dựng lại được.
       ================================================================ */

    /* ================================================================
       8. TOURNAMENTS
       ================================================================ */
    /* total_prize_pool là VND, cột NOT NULL DEFAULT 0 (V25). Bỏ trống thì trang giải
       công khai hiện "0 VND prize" — FE check `!= null` nên số 0 vẫn render. */
    INSERT INTO tournaments(
        end_date, max_horses, max_horses_per_owner, start_date,
        created_at, created_by, registration_end_at,
        registration_start_at, updated_at, status, code,
        name, description, location, total_prize_pool
    )
    VALUES
    (
        /* Giải A đang diễn ra thật: khai mạc 2 ngày trước, đăng ký đã đóng trước ngày
           khai mạc. Race 1 vì thế nằm ở quá khứ và được publish kết quả hợp lý, 7 race
           còn lại ở tương lai để demo đặt cược. */
        CURRENT_DATE + 21,
        8, 1,
        CURRENT_DATE - 2,
        v_now, v_admin_id,
        v_now - INTERVAL '5 days',
        v_now - INTERVAL '30 days',
        v_now,
        'SCHEDULE_PUBLISHED',
        'HRT-CHAMPIONSHIP-2026-A',
        'Royal Ascendancy Cup 2026',
        'An international eight-round championship featuring eight elite owners, jockeys and thoroughbred horses.',
        'Newmarket Racecourse, United Kingdom',
        500000000
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
        'Chantilly Racecourse, France',
        350000000
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
        /* Race 1 chạy đúng ngày khai mạc, mỗi vòng sau cách 3 ngày. Dùng (n-1) chứ không
           phải n: với n thì race 1 đã lùi 3 ngày so với start_date, khiến giải A "đang
           diễn ra" mà chưa vòng nào tới hạn. */
        t.start_date::timestamp + INTERVAL '9 hours' + ((num.n - 1) * 3) * INTERVAL '1 day',
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
    WHERE t.code IN ('HRT-CHAMPIONSHIP-2026-A', 'HRT-CHAMPIONSHIP-2026-B')
    /* Không có ORDER BY thì hash join trên jockey_invitations phát row theo thứ tự bucket
       (thực đo: lane 8→1), và vì mọi dòng dùng chung v_now nên ORDER BY created_at ở tầng
       query không cứu được. Sắp ở đây để thứ tự heap khớp luôn lane. */
    ORDER BY r.id, p.rn;

    /* ================================================================
       13. BLOG
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

    /* Race 1 giải A — mốc neo cho toàn bộ showcase kết quả ở section 17. */
    SELECT r.id, r.race_at INTO v_first_race_id, v_first_race_at
    FROM races r
    JOIN tournaments t ON t.id = r.tournament_id
    WHERE t.code = 'HRT-CHAMPIONSHIP-2026-A'
    ORDER BY r.race_number
    LIMIT 1;

    IF v_first_race_id IS NULL THEN
        RAISE EXCEPTION 'Seed lookup failed: khong tim thay race dau tien cua HRT-CHAMPIONSHIP-2026-A';
    END IF;

    /* Không seed race_predictions: mỗi dự đoán là một lệnh trừ tiền, nên seed dự đoán là
       seed tiền. Demo cá cược bằng cách nạp VNPay sandbox rồi đặt trên race 2..8 (tương lai). */

    /* ================================================================
       15. ORGANIZER LAYER — user_roles, organizations, gắn giải vào tổ chức
       ================================================================ */
    SELECT id INTO v_org1_owner FROM users WHERE email = 'organizer1@gmail.com';
    SELECT id INTO v_org2_owner FROM users WHERE email = 'organizer2@gmail.com';
    SELECT id INTO v_org3_owner FROM users WHERE email = 'organizer3@gmail.com';
    SELECT id INTO v_org4_owner FROM users WHERE email = 'organizer4@gmail.com';

    INSERT INTO user_roles(user_id, role_id, status, assigned_at, assigned_by)
    SELECT u.id, r.id, 'ACTIVE', v_now, v_admin_id
    FROM users u
    JOIN roles r ON r.name = 'ORGANIZER'
    WHERE u.email LIKE 'organizer%@gmail.com';

    INSERT INTO user_roles(user_id, role_id, status, assigned_at, assigned_by)
    SELECT u.id, r.id, 'ACTIVE', v_now, v_admin_id
    FROM users u
    JOIN roles r ON r.name = 'SPECTATOR'
    WHERE u.email IN ('suspended@gmail.com', 'banned@gmail.com', 'pending@horseracing.com');

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

    /* ----- 3 giải phủ pha đầu vòng đời, thuộc tổ chức ACTIVE -----
       Chỉ giữ những pha mà một giải CHƯA có lịch đua vẫn hợp lý: DRAFT,
       PENDING_APPROVAL, OPEN_REGISTRATION. Các pha APPROVED / ONGOING / COMPLETED /
       POSTPONED đã bỏ: theo TournamentStatus thì races chỉ tồn tại từ SCHEDULE_PUBLISHED
       trở đi, nên một giải ONGOING hay COMPLETED mà 0 race, 0 participant là dữ liệu tự
       mâu thuẫn — giải A/B đã phủ ONGOING đầy đủ và có thật. Tên/code đặt như giải thật,
       không gắn nhãn trạng thái. */
    INSERT INTO tournaments(
        end_date, max_horses, max_horses_per_owner, start_date, created_at, created_by,
        registration_end_at, registration_start_at, updated_at, status, code, name,
        description, location, organization_id, approved_by, approved_at, rejection_reason,
        total_prize_pool
    )
    VALUES
    (CURRENT_DATE + 70, 8, 1, CURRENT_DATE + 40, v_now, v_org1_owner, v_now + INTERVAL '30 days', v_now + INTERVAL '10 days', v_now, 'DRAFT',            'HRT-SPRING-MAIDEN-2026',    'Spring Maiden Trophy', 'A maiden-class trophy for first-season thoroughbreds, opening the spring calendar.', 'Newmarket Racecourse, United Kingdom', v_active_org_id, NULL,       NULL,  NULL,  80000000),
    (CURRENT_DATE + 75, 8, 1, CURRENT_DATE + 45, v_now, v_org1_owner, v_now + INTERVAL '35 days', v_now + INTERVAL '12 days', v_now, 'PENDING_APPROVAL', 'HRT-SUMMER-DISTANCE-2026',  'Summer Distance Cup',  'A long-distance summer series testing stamina over eight extended rounds.',          'Ascot Racecourse, United Kingdom',     v_active_org_id, NULL,       NULL,  NULL, 150000000),
    (CURRENT_DATE + 50, 8, 1, CURRENT_DATE + 20, v_now, v_org1_owner, v_now + INTERVAL '10 days', v_now - INTERVAL '2 days',  v_now, 'OPEN_REGISTRATION','HRT-WINTER-CLASSIC-2026',   'Winter Classic',       'The winter headline meeting at Chantilly, now accepting horse and jockey entries.',  'Chantilly Racecourse, France',         v_active_org_id, v_admin_id, v_now, NULL, 250000000);

    SELECT id INTO v_lc_draft   FROM tournaments WHERE code = 'HRT-SPRING-MAIDEN-2026';
    SELECT id INTO v_lc_pending FROM tournaments WHERE code = 'HRT-SUMMER-DISTANCE-2026';
    SELECT id INTO v_lc_open    FROM tournaments WHERE code = 'HRT-WINTER-CLASSIC-2026';

    IF v_lc_draft IS NULL OR v_lc_pending IS NULL OR v_lc_open IS NULL THEN
        RAISE EXCEPTION 'Seed lookup failed: lifecycle tournaments draft=%, pending=%, open=%',
            v_lc_draft, v_lc_pending, v_lc_open;
    END IF;

    /* ----- Winter Classic đang OPEN_REGISTRATION: phải có đơn thật đang chờ xét -----
       Giải ở pha này chưa có lịch đua nên KHÔNG seed races/participants. Thứ đúng nghiệp
       vụ là đơn đăng ký ngựa và đơn ứng tuyển jockey: 5 đơn PENDING (admin chưa xét) +
       2 đơn APPROVED, và 4 jockey PENDING. Nhờ vậy giải này mở ra vẫn có nội dung thật
       thay vì rỗng trơn. */
    INSERT INTO tournament_registrations(
        created_at, horse_id, owner_id, reviewed_at, reviewed_by,
        tournament_id, updated_at, status, note, rejection_reason
    )
    SELECT
        v_now - (p.rn * INTERVAL '4 hours'),
        p.horse_id, p.owner_id,
        CASE WHEN p.rn <= 2 THEN v_now - INTERVAL '2 hours' ELSE NULL END,
        CASE WHEN p.rn <= 2 THEN v_admin_id ELSE NULL END,
        v_lc_open,
        v_now,
        CASE WHEN p.rn <= 2 THEN 'APPROVED' ELSE 'PENDING' END,
        CASE WHEN p.rn <= 2
             THEN 'Entry approved for the Winter Classic entry list.'
             ELSE 'Entry submitted, awaiting review.' END,
        NULL
    FROM tmp_pairs p
    WHERE p.rn <= 7
    ORDER BY p.rn;

    INSERT INTO jockey_tournament_applications(
        created_at, jockey_id, reviewed_at, reviewed_by,
        tournament_id, updated_at, withdrawn_at,
        status, message, rejection_reason
    )
    SELECT
        v_now - (p.rn * INTERVAL '3 hours'),
        p.jockey_id, NULL, NULL,
        v_lc_open, v_now, NULL,
        'PENDING',
        'Applying to ride in the Winter Classic.',
        NULL
    FROM tmp_pairs p
    WHERE p.rn <= 4
    ORDER BY p.rn;

    /* ----- referee_contracts: đủ PENDING / ACTIVE / DECLINED / TERMINATED -----
       Hợp đồng của giải A/B ký trước ngày khai mạc, không phải "vừa ký xong lúc seed". */
    SELECT id INTO v_tourn_a FROM tournaments WHERE code = 'HRT-CHAMPIONSHIP-2026-A';
    SELECT id INTO v_tourn_b FROM tournaments WHERE code = 'HRT-CHAMPIONSHIP-2026-B';

    IF v_tourn_a IS NULL OR v_tourn_b IS NULL THEN
        RAISE EXCEPTION 'Seed lookup failed: tournament A=%, B=%', v_tourn_a, v_tourn_b;
    END IF;

    INSERT INTO referee_contracts(
        tournament_id, referee_id, invited_by, terminated_by, created_at, updated_at,
        responded_at, terminated_at, status, agreement_url, reason
    )
    VALUES
    (v_tourn_a,     v_referee_id, v_org1_owner, NULL,         v_now - INTERVAL '28 days', v_now, v_now - INTERVAL '26 days', NULL,                      'ACTIVE',     '/uploads/contracts/ref-tourn-a.pdf', 'Season-long officiating contract.'),
    (v_tourn_b,     v_referee_id, v_org1_owner, NULL,         v_now - INTERVAL '9 days',  v_now, v_now - INTERVAL '8 days',  NULL,                      'ACTIVE',     '/uploads/contracts/ref-tourn-b.pdf', 'Season-long officiating contract.'),
    (v_lc_open,     v_referee_id, v_org1_owner, NULL,         v_now - INTERVAL '2 days',  v_now, NULL,                       NULL,                      'PENDING',    NULL,                                 'Invitation awaiting referee response.'),
    (v_lc_draft,    v_referee_id, v_org1_owner, NULL,         v_now - INTERVAL '6 days',  v_now, v_now - INTERVAL '5 days',  NULL,                      'DECLINED',   NULL,                                 'Referee declined due to a schedule conflict.'),
    (v_lc_pending,  v_referee_id, v_org1_owner, v_org1_owner, v_now - INTERVAL '11 days', v_now, v_now - INTERVAL '10 days', v_now - INTERVAL '4 days', 'TERMINATED', '/uploads/contracts/ref-summer.pdf',   'Organizer withdrew the invitation before launch approval.');

    /* ================================================================
       16. ROLE REQUESTS — đủ PENDING / APPROVED / REJECTED / CANCELLED
       ================================================================ */
    INSERT INTO role_requests(
        created_at, cv_reviewed_at, cv_reviewed_by, reviewed_at, reviewed_by, updated_at,
        user_id, cv_review_status, status, requested_role, resume_url, admin_note, cv_review_note, reason
    )
    VALUES
    (v_now, NULL,  NULL,       NULL,  NULL,       v_now, v_spectator_id,                                                       'NOT_REVIEWED', 'PENDING',   'JOCKEY',      '/uploads/cv/spectator-jockey.pdf', NULL,                                     NULL,            'I would like to compete as a jockey.'),
    (v_now, v_now, v_admin_id, v_now, v_admin_id, v_now, (SELECT id FROM users WHERE email = 'suspended@gmail.com'),     'PASSED',       'APPROVED',  'HORSE_OWNER', '/uploads/cv/owner-request.pdf',    'Approved by admin.',                     'CV verified.', 'Requesting horse owner privileges.'),
    (v_now, NULL,  NULL,       v_now, v_admin_id, v_now, (SELECT id FROM users WHERE email = 'banned@gmail.com'),        'NOT_REVIEWED', 'REJECTED',  'REFEREE',     '/uploads/cv/referee-request.pdf',  'Rejected: insufficient certification.',  NULL,            'Requesting referee licensing.'),
    (v_now, NULL,  NULL,       NULL,  NULL,       v_now, (SELECT id FROM users WHERE email = 'pending@horseracing.com'),       'NOT_REVIEWED', 'CANCELLED', 'JOCKEY',      NULL,                               NULL,                                     NULL,            'Withdrew the application.');

    /* ================================================================
       17. RESULTS SHOWCASE — Race 1 của giải A đã PUBLISHED
       (race_results + referee_report + pre_race_checks + violation + standings)

       Mọi timestamp neo vào v_first_race_at — giờ đua thật, 2 ngày trước — theo đúng
       trình tự nghiệp vụ: kiểm tra trước đua (−1h) → đua → trọng tài nộp (+15..20′) →
       admin xác nhận (+45..50′) → publish (+1h). Nếu dùng v_now thì thành "kết quả được
       publish lúc seed" cho cuộc đua đã chạy hai ngày trước, và trước khi sửa công thức
       race_at thì còn tệ hơn: kết quả chính thức của cuộc đua chưa diễn ra.
       ================================================================ */
    UPDATE races
    SET status = 'PUBLISHED', updated_at = v_first_race_at + INTERVAL '1 hour'
    WHERE id = v_first_race_id;

    UPDATE tournaments
    SET status = 'ONGOING', updated_at = v_now
    WHERE code = 'HRT-CHAMPIONSHIP-2026-A';

    /* Participant của race đã đua phải mang check_status PASSED để khớp pre_race_checks
       bên dưới; section 12 insert mặc định NOT_CHECKED cho mọi race. */
    UPDATE race_participants
    SET check_status = 'PASSED',
        check_note   = 'Pre-race inspection passed.',
        updated_at   = v_first_race_at - INTERVAL '1 hour'
    WHERE race_id = v_first_race_id;

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
        v_first_race_at + INTERVAL '45 minutes',   /* confirmed_at */
        v_admin_id,
        v_first_race_at + INTERVAL '15 minutes',   /* created_at   */
        x.id,
        v_first_race_at + INTERVAL '1 hour',       /* published_at */
        v_first_race_id,
        v_first_race_at + INTERVAL '15 minutes',   /* submitted_at */
        v_referee_id,
        v_first_race_at + INTERVAL '1 hour',       /* updated_at   */
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
        v_first_race_at + INTERVAL '50 minutes',   /* confirmed_at */
        v_admin_id,
        v_first_race_at + INTERVAL '20 minutes',   /* created_at   */
        v_first_race_id,
        v_referee_id,
        v_first_race_at + INTERVAL '20 minutes',   /* submitted_at */
        v_first_race_at + INTERVAL '50 minutes',   /* updated_at   */
        'CONFIRMED',
        'Round 1 Official Report', 'Clean race; one minor crowding incident.', NULL,
        'All eight runners completed. Result confirmed and published.'
    );

    INSERT INTO pre_race_checks(
        equipment_ok, health_ok, horse_identity_ok, jockey_identity_ok, weight_ok,
        checked_at, created_at, participant_id, race_id, referee_id, result, note
    )
    SELECT true, true, true, true, true,
        v_first_race_at - INTERVAL '1 hour',   /* checked_at: kiểm tra TRƯỚC giờ đua */
        v_first_race_at - INTERVAL '1 hour',   /* created_at */
        rp.id, v_first_race_id, v_referee_id, 'PASSED', 'Pre-race inspection passed.'
    FROM race_participants rp
    WHERE rp.race_id = v_first_race_id
    ORDER BY rp.lane_number;

    INSERT INTO violations(
        created_at, occurred_at, participant_id, race_id, reported_by, updated_at,
        severity, violation_type, penalty, description
    )
    SELECT
        v_first_race_at + INTERVAL '10 minutes',   /* created_at  */
        v_first_race_at + INTERVAL '5 minutes',    /* occurred_at */
        rp.id, v_first_race_id, v_referee_id,
        v_first_race_at + INTERVAL '10 minutes',   /* updated_at  */
        'MINOR', 'CROWDING', 'Official warning', 'Minor crowding on the final bend; warning issued.'
    FROM race_participants rp
    WHERE rp.race_id = v_first_race_id
    ORDER BY rp.lane_number
    LIMIT 1;

    /* Không seed prediction_settlement_jobs: race này không có dự đoán nào để chấm, một
       settlement job processed_count=2 sẽ là job đã chấm hai bản ghi không tồn tại. */

    UPDATE tournament_participants tp
    SET points = rr.points, updated_at = v_first_race_at + INTERVAL '1 hour'
    FROM race_participants rp
    JOIN race_results rr ON rr.participant_id = rp.id
    WHERE rp.horse_id = tp.horse_id
      AND rp.jockey_id = tp.jockey_id
      AND rp.race_id = v_first_race_id
      AND tp.tournament_id = v_tourn_a;
END $$;

/* ================================================================
   14. KIỂM TRA KẾT QUẢ

   Query cuối cùng (INVARIANTS) là cái quan trọng nhất: mọi dòng phải ra PASS.
   Một dòng FAIL nghĩa là seed sinh ra dữ liệu tự mâu thuẫn — đừng đem lên deploy.
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

/* ================================================================
   INVARIANTS — mọi dòng phải PASS
   ================================================================ */
WITH checks(seq, check_name, actual) AS (
    /* Không một đồng nào được sinh bởi script. */
    SELECT 1, 'money tables empty (phai = 0)',
           (SELECT COUNT(*) FROM wallets)
         + (SELECT COUNT(*) FROM wallet_transactions)
         + (SELECT COUNT(*) FROM topup_orders)
         + (SELECT COUNT(*) FROM race_predictions)
         + (SELECT COUNT(*) FROM prediction_settlement_jobs)
         + (SELECT COUNT(*) FROM withdrawal_requests)

    /* Giải đã có lịch đua thì không được rỗng người. */
    UNION ALL
    SELECT 2, 'giai co lich dua ma 0 participant',
           (SELECT COUNT(*) FROM tournaments t
             WHERE t.status IN ('SCHEDULE_PUBLISHED', 'ONGOING', 'COMPLETED')
               AND NOT EXISTS (SELECT 1 FROM tournament_participants tp
                                WHERE tp.tournament_id = t.id))

    UNION ALL
    SELECT 3, 'race khong du 8 participant',
           (SELECT COUNT(*) FROM races r
             WHERE (SELECT COUNT(*) FROM race_participants rp WHERE rp.race_id = r.id) <> 8)

    /* Lane phải đúng tập 1..8, không trùng không thiếu. */
    UNION ALL
    SELECT 4, 'race co lane khong phai 1..8',
           (SELECT COUNT(*) FROM (
                SELECT rp.race_id
                FROM race_participants rp
                GROUP BY rp.race_id
                HAVING array_agg(rp.lane_number ORDER BY rp.lane_number)
                       <> ARRAY[1,2,3,4,5,6,7,8]
            ) bad_lanes)

    /* Thứ tự vật lý trong heap khớp lane: query nào thiếu ORDER BY cũng vẫn ra đúng. */
    UNION ALL
    SELECT 5, 'heap order khong khop lane order',
           (SELECT COUNT(*) FROM (
                SELECT rp.race_id
                FROM race_participants rp
                GROUP BY rp.race_id
                HAVING array_agg(rp.lane_number ORDER BY rp.id)
                       <> array_agg(rp.lane_number ORDER BY rp.lane_number)
            ) bad_heap)

    /* Không publish kết quả cho cuộc đua chưa diễn ra. */
    UNION ALL
    SELECT 6, 'race PUBLISHED ma race_at o tuong lai',
           (SELECT COUNT(*) FROM races
             WHERE status = 'PUBLISHED' AND race_at > localtimestamp)

    UNION ALL
    SELECT 7, 'race_result publish truoc gio dua',
           (SELECT COUNT(*) FROM race_results rr
              JOIN races r ON r.id = rr.race_id
             WHERE rr.published_at < r.race_at)

    UNION ALL
    SELECT 8, 'pre_race_check thuc hien sau gio dua',
           (SELECT COUNT(*) FROM pre_race_checks prc
              JOIN races r ON r.id = prc.race_id
             WHERE prc.checked_at > r.race_at)

    /* Đăng ký phải đóng trước ngày khai mạc. */
    UNION ALL
    SELECT 9, 'dang ky dong sau ngay khai mac',
           (SELECT COUNT(*) FROM tournaments
             WHERE registration_end_at IS NOT NULL
               AND start_date IS NOT NULL
               AND registration_end_at::date > start_date)

    /* Participant của race đã đua phải đã được kiểm tra. */
    UNION ALL
    SELECT 10, 'participant race da dua ma chua check',
           (SELECT COUNT(*) FROM race_participants rp
              JOIN races r ON r.id = rp.race_id
             WHERE r.status = 'PUBLISHED' AND rp.check_status <> 'PASSED')

    /* Giải nào cũng phải có tiền thưởng: cột NOT NULL DEFAULT 0 nên quên set là ra
       "0 VND prize" trên trang công khai mà không báo lỗi gì. */
    UNION ALL
    SELECT 11, 'giai co prize pool = 0',
           (SELECT COUNT(*) FROM tournaments WHERE total_prize_pool <= 0)
)
SELECT seq, check_name, actual,
       CASE WHEN actual = 0 THEN 'PASS' ELSE 'FAIL' END AS verdict
FROM checks
ORDER BY seq;
