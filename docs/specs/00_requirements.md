# Horse Racing Tournament Management System - Requirements Document

**Project Code:** SU26SWP03  
**Version:** 1.0  
**Last Updated:** 2026-05-14

---

## 1. Functional Requirements

### 1.1. Authentication & Account (FR-AUTH)

| ID | Requirement | Priority |
|----|------------|----------|
| FR-AUTH-001 | User đăng ký tài khoản với full_name, email, password, phone (optional) | Must |
| FR-AUTH-002 | Hệ thống validate email unique, password strength, hash password trước khi lưu | Must |
| FR-AUTH-003 | User mới tự động nhận role SPECTATOR, không được chọn role khi đăng ký | Must |
| FR-AUTH-004 | User đăng nhập bằng email + password, hệ thống trả JWT token | Must |
| FR-AUTH-005 | Hệ thống check user status khi login: LOCKED/DISABLED không cho login | Must |
| FR-AUTH-006 | Load active roles của user khi login, đính kèm trong JWT | Must |
| FR-AUTH-007 | User có thể logout (invalidate token phía client) | Must |
| FR-AUTH-008 | User có thể đổi password (cần old_password + new_password + confirm) | Must |
| FR-AUTH-009 | Forgot password flow (gửi email reset) | Nice |
| FR-AUTH-010 | Email verification flow | Nice |

### 1.2. Role Request (FR-ROLE)

| ID | Requirement | Priority |
|----|------------|----------|
| FR-ROLE-001 | User ACTIVE có thể gửi request đăng ký thêm role: HORSE_OWNER, JOCKEY, REFEREE | Must |
| FR-ROLE-002 | Không cho tạo PENDING request trùng user + role | Must |
| FR-ROLE-003 | Không cho request role đã có ACTIVE | Must |
| FR-ROLE-004 | Submit Horse Owner application: stable_name, organization_name, license_number, experience_years, bio, evidence_url, reason | Must |
| FR-ROLE-005 | Submit Jockey application: license_number, height_cm, weight_kg, experience_years, riding_style, bio, evidence_url, reason | Must |
| FR-ROLE-006 | Submit Referee application: license_number, certification, experience_years, bio, evidence_url, reason | Must |
| FR-ROLE-007 | Tạo role_request + profile tương ứng với status PENDING khi submit | Must |
| FR-ROLE-008 | Notify Admin khi có role request mới | Must |
| FR-ROLE-009 | Admin approve role request → update request + profile + tạo user_role ACTIVE + notify user | Must |
| FR-ROLE-010 | Admin reject role request → update request + profile REJECTED + ghi rejection_reason + notify user | Must |
| FR-ROLE-011 | Admin chỉ review được request đang PENDING | Must |

### 1.3. User Management (FR-USER)

| ID | Requirement | Priority |
|----|------------|----------|
| FR-USER-001 | User xem profile cá nhân | Must |
| FR-USER-002 | User cập nhật profile: full_name, phone, avatar_url, date_of_birth, gender, address | Must |
| FR-USER-003 | Admin list users với search (name/email/phone) + filter (status/role) + pagination | Must |
| FR-USER-004 | Admin xem chi tiết user (thông tin + roles + role requests) | Must |
| FR-USER-005 | Admin lock user (status → LOCKED) | Must |
| FR-USER-006 | Admin unlock user (status → ACTIVE) | Must |
| FR-USER-007 | Admin disable user (status → DISABLED) | Must |
| FR-USER-008 | Admin suspend một role cụ thể của user (user_role.status → SUSPENDED) | Must |

### 1.4. Horse Management (FR-HORSE)

| ID | Requirement | Priority |
|----|------------|----------|
| FR-HORSE-001 | Horse Owner tạo hồ sơ ngựa: name, registration_code, breed, gender, date_of_birth, color, height_cm, weight_kg, health_status, medical_note, image_url, description | Must |
| FR-HORSE-002 | Chỉ user có role HORSE_OWNER ACTIVE mới tạo được horse | Must |
| FR-HORSE-003 | Horse mới tạo có status = PENDING | Must |
| FR-HORSE-004 | Notify Admin khi có horse mới chờ duyệt | Must |
| FR-HORSE-005 | Owner cập nhật horse của mình (chỉ horse mình sở hữu) | Must |
| FR-HORSE-006 | Nếu horse đã APPROVED mà thay đổi thông tin core (name, registration_code, breed, gender, date_of_birth) → status quay về PENDING, cần Admin duyệt lại | Should |
| FR-HORSE-007 | Admin approve horse → status = APPROVED, ghi approved_by + approved_at | Must |
| FR-HORSE-008 | Admin reject horse → status = REJECTED, bắt buộc ghi rejection_reason | Must |
| FR-HORSE-009 | Soft delete horse (set deleted_at), không hard delete | Must |
| FR-HORSE-010 | Không cho delete nếu horse đang tham gia active race/tournament | Must |
| FR-HORSE-011 | Owner xem danh sách horse của mình | Must |
| FR-HORSE-012 | Public users xem horse đã APPROVED | Must |

### 1.5. Tournament Management (FR-TOUR)

| ID | Requirement | Priority |
|----|------------|----------|
| FR-TOUR-001 | Admin tạo tournament: name, code (unique), description, location, start_date, end_date, registration_start_at, registration_end_at, max_horses, banner_url, rules | Must |
| FR-TOUR-002 | Tournament mới tạo có status = DRAFT | Must |
| FR-TOUR-003 | Validate: start_date ≤ end_date, registration_start_at < registration_end_at | Must |
| FR-TOUR-004 | Admin cập nhật tournament khi status = DRAFT hoặc OPEN_REGISTRATION | Must |
| FR-TOUR-005 | Admin chuyển status: DRAFT → OPEN_REGISTRATION (phải có registration period hợp lệ) | Must |
| FR-TOUR-006 | Admin chuyển status: OPEN_REGISTRATION → CLOSED_REGISTRATION | Must |
| FR-TOUR-007 | Admin chuyển status: CLOSED_REGISTRATION → ONGOING (phải có ít nhất 1 race) | Must |
| FR-TOUR-008 | Admin chuyển status: ONGOING → COMPLETED (tất cả races phải PUBLISHED hoặc CANCELLED) | Must |
| FR-TOUR-009 | Admin cancel tournament (DRAFT/OPEN/CLOSED → CANCELLED, ONGOING cần confirmation + reason) | Must |
| FR-TOUR-010 | Public users xem danh sách và chi tiết tournament | Must |

### 1.6. Tournament Registration (FR-REG)

| ID | Requirement | Priority |
|----|------------|----------|
| FR-REG-001 | Owner đăng ký horse vào tournament: tournament_id, horse_id, note | Must |
| FR-REG-002 | Validate: Owner có HORSE_OWNER ACTIVE, horse thuộc owner, horse APPROVED | Must |
| FR-REG-003 | Validate: tournament OPEN_REGISTRATION, thời gian trong registration window | Must |
| FR-REG-004 | Validate: horse chưa đăng ký tournament này, chưa vượt max_horses | Must |
| FR-REG-005 | Registration mới có status = PENDING | Must |
| FR-REG-006 | Admin approve registration → status = APPROVED, ghi approved_by + approved_at | Must |
| FR-REG-007 | Admin reject registration → status = REJECTED, bắt buộc ghi rejection_reason | Must |
| FR-REG-008 | Owner withdraw registration nếu status = PENDING/APPROVED, tournament chưa start, horse chưa vào active race | Must |

### 1.7. Race Management (FR-RACE)

| ID | Requirement | Priority |
|----|------------|----------|
| FR-RACE-001 | Admin tạo race trong tournament: tournament_id, name, code (unique), round_name, race_number, race_at, distance_meter, track_name, track_condition, max_participants, min_participants, note | Must |
| FR-RACE-002 | Validate: tournament tồn tại + chưa CANCELLED/COMPLETED, race_at nằm trong start_date~end_date, max ≥ min ≥ 2 | Must |
| FR-RACE-003 | Race mới tạo có status = SCHEDULED | Must |
| FR-RACE-004 | Admin phân công referee cho race (referee phải có REFEREE ACTIVE, profile ACTIVE, không conflict thời gian) | Must |
| FR-RACE-005 | Admin thêm participant thủ công: race_id, horse_id, jockey_id, start_number, lane_number, weight_carried_kg | Should |
| FR-RACE-006 | Validate participant: horse có APPROVED registration trong tournament, unique horse/jockey/start_number per race, count < max | Must |
| FR-RACE-007 | Owner xác nhận horse tham gia race (confirmation_status → CONFIRMED) | Must |
| FR-RACE-008 | Race status transitions phải tuân thủ đúng lifecycle: SCHEDULED → CHECKING → READY → ONGOING → FINISHED → RESULT_SUBMITTED → RESULT_CONFIRMED → PUBLISHED | Must |
| FR-RACE-009 | Không cho transition bất hợp lệ (VD: SCHEDULED → PUBLISHED) | Must |

### 1.8. Jockey Invitation (FR-INV)

| ID | Requirement | Priority |
|----|------------|----------|
| FR-INV-001 | Owner mời jockey cho horse trong race: race_id, horse_id, jockey_id, message, expired_at | Must |
| FR-INV-002 | Validate: owner sở hữu horse, horse APPROVED, horse có registration APPROVED, race SCHEDULED/CHECKING, jockey có role ACTIVE + profile APPROVED, jockey chưa ride horse khác trong race, không có PENDING invitation trùng race+horse | Must |
| FR-INV-003 | Jockey accept invitation → invitation ACCEPTED, tạo/update race_participant, cancel các PENDING invitation khác cho cùng race+horse, notify owner | Must |
| FR-INV-004 | Validate accept: invitation PENDING, chưa expired, race chưa start, jockey chưa assigned horse khác trong race | Must |
| FR-INV-005 | Jockey reject invitation → invitation REJECTED, ghi response_message, notify owner | Must |
| FR-INV-006 | Owner cancel invitation nếu status = PENDING và race chưa start | Must |
| FR-INV-007 | Hệ thống tự đánh dấu EXPIRED nếu expired_at < now và status = PENDING (scheduled job) | Must |

### 1.9. Pre-Race Check (FR-CHECK)

| ID | Requirement | Priority |
|----|------------|----------|
| FR-CHECK-001 | Referee chuyển race: SCHEDULED → CHECKING (referee phải là assigned referee, race có participants) | Must |
| FR-CHECK-002 | Referee check từng participant: horse_identity_ok, jockey_identity_ok, equipment_ok, health_ok, weight_ok, result (PASSED/FAILED/CONDITIONAL), note | Must |
| FR-CHECK-003 | Validate: referee là assigned referee, race status CHECKING, 1 check per participant | Must |
| FR-CHECK-004 | Nếu check PASSED → participant.check_status = PASSED | Must |
| FR-CHECK-005 | Nếu check FAILED → participant.check_status = FAILED, có thể DISQUALIFIED/WITHDRAWN | Must |
| FR-CHECK-006 | Race chuyển READY khi: tất cả required participants đã check, count ≥ min_participants, không có FAILED blocking | Must |

### 1.10. Violation Management (FR-VIO)

| ID | Requirement | Priority |
|----|------------|----------|
| FR-VIO-001 | Referee ghi nhận vi phạm: race_id, participant_id (optional), violation_type, description (required), penalty, severity, occurred_at | Must |
| FR-VIO-002 | Validate: referee là assigned referee, race trong status CHECKING/READY/ONGOING/FINISHED | Must |
| FR-VIO-003 | Admin xem tất cả violations | Must |

### 1.11. Referee Report (FR-REPORT)

| ID | Requirement | Priority |
|----|------------|----------|
| FR-REPORT-001 | Referee tạo report cho race: title, summary. Default status = DRAFT | Must |
| FR-REPORT-002 | Referee submit report: DRAFT → SUBMITTED | Must |
| FR-REPORT-003 | Admin confirm report: SUBMITTED → CONFIRMED | Must |
| FR-REPORT-004 | Admin reject report: SUBMITTED → REJECTED (ghi rejection_reason) | Must |
| FR-REPORT-005 | Hệ thống generate ai_summary từ summary + violations + results (optional) | Nice |

### 1.12. Race Result (FR-RESULT)

| ID | Requirement | Priority |
|----|------------|----------|
| FR-RESULT-001 | Referee submit kết quả per participant: position, finish_time_seconds, result_status, points, prize_amount, note | Must |
| FR-RESULT-002 | Validate: referee là assigned referee, race FINISHED, participant thuộc race, position unique cho FINISHED, finish_time required cho FINISHED, 1 result per participant | Must |
| FR-RESULT-003 | Submit result → race_results.status = SUBMITTED, race.status = RESULT_SUBMITTED | Must |
| FR-RESULT-004 | Admin confirm → race_results.status = CONFIRMED, race.status = RESULT_CONFIRMED | Must |
| FR-RESULT-005 | Admin reject → race_results.status = REJECTED, race có thể quay FINISHED, bắt buộc rejection_reason | Must |
| FR-RESULT-006 | Admin publish → race_results.status = PUBLISHED, race.status = PUBLISHED, published_at = now | Must |
| FR-RESULT-007 | Khi publish: update tournament_rankings, evaluate predictions, notify participants + spectators | Must |
| FR-RESULT-008 | Default points: 1st=10, 2nd=7, 3rd=5, 4th=3, other finished=1, DISQUALIFIED/DNF/WITHDRAWN=0 | Must |

### 1.13. Ranking (FR-RANK)

| ID | Requirement | Priority |
|----|------------|----------|
| FR-RANK-001 | Sau result published: sum points by horse trong tournament, count races, count wins, sum prize, update rank_position | Must |
| FR-RANK-002 | Sort: total_points DESC → total_wins DESC → total_prize DESC → horse name ASC | Must |
| FR-RANK-003 | Public users xem ranking theo tournament | Must |
| FR-RANK-004 | Jockey ranking (sort: total_points DESC → total_wins DESC → total_races DESC) | Nice |

### 1.14. Prediction (FR-PRED)

| ID | Requirement | Priority |
|----|------------|----------|
| FR-PRED-001 | User (logged in, có SPECTATOR) submit prediction: race_id, prediction_type (WINNER/TOP3), predicted_winner_id, predicted_second_id, predicted_third_id | Must |
| FR-PRED-002 | Validate: race SCHEDULED/CHECKING/READY, now < race_at, predicted participants thuộc race, 1 prediction per user per race | Must |
| FR-PRED-003 | WINNER: chỉ cần predicted_winner_id. TOP3: cần winner + second + third, phải distinct | Must |
| FR-PRED-004 | User cập nhật prediction trước race_at nếu status = PENDING | Must |
| FR-PRED-005 | Lock prediction: khi race start hoặc now ≥ race_at → PENDING → LOCKED (scheduled job) | Must |
| FR-PRED-006 | Evaluate sau result published: WINNER đúng = 10pts, TOP3 đúng thứ tự = 30pts, TOP3 đúng người sai thứ tự = 15pts, sai = 0pts | Must |
| FR-PRED-007 | User xem prediction history | Must |
| FR-PRED-008 | Admin xem tất cả predictions | Must |

### 1.15. Notification (FR-NOTI)

| ID | Requirement | Priority |
|----|------------|----------|
| FR-NOTI-001 | Hệ thống tạo notification cho: role request approved/rejected, horse approved/rejected, registration approved/rejected, jockey invitation received/accepted/rejected, race scheduled, result published, prediction reward | Must |
| FR-NOTI-002 | User xem danh sách notifications với badge count unread | Must |
| FR-NOTI-003 | User mark notification as read (single + read all) | Must |

### 1.16. File Upload (FR-FILE)

| ID | Requirement | Priority |
|----|------------|----------|
| FR-FILE-001 | Upload single file (image/PDF) cho: avatar, horse image, evidence, tournament banner | Must |
| FR-FILE-002 | Validate file type + file size per category | Must |
| FR-FILE-003 | Serve uploaded files qua API | Must |
| FR-FILE-004 | Local storage cho dev, switchable sang cloud cho production | Must |

### 1.17. AI Features (FR-AI)

| ID | Requirement | Priority |
|----|------------|----------|
| FR-AI-001 | AI race prediction: tính win_probability, predicted_rank, confidence_score từ horse/jockey history + form + distance + track | Nice |
| FR-AI-002 | Level 1: Rule-based scoring (horseWinRate×0.35 + jockeyWinRate×0.25 + recentForm×0.25 + distanceCompat×0.15) | Nice |
| FR-AI-003 | Lưu AI prediction vào ai_race_predictions + ai_prediction_details | Nice |
| FR-AI-004 | AI jockey recommendation cho owner: compatibility_score, availability_status, reason | Nice |
| FR-AI-005 | AI referee report summary: generate ai_summary từ report + violations + results | Nice |

### 1.18. Blogs & Rewards (FR-BLOG)

| ID | Requirement | Priority |
|----|------------|----------|
| FR-BLOG-001 | Admin tạo, sửa, xóa (ẩn) bài viết blog. Set số điểm thưởng (`reward_points`) cho mỗi bài. | Must |
| FR-BLOG-002 | User (đã đăng nhập) xem danh sách và chi tiết bài viết blog. | Must |
| FR-BLOG-003 | Khi user scroll/đọc hết bài viết, hệ thống cộng `reward_points` vào ví điểm (`user_wallets`). | Must |
| FR-BLOG-004 | Mỗi user chỉ nhận điểm thưởng 1 lần duy nhất cho mỗi bài blog (lưu trong `user_blog_rewards`). | Must |
| FR-BLOG-005 | Ghi nhận giao dịch vào `wallet_transactions` với `txn_type = BLOG_REWARD`. | Must |

---

## 2. Non-Functional Requirements

### 2.1. Security (NFR-SEC)

| ID | Requirement | Priority |
|----|------------|----------|
| NFR-SEC-001 | Password phải hash bằng BCrypt, KHÔNG BAO GIỜ lưu plain text | Must |
| NFR-SEC-002 | Role-based access control (RBAC) cho tất cả endpoints | Must |
| NFR-SEC-003 | User không truy cập được private data của user khác | Must |
| NFR-SEC-004 | Owner chỉ quản lý horse của mình (service layer check ownership) | Must |
| NFR-SEC-005 | Jockey chỉ respond invitation của mình | Must |
| NFR-SEC-006 | Referee chỉ thao tác trên race được phân công | Must |
| NFR-SEC-007 | Admin endpoints phải protected | Must |
| NFR-SEC-008 | JWT token expiration + refresh mechanism | Must |
| NFR-SEC-009 | CORS configuration cho React frontend | Must |
| NFR-SEC-010 | Input sanitization (XSS prevention) | Must |
| NFR-SEC-011 | URL validation cho image_url, evidence_url | Should |
| NFR-SEC-012 | Rate limiting: login 5/15min, prediction 10/min | Should |

### 2.2. Data Integrity (NFR-DATA)

| ID | Requirement | Priority |
|----|------------|----------|
| NFR-DATA-001 | Email unique (DB constraint) | Must |
| NFR-DATA-002 | Unique active role per user (DB constraint) | Must |
| NFR-DATA-003 | Unique horse per tournament registration (DB constraint) | Must |
| NFR-DATA-004 | Unique horse per race (DB constraint) | Must |
| NFR-DATA-005 | Unique jockey per race (service layer) | Must |
| NFR-DATA-006 | Unique start number per race (service layer) | Must |
| NFR-DATA-007 | Prediction chỉ trước race_at | Must |
| NFR-DATA-008 | Result publish chỉ sau confirm | Must |
| NFR-DATA-009 | Ranking chỉ update từ published results | Must |
| NFR-DATA-010 | Soft delete cho users, horses, tournaments, races | Must |
| NFR-DATA-011 | Optimistic locking cho concurrent access (JPA @Version) | Should |

### 2.3. Performance (NFR-PERF)

| ID | Requirement | Priority |
|----|------------|----------|
| NFR-PERF-001 | Index trên: users.email, user_roles.user_id, horses.owner_id, tournaments.status, races.tournament_id, races.race_at, race_participants.race_id, predictions.race_id, notifications.user_id | Must |
| NFR-PERF-002 | Pagination cho tất cả list API (default 20, max 100) | Must |
| NFR-PERF-003 | API response time < 500ms cho standard operations | Should |

### 2.4. Maintainability (NFR-MAINT)

| ID | Requirement | Priority |
|----|------------|----------|
| NFR-MAINT-001 | Dùng Java Enum cho tất cả status values, không hardcode strings | Must |
| NFR-MAINT-002 | Dùng Service layer cho tất cả business rules | Must |
| NFR-MAINT-003 | Dùng DTO cho request/response, không expose Entity | Must |
| NFR-MAINT-004 | Dùng @Transactional cho multi-table workflows | Must |
| NFR-MAINT-005 | Dùng GlobalExceptionHandler cho error handling | Must |
| NFR-MAINT-006 | Controller → Service → Repository strict layer rules | Must |
| NFR-MAINT-007 | Frontend: Pages → Components → Hooks → Services strict layer rules | Must |

### 2.5. Auditability (NFR-AUDIT)

| ID | Requirement | Priority |
|----|------------|----------|
| NFR-AUDIT-001 | Log các action quan trọng: create/approve/reject tournament, horse, registration, role request, result | Nice |
| NFR-AUDIT-002 | Ghi nhận actor_id, action, entity_type, entity_id, old_value, new_value | Nice |
| NFR-AUDIT-003 | Ghi IP address + user agent cho security monitoring | Nice |

---

## 3. Actors & Permission Matrix

### 3.1. Actors

| Actor | Mô tả |
|-------|--------|
| **Guest** | Chưa đăng nhập. Xem public data, đăng ký, đăng nhập |
| **Spectator** | Role mặc định. Dự đoán, xem data, gửi role request |
| **Horse Owner** | Quản lý ngựa, đăng ký tournament, mời jockey |
| **Jockey** | Nhận/phản hồi invitation, xem lịch + kết quả cá nhân |
| **Referee** | Pre-race check, ghi vi phạm, lập report, submit result |
| **Admin** | Quản lý toàn bộ hệ thống |

### 3.2. Permission Matrix

| Feature | Guest | Spectator | Owner | Jockey | Referee | Admin |
|---------|-------|-----------|-------|--------|---------|-------|
| Xem tournament/race/result public | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Đăng ký tài khoản | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Dự đoán kết quả | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Gửi role request | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Tạo/cập nhật horse | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ |
| Duyệt horse | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Đăng ký horse vào tournament | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ |
| Mời jockey | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ |
| Accept/reject invitation | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Tạo tournament/race | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Phân công referee | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Pre-race check | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Ghi nhận vi phạm | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Submit race result | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Confirm/publish result | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 4. Constraints & Assumptions

### 4.1. Constraints
- Hệ thống sử dụng hoàn toàn cơ chế ĐIỂM (Points), KHÔNG có tiền tệ thật.
- Hệ thống KHÔNG có chức năng nạp/rút tiền. Điểm chỉ có thể kiếm được qua việc đọc blog.
- 1 jockey chỉ cưỡi 1 horse per race
- 1 horse chỉ tham gia 1 lần per race
- Prediction phải trước race_at

### 4.2. Assumptions
- User đăng ký mặc định là SPECTATOR
- Admin account được tạo sẵn qua seed data
- File storage dùng local cho dev, switchable sang cloud cho production
- DevOps (Docker, CI/CD) defer sang sprint sau
- AI features là optional, implement sau khi core hoàn tất
