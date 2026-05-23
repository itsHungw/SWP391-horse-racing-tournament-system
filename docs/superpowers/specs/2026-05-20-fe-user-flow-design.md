# Thiết kế FE User Flow (Login, Register, Profile, Role Requests)

Tài liệu đặc tả kiến trúc, luồng xử lý và thiết kế giao diện chi tiết cho luồng công việc của **Member 3 (FE User Flow)** trong Phase 2 của hệ thống SWP391 Horse Racing Tournament.

---

## 1. Tổng quan & Mục tiêu

Tài liệu này định nghĩa cấu trúc mã nguồn, giải pháp xử lý form validation, tải ảnh đại diện tối ưu UX và ngăn chặn trùng lặp vai trò ở phía Client. Thiết kế tuân thủ nghiêm ngặt nguyên tắc **"Không xung đột (No-conflict)"** để Member 3 có thể triển khai song song với 4 thành viên khác trong nhóm mà không gây ghi đè mã nguồn.

---

## 2. Thư mục và Các file tạo mới

Để tránh tối đa các xung đột git, tất cả mã nguồn do Member 3 phát triển sẽ nằm gọn trong các thư mục riêng lẻ dưới đây. Member 3 **không trực tiếp sửa đổi** các file dùng chung như `AppRouter.tsx` hay `httpClient.ts`.

```text
frontend/src/
 ├── types/
 │    ├── auth.ts                     # Định nghĩa kiểu dữ liệu đăng nhập/đăng ký
 │    ├── profile.ts                  # Kiểu dữ liệu hồ sơ cá nhân
 │    └── roleRequest.ts              # Kiểu dữ liệu yêu cầu vai trò
 ├── utils/
 │    └── validation.ts               # Các hàm kiểm tra dữ liệu đầu vào (Regex, clean phone)
 ├── api/
 │    ├── authApi.ts                  # Gọi API Đăng nhập, Đăng ký, Gửi lại Email, Verify
 │    ├── profileApi.ts               # Gọi API lấy/cập nhật hồ sơ, tải ảnh đại diện
 │    └── roleRequestApi.ts           # Gọi API gửi yêu cầu và xem lịch sử vai trò
 ├── pages/
 │    ├── auth/
 │    │    ├── LoginPage.tsx          # Trang đăng nhập
 │    │    ├── RegisterPage.tsx       # Trang đăng ký
 │    │    └── VerifyEmailPage.tsx    # Trang hướng dẫn xác thực email + Resend
 │    └── user/
 │         ├── ProfilePage.tsx        # Trang hồ sơ cá nhân và đổi avatar
 │         └── MyRoleRequestsPage.tsx # Trang xin vai trò & lịch sử yêu cầu
 └── components/
      └── common/
           └── SkeletonLoader.tsx     # Component hiển thị khung chờ tải trang
```

---

## 3. Đặc tả Kỹ thuật & UX Biểu mẫu (Form Validation)

### 3.1. Ràng buộc Validation phía Client
Các biểu mẫu đăng ký, đăng nhập và hồ sơ cá nhân được kiểm tra nghiêm ngặt trước khi gửi lên Backend:
* **Họ và Tên**: Không bỏ trống, tối đa 150 ký tự.
* **Email**: Khớp định dạng RFC 5322.
* **Mật khẩu**: Tối thiểu 8 ký tự, phải chứa ít nhất 1 chữ cái và 1 chữ số.
* **Số điện thoại (Trải nghiệm cao cấp)**:
  * Cho phép người dùng chọn **mã quốc gia** qua dropdown (mặc định là 🇻🇳 `+84`, hỗ trợ thêm `+1`, `+81`...).
  * Hàm **Sanitizer** tự động loại bỏ khoảng trắng, dấu chấm, dấu ngoặc đơn, gạch ngang và chuyển đổi đầu số `+84` hoặc `84` thành `0` ở đầu.
  * Biểu thức chính quy (Regex) kiểm tra số điện thoại Việt Nam sau khi làm sạch:
    ```typescript
    const vnPhoneRegex = /^0(3|5|7|8|9)\d{8}$/;
    ```
* **Lý do xin đổi vai trò**: Không bỏ trống, độ dài từ 20 đến 500 ký tự.

### 3.2. Luồng Tải ảnh đại diện (Avatar Upload) thông minh
* **Ảnh mặc định**: Khi đăng ký mới, hệ thống tự động gán avatar SVG mặc định.
* **Instant Preview (0ms)**: Khi chọn file cục bộ, Client dùng `URL.createObjectURL(file)` để tạo Blob URL hiển thị ảnh tức thì lên giao diện tròn.
* **Lazy Upload (Ngừa rác Server)**:
  * File ảnh gốc được lưu trữ trong state `pendingAvatarFile` tại component.
  * Chỉ tiến hành gửi file qua `multipart/form-data` lên `POST /api/files/upload?category=AVATAR` khi người dùng nhấn nút **"Lưu thay đổi"**.
  * Sau khi có URL thật từ server, Client tiến hành gọi API tiếp theo để lưu thông tin hồ sơ `PUT /api/users/me/profile`.
  * Hiển thị loading spinner đè mờ lên avatar trong lúc upload.

---

## 4. Quản lý Trạng thái & Chống nháy (Flicker) Giao diện

### 4.1. Chặn truy cập khi chưa hoàn tất Hồ sơ (Empty State)
Tại trang `MyRoleRequestsPage.tsx`, nếu kiểm tra thấy hồ sơ cá nhân của người dùng chưa được hoàn thiện (`profileCompleted === false`), hệ thống sẽ **chặn toàn bộ form đăng ký** và hiển thị:
* Một khung trống (Empty State Card) thiết kế tinh tế với biểu tượng khóa cách điệu.
* Dòng chữ thông báo: *"Yêu cầu hoàn tất Hồ sơ cá nhân trước khi đăng ký vai trò"*.
* Nút hành động nổi bật: **"Đi đến trang Hồ sơ ngay"** để chuyển hướng người dùng sang `ProfilePage`.

### 4.2. Chống nháy giao diện (Flicker-free UI)
Trong lúc dữ liệu đang được tải về qua `Promise.all` từ API (bao gồm thông tin Profile và danh sách lịch sử yêu cầu), trang sẽ hiển thị **SkeletonLoader** (dùng hiệu ứng `animate-pulse` của Tailwind CSS v4). Chỉ hiển thị form và bảng dữ liệu khi mọi thông tin đã sẵn sàng 100%, ngăn ngừa hiện tượng giật/lắc UI khi trạng thái disabled được áp dụng.

### 4.3. Logic ngăn chặn đăng ký trùng lặp vai trò
Trong dropdown chọn vai trò (`HORSE_OWNER`, `JOCKEY`, `REFEREE`), một option sẽ bị vô hiệu hóa (`disabled`) nếu:
1. Người dùng đã sở hữu vai trò đó rồi (kiểm tra `user.roles.includes(role)`). Hiển thị kèm text: `(Đã sở hữu)`.
2. Yêu cầu đăng ký vai trò đó đang ở trạng thái **PENDING** trong danh sách lịch sử (kiểm tra `requests.some(r => r.requestedRole === role && r.status === 'PENDING')`). Hiển thị kèm text: `(Đang chờ duyệt)`.

---

## 5. Kế hoạch Tích hợp & Bàn giao (Hand-off)

Sau khi Member 3 code xong toàn bộ các trang trên nhánh `feat/frontend-user-flow-ui`, tiến hành các bước bàn giao cho Member 5 như sau:

1. **Khởi chạy kiểm tra cục bộ**:
   ```bash
   npm run build
   ```
   Đảm bảo toàn bộ code không phát sinh lỗi biên dịch TypeScript hoặc Vite build.
2. **Gửi danh sách Route cho Member 5**:
   Member 3 gửi tin nhắn bàn giao cấu trúc route để Member 5 tích hợp vào `AppRouter.tsx`:
   * `/login` -> `<LoginPage />`
   * `/register` -> `<RegisterPage />`
   * `/verify-email` -> `<VerifyEmailPage />`
   * `/profile` -> `<ProfilePage />`
   * `/role-requests` -> `<MyRoleRequestsPage />`
