# Thiết kế CSDL — Chuẩn hóa & Schema cho "Ban tổ chức"

**Ngày:** 2026-06-14 · **Hệ thống:** Horse Racing Tournament System (SWP391)
**Phạm vi:** Audit chuẩn hóa schema hiện tại (32 bảng) + bổ sung schema cho feature Organizer.
**Nguồn schema gốc:** `backend/src/main/resources/db/migration/V1__baseline.sql`

---

## 0. Kết luận nhanh (đọc trước)
Schema hiện tại **đã đạt ~3NF** và được dựng tốt: surrogate key (`id bigint identity`) nhất quán, FK đầy đủ, unique constraint hợp lý, enum có CHECK. **Khuyến nghị KHÔNG đập đi xây lại** — vừa rủi ro, vừa đụng phần baseline team đang consolidate. Việc cần làm gồm 2 nhóm:
1. **Chuẩn hóa có chọn lọc:** xử lý vài cột *dẫn xuất* (derived) và vài FK *suy ra được* (redundant) — phần lớn nên **giữ làm denormalization có chủ đích** và **ghi chú rõ**, chỉ sửa cái thật sự đáng.
2. **Thêm schema Organizer:** 2 bảng mới + vài cột ALTER (mục 4) — giao bằng **migration V2 tiến lên**, KHÔNG sửa baseline V1.

---

## 1. Phân tích chuẩn hóa (1NF → 3NF)

### 1NF — Đạt toàn bộ
Mọi cột đều nguyên tử, không có nhóm lặp, không cột đa trị. ✓

### 2NF — Đạt toàn bộ
Mọi bảng dùng **khóa chính đơn** (`id` surrogate; riêng `point_settings`=`setting_key`, `user_point_accounts`=`user_id`, đều đơn cột). Không có khóa chính phức hợp ⇒ **không thể có phụ thuộc bộ phận** ⇒ 2NF thỏa mãn mặc nhiên. ✓

### 3NF — Đạt phần lớn; còn vài điểm cần xử lý
Có 2 dạng "lấn" 3NF, đều là **phụ thuộc bắc cầu** (non-key phụ thuộc vào non-key khác):

#### Nhóm A — Cột dẫn xuất (derived/computed)
| Bảng.cột | Suy ra từ | Đề xuất |
| :--- | :--- | :--- |
| `race_results.finish_time_seconds` | `raw_finish_time_seconds + penalty_seconds` (xác nhận trong code) | **Giữ** (snapshot kết quả chính thức) + ghi chú; hoặc đổi thành computed column |
| `race_results.points`, `prize_points` | `position` + bảng `point_settings` | **Giữ** (snapshot điểm tại thời điểm chốt — quan trọng cho lịch sử nếu point_settings đổi) |
| `users.age_verified` | `date_of_birth` (≥18) | Có thể bỏ, tính khi cần; hoặc giữ làm cache xác minh |

> Lý do "giữ": các cột này là **ảnh chụp tại thời điểm chốt**. Nếu `point_settings` thay đổi sau giải, ta vẫn cần biết điểm đã trao là bao nhiêu. Đây là denormalization **có chủ đích** — trả lời hội đồng: *"chúng em chấp nhận lưu giá trị dẫn xuất để bảo toàn tính bất biến lịch sử của kết quả"*.

#### Nhóm B — FK suy ra được (redundant association)
| Bảng | Cột thừa | Suy ra qua | Ghi chú |
| :--- | :--- | :--- | :--- |
| `race_participants` | `owner_id` | `horse_id → horses.owner_id` | Snapshot chủ ngựa lúc đăng ký |
| `tournament_participants` | `owner_id` | `horse_id → horses.owner_id` | Tương tự |
| `jockey_invitations` | `tournament_id`, `owner_id`, `horse_id` | đều suy ra từ `tournament_registration_id` | **Điểm dư thừa nhiều nhất** |
| `tournament_participants` | `tournament_id`, `owner_id`, `horse_id`, `jockey_id` | một phần suy ra từ `tournament_registration_id` / `jockey_invitation_id` | |

**Quyết định khuyến nghị:** **Giữ phần lớn làm snapshot có chủ đích** vì:
- Quyền sở hữu ngựa có thể đổi (sau khi BR-13/transfer hoặc owner bán ngựa) → participant cần "đóng băng" ai sở hữu *tại lúc thi đấu*.
- Bỏ đi sẽ làm mọi truy vấn phải JOIN sâu nhiều cấp.

→ Hành động duy nhất cần làm: **ghi chú** các cột này là "denormalized snapshot — cố ý" trong tài liệu/comment entity, để không bị hiểu nhầm là lỗi thiết kế. (`jockey_invitations` là ứng viên *có thể* cân nhắc bỏ bớt `tournament_id`/`owner_id` nếu muốn gắt 3NF, nhưng không bắt buộc.)

### 1.x — Vài điểm chất lượng (ngoài NF, nên sửa)
- **`users.status` KHÔNG có CHECK constraint** (trong khi `referee_profiles.status`, `blogs.status`… đều có). → Thêm CHECK + value `SUSPENDED` (phục vụ BR-13). **Đây là việc nên làm.**
- `point_settings` theo kiểu key-value (EAV), `setting_value` chỉ `int`. Chấp nhận được cho bảng cấu hình, nhưng giới hạn setting phi-số. Ghi nhận.
- `horse_owner_profiles.contact_email/contact_phone` trùng vai trò với `users.email/phone` — **cố ý** (liên hệ doanh nghiệp ≠ email đăng nhập). Ghi chú.
- "Role-by-FK-name": `referee_id`/`jockey_id`/`owner_id` đều FK→`users`; ràng buộc "đúng vai" do tầng app giữ, không phải DB. Chấp nhận với RBAC hiện tại.

---

## 2. Tận dụng cái đã có cho feature Organizer
- **Cấp phép Referee (BR-06)** đã có sẵn bảng **`referee_profiles`** (status: PENDING/ACTIVE/REJECTED/SUSPENDED/INACTIVE, `license_number`, `certification`, `experience_years`). ⇒ "Referee được nền tảng cấp phép" = `referee_profiles.status = ACTIVE`. **Không cần bảng mới cho licensing.**
- **Hồ sơ Owner** đã có `horse_owner_profiles` — `organizations` (mục 3) đi theo đúng khuôn mẫu này.
- **Cổng 3 (chốt kết quả)** đã có cột review trong `race_results`/`referee_reports`. Không đổi schema.

---

## 3. Bảng MỚI

### 3.1. `organizations` (Ban tổ chức — 1 chủ/tổ chức, MVP)
Gộp luôn "hồ sơ đăng ký" vào đây: tạo row `status=PENDING` lúc nộp, Admin duyệt → `ACTIVE` (Cổng 1).
```sql
create table organizations (
    id              bigint identity not null,
    owner_user_id   bigint not null,                 -- chủ tổ chức (MVP: 1 người)
    approved_by     bigint,                           -- admin duyệt
    created_at      datetime2(7) not null,
    updated_at      datetime2(7),
    approved_at     datetime2(7),
    deleted_at      datetime2(7),
    status          varchar(30) not null
        check (status in ('PENDING','ACTIVE','SUSPENDED','REJECTED')),
    code            varchar(100) not null,
    name            varchar(200) not null,
    license_number  varchar(100),
    contact_email   varchar(150),
    contact_phone   varchar(30),
    logo_url        varchar(500),
    evidence_url    varchar(500),                     -- giấy phép/hồ sơ đính kèm
    description     varchar(500),
    application_note varchar(max),                    -- lý do/giới thiệu khi đăng ký
    rejection_reason varchar(255),
    primary key (id)
);
alter table organizations add constraint UK_organizations_code unique (code);
alter table organizations add constraint FK_org_owner       foreign key (owner_user_id) references users;
alter table organizations add constraint FK_org_approved_by foreign key (approved_by)   references users;
```

### 3.2. `referee_contracts` (Hợp đồng thuê trọng tài theo giải — BR-07/08/14)
Một bảng gói trọn vòng đời: mời → đồng ý (ACTIVE) → từ chối/chấm dứt.
```sql
create table referee_contracts (
    id             bigint identity not null,
    tournament_id  bigint not null,
    referee_id     bigint not null,                   -- FK users (phải có referee_profiles ACTIVE)
    invited_by     bigint not null,                   -- organizer gửi lời mời
    terminated_by  bigint,
    created_at     datetime2(7) not null,
    updated_at     datetime2(7),
    responded_at   datetime2(7),
    terminated_at  datetime2(7),
    status         varchar(30) not null
        check (status in ('PENDING','ACTIVE','DECLINED','TERMINATED')),
    agreement_url  varchar(500),
    reason         varchar(500),
    primary key (id)
);
alter table referee_contracts add constraint UK_referee_contract unique (tournament_id, referee_id);
alter table referee_contracts add constraint FK_rc_tournament foreign key (tournament_id) references tournaments;
alter table referee_contracts add constraint FK_rc_referee    foreign key (referee_id)    references users;
alter table referee_contracts add constraint FK_rc_invited_by foreign key (invited_by)    references users;
```
> **BR-07** (chỉ gán referee đã ký HĐ) và **BR-12** (chống trùng giờ) được **enforce ở tầng app**: khi gán `races.referee_id`, kiểm tra tồn tại `referee_contracts (tournament_id, referee_id, status=ACTIVE)` và không trùng `races.race_at` với race khác của referee. (DB không cross-table CHECK được.)

---

## 4. Bảng SỬA (ALTER)

### 4.1. `tournaments` — gắn vào tổ chức + cổng duyệt (Cổng 2 / BR-17)
```sql
alter table tournaments add organization_id  bigint;          -- NOT NULL sau khi backfill (xem 5)
alter table tournaments add approved_by       bigint;
alter table tournaments add approved_at        datetime2(7);
alter table tournaments add rejection_reason  varchar(255);
alter table tournaments add constraint FK_tournament_org         foreign key (organization_id) references organizations;
alter table tournaments add constraint FK_tournament_approved_by foreign key (approved_by)      references users;
-- status: bổ sung 'PENDING_APPROVAL','APPROVED' vào tập giá trị hợp lệ
-- (cột tournaments.status hiện KHÔNG có CHECK → chỉ cần cập nhật logic + nên thêm CHECK đầy đủ)
```
Giữ `created_by` làm audit (ai trong tổ chức tạo giải).

### 4.2. `users` — cho phép đình chỉ (BR-10/13, vá H3)
```sql
alter table users add constraint CK_users_status
    check (status in ('ACTIVE','PENDING_EMAIL_VERIFY','SUSPENDED'));
```
> Cơ chế chặn đã có sẵn: `CustomUserDetailsService` set `disabled = !ACTIVE`, kiểm tra mỗi request. Chỉ cần thêm value `SUSPENDED` + endpoint admin để bật.

### 4.3. Seed role `ORGANIZER`
```sql
insert into roles (name, description)
select 'ORGANIZER','Organizer'
where not exists (select 1 from roles where name = 'ORGANIZER');
```

---

## 5. Di trú dữ liệu cũ (Backfill)
Các giải hiện tại có `created_by = admin`, chưa có `organization_id`:
1. Tạo 1 **"Platform Organization"** mặc định (`status=ACTIVE`, owner = admin).
2. `update tournaments set organization_id = <id Platform Org> where organization_id is null;`
3. Sau khi backfill xong → đổi `tournaments.organization_id` thành `NOT NULL`.

---

## 6. Cách giao (quan trọng)
- **KHÔNG sửa `V1__baseline.sql`.** Tạo **`V2__organizer_schema.sql`** chứa toàn bộ DDL mục 3–5 (forward migration). Flyway sẽ áp lên baseline.
- Cập nhật JPA entity tương ứng (`Organization`, `RefereeContract`, thêm field vào `Tournament`/`User`).
- Việc "chuẩn hóa" nhóm A/B = **ghi chú denormalization + thêm CHECK cho `users.status`**, không phá cấu trúc cũ.

## 7. ERD
Sơ đồ ERD vùng Organizer (organizations, referee_contracts, tournaments, users, races + liên kết) — vẽ ở bước tiếp theo.
