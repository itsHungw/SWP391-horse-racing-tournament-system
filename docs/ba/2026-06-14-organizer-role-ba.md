# Tài liệu Phân tích Nghiệp vụ (BA) — Role "Ban tổ chức" (Official Release)

**Feature:** Tách quyền tạo & vận hành giải đấu sang mô hình B2B2C "Ban tổ chức" (Organizer) với cơ chế giám sát 3 cổng của Admin.
**Ngày cập nhật:** 2026-06-14
**Hệ thống:** Horse Racing Tournament System (SWP391)
**Trạng thái:** APPROVED FOR DEVELOPMENT

---

## 1. Bối cảnh & Mục tiêu Nghiệp vụ
**Vấn đề:** Hệ thống cũ dồn toàn bộ quyền khởi tạo và vận hành giải đấu cho Admin, dẫn đến sai lệch với thực tế nghiệp vụ quản lý thể thao chuyên nghiệp và gây quá tải nền tảng.
**Giải pháp:** Áp dụng mô hình **Platform Moderation (B2B2C)**.
- Hệ thống đóng vai trò Nền tảng (Platform) thực hiện việc gác cổng và giám sát.
- Ban tổ chức (Organization) đóng vai trò khách hàng doanh nghiệp (B2B), chịu hoàn toàn trách nhiệm vận hành giải đấu.
- Người dùng cuối (Owner, Jockey, Spectator) là khách hàng B2C tương tác với các giải đấu đã được nền tảng kiểm duyệt.

## 2. Danh sách Actor (Vai trò)
| Actor | Đặc tả | Cách thức trở thành |
| :--- | :--- | :--- |
| **Admin** | Quản trị nền tảng (Governance). Gác cổng 3 chốt, giám sát hệ thống, xử lý tranh chấp. | Hệ thống cấp sẵn. |
| **Organizer** | Ban tổ chức — **1 tài khoản = 1 tổ chức** (MVP không chia chức vụ con). Toàn quyền vận hành giải của tổ chức mình: tạo giải, duyệt ngựa, xếp lịch, mời trọng tài. | Nộp hồ sơ đăng ký BTC → Admin duyệt. |
| **Referee** | Trọng tài chuyên môn. Được nền tảng cấp phép hành nghề, ký hợp đồng làm việc thời vụ theo từng giải. | Xin cấp phép hành nghề → Admin duyệt CV. |
| **Owner / Jockey** | Chủ ngựa / Nài ngựa. Tham gia thi đấu tại các giải được mở. | Xin role → Admin duyệt. |

## 3. Cơ chế Giám sát "3 Cổng Gác" (Core Platform Moderation)
Hệ thống phân tách rõ ràng ranh giới: **Admin gác cổng - Ban tổ chức vận hành**. Admin không can thiệp vào luồng vận hành hằng ngày nhưng kiểm soát chặt chẽ đầu vào và đầu ra qua 3 cổng:

1. **Cổng 1 - Duyệt Hồ sơ Ban Tổ chức (Onboarding Gate):** Admin xét duyệt hồ sơ đăng ký của các tổ chức trước khi cấp quyền hoạt động.
2. **Cổng 2 - Duyệt Giải đấu (Tournament Launch Gate):** Khi BTC tạo giải mới (DRAFT), giải phải được gửi lên Admin duyệt (PENDING_APPROVAL). Chỉ khi Admin đánh giá hợp lệ (APPROVED), BTC mới được phép mở đăng ký.
3. **Cổng 3 - Chốt Kết quả Tranh chấp (Conflict Resolution Gate):** Kết quả cuộc đua do Referee nhập sẽ tự động ghi nhận. Admin chỉ nhúng tay xử lý và phán quyết cuối cùng đối với các race có cờ cảnh báo (Flagged for Review / Tranh chấp).

## 4. Vòng đời & Trạng thái (State Machine)

### 4.1. Vòng đời Organization
`[PENDING]` ──(Admin duyệt)──▶ `[ACTIVE]` ──(Admin đình chỉ)──▶ `[SUSPENDED]`

*(Admin từ chối hồ sơ → `REJECTED`. MVP: mỗi tổ chức 1 chủ; nếu chủ bị đình chỉ, Admin xử lý ở cấp tổ chức — xem BR-13.)*

### 4.2. Vòng đời Tournament (Cập nhật Cổng số 2)
`[DRAFT]` ──(Gửi duyệt)──▶ `[PENDING_APPROVAL]` ──(Admin duyệt)──▶ `[APPROVED]` ──(BTC mở)──▶ `[OPEN_REGISTRATION]` → …

*(Nếu Admin từ chối, giải bị trả về `DRAFT` kèm lý do bắt buộc).*

## 5. Business Rules (Quy tắc Nghiệp vụ)

### Nhóm 1: Cấu trúc & Phân quyền Organization
* **BR-01:** Organization chỉ hoạt động (ACTIVE) sau khi Admin duyệt hồ sơ.
* **BR-02:** Mỗi tổ chức có đúng 1 chủ sở hữu (owner) — chính là người đăng ký. **Quyết định phạm vi (MVP):** không chia chức vụ con (Director/Staff); một tài khoản `ORGANIZER` quản một tổ chức.
* **BR-03:** Mỗi giải đấu (Tournament) thuộc về đúng 1 tổ chức.
* **BR-04:** Organizer chỉ được phép xem/thao tác trên các giải đấu của tổ chức mình; cập nhật hồ sơ tổ chức do chính Organizer thực hiện.
* **BR-05:** *Đã loại khỏi phạm vi MVP* (không có Staff để quản lý). Sẽ kích hoạt lại khi mở rộng sang mô hình tổ chức nhiều người.

### Nhóm 2: Ranh giới Nền tảng & Giám sát
* **BR-09 (Tách bạch quản trị):** Admin KHÔNG được phép tạo giải, tạo race, gán referee hay duyệt đơn đăng ký của chủ ngựa. Admin chỉ thực hiện duyệt 3 cổng và giám sát (đình chỉ).
* **BR-10 (Đình chỉ):** Khi một Organization bị chuyển trạng thái SUSPENDED, toàn bộ giải đấu đang ở trạng thái DRAFT hoặc PENDING_APPROVAL của tổ chức đó sẽ bị khóa cứng thao tác.
* **BR-17 (Duyệt nội dung giải):** Giải đấu bắt buộc phải đi qua trạng thái `PENDING_APPROVAL` và được Admin cấp `APPROVED` trước khi được phép mở đăng ký. Mọi hành động từ chối của Admin đều phải lưu log kèm lý do.

### Nhóm 3: Quản lý Trọng tài (Referee)
* **BR-06:** Nền tảng quản lý "chứng chỉ" của trọng tài. User phải được Admin cấp role REFEREE trước khi BTC có thể tìm kiếm và mời.
* **BR-07:** Để gán Referee vào một Race, Referee đó bắt buộc phải có hợp đồng trạng thái ACTIVE với giải đấu tương ứng.
* **BR-08:** Một Referee có thể ký hợp đồng thời vụ với nhiều giải đấu của nhiều Ban tổ chức khác nhau.

### Nhóm 4: Xử lý Edge Cases & Rủi ro (Critical)
* **BR-11 (Conflict of Interest):** Cá nhân đang thuộc một Ban tổ chức (Director/Staff) TUYỆT ĐỐI KHÔNG được tham gia thi đấu (dưới tư cách Jockey/Owner) trong chính giải đấu do tổ chức của mình sở hữu.
* **BR-12 (Tránh trùng lịch):** Khi BTC gán Referee vào một Race, hệ thống phải block nếu thời gian đua trùng lặp với bất kỳ Race nào khác mà Referee đó đã được gán (bất kể của tổ chức nào).
* **BR-13 (Mất chủ tổ chức):** Vì mỗi tổ chức chỉ có 1 chủ (MVP), khi tài khoản Organizer bị đình chỉ/xóa, tổ chức chuyển `SUSPENDED` và các giải chưa chạy bị khóa (cascade theo BR-10). Với giải **đang diễn ra**, Admin có quyền can thiệp (đóng băng/hủy giải) để bảo vệ user cuối. *(Cơ chế chuyển nhượng quyền chủ — Transfer Ownership — chỉ cần khi mở rộng sang tổ chức nhiều người, ngoài phạm vi MVP.)*
* **BR-14 (Bể hợp đồng):** Ban tổ chức được quyền Terminate hợp đồng của Referee đang giữa chừng giải. Hệ thống sẽ tự động gỡ Referee này khỏi các Race `UPCOMING`, nhưng giữ nguyên tên ở các Race đã `COMPLETED` để bảo toàn lịch sử nền tảng.
* **BR-15 (Kiểm tra dung lượng):** Tham số `maxHorses` phải được validate ngay tại thời điểm Ban tổ chức bấm nút "Duyệt đơn đăng ký", phòng trường hợp duyệt lố sức chứa của giải.
* **BR-16 (Kết quả kép):** Kết quả cuộc đua do Referee nhập trên sân phải qua một thao tác "Xác nhận công bố" (Publish/Confirm) từ phía Ban tổ chức thì điểm số/tiền thưởng mới chính thức được tính vào hệ thống.

---

## Phụ lục A — Mapping Nghiệp vụ ↔ Codebase
> Bổ sung sau khi rà soát source code hiện tại. Mục đích: FE/BE biết hạng mục nào làm mới, hạng mục nào tái dùng, hạng mục nào là vá lỗi có sẵn. (`🆕 NEW` = chưa có · `♻️ ĐÃ CÓ` = tái dùng/hợp thức hoá · `🔧 FIX` = lỗ hổng code hiện tại cần sửa)

| Hạng mục / Rule | Trạng thái | Ghi chú & vị trí trong code |
| :--- | :--- | :--- |
| Entity `Organization` (`owner_user_id` → 1 chủ/tổ chức; MVP **không** có bảng members / member_role) | 🆕 NEW | Toàn bộ mới |
| Global role `ORGANIZER` | 🆕 NEW | Bảng `roles` hiện chỉ có ADMIN, HORSE_OWNER, JOCKEY, REFEREE, SPECTATOR — [V1__baseline.sql:135](backend/src/main/resources/db/migration/V1__baseline.sql) |
| `Tournament.organization_id` | 🆕 NEW | Hiện chỉ có `creator` (cá nhân) — [TournamentService.java:60](backend/src/main/java/com/example/horseracingtournamentsystem/tournament/service/TournamentService.java) |
| Trạng thái `PENDING_APPROVAL` / `APPROVED` (Cổng 2, BR-17) | 🆕 NEW | Status hiện bắt đầu thẳng từ DRAFT → OPEN_REGISTRATION |
| `RefereeInvitation` + `RefereeContract` (BR-07, BR-08) | 🆕 NEW | Clone pattern `JockeyInvitation` đã có |
| **Cổng 1** — Duyệt hồ sơ BTC | ♻️ ĐÃ CÓ | Tái dùng luồng role-request + CV review ([UserRoleRequestService](backend/src/main/java/com/example/horseracingtournamentsystem/user/service/UserRoleRequestService.java), `AdminRoleRequestService.passCvReview`) |
| **Cổng 3** — Chốt kết quả tranh chấp | ♻️ ĐÃ CÓ | `requiresAdminReview` → RESULT_SUBMITTED → RESULT_CONFIRMED — [RefereeRaceDayService.java:205](backend/src/main/java/com/example/horseracingtournamentsystem/referee/service/RefereeRaceDayService.java) |
| Owner → Jockey contract (khuôn mẫu) | ♻️ ĐÃ CÓ | `JockeyInvitation` ở `/api/v1/owner/championships/{id}/contracts` |
| **BR-15** — capacity khi duyệt đơn | 🔧 FIX | `approve()` thiếu check sức chứa; chỉ check lúc tạo đơn — [TournamentRegistrationService.java:108](backend/src/main/java/com/example/horseracingtournamentsystem/tournamentregistration/service/TournamentRegistrationService.java) (so với dòng 149) |
| **BR-16** — BTC xác nhận kết quả | 🔧 FIX | Hiện referee tự chốt: `requiresReview=false` → RESULT_CONFIRMED ngay — [RefereeRaceDayService.java:211](backend/src/main/java/com/example/horseracingtournamentsystem/referee/service/RefereeRaceDayService.java). Cần chèn bước BTC confirm |
| **BR-12** — trùng lịch referee | 🔧 FIX | `assignReferee` chỉ check role, không check giờ/trạng thái race — [RaceService.java:164](backend/src/main/java/com/example/horseracingtournamentsystem/race/service/RaceService.java) |
| Account status `SUSPENDED` (cho BR-13 đình chỉ Organizer) | 🆕 NEW | `User` hiện chỉ có ACTIVE / PENDING_EMAIL_VERIFY — [User.java:30](backend/src/main/java/com/example/horseracingtournamentsystem/user/entity/User.java). Cơ chế chặn đã sẵn ở [CustomUserDetailsService.java:26](backend/src/main/java/com/example/horseracingtournamentsystem/security/CustomUserDetailsService.java) |
| Chuyển quyền duyệt đăng ký ngựa: Admin → BTC (BR-09) | 🔧 FIX | Hiện ở `/api/v1/admin/...` (`AdminTournamentRegistrationController`) |
| Admin monitoring dashboard | 🆕 NEW | Cần bổ sung |

**Khuyến nghị kỹ thuật (chưa thành BR):** thêm **optimistic locking (`@Version`)** cho `TournamentRegistration` & `RaceResult` — các check sức chứa/kết quả hiện là *check-then-act*, có thể race condition khi 2 request đồng thời.

## Phụ lục B — Q&A "Phòng thủ" trước Hội đồng (cơ chế 3 cổng)
Các câu hỏi hội đồng hay xoáy về SLA & bottleneck của cơ chế duyệt, kèm hướng trả lời:

**Hỏi 1: "Admin bận, giải gửi duyệt (PENDING_APPROVAL) bị ngâm lâu → BTC mất cơ hội?"**
> Hệ thống hỗ trợ cơ chế *nhiều Admin*: mọi tài khoản System Admin nhìn chung một pool hồ sơ chờ duyệt. Mô hình thực tế luôn có SLA (vd 24–48h). Trong phạm vi đồ án, nhóm tập trung giải quyết rào cản kỹ thuật — tạo **State Machine cứng** khóa quy trình để đảm bảo dữ liệu sạch trước khi public; thời gian duyệt thuộc quy trình vận hành nội bộ của business.

**Hỏi 2: "Giám sát xuyên suốt là gì? BTC lách luật thì sao?"**
> Đó là lý do thiết kế **BR-10** và trạng thái **SUSPENDED**. Nền tảng có quyền rút giấy phép (ban) tổ chức bất kỳ lúc nào. Phát hiện giải giả mạo → Admin bấm Suspend → hệ thống *cascade* khóa toàn bộ giải chưa chạy của tổ chức đó, bảo vệ user cuối khỏi giải lừa đảo.

**Hỏi 3: "Cổng 2 từ chối → giải về DRAFT. BTC sửa, gửi lại lần 2, Admin biết họ sửa gì để khỏi đọc lại từ đầu?"**
> Theo **BR-17**, Admin từ chối bắt buộc kèm lý do, lưu vào cột `rejection_reason` → BTC biết rõ phải sửa gì. Trong phạm vi MVP (10 tuần) chưa làm tính năng *Diff/Highlight thay đổi*, nhưng **Audit Log** cơ bản đã đủ để tracking luồng giao tiếp 2 bên.
