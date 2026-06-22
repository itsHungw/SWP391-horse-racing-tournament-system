# Kịch bản Demo Business Flow + Test API trên Swagger

Tài liệu này hướng dẫn test toàn bộ **luồng nghiệp vụ chính** của hệ thống bằng Swagger UI,
theo đúng thứ tự diễn ra trong thực tế (onboarding → tổ chức giải → ngày đua → dự đoán → kết quả).

---

## 0. Khởi động & mở Swagger

1. Chạy backend (Spring Boot):
   ```bash
   cd backend
   ./mvnw spring-boot:run        # Windows: mvnw.cmd spring-boot:run
   ```
2. Mở Swagger UI: **http://localhost:8080/swagger-ui.html**
   (OpenAPI JSON: `/v3/api-docs`)

### Cách "Authorize" bằng JWT trong Swagger
- Các endpoint `/api/v1/auth/**`, các `GET` public (tournaments, races, horses, leaderboard...) và Swagger không cần token.
- Endpoint có khoá 🔒 cần JWT. Sau khi `POST /auth/login` lấy `accessToken`, bấm nút **Authorize** (góc phải trên),
  nhập: `Bearer <accessToken>` → Authorize. Mỗi role cần token riêng → khi đổi vai trò thì login lại và Authorize lại.
- Access token sống 15 phút; hết hạn thì login lại (hoặc `POST /auth/refresh`).

### Phân quyền theo prefix URL (SecurityConfig)
| Prefix | Quyền yêu cầu |
|--------|---------------|
| `/api/v1/admin/**` | ROLE ADMIN |
| `/api/v1/owner/**` | ROLE HORSE_OWNER |
| `/api/v1/jockey/**` | ROLE JOCKEY |
| `/api/v1/referee/**` | ROLE REFEREE |
| `GET` tournaments/races/horses/blogs/standings/leaderboard | Public |
| còn lại | Cần đăng nhập |

> Mỗi bước dưới đây ghi rõ **[Role]** cần Authorize bằng token của ai.

---

## PHA 1 — Onboarding & cấp vai trò

### B1. Đăng ký tài khoản — `POST /api/v1/auth/register`  *(public)*
```json
{
  "fullName": "Nguyen Van A",
  "email": "owner1@example.com",
  "password": "Passw0rd!",
  "phone": "0900000001"
}
```

### B2. Xác thực email — `POST /api/v1/auth/verify-email`  *(public)*
```json
{ "token": "<token-tu-email-hoac-log>" }
```
> Môi trường dev dùng LoggingEmailSender → token in ra console. Có thể `resend-verification-email` nếu cần.

### B3. Đăng nhập — `POST /api/v1/auth/login`  *(public)*
```json
{ "email": "owner1@example.com", "password": "Passw0rd!" }
```
→ Copy `accessToken` trong response, bấm **Authorize**.

### B4. Xem hồ sơ — `GET /api/v1/me`  *(đã login)*

### B5. Gửi yêu cầu vai trò chuyên môn — `POST /api/v1/role-requests`  *(đã login)*
```json
{
  "requestedRole": "HORSE_OWNER",
  "reason": "Toi la chu trang trai ngua, muon dang ky tham gia giai dau.",
  "resumeUrl": "https://example.com/cv-owner1.pdf"
}
```
> `requestedRole`: `HORSE_OWNER` | `JOCKEY` | `REFEREE`. Lặp lại B1–B5 để tạo thêm tài khoản JOCKEY và REFEREE.

### B6. [ADMIN] Duyệt yêu cầu vai trò
- Login bằng tài khoản ADMIN → Authorize.
- `GET /api/v1/admin/role-requests` — xem danh sách, lấy `id`.
- `POST /api/v1/admin/role-requests/{id}/pass-cv` — qua vòng CV (nếu quy trình 2 bước).
- `POST /api/v1/admin/role-requests/{id}/approve`  body: `{ "adminNote": "Ho so hop le" }` — cấp vai trò.
- (hoặc `POST /{id}/reject` để từ chối.)

> Sau khi được approve, user **login lại** để token chứa role mới.

---

## PHA 2 — [ADMIN] Tạo giải đấu & mở đăng ký

### B7. Tạo Tournament — `POST /api/v1/admin/tournaments`
```json
{
  "name": "Spring Cup 2026",
  "code": "SPRING-2026",
  "description": "Giai dua mua xuan",
  "location": "Hanoi Racetrack",
  "startDate": "2026-07-01",
  "endDate": "2026-07-05",
  "registrationStartAt": "2026-06-15T00:00:00",
  "registrationEndAt": "2026-06-25T23:59:59",
  "maxHorses": 20,
  "maxHorsesPerOwner": 3
}
```
→ Lấy `tournamentId`. Trạng thái khởi tạo = **DRAFT**.

### B8. Mở đăng ký — `PUT /api/v1/admin/tournaments/{id}/status?status=OPEN_REGISTRATION`
> Vòng đời status: `DRAFT → OPEN_REGISTRATION → CLOSED_REGISTRATION → PARTICIPANTS_LOCKED → SCHEDULE_PUBLISHED → ONGOING → COMPLETED` (có thể `POSTPONED`).

---

## PHA 3 — [OWNER] Đăng ký ngựa vào giải

### B9. [OWNER] Tạo hồ sơ ngựa — `POST /api/v1/owner/horses`
(multipart hoặc JSON tuỳ endpoint; bản JSON field như sau)
```json
{
  "name": "Black Thunder",
  "registrationCode": "BT-001",
  "breed": "Thoroughbred",
  "gender": "MALE",
  "dateOfBirth": "2021-03-10",
  "color": "Black",
  "heightCm": 160,
  "weightKg": 450,
  "healthStatus": "HEALTHY",
  "imageUrl": "https://example.com/horse.jpg",
  "evidenceUrl": "https://example.com/evidence.pdf",
  "medicalNote": "OK",
  "description": "Ngua dua khoe manh"
}
```
→ Lấy `horseId`. Ngựa ở trạng thái **pending**.

### B10. [ADMIN] Duyệt ngựa — `POST /api/v1/admin/horses/{id}/approve`
(hoặc `/reject` với lý do). Sau approve ngựa mới đủ điều kiện đăng ký giải.

### B11. [OWNER] Đăng ký ngựa vào giải — `POST /api/v1/owner/tournament-registrations`
```json
{ "tournamentId": 1, "horseId": 1, "note": "Dang ky tham gia" }
```
→ Đơn ở trạng thái **pending**.

### B12. [ADMIN] Duyệt đăng ký — `POST /api/v1/admin/tournament-registrations/{id}/approve`
(hoặc `/reject`). Xem danh sách: `GET /api/v1/admin/tournament-registrations`.

---

## PHA 4 — [JOCKEY ↔ OWNER] Pool nài & hợp đồng

### B13. [JOCKEY] Nộp đơn vào pool — `POST /api/v1/jockey/championships/{championshipId}/pool-applications`
### B14. [ADMIN] Duyệt đơn pool — `POST /api/v1/admin/championships/{championshipId}/jockey-pool-applications/{applicationId}/approve`
### B15. [OWNER] Mời nài ký hợp đồng — `POST /api/v1/owner/championships/{championshipId}/contracts`
### B16. [JOCKEY] Phản hồi hợp đồng
- `POST /api/v1/jockey/contracts/{contractId}/accept`  — đồng ý
- `POST /api/v1/jockey/contracts/{contractId}/reject`  — từ chối
### B17. [ADMIN] Chốt thành phần — `POST /api/v1/admin/championships/{championshipId}/lock-participants`

---

## PHA 5 — [ADMIN] Tạo race & công bố lịch

### B18. Đóng đăng ký — `PUT /api/v1/admin/tournaments/{id}/status?status=CLOSED_REGISTRATION`
### B19. Chốt thành phần giải — `PUT /api/v1/admin/tournaments/{id}/status?status=PARTICIPANTS_LOCKED`
### B20. Tạo Race — `POST /api/v1/admin/races`
```json
{
  "tournamentId": 1,
  "name": "Race 1 - Opening Sprint",
  "code": "R1",
  "raceDateTime": "2026-07-01T09:00:00",
  "distanceMeters": 1200,
  "maxParticipants": 8
}
```
→ Lấy `raceId`. Status race khởi tạo = **SCHEDULED**.

### B21. Gán trọng tài — `PUT /api/v1/admin/races/{raceId}/referee?refereeId=<userIdRefere>`
### B22. Xem participants của race — `GET /api/v1/admin/races/{raceId}/participants`
### B23. Công bố lịch — `PUT /api/v1/admin/tournaments/{id}/status?status=SCHEDULE_PUBLISHED`
   rồi `...?status=ONGOING` khi giải bắt đầu.

---

## PHA 6 — [SPECTATOR] Dự đoán (đặt cọc điểm)

### B24. [User thường] Xem race đang mở dự đoán — `GET /api/v1/races/open-for-prediction`
### B25. Xem lựa chọn dự đoán — `GET /api/v1/races/{raceId}/prediction-options`
### B26. Xem ví điểm — `GET /api/v1/point-accounts/me`
### B27. Gửi dự đoán — `POST /api/v1/predictions`
```json
{
  "raceId": 1,
  "predictionType": "WINNER",
  "predictedWinnerId": 5
}
```
> `predictionType`: `WINNER` (1 con) hoặc `TOP3` (cần thêm `predictedSecondId`, `predictedThirdId`).
> `predictedWinnerId` = id trong `race_participants` (lấy ở B25). Sửa: `PUT /api/v1/predictions/{id}`. Xem của tôi: `GET /api/v1/predictions/my`.
> Khi tới giờ đua, race **LOCKED** → không sửa được nữa.

---

## PHA 7 — [REFEREE] Ngày đua (state machine)

Authorize bằng token REFEREE. Vòng đời race:
`SCHEDULED → CHECKING → READY → ONGOING → FINISHED → RESULT_SUBMITTED → RESULT_CONFIRMED → PUBLISHED`

### B28. Xem race được phân công — `GET /api/v1/referee/races`  → `GET /api/v1/referee/races/{raceId}`
### B29. Xem & kiểm tra participants
- `GET /api/v1/referee/races/{raceId}/participants`
- `POST /api/v1/referee/races/{raceId}/pre-checks`  — bắt đầu kiểm tra (→ CHECKING)
- `POST /api/v1/referee/races/{raceId}/check`  — check từng nài/ngựa (đạt → READY khi xong)
### B30. Bắt đầu đua — `POST /api/v1/referee/races/{raceId}/start`  (→ ONGOING)
### B31. Kết thúc đua — `POST /api/v1/referee/races/{raceId}/finish`  (→ FINISHED)
### B32. Nhập kết quả
- `GET /api/v1/referee/races/{raceId}/result-entries` — lấy khung nhập
- `POST /api/v1/referee/races/{raceId}/results` — nhập vị trí về đích cho từng participant
  (status mỗi con: `FINISHED` + `position`, hoặc `DISQUALIFIED`/`DID_NOT_FINISH`/`WITHDRAWN`)
- `POST /api/v1/referee/races/{raceId}/results/submit` — chốt kết quả
  → `RESULT_SUBMITTED` (nếu cần review) hoặc thẳng `RESULT_CONFIRMED`.
### B33. (tuỳ chọn) Ghi nhận sự cố/vi phạm/biên bản
- `POST /api/v1/referee/races/{raceId}/incidents`
- `POST /api/v1/referee/races/{raceId}/violations`
- `POST /api/v1/referee/races/{raceId}/reports`
### B34. Đẩy bước tiếp theo — `POST /api/v1/referee/races/{raceId}/next-step`
   (tự chuyển sang state kế tiếp; cuối cùng → **PUBLISHED**)

---

## PHA 8 — Settlement & Leaderboard

### B35. Settlement dự đoán (tự động)
- Sau khi race **PUBLISHED**, `PredictionSettlementScheduler` quét job:
  `SETTLEMENT_PENDING → PROCESSING → COMPLETED`.
- Dự đoán đúng → cộng điểm thưởng vào ví; sai → mất điểm đã cọc.
- [ADMIN] theo dõi: `GET /api/v1/admin/predictions/races`, `GET /api/v1/admin/predictions/races/{raceId}`,
  retry job lỗi: `POST /api/v1/admin/predictions/settlement-jobs/{jobId}/retry`.

### B36. Kiểm chứng kết quả
- [Spectator] `GET /api/v1/point-accounts/me` — số điểm đã thay đổi.
- `GET /api/v1/predictions/my` — trạng thái dự đoán (CORRECT/INCORRECT).

### B37. Bảng xếp hạng *(public)*
- `GET /api/v1/standings` — BXH tổng
- `GET /api/v1/championships/{championshipId}/standings` — BXH theo giải
- `GET /api/v1/leaderboard/spectators` — BXH khán giả

### B38. Hoàn tất giải — [ADMIN] `PUT /api/v1/admin/tournaments/{id}/status?status=COMPLETED`

---

## Checklist tài khoản cần chuẩn bị trước khi demo
| Vai trò | Dùng cho pha |
|---------|--------------|
| ADMIN | 1, 2, 5, 8 (duyệt, tạo giải/race, theo dõi) |
| HORSE_OWNER | 3, 4 (ngựa, đăng ký, hợp đồng) |
| JOCKEY | 4, 7 liên quan (pool, hợp đồng) |
| REFEREE | 7 (ngày đua) |
| SPECTATOR (user thường) | 6, 8 (dự đoán, BXH) |

> Mẹo demo: chuẩn bị sẵn 5 token, mở 5 tab Swagger hoặc đổi Authorize lần lượt theo từng pha cho mạch lạc.
