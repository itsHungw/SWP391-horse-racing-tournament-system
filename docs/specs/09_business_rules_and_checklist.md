# Business Rules & Build Checklist

---

## 1. Critical Business Rules

### 1.1. User & Role Rules
| ID | Rule | Enforcement |
|----|------|-------------|
| BR-001 | Mọi user mới tự động nhận role SPECTATOR | Service layer (AuthService) |
| BR-002 | Role HORSE_OWNER / JOCKEY / REFEREE phải qua Admin approve | Service + DB constraint |
| BR-003 | 1 user có thể có nhiều role | DB: UNIQUE(user_id, role_id) |
| BR-004 | Không cho request role đã có ACTIVE | Service validation |
| BR-005 | Không cho tạo PENDING request trùng user + role | Service validation |

### 1.2. Horse Rules
| ID | Rule | Enforcement |
|----|------|-------------|
| BR-006 | Owner chỉ quản lý ngựa của mình | Service: check owner_id == currentUser |
| BR-007 | Horse phải APPROVED mới được đăng ký tournament | Service validation |
| BR-008 | Soft delete: không hard delete horse | Service: set deleted_at |

### 1.3. Tournament Rules
| ID | Rule | Enforcement |
|----|------|-------------|
| BR-009 | start_date <= end_date | DB CHECK + Service |
| BR-010 | registration_start_at < registration_end_at | DB CHECK + Service |
| BR-011 | Status transition phải theo đúng lifecycle | Service: state machine |
| BR-012 | Chỉ OPEN_REGISTRATION mới nhận đăng ký | Service validation |

### 1.4. Registration Rules
| ID | Rule | Enforcement |
|----|------|-------------|
| BR-013 | 1 horse chỉ đăng ký 1 lần / tournament | DB: UNIQUE(tournament_id, horse_id) |
| BR-014 | Horse phải thuộc owner đang đăng ký | Service: check ownership |
| BR-015 | Đăng ký trong thời gian registration window | Service: check timestamps |

### 1.5. Race Rules
| ID | Rule | Enforcement |
|----|------|-------------|
| BR-016 | 1 horse chỉ tham gia 1 lần / race | DB: UNIQUE(race_id, horse_id) |
| BR-017 | 1 jockey chỉ cưỡi 1 horse / race | Service validation |
| BR-018 | start_number không trùng trong race | Service validation |
| BR-019 | max_participants >= min_participants >= 2 | DB CHECK + Service |
| BR-020 | Race status transition theo đúng lifecycle | Service: state machine |

### 1.6. Invitation Rules
| ID | Rule | Enforcement |
|----|------|-------------|
| BR-021 | Owner chỉ mời cho horse của mình | Service: check ownership |
| BR-022 | Jockey phải có role ACTIVE | Service validation |
| BR-023 | Không có PENDING invitation trùng race + horse | Service validation |
| BR-024 | Race chưa bắt đầu mới mời được | Service: check race status |

### 1.7. Result Rules
| ID | Rule | Enforcement |
|----|------|-------------|
| BR-025 | Chỉ assigned referee mới submit result | Service: check referee_id |
| BR-026 | Position unique cho FINISHED participants | Service validation |
| BR-027 | Publish result phải qua Admin confirm trước | Service: check status flow |
| BR-028 | Ranking chỉ update từ PUBLISHED results | Service: check result status |

### 1.8. Prediction Rules
| ID | Rule | Enforcement |
|----|------|-------------|
| BR-029 | Prediction trước race_at | Service: check timestamp |
| BR-030 | 1 user / 1 prediction / 1 race | DB: UNIQUE(race_id, spectator_id) |
| BR-031 | TOP3: 3 participant phải khác nhau | Service validation |
| BR-032 | Lock prediction khi race bắt đầu | Scheduler job |
| BR-033 | Evaluate prediction sau result PUBLISHED | Service: triggered by publish |

---

## 2. Status Transition State Machines

### 2.1. Tournament Status Transitions
```
ALLOWED_TRANSITIONS = {
    DRAFT              → [OPEN_REGISTRATION, CANCELLED],
    OPEN_REGISTRATION  → [CLOSED_REGISTRATION, CANCELLED],
    CLOSED_REGISTRATION→ [ONGOING, CANCELLED],
    ONGOING            → [COMPLETED, CANCELLED],
    COMPLETED          → [],
    CANCELLED          → []
}
```

### 2.2. Race Status Transitions
```
ALLOWED_TRANSITIONS = {
    SCHEDULED          → [CHECKING, CANCELLED],
    CHECKING           → [READY, CANCELLED],
    READY              → [ONGOING, CANCELLED],
    ONGOING            → [FINISHED],
    FINISHED           → [RESULT_SUBMITTED],
    RESULT_SUBMITTED   → [RESULT_CONFIRMED, FINISHED],  // FINISHED = rejected, redo
    RESULT_CONFIRMED   → [PUBLISHED],
    PUBLISHED          → [],
    CANCELLED          → []
}
```

---

## 3. Point Calculation Rules

### 3.1. Race Points (Default)
| Position | Points |
|----------|--------|
| 1st | 10 |
| 2nd | 7 |
| 3rd | 5 |
| 4th | 3 |
| Other finished | 1 |
| DISQUALIFIED | 0 |
| DID_NOT_FINISH | 0 |
| WITHDRAWN | 0 |

### 3.2. Prediction Points
| Prediction Type | Condition | Points |
|----------------|-----------|--------|
| WINNER | Đúng vị trí 1 | 10 |
| WINNER | Sai | 0 |
| TOP3 | Đúng thứ tự top 3 | 30 |
| TOP3 | Đúng 3 người, sai thứ tự | 15 |
| TOP3 | Sai | 0 |

### 3.3. Ranking Sort Rules
```
ORDER BY total_points DESC, total_wins DESC, total_prize DESC, horse_name ASC
```

---

## 4. Build Checklist (8 Phases)

### Phase 1: Foundation (Week 1-2)
- [ ] Init Maven mono-repo (parent + backend + frontend modules)
- [ ] Backend: Spring Boot 3.x + Java 17 setup
- [ ] Frontend: React + Vite + Tailwind CSS setup
- [ ] Frontend-maven-plugin configuration
- [ ] Database connection (application-dev.yml)
- [ ] Flyway migration setup
- [ ] Run 001_create_tables.sql + 002_seed_data.sql
- [ ] User, Role, UserRole entities + repositories
- [ ] Auth: Register API (auto-assign SPECTATOR)
- [ ] Auth: Login API (JWT token generation)
- [ ] Spring Security config + JWT filter
- [ ] Global exception handler (ApiResponse, ErrorCode)
- [ ] CORS configuration (React dev server)
- [ ] Swagger/springdoc-openapi setup
- [ ] Frontend: Axios config + interceptors
- [ ] Frontend: AuthContext + Login/Register pages
- [ ] Frontend: ProtectedRoute + RoleRoute guards
- [ ] Frontend: PublicLayout + Navbar

### Phase 2: Role Request (Week 2-3)
- [ ] RoleRequest entity + repository
- [ ] HorseOwnerProfile, JockeyProfile, RefereeProfile entities
- [ ] Submit role application APIs (3 endpoints)
- [ ] Admin: list/approve/reject role request APIs
- [ ] Auto-create user_role + update profile on approval
- [ ] Notification entity + service (create on approve/reject)
- [ ] Frontend: Role request forms (Owner/Jockey/Referee)
- [ ] Frontend: My role requests page
- [ ] Frontend: Admin role request management page
- [ ] Frontend: Notification bell + list

### Phase 3: Horse & Tournament (Week 3-4)
- [ ] Horse entity + Owner CRUD APIs
- [ ] Admin horse approve/reject APIs
- [ ] File upload API (images + PDF evidence)
- [ ] FileStorageService (local strategy)
- [ ] Tournament entity + Admin CRUD APIs
- [ ] Tournament status transition APIs (open/close/start/complete/cancel)
- [ ] TournamentRegistration: Owner submit + Admin approve/reject
- [ ] Frontend: Owner horse management pages
- [ ] Frontend: Admin horse approval page
- [ ] Frontend: Tournament list + detail (public)
- [ ] Frontend: Admin tournament management
- [ ] Frontend: Owner registration page

### Phase 4: Race & Invitation (Week 4-5)
- [ ] Race entity + Admin CRUD APIs
- [ ] Referee assignment API
- [ ] JockeyInvitation entity + Owner invite API
- [ ] Jockey accept/reject invitation APIs
- [ ] RaceParticipant creation on accept
- [ ] Cancel other PENDING invitations on accept
- [ ] Owner confirm race participation API
- [ ] Frontend: Admin race management
- [ ] Frontend: Owner invitation management
- [ ] Frontend: Jockey invitations page
- [ ] Frontend: Race detail page (public)

### Phase 5: Referee & Result (Week 5-6)
- [ ] PreRaceCheck entity + Referee check API
- [ ] Race status: SCHEDULED → CHECKING → READY
- [ ] Violation entity + Referee record API
- [ ] RefereeReport entity + CRUD + submit API
- [ ] RaceResult entity + Referee submit result API
- [ ] Admin confirm/reject/publish result APIs
- [ ] TournamentRanking update on publish
- [ ] Point calculation service
- [ ] Frontend: Referee dashboard + race check
- [ ] Frontend: Referee violation + report forms
- [ ] Frontend: Referee submit result form
- [ ] Frontend: Admin result management
- [ ] Frontend: Rankings page (public)

### Phase 6: Prediction (Week 6-7)
- [ ] Prediction entity + submit/update APIs
- [ ] Prediction validation (before race_at, unique per user)
- [ ] PredictionLockJob scheduler
- [ ] InvitationExpiryJob scheduler
- [ ] Evaluate prediction after result publish
- [ ] Prediction history API
- [ ] Frontend: Prediction form on race detail
- [ ] Frontend: My predictions page
- [ ] Frontend: Admin predictions overview

### Phase 7: Polish (Week 7-8)
- [ ] Dashboard statistics APIs (admin, owner, jockey)
- [ ] Search + filter on all list APIs
- [ ] Pagination everywhere
- [ ] Complete notification types coverage
- [ ] Input validation audit (all DTOs)
- [ ] Security audit (ownership checks)
- [ ] Error handling audit
- [ ] Frontend: Admin dashboard with stats
- [ ] Frontend: Owner/Jockey/Referee dashboards
- [ ] Frontend: Responsive design check
- [ ] Frontend: Loading states + error states
- [ ] Seed data for full demo scenario (Section 25 of spec)
- [ ] End-to-end test: full tournament lifecycle

### Phase 8: AI & Nice-to-Have (Optional)
- [ ] Rule-based AI prediction service
- [ ] AI prediction storage (ai_race_predictions table)
- [ ] AI prediction display on race page
- [ ] Jockey ranking table
- [ ] Prize/prize_awards tables
- [ ] Prediction rewards table
- [ ] Audit logs table
- [ ] Data export (Excel/CSV)
