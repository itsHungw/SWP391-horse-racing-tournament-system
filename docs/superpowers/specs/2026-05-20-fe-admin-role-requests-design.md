# Tài liệu thiết kế: Giao diện Admin xử lý yêu cầu nâng cấp vai trò (Admin Role Requests Flow)

Tài liệu này đặc tả chi tiết về cấu trúc luồng xử lý và thiết kế giao diện cho Admin duyệt hoặc từ chối các yêu cầu nâng cấp vai trò của người dùng trong hệ thống Giải đua ngựa (Horse Racing Tournament System).

---

## 1. Mục tiêu (Goals)

- Xây dựng giao diện cho Admin quản lý danh sách yêu cầu thay đổi quyền (JOCKEY, OWNER, REFEREE).
- Cho phép xem chi tiết từng yêu cầu gồm thông tin người dùng, lý do đề xuất và tài liệu chứng minh đi kèm.
- Cho phép phê duyệt (Approve) hoặc từ chối kèm lý do rõ ràng (Reject with Reason).
- **Ràng buộc quan trọng:** Không thay đổi cấu trúc định tuyến tổng của hệ thống (`AppRouter.tsx`), không chạm vào trang phía User/Auth và tệp cấu hình API dùng chung (`httpClient.ts`).

---

## 2. Kịch bản Trải nghiệm Người dùng (UX Flows)

Hệ thống điều hướng nội bộ bằng State để chuyển đổi linh hoạt qua 3 màn hình:

```
[Màn hình Danh sách (List View)] 
      |
      +---> (Bấm Xem) ---> [Màn hình Chi tiết (Detail View)]
                                |
                                +---> (Bấm Từ chối) ---> [Hộp thoại Lý do (Reject Modal)]
```

### Bước A: Xem danh sách các yêu cầu
- Admin truy cập trang `/admin` (được render bên trong `RoleDashboardPage` khi vai trò là `Admin`).
- Giao diện mặc định là bảng hiển thị danh sách các đơn yêu cầu.
- Có bộ lọc nhanh theo trạng thái: **TẤT CẢ**, **CHỜ DUYỆT (PENDING)**, **ĐÃ DUYỆT (APPROVED)**, **ĐÃ TỪ CHỐI (REJECTED)**.
- Mỗi đơn hiển thị các cột: Người gửi, Vai trò đăng ký, Trạng thái (được gắn Badge màu trực quan), Ngày gửi và nút "Xem chi tiết".

### Bước B: Thẩm định chi tiết hồ sơ
- Khi bấm **[ Xem ]**, hệ thống chuyển sang giao diện chi tiết mà không đổi URL trình duyệt.
- Admin thấy toàn bộ thông tin tài khoản của người gửi, lý do họ tự giới thiệu và link chứa chứng chỉ/bằng chứng đính kèm (`evidenceUrl`).
- Admin có nút quay lại danh sách hoặc tiến hành xử lý bằng 2 nút bấm nổi bật: **Từ Chối** (Đỏ) và **Phê Duyệt** (Xanh lá).

### Bước C: Từ chối hồ sơ kèm lý do
- Khi chọn **[ Từ chối ]**, một Modal nhỏ hiện ra đè lên giữa màn hình yêu cầu nhập "Lý do từ chối".
- Hệ thống bắt buộc lý do không được để trống. Khi hoàn tất, đơn chuyển sang trạng thái đỏ `REJECTED`, hiển thị Toast thông báo thành công và chuyển Admin trở lại màn hình danh sách đã được tự động cập nhật.

---

## 3. Cấu Trúc Khung File (Skeleton Directory Structure)

Các file sẽ được phân chia rõ ràng theo nhiệm vụ cụ thể:

```
frontend/src/
  ├── types/
  │    └── adminRoleRequest.ts           # Định nghĩa interfaces kiểu dữ liệu
  ├── api/
  │    └── adminRoleRequestApi.ts        # Các hàm gọi API thông qua httpClient
  ├── components/
  │    ├── RoleRequestStatusBadge.tsx    # Badge màu trạng thái (Vàng, Xanh, Đỏ, Xám)
  │    └── RejectModal.tsx               # Hộp thoại nhập lý do từ chối
  └── pages/
       └── admin/
            ├── AdminRoleRequestsPage.tsx     # Bảng danh sách & Bộ lọc
            └── AdminRoleRequestDetailPage.tsx # Trang xem chi tiết & Nút xử lý
```

---

## 4. Đặc Tả Dữ Liệu & API Contract

### Kiểu Dữ Liệu (TypeScript Interface)
```typescript
export interface RoleRequest {
  id: number;
  userId: number;
  fullName: string;
  email: string;
  requestedRole: 'JOCKEY' | 'OWNER' | 'REFEREE';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  reason: string;
  evidenceUrl?: string;
  adminNote?: string;
  createdAt: string;
}
```

### Các API Endpoints tích hợp
1. **Lấy danh sách yêu cầu:**
   - **Mô tả:** `GET /api/admin/role-requests?status={status}`
   - **Phản hồi:** Trả về danh sách mảng các `RoleRequest`.
2. **Phê duyệt đơn:**
   - **Mô tả:** `POST /api/admin/role-requests/{id}/approve`
   - **Phản hồi:** Thành công (HTTP 200).
3. **Từ chối đơn:**
   - **Mô tả:** `POST /api/admin/role-requests/{id}/reject`
   - **Dữ liệu gửi lên (Body):** `{ "reason": "Lý do cụ thể..." }`
   - **Phản hồi:** Thành công (HTTP 200).

---

## 5. Kế hoạch Kiểm thử & Xác thực (Verification Plan)

- **Bước 1 (Mock):** Chạy thử nghiệm toàn bộ luồng giao diện dùng Dữ liệu Giả (Mock data) để kiểm tra độ phản hồi của các nút bấm và trạng thái chuyển đổi.
- **Bước 2 (Validation):** Kiểm tra tính hợp lệ của ô nhập lý do từ chối (không được bỏ trống hoặc chỉ nhập dấu cách).
- **Bước 3 (API Connection):** Kết nối với API thật, xác thực trạng thái danh sách tự động tải lại (refresh) sau mỗi thao tác Phê duyệt/Từ chối thành công.
- **Bước 4 (Toast):** Kiểm thử thông báo nổi xuất hiện và biến mất mượt mà sau 3 giây.
