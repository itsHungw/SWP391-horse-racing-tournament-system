# Plan triển khai — Wallet & Payments (point → tiền thật VND)

**Ngày:** 2026-06-23 (cập nhật: gỡ gamification điểm)
**Branch:** `feat/wallet`
**Liên quan:** [BA Wallet & Payments](../../ba/2026-06-22-wallet-payments-ba.md) · [BA Organizer role](../../ba/2026-06-14-organizer-role-ba.md) · [Design Slice 1](../specs/2026-06-23-wallet-core-rename-design.md)
**Quyết định kiến trúc đã chốt:**
- **Đổi thẳng `point` → tiền thật, một số dư `cash` (VND)**, rename bảng/entity. KHÔNG mô hình 2 số dư.
- **Gỡ hẳn gamification điểm:** bỏ `point_settings` (+ admin UI), bỏ blog-reading-reward, bỏ first-login bonus. Ví chỉ nạp/cược/thưởng-cược/điều-chỉnh-admin.

> ⚠️ **Pháp lý (BR-W18) — chấp nhận có chủ ý:** 1 số dư ⇒ tiền thắng cược nằm chung số dư rút được. Giảm thiểu: VNPay sandbox + cờ `wallet.withdrawal.enabled` + đánh dấu nguồn qua `transaction_type`. Xem Slice 4.

---

## 0. Nguyên tắc xuyên suốt
1. **Tiền = `BIGINT` đồng VND.** Mọi `int` điểm → `long`/`BIGINT`. Không `double`/`float` cho tiền (odds vẫn `BigDecimal`).
2. **Toàn vẹn tiền = `@Transactional` + idempotency DB-enforced.** Một transaction ghi đủ `wallet + wallet_transaction (+ order/withdrawal)`. Idempotency có **UNIQUE index** `(reference_type, reference_id, transaction_type)` làm lưới đỡ tuyệt đối (§3).
3. **Chống double-spend = Pessimistic write lock** trên row ví (KHÔNG `@Version`). Không cần `@Retryable`, lấy `balance_after` sạch.
4. **`balance_after`** ghi vào mỗi bút toán → audit dễ.
5. **Guard không-âm** trong entity + lưới đỡ DB.
6. **Làm tròn `HALF_UP` rồi `.longValue()`** — KHÔNG `.intValue()` (chống truncate + overflow bigint).
7. **VNPay:** ghi-có ví CHỈ khi IPN verify `vnp_SecureHash` **+ so khớp số tiền + verify `vnp_TmnCode` + chặn order đã terminal**; redirect chỉ hiển thị.
8. **`Wallet.status` (ACTIVE/LOCKED):** chặn cược/nạp/rút khi ví bị khóa.
9. **Mỗi slice compile + test xanh trước khi qua slice kế.**

---

## 1. Bản đồ đổi tên & xóa

### Bảng — Slice 0 DROP (migration `V11`)
| Bảng | Xử lý |
| :-- | :-- |
| `point_settings` | **DROP** (gỡ admin point settings) |
| `user_blog_rewards` | **DROP** (gỡ blog reward) |
| `user_daily_point_limits` | **DROP** (gỡ hạn mức điểm blog/ngày) |

### Bảng — Slice 1 RENAME + widen (migration `V12`)
| Cũ | Mới | Thay đổi |
| :-- | :-- | :-- |
| `user_point_accounts` | `wallets` | `point_balance int` → `balance bigint`; **+`status varchar(20)`** (ACTIVE/LOCKED); giữ `user_id` PK, `updated_at`. KHÔNG thêm `version`. |
| `point_transactions` | `wallet_transactions` | `amount int` → `amount bigint`; **+`balance_after bigint NULL`**; CHECK `transaction_type` mới (§2); **+UNIQUE index idempotency** (filtered NULL). |

### Cột tiền (Slice 2)
| Bảng | Cũ | Mới |
| :-- | :-- | :-- |
| `race_predictions` | `entry_cost_points`, `reward_points`, `wager_amount` (int) | `stake_amount`, `payout_amount` (bigint) |

### Entity / Service / Enum (Slice 1)
| Cũ | Mới |
| :-- | :-- |
| package `point` | package `wallet` |
| `UserPointAccount` | `Wallet` (+`status`, `adjust(long)`, `isLocked`) |
| `PointTransaction` | `WalletTransaction` (+`balanceAfter`) |
| `PointTransactionType` | `WalletTransactionType` (§2) |
| `PointAccountService` | `WalletService` (`adjust(long)`, `getBalance→long`, pessimistic lock) |

> Sau Slice 0, **consumer còn lại của ledger** chỉ là: `PredictionService`, `PredictionSettlementScheduler`, `StreakPredictionService`, `LeaderboardService`. (Đã gỡ `PointSettingsService`, `FirstLoginBonusService`, `BlogRewardService`, `AdminPointSettingsController`.)
> **Cách rename:** IDE Rename/Move refactor (không sửa tay). Rename là big-bang một slice (không tách 1A/1B). Project chưa go-live, DB dev reseed được.

---

## 2. WalletTransactionType (enum sau khi gỡ gamification)
```
TOPUP                  // nạp VNPay → +cash
BET_PLACED             // đặt cược → -cash   (thay PREDICTION_ENTRY)
BET_PAYOUT             // thắng cược → +cash  (thay PREDICTION_REWARD)
BET_REFUND             // hủy race / ngựa rút / lỗi hệ thống → +cash (thay RACE_CANCEL_REFUND)
WITHDRAWAL_HOLD        // tạo yêu cầu rút → -cash
WITHDRAWAL_REFUND      // từ chối rút → +cash
ADMIN_ADJUSTMENT       // điều chỉnh thủ công (refund/correction)
```
> Đã BỎ `FIRST_LOGIN_BONUS`, `BLOG_REWARD`. Ví user mới = 0₫ tới khi nạp VNPay (đúng mô hình tiền thật).

---

## 3. Concurrency & Idempotency (hợp đồng `WalletService.adjust`)
```
@Transactional
adjust(user, amount, type, refType, refId, desc) -> long balanceAfter:
  1. Fast-path idempotency: (refType,refId,type) đã có → return getBalance() (tránh lock thừa khi job/IPN chạy lại).
  2. getOrCreate ví (race tạo mới chặn bởi PK user_id).
  3. SELECT ví FOR UPDATE (@Lock PESSIMISTIC_WRITE).
  4. status == LOCKED → throw.
  5. wallet.adjust(amount) (guard âm) → balanceAfter.
  6. Lưu ví + lưu WalletTransaction(balanceAfter). // UNIQUE index = lưới đỡ; race lọt B1 → DataIntegrityViolation → rollback, KHÔNG double-credit.
```

---

## 4. Các slice triển khai

### Slice 0 — Gỡ gamification điểm (point_settings + blog reward + first-login)
Pure deletion. Làm trước để giảm consumer của ledger.
- **Migration `V11`:** `DROP TABLE user_blog_rewards`, `user_daily_point_limits`, `point_settings`; `DELETE FROM point_transactions WHERE transaction_type IN ('BLOG_REWARD','FIRST_LOGIN_BONUS')` (dọn bút toán cũ trước khi Slice 1 siết CHECK).
- **Xóa BE:** `point/service/PointSettingsService`, `point/service/FirstLoginBonusService`, `point/controller/AdminPointSettingsController`, `point/entity/PointSetting`, `PointSettingKey`, `point/repository/PointSettingRepository`, dto `PointSettingResponse`/`UpdatePointSettingsRequest`; `blog/service/BlogRewardService`, `blog/entity/UserBlogReward`(+repo), `blog/entity/UserDailyPointLimit`(+repo), dto `BlogRewardClaimRequest`/`Response`.
- **Sửa BE:** `AuthService` bỏ gọi `firstLoginBonusService.awardIfEligible`; `BlogController` bỏ endpoint claim-reward; `PredictionSettlementScheduler` bỏ `PointSettingsService` — reward = **chỉ** `wager × lockedOdds` (bỏ nhánh fixed-reward `getInt(...)`; nếu `lockedOdds` null thì reward 0 + log); `PredictionService`/`SpectatorPredictionController` gỡ dependency `PointSettingsService` không dùng. `PointTransactionType`: bỏ `FIRST_LOGIN_BONUS`, `BLOG_REWARD`.
- **Xóa FE:** `pages/admin/AdminPointSettingsPage.tsx`(+test), `api/pointSettingsApi.ts`(+test), `types/pointSettings.ts`, route + nav link (AppRouter, AdminLayout); UI claim-reward trong `SpectatorBlogDetailPage.tsx`(+`SpectatorBlogPages.test.tsx`), reward types trong `types/blog.ts`. (Giữ tính năng đọc blog — chỉ bỏ phần thưởng điểm.)
- **Data:** `demo_data_script.sql` bỏ seed `point_settings` + blog reward.
- **Xong khi:** `./mvnw test` + `npm test` xanh; không còn tham chiếu point_settings/blog-reward/first-login.

### Slice 1 — Wallet core (rename + money-safety) → migration `V12`
Phạm vi: rename ledger + đổi cơ chế `WalletService` (pessimistic lock, balance_after, idempotency DB, status). Behavior-preserving cho caller; KHÔNG đụng field `race_predictions`. Chi tiết: [design doc](../specs/2026-06-23-wallet-core-rename-design.md).
- `V12`: drop CHECK cũ → rename bảng/cột → `int→bigint` → add `status`/`balance_after` → UPDATE enum cũ→mới → CHECK mới → UNIQUE index idempotency.
- Move package `point→wallet`; rename entity/service/enum; `Wallet.status`; `WalletService` pessimistic-lock + balance_after; repo `lockByUserId`.
- Cập nhật import 4 consumer + test; `demo_data_script.sql`.

### Slice 2 — Ngữ nghĩa tiền trong prediction
- Field `RacePrediction` → `stakeAmount/payoutAmount` (long); cập nhật Odds/Prediction/Scheduler/Streak.
- Min wager 10.000 (giữ). FE: nhãn "points"→"₫", `Intl.NumberFormat('vi-VN')`.
- **Leaderboard — CHỐT:** bỏ xếp theo balance; đổi **tổng tiền thắng (BET_PAYOUT)/win-rate** từ ledger.

### Slice 3 — Nạp tiền VNPay (sandbox)
- Bảng `topup_orders (id, user_id, amount bigint, status, vnpay_txn_ref unique, vnpay_response_code, created_at, paid_at)`. `INITIATED→PENDING→SUCCESS|FAILED|EXPIRED`.
- `VNPayService`: build URL (ký HMAC-SHA512), verify hash.
- Endpoints: `POST /api/wallet/topup`; `GET /api/wallet/vnpay/return` (hiển thị); `GET /api/wallet/vnpay/ipn` (server-to-server).
- **IPN bắt buộc (P0):** 1) verify hash. 2) verify `vnp_TmnCode`. 3) **so khớp `vnp_Amount/100 == order.amount`** (lệch → FAILED/FRAUD). 4) `code==00`. 5) **order chưa terminal** (`if SUCCESS return`). 6) `WalletService.adjust(+amount, TOPUP, "TOPUP_ORDER", orderId)`. 7) trả `{"RspCode":"00","Message":"Confirm Success"}`.
- Config/env: `VNPAY_TMN_CODE/HASH_SECRET/PAY_URL/RETURN_URL/IPN_URL`; cập nhật `.env.example`.

### Slice 4 — Rút tiền (yêu cầu rút + admin duyệt)
- Bảng `withdrawal_requests (id, user_id, amount, fee_amount, net_amount, status, bank_info, reviewed_by, review_note, requested_at, reviewed_at, paid_at)`. `REQUESTED→UNDER_REVIEW→APPROVED→PAID | REJECTED`.
- Tạo yêu cầu: `WITHDRAWAL_HOLD` trừ cash (chống rút 2 lần). `PAID`: tất toán. `REJECTED`: `WITHDRAWAL_REFUND` hoàn cash. Cờ `wallet.withdrawal.enabled`. Chặn khi `LOCKED`.
- Endpoints user `POST/GET /api/wallet/withdrawals`; admin list + `approve|reject|mark-paid`.

### Slice 5 — (sau MVP) Dòng tiền B2B2C
- `Tournament`: `entry_fee/prize_purse/commission_rate`. `RefereeContract`: `fee_amount`. Escrow + chia purse + commission.

### Slice 6 — Trang Ví (FE) + polish
- `/wallet`: số dư, lịch sử (hiện `balance_after`), nạp, yêu cầu rút. Header hiển thị số dư VND.

---

## 5. Rủi ro & lưu ý
- **DROP table (Slice 0):** 3 bảng đều là leaf (chỉ FK ra users/blogs) → `DROP TABLE` trực tiếp được, không vướng FK đến.
- **SQL Server `int→bigint` (Slice 1):** phải DROP CHECK/DEFAULT trước (`transaction_type` tên auto-gen → tìm động qua `sys.check_constraints`); đặt tên cố định `CK_/DF_/UQ_` cho constraint mới.
- **UNIQUE idempotency index:** trùng dữ liệu cũ → dedupe trước (dev reseed sạch).
- **`balance_after` backfill:** dòng lịch sử để NULL; chỉ bút toán mới populate.
- **Pessimistic lock:** ghi đồng thời cùng 1 ví bị serialize (hiếm, per-user). Tránh nhét notification/email vào transaction tiền (after-commit).
- **Reward sau khi bỏ settings:** mọi reward = `wager × lockedOdds`; đảm bảo submit luôn set `lockedOdds` (đã đúng trong `PredictionService`).

---

## 6. Thứ tự thực thi
1. Branch `feat/wallet` từ `develop`.
2. **Slice 0** (gỡ gamification, `V11`) → test xanh, commit.
3. **Slice 1** (rename core + money-safety, `V12`) → IDE refactor, test xanh, commit.
4. Slice 2 → 3 → 4 → 6. Slice 5 sau MVP.
