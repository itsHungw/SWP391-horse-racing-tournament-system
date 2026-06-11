-- Baseline schema generated from the JPA entities (SQL Server dialect) and
-- hand-checked. Single source of truth for the database schema; see
-- docs/superpowers/specs/2026-06-11-db-schema-consolidation-design.md
-- Sections below: tables, unique constraints, foreign keys, reference seed.
-- Enum columns carry inline CHECK constraints generated from @Enumerated(STRING).

create table auth_sessions (created_at datetime2(7) not null, expires_at datetime2(7) not null, id bigint identity not null, last_used_at datetime2(7), replaced_by_session_id bigint, revoked_at datetime2(7), user_id bigint not null, ip_address varchar(100), user_agent varchar(500), refresh_token_hash varchar(255) not null, primary key (id));
create table blogs (author_id bigint not null, created_at datetime2(7) not null, id bigint identity not null, updated_at datetime2(7), status varchar(50) not null check ((status in ('DRAFT','PUBLISHED'))), summary varchar(500), content NVARCHAR(MAX) not null, slug varchar(255) not null, thumbnail varchar(255), title varchar(255) not null, primary key (id));
create table email_verification_tokens (created_at datetime2(7) not null, expires_at datetime2(7) not null, id bigint identity not null, used_at datetime2(7), user_id bigint not null, token_hash varchar(255) not null, primary key (id));
create table horse_documents (expiry_date date not null, issue_date date not null, created_at datetime2(7) not null, horse_id bigint not null, id bigint identity not null, uploaded_by bigint not null, document_type varchar(50) not null, reference_number varchar(100) not null, issuer varchar(150) not null, file_url varchar(500) not null, notes varchar(255), primary key (id));
create table horse_owner_profiles (experience_years int not null, approved_at datetime2(7), approved_by bigint, created_at datetime2(7) not null, id bigint identity not null, updated_at datetime2(7), user_id bigint not null, contact_phone varchar(30), status varchar(30) not null, license_number varchar(100), contact_email varchar(150), organization_name varchar(150), owner_name varchar(150), stable_name varchar(150), evidence_url varchar(500), logo_url varchar(500), bio varchar(255), contact_address varchar(255), description varchar(255), rejection_reason varchar(255), primary key (id));
create table horses (date_of_birth date, height_cm int, weight_kg int, approved_at datetime2(7), approved_by bigint, created_at datetime2(7) not null, deleted_at datetime2(7), id bigint identity not null, owner_id bigint not null, updated_at datetime2(7), gender varchar(20) not null, status varchar(30) not null, color varchar(50), health_status varchar(50), breed varchar(100), registration_code varchar(100), name varchar(150) not null, evidence_url varchar(500), image_url varchar(500), description varchar(255), medical_note varchar(255), rejection_reason varchar(255), primary key (id));
create table jockey_invitations (accepted_at datetime2(7), created_at datetime2(7) not null, horse_id bigint not null, id bigint identity not null, jockey_application_id bigint not null, jockey_id bigint not null, owner_id bigint not null, read_at datetime2(7), rejected_at datetime2(7), tournament_id bigint not null, tournament_registration_id bigint not null, updated_at datetime2(7), status varchar(30) not null, agreement_url varchar(500), message varchar(500), rejection_reason varchar(500), agreement_file_name varchar(255), primary key (id));
create table jockey_tournament_applications (created_at datetime2(7) not null, id bigint identity not null, jockey_id bigint not null, reviewed_at datetime2(7), reviewed_by bigint, tournament_id bigint not null, updated_at datetime2(7), withdrawn_at datetime2(7), status varchar(30) not null, message varchar(500), rejection_reason varchar(500), primary key (id));
create table password_reset_tokens (created_at datetime2(7) not null, expires_at datetime2(7) not null, id bigint identity not null, used_at datetime2(7), user_id bigint not null, token_hash varchar(255) not null, primary key (id));
create table point_settings (setting_value int not null, updated_at datetime2(7), updated_by bigint, setting_key varchar(80) not null check ((setting_key in ('FIRST_LOGIN_BONUS','BLOG_REWARD_POINTS','DAILY_BLOG_REWARD_LIMIT','PREDICTION_WINNER_ENTRY_COST','PREDICTION_TOP3_ENTRY_COST','PREDICTION_WINNER_REWARD','PREDICTION_TOP3_EXACT_REWARD','PREDICTION_TOP3_ANY_ORDER_REWARD'))), description varchar(255), primary key (setting_key));
create table point_transactions (amount int not null, created_at datetime2(7) not null, id bigint identity not null, reference_id bigint, user_id bigint not null, reference_type varchar(50), transaction_type varchar(50) not null check ((transaction_type in ('FIRST_LOGIN_BONUS','PREDICTION_ENTRY','PREDICTION_REWARD','BLOG_REWARD','RACE_CANCEL_REFUND','ADMIN_ADJUSTMENT'))), description varchar(500), primary key (id));
create table pre_race_checks (equipment_ok bit not null, health_ok bit not null, horse_identity_ok bit not null, jockey_identity_ok bit not null, weight_ok bit not null, checked_at datetime2(7) not null, created_at datetime2(7) not null, id bigint identity not null, participant_id bigint not null, race_id bigint not null, referee_id bigint not null, result varchar(30) not null, note varchar(255), primary key (id));
create table prediction_settlement_jobs (failed_count int not null, processed_count int not null, retry_count int not null, rewarded_count int not null, completed_at datetime2(7), created_at datetime2(7) not null, id bigint identity not null, race_id bigint not null, started_at datetime2(7), updated_at datetime2(7), status varchar(30) not null, error_message varchar(255), primary key (id));
create table race_participants (lane_number int, start_number int, weight_carried_kg numeric(5,2), created_at datetime2(7) not null, horse_id bigint not null, id bigint identity not null, invitation_id bigint, jockey_id bigint, owner_id bigint not null, race_id bigint not null, updated_at datetime2(7), check_status varchar(30) not null, confirmation_status varchar(30) not null, status varchar(30) not null, check_note varchar(255), primary key (id));
create table race_predictions (entry_cost_points int not null, reward_points int not null, created_at datetime2(7) not null, evaluated_at datetime2(7), id bigint identity not null, locked_at datetime2(7), predicted_second_id bigint, predicted_third_id bigint, predicted_winner_id bigint not null, race_id bigint not null, spectator_id bigint not null, updated_at datetime2(7), prediction_type varchar(30) not null, status varchar(30) not null, primary key (id));
create table race_results (finish_time_seconds numeric(10,3), penalty_seconds numeric(10,3) not null, points int not null, position int, prize_points int not null, raw_finish_time_seconds numeric(10,3), confirmed_at datetime2(7), confirmed_by bigint, created_at datetime2(7) not null, id bigint identity not null, participant_id bigint not null, published_at datetime2(7), race_id bigint not null, submitted_at datetime2(7) not null, submitted_by bigint not null, updated_at datetime2(7), result_status varchar(30) not null, status varchar(30) not null, note varchar(255), primary key (id));
create table races (distance_meter int not null, max_participants int not null, min_participants int not null, race_number int, created_at datetime2(7) not null, created_by bigint not null, deleted_at datetime2(7), id bigint identity not null, race_at datetime2(7) not null, referee_id bigint, tournament_id bigint not null, updated_at datetime2(7), status varchar(40) not null, track_condition varchar(50), code varchar(100) not null, round_name varchar(100), track_name varchar(150), name varchar(200) not null, note varchar(255), primary key (id));
create table referee_profiles (experience_years int not null, approved_at datetime2(7), approved_by bigint, created_at datetime2(7) not null, id bigint identity not null, updated_at datetime2(7), user_id bigint not null, status varchar(30) not null check ((status in ('PENDING','ACTIVE','REJECTED','SUSPENDED','INACTIVE'))), license_number varchar(100), evidence_url varchar(500), certification varchar(255), rejection_reason varchar(255), bio varchar(max), primary key (id));
create table referee_reports (confirmed_at datetime2(7), confirmed_by bigint, created_at datetime2(7) not null, id bigint identity not null, race_id bigint not null, referee_id bigint not null, submitted_at datetime2(7), updated_at datetime2(7), status varchar(30) not null, title varchar(200), ai_summary varchar(255), rejection_reason varchar(255), summary varchar(255) not null, primary key (id));
create table role_requests (created_at datetime2(7) not null, cv_reviewed_at datetime2(7), cv_reviewed_by bigint, id bigint identity not null, reviewed_at datetime2(7), reviewed_by bigint, updated_at datetime2(7), user_id bigint not null, cv_review_status varchar(30) not null, status varchar(30) not null, requested_role varchar(50) not null, resume_url varchar(500), admin_note varchar(max), cv_review_note varchar(max), reason varchar(max), primary key (id));
create table roles (id bigint identity not null, name varchar(50) not null, description varchar(255), primary key (id));
create table stored_files (private_file bit not null, created_at datetime2(7) not null, file_size bigint not null, id bigint identity not null, uploaded_by bigint not null, category varchar(50) not null, content_type varchar(100) not null, filename varchar(120) not null, object_key varchar(500) not null, original_filename varchar(255) not null, primary key (id));
create table tournament_participants (points int not null, created_at datetime2(7) not null, horse_id bigint not null, id bigint identity not null, jockey_id bigint not null, jockey_invitation_id bigint, owner_id bigint not null, tournament_id bigint not null, tournament_registration_id bigint not null, updated_at datetime2(7), status varchar(30) not null, primary key (id));
create table tournament_registrations (created_at datetime2(7) not null, horse_id bigint not null, id bigint identity not null, owner_id bigint not null, reviewed_at datetime2(7), reviewed_by bigint, tournament_id bigint not null, updated_at datetime2(7), withdrawn_at datetime2(7), status varchar(30) not null, note varchar(255), rejection_reason varchar(255), primary key (id));
create table tournaments (end_date date not null, max_horses int, max_horses_per_owner int not null, start_date date not null, created_at datetime2(7) not null, created_by bigint not null, deleted_at datetime2(7), id bigint identity not null, registration_end_at datetime2(7) not null, registration_start_at datetime2(7) not null, updated_at datetime2(7), status varchar(40) not null, code varchar(100) not null, name varchar(200) not null, description varchar(255), location varchar(255) not null, primary key (id));
create table user_blog_rewards (points_earned int not null, reading_seconds int not null, scroll_percent int not null, blog_id bigint not null, earned_at datetime2(7) not null, id bigint identity not null, user_id bigint not null, reward_status varchar(30) not null, primary key (id));
create table user_daily_point_limits (point_date date not null, points_earned_from_blog int not null, points_earned_total int not null, created_at datetime2(7) not null, id bigint identity not null, updated_at datetime2(7), user_id bigint not null, primary key (id));
create table user_point_accounts (point_balance int not null, updated_at datetime2(7) not null, user_id bigint not null, primary key (user_id));
create table user_role_history (changed_at datetime2(7) not null, changed_by bigint, id bigint identity not null, user_role_id bigint not null, new_status varchar(30) not null, old_status varchar(30), reason varchar(max), primary key (id));
create table user_roles (assigned_at datetime2(7) not null, assigned_by bigint, id bigint identity not null, removed_at datetime2(7), removed_by bigint, role_id bigint not null, user_id bigint not null, status varchar(30) not null, primary key (id));
create table users (age_verified bit not null, date_of_birth date, email_verified bit not null, phone_verified bit not null, profile_completed bit not null, created_at datetime2(7) not null, deleted_at datetime2(7), id bigint identity not null, last_login_at datetime2(7), password_changed_at datetime2(7), updated_at datetime2(7), gender varchar(20), phone varchar(30), status varchar(30) not null, email varchar(150) not null, full_name varchar(150) not null, avatar_url varchar(500), address varchar(255), password_hash varchar(255) not null, primary key (id));
create table violations (created_at datetime2(7) not null, id bigint identity not null, occurred_at datetime2(7), participant_id bigint, race_id bigint not null, reported_by bigint not null, updated_at datetime2(7), severity varchar(30), violation_type varchar(100), penalty varchar(150), description varchar(255) not null, primary key (id));
alter table blogs add constraint UKpl5w1yw2c5lligoeb9a393fr3 unique (slug);
alter table horse_owner_profiles add constraint UK1emoiq4cbklniqw6sjv3ev2c1 unique (user_id);
create unique nonclustered index UKi19gkudpajmph5a91a3f0f304 on horses (registration_code) where registration_code is not null;
alter table jockey_tournament_applications add constraint uq_jockey_tournament_applications_tournament_jockey unique (tournament_id, jockey_id);
alter table pre_race_checks add constraint uq_race_participant_check unique (race_id, participant_id);
alter table prediction_settlement_jobs add constraint UKslelllufcno9q3y074tur4ufr unique (race_id);
alter table race_participants add constraint uq_race_horse unique (race_id, horse_id);
alter table race_results add constraint uq_race_participant_result unique (race_id, participant_id);
alter table races add constraint UKbuqnfvhhv2j8p6m0inp9v87g2 unique (code);
alter table referee_profiles add constraint UKk0ugn0vrsppv3gv7owtbkahe1 unique (user_id);
alter table referee_reports add constraint uq_race_referee_report unique (race_id, referee_id);
alter table stored_files add constraint UKhw2f2a7tmiu70f3nejr0ir49m unique (filename);
alter table stored_files add constraint UK3gx9k7j1dautbftqy1p114tvk unique (object_key);
alter table tournament_participants add constraint UQ_tournament_participants_tournament_horse unique (tournament_id, horse_id);
alter table tournament_participants add constraint UQ_tournament_participants_tournament_jockey unique (tournament_id, jockey_id);
alter table tournaments add constraint UK92hyrkjh33u8lwx6dkevegby5 unique (code);
alter table user_blog_rewards add constraint uq_user_blog_reward unique (user_id, blog_id);
alter table user_daily_point_limits add constraint uq_user_daily_point unique (user_id, point_date);
alter table auth_sessions add constraint FK82v71nf7dko7lyu2tbeyxxsmo foreign key (replaced_by_session_id) references auth_sessions;
alter table auth_sessions add constraint FKpu507182mdfutajr71rgk67l foreign key (user_id) references users;
alter table blogs add constraint FKt8g0udj2fq40771g38t2t011n foreign key (author_id) references users;
alter table email_verification_tokens add constraint FKi1c4mmamlb8keqt74k4lrtwhc foreign key (user_id) references users;
alter table horse_documents add constraint FKf2057cgjra0gyvpdgx6tg52xa foreign key (horse_id) references horses;
alter table horse_documents add constraint FK6kf1td2necnil4tao7wmav965 foreign key (uploaded_by) references users;
alter table horse_owner_profiles add constraint FK61vot6gointkrtu4ywfemhy3m foreign key (approved_by) references users;
alter table horse_owner_profiles add constraint FK7sgvtrl5nt2o5s9uchmxc7wsp foreign key (user_id) references users;
alter table horses add constraint FKta37srp8t89s84n4uojk1p9pq foreign key (approved_by) references users;
alter table horses add constraint FK8pokgvy68xwkkoc127ewdgky0 foreign key (owner_id) references users;
alter table jockey_invitations add constraint FK49j2b6rog52kp4is0g4pin8l0 foreign key (horse_id) references horses;
alter table jockey_invitations add constraint FK9o2om6ea2kurcy0b8rfe0b5f0 foreign key (jockey_id) references users;
alter table jockey_invitations add constraint FKbr2tnst2spmu7yw6i1nj2rkp4 foreign key (jockey_application_id) references jockey_tournament_applications;
alter table jockey_invitations add constraint FKgleu278cfif7grogvw05foojc foreign key (owner_id) references users;
alter table jockey_invitations add constraint FKgtwvq8jgvkw0rws5s5xfpprj3 foreign key (tournament_id) references tournaments;
alter table jockey_invitations add constraint FKbo1i739lgm9nv51p08848s1vv foreign key (tournament_registration_id) references tournament_registrations;
alter table jockey_tournament_applications add constraint FK7oeblylgblvlgllv1ywnlav8 foreign key (jockey_id) references users;
alter table jockey_tournament_applications add constraint FK6mo6wfpngocpiv6pc6ssagk87 foreign key (reviewed_by) references users;
alter table jockey_tournament_applications add constraint FKpb18pcusjaievl92mk49q0ydv foreign key (tournament_id) references tournaments;
alter table password_reset_tokens add constraint FKk3ndxg5xp6v7wd4gjyusp15gq foreign key (user_id) references users;
alter table point_settings add constraint FKkyr6ubfam8gmmv5plyvca6rar foreign key (updated_by) references users;
alter table point_transactions add constraint FKcqbvxpskb8p7mko50hokltu5b foreign key (user_id) references users;
alter table pre_race_checks add constraint FKitv84jc6sykf1r4q7ho18qayo foreign key (participant_id) references race_participants;
alter table pre_race_checks add constraint FK32gofjs0w707eqyqnk0of9l1n foreign key (race_id) references races;
alter table pre_race_checks add constraint FK7wdjw45kqe1baw6ekv1h1y8ue foreign key (referee_id) references users;
alter table prediction_settlement_jobs add constraint FK9m7rele9r384qxreuwgw3doa6 foreign key (race_id) references races;
alter table race_participants add constraint FKtnbaxtpa439utgurahg1br2q7 foreign key (horse_id) references horses;
alter table race_participants add constraint FKdw3mny6cshj2vsjqlxa6rlkgk foreign key (invitation_id) references jockey_invitations;
alter table race_participants add constraint FK2d9uj0hr8n7651at9uxfdguie foreign key (jockey_id) references users;
alter table race_participants add constraint FKhx59w9knt6bgsgrsfmwtx44k5 foreign key (owner_id) references users;
alter table race_participants add constraint FK8rntitvjnh5vfacaj7afrhcul foreign key (race_id) references races;
alter table race_predictions add constraint FKgig50l4txom6bm2qge4pat21e foreign key (race_id) references races;
alter table race_predictions add constraint FK5wun0cehajuw3xkupq5sag27d foreign key (spectator_id) references users;
alter table race_results add constraint FKjqhvyhi9n8hyvsf4m6iq0jpwm foreign key (confirmed_by) references users;
alter table race_results add constraint FKpqlpayq96cdq9qd2xwxga0jpy foreign key (participant_id) references race_participants;
alter table race_results add constraint FK2elke3gjhe8xwitsftgj573cn foreign key (race_id) references races;
alter table race_results add constraint FKc3x13pvtj2qfl3m3qfyf4oyqo foreign key (submitted_by) references users;
alter table races add constraint FKssf8f710hqeq00bmw7pvus1ho foreign key (created_by) references users;
alter table races add constraint FKl05p82otjrq8wt1kqow6marsx foreign key (referee_id) references users;
alter table races add constraint FKflewhy168yyw8rornks4y7qte foreign key (tournament_id) references tournaments;
alter table referee_profiles add constraint FKq5otbdxjol0d599grfhqoenlm foreign key (approved_by) references users;
alter table referee_profiles add constraint FKqe4gjvpxqpo601tmwk51cb7is foreign key (user_id) references users;
alter table referee_reports add constraint FKovher1wufx1ebh0w0uneq81d0 foreign key (confirmed_by) references users;
alter table referee_reports add constraint FKs7t5a22b3x1ql4qqk2hv24f1n foreign key (race_id) references races;
alter table referee_reports add constraint FKl8uqseyqfn0v9qs6wyn0e1hkq foreign key (referee_id) references users;
alter table role_requests add constraint FKl8rk3prangk4x2q023unlimkw foreign key (cv_reviewed_by) references users;
alter table role_requests add constraint FKpnf3r3c2gwelwie9gf830qhgc foreign key (reviewed_by) references users;
alter table role_requests add constraint FKljihuio5sbmdk3jjmtm3lh72j foreign key (user_id) references users;
alter table stored_files add constraint FKas2oppi7iv3x5ffoknjdie134 foreign key (uploaded_by) references users;
alter table tournament_participants add constraint FKrxkfcan1isj006y2dadu0mpo9 foreign key (horse_id) references horses;
alter table tournament_participants add constraint FKak4vv20bioto7jjdxhmw3gi3j foreign key (jockey_id) references users;
alter table tournament_participants add constraint FKo2i0b6wr0qybpctgamf4qeeix foreign key (owner_id) references users;
alter table tournament_participants add constraint FK7m4qdyvu9tgkd7phoskg97nn5 foreign key (tournament_id) references tournaments;
alter table tournament_participants add constraint FKiurfijs2svt7396su4q54be79 foreign key (tournament_registration_id) references tournament_registrations;
alter table tournament_registrations add constraint FKef24hn7n7bmm8i2pg78nrgwqw foreign key (horse_id) references horses;
alter table tournament_registrations add constraint FKcx5xhpl90wu4r5o8dqbt3wady foreign key (owner_id) references users;
alter table tournament_registrations add constraint FKc8jibtrru0qoyg6940e10sqd1 foreign key (reviewed_by) references users;
alter table tournament_registrations add constraint FK2mpg0cs7jn7a10v34nhmg03lg foreign key (tournament_id) references tournaments;
alter table tournaments add constraint FKg9th3w94s0c70bexogt0g3syw foreign key (created_by) references users;
alter table user_blog_rewards add constraint FK5ex4b1r6hwvl6hkmvir437wx2 foreign key (blog_id) references blogs;
alter table user_blog_rewards add constraint FK3v6thv6qanfxdjybl89h0j88r foreign key (user_id) references users;
alter table user_daily_point_limits add constraint FK44swi47xlyc6vl9gcq6yf56tp foreign key (user_id) references users;
alter table user_point_accounts add constraint FKkibs70n984ktp5l6jp1bsgc3h foreign key (user_id) references users;
alter table user_role_history add constraint FKdgly6e45mi7svq1k2ub14jq0x foreign key (changed_by) references users;
alter table user_role_history add constraint FKfyiyxgyvp9ng2uetr971bk1e0 foreign key (user_role_id) references user_roles;
alter table user_roles add constraint FKljgw07fam7v71ok817u4rvyro foreign key (assigned_by) references users;
alter table user_roles add constraint FKpq4h4n1oxruppqofi10fs5nvq foreign key (removed_by) references users;
alter table user_roles add constraint FKh8ciramu9cc9q3qcqiv4ue8a6 foreign key (role_id) references roles;
alter table user_roles add constraint FKhfh9dx7w3ubf1co1vdev94g3f foreign key (user_id) references users;
alter table violations add constraint FK6htq34o7t9cbdqddjb29vpsc8 foreign key (participant_id) references race_participants;
alter table violations add constraint FK898funs30wpw49rvtc0qiuf15 foreign key (race_id) references races;
alter table violations add constraint FK9bgdtotuq0kwr29gxi7f6k2g9 foreign key (reported_by) references users;

-- ---------------------------------------------------------------------------
-- Reference seed (safe for all environments)
-- ---------------------------------------------------------------------------
insert into roles (name, description)
select v.name, v.description from (values
    ('ADMIN','Administrator'),
    ('HORSE_OWNER','Horse owner'),
    ('JOCKEY','Jockey'),
    ('REFEREE','Referee'),
    ('SPECTATOR','Spectator')
) as v(name, description)
where not exists (select 1 from roles r where r.name = v.name);

insert into point_settings (setting_key, setting_value, description)
select v.k, 0, v.d from (values
    ('FIRST_LOGIN_BONUS','Points granted on first successful login when enabled.'),
    ('BLOG_REWARD_POINTS','Points awarded when an eligible blog reward is claimed.'),
    ('DAILY_BLOG_REWARD_LIMIT','Maximum blog reward points a user can earn per day.'),
    ('PREDICTION_WINNER_ENTRY_COST','Points spent to submit one Winner pick prediction.'),
    ('PREDICTION_TOP3_ENTRY_COST','Points spent to submit one Top 3 prediction.'),
    ('PREDICTION_WINNER_REWARD','Points awarded for a correct Winner pick prediction.'),
    ('PREDICTION_TOP3_EXACT_REWARD','Points awarded for matching the exact Top 3 order.'),
    ('PREDICTION_TOP3_ANY_ORDER_REWARD','Points awarded for predicting the Top 3 in any order.')
) as v(k, d)
where not exists (select 1 from point_settings p where p.setting_key = v.k);
