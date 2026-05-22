# Thiết kế Giao diện Trang chủ NYRA Aqueduct Racetrack (Clone 100%)

Tài liệu thiết kế chi tiết (spec) cho việc phát triển giao diện Clone 100% trang chủ trường đua Aqueduct thuộc New York Racing Association (NYRA) cho dự án Quản lý giải đua ngựa (SWP391).

---

## 1. Tổng quan & Mục tiêu

* **Mục tiêu:** Tái tạo chính xác 100% giao diện (UI) và trải nghiệm người dùng (UX) của trang chủ NYRA Aqueduct (`https://www.nyra.com/aqueduct/`). Giao diện sẽ ở trạng thái dữ liệu tĩnh hoàn chỉnh (Static Prototype) với độ phân giải và chất lượng hình ảnh tốt nhất.
* **Môi trường triển khai:** React + TypeScript + Vite + Tailwind CSS v4.
* **File đích cần chỉnh sửa:** `frontend/src/pages/public/HomePage.tsx`.
* **Tập tin định nghĩa kiểu dáng:** `frontend/src/styles.css`.

---

## 2. Thiết kế Màu sắc & Font chữ

Các token màu sắc và font chữ được tích hợp từ file `styles.css` của dự án:
* **Màu sắc chủ đạo (Primary Green):** `--color-nyraGreen` (`#004d3d`) và `--color-nyraLightGreen` (`#006d5b`).
* **Màu nền tối (Charcoal/Dark):** `--color-nyraDark` (`#1a1a1a`).
* **Màu vàng điểm nhấn (Accent Gold):** `--color-nyraGold` (`#d4af37`).
* **Màu xanh Neon nổi bật (Neon Green):** `#a3e635` (lime-400) cho nút "BET NOW".
* **Font chữ:** Roboto (Sans-serif) dành cho giao diện chính và Playfair Display (Serif) nếu có tiêu đề trang trí.

---

## 3. Kiến trúc các Phần của Trang chủ

### 3.1. Top Header
* **Bố cục:** Thanh ngang chiều cao cố định, nền đen, chứa thanh điều hướng thương hiệu phụ.
* **Thành phần phía trái:** Logo "BELMONT at the BIG A" dựng bằng SVG màu trắng.
* **Các Tab điều hướng:**
  * Aqueduct: Nền màu xanh `--color-nyraLightGreen` (`#006d5b`), chữ trắng, bo góc nhẹ.
  * Belmont Park: Chữ trắng mờ, hover hiện sáng.
  * Saratoga: Chữ trắng mờ, hover hiện sáng.
  * Belmont Stakes: Chữ trắng mờ, hover hiện sáng.
* **Thành phần phía phải:**
  * Logo NYRA Bets (vẽ bằng SVG).
  * Chữ "BET NOW" màu xanh neon lime-400 đậm, in hoa.
  * Liên kết "Log In" chữ trắng.

### 3.2. Primary Navigation Bar
* **Bố cục:** Nền xanh lá `--color-nyraGreen` (`#004d3d`), dính ở trên cùng khi cuộn trang (`sticky top-0 z-50`).
* **Thành phần phía trái:** Dòng trạng thái "Racing returns May 22".
* **Thành phần chính giữa:** Menu in hoa: RACING, WAGERING, EXPERT PICKS, NEWS, VISIT, OFFICIAL STORE. Có hiệu ứng hover gạch chân trắng mỏng.
* **Thành phần phía phải:** Nhóm icon mạng xã hội: Instagram, X (Twitter), Facebook, TikTok, YouTube.

### 3.3. Hero Section (Banner chính)
* **Bố cục:** Chiều cao 600px, hiển thị ảnh nền jockeys đua ngựa chất lượng cao.
* **URL Ảnh nền:** `https://www.nyra.com/assets/images/header-aqu-bg.jpg` hoặc ảnh tương đương từ NYRA Bets.
* **Lớp phủ (Overlay):** Gradient mượt từ đen mờ (trái) sang trong suốt (phải) đảm bảo độ tương phản cho tiêu đề.
* **Nội dung phía trái:**
  * Tiêu đề chính `<h1>`: "Aqueduct Racetrack" cỡ chữ lớn, in đậm đặc biệt, có đổ bóng chữ.
  * Phụ đề: "Live racing weekly at Aqueduct through June 2026."
  * Nút hành động:
    * "View Calendar": Nền Teal Green, chữ trắng, in hoa, bo góc 2px.
    * "VIEW STAKES →": Chữ trắng, viền dưới trong suốt, hover hiện viền trắng.
* **Khung thông tin Farewell (phía phải):**
  * Hiển thị banner quảng cáo: "IT WAS A GOOD RUN | FAREWELL AQUEDUCT | JUNE 27 & 28".
  * Chi tiết: Giveaways, Souvenirs, Live Entertainment and more.
* **Chân Hero (Thanh 3 cột):**
  * Nền đen mờ 90% (`bg-nyraDark/90`), phân chia thành 3 cột đều nhau bằng vách ngăn mỏng:
    1. LIVE RACING IN NYC / THROUGH JUNE 2026 (Active, có mũi tên tam giác trắng chỉ lên trên).
    2. VISIT AQUEDUCT / FREE ADMISSION
    3. WATCH ON FOX SPORTS / AMERICA'S DAY AT THE RACES

### 3.4. Quick Links Row
* **Bố cục:** Nền xanh lá `--color-nyraGreen`, chứa 6 khối liên kết ngang.
* **Danh sách liên kết:**
  * Entries (Icon SVG lịch đua)
  * Results (Icon SVG cúp/kết quả)
  * Scratches & Changes (Icon SVG chữ X/thay đổi)
  * Stream Live (Icon SVG TV/Live)
  * Expert Picks (Icon SVG bình luận viên)
  * Horsemen (Icon SVG thông tin nài ngựa/chủ ngựa)
* **Hiệu ứng:** Khi hover vào cả khối, icon và text sẽ chuyển động nhẹ lên trên.

### 3.5. Latest News Section
* **Bố cục:** Nền trắng, tiêu đề chính "Latest Aqueduct News" lớn màu xanh lá đậm.
* **Nội dung:** Lưới 3 cột chứa 3 bài viết tin tức:
  * Mỗi bài viết có ảnh thumbnail tin tức thực tế (kèm hiệu ứng zoom nhẹ khi hover).
  * Nhãn danh mục màu xanh lá (ví dụ: *Stakes Advance*, *Notes*, *Headlines*).
  * Tiêu đề bài báo cỡ chữ lớn, in đậm, đổi màu sang xanh lá khi hover.
  * Dòng tác giả và ngày tháng in chữ xám nhẹ nhỏ ở chân thẻ.

### 3.6. Preakness Preview Section
* **Bố cục:** Nền tối màu than, chia đôi:
  * Bên trái: Thông tin giới thiệu "2026 Preakness Preview" và liên kết "GET PREAKNESS BONUS →".
  * Bên phải: Trình phát thu nhỏ (Thumbnail) của video Youtube gốc, có ảnh Mathew DeSantis & Kaylie Shapiro, kèm nút Play đỏ đặc trưng của Youtube ở giữa.

### 3.7. NYRA Bets Promo Section
* **Bố cục:** Thiết kế cực kỳ cao cấp với nền đen sâu.
* **Thành phần chính:**
  * Logo NYRA Bets lớn bên trái.
  * Khẩu hiệu "BET ANY TRACK. ANYWHERE. ANY TIME." chiếm vị trí trung tâm.
  * Ảnh chân dung Jockey đen trắng chất lượng cao đứng ở giữa.
  * Phía phải: Khung "SIGN UP BONUS $25 Free Bet" có ảnh ngựa đua phi nước đại và hai nút hành động: "Expert Picks" (viền trắng) và "Bet Now" (xanh lá neon).

### 3.8. Footer
* **Bố cục:** Nền tối `--color-nyraDark`.
* **Thành phần:**
  * Logo hình khiên NYRA (SVG trắng đỏ xanh) và Logo Fox Sports (SVG oval gốc).
  * Các liên kết điều hướng footer được xếp theo cột dọc.
  * Đoạn văn bản cảnh báo cờ bạc có trách nhiệm (Responsible Gambling) căn lề trái.
  * Các liên kết pháp lý và bản quyền (© 2026 The New York Racing Association, Inc.).

---

## 4. Kế hoạch Kiểm thử & Xác nhận chất lượng

* **Kiểm thử Giao diện (Responsive):**
  * Đảm bảo giao diện hiển thị tốt trên Desktop (1920px), Laptop (1440px/1280px), và Mobile (cuộn dọc mượt mà, ẩn bớt các menu phụ).
* **Kiểm thử Tương tác:**
  * Rà soát toàn bộ các hiệu ứng hover trên menu, liên kết, card tin tức, nút bấm.
  * Đảm bảo các SVG hiển thị sắc nét, không bị méo lệch tỷ lệ.
