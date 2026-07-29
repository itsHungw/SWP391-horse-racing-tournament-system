# Runbook: reset DB demo và seed lại

Chạy lại được nhiều lần. Mọi mốc thời gian trong seed tính từ `CURRENT_DATE` lúc chạy, nên
seed hôm nay hay tháng sau đều ra cùng một hình dạng dữ liệu (race 1 luôn ở quá khứ, 7 race
sau ở tương lai).

Hai phần: **A** test trên máy local trước, **B** đẩy lên VPS. Đừng làm B trước khi A xanh hết.

---

## Phần A — test local

### A1. Lấy code về

```bash
git checkout refactor/refactor-client-UI && git pull
```

### A2. Bật Postgres local

```bash
docker compose up -d postgres
```

Chờ healthy:

```bash
docker compose ps postgres
```

Cột `STATUS` phải hiện `(healthy)`. Nếu vẫn `starting` thì đợi thêm ~10s.

### A3. Xóa sạch DB local

Cách nhanh nhất, không cần tắt container — xóa và tạo lại database:

```bash
docker exec hrts-postgres psql -U horseracing -d postgres -c "DROP DATABASE IF EXISTS horseracing WITH (FORCE);" -c "CREATE DATABASE horseracing OWNER horseracing;"
```

`WITH (FORCE)` ngắt luôn connection đang mở, nên không cần tắt backend trước. Nếu Postgres
local của bạn dùng tên DB/user khác thì sửa theo `.env`.

> Cách thay thế, dứt điểm hơn nhưng chậm hơn: `docker compose down -v` rồi `docker compose up -d postgres`.
> Lưu ý cách này xóa cả volume `minio-data` (ảnh upload local), phải chạy lại `minio-setup` để
> tạo lại bucket. Chỉ dùng khi muốn reset sạch cả object storage.

### A4. Chạy backend để Flyway dựng schema

```bash
./run-backend.ps1
```

Backend dùng `ddl-auto: none`, toàn bộ schema do Flyway dựng từ `V1__baseline.sql` đến
`V36`. Chờ tới khi log hiện `Started HorseRacingTournamentSystemApplication`. Nếu Flyway lỗi
thì **dừng ở đây** — không seed lên schema dựng dở.

Kiểm tra schema đã đủ (phải ra `46`):

```bash
docker exec hrts-postgres psql -U horseracing -d horseracing -tAc "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';"
```

### A5. Chạy seed script

`-v ON_ERROR_STOP=1` để psql dừng ngay khi có lỗi thay vì chạy tiếp và để lại DB nửa vời:

```bash
docker exec -i hrts-postgres psql -U horseracing -d horseracing -v ON_ERROR_STOP=1 < demo_data_script.sql
```

Toàn bộ phần ghi dữ liệu nằm trong một khối `DO $$ ... $$` nên nếu lỗi giữa đường thì tự
rollback sạch, không để lại dữ liệu dở dang.

### A6. Đọc kết quả — bảng INVARIANTS là chỗ quan trọng nhất

Script tự in ra 4 bảng. Ba bảng đầu là số lượng, bảng cuối là kiểm tra tính nhất quán:

```
 seq |              check_name               | actual | verdict
-----+---------------------------------------+--------+---------
   1 | money tables empty (phai = 0)         |      0 | PASS
   2 | giai co lich dua ma 0 participant     |      0 | PASS
   3 | race khong du 8 participant           |      0 | PASS
   4 | race co lane khong phai 1..8          |      0 | PASS
   5 | heap order khong khop lane order      |      0 | PASS
   6 | race PUBLISHED ma race_at o tuong lai |      0 | PASS
   7 | race_result publish truoc gio dua     |      0 | PASS
   8 | pre_race_check thuc hien sau gio dua  |      0 | PASS
   9 | dang ky dong sau ngay khai mac        |      0 | PASS
  10 | participant race da dua ma chua check |      0 | PASS
```

**Bất kỳ dòng nào FAIL thì dừng, không đem lên VPS.** Mỗi dòng FAIL là một loại dữ liệu tự
mâu thuẫn mà người review có thể bắt được.

Ba bảng số lượng phải ra:

| Chỉ số | Giá trị |
|---|---|
| Users | 26 |
| Owners / Jockeys / Horses | 8 / 8 / 8 |
| Tournaments (2 giải chính) | 2 |
| Tournament participants | 16 (8 mỗi giải) |
| Races | 16 (8 mỗi giải) |
| Race participants | 128 (8 mỗi race) |
| Giải A | `ONGOING`, race 1 `PUBLISHED`, race 2-8 `SCHEDULED` |
| Giải B | `SCHEDULE_PUBLISHED`, cả 8 race `SCHEDULED` |

Ngoài ra còn 3 giải phủ pha đầu vòng đời (không có race, đúng nghiệp vụ):

```bash
docker exec hrts-postgres psql -U horseracing -d horseracing -c "SELECT t.code, t.status, (SELECT count(*) FROM tournament_registrations r WHERE r.tournament_id=t.id) AS regs, (SELECT count(*) FROM races rc WHERE rc.tournament_id=t.id) AS races FROM tournaments t ORDER BY t.code;"
```

Phải thấy `HRT-SPRING-MAIDEN-2026` (DRAFT, 0 regs), `HRT-SUMMER-DISTANCE-2026`
(PENDING_APPROVAL, 0 regs), `HRT-WINTER-CLASSIC-2026` (OPEN_REGISTRATION, **7 regs**, 0 races).

### A7. Chạy test backend

```bash
cd backend && ./mvnw test
```

Phải BUILD SUCCESS. `RaceParticipantOrderingIntegrationTest` là test chốt cho bug thứ tự
runner — nếu nó đỏ thì thứ tự participant đang sai.

### A8. Kiểm tra trên UI

Bật frontend rồi đăng nhập lần lượt. Mật khẩu mọi tài khoản giống nhau (xem comment đầu
`demo_data_script.sql`).

| Việc cần xem | Tài khoản | Kỳ vọng |
|---|---|---|
| Ví | `spectator@gmail.com` | Số dư **0đ** và lịch sử giao dịch **rỗng** — hai thứ khớp nhau. Đây chính là chỗ lần trước bị bắt lỗi |
| Bảng runner | mở race 2 giải A | Thứ tự số áo **1→8**, không nhảy lung tung |
| Kết quả đã publish | mở race 1 giải A | Có kết quả chính thức, giờ publish **sau** giờ đua |
| Danh sách giải | trang công khai | Không giải nào tên kiểu `(Draft)` / `(Open Registration)`; không giải nào hiện ra mà 0 vòng đua |
| Luồng organizer | `organizer1@gmail.com` | Thấy giải DRAFT và giải chờ duyệt |
| Nhận đăng ký | Winter Classic | Có 5 đơn ngựa chờ xét + 4 đơn jockey chờ xét |

### A9. Test nạp tiền qua VNPay sandbox (tùy chọn nhưng nên làm)

Vì seed không tạo tiền, đây là cách duy nhất để có tiền trong hệ thống — và cũng là cách
chứng minh ledger do app ghi:

1. Đăng nhập `spectator@gmail.com`, vào ví, nạp tiền qua VNPay sandbox.
2. Sau khi nạp xong, kiểm tra sổ sách khớp:

```bash
docker exec hrts-postgres psql -U horseracing -d horseracing -c "SELECT w.user_id, w.balance, t.transaction_type, t.amount, t.balance_after, t.reference_type FROM wallets w LEFT JOIN wallet_transactions t ON t.user_id = w.user_id ORDER BY w.user_id, t.id;"
```

Phải thấy dòng `TOPUP` với `balance_after` bằng đúng `balance` của ví, và có
`topup_orders` trạng thái `SUCCESS` đối chiếu:

```bash
docker exec hrts-postgres psql -U horseracing -d horseracing -c "SELECT id, user_id, amount, status, vnpay_txn_ref, vnpay_transaction_no FROM topup_orders ORDER BY id;"
```

3. Đặt cược trên race 2 giải A → sinh thêm dòng `BET_PLACED` với `balance_after` đúng.

---

## Phần B — đẩy lên VPS

### B0. Hai cái bẫy phải biết trước

**Bẫy 1 — workflow chỉ chạy khi push vào `main`.** `.github/workflows/deploy.yml` trigger
`on: push: branches: [main]`. Đang ở nhánh `refactor/refactor-client-UI` thì phải merge vào
`main` mới deploy được.

**Bẫy 2 — workflow chỉ trigger theo path `backend/**`, `docker-compose.prod.yml`,
`.github/workflows/deploy.yml`.** File `demo_data_script.sql` nằm ở **root repo**, không nằm
trong các path đó. Nghĩa là **nếu lần sau bạn chỉ sửa seed script mà không sửa gì trong
`backend/`, workflow sẽ không chạy → VPS không `git pull` → seed script trên VPS vẫn là bản
cũ.** Lần này thì không sao vì có sửa `backend/` (repository + test). Lần sau nếu chỉ sửa
seed thì phải làm một trong hai:

- Vào tab Actions trên GitHub, bấm **Run workflow** (`workflow_dispatch` đã bật), hoặc
- SSH vào VPS rồi `cd /opt/hrts && git pull --ff-only` bằng tay.

### B1. Merge vào main

Việc reset đã nằm trong 4 commit (`5d3d3b2`, `f27d302`, `0761560`, `709fc50`) — **không cần
commit thêm gì**. Đừng chạy `git add -A`: nhánh này còn thay đổi **chưa commit** ở
`frontend/src/pages/public/*` (RacesPage, RaceAgenda, SegmentedControl, racingDiscovery), và
`add -A` sẽ quét chúng vào commit rồi đẩy lên production.

Kiểm tra trước cho chắc:

```bash
git status --short
```

Chỉ được thấy các file frontend đang dở. Chúng chưa commit nên **sẽ không theo lên main** —
cứ để nguyên đó, làm tiếp sau.

```bash
git checkout main && git pull && git merge refactor/refactor-client-UI && git push
```

> Nếu nhánh này còn commit khác chưa muốn lên production, cherry-pick riêng 4 commit trên
> thay vì merge cả nhánh.

### B2. Chờ GitHub Actions xanh

Vào tab Actions, chờ đủ 3 job: `test` → `build-and-push` → `deploy`.

Job `deploy` đã tự làm giúp bạn 3 việc trên VPS: `git pull --ff-only`, `docker compose pull`
(lấy image backend mới), `docker compose up -d`. **Nó KHÔNG reset DB** — volume `postgres-data`
vẫn còn nguyên dữ liệu cũ. Đó là phần bạn làm tay ở bước sau.

Nếu job `test` đỏ thì không có gì được deploy — sửa test trước.

### B3. SSH vào droplet

```bash
ssh <user>@<host-droplet>
```

```bash
cd /opt/hrts
```

Xác nhận code đã mới (phải thấy commit vừa push):

```bash
git log --oneline -1
```

### B4. Backup DB cũ trước khi xóa

```bash
infra/backup-db.sh
```

Script `pg_dump` rồi upload lên Cloudflare R2 (`db-backups/hrts-<timestamp>.sql.gz`), in ra
`backup ok: ...` khi xong. Dù đã thống nhất là không cần giữ gì, vẫn chạy — mất 10 giây và là
đường lùi duy nhất.

### B5. Xóa DB và dựng lại

```bash
docker compose -f docker-compose.prod.yml --env-file infra/.env.prod down -v
```

`down -v` xóa volume. Đã kiểm tra: `docker-compose.prod.yml` chỉ khai báo **một volume duy
nhất là `postgres-data`**, ảnh upload nằm trên Cloudflare R2 nên **không bị chạm**.

```bash
docker compose -f docker-compose.prod.yml --env-file infra/.env.prod up -d
```

Postgres chạy `initdb` tạo lại DB/user từ `infra/.env.prod`, backend khởi động trên DB trắng
và Flyway chạy `V1` → `V36`.

### B6. Chờ backend healthy

```bash
docker compose -f docker-compose.prod.yml --env-file infra/.env.prod ps
```

Chờ `backend` hiện `(healthy)`. Healthcheck có `start_period: 90s` nên đừng sốt ruột, tổng
thường 1-2 phút. Xem Flyway chạy tới đâu:

```bash
docker compose -f docker-compose.prod.yml --env-file infra/.env.prod logs --tail 80 backend
```

Nếu backend restart liên tục thì đọc log tìm lỗi Flyway — **đừng seed** khi backend chưa xanh.

### B7. Seed

```bash
docker compose -f docker-compose.prod.yml --env-file infra/.env.prod exec -T postgres psql -U "$DB_USERNAME" -d "$DB_NAME" -v ON_ERROR_STOP=1 < demo_data_script.sql
```

Nếu `$DB_USERNAME` / `$DB_NAME` không có trong shell hiện tại thì nạp env trước:

```bash
set -a; . infra/.env.prod; set +a
```

### B8. Đọc lại bảng INVARIANTS

Giống bước A6: **cả 10 dòng phải PASS**. Nếu có dòng FAIL, dữ liệu đã vào DB nhưng sai — chạy
lại từ B5 sau khi sửa script (khối `DO` là atomic nhưng bảng INVARIANTS chạy sau khi đã commit,
nên FAIL nghĩa là phải reset lại chứ không rollback tự động).

### B9. Smoke test trên production

1. Mở https://app.aqueduct.me — trang giải đua phải có 2 giải chính đầy đủ 8 vòng.
2. Đăng nhập `spectator@gmail.com` → ví **0đ, lịch sử rỗng**.
3. Mở race 2 giải A → bảng runner thứ tự **1→8**.
4. Mở race 1 giải A → kết quả chính thức hiển thị đủ.
5. Nạp VNPay sandbox một lần để chắc luồng tiền chạy trên production.

Kiểm tra bằng SQL nếu cần:

```bash
docker compose -f docker-compose.prod.yml --env-file infra/.env.prod exec -T postgres psql -U "$DB_USERNAME" -d "$DB_NAME" -c "SELECT (SELECT count(*) FROM wallets) AS wallets, (SELECT count(*) FROM wallet_transactions) AS txns, (SELECT count(*) FROM users) AS users, (SELECT count(*) FROM race_participants) AS race_participants;"
```

Ngay sau seed: `wallets = 0`, `txns = 0`, `users = 26`, `race_participants = 128`.

---

## Xử lý sự cố

| Hiện tượng | Nguyên nhân thường gặp | Cách xử lý |
|---|---|---|
| `duplicate key value violates unique constraint` khi seed | DB chưa trắng, đã có email/code của seed | Làm lại từ A3 (local) hoặc B5 (VPS) |
| `relation "..." does not exist` | Seed chạy trước khi Flyway xong | Chờ backend healthy rồi seed lại |
| Seed báo `Seed lookup failed: ...` | Migration mới đổi cột/enum mà script chưa theo | Đọc tên biến trong thông báo, sửa script chỗ tương ứng |
| INVARIANTS dòng 1 FAIL | Có ai/đoạn nào seed tiền trở lại | `grep -n "INSERT INTO wallet" demo_data_script.sql` — phải không có kết quả |
| INVARIANTS dòng 6/7 FAIL | Công thức `race_at` hoặc timestamp showcase bị sửa lệch | Xem section 11 và 17 của script |
| Bảng runner vẫn lộn xộn | Backend trên VPS vẫn là image cũ | Kiểm tra job `build-and-push` đã xanh, rồi `docker compose pull` + `up -d` |
| VPS không có seed script mới | Bẫy path trigger ở B0 | Chạy `workflow_dispatch` hoặc `git pull` tay trên VPS |

## Tại sao seed không tạo tiền

Số dư seed thẳng vào DB không có `topup_orders` hay hành động admin nào đối chiếu —
`ADMIN_ADJUSTMENT` chỉ tồn tại trong enum `WalletTransactionType`, không endpoint nào tạo ra
nó. Kết quả là ví có số dư mà lịch sử giao dịch không dựng lại được, đúng chỗ bị bắt lỗi ở lần
review trước. Ví tự sinh với balance 0 khi user mở trang
(`WalletService.getOrCreateAccount`), nên bỏ seed tiền không làm hỏng gì; muốn có tiền thì nạp
qua VNPay sandbox và để app ghi ledger.

Chi tiết thiết kế: [../superpowers/specs/2026-07-30-demo-db-reset-design.md](../superpowers/specs/2026-07-30-demo-db-reset-design.md).
