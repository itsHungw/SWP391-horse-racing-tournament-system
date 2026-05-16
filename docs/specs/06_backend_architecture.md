# Backend Architecture Specification

> **Rule #1**: Mọi layer PHẢI tuân thủ strict dependency direction.
> Vi phạm layer rule = code review REJECT.

---

## 1. Layered Architecture

```
┌─────────────────────────────────────────────┐
│              Client (React)                 │
└──────────────────┬──────────────────────────┘
                   │ HTTP / JSON
┌──────────────────▼──────────────────────────┐
│           Controller Layer                  │
│   - Nhận request, trả response             │
│   - Validate input (@Valid)                 │
│   - KHÔNG chứa business logic              │
│   - CHỈ gọi Service layer                  │
└──────────────────┬──────────────────────────┘
                   │ DTO (Request/Response)
┌──────────────────▼──────────────────────────┐
│            Service Layer                    │
│   - Business logic + validation            │
│   - Transaction management                 │
│   - Gọi Repository layer                   │
│   - Gọi Mapper để convert Entity ↔ DTO     │
│   - KHÔNG trả Entity ra ngoài              │
└──────────────────┬──────────────────────────┘
                   │ Entity
┌──────────────────▼──────────────────────────┐
│          Repository Layer                   │
│   - Data access only                       │
│   - JPA Repositories                       │
│   - Custom queries (JPQL/native)           │
│   - KHÔNG chứa business logic              │
└──────────────────┬──────────────────────────┘
                   │ SQL
┌──────────────────▼──────────────────────────┐
│              Database                       │
└─────────────────────────────────────────────┘
```

---

## 2. Strict Layer Rules (PHẢI TUÂN THỦ)

### ❌ FORBIDDEN (Cấm tuyệt đối)

| Rule | Mô tả |
|------|--------|
| F-01 | Controller **KHÔNG ĐƯỢC** gọi Repository trực tiếp |
| F-02 | Controller **KHÔNG ĐƯỢC** chứa business logic |
| F-03 | Controller **KHÔNG ĐƯỢC** trả Entity ra response |
| F-04 | Service **KHÔNG ĐƯỢC** trả Entity ra Controller |
| F-05 | Repository **KHÔNG ĐƯỢC** chứa business logic |
| F-06 | Entity **KHÔNG ĐƯỢC** xuất hiện trong Controller layer |
| F-07 | Service **KHÔNG ĐƯỢC** inject HttpServletRequest/Response |
| F-08 | Mapper **KHÔNG ĐƯỢC** gọi Repository |

### ✅ REQUIRED (Bắt buộc)

| Rule | Mô tả |
|------|--------|
| R-01 | Controller CHỈ gọi Service |
| R-02 | Service CHỈ gọi Repository + Mapper + other Service |
| R-03 | Mọi data trả về client PHẢI qua Response DTO |
| R-04 | Mọi data nhận từ client PHẢI qua Request DTO |
| R-05 | Transaction annotation (`@Transactional`) CHỈ ở Service |
| R-06 | Validation annotation (`@Valid`) CHỈ ở Controller params |
| R-07 | Security context (current user) lấy qua SecurityUtil |
| R-08 | Exception xử lý qua GlobalExceptionHandler |

---

## 3. Package Structure

```
backend/src/main/java/com/horseracing/
│
├── config/                        # Configuration classes
│   ├── SecurityConfig.java        # Spring Security + CORS
│   ├── JwtConfig.java             # JWT properties
│   ├── SwaggerConfig.java         # OpenAPI/Swagger
│   ├── WebConfig.java             # CORS, interceptors
│   └── FileStorageConfig.java     # Upload config
│
├── security/                      # Security layer
│   ├── JwtTokenProvider.java      # JWT create/validate
│   ├── JwtAuthenticationFilter.java
│   ├── CustomUserDetails.java
│   ├── CustomUserDetailsService.java
│   └── SecurityUtil.java          # Get current user helper
│
├── controller/                    # REST Controllers
│   ├── AuthController.java
│   ├── UserController.java
│   ├── RoleRequestController.java
│   ├── HorseController.java
│   ├── TournamentController.java
│   ├── RaceController.java
│   ├── JockeyInvitationController.java
│   ├── RaceParticipantController.java
│   ├── PreRaceCheckController.java
│   ├── ViolationController.java
│   ├── RefereeReportController.java
│   ├── RaceResultController.java
│   ├── RankingController.java
│   ├── PredictionController.java
│   ├── NotificationController.java
│   ├── FileController.java
│   └── admin/                     # Admin-specific controllers
│       ├── AdminUserController.java
│       ├── AdminRoleRequestController.java
│       ├── AdminHorseController.java
│       ├── AdminTournamentController.java
│       ├── AdminRaceController.java
│       ├── AdminRegistrationController.java
│       └── AdminResultController.java
│
├── dto/                           # Data Transfer Objects
│   ├── request/                   # Incoming data
│   │   ├── auth/
│   │   │   ├── RegisterRequest.java
│   │   │   ├── LoginRequest.java
│   │   │   └── ChangePasswordRequest.java
│   │   ├── role/
│   │   │   ├── HorseOwnerApplicationRequest.java
│   │   │   ├── JockeyApplicationRequest.java
│   │   │   └── RefereeApplicationRequest.java
│   │   ├── horse/
│   │   │   └── CreateHorseRequest.java
│   │   ├── tournament/
│   │   │   └── CreateTournamentRequest.java
│   │   ├── race/
│   │   │   ├── CreateRaceRequest.java
│   │   │   └── AssignRefereeRequest.java
│   │   ├── invitation/
│   │   │   └── CreateInvitationRequest.java
│   │   ├── referee/
│   │   │   ├── PreRaceCheckRequest.java
│   │   │   ├── ViolationRequest.java
│   │   │   ├── RefereeReportRequest.java
│   │   │   └── SubmitResultRequest.java
│   │   └── prediction/
│   │       └── SubmitPredictionRequest.java
│   │
│   └── response/                  # Outgoing data
│       ├── ApiResponse.java       # Standard wrapper
│       ├── PageResponse.java      # Pagination wrapper
│       ├── auth/
│       │   └── LoginResponse.java
│       ├── user/
│       │   └── UserResponse.java
│       ├── horse/
│       │   └── HorseResponse.java
│       ├── tournament/
│       │   └── TournamentResponse.java
│       ├── race/
│       │   ├── RaceResponse.java
│       │   └── RaceDetailResponse.java
│       ├── result/
│       │   └── RaceResultResponse.java
│       ├── ranking/
│       │   └── RankingResponse.java
│       └── notification/
│           └── NotificationResponse.java
│
├── entity/                        # JPA Entities
│   ├── User.java
│   ├── Role.java
│   ├── UserRole.java
│   ├── RoleRequest.java
│   ├── HorseOwnerProfile.java
│   ├── JockeyProfile.java
│   ├── RefereeProfile.java
│   ├── Horse.java
│   ├── Tournament.java
│   ├── Race.java
│   ├── TournamentRegistration.java
│   ├── JockeyInvitation.java
│   ├── RaceParticipant.java
│   ├── PreRaceCheck.java
│   ├── Violation.java
│   ├── RefereeReport.java
│   ├── RaceResult.java
│   ├── TournamentRanking.java
│   ├── Prediction.java
│   └── Notification.java
│
├── enums/                         # Enum constants
│   ├── UserStatus.java            # ACTIVE, LOCKED, DISABLED, PENDING_EMAIL_VERIFY
│   ├── RoleName.java              # ADMIN, SPECTATOR, HORSE_OWNER, JOCKEY, REFEREE
│   ├── UserRoleStatus.java        # ACTIVE, SUSPENDED, REMOVED
│   ├── RequestStatus.java         # PENDING, APPROVED, REJECTED, CANCELLED
│   ├── ProfileStatus.java         # PENDING, APPROVED, REJECTED, SUSPENDED
│   ├── HorseStatus.java           # PENDING, APPROVED, REJECTED, INACTIVE, SUSPENDED
│   ├── TournamentStatus.java      # DRAFT, OPEN_REGISTRATION, CLOSED_REGISTRATION, ONGOING, COMPLETED, CANCELLED
│   ├── RegistrationStatus.java    # PENDING, APPROVED, REJECTED, WITHDRAWN
│   ├── RaceStatus.java            # SCHEDULED → CHECKING → READY → ONGOING → FINISHED → ...
│   ├── InvitationStatus.java      # PENDING, ACCEPTED, REJECTED, CANCELLED, EXPIRED
│   ├── ConfirmationStatus.java    # PENDING, CONFIRMED, WITHDRAWN
│   ├── CheckStatus.java           # NOT_CHECKED, PASSED, FAILED, CONDITIONAL
│   ├── ParticipantStatus.java     # REGISTERED, APPROVED, DISQUALIFIED, WITHDRAWN
│   ├── ResultStatus.java          # DRAFT, SUBMITTED, CONFIRMED, PUBLISHED, REJECTED
│   ├── ParticipantResultStatus.java # FINISHED, DISQUALIFIED, DID_NOT_FINISH, WITHDRAWN
│   ├── PredictionType.java        # WINNER, TOP3
│   ├── PredictionStatus.java      # PENDING, LOCKED, WON, LOST, CANCELLED
│   └── NotificationType.java      # ROLE_REQUEST_APPROVED, HORSE_APPROVED, ...
│
├── repository/                    # JPA Repositories
│   ├── UserRepository.java
│   ├── RoleRepository.java
│   ├── UserRoleRepository.java
│   ├── RoleRequestRepository.java
│   ├── HorseOwnerProfileRepository.java
│   ├── JockeyProfileRepository.java
│   ├── RefereeProfileRepository.java
│   ├── HorseRepository.java
│   ├── TournamentRepository.java
│   ├── RaceRepository.java
│   ├── TournamentRegistrationRepository.java
│   ├── JockeyInvitationRepository.java
│   ├── RaceParticipantRepository.java
│   ├── PreRaceCheckRepository.java
│   ├── ViolationRepository.java
│   ├── RefereeReportRepository.java
│   ├── RaceResultRepository.java
│   ├── TournamentRankingRepository.java
│   ├── PredictionRepository.java
│   └── NotificationRepository.java
│
├── mapper/                        # Entity ↔ DTO mapping
│   ├── UserMapper.java
│   ├── HorseMapper.java
│   ├── TournamentMapper.java
│   ├── RaceMapper.java
│   ├── ResultMapper.java
│   ├── PredictionMapper.java
│   └── NotificationMapper.java
│
├── service/                       # Business logic interfaces
│   ├── AuthService.java
│   ├── UserService.java
│   ├── RoleRequestService.java
│   ├── HorseService.java
│   ├── TournamentService.java
│   ├── TournamentRegistrationService.java
│   ├── RaceService.java
│   ├── JockeyInvitationService.java
│   ├── RaceParticipantService.java
│   ├── PreRaceCheckService.java
│   ├── ViolationService.java
│   ├── RefereeReportService.java
│   ├── RaceResultService.java
│   ├── RankingService.java
│   ├── PredictionService.java
│   ├── NotificationService.java
│   └── FileStorageService.java
│
├── service/impl/                  # Service implementations
│   ├── AuthServiceImpl.java
│   ├── UserServiceImpl.java
│   ├── ... (1:1 với interface)
│   └── FileStorageServiceImpl.java
│
├── exception/                     # Exception handling
│   ├── GlobalExceptionHandler.java  # @RestControllerAdvice
│   ├── ResourceNotFoundException.java
│   ├── BusinessException.java
│   ├── DuplicateResourceException.java
│   ├── InvalidStatusTransitionException.java
│   ├── AccessDeniedException.java
│   └── ErrorCode.java              # Enum error codes
│
├── scheduler/                     # Scheduled tasks
│   ├── InvitationExpiryJob.java
│   ├── PredictionLockJob.java
│   ├── NotificationCleanupJob.java
│   └── RaceReminderJob.java
│
├── util/                          # Utilities
│   ├── SecurityUtil.java          # Get current authenticated user
│   ├── DateUtil.java
│   └── SlugUtil.java
│
└── HorseRacingApplication.java    # Main class
```

---

## 4. Standard Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... },
  "timestamp": "2026-05-14T19:00:00"
}
```

### Paginated Response
```json
{
  "success": true,
  "data": {
    "content": [ ... ],
    "page": 0,
    "size": 20,
    "totalElements": 150,
    "totalPages": 8,
    "last": false
  },
  "timestamp": "2026-05-14T19:00:00"
}
```

### Error Response
```json
{
  "success": false,
  "code": "HORSE_NOT_APPROVED",
  "message": "Horse must be approved before registering to tournament.",
  "timestamp": "2026-05-14T19:00:00"
}
```

---

## 5. Layer Communication Examples

### ✅ CORRECT Flow
```
AuthController.register(RegisterRequest dto)
  → authService.register(dto)
    → userRepository.existsByEmail(dto.getEmail())
    → passwordEncoder.encode(dto.getPassword())
    → userRepository.save(user)
    → roleRepository.findByName(SPECTATOR)
    → userRoleRepository.save(userRole)
    → notificationService.createWelcome(user.getId())
    → userMapper.toResponse(user)
  ← return UserResponse
← return ApiResponse<UserResponse>
```

### ❌ WRONG - Controller calls Repository
```
// FORBIDDEN!
@RestController
public class HorseController {
    @Autowired
    private HorseRepository horseRepo; // ❌ NEVER!

    @GetMapping
    public List<Horse> getHorses() {   // ❌ Returning Entity!
        return horseRepo.findAll();     // ❌ Direct repo call!
    }
}
```

### ✅ CORRECT
```
@RestController
@RequiredArgsConstructor
public class HorseController {
    private final HorseService horseService; // ✅ Only Service

    @GetMapping
    public ApiResponse<PageResponse<HorseResponse>> getHorses(Pageable pageable) {
        return ApiResponse.success(horseService.getHorses(pageable));
    }
}
```

---

## 6. Service Layer Rules

```java
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)  // Default read-only
public class HorseServiceImpl implements HorseService {

    private final HorseRepository horseRepository;
    private final UserRepository userRepository;
    private final HorseMapper horseMapper;
    private final NotificationService notificationService; // ✅ Service can call other Service
    private final SecurityUtil securityUtil;

    @Override
    @Transactional  // Write operation
    public HorseResponse createHorse(CreateHorseRequest request) {
        // 1. Get current user
        Long userId = securityUtil.getCurrentUserId();

        // 2. Business validation
        // ... check role, check ownership, etc.

        // 3. Entity creation
        Horse horse = horseMapper.toEntity(request);
        horse.setOwnerId(userId);
        horse.setStatus(HorseStatus.PENDING);

        // 4. Save
        horse = horseRepository.save(horse);

        // 5. Side effects
        notificationService.notifyAdminNewHorse(horse.getId());

        // 6. Return DTO (NEVER return Entity)
        return horseMapper.toResponse(horse);
    }
}
```
