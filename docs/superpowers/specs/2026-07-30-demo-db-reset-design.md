# Reset DB demo: seed sạch tiền, timeline nhất quán, thứ tự runner xác định

**Ngày:** 2026-07-30
**Trạng thái:** Design — chờ review

## 1. Vấn đề

Lần review DB trước, giảng viên mở ví một user thấy có số dư nhưng tra lịch sử giao dịch thì
không có gì tương ứng. Nguyên nhân trong `demo_data_script.sql`:

- Section 7 ([dòng 246-275](../../../demo_data_script.sql)) seed thẳng `wallets` (spectator
  1.000.000đ, các user khác 100.000đ) kèm một dòng `wallet_transactions` loại
  `ADMIN_ADJUSTMENT` / `reference_type = 'SEED'`.
- `ADMIN_ADJUSTMENT` **chỉ tồn tại trong enum** `WalletTransactionType`, không endpoint nào
  trong hệ thống tạo ra nó. Không có `topup_orders` nào. Tiền vào ví không có nguồn gốc.
- Các dòng `BET_PLACED` / `BET_PAYOUT` để `balance_after = NULL` → không dựng lại được số dư
  từ ledger.

Soát script phát hiện thêm hai lớp mâu thuẫn cùng loại:

- **Timeline:** race 1 giải A bị set `PUBLISHED` kèm `race_results` chính thức, nhưng `race_at`
  của nó là `CURRENT_DATE + 8` — kết quả chính thức của cuộc đua chưa diễn ra. Tournament A set
  `ONGOING` dù `start_date = CURRENT_DATE + 5`. Mọi timestamp của showcase (`confirmed_at`,
  `published_at`, `checked_at`) đều là `v_now` thay vì neo vào giờ đua.
- **Data giống fixture test:** 7 giải `HRT-LC-*` tên thẳng thừng `'Spring Maiden Trophy (Draft)'`,
  `'Winter Classic (Open Registration)'`… và **0 race, 0 participant**. Một giải
  `OPEN_REGISTRATION` hiện công khai với 0 vòng đua nhìn như hệ thống lỗi.

Song song, một bug thật của sản phẩm được phát hiện trong lúc soát (chi tiết mục 5).

## 2. Quyết định

| Câu hỏi | Chốt |
|---|---|
| Có seed tiền không? | **Không.** Ledger phải do app ghi, không do script |
| Phạm vi | Cắt tiền **+** fix timeline (không audit toàn bộ 827 dòng) |
| Data prod hiện tại | Xóa sạch, không giữ gì |
| Cách reset | `docker compose down -v` (không dùng `DROP SCHEMA`) |
| 7 giải `HRT-LC-*` | Giữ 3 (DRAFT / PENDING_APPROVAL / OPEN_REGISTRATION) với tên tự nhiên và data thật; xóa 4 giải rỗng |

## 3. Workstream A — cắt tiền khỏi seed script

Ba khối xóa hẳn:

| Khối | Vị trí | Xử lý |
|---|---|---|
| Section 7: `wallets` + `wallet_transactions` | 246-275 | Xóa hẳn |
| Prediction của spectator: 2 `race_predictions` + `UPDATE wallets -30` + `BET_PLACED` | 543-583 | Xóa; giữ phần `blogs` và lookup `v_first_race_id` |
| Settlement: `prediction_settlement_jobs` + 2 `UPDATE race_predictions` + `UPDATE wallets +50` + `BET_PAYOUT` | 734-758 | Xóa |

Kèm theo:

- Bỏ biến `v_winner_participant_id` (khai báo dòng 49, `SELECT INTO` dòng 537-541) — chỉ khối
  predictions dùng.
- Viết lại comment header (dòng 5-24) bỏ phần quảng cáo wallet/prediction/settlement.
- Bộ SELECT kiểm tra ở cuối script không đếm wallet/prediction nên không cần sửa; **thêm** một
  query xác nhận 6 bảng tiền đều rỗng.

**Không cần seed bảng `wallets`:** ví tự sinh với balance 0 khi user mở trang nhờ
`WalletService.getOrCreateAccount` (`walletRepository.findById(...).orElseGet(...)`).

**Kết quả:** `wallets`, `wallet_transactions`, `race_predictions`, `prediction_settlement_jobs`,
`topup_orders`, `withdrawal_requests` đều 0 dòng sau seed. Mọi đồng tiền xuất hiện sau đó do app
ghi, `balance_after` do code điền, có `topup_orders` đối chiếu.

**Đánh đổi đã chấp nhận:** race đã PUBLISHED sẽ không có dự đoán nào đã chấm. Luồng
settlement/payout demo live trong buổi bảo vệ (nạp VNPay sandbox → đặt cược → chấm).

## 4. Workstream B — timeline nhất quán

**Tournament A** (giải đang diễn ra):

| Cột | Cũ | Mới |
|---|---|---|
| `start_date` | `CURRENT_DATE + 5` | `CURRENT_DATE - 2` |
| `end_date` | `CURRENT_DATE + 40` | `CURRENT_DATE + 21` |
| `registration_start_at` | `v_now - 20 days` | `v_now - 30 days` |
| `registration_end_at` | `v_now + 3 days` | `v_now - 5 days` |

Đăng ký đóng trước khi giải chạy — đúng thứ tự lifecycle. Vẫn để `SCHEDULE_PUBLISHED` rồi
`UPDATE` lên `ONGOING` ở section 17; giờ mới đúng nghĩa "đang diễn ra".

**Races:** `race_at` đổi từ `start_date + 9h + (n * 3) days` sang `start_date + 9h + ((n-1) * 3) days`.
Giải A thành: race 1 = `CURRENT_DATE - 2` 09:00 (đã chạy → PUBLISHED hợp lý), race 2 = mai,
race 3 = +4 ngày, … race 8 = +19 ngày. **Đúng một race quá khứ, bảy race tương lai** để demo đặt
cược live. Tournament B giữ nguyên tương lai (`start_date + 45`) — vai "giải sắp mở".

**Timestamp showcase neo vào giờ đua** thay vì `v_now`. Thêm biến `v_first_race_at timestamp(6)`,
`SELECT race_at INTO v_first_race_at` cùng lúc lấy `v_first_race_id`:

| Bảng | Cột | Giá trị |
|---|---|---|
| `pre_race_checks` | `checked_at` | `v_first_race_at - 1 giờ` (kiểm tra **trước** đua) |
| `violations` | `occurred_at` | `v_first_race_at + 5 phút` |
| `race_results` | `submitted_at` / `confirmed_at` / `published_at` | `+15′` / `+45′` / `+1h` |
| `referee_reports` | `submitted_at` / `confirmed_at` | `+20′` / `+50′` |

**`race_participants.check_status`:** section 12 insert cứng `'NOT_CHECKED'` cho mọi race, mâu
thuẫn với `pre_race_checks` PASSED của race 1. Thêm `UPDATE` trong section 17 đặt `'PASSED'` cho
participant của race 1.

## 5. Workstream C — bug thứ tự participant (bug thật, không chỉ seed)

### Root cause — đã reproduce

`RaceParticipantRepository` chỉ có hai method sắp thứ tự, cả hai theo `created_at`:

```java
List<RaceParticipant> findAllByRace_IdOrderByCreatedAtAsc(Long raceId);
List<RaceParticipant> findAllByRace_IdAndStatusNotOrderByCreatedAtAsc(Long raceId, ParticipantStatus status);
```

Seed script gán **cùng một `v_now`** cho cả 128 dòng `race_participants` → `ORDER BY created_at`
là sort vô nghĩa (mọi giá trị bằng nhau) → Postgres giữ nguyên thứ tự input, mà input là output
của hash join trên `jockey_invitations`.

Reproduce trên Postgres 17 với đúng shape insert của section 12 (`races` JOIN `tournaments`
CROSS JOIN `tmp_pairs` JOIN `jockey_invitations` 3 cột, không `ORDER BY`): cả 16 race trả về lane
theo thứ tự **ngược** `8,7,6,5,4,3,2,1`, deterministic. Shape đơn giản hơn (không join
`jockey_invitations`) **không** reproduce — chính join 3 cột đó đẩy planner sang hash join.

Đây là bug sản phẩm, không riêng seed:

- `lane_number` (số áo trên bảng đua — thứ tự nghiệp vụ) **chưa từng được dùng để sắp thứ tự ở
  đâu trong backend**: grep `OrderByLaneNumber` ra 0 kết quả.
- `lane_number int` **nullable** trong `V1__baseline.sql`.
- Postgres `UPDATE` viết lại dòng ở vị trí heap mới → mỗi lần referee cập nhật `check_status`,
  runner table đổi thứ tự. Đây là lý do "càng về sau càng lộn xộn": DB reshuffle dần theo thời
  gian, không phải cảm giác.
- Frontend `RunnerTable` không sort lại, render đúng thứ tự API trả về.

Ảnh hưởng **15 call site** ở `PredictionService`, `SpectatorPredictionController`,
`StreakPredictionService`, `RaceService`, `RefereeRaceDayService`.

### Cách sửa

1. Thay hai derived method bằng `@Query` JPQL sắp `order by p.laneNumber asc nulls last, p.id asc`
   — cần `NULLS LAST` vì `lane_number` nullable, cần tiebreak `id` để xác định tuyệt đối.
2. **Đổi tên method** (`...OrderByLaneNumberAsc`) để compiler bắt buộc sửa đủ 15 call site —
   không sót chỗ nào.
3. Seed script: thêm `ORDER BY r.id, p.rn` vào insert section 12 → heap order khớp lane order
   (defense in depth: query nào thiếu ORDER BY cũng vẫn ra đúng).
4. Test: integration test insert participant với `created_at` giống nhau theo thứ tự lane đảo,
   assert API trả về đúng lane order tăng dần.

Workstream này là **commit riêng** — nó sửa code sản phẩm, không phải data demo.

## 6. Workstream D — 3 giải lifecycle, data thật

Xóa 4 giải rỗng: `HRT-LC-APPROVED`, `HRT-LC-ONGOING`, `HRT-LC-COMPLETED`, `HRT-LC-POSTPONED`.

Giữ 3 giải, bỏ hậu tố trạng thái trong tên, code tự nhiên:

| Code mới | Tên | Status | Vì sao giữ |
|---|---|---|---|
| `HRT-SPRING-MAIDEN-2026` | Spring Maiden Trophy | `DRAFT` | Organizer đang soạn — không hiện công khai |
| `HRT-SUMMER-DISTANCE-2026` | Summer Distance Cup | `PENDING_APPROVAL` | Chờ admin duyệt — cần cho luồng duyệt giải |
| `HRT-WINTER-CLASSIC-2026` | Winter Classic | `OPEN_REGISTRATION` | Hiện công khai, đang nhận đăng ký |

**Giải OPEN_REGISTRATION nhận `tournament_registrations` + `jockey_tournament_applications`, KHÔNG
nhận races.** Đây là điều chỉnh so với nhãn "có race thực" lúc chốt phương án: theo
`TournamentStatus` (`DRAFT → PENDING_APPROVAL → APPROVED → OPEN_REGISTRATION →
CLOSED_REGISTRATION → PARTICIPANTS_LOCKED → SCHEDULE_PUBLISHED → ONGOING → COMPLETED`), races chỉ
tồn tại từ `SCHEDULE_PUBLISHED` trở đi. Một giải còn đang nhận đăng ký mà đã có lịch 8 vòng với 8
runner xác nhận chính là loại tự mâu thuẫn mà spec này đang dọn. Nội dung đúng nghiệp vụ cho
`OPEN_REGISTRATION`:

- 5 `tournament_registrations` `PENDING` (chủ ngựa vừa đăng ký, admin chưa xét) + 2 `APPROVED`.
- 4 `jockey_tournament_applications` `PENDING`.
- 0 `races`, 0 `tournament_participants`.

**`referee_contracts` phải remap:** block hiện tại (dòng 647-656) tham chiếu `v_lc_approved`,
`v_lc_open`, `v_lc_ongoing` — hai trong ba giải đó bị xóa. Mapping mới vẫn phủ đủ 4 status:

| Tournament | Contract status |
|---|---|
| A | `ACTIVE` |
| B | `ACTIVE` |
| Winter Classic (OPEN_REGISTRATION) | `PENDING` — organizer vừa mời, chờ trọng tài phản hồi |
| Spring Maiden (DRAFT) | `DECLINED` — trọng tài từ chối, organizer vẫn đang soạn |
| Summer Distance (PENDING_APPROVAL) | `TERMINATED` — organizer hủy lời mời trước khi giải được duyệt |

## 7. Runbook reset prod

Đã verify an toàn cho `down -v`: `docker-compose.prod.yml` khai báo **duy nhất volume
`postgres-data`**; ảnh upload nằm trên Cloudflare R2 nên không bị chạm.

Trên droplet, từ repo root:

```bash
infra/backup-db.sh
```

```bash
docker compose -f docker-compose.prod.yml --env-file infra/.env.prod down -v && docker compose -f docker-compose.prod.yml --env-file infra/.env.prod up -d
```

Backend khởi động trên DB trắng → Flyway chạy V1→V36 (`ddl-auto: none`, Flyway là nguồn schema
duy nhất). Chờ health xanh (`start_period: 90s`), rồi seed:

```bash
docker compose -f docker-compose.prod.yml --env-file infra/.env.prod exec -T postgres psql -U "$DB_USERNAME" -d "$DB_NAME" -v ON_ERROR_STOP=1 < demo_data_script.sql
```

Downtime ≈ start image + Flyway + 90s health start_period.

## 8. Kiểm chứng

**Trước khi lên prod** — chạy full cycle trên Postgres local (`docker-compose.yml`, container
`hrts-postgres` đang chạy):

1. Tạo database scratch, chạy Flyway V1→V36, chạy script đã dọn với `ON_ERROR_STOP=1`.
2. Bộ SELECT kiểm tra ở cuối script.
3. Query xác nhận 6 bảng tiền = 0 dòng.
4. Query lane order: mọi race phải trả về `1,2,3,4,5,6,7,8` qua query mới.
5. Query timeline: đúng 1 race `PUBLISHED` với `race_at < now()`, 0 race `PUBLISHED` với
   `race_at > now()`; mọi `published_at > race_at`.

**Sau khi seed prod:**

1. Login `spectator@gmail.com` → `/wallet` hiện **0đ và lịch sử rỗng** (khớp nhau).
2. Nạp VNPay sandbox → balance nhảy, đúng 1 dòng `TOPUP` có `balance_after`, có `topup_orders`
   `SUCCESS` đối chiếu.
3. Mở race 2 giải A → runner table thứ tự lane 1→8.
4. Đặt cược → `BET_PLACED` với `balance_after` đúng.

## 9. Ngoài scope

- Audit toàn bộ 827 dòng script tìm mọi mâu thuẫn khác (đã chốt phạm vi hẹp hơn).
- Seed demo `topup_orders` / `withdrawal_requests` / `user_bank_accounts`.
- Sửa `WalletSummaryService` hay bất kỳ logic ví nào — không có bug ở đó.

## 10. Deliverables

- `demo_data_script.sql` đã dọn (commit 1: data demo).
- `RaceParticipantRepository` + 15 call site + integration test (commit 2: bug sản phẩm).
- `docs/db/2026-07-30-demo-db-reset-runbook.md` — runbook mục 7 + 8 để chạy lại về sau.
