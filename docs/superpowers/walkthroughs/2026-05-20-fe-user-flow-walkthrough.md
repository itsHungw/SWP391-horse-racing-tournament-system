# Walkthrough - FE User Flow Phase 2 Implementation

Tài liệu bàn giao, mô tả chi tiết các phần việc đã hoàn thiện và kết quả kiểm thử cho luồng **Member 3 (FE User Flow)** thuộc Phase 2 của dự án SWP391 Horse Racing Tournament.

---

## 1. Các File đã tạo mới / chỉnh sửa

Mọi file được tạo mới đều được tổ chức gọn gàng để tránh xung đột git:

| File Basename | Trạng thái | Nhiệm vụ |
| --- | --- | --- |
| [auth.ts](file:///d:/FBT/5/SWP391/SWP391-horse-racing-tournament-system-1/frontend/src/types/auth.ts) | **[NEW]** | Định nghĩa Types cho Login/Register |
| [profile.ts](file:///d:/FBT/5/SWP391/SWP391-horse-racing-tournament-system-1/frontend/src/types/profile.ts) | **[NEW]** | Định nghĩa Types cho Profile thông tin cá nhân |
| [roleRequest.ts](file:///d:/FBT/5/SWP391/SWP391-horse-racing-tournament-system-1/frontend/src/types/roleRequest.ts) | **[NEW]** | Định nghĩa Types cho yêu cầu vai trò của Spectator |
| [validation.ts](file:///d:/FBT/5/SWP391/SWP391-horse-racing-tournament-system-1/frontend/src/utils/validation.ts) | **[NEW]** | Chứa bộ kiểm tra định dạng email, sđt Việt Nam (có clean), mật khẩu mạnh |
| [validation.test.ts](file:///d:/FBT/5/SWP391/SWP391-horse-racing-tournament-system-1/frontend/src/test/validation.test.ts) | **[NEW]** | Chứa 9 kịch bản kiểm thử Vitest kiểm chứng logic validate |
| [authApi.ts](file:///d:/FBT/5/SWP391/SWP391-horse-racing-tournament-system-1/frontend/src/api/authApi.ts) | **[NEW]** | API Service gọi Đăng nhập, Đăng ký và Verify email |
| [profileApi.ts](file:///d:/FBT/5/SWP391/SWP391-horse-racing-tournament-system-1/frontend/src/api/profileApi.ts) | **[NEW]** | API Service cho Profile (tải ảnh đại diện 2 bước, mock-ready) |
| [roleRequestApi.ts](file:///d:/FBT/5/SWP391/SWP391-horse-racing-tournament-system-1/frontend/src/api/roleRequestApi.ts) | **[NEW]** | API Service gửi yêu cầu vai trò và xem lịch sử (mock-ready) |
| [SkeletonLoader.tsx](file:///d:/FBT/5/SWP391/SWP391-horse-racing-tournament-system-1/frontend/src/components/common/SkeletonLoader.tsx) | **[NEW]** | Component Skeleton dạng pulse của Tailwind CSS v4 giúp UI không bị giật nháy |
| [StatusBadge.tsx](file:///d:/FBT/5/SWP391/SWP391-horse-racing-tournament-system-1/frontend/src/components/StatusBadge.tsx) | **[MODIFY]** | Mở rộng StatusBadge hỗ trợ tone màu đỏ (`critical`) và xanh (`success`) |
| [LoginPage.tsx](file:///d:/FBT/5/SWP391/SWP391-horse-racing-tournament-system-1/frontend/src/pages/auth/LoginPage.tsx) | **[NEW]** | Màn hình Đăng nhập tích hợp validate đầy đủ |
| [RegisterPage.tsx](file:///d:/FBT/5/SWP391/SWP391-horse-racing-tournament-system-1/frontend/src/pages/auth/RegisterPage.tsx) | **[NEW]** | Màn hình Đăng ký tích hợp kiểm tra email, sđt Việt Nam và mật khẩu |
| [VerifyEmailPage.tsx](file:///d:/FBT/5/SWP391/SWP391-horse-racing-tournament-system-1/frontend/src/pages/auth/VerifyEmailPage.tsx) | **[NEW]** | Màn hình hướng dẫn xác thực email của lựa chọn A |
| [ProfilePage.tsx](file:///d:/FBT/5/SWP391/SWP391-horse-racing-tournament-system-1/frontend/src/pages/user/ProfilePage.tsx) | **[NEW]** | Giao diện Hồ sơ cá nhân có chọn mã vùng sđt, xem ảnh trước tức thì và lazy upload |
| [MyRoleRequestsPage.tsx](file:///d:/FBT/5/SWP391/SWP391-horse-racing-tournament-system-1/frontend/src/pages/user/MyRoleRequestsPage.tsx) | **[NEW]** | Màn hình xin vai trò có Empty State khóa form định hướng sang profile, tự động disable option | [AppRouter.tsx](file:///d:/FBT/5/SWP391/SWP391-horse-racing-tournament-system-1/frontend/src/routes/AppRouter.tsx) | **[MODIFY]** | Đăng ký các Route mới của Authentication và Profile để truy cập trực tiếp |

---

## 2. Kết quả Kiểm thử & Biên dịch (Vitest & Vite Build)

1. **Vitest Unit Test**:
   * Tổng số: **9 tests passed** hoàn toàn.
   * Chạy lệnh: `npm run test -- --run`
   * Kết quả: Vượt qua tất cả các bài test kiểm tra làm sạch sđt Việt Nam, email và kiểm thử mật khẩu.

2. **Vite Production Build**:
   * Chạy lệnh: `npm.cmd run build` (hoặc `npm run build`)
   * Kết quả: Biên dịch thành công dự án ra thư mục `dist` mà **không phát sinh bất kỳ lỗi TypeScript hay cảnh báo compile nào**.

---

## 3. Cấu hình Route hoàn tất (AppRouter.tsx)

Chúng tôi đã cấu hình trực tiếp các Route vào [AppRouter.tsx](file:///d:/FBT/5/SWP391/SWP391-horse-racing-tournament-system-1/frontend/src/routes/AppRouter.tsx), bạn có thể truy cập trực tiếp trên localhost:
* Đăng nhập: `/login`
* Đăng ký: `/register`
* Xác thực Email: `/verify-email`
* Hồ sơ cá nhân: `/profile`
* Gửi yêu cầu vai trò: `/my-role-requests`
