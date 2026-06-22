# Đặc tả Thiết kế Hệ thống Tỷ lệ cược Động (Dynamic Betting System)

## 1. Tổng quan (Overview)
Hệ thống chuyển đổi từ mô hình trả thưởng tĩnh (Fixed-points dự đoán) sang mô hình Nhà Cái Chuyên Nghiệp. Người chơi tự do chọn mức tiền cược, tỷ lệ cược được tính toán thời gian thực theo thuật toán Tạo lập thị trường (AMM - Market Maker), đảm bảo nhà cái luôn có lợi thế (House Edge) và ngăn chặn tình trạng farm tiền.

## 2. Quy tắc cốt lõi về Dòng tiền (Core Rules)
- **Biên lợi nhuận Nhà cái (Margin/Overround):** Hệ số trả thưởng `R = 0.85` (Nhà cái luôn ngầm thu phế 15% tổng tiền giao dịch).
- **Mức cược (Variable Wager):**
  - Mức cược tối thiểu (Minimum bet): `10.000` điểm.
  - Có các nút bấm nhanh (Quick Select): `10K`, `20K`, `50K`, `100K`, `200K`, `500K`.
  - Có ô Text Input để người chơi tự nhập số tiền bất kỳ (>= 10.000).
- **Khoá tỷ lệ (Locked Odds):** Tỷ lệ cược được chốt cố định ngay thời điểm người chơi bấm Xác nhận cược thành công.

## 3. Cấu trúc các loại Kèo & Thuật toán tính Tỷ lệ

### 3.1. Kèo Dự Đoán Vị Trí (Win / Place / Top 3)
- **Mô tả:** Dự đoán ngựa về Nhất, Lọt Top 3, hoặc thứ tự chính xác.
- **Thuật toán Tỷ lệ động (Virtual Liquidity AMM):**
  - **Khởi tạo:** Admin cấu hình Tỷ lệ thắng kỳ vọng ban đầu (`P_i`) cho mỗi ngựa.
  - Quỹ ảo ban đầu `V_pool` (Ví dụ 10,000,000 điểm). Tiền ảo của ngựa i: `v_i = V_pool * P_i`.
  - **Công thức Tỷ lệ thời gian thực:**
    `Tỷ lệ Ngựa i = [ (V_pool + Tổng_Tiền_Thật_Vào_Kèo_Này) * R ] / (v_i + Tiền_Thật_Vào_Ngựa_i)`
  - *Cơ chế:* Càng nhiều tiền đập vào Ngựa i, tỷ lệ ăn của nó càng giảm (trượt giá), tự động chặn mọi nỗ lực spam dồn tiền.

### 3.2. Kèo Đối Kháng Kèm Chấp (Head-to-Head Handicap)
- **Mô tả:** Hệ thống chọn 2 ngựa A và B bắt cặp. Do A mạnh hơn B nên A chấp B một chỉ số (ví dụ: Chấp 1 giây, hoặc chấp 1 hạng). Bạn cược xem con nào chiến thắng kèo chấp này.
- **Thuật toán:**
  - Tách thành một "Chợ" (Pool) riêng lẻ chỉ có 2 cửa A và B.
  - Áp dụng công thức AMM tương tự 3.1, nhưng Mẫu số và Tử số chỉ tính tổng tiền cược của cặp A-B.
  - Tỷ lệ gốc khởi điểm cho 2 bên thường là `1.85 - 1.85` (do kèo chấp đã làm cân bằng thực lực 2 bên). Nếu user đập tiền vào cửa A nhiều hơn, A sẽ rớt xuống 1.60, B sẽ tăng lên 2.20.

### 3.3. Kèo Đoán Chuỗi Win (Parlay / Pick 3 - Lô Xiên)
- **Mô tả:** Dự đoán con ngựa về Nhất trong 3 (hoặc N) cuộc đua liên tiếp nhau. Đoán đúng toàn bộ mới được ăn tiền. Đoán sai 1 trận là mất vé.
- **Thuật toán:**
  - Tỷ lệ cược của chuỗi = Tích của các Tỷ lệ cược đơn ở thời điểm người chơi đặt vé.
  - `Tỷ lệ Tổng = Tỷ lệ(Trận 1) * Tỷ lệ(Trận 2) * Tỷ lệ(Trận 3)`.
  - *Ví dụ:* 1.50 * 2.10 * 3.00 = 9.45.
  - Cần áp dụng mức "Max Payout" (Tiền đền tối đa) để tránh trường hợp Tỷ lệ tổng x10,000 lần gây vỡ nợ nhà cái.

## 4. Trải nghiệm UI/UX (Dành cho Frontend)
- Thay thế các nút submit dự đoán cũ bằng hệ thống **Bet Slip (Phiếu Cược)** chuyên nghiệp.
- Danh sách ngựa sẽ có thông số Tỷ lệ cược (Odds) nhảy liên tục (chuyển màu xanh/đỏ khi tỷ lệ tăng/giảm).
- Giao diện đặt cược có sẵn các Chip điểm (10k, 20k, 50k...) và ô nhập tiền. Tự động tính toán "Tiền thưởng dự kiến" (Estimated Payout) ngay khi user gõ số tiền.

---
## Câu hỏi cần User xác nhận (Open Questions)
1. **Chỉ số Kèo Chấp:** Kèo chấp trong H2H (ví dụ chấp bao nhiêu mét/giây) sẽ do Admin tự tay gõ vào, hay muốn hệ thống tự động sinh ra dựa trên lịch sử thi đấu của 2 ngựa?
2. **Kèo Chuỗi Win:** Chuỗi các trận đua phải nằm trong cùng 1 Ngày thi đấu (Race Day), hay người chơi được tự do mix các cuộc đua ở các giải khác nhau?
