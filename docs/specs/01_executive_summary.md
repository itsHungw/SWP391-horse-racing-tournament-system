# Horse Racing Tournament Management System - Specification

## 1. Executive Summary

**Project:** SU26SWP03 - Hệ thống quản lý giải đua ngựa  
**Stack:** Java Spring Boot + Spring Security + JPA + Thymeleaf/REST API  
**Database:** SQL Server / PostgreSQL / MySQL  

### Mục tiêu
Số hóa toàn bộ quy trình tổ chức giải đua ngựa: từ đăng ký tài khoản, quản lý ngựa, tổ chức giải đấu, đến công bố kết quả và xếp hạng. Hệ thống hỗ trợ **6 vai trò** (Guest, Spectator, Horse Owner, Jockey, Referee, Admin) với luồng phê duyệt đa cấp.

### Quyết định thiết kế quan trọng
| # | Quyết định | Chi tiết |
|---|-----------|----------|
| 1 | Default Role = SPECTATOR | User mới không được chọn role, luôn là Spectator |
| 2 | Multi-Role | 1 user có thể có nhiều role (VD: Spectator + Owner + Jockey) |
| 3 | Point System & Blogs | Không có tiền tệ thật (không nạp/rút). User đọc blogs để kiếm điểm (points) và dùng điểm để dự đoán cá cược (predictions). |
| 4 | Referee via Request | User request làm Referee -> Admin duyệt |
| 5 | Profile per Role | Mỗi role có bảng profile riêng, không nhét vào users |

---

## 2. User Stories

### 2.1. Guest (Chưa đăng nhập)
| ID | Story |
|----|-------|
| US-G01 | Là Guest, tôi muốn xem danh sách tournament public |
| US-G02 | Là Guest, tôi muốn xem lịch race public |
| US-G03 | Là Guest, tôi muốn xem kết quả race |
| US-G04 | Là Guest, tôi muốn xem bảng xếp hạng |
| US-G05 | Là Guest, tôi muốn đăng ký tài khoản |
| US-G06 | Là Guest, tôi muốn đăng nhập |

### 2.2. Spectator (Role mặc định)
| ID | Story |
|----|-------|
| US-S01 | Là Spectator, tôi muốn xem profile ngựa/jockey |
| US-S02 | Là Spectator, tôi muốn dự đoán kết quả race |
| US-S03 | Là Spectator, tôi muốn xem lịch sử prediction và điểm |
| US-S04 | Là Spectator, tôi muốn gửi role request |
| US-S05 | Là Spectator, tôi muốn nhận thông báo |
| US-S06 | Là Spectator, tôi muốn cập nhật profile |
| US-S07 | Là Spectator, tôi muốn đọc blog để kiếm điểm thưởng |

### 2.3. Horse Owner
| ID | Story |
|----|-------|
| US-O01 | Là Owner, tôi muốn tạo hồ sơ ngựa |
| US-O02 | Là Owner, tôi muốn gửi ngựa cho Admin duyệt |
| US-O03 | Là Owner, tôi muốn đăng ký ngựa vào tournament |
| US-O04 | Là Owner, tôi muốn mời Jockey điều khiển ngựa |
| US-O05 | Là Owner, tôi muốn xem trạng thái invitation |
| US-O06 | Là Owner, tôi muốn xác nhận ngựa tham gia race |
| US-O07 | Là Owner, tôi muốn xem kết quả của ngựa |
| US-O08 | Là Owner, tôi muốn rút đăng ký tournament |

### 2.4. Jockey
| ID | Story |
|----|-------|
| US-J01 | Là Jockey, tôi muốn quản lý jockey profile |
| US-J02 | Là Jockey, tôi muốn phản hồi invitation từ Owner |
| US-J03 | Là Jockey, tôi muốn xem lịch thi đấu cá nhân |
| US-J04 | Là Jockey, tôi muốn xem kết quả và thành tích |

### 2.5. Referee
| ID | Story |
|----|-------|
| US-R01 | Là Referee, tôi muốn xem race được phân công |
| US-R02 | Là Referee, tôi muốn pre-race check participant |
| US-R03 | Là Referee, tôi muốn ghi nhận vi phạm |
| US-R04 | Là Referee, tôi muốn lập biên bản report |
| US-R05 | Là Referee, tôi muốn nhập kết quả race |

### 2.6. Admin
| ID | Story |
|----|-------|
| US-A01 | Là Admin, tôi muốn quản lý user |
| US-A02 | Là Admin, tôi muốn duyệt role request |
| US-A03 | Là Admin, tôi muốn duyệt hồ sơ ngựa |
| US-A04 | Là Admin, tôi muốn quản lý tournament lifecycle |
| US-A05 | Là Admin, tôi muốn tạo race |
| US-A06 | Là Admin, tôi muốn phân công referee |
| US-A07 | Là Admin, tôi muốn duyệt đăng ký tournament |
| US-A08 | Là Admin, tôi muốn xác nhận/publish kết quả |
| US-A09 | Là Admin, tôi muốn quản lý ranking |
| US-A10 | Là Admin, tôi muốn quản lý AI prediction |
| US-A11 | Là Admin, tôi muốn quản lý bài viết (Blogs) và cấu hình điểm thưởng |
