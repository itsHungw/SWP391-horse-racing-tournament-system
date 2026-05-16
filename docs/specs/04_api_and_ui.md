# API Contract & UI Components

## 1. API Contract (RESTful)

### 1.1. Auth APIs
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Đăng ký tài khoản |
| POST | `/api/auth/login` | No | Đăng nhập |
| POST | `/api/auth/logout` | Yes | Đăng xuất |
| POST | `/api/auth/change-password` | Yes | Đổi mật khẩu |

### 1.2. Role Request APIs
| Method | Endpoint | Auth | Role |
|--------|----------|------|------|
| GET | `/api/role-requests/my` | Yes | Any |
| POST | `/api/role-requests/horse-owner` | Yes | Any |
| POST | `/api/role-requests/jockey` | Yes | Any |
| POST | `/api/role-requests/referee` | Yes | Any |
| GET | `/api/admin/role-requests` | Yes | ADMIN |
| POST | `/api/admin/role-requests/{id}/approve` | Yes | ADMIN |
| POST | `/api/admin/role-requests/{id}/reject` | Yes | ADMIN |

### 1.3. User APIs
| Method | Endpoint | Auth | Role |
|--------|----------|------|------|
| GET | `/api/users/me` | Yes | Any |
| PUT | `/api/users/me` | Yes | Any |
| GET | `/api/admin/users` | Yes | ADMIN |
| GET | `/api/admin/users/{id}` | Yes | ADMIN |
| POST | `/api/admin/users/{id}/lock` | Yes | ADMIN |
| POST | `/api/admin/users/{id}/unlock` | Yes | ADMIN |

### 1.4. Horse APIs
| Method | Endpoint | Auth | Role |
|--------|----------|------|------|
| GET | `/api/horses/public` | No | - |
| GET | `/api/horses/public/{id}` | No | - |
| GET | `/api/owner/horses` | Yes | HORSE_OWNER |
| POST | `/api/owner/horses` | Yes | HORSE_OWNER |
| PUT | `/api/owner/horses/{id}` | Yes | HORSE_OWNER |
| DELETE | `/api/owner/horses/{id}` | Yes | HORSE_OWNER |
| POST | `/api/admin/horses/{id}/approve` | Yes | ADMIN |
| POST | `/api/admin/horses/{id}/reject` | Yes | ADMIN |

### 1.5. Tournament APIs
| Method | Endpoint | Auth | Role |
|--------|----------|------|------|
| GET | `/api/tournaments` | No | - |
| GET | `/api/tournaments/{id}` | No | - |
| POST | `/api/admin/tournaments` | Yes | ADMIN |
| PUT | `/api/admin/tournaments/{id}` | Yes | ADMIN |
| POST | `/api/admin/tournaments/{id}/open-registration` | Yes | ADMIN |
| POST | `/api/admin/tournaments/{id}/close-registration` | Yes | ADMIN |
| POST | `/api/admin/tournaments/{id}/start` | Yes | ADMIN |
| POST | `/api/admin/tournaments/{id}/complete` | Yes | ADMIN |
| POST | `/api/admin/tournaments/{id}/cancel` | Yes | ADMIN |

### 1.6. Registration APIs
| Method | Endpoint | Auth | Role |
|--------|----------|------|------|
| POST | `/api/owner/tournament-registrations` | Yes | HORSE_OWNER |
| POST | `/api/owner/tournament-registrations/{id}/withdraw` | Yes | HORSE_OWNER |
| POST | `/api/admin/tournament-registrations/{id}/approve` | Yes | ADMIN |
| POST | `/api/admin/tournament-registrations/{id}/reject` | Yes | ADMIN |

### 1.7. Race APIs
| Method | Endpoint | Auth | Role |
|--------|----------|------|------|
| GET | `/api/races` | No | - |
| GET | `/api/races/{id}` | No | - |
| POST | `/api/admin/races` | Yes | ADMIN |
| PUT | `/api/admin/races/{id}` | Yes | ADMIN |
| POST | `/api/admin/races/{id}/assign-referee` | Yes | ADMIN |
| POST | `/api/admin/races/{id}/participants` | Yes | ADMIN |

### 1.8. Jockey Invitation APIs
| Method | Endpoint | Auth | Role |
|--------|----------|------|------|
| POST | `/api/owner/jockey-invitations` | Yes | HORSE_OWNER |
| POST | `/api/owner/jockey-invitations/{id}/cancel` | Yes | HORSE_OWNER |
| GET | `/api/jockey/invitations` | Yes | JOCKEY |
| POST | `/api/jockey/invitations/{id}/accept` | Yes | JOCKEY |
| POST | `/api/jockey/invitations/{id}/reject` | Yes | JOCKEY |

### 1.9. Referee APIs
| Method | Endpoint | Auth | Role |
|--------|----------|------|------|
| GET | `/api/referee/races` | Yes | REFEREE |
| POST | `/api/referee/races/{id}/start-checking` | Yes | REFEREE |
| POST | `/api/referee/pre-race-checks` | Yes | REFEREE |
| POST | `/api/referee/violations` | Yes | REFEREE |
| POST | `/api/referee/reports` | Yes | REFEREE |
| POST | `/api/referee/race-results/submit` | Yes | REFEREE |

### 1.10. Result & Ranking APIs
| Method | Endpoint | Auth | Role |
|--------|----------|------|------|
| GET | `/api/races/{id}/results` | No | - |
| POST | `/api/admin/race-results/{raceId}/confirm` | Yes | ADMIN |
| POST | `/api/admin/race-results/{raceId}/publish` | Yes | ADMIN |
| GET | `/api/tournaments/{id}/rankings/horses` | No | - |

### 1.11. Prediction APIs
| Method | Endpoint | Auth | Role |
|--------|----------|------|------|
| POST | `/api/predictions` | Yes | SPECTATOR |
| PUT | `/api/predictions/{id}` | Yes | SPECTATOR |
| GET | `/api/predictions/my` | Yes | SPECTATOR |

### 1.12. Notification APIs
| Method | Endpoint | Auth | Role |
|--------|----------|------|------|
| GET | `/api/notifications` | Yes | Any |
| POST | `/api/notifications/{id}/read` | Yes | Any |
| POST | `/api/notifications/read-all` | Yes | Any |

### 1.13. Blog & Wallet APIs
| Method | Endpoint | Auth | Role |
|--------|----------|------|------|
| GET | `/api/blogs` | No | - |
| GET | `/api/blogs/{slug}` | No | - |
| POST | `/api/blogs/{id}/read` | Yes | Any |
| GET | `/api/wallets/me` | Yes | Any |
| POST | `/api/admin/blogs` | Yes | ADMIN |
| PUT | `/api/admin/blogs/{id}` | Yes | ADMIN |

---

## 2. UI Components & Pages

### 2.1. Public Pages
| Page | Path | Components |
|------|------|-----------|
| Home | `/` | Hero banner, Featured tournaments, Upcoming races |
| Tournament List | `/tournaments` | Filter, Search, Tournament cards |
| Tournament Detail | `/tournaments/{id}` | Info panel, Race list, Rankings tab |
| Race Detail | `/races/{id}` | Participants list, Results, Predictions |
| Horse Profile | `/horses/{id}` | Horse info, Race history, Stats |
| Rankings | `/rankings/tournaments/{id}` | Horse rankings table, Jockey rankings |
| Blog List | `/blogs` | Danh sách bài viết, kiếm điểm |
| Blog Detail | `/blogs/{slug}` | Nội dung blog, nút nhận điểm |

### 2.2. Auth Pages
| Page | Path |
|------|------|
| Login | `/login` |
| Register | `/register` |

### 2.3. Spectator Pages
| Page | Path | Components |
|------|------|-----------|
| Profile | `/profile` | User info form, Avatar upload |
| Predictions | `/predictions` | Prediction history, Points summary |
| New Prediction | `/predictions/new?raceId=` | Participant selector, Type selector |
| Notifications | `/notifications` | Notification list, Mark read |
| Role Requests | `/role-requests` | Request list, Status badges |
| Apply Owner | `/role-requests/horse-owner` | Application form |
| Apply Jockey | `/role-requests/jockey` | Application form |
| Apply Referee | `/role-requests/referee` | Application form |

### 2.4. Horse Owner Pages
| Page | Path |
|------|------|
| Owner Dashboard | `/owner/dashboard` |
| My Horses | `/owner/horses` |
| Create Horse | `/owner/horses/create` |
| Edit Horse | `/owner/horses/{id}/edit` |
| My Registrations | `/owner/tournament-registrations` |
| My Invitations | `/owner/jockey-invitations` |

### 2.5. Jockey Pages
| Page | Path |
|------|------|
| Jockey Dashboard | `/jockey/dashboard` |
| My Invitations | `/jockey/invitations` |
| My Races | `/jockey/races` |
| My Results | `/jockey/results` |

### 2.6. Referee Pages
| Page | Path |
|------|------|
| Referee Dashboard | `/referee/dashboard` |
| Assigned Races | `/referee/races` |
| Race Check | `/referee/races/{id}/check` |
| Violations | `/referee/races/{id}/violations` |
| Report | `/referee/races/{id}/report` |
| Submit Result | `/referee/races/{id}/submit-result` |

### 2.7. Admin Pages
| Page | Path |
|------|------|
| Admin Dashboard | `/admin/dashboard` |
| User Management | `/admin/users` |
| Role Requests | `/admin/role-requests` |
| Horse Management | `/admin/horses` |
| Tournament Management | `/admin/tournaments` |
| Race Management | `/admin/races` |
| Registration Approval | `/admin/tournament-registrations` |
| Result Management | `/admin/race-results` |
| Rankings Management | `/admin/rankings` |
| Predictions Overview | `/admin/predictions` |
| Blog Management | `/admin/blogs` |

### 2.8. Shared UI Components
| Component | Usage |
|-----------|-------|
| Navbar | Role-based navigation menu |
| Sidebar | Admin/Owner/Jockey/Referee dashboards |
| StatusBadge | Color-coded status labels |
| DataTable | Sortable, paginated tables |
| Modal | Confirmation dialogs |
| Toast | Success/error notifications |
| FormValidator | Client-side validation |
| Pagination | List pagination |
| SearchBar | Filter & search |
| FileUpload | Avatar, horse image, evidence |
