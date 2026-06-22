# Tài liệu Phân tích Nghiệp vụ (BA) — Ví điện tử & Thanh toán (Wallet & Payments)

**Feature:** Đưa dòng tiền thật vào nền tảng — Ví điện tử (Wallet), nạp tiền qua VNPay, đặt cược bằng tiền, rút tiền theo cơ chế "yêu cầu rút" (manual review), và hoàn thiện dòng tiền B2B2C (phí đăng ký, prize purse, trả công trọng tài, hoa hồng nền tảng).
**Ngày cập nhật:** 2026-06-22
**Hệ thống:** Horse Racing Tournament System (SWP391)
**Trạng thái:** DRAFT — chờ chốt các "Quyết định mở" ở Mục 11.
**Liên quan:** [BA Role Ban tổ chức](2026-06-14-organizer-role-ba.md) (mô hình B2B2C 3 cổng) · module `point` hiện hữu (sổ cái điểm thưởng).

---

## 1. Bối cảnh & Mục tiêu Nghiệp vụ

**Hiện trạng:** Nền tảng đã có một "ví ảo" dạng **điểm thưởng** (`point` module): mỗi user có `UserPointAccount` (số dư), mọi biến động ghi vào sổ cái `PointTransaction`, và dịch vụ `PointAccountService` ghi sổ **idempotent**. Spectator hiện đặt dự đoán (prediction) và nhận thưởng **bằng điểm**, không phải tiền thật. Phía B2B2C (organizer/referee) **chưa có bất kỳ dòng tiền nào** — `RefereeContract` chỉ có link thỏa thuận, không có điều khoản phí; `Tournament` không có phí đăng ký hay giải thưởng.

**Vấn đề:** Một sàn đua chuyên nghiệp vận hành trên **dòng tiền thật**: khán giả nạp tiền để chơi, chủ ngựa trả phí dự giải, ban tổ chức công bố tiền thưởng và trả công trọng tài, nền tảng thu hoa hồng. Thiếu tầng tiền, hệ thống mới dừng ở "quản lý sự kiện", chưa phải "marketplace B2B2C" đúng nghĩa.

**Mục tiêu:**
1. Xây **Ví điện tử (Wallet)** là sổ cái **tiền thật** (VND) cho mọi user, kế thừa pattern sổ cái idempotent đã có.
2. **Nạp tiền (Top-up)** qua cổng thanh toán **VNPay** (môi trường sandbox cho phạm vi đồ án).
3. **Rút tiền (Withdrawal)** qua cơ chế **yêu cầu rút → nền tảng xét duyệt → chi trả** (mô hình Grab/MoMo).
4. Hoàn thiện **dòng tiền B2B2C**: entry fee, prize purse, referee payout, platform commission.
5. Đảm bảo **an toàn pháp lý & kỹ thuật**: tách số dư khả dụng (cash) khỏi tiền thắng cược (winnings), xác thực chữ ký cổng thanh toán, sổ cái 2 vế (double-entry), chống double-spend.

**Nguyên tắc xuyên suốt (Design Principles):**
- **P1 — Sổ cái là nguồn sự thật:** số dư = tổng hợp các bút toán; không bao giờ sửa/xóa bút toán, chỉ ghi **bút toán ngược (reversal)**.
- **P2 — Không tin client:** mọi ghi-có ví chỉ xảy ra khi nhận xác nhận **server-to-server** từ VNPay (IPN) và **verify chữ ký**; redirect trên trình duyệt chỉ để hiển thị.
- **P3 — Idempotent:** mọi thao tác tiền gắn `(reference_type, reference_id, type)` duy nhất — gọi lại không cộng/trừ trùng (tái dùng pattern `PointAccountService`).
- **P4 — Tách bạch thương mại vs cá cược:** xem Mục 3 & Mục 10.

---

## 2. Actor & Quan hệ Tiền

| Actor | NẠP tiền | NHẬN tiền | RÚT tiền | Ghi chú |
| :--- | :--- | :--- | :--- | :--- |
| **Spectator** | ✅ VNPay → cash | thắng cược → winnings | cash (qua yêu cầu rút) | Người chơi dự đoán. |
| **Owner (chủ ngựa)** | ✅ VNPay → cash | tiền thưởng nếu ngựa đạt giải → cash | cash | Trả entry fee khi đăng ký ngựa. |
| **Organizer (BTC)** | ✅ VNPay → cash (nạp quỹ giải) | doanh thu ròng của giải (phí − purse − referee − commission) → cash | cash | Công bố purse, trả công referee. |
| **Referee** | — | tiền công theo hợp đồng → cash | cash | Thu nhập dịch vụ (rút tự do). |
| **Platform / Admin** | — | hoa hồng nền tảng → tài khoản hệ thống | (đối soát ngoài hệ thống) | Gác cổng + **duyệt yêu cầu rút** + đối soát. |

> **Tài khoản hệ thống (System Accounts):** để sổ cái 2 vế luôn cân, cần các "ví nội bộ" không thuộc user thật: `PLATFORM_REVENUE` (hoa hồng), `GATEWAY_SUSPENSE` (tiền đang ở VNPay, chờ đối soát), `PRIZE_ESCROW` (giữ purse của giải), `WITHDRAWAL_CLEARING` (tiền đã duyệt rút, chờ chi).

---

## 3. Mô hình Ví — Hai loại số dư (Segregated Balances)

Đây là quyết định thiết kế **cốt lõi**, vừa đúng chuẩn ngành gaming/fintech vừa khoanh vùng rủi ro pháp lý:

| Loại số dư | Sinh ra từ | Dùng để | Rút được? |
| :--- | :--- | :--- | :--- |
| **`cash_balance`** (khả dụng) | nạp VNPay, hoàn tiền (refund), thu nhập marketplace (referee payout, organizer net, tiền thưởng owner) | đặt cược, trả phí, **rút** | ✅ qua "yêu cầu rút" |
| **`winnings_balance`** (tiền thắng / khuyến mãi) | thắng cược, thưởng hệ thống (first-login, blog…) | đặt cược tiếp | ⛔ **MVP: chưa rút** — mở khi có giấy phép phù hợp |

**Lý do:** Rút **tiền tự nạp / thu nhập dịch vụ** là giao dịch thương mại bình thường. Rút **tiền thắng cược** mới là chi trả cờ bạc — phần bị pháp luật quản lý chặt (xem Mục 10). Tách 2 quỹ cho phép bật/tắt tính năng rút tiền thắng **độc lập** mà không phải đập lại kiến trúc.

**Thứ tự trừ tiền khi đặt cược (mặc định đề xuất):** trừ `winnings_balance` trước, hết mới trừ `cash_balance` (giữ cash khả dụng cho user rút) — *là một Quyết định mở, xem Mục 11*.

---

## 4. Tiền tệ & Sổ cái (Ledger Design)

- **Đơn vị:** VND. Lưu **số nguyên đồng** (`BIGINT`, vì VND không có đơn vị phụ) → tránh hoàn toàn sai số dấu phẩy động. Tránh dùng `double`/`float` cho tiền.
- **Double-entry:** mỗi sự kiện tiền tạo **≥ 2 bút toán** có tổng = 0 (một vế ghi nợ, một vế ghi có). Ví dụ nạp 100k: `+100.000` vào `cash` của user, `−100.000` ở `GATEWAY_SUSPENSE`. Nhờ vậy **tổng toàn hệ thống luôn = 0** → đối soát được.
- **Append-only + Idempotent:** không update/delete dòng sổ cái; điều chỉnh bằng reversal. Khóa idempotency `(reference_type, reference_id, entry_type)` — tái dùng đúng cơ chế `PointAccountService.isTransactionIdempotent` ([PointAccountService.java:74](../../backend/src/main/java/com/example/horseracingtournamentsystem/point/service/PointAccountService.java)).
- **Chống số dư âm & double-spend:** guard "không cho âm" ngay trong entity (như `UserPointAccount.adjustPoints` đã làm — [UserPointAccount.java:53](../../backend/src/main/java/com/example/horseracingtournamentsystem/point/entity/UserPointAccount.java)) **cộng** `@Version` (optimistic lock) trên ví để 2 lệnh cược đồng thời không cùng tiêu một số dư.

**Đề xuất bảng (mức khái niệm):**
- `wallets` (user_id, cash_balance, winnings_balance, currency, version, updated_at)
- `wallet_transactions` (id, wallet_id, account_leg, amount, balance_type[CASH|WINNINGS], type, reference_type, reference_id, description, created_at) — sổ cái append-only.
- `topup_orders` (id, user_id, amount, status, vnpay_txn_ref, vnpay_response_code, created_at, paid_at).
- `withdrawal_requests` (id, user_id, amount, status, bank_info, reviewed_by, review_note, requested_at, reviewed_at, paid_at).
- `system_accounts` (code, balance) — các ví nội bộ ở Mục 2.

---

## 5. Vòng đời & Trạng thái (State Machines)

### 5.1. Nạp tiền (Top-up qua VNPay)
`[INITIATED]` ──(tạo URL VNPay)──▶ `[PENDING]` ──(IPN: code=00 + verify hash)──▶ `[SUCCESS]` → **ghi có `cash`**
`[PENDING]` ──(IPN fail / user hủy)──▶ `[FAILED]` · ──(quá hạn)──▶ `[EXPIRED]`

> Ghi-có ví chỉ ở bước nhận **IPN** hợp lệ (server-to-server), idempotent theo `vnpay_txn_ref`. Redirect về FE chỉ hiển thị trạng thái, **không** dùng để cộng tiền (P2).

### 5.2. Rút tiền (Withdrawal — mô hình "yêu cầu rút")
`[REQUESTED]` ──(Admin/Finance nhận)──▶ `[UNDER_REVIEW]` ──(duyệt)──▶ `[APPROVED]` ──(đã chuyển khoản)──▶ `[PAID]`
`[UNDER_REVIEW]` ──(từ chối, kèm lý do)──▶ `[REJECTED]`

> Khi `REQUESTED`: **giữ tiền (hold)** = chuyển `amount` từ `cash` sang `WITHDRAWAL_CLEARING` (số dư khả dụng giảm ngay, chống rút 2 lần). Khi `PAID`: tất toán khỏi clearing. Khi `REJECTED`: hoàn `amount` về `cash`.

### 5.3. Đặt cược & Tất toán (Bet Settlement — kế thừa prediction lifecycle hiện có)
Hiện `RaceService.applyPredictionLifecycle` đã có móc: **khóa cược** khi race rời SCHEDULED, **tạo settlement job** khi RESULT_CONFIRMED, **hoàn tiền** khi CANCELLED ([RaceService.java:572](../../backend/src/main/java/com/example/horseracingtournamentsystem/race/service/RaceService.java)). Ánh xạ sang ví:
- **Đặt cược:** `[PLACED]` → debit ví (hold). 
- **Thắng:** `[WON]` → credit `winnings` = stake × odds (odds từ `OddsCalculationService`).
- **Thua:** `[LOST]` → hold trở thành khoản chi (về `PLATFORM_REVENUE`).
- **Hủy race:** `[VOID]` → refund stake về đúng loại số dư đã trừ.

---

## 6. Business Rules (Quy tắc Nghiệp vụ)

> Đánh số **BR-W** (Wallet) để không đụng BR cũ của doc Organizer.

### Nhóm 1: Ví & Sổ cái
* **BR-W01:** Mỗi user có đúng **1 ví**, gồm 2 số dư `cash` và `winnings`, đơn vị VND (số nguyên đồng).
* **BR-W02:** Mọi biến động tiền phải sinh bút toán **double-entry** (tổng = 0) và **không thể sửa/xóa**; điều chỉnh chỉ bằng bút toán ngược.
* **BR-W03:** Số dư **không bao giờ âm**. Mọi thao tác trừ tiền phải kiểm tra đủ số dư **trong giao dịch có khóa** (`@Version`/pessimistic) để chống double-spend.
* **BR-W04:** Mọi thao tác tiền là **idempotent** theo `(reference_type, reference_id, type)`.

### Nhóm 2: Nạp tiền (VNPay)
* **BR-W05:** Ghi-có ví **chỉ** khi nhận IPN hợp lệ từ VNPay và **verify đúng `vnp_SecureHash`**. Redirect trình duyệt không được phép cộng tiền.
* **BR-W06:** Tiền nạp luôn vào `cash_balance`.
* **BR-W07:** Có **hạn mức nạp** tối thiểu/tối đa mỗi giao dịch và mỗi ngày (cấu hình); chặn nạp khi tài khoản bị khóa/đình chỉ.

### Nhóm 3: Rút tiền
* **BR-W08:** Chỉ rút được từ `cash_balance`. **MVP: `winnings_balance` KHÔNG rút được** (xem BR-W18, Mục 10).
* **BR-W09:** Tạo yêu cầu rút sẽ **giữ tiền** (hold) ngay; user không thể tiêu/rút phần đang chờ duyệt.
* **BR-W10:** Yêu cầu rút phải qua **xét duyệt thủ công** (Admin/Finance). Từ chối **bắt buộc kèm lý do** (lưu log).
* **BR-W11:** Số dư trừ thật **chỉ khi** trạng thái chuyển `PAID`; nếu `REJECTED`, hoàn hold về `cash`.

### Nhóm 4: Đặt cược (Spectator)
* **BR-W12:** Chỉ đặt cược khi cược đang **mở** (race SCHEDULED & trước giờ đua) — giữ nguyên điều kiện hiện có.
* **BR-W13:** Stake bị **giữ (hold)** khi đặt; tất toán theo kết quả **đã PUBLISHED** (sau Cổng 3 / BR-16 của doc Organizer) — tránh chung tiền vào kết quả chưa chốt.
* **BR-W14:** Race **CANCELLED/VOID** → hoàn 100% stake về đúng loại số dư đã trừ.
* **BR-W15:** Áp **hạn mức cược** mỗi lần / mỗi ngày (trách nhiệm chơi có kiểm soát — responsible gaming).

### Nhóm 5: Dòng tiền B2B2C (Marketplace)
* **BR-W16:** **Entry fee** (nếu giải đặt phí) bị trừ khỏi `cash` của Owner **tại thời điểm đăng ký** và **giữ trong `PRIZE_ESCROW`**; nếu đơn bị **từ chối/rút** → hoàn về Owner.
* **BR-W17:** **Prize purse** do Organizer công bố phải được **ký quỹ (escrow)** trước khi mở đăng ký; khi giải `PUBLISHED` kết quả, hệ thống tự chia purse theo thứ hạng, **trích hoa hồng nền tảng (commission %)** vào `PLATFORM_REVENUE`, phần còn lại trả Owner/Referee tương ứng.
* **BR-W23:** **Referee payout** theo điều khoản phí trong hợp đồng; chi khi race/giải hoàn tất điều hành.

### Nhóm 6: Tuân thủ & Rủi ro (Compliance — Critical)
* **BR-W18 (Ranh giới cờ bạc):** Rút **tiền thắng cược** là hoạt động bị quản lý. MVP **khóa** rút `winnings`; chỉ bật khi có pháp lý/giấy phép phù hợp. Đây là lý do tồn tại của mô hình 2 số dư (Mục 3).
* **BR-W19 (Age-gate):** Chỉ user **≥ 18 tuổi** (đã verify tuổi) mới được nạp/đặt cược. Hệ thống đã có cờ `ageVerified`.
* **BR-W20 (KYC để rút):** Yêu cầu rút phải có thông tin định danh + tài khoản ngân hàng khớp chủ tài khoản; ngưỡng rút lớn cần KYC nâng cao.
* **BR-W21 (AML / chống rửa tiền):** Gắn cờ & chặn các mẫu bất thường (nạp rồi rút ngay không phát sinh cược, rút vượt ngưỡng) để Admin review.
* **BR-W22 (Self-exclusion):** Cho phép user tự khóa nạp/cược trong khoảng thời gian (chơi có trách nhiệm).

---

## 7. Dòng tiền chi tiết (Money Flows)

**F1 — Nạp tiền:** User chọn mệnh giá → BE tạo `topup_order` (`INITIATED`) + URL VNPay (ký `vnp_SecureHash`) → user thanh toán trên VNPay (sandbox) → VNPay gọi **IPN** về BE → BE verify hash + `code=00` → ghi có `cash` (idempotent theo `vnp_TxnRef`) → order `SUCCESS`. Bút toán: `+amount` cash user / `−amount` `GATEWAY_SUSPENSE`.

**F2 — Đặt cược & tất toán:** Đặt cược → hold stake (debit cash/winnings → `PLATFORM_REVENUE` tạm giữ). Referee nhập KQ → Organizer **Confirm → Publish** (BR-16). Settlement job: người thắng nhận `winnings = stake×odds`; người thua mất stake (về `PLATFORM_REVENUE`). Race hủy → refund.

**F3 — Phí dự giải + Giải thưởng:** Organizer ký quỹ purse vào `PRIZE_ESCROW` trước khi mở đăng ký. Owner đăng ký ngựa → trừ entry fee (→ escrow). Giải `PUBLISHED` → chia purse theo thứ hạng, trích commission → `PLATFORM_REVENUE`, còn lại → cash của Owner đạt giải.

**F4 — Trả công Referee:** Hợp đồng có điều khoản phí → khi race/giải hoàn tất, chi từ quỹ giải (organizer) → `cash` của Referee (trừ commission nếu áp dụng).

**F5 — Rút tiền:** User tạo `withdrawal_request` (hold `cash` → `WITHDRAWAL_CLEARING`) → Admin/Finance review → `APPROVED` → chuyển khoản thực tế (thủ công/đối tác chi hộ) → đánh dấu `PAID` (tất toán clearing). Từ chối → hoàn về cash.

---

## 8. Compliance & An toàn (vì sao thiết kế này "đứng" được)

- **Pháp lý:** Phần duy nhất vướng luật cờ bạc là **rút tiền thắng cược** → đã khoanh bằng BR-W18 + mô hình 2 số dư. Phạm vi đồ án: dùng **VNPay sandbox**, **không xử lý tiền thật**, `winnings` không rút → an toàn để demo/nộp, nhưng kiến trúc **sẵn sàng go-live** khi có giấy phép.
- **Bảo mật giao dịch:** verify `vnp_SecureHash` (HMAC), IPN idempotent, không tin redirect (P2); secret/khóa để ở biến môi trường, không hardcode.
- **Toàn vẹn tiền:** double-entry + append-only + `@Version` → không double-spend, không lệch sổ; **đối soát hằng ngày** (tổng bút toán = 0; số dư VNPay khớp `GATEWAY_SUSPENSE`).
- **Chơi có trách nhiệm:** age-gate, hạn mức nạp/cược, self-exclusion (BR-W19/W15/W22).

---

## 9. Phạm vi MVP vs Mở rộng

| Hạng mục | MVP (đồ án) | Ngoài MVP (go-live thật) |
| :--- | :--- | :--- |
| Cổng thanh toán | VNPay **sandbox** | VNPay production + ký hợp đồng merchant |
| Nạp tiền | ✅ | đa cổng (MoMo, thẻ quốc tế) |
| Đặt cược bằng tiền | ✅ (cash + winnings) | + cược tổ hợp, cash-out sớm |
| Rút `cash` (yêu cầu rút) | ✅ (review thủ công) | chi hộ tự động qua đối tác |
| Rút `winnings` (cờ bạc) | ⛔ khóa (BR-W18) | mở khi có **giấy phép** + KYC/AML đầy đủ |
| Dòng tiền B2B2C (phí/purse/referee) | ✅ (escrow + chia tự động) | hóa đơn VAT, đối soát kế toán |

---

## Phụ lục A — Mapping Nghiệp vụ ↔ Codebase
> `🆕 NEW` = làm mới · `♻️ ĐÃ CÓ` = tái dùng/hợp thức hóa · `🔧 FIX` = cần sửa/mở rộng cái có sẵn.

| Hạng mục | Trạng thái | Ghi chú & vị trí |
| :--- | :--- | :--- |
| Pattern sổ cái idempotent (`getOrCreateAccount`, `adjustPoints`, `isTransactionIdempotent`) | ♻️ ĐÃ CÓ | Khuôn mẫu cho Wallet — [PointAccountService.java](../../backend/src/main/java/com/example/horseracingtournamentsystem/point/service/PointAccountService.java) |
| Guard "không cho âm" trong entity | ♻️ ĐÃ CÓ | [UserPointAccount.java:53](../../backend/src/main/java/com/example/horseracingtournamentsystem/point/entity/UserPointAccount.java) — nhân bản cho `Wallet` |
| Móc lifecycle cược (lock/settle/refund) | ♻️ ĐÃ CÓ | [RaceService.java:572](../../backend/src/main/java/com/example/horseracingtournamentsystem/race/service/RaceService.java) — đấu nối ví vào đây |
| Prediction hiện đặt/ăn bằng **điểm** (REF_RACE_PREDICTION / REF_RACE_RESULT) | 🔧 FIX | Cần trỏ settlement sang **ví tiền** (hoặc cờ cấu hình currency điểm↔tiền) |
| Entity `Wallet` (cash + winnings + `@Version`) | 🆕 NEW | Toàn bộ mới |
| `WalletTransaction` (double-entry, append-only) | 🆕 NEW | Khác `PointTransaction` ở chỗ 2 vế + balance_type |
| `TopUpOrder` + VNPay adapter (tạo URL, verify hash, IPN endpoint) | 🆕 NEW | Cần config `vnp_TmnCode`, `vnp_HashSecret`, return/IPN URL |
| `WithdrawalRequest` + màn duyệt rút (Admin/Finance) | 🆕 NEW | State machine Mục 5.2 |
| `SystemAccount` (PLATFORM_REVENUE, GATEWAY_SUSPENSE, PRIZE_ESCROW, WITHDRAWAL_CLEARING) | 🆕 NEW | Để cân sổ 2 vế |
| `RefereeContract` thêm **điều khoản phí** | 🔧 FIX | Hiện chỉ có `agreementUrl`, không có tiền |
| `Tournament` thêm `entryFee` / `prizePurse` / `commissionRate` | 🔧 FIX | Hiện không có trường tiền nào |
| `@Version` chống race khi cược/đăng ký đồng thời | 🆕 NEW | Đồng bộ khuyến nghị cũ ở doc Organizer (Phụ lục A) |
| FE: trang **Ví** (số dư, lịch sử, nạp, yêu cầu rút) cho mọi role | 🆕 NEW | Tái dùng `ConfirmDialog`, style workspace |

---

## Phụ lục B — Q&A "Phòng thủ" trước Hội đồng

**Hỏi 1: "Đồ án sinh viên xử lý tiền thật / cờ bạc — có hợp pháp không?"**
> Phạm vi đồ án dùng **VNPay sandbox** (không có tiền thật chạy qua), và **khóa rút tiền thắng cược** (BR-W18) — phần duy nhất thuộc diện quản lý cờ bạc. Hệ thống vận hành như một **ví đóng** an toàn để demo, nhưng kiến trúc (2 số dư, escrow, KYC hook) **sẵn sàng go-live** khi doanh nghiệp có giấy phép. Đây là cách các nền tảng thật triển khai: dựng plumbing trước, bật tính năng quản lý sau.

**Hỏi 2: "Vì sao tách 2 loại số dư cho phức tạp?"**
> Vì **nguồn gốc tiền quyết định tính pháp lý**: tiền tự nạp/thu nhập dịch vụ rút tự do (thương mại), tiền thắng cược thì bị quản lý. Tách quỹ cho phép bật/tắt rút tiền thắng **độc lập** mà không đập lại hệ thống — đúng chuẩn ngành fintech/gaming.

**Hỏi 3: "Làm sao chống gian lận nạp/rút và sai lệch tiền?"**
> 4 lớp: (1) **verify chữ ký VNPay + IPN idempotent** (không tin client); (2) **giữ tiền (hold)** khi tạo yêu cầu rút → chống rút 2 lần; (3) **xét duyệt thủ công** trước khi chi (BR-W10); (4) **sổ cái 2 vế + đối soát hằng ngày** (tổng = 0, khớp số dư cổng thanh toán).

**Hỏi 4: "Hai người cùng đặt cược một lúc, tiền có bị tiêu 2 lần không?"**
> Không. Số dư có **guard không-âm trong entity** + **`@Version` (optimistic lock)**: nếu 2 giao dịch tranh cùng số dư, một giao dịch sẽ retry/thất bại thay vì cùng trừ. Cộng với double-entry, sổ luôn cân.

**Hỏi 5: "Race chưa chốt kết quả mà đã chia tiền cược?"**
> Không. Stake bị **giữ** khi đặt; chỉ tất toán sau khi kết quả **PUBLISHED** qua Cổng 3 / BR-16 (Organizer Confirm → Publish). Tiền thắng/thua chỉ chạy trên kết quả chính thức.

---

## 10. Lưu ý Pháp lý (đọc kỹ)

Tài liệu này **không phải tư vấn pháp lý**. Ở Việt Nam, **cá cược/đánh bạc ăn tiền thật là hoạt động bị cấm/hạn chế** nếu không có giấy phép nhà nước. Trước khi đưa bất kỳ luồng "rút tiền thắng cược" nào lên môi trường thật, doanh nghiệp **bắt buộc** phải có ý kiến pháp lý và giấy phép phù hợp. Phạm vi đồ án giữ ở mức **sandbox + winnings không rút** chính là để tránh ranh giới này.

---

## 11. Quyết định Mở (cần chốt trước khi code)

1. **Thứ tự trừ tiền khi cược:** trừ `winnings` trước rồi mới `cash` (đề xuất), hay cho user chọn?
2. **Hoa hồng nền tảng:** % trên purse? % trên mỗi cược thua? hay cả hai? Mức bao nhiêu?
3. **Entry fee:** giải nào cũng có tùy chọn đặt phí, hay chỉ một số giải? Ai giữ phí (escrow nền tảng)?
4. **Hạn mức:** nạp tối thiểu/tối đa, cược tối đa/ngày, rút tối thiểu — con số cụ thể.
5. **KYC ngưỡng rút:** rút dưới X đồng chỉ cần thông tin ngân hàng; trên X cần định danh nâng cao — X = ?
6. **Điểm thưởng cũ (`point`):** giữ song song như "winnings/khuyến mãi", hay quy đổi/gộp vào ví tiền?

---

*Sau khi bạn duyệt đặc tả này (và chốt Mục 11), bước tiếp theo sẽ là: (a) thiết kế schema migration `Vx__wallet_payments.sql`, (b) entity + service `WalletService` theo pattern `PointAccountService`, (c) VNPay adapter + IPN endpoint, (d) FE trang Ví. Sẽ làm theo từng lát cắt, mỗi lát cắt compile + test xanh trước khi qua lát kế.*
