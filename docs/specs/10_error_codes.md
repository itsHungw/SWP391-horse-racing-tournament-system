# Error Codes & Validation Specification

---

## 1. Standard API Response

### Success
```json
{
  "success": true,
  "message": "Horse created successfully",
  "data": { ... },
  "timestamp": "2026-05-14T19:00:00"
}
```

### Error
```json
{
  "success": false,
  "code": "HORSE_NOT_APPROVED",
  "message": "Horse must be approved before registering to tournament.",
  "errors": [],
  "timestamp": "2026-05-14T19:00:00"
}
```

### Validation Error (422)
```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "Email is required" },
    { "field": "password", "message": "Password must be at least 8 characters" }
  ],
  "timestamp": "2026-05-14T19:00:00"
}
```

---

## 2. Error Codes by Module

### 2.1. Auth Errors
| Code | HTTP | Message |
|------|------|---------|
| `AUTH_EMAIL_EXISTS` | 409 | Email already registered |
| `AUTH_INVALID_CREDENTIALS` | 401 | Invalid email or password |
| `AUTH_ACCOUNT_LOCKED` | 403 | Account is locked |
| `AUTH_ACCOUNT_DISABLED` | 403 | Account is disabled |
| `AUTH_TOKEN_EXPIRED` | 401 | JWT token has expired |
| `AUTH_TOKEN_INVALID` | 401 | Invalid JWT token |
| `AUTH_PASSWORD_MISMATCH` | 400 | Current password is incorrect |
| `AUTH_WEAK_PASSWORD` | 400 | Password does not meet requirements |

### 2.2. User Errors
| Code | HTTP | Message |
|------|------|---------|
| `USER_NOT_FOUND` | 404 | User not found |
| `USER_ACCESS_DENIED` | 403 | Access denied |

### 2.3. Role Request Errors
| Code | HTTP | Message |
|------|------|---------|
| `ROLE_ALREADY_EXISTS` | 409 | User already has this role |
| `ROLE_REQUEST_PENDING` | 409 | A pending request for this role already exists |
| `ROLE_REQUEST_NOT_FOUND` | 404 | Role request not found |
| `ROLE_REQUEST_NOT_PENDING` | 400 | Role request is not in PENDING status |
| `INVALID_ROLE_NAME` | 400 | Invalid role name |

### 2.4. Horse Errors
| Code | HTTP | Message |
|------|------|---------|
| `HORSE_NOT_FOUND` | 404 | Horse not found |
| `HORSE_NOT_OWNED` | 403 | Horse does not belong to current user |
| `HORSE_NOT_APPROVED` | 400 | Horse is not approved |
| `HORSE_IN_ACTIVE_RACE` | 400 | Cannot delete horse in active race |
| `HORSE_REG_CODE_EXISTS` | 409 | Registration code already exists |

### 2.5. Tournament Errors
| Code | HTTP | Message |
|------|------|---------|
| `TOURNAMENT_NOT_FOUND` | 404 | Tournament not found |
| `TOURNAMENT_NOT_OPEN` | 400 | Tournament is not open for registration |
| `TOURNAMENT_CODE_EXISTS` | 409 | Tournament code already exists |
| `TOURNAMENT_INVALID_DATES` | 400 | Invalid tournament date range |
| `TOURNAMENT_INVALID_TRANSITION` | 400 | Invalid status transition |
| `TOURNAMENT_MAX_HORSES` | 400 | Tournament has reached max horses |

### 2.6. Registration Errors
| Code | HTTP | Message |
|------|------|---------|
| `REG_ALREADY_EXISTS` | 409 | Horse already registered in this tournament |
| `REG_NOT_FOUND` | 404 | Registration not found |
| `REG_OUTSIDE_WINDOW` | 400 | Registration period has ended |
| `REG_CANNOT_WITHDRAW` | 400 | Cannot withdraw registration |

### 2.7. Race Errors
| Code | HTTP | Message |
|------|------|---------|
| `RACE_NOT_FOUND` | 404 | Race not found |
| `RACE_CODE_EXISTS` | 409 | Race code already exists |
| `RACE_ALREADY_STARTED` | 400 | Race has already started |
| `RACE_INVALID_TRANSITION` | 400 | Invalid race status transition |
| `RACE_INSUFFICIENT_PARTICIPANTS` | 400 | Not enough participants |
| `RACE_DATE_OUTSIDE_TOURNAMENT` | 400 | Race date must be within tournament dates |

### 2.8. Invitation Errors
| Code | HTTP | Message |
|------|------|---------|
| `INVITATION_NOT_FOUND` | 404 | Invitation not found |
| `INVITATION_NOT_PENDING` | 400 | Invitation is not pending |
| `INVITATION_EXPIRED` | 400 | Invitation has expired |
| `JOCKEY_NOT_AVAILABLE` | 400 | Jockey is not available |
| `JOCKEY_ALREADY_IN_RACE` | 409 | Jockey already assigned in this race |
| `INVITATION_PENDING_EXISTS` | 409 | Pending invitation already exists for this horse in this race |

### 2.9. Participant Errors
| Code | HTTP | Message |
|------|------|---------|
| `PARTICIPANT_NOT_FOUND` | 404 | Participant not found |
| `DUPLICATE_HORSE_IN_RACE` | 409 | Horse already in this race |
| `DUPLICATE_JOCKEY_IN_RACE` | 409 | Jockey already in this race |
| `DUPLICATE_START_NUMBER` | 409 | Start number already taken |
| `RACE_FULL` | 400 | Race has reached max participants |

### 2.10. Referee Errors
| Code | HTTP | Message |
|------|------|---------|
| `REFEREE_NOT_ASSIGNED` | 403 | You are not assigned to this race |
| `REFEREE_NOT_FOUND` | 404 | Referee not found |
| `REFEREE_CONFLICT` | 409 | Referee already assigned to another race at same time |
| `CHECK_ALREADY_EXISTS` | 409 | Pre-race check already exists for this participant |
| `RACE_NOT_CHECKING` | 400 | Race is not in CHECKING status |

### 2.11. Result Errors
| Code | HTTP | Message |
|------|------|---------|
| `RESULT_NOT_FOUND` | 404 | Result not found |
| `RESULT_NOT_SUBMITTED` | 400 | Result has not been submitted |
| `RESULT_NOT_CONFIRMED` | 400 | Result must be confirmed before publishing |
| `DUPLICATE_POSITION` | 409 | Position already assigned |
| `RACE_NOT_FINISHED` | 400 | Race must be finished before submitting result |

### 2.12. Prediction Errors
| Code | HTTP | Message |
|------|------|---------|
| `PREDICTION_CLOSED` | 400 | Prediction deadline has passed |
| `PREDICTION_EXISTS` | 409 | You already have a prediction for this race |
| `PREDICTION_NOT_FOUND` | 404 | Prediction not found |
| `PREDICTION_NOT_PENDING` | 400 | Prediction cannot be updated |
| `INVALID_PARTICIPANT` | 400 | Predicted participant does not belong to this race |
| `DUPLICATE_PREDICTION_PICKS` | 400 | TOP3 participants must be distinct |

### 2.13. File Errors
| Code | HTTP | Message |
|------|------|---------|
| `FILE_TOO_LARGE` | 400 | File size exceeds maximum allowed |
| `INVALID_FILE_TYPE` | 400 | File type is not allowed |
| `FILE_NOT_FOUND` | 404 | File not found |
| `FILE_UPLOAD_FAILED` | 500 | Failed to upload file |

### 2.14. Generic Errors
| Code | HTTP | Message |
|------|------|---------|
| `VALIDATION_ERROR` | 422 | Validation failed |
| `ACCESS_DENIED` | 403 | Access denied |
| `NOT_FOUND` | 404 | Resource not found |
| `INTERNAL_ERROR` | 500 | Internal server error |

---

## 3. Validation Rules by DTO

### RegisterRequest
| Field | Rule |
|-------|------|
| fullName | Required, 2-150 chars |
| email | Required, valid email format, unique |
| password | Required, min 8 chars, must contain uppercase + lowercase + digit + special |
| phone | Optional, valid phone format |

### CreateHorseRequest
| Field | Rule |
|-------|------|
| name | Required, 2-150 chars |
| registrationCode | Optional, unique |
| breed | Optional |
| gender | Required, enum: MALE/FEMALE |
| dateOfBirth | Optional, must be in the past |
| heightCm | Optional, > 0 |
| weightKg | Optional, > 0 |
| healthStatus | Optional |

### CreateTournamentRequest
| Field | Rule |
|-------|------|
| name | Required, 2-200 chars |
| code | Required, unique, alphanumeric + dash |
| location | Required |
| startDate | Required, must be future |
| endDate | Required, >= startDate |
| registrationStartAt | Required, < registrationEndAt |
| registrationEndAt | Required |
| maxHorses | Optional, > 0 |

### CreateRaceRequest
| Field | Rule |
|-------|------|
| tournamentId | Required, existing tournament |
| name | Required, 2-200 chars |
| code | Required, unique |
| raceAt | Required, within tournament date range |
| distanceMeter | Required, > 0 |
| maxParticipants | Required, >= minParticipants |
| minParticipants | Required, >= 2 |

### SubmitPredictionRequest
| Field | Rule |
|-------|------|
| raceId | Required, existing race |
| predictionType | Required, enum: WINNER/TOP3 |
| predictedWinnerId | Required for WINNER and TOP3 |
| predictedSecondId | Required for TOP3, != winnerId |
| predictedThirdId | Required for TOP3, != winnerId, != secondId |
