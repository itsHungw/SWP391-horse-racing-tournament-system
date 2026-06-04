# Owner Profile Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the /owner/profile application flow with owner profile APIs, role-request integration, validated uploads, and a product-grade frontend page with tests.

**Architecture:** Add a HorseOwnerProfile domain model and service layer to own validation and status transitions. Keep role-request approval as the single admin review action, syncing owner profile status on approve/reject. Frontend uses a two-column layout (form + sticky panel) inside OwnerLayout and reads user identity from /users/me/profile.

**Tech Stack:** Spring Boot 3, JPA/Hibernate, SQL Server, React 18, TypeScript, Vite, Tailwind CSS, Vitest, React Testing Library.

---

## Preflight Safety Review (Required before execution)
- /owner/profile must be accessible to any authenticated user. Do not add a HORSE_OWNER role gate to this route or its layout.
- Extend FileStorageService categories without breaking existing upload behavior. Do not modify HorseFileStorageService paths or rules.
- Respect unique pending role request constraint: reuse existing PENDING HORSE_OWNER requests and avoid duplicates.
- Fix verificationChanged boolean precedence in OwnerProfilePage.
- OwnerProfilePage tests must mock async evidence upload and wait for evidenceUrl before submit.
- Keep GET /users/me/owner-profile returning 404 when missing and let frontend map it to NOT_SUBMITTED (unless API is explicitly changed).
- Do not rely only on profileCompleted; validate core profile fields directly (fullName, phone, address, dateOfBirth, gender).
- When verification changes after APPROVED, ensure the admin review queue can see the re-review task (create or reopen a PENDING HORSE_OWNER request if the admin queue is role_requests).
- Verify horse_owner_profiles schema before coding. If any required columns are missing, update database/004_owner_profile.sql to add all missing fields (not just logo_url).

## File Structure (Create/Modify)

### Backend
**Create**
- `backend/src/main/java/com/example/horseracingtournamentsystem/user/entity/HorseOwnerProfile.java` (entity + status transitions)
- `backend/src/main/java/com/example/horseracingtournamentsystem/user/repository/HorseOwnerProfileRepository.java` (query by user)
- `backend/src/main/java/com/example/horseracingtournamentsystem/user/dto/request/UpdateOwnerProfileRequest.java` (validation)
- `backend/src/main/java/com/example/horseracingtournamentsystem/user/dto/response/OwnerProfileResponse.java` (API response)
- `backend/src/main/java/com/example/horseracingtournamentsystem/user/service/OwnerProfileService.java` (upsert + role request integration)
- `backend/src/main/java/com/example/horseracingtournamentsystem/user/controller/OwnerProfileController.java` (GET/PUT endpoints)
- `backend/src/test/java/com/example/horseracingtournamentsystem/user/OwnerProfileIntegrationTest.java` (integration tests)
- `backend/src/test/java/com/example/horseracingtournamentsystem/filestorage/FileUploadIntegrationTest.java` (upload validation tests)
- `database/004_owner_profile.sql` (add logo_url column)

**Modify**
- `backend/src/main/java/com/example/horseracingtournamentsystem/user/repository/RoleRequestRepository.java` (query latest by user + role)
- `backend/src/main/java/com/example/horseracingtournamentsystem/user/service/AdminRoleRequestService.java` (sync owner profile on approve/reject)
- `backend/src/main/java/com/example/horseracingtournamentsystem/horse/service/HorseService.java` (require owner profile approved)
- `backend/src/main/java/com/example/horseracingtournamentsystem/tournamentregistration/service/TournamentRegistrationService.java` (require owner profile approved)
- `backend/src/main/java/com/example/horseracingtournamentsystem/filestorage/FileStorageService.java` (category validation + storage)
- `backend/src/main/java/com/example/horseracingtournamentsystem/filestorage/FileStorageController.java` (category support)
- `backend/src/main/java/com/example/horseracingtournamentsystem/common/upload/UploadProperties.java` (new limits)
- `backend/src/main/resources/application.yml` (new upload limits)
- `database/001_create_tables.sql` (add logo_url column to horse_owner_profiles)
- `backend/src/test/java/com/example/horseracingtournamentsystem/horse/OwnerHorseIntegrationTest.java` (set approved owner profile, add restriction tests)
- `backend/src/test/java/com/example/horseracingtournamentsystem/tournamentregistration/TournamentRegistrationIntegrationTest.java` (set approved owner profile, add restriction tests)

### Frontend
**Create**
- `frontend/src/types/ownerProfile.ts` (OwnerProfile types)
- `frontend/src/api/ownerProfileApi.ts` (owner profile + upload API)
- `frontend/src/api/ownerProfileApi.test.ts` (API unit tests)
- `frontend/src/pages/owner/OwnerProfilePage.tsx` (new page)
- `frontend/src/pages/owner/OwnerProfilePage.test.tsx` (UI tests)

**Modify**
- `frontend/src/routes/AppRouter.tsx` (add /owner/profile route)
- `frontend/src/layouts/OwnerLayout.tsx` (add Owner Profile nav item)

---

## Task 1: Backend GET /users/me/owner-profile (404 when missing)

**Files:**
- Create: `backend/src/test/java/com/example/horseracingtournamentsystem/user/OwnerProfileIntegrationTest.java`
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/user/controller/OwnerProfileController.java`
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/user/service/OwnerProfileService.java`
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/user/entity/HorseOwnerProfile.java`
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/user/repository/HorseOwnerProfileRepository.java`
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/user/dto/response/OwnerProfileResponse.java`

- [ ] **Step 1: Write failing test**

```java
package com.example.horseracingtournamentsystem.user;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.horseracingtournamentsystem.security.JwtService;
import com.example.horseracingtournamentsystem.user.entity.Role;
import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.user.repository.RoleRepository;
import com.example.horseracingtournamentsystem.user.repository.UserRepository;
import com.example.horseracingtournamentsystem.user.repository.UserRoleRepository;
import java.util.Set;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class OwnerProfileIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRoleRepository userRoleRepository;

    private String token;
    private User user;

    @BeforeEach
    void setUp() {
        userRoleRepository.deleteAll();
        roleRepository.deleteAll();
        userRepository.deleteAll();

        Role spectatorRole = roleRepository.save(Role.of("SPECTATOR", "Spectator"));
        user = User.pending("Owner Candidate", "owner-candidate@example.com", "hash");
        user.verifyEmail();
        user = userRepository.save(user);
        userRoleRepository.save(com.example.horseracingtournamentsystem.user.entity.UserRole.active(user, spectatorRole, user));

        token = jwtService.generateToken(user.getEmail(), Set.of("SPECTATOR"));
    }

    @Test
    void getOwnerProfileReturnsNotFoundWhenMissing() throws Exception {
        mockMvc.perform(get("/api/v1/users/me/owner-profile")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Owner profile not found"));
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `mvn test -Dtest=OwnerProfileIntegrationTest#getOwnerProfileReturnsNotFoundWhenMissing`

Expected: FAIL (404 without the expected message or missing endpoint).

- [ ] **Step 3: Implement minimal owner profile domain + GET endpoint**

```java
// backend/src/main/java/com/example/horseracingtournamentsystem/user/entity/HorseOwnerProfile.java
package com.example.horseracingtournamentsystem.user.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "horse_owner_profiles")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class HorseOwnerProfile {

    public static final String STATUS_PENDING = "PENDING";
    public static final String STATUS_APPROVED = "APPROVED";
    public static final String STATUS_REJECTED = "REJECTED";
    public static final String STATUS_SUSPENDED = "SUSPENDED";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "stable_name", length = 150)
    private String stableName;

    @Column(name = "organization_name", length = 150)
    private String organizationName;

    @Column(name = "license_number", length = 100)
    private String licenseNumber;

    @Column(name = "experience_years", nullable = false)
    private Integer experienceYears;

    @Column(name = "bio")
    private String bio;

    @Column(name = "evidence_url", length = 500)
    private String evidenceUrl;

    @Column(name = "logo_url", length = 500)
    private String logoUrl;

    @Column(name = "status", nullable = false, length = 30)
    private String status;

    @Column(name = "rejection_reason")
    private String rejectionReason;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by")
    private User approvedBy;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public static HorseOwnerProfile pending(User user) {
        HorseOwnerProfile profile = new HorseOwnerProfile();
        profile.user = user;
        profile.status = STATUS_PENDING;
        profile.experienceYears = 0;
        profile.createdAt = LocalDateTime.now();
        return profile;
    }

    public void markUpdated() {
        this.updatedAt = LocalDateTime.now();
    }
}
```

```java
// backend/src/main/java/com/example/horseracingtournamentsystem/user/repository/HorseOwnerProfileRepository.java
package com.example.horseracingtournamentsystem.user.repository;

import com.example.horseracingtournamentsystem.user.entity.HorseOwnerProfile;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HorseOwnerProfileRepository extends JpaRepository<HorseOwnerProfile, Long> {
    Optional<HorseOwnerProfile> findByUserEmail(String email);
    Optional<HorseOwnerProfile> findByUserId(Long userId);
}
```

```java
// backend/src/main/java/com/example/horseracingtournamentsystem/user/dto/response/OwnerProfileResponse.java
package com.example.horseracingtournamentsystem.user.dto.response;

import com.example.horseracingtournamentsystem.user.entity.HorseOwnerProfile;
import java.time.LocalDateTime;

public record OwnerProfileResponse(
        String stableName,
        String organizationName,
        String licenseNumber,
        Integer experienceYears,
        String bio,
        String evidenceUrl,
        String logoUrl,
        String status,
        String rejectionReason,
        Long approvedBy,
        LocalDateTime approvedAt,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static OwnerProfileResponse from(HorseOwnerProfile profile) {
        return new OwnerProfileResponse(
                profile.getStableName(),
                profile.getOrganizationName(),
                profile.getLicenseNumber(),
                profile.getExperienceYears(),
                profile.getBio(),
                profile.getEvidenceUrl(),
                profile.getLogoUrl(),
                profile.getStatus(),
                profile.getRejectionReason(),
                profile.getApprovedBy() == null ? null : profile.getApprovedBy().getId(),
                profile.getApprovedAt(),
                profile.getCreatedAt(),
                profile.getUpdatedAt()
        );
    }
}
```

```java
// backend/src/main/java/com/example/horseracingtournamentsystem/user/service/OwnerProfileService.java
package com.example.horseracingtournamentsystem.user.service;

import com.example.horseracingtournamentsystem.user.dto.response.OwnerProfileResponse;
import com.example.horseracingtournamentsystem.user.entity.HorseOwnerProfile;
import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.user.repository.HorseOwnerProfileRepository;
import com.example.horseracingtournamentsystem.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class OwnerProfileService {

    private final HorseOwnerProfileRepository ownerProfileRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public OwnerProfileResponse getMyProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        HorseOwnerProfile profile = ownerProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Owner profile not found"));

        return OwnerProfileResponse.from(profile);
    }
}
```

```java
// backend/src/main/java/com/example/horseracingtournamentsystem/user/controller/OwnerProfileController.java
package com.example.horseracingtournamentsystem.user.controller;

import com.example.horseracingtournamentsystem.user.dto.response.OwnerProfileResponse;
import com.example.horseracingtournamentsystem.user.service.OwnerProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class OwnerProfileController {

    private final OwnerProfileService ownerProfileService;

    @GetMapping("/me/owner-profile")
    public OwnerProfileResponse getOwnerProfile(Authentication authentication) {
        return ownerProfileService.getMyProfile(authentication.getName());
    }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `mvn test -Dtest=OwnerProfileIntegrationTest#getOwnerProfileReturnsNotFoundWhenMissing`

Expected: PASS

- [ ] **Step 5: Commit**

Skip commit (user requested no git operations).

---

## Task 2: Backend PUT /users/me/owner-profile (create/update + role request)

**Files:**
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/user/dto/request/UpdateOwnerProfileRequest.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/user/service/OwnerProfileService.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/user/controller/OwnerProfileController.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/user/repository/RoleRequestRepository.java`
- Modify: `backend/src/test/java/com/example/horseracingtournamentsystem/user/OwnerProfileIntegrationTest.java`

- [ ] **Step 1: Write failing test (submit creates PENDING + role request)**

```java
@Test
void submitOwnerProfileCreatesPendingRoleRequest() throws Exception {
    // mark core profile fields completed
    org.springframework.test.util.ReflectionTestUtils.setField(user, "fullName", "Owner User");
    org.springframework.test.util.ReflectionTestUtils.setField(user, "phone", "0901234567");
    org.springframework.test.util.ReflectionTestUtils.setField(user, "address", "HCMC");
    org.springframework.test.util.ReflectionTestUtils.setField(user, "gender", "MALE");
    org.springframework.test.util.ReflectionTestUtils.setField(
            user,
            "dateOfBirth",
            java.time.LocalDate.of(2000, 1, 1)
    );
    userRepository.save(user);

    String body = """
            {
              \"licenseNumber\": \"VN-OWNER-001\",
              \"experienceYears\": 3,
              \"evidenceUrl\": \"/uploads/owners/evidence/owner-1.pdf\",
              \"stableName\": \"Sunset Stable\",
              \"organizationName\": \"\",
              \"bio\": \"Focused on endurance racing.\",
              \"logoUrl\": \"/uploads/owners/logos/sunset.png\"
            }
            """;

    mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put("/api/v1/users/me/owner-profile")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                    .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                    .content(body))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("PENDING"))
            .andExpect(jsonPath("$.licenseNumber").value("VN-OWNER-001"));

    boolean exists = roleRequestRepository.existsByUserEmailAndRequestedRoleAndStatus(
            user.getEmail(), "HORSE_OWNER", com.example.horseracingtournamentsystem.user.entity.RoleRequest.STATUS_PENDING);
    org.junit.jupiter.api.Assertions.assertTrue(exists);
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `mvn test -Dtest=OwnerProfileIntegrationTest#submitOwnerProfileCreatesPendingRoleRequest`

Expected: FAIL (missing PUT endpoint / service logic).

- [ ] **Step 3: Implement request DTO + upsert logic**

```java
// backend/src/main/java/com/example/horseracingtournamentsystem/user/dto/request/UpdateOwnerProfileRequest.java
package com.example.horseracingtournamentsystem.user.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdateOwnerProfileRequest(
        @NotBlank(message = "License number is required")
        @Size(max = 100, message = "License number must not exceed 100 characters")
        String licenseNumber,

        @NotNull(message = "Experience years is required")
        @Min(value = 0, message = "Experience years must be 0 or greater")
        Integer experienceYears,

        @NotBlank(message = "Evidence URL is required")
        @Size(max = 500, message = "Evidence URL must not exceed 500 characters")
        String evidenceUrl,

        @Size(max = 150, message = "Stable name must not exceed 150 characters")
        String stableName,

        @Size(max = 150, message = "Organization name must not exceed 150 characters")
        String organizationName,

        String bio,

        @Size(max = 500, message = "Logo URL must not exceed 500 characters")
        String logoUrl
) {
}
```

```java
// backend/src/main/java/com/example/horseracingtournamentsystem/user/repository/RoleRequestRepository.java
// add method
java.util.Optional<RoleRequest> findTopByUserIdAndRequestedRoleOrderByCreatedAtDesc(Long userId, String requestedRole);
```

```java
// backend/src/main/java/com/example/horseracingtournamentsystem/user/service/OwnerProfileService.java
// add dependencies
private final com.example.horseracingtournamentsystem.user.repository.RoleRequestRepository roleRequestRepository;

@Transactional
public OwnerProfileResponse upsertMyProfile(String email, UpdateOwnerProfileRequest request) {
    User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

    if (!isCoreProfileComplete(user)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Complete your profile before submitting owner verification");
    }

    String stableName = trimToNull(request.stableName());
    String organizationName = trimToNull(request.organizationName());
    if (stableName == null && organizationName == null) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please provide either stable name or organization name");
    }

    HorseOwnerProfile profile = ownerProfileRepository.findByUserId(user.getId())
            .orElseGet(() -> HorseOwnerProfile.pending(user));

    if (HorseOwnerProfile.STATUS_SUSPENDED.equals(profile.getStatus())) {
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Owner profile is suspended");
    }

    profile.setStableName(stableName);
    profile.setOrganizationName(organizationName);
    profile.setLicenseNumber(request.licenseNumber().trim());
    profile.setExperienceYears(request.experienceYears());
    profile.setEvidenceUrl(request.evidenceUrl().trim());
    profile.setBio(trimToNull(request.bio()));
    profile.setLogoUrl(trimToNull(request.logoUrl()));
    profile.setStatus(HorseOwnerProfile.STATUS_PENDING);
    profile.setRejectionReason(null);
    profile.setApprovedBy(null);
    profile.setApprovedAt(null);
    profile.markUpdated();

    HorseOwnerProfile saved = ownerProfileRepository.save(profile);

        if (HorseOwnerProfile.STATUS_PENDING.equals(profile.getStatus())) {
          boolean hasPending = roleRequestRepository.existsByUserEmailAndRequestedRoleAndStatus(
              user.getEmail(),
              "HORSE_OWNER",
              com.example.horseracingtournamentsystem.user.entity.RoleRequest.STATUS_PENDING
          );
          if (!hasPending) {
            roleRequestRepository.save(
                com.example.horseracingtournamentsystem.user.entity.RoleRequest.pending(
                    user,
                    "HORSE_OWNER",
                    "Owner profile submission",
                    ""
                )
            );
          }
        }

    return OwnerProfileResponse.from(saved);
}

      private boolean isCoreProfileComplete(User user) {
        return isPresent(user.getFullName())
            && isPresent(user.getPhone())
            && isPresent(user.getAddress())
            && isPresent(user.getGender())
            && user.getDateOfBirth() != null;
      }

      private boolean isPresent(String value) {
        return value != null && !value.isBlank();
      }

private String trimToNull(String value) {
    return value == null || value.isBlank() ? null : value.trim();
}
```

```java
// backend/src/main/java/com/example/horseracingtournamentsystem/user/controller/OwnerProfileController.java
// add PUT endpoint
@org.springframework.web.bind.annotation.PutMapping("/me/owner-profile")
public OwnerProfileResponse updateOwnerProfile(
        Authentication authentication,
        @jakarta.validation.Valid @org.springframework.web.bind.annotation.RequestBody UpdateOwnerProfileRequest request
) {
    return ownerProfileService.upsertMyProfile(authentication.getName(), request);
}
```

Note: add getters/setters in `HorseOwnerProfile` or use package-private setters to allow updates. Implement setters for fields above.

- [ ] **Step 4: Run test to verify it passes**

Run: `mvn test -Dtest=OwnerProfileIntegrationTest#submitOwnerProfileCreatesPendingRoleRequest`

Expected: PASS

- [ ] **Step 5: Commit**

Skip commit (user requested no git operations).

---

## Task 3: Backend status transitions + SUSPENDED restrictions

**Files:**
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/user/entity/HorseOwnerProfile.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/user/service/OwnerProfileService.java`
- Modify: `backend/src/test/java/com/example/horseracingtournamentsystem/user/OwnerProfileIntegrationTest.java`

- [ ] **Step 1: Add failing tests**

```java
@Test
void approvedProfileChangingPublicFieldsKeepsApproved() throws Exception {
    HorseOwnerProfile profile = HorseOwnerProfile.pending(user);
    org.springframework.test.util.ReflectionTestUtils.setField(profile, "status", "APPROVED");
    org.springframework.test.util.ReflectionTestUtils.setField(profile, "licenseNumber", "VN-OWNER-001");
    org.springframework.test.util.ReflectionTestUtils.setField(profile, "evidenceUrl", "/uploads/owners/evidence/e1.pdf");
    org.springframework.test.util.ReflectionTestUtils.setField(profile, "experienceYears", 2);
    ownerProfileRepository.save(profile);

    org.springframework.test.util.ReflectionTestUtils.setField(user, "fullName", "Owner User");
    org.springframework.test.util.ReflectionTestUtils.setField(user, "phone", "0901234567");
    org.springframework.test.util.ReflectionTestUtils.setField(user, "address", "HCMC");
    org.springframework.test.util.ReflectionTestUtils.setField(user, "gender", "MALE");
    org.springframework.test.util.ReflectionTestUtils.setField(
            user,
            "dateOfBirth",
            java.time.LocalDate.of(2000, 1, 1)
    );
    userRepository.save(user);

    String body = """
            {
              \"licenseNumber\": \"VN-OWNER-001\",
              \"experienceYears\": 2,
              \"evidenceUrl\": \"/uploads/owners/evidence/e1.pdf\",
              \"stableName\": \"New Stable Name\",
              \"organizationName\": \"\",
              \"bio\": \"Updated bio\",
              \"logoUrl\": \"/uploads/owners/logos/logo.png\"
            }
            """;

    mockMvc.perform(put("/api/v1/users/me/owner-profile")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(body))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("APPROVED"));
}

@Test
void approvedProfileChangingLicenseResetsPending() throws Exception {
    HorseOwnerProfile profile = HorseOwnerProfile.pending(user);
    org.springframework.test.util.ReflectionTestUtils.setField(profile, "status", "APPROVED");
    org.springframework.test.util.ReflectionTestUtils.setField(profile, "licenseNumber", "VN-OWNER-001");
    org.springframework.test.util.ReflectionTestUtils.setField(profile, "evidenceUrl", "/uploads/owners/evidence/e1.pdf");
    org.springframework.test.util.ReflectionTestUtils.setField(profile, "experienceYears", 2);
    ownerProfileRepository.save(profile);

    org.springframework.test.util.ReflectionTestUtils.setField(user, "fullName", "Owner User");
    org.springframework.test.util.ReflectionTestUtils.setField(user, "phone", "0901234567");
    org.springframework.test.util.ReflectionTestUtils.setField(user, "address", "HCMC");
    org.springframework.test.util.ReflectionTestUtils.setField(user, "gender", "MALE");
    org.springframework.test.util.ReflectionTestUtils.setField(
            user,
            "dateOfBirth",
            java.time.LocalDate.of(2000, 1, 1)
    );
    userRepository.save(user);

    String body = """
            {
              \"licenseNumber\": \"VN-OWNER-002\",
              \"experienceYears\": 2,
              \"evidenceUrl\": \"/uploads/owners/evidence/e1.pdf\",
              \"stableName\": \"Stable\",
              \"organizationName\": \"\",
              \"bio\": \"Bio\",
              \"logoUrl\": \"/uploads/owners/logos/logo.png\"
            }
            """;

    mockMvc.perform(put("/api/v1/users/me/owner-profile")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(body))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("PENDING"));
}

@Test
void suspendedProfileCannotUpdate() throws Exception {
    HorseOwnerProfile profile = HorseOwnerProfile.pending(user);
    org.springframework.test.util.ReflectionTestUtils.setField(profile, "status", "SUSPENDED");
    ownerProfileRepository.save(profile);

    org.springframework.test.util.ReflectionTestUtils.setField(user, "fullName", "Owner User");
    org.springframework.test.util.ReflectionTestUtils.setField(user, "phone", "0901234567");
    org.springframework.test.util.ReflectionTestUtils.setField(user, "address", "HCMC");
    org.springframework.test.util.ReflectionTestUtils.setField(user, "gender", "MALE");
    org.springframework.test.util.ReflectionTestUtils.setField(
            user,
            "dateOfBirth",
            java.time.LocalDate.of(2000, 1, 1)
    );
    userRepository.save(user);

    String body = """
            {
              \"licenseNumber\": \"VN-OWNER-001\",
              \"experienceYears\": 2,
              \"evidenceUrl\": \"/uploads/owners/evidence/e1.pdf\",
              \"stableName\": \"Stable\",
              \"organizationName\": \"\",
              \"bio\": \"Bio\",
              \"logoUrl\": \"/uploads/owners/logos/logo.png\"
            }
            """;

    mockMvc.perform(put("/api/v1/users/me/owner-profile")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(body))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.message").value("Owner profile is suspended"));
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `mvn test -Dtest=OwnerProfileIntegrationTest#approvedProfileChangingPublicFieldsKeepsApproved`

Expected: FAIL (status always PENDING).

- [ ] **Step 3: Implement status transition logic**

```java
// backend/src/main/java/com/example/horseracingtournamentsystem/user/service/OwnerProfileService.java
private boolean changed(String current, String next) {
    String a = current == null ? "" : current.trim();
    String b = next == null ? "" : next.trim();
    return !a.equals(b);
}

@Transactional
public OwnerProfileResponse upsertMyProfile(String email, UpdateOwnerProfileRequest request) {
    // ... existing load/validation code ...

    boolean wasApproved = HorseOwnerProfile.STATUS_APPROVED.equals(profile.getStatus());
    boolean verificationChanged = changed(profile.getLicenseNumber(), request.licenseNumber())
            || changed(profile.getEvidenceUrl(), request.evidenceUrl());

    if (HorseOwnerProfile.STATUS_REJECTED.equals(profile.getStatus())) {
        profile.setStatus(HorseOwnerProfile.STATUS_PENDING);
        profile.setRejectionReason(null);
        profile.setApprovedBy(null);
        profile.setApprovedAt(null);
    } else if (wasApproved && verificationChanged) {
        profile.setStatus(HorseOwnerProfile.STATUS_PENDING);
        profile.setRejectionReason(null);
        profile.setApprovedBy(null);
        profile.setApprovedAt(null);
    } else if (HorseOwnerProfile.STATUS_PENDING.equals(profile.getStatus())) {
        profile.setStatus(HorseOwnerProfile.STATUS_PENDING);
    } else if (wasApproved) {
        profile.setStatus(HorseOwnerProfile.STATUS_APPROVED);
    } else {
        profile.setStatus(HorseOwnerProfile.STATUS_PENDING);
    }

    // ... update fields + save ...
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `mvn test -Dtest=OwnerProfileIntegrationTest#approvedProfileChangingPublicFieldsKeepsApproved`

Expected: PASS

- [ ] **Step 5: Commit**

Skip commit (user requested no git operations).

---

## Task 4: Sync owner profile on admin approve/reject

**Files:**
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/user/service/AdminRoleRequestService.java`
- Modify: `backend/src/test/java/com/example/horseracingtournamentsystem/user/OwnerProfileIntegrationTest.java`

- [ ] **Step 1: Add failing tests (approve + reject)**

```java
@Test
void adminApprovingOwnerRoleRequestApprovesOwnerProfile() throws Exception {
    // create owner profile pending
    HorseOwnerProfile profile = HorseOwnerProfile.pending(user);
    org.springframework.test.util.ReflectionTestUtils.setField(profile, "licenseNumber", "VN-OWNER-001");
    org.springframework.test.util.ReflectionTestUtils.setField(profile, "evidenceUrl", "/uploads/owners/evidence/e1.pdf");
    ownerProfileRepository.save(profile);

    // create role request
    RoleRequest roleRequest = RoleRequest.pending(user, "HORSE_OWNER", "Owner profile submission", "");
    roleRequest = roleRequestRepository.save(roleRequest);

    String adminToken = jwtService.generateToken(user.getEmail(), Set.of("ADMIN"));

    mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post(
                    "/api/v1/admin/role-requests/{id}/approve", roleRequest.getId())
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"adminNote\":\"Approved\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("APPROVED"));

    HorseOwnerProfile updated = ownerProfileRepository.findByUserId(user.getId()).orElseThrow();
    org.junit.jupiter.api.Assertions.assertEquals("APPROVED", updated.getStatus());
}
```

```java
@Test
void adminRejectingOwnerRoleRequestRejectsOwnerProfile() throws Exception {
    HorseOwnerProfile profile = HorseOwnerProfile.pending(user);
    ownerProfileRepository.save(profile);

    RoleRequest roleRequest = RoleRequest.pending(user, "HORSE_OWNER", "Owner profile submission", "");
    roleRequest = roleRequestRepository.save(roleRequest);

    String adminToken = jwtService.generateToken(user.getEmail(), Set.of("ADMIN"));

    mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post(
                    "/api/v1/admin/role-requests/{id}/reject", roleRequest.getId())
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"reason\":\"Missing evidence\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("REJECTED"));

    HorseOwnerProfile updated = ownerProfileRepository.findByUserId(user.getId()).orElseThrow();
    org.junit.jupiter.api.Assertions.assertEquals("REJECTED", updated.getStatus());
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `mvn test -Dtest=OwnerProfileIntegrationTest#adminApprovingOwnerRoleRequestApprovesOwnerProfile`

Expected: FAIL (owner profile not updated).

- [ ] **Step 3: Update AdminRoleRequestService**

```java
// backend/src/main/java/com/example/horseracingtournamentsystem/user/service/AdminRoleRequestService.java
// add dependency
private final HorseOwnerProfileRepository ownerProfileRepository;

private void syncOwnerProfileOnApprove(RoleRequest request, User reviewer) {
    if (!"HORSE_OWNER".equals(request.getRequestedRole())) {
        return;
    }
    HorseOwnerProfile profile = ownerProfileRepository.findByUserId(request.getUser().getId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Owner profile not found"));
    profile.setStatus(HorseOwnerProfile.STATUS_APPROVED);
    profile.setApprovedBy(reviewer);
    profile.setApprovedAt(java.time.LocalDateTime.now());
    profile.setRejectionReason(null);
    profile.markUpdated();
    ownerProfileRepository.save(profile);
}

private void syncOwnerProfileOnReject(RoleRequest request, String reason) {
    if (!"HORSE_OWNER".equals(request.getRequestedRole())) {
        return;
    }
    HorseOwnerProfile profile = ownerProfileRepository.findByUserId(request.getUser().getId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Owner profile not found"));
    profile.setStatus(HorseOwnerProfile.STATUS_REJECTED);
    profile.setRejectionReason(reason);
    profile.setApprovedBy(null);
    profile.setApprovedAt(null);
    profile.markUpdated();
    ownerProfileRepository.save(profile);
}

private void assignRequestedRoleIfAvailable(RoleRequest request, User reviewer) {
    boolean hasSpecialist = UserRolePolicy.hasActiveSpecialistRole(request.getUser());
    boolean sameRole = request.getUser().getActiveRoleNames().contains(request.getRequestedRole());
    boolean allowReReview = "HORSE_OWNER".equals(request.getRequestedRole()) && sameRole;
    if (UserRolePolicy.isSpecialistRole(request.getRequestedRole()) && hasSpecialist && !allowReReview) {
        throw new ResponseStatusException(HttpStatus.CONFLICT, "User already has an active specialist role");
    }
    if (!sameRole) {
        // existing assignment logic
    }
}

// call in approve/reject
public AdminRoleRequestResponse approve(...) {
    // existing logic
    request.approve(reviewer, normalizeNote(adminNote, "Approved by admin."));
    assignRequestedRoleIfAvailable(request, reviewer);
    syncOwnerProfileOnApprove(request, reviewer);
    return AdminRoleRequestResponse.from(roleRequestRepository.save(request));
}

public AdminRoleRequestResponse reject(...) {
    // existing logic
    request.reject(reviewer, reason.trim());
    syncOwnerProfileOnReject(request, reason.trim());
    return AdminRoleRequestResponse.from(roleRequestRepository.save(request));
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `mvn test -Dtest=OwnerProfileIntegrationTest#adminApprovingOwnerRoleRequestApprovesOwnerProfile`

Expected: PASS

- [ ] **Step 5: Commit**

Skip commit (user requested no git operations).

---

## Task 5: Enforce ownerProfile APPROVED for owner operations

**Files:**
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/horse/service/HorseService.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/tournamentregistration/service/TournamentRegistrationService.java`
- Modify: `backend/src/test/java/com/example/horseracingtournamentsystem/horse/OwnerHorseIntegrationTest.java`
- Modify: `backend/src/test/java/com/example/horseracingtournamentsystem/tournamentregistration/TournamentRegistrationIntegrationTest.java`

- [ ] **Step 1: Add failing tests**

```java
// OwnerHorseIntegrationTest
@Test
void ownerCannotCreateHorseWhenOwnerProfileNotApproved() throws Exception {
    mockMvc.perform(multipart("/api/v1/owner/horses")
                    .file(imageFile())
                    .file(evidenceFile())
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + ownerToken)
                    .param("name", "Nova")
                    .param("gender", "FEMALE"))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.message").value("Owner profile must be approved before creating horses"));
}
```

```java
// TournamentRegistrationIntegrationTest
@Test
void ownerCannotRegisterTournamentWhenOwnerProfileNotApproved() throws Exception {
    mockMvc.perform(post("/api/v1/owner/tournament-registrations")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + ownerToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(registrationBody(approvedHorse)))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.message").value("Owner profile must be approved before registering tournaments"));
}
```

Also update `@BeforeEach` in both tests to insert an approved owner profile for the happy-path tests:

```java
HorseOwnerProfile profile = HorseOwnerProfile.pending(ownerUser);
org.springframework.test.util.ReflectionTestUtils.setField(profile, "status", "APPROVED");
org.springframework.test.util.ReflectionTestUtils.setField(profile, "licenseNumber", "VN-OWNER-001");
org.springframework.test.util.ReflectionTestUtils.setField(profile, "evidenceUrl", "/uploads/owners/evidence/e1.pdf");
org.springframework.test.util.ReflectionTestUtils.setField(profile, "experienceYears", 2);
ownerProfileRepository.save(profile);
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `mvn test -Dtest=OwnerHorseIntegrationTest#ownerCannotCreateHorseWhenOwnerProfileNotApproved`

Expected: FAIL (operation succeeds today).

- [ ] **Step 3: Implement approval checks in services**

```java
// HorseService.java
// add dependency
private final com.example.horseracingtournamentsystem.user.repository.HorseOwnerProfileRepository ownerProfileRepository;

private void requireOwnerProfileApproved(User owner) {
    com.example.horseracingtournamentsystem.user.entity.HorseOwnerProfile profile = ownerProfileRepository
            .findByUserId(owner.getId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT,
                    "Owner profile must be approved before creating horses"));
    if (!com.example.horseracingtournamentsystem.user.entity.HorseOwnerProfile.STATUS_APPROVED.equals(profile.getStatus())) {
        throw new ResponseStatusException(HttpStatus.CONFLICT, "Owner profile must be approved before creating horses");
    }
}

@Transactional
public HorseResponse createOwnerHorse(String email, OwnerHorseMultipartRequest req) {
    User owner = findUserByEmail(email);
    requireOwnerProfileApproved(owner);
    // existing logic
}
```

```java
// TournamentRegistrationService.java
// add dependency
private final com.example.horseracingtournamentsystem.user.repository.HorseOwnerProfileRepository ownerProfileRepository;

private void requireOwnerProfileApproved(User owner) {
    com.example.horseracingtournamentsystem.user.entity.HorseOwnerProfile profile = ownerProfileRepository
            .findByUserId(owner.getId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT,
                    "Owner profile must be approved before registering tournaments"));
    if (!com.example.horseracingtournamentsystem.user.entity.HorseOwnerProfile.STATUS_APPROVED.equals(profile.getStatus())) {
        throw new ResponseStatusException(HttpStatus.CONFLICT,
                "Owner profile must be approved before registering tournaments");
    }
}

@Transactional
public TournamentRegistrationResponse create(String email, TournamentRegistrationRequest request) {
    User owner = findUserByEmail(email);
    requireOwnerProfileApproved(owner);
    // existing logic
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `mvn test -Dtest=OwnerHorseIntegrationTest#ownerCannotCreateHorseWhenOwnerProfileNotApproved`

Expected: PASS

- [ ] **Step 5: Commit**

Skip commit (user requested no git operations).

---

## Task 6: File upload categories OWNER_EVIDENCE + STABLE_LOGO

**Files:**
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/filestorage/FileStorageService.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/filestorage/FileStorageController.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/common/upload/UploadProperties.java`
- Modify: `backend/src/main/resources/application.yml`
- Create: `backend/src/test/java/com/example/horseracingtournamentsystem/filestorage/FileUploadIntegrationTest.java`

- [ ] **Step 1: Write failing tests**

```java
package com.example.horseracingtournamentsystem.filestorage;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class FileUploadIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

        @Test
        void ownerEvidenceUploadAcceptsPdf() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "evidence.pdf",
                MediaType.APPLICATION_PDF_VALUE,
                "fake".getBytes()
        );

        mockMvc.perform(multipart("/api/v1/files/upload")
                        .file(file)
                        .param("category", "OWNER_EVIDENCE"))
                .andExpect(status().isOk())
        .andExpect(jsonPath("$.url").value(org.hamcrest.Matchers.containsString("/api/v1/files/download/owners/evidence/")));
    }

    @Test
    void ownerEvidenceUploadRejectsTextFile() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "bad.txt",
                MediaType.TEXT_PLAIN_VALUE,
                "bad".getBytes()
        );

        mockMvc.perform(multipart("/api/v1/files/upload")
                        .file(file)
                        .param("category", "OWNER_EVIDENCE"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Owner evidence must be PDF, JPG, or PNG and under 5MB."));
    }

    @Test
    void stableLogoUploadAcceptsPng() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "logo.png",
                MediaType.IMAGE_PNG_VALUE,
                "fake".getBytes()
        );

        mockMvc.perform(multipart("/api/v1/files/upload")
                        .file(file)
                        .param("category", "STABLE_LOGO"))
                .andExpect(status().isOk())
          .andExpect(jsonPath("$.url").value(org.hamcrest.Matchers.containsString("/api/v1/files/download/owners/logos/")));
    }
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `mvn test -Dtest=FileUploadIntegrationTest#ownerEvidenceUploadAcceptsPdf`

Expected: FAIL (no validation / directory mapping yet).

- [ ] **Step 3: Implement category validation in FileStorageService**

```java
// backend/src/main/java/com/example/horseracingtournamentsystem/filestorage/FileStorageService.java
package com.example.horseracingtournamentsystem.filestorage;

import com.example.horseracingtournamentsystem.common.upload.UploadProperties;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class FileStorageService {

  private static final Set<String> IMAGE_TYPES = Set.of("image/jpeg", "image/png");
  private static final Set<String> EVIDENCE_TYPES = Set.of("application/pdf", "image/jpeg", "image/png");
  private static final Map<String, String> EXTENSIONS = Map.of(
      "image/jpeg", "jpg",
      "image/png", "png",
      "application/pdf", "pdf"
  );

  private final UploadProperties uploadProperties;

  public String storeFile(MultipartFile file, String category) {
    String normalized = category == null ? "AVATAR" : category.trim().toUpperCase(Locale.ROOT);
    return switch (normalized) {
      case "OWNER_EVIDENCE" -> storeValidated(file, "owners/evidence", EVIDENCE_TYPES,
          uploadProperties.getOwnerEvidenceMaxBytes(),
          "Owner evidence must be PDF, JPG, or PNG and under 5MB.");
      case "STABLE_LOGO" -> storeValidated(file, "owners/logos", IMAGE_TYPES,
          uploadProperties.getStableLogoMaxBytes(),
          "Stable logo must be JPG or PNG and under 2MB.");
      case "AVATAR" -> storeValidated(file, "avatars", IMAGE_TYPES,
          uploadProperties.getAvatarMaxBytes(),
          "Avatar must be JPG or PNG and under 2MB.");
      default -> storeLegacy(file); // preserve existing behavior for other categories
    };
  }

  private String storeLegacy(MultipartFile file) {
    if (file == null || file.isEmpty()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File is required");
    }

    String originalFilename = org.springframework.util.StringUtils.cleanPath(file.getOriginalFilename());
    if (originalFilename.contains("..")) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid file name");
    }

    String extension = "";
    int dotIndex = originalFilename.lastIndexOf('.');
    if (dotIndex >= 0) {
      extension = originalFilename.substring(dotIndex);
    }

    String filename = UUID.randomUUID() + extension;
    Path root = uploadProperties.getRoot().toAbsolutePath().normalize();
    Path target = root.resolve(filename).normalize();

    if (!target.startsWith(root)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid upload path.");
    }

    try {
      Files.createDirectories(root);
      file.transferTo(target);
    } catch (IOException ex) {
      throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not store uploaded file.");
    }

    return filename;
  }

  private String storeValidated(
      MultipartFile file,
      String relativeDirectory,
      Set<String> allowedContentTypes,
      long maxBytes,
      String validationMessage
  ) {
    if (file == null || file.isEmpty()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, validationMessage);
    }
    String contentType = file.getContentType() == null ? "" : file.getContentType().toLowerCase(Locale.ROOT);
    if (!allowedContentTypes.contains(contentType) || file.getSize() > maxBytes) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, validationMessage);
    }
    String extension = EXTENSIONS.get(contentType);
    String filename = "file-" + UUID.randomUUID() + "." + extension;

    Path root = uploadProperties.getRoot().toAbsolutePath().normalize();
    Path directory = root.resolve(relativeDirectory).normalize();
    Path target = directory.resolve(filename).normalize();

    if (!target.startsWith(root)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid upload path.");
    }

    try {
      Files.createDirectories(directory);
      file.transferTo(target);
    } catch (IOException ex) {
      throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not store uploaded file.");
    }

    return "%s/%s".formatted(relativeDirectory.replace('\\', '/'), filename);
  }

  public org.springframework.core.io.Resource loadFile(String filename) {
    if (filename == null || filename.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid file name.");
    }

    Path root = uploadProperties.getRoot().toAbsolutePath().normalize();
    Path resolved = root.resolve(filename).normalize();
    if (!resolved.startsWith(root)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid file path.");
    }

    try {
      org.springframework.core.io.Resource resource =
          new org.springframework.core.io.UrlResource(resolved.toUri());
      if (!resource.exists() || !resource.isReadable()) {
        throw new ResponseStatusException(HttpStatus.NOT_FOUND, "File not found.");
      }
      return resource;
    } catch (java.net.MalformedURLException ex) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid file path.");
    }
  }
}
```

```java
// backend/src/main/java/com/example/horseracingtournamentsystem/filestorage/FileStorageController.java
@PostMapping("/upload")
public Map<String, String> uploadFile(
  @RequestParam("file") MultipartFile file,
  @RequestParam(value = "category", defaultValue = "AVATAR") String category
) {
    String storedPath = fileStorageService.storeFile(file, category);
    String fileDownloadUri = org.springframework.web.servlet.support.ServletUriComponentsBuilder
      .fromCurrentContextPath()
      .path("/api/v1/files/download/")
      .path(storedPath)
      .toUriString();
    return Map.of("url", fileDownloadUri);
}
```

```java
// backend/src/main/java/com/example/horseracingtournamentsystem/common/upload/UploadProperties.java
private long avatarMaxBytes = 2 * 1024 * 1024;
private long ownerEvidenceMaxBytes = 5 * 1024 * 1024;
private long stableLogoMaxBytes = 2 * 1024 * 1024;
```

```yaml
# backend/src/main/resources/application.yml
app:
  upload:
    root: ${APP_UPLOAD_ROOT:uploads}
    horse-image-max-bytes: 5242880
    horse-evidence-max-bytes: 10485760
    avatar-max-bytes: 2097152
    owner-evidence-max-bytes: 5242880
    stable-logo-max-bytes: 2097152
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `mvn test -Dtest=FileUploadIntegrationTest#ownerEvidenceUploadAcceptsPdf`

Expected: PASS

- [ ] **Step 5: Commit**

Skip commit (user requested no git operations).

---

## Task 7: DB schema updates for logo_url

**Files:**
- Modify: `database/001_create_tables.sql`
- Create: `database/004_owner_profile.sql`

- [ ] **Step 1: Update schema for fresh installs**

```sql
-- database/001_create_tables.sql
-- inside horse_owner_profiles table
logo_url VARCHAR(500) NULL,
```

- [ ] **Step 2: Add migration for existing DBs**

```sql
-- database/004_owner_profile.sql
IF COL_LENGTH('horse_owner_profiles', 'logo_url') IS NULL
  ALTER TABLE horse_owner_profiles ADD logo_url VARCHAR(500) NULL;
IF COL_LENGTH('horse_owner_profiles', 'stable_name') IS NULL
  ALTER TABLE horse_owner_profiles ADD stable_name VARCHAR(150) NULL;
IF COL_LENGTH('horse_owner_profiles', 'organization_name') IS NULL
  ALTER TABLE horse_owner_profiles ADD organization_name VARCHAR(150) NULL;
IF COL_LENGTH('horse_owner_profiles', 'license_number') IS NULL
  ALTER TABLE horse_owner_profiles ADD license_number VARCHAR(100) NULL;
IF COL_LENGTH('horse_owner_profiles', 'experience_years') IS NULL
  ALTER TABLE horse_owner_profiles ADD experience_years INT NULL;
IF COL_LENGTH('horse_owner_profiles', 'bio') IS NULL
  ALTER TABLE horse_owner_profiles ADD bio VARCHAR(1000) NULL;
IF COL_LENGTH('horse_owner_profiles', 'evidence_url') IS NULL
  ALTER TABLE horse_owner_profiles ADD evidence_url VARCHAR(500) NULL;
IF COL_LENGTH('horse_owner_profiles', 'status') IS NULL
  ALTER TABLE horse_owner_profiles ADD status VARCHAR(30) NULL;
IF COL_LENGTH('horse_owner_profiles', 'rejection_reason') IS NULL
  ALTER TABLE horse_owner_profiles ADD rejection_reason VARCHAR(500) NULL;
IF COL_LENGTH('horse_owner_profiles', 'approved_by') IS NULL
  ALTER TABLE horse_owner_profiles ADD approved_by BIGINT NULL;
IF COL_LENGTH('horse_owner_profiles', 'approved_at') IS NULL
  ALTER TABLE horse_owner_profiles ADD approved_at DATETIME2 NULL;
IF COL_LENGTH('horse_owner_profiles', 'created_at') IS NULL
  ALTER TABLE horse_owner_profiles ADD created_at DATETIME2 NULL;
IF COL_LENGTH('horse_owner_profiles', 'updated_at') IS NULL
  ALTER TABLE horse_owner_profiles ADD updated_at DATETIME2 NULL;
```

- [ ] **Step 3: Commit**

Skip commit (user requested no git operations).

---

## Task 8: Frontend types + API for owner profile

**Files:**
- Create: `frontend/src/types/ownerProfile.ts`
- Create: `frontend/src/api/ownerProfileApi.ts`
- Create: `frontend/src/api/ownerProfileApi.test.ts`

- [ ] **Step 1: Write failing API tests**

```ts
// frontend/src/api/ownerProfileApi.test.ts
import { describe, expect, it, vi } from "vitest";
import { httpClient } from "./httpClient";
import { getMyOwnerProfile, updateMyOwnerProfile } from "./ownerProfileApi";

vi.mock("./httpClient", () => ({
  httpClient: { get: vi.fn(), put: vi.fn(), post: vi.fn() },
}));

describe("ownerProfileApi", () => {
  it("fetches owner profile from /users/me/owner-profile", async () => {
    vi.mocked(httpClient.get).mockResolvedValue({ data: { status: "PENDING" } });
    const result = await getMyOwnerProfile();
    expect(httpClient.get).toHaveBeenCalledWith("/users/me/owner-profile");
    expect(result.status).toBe("PENDING");
  });

  it("updates owner profile", async () => {
    vi.mocked(httpClient.put).mockResolvedValue({ data: { status: "PENDING" } });
    const result = await updateMyOwnerProfile({
      licenseNumber: "VN-1",
      experienceYears: 2,
      evidenceUrl: "/uploads/owners/evidence/e1.pdf",
      stableName: "Stable",
      organizationName: "",
      bio: "Bio",
      logoUrl: "/uploads/owners/logos/logo.png",
    });
    expect(httpClient.put).toHaveBeenCalledWith("/users/me/owner-profile", expect.any(Object));
    expect(result.status).toBe("PENDING");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --run ownerProfileApi.test.ts`

Expected: FAIL (module not found).

- [ ] **Step 3: Implement types + API**

```ts
// frontend/src/types/ownerProfile.ts
export type OwnerProfileStatus = "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED" | "NOT_SUBMITTED";

export type OwnerProfile = {
  stableName?: string;
  organizationName?: string;
  licenseNumber?: string;
  experienceYears?: number;
  bio?: string;
  evidenceUrl?: string;
  logoUrl?: string;
  status: OwnerProfileStatus;
  rejectionReason?: string;
  approvedBy?: number;
  approvedAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type UpdateOwnerProfilePayload = {
  licenseNumber: string;
  experienceYears: number;
  evidenceUrl: string;
  stableName?: string;
  organizationName?: string;
  bio?: string;
  logoUrl?: string;
};
```

```ts
// frontend/src/api/ownerProfileApi.ts
import { httpClient } from "./httpClient";
import type { OwnerProfile, UpdateOwnerProfilePayload } from "../types/ownerProfile";

export async function getMyOwnerProfile(): Promise<OwnerProfile> {
  const response = await httpClient.get<OwnerProfile>("/users/me/owner-profile");
  return response.data;
}

export async function updateMyOwnerProfile(payload: UpdateOwnerProfilePayload): Promise<OwnerProfile> {
  const response = await httpClient.put<OwnerProfile>("/users/me/owner-profile", payload);
  return response.data;
}

export async function uploadOwnerEvidence(file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await httpClient.post<{ url: string }>("/files/upload?category=OWNER_EVIDENCE", formData);
  return response.data;
}

export async function uploadStableLogo(file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await httpClient.post<{ url: string }>("/files/upload?category=STABLE_LOGO", formData);
  return response.data;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- --run ownerProfileApi.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

Skip commit (user requested no git operations).

---

## Task 9: Frontend /owner/profile page + route + nav

**Files:**
- Create: `frontend/src/pages/owner/OwnerProfilePage.tsx`
- Create: `frontend/src/pages/owner/OwnerProfilePage.test.tsx`
- Modify: `frontend/src/routes/AppRouter.tsx`
- Modify: `frontend/src/layouts/OwnerLayout.tsx`

- [ ] **Step 1: Write failing UI test**

```tsx
// frontend/src/pages/owner/OwnerProfilePage.test.tsx
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { OwnerProfilePage } from "./OwnerProfilePage";
import * as profileApi from "../../api/profileApi";
import * as ownerProfileApi from "../../api/ownerProfileApi";

vi.mock("../../api/profileApi", () => ({ getMyProfile: vi.fn() }));
vi.mock("../../api/ownerProfileApi", () => ({
  getMyOwnerProfile: vi.fn(),
  updateMyOwnerProfile: vi.fn(),
  uploadOwnerEvidence: vi.fn(),
  uploadStableLogo: vi.fn(),
}));

describe("OwnerProfilePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(profileApi.getMyProfile).mockResolvedValue({
      fullName: "Owner User",
      phone: "0901234567",
      gender: "MALE",
      dateOfBirth: "2000-01-01",
      address: "HCMC",
      profileCompleted: true,
    } as any);
    vi.mocked(ownerProfileApi.getMyOwnerProfile).mockRejectedValue({ response: { status: 404 } });
  });

  it("shows NOT_SUBMITTED state and disables submit when missing evidence", async () => {
    render(
      <MemoryRouter>
        <OwnerProfilePage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: /owner profile/i })).toBeInTheDocument();
    expect(screen.getByText(/not submitted/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /submit for verification/i })).toBeDisabled();
  });

  it("submits when required fields are filled", async () => {
    vi.mocked(ownerProfileApi.updateMyOwnerProfile).mockResolvedValue({ status: "PENDING" } as any);
    vi.mocked(ownerProfileApi.uploadOwnerEvidence).mockResolvedValue({
      url: "/api/v1/files/download/owners/evidence/e1.pdf",
    });

    render(
      <MemoryRouter>
        <OwnerProfilePage />
      </MemoryRouter>,
    );

    fireEvent.change(await screen.findByLabelText(/license number/i), {
      target: { value: "VN-OWNER-001" },
    });
    fireEvent.change(screen.getByLabelText(/experience years/i), { target: { value: "3" } });
    fireEvent.change(screen.getByLabelText(/stable name/i), { target: { value: "Sunset Stable" } });
    fireEvent.change(screen.getByLabelText(/evidence document/i), {
      target: { files: [new File(["pdf"], "evidence.pdf", { type: "application/pdf" })] },
    });

    await waitFor(() => {
      expect(ownerProfileApi.uploadOwnerEvidence).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByRole("button", { name: /submit for verification/i }));

    await waitFor(() => {
      expect(ownerProfileApi.updateMyOwnerProfile).toHaveBeenCalled();
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --run OwnerProfilePage.test.tsx`

Expected: FAIL (page missing).

- [ ] **Step 3: Implement OwnerProfilePage (split layout, soft-block)**

```tsx
// frontend/src/pages/owner/OwnerProfilePage.tsx
import { type FormEvent, useEffect, useMemo, useState } from "react";

import { getMyProfile } from "../../api/profileApi";
import {
  getMyOwnerProfile,
  updateMyOwnerProfile,
  uploadOwnerEvidence,
  uploadStableLogo,
} from "../../api/ownerProfileApi";
import { OwnerLayout } from "../../layouts/OwnerLayout";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import type { OwnerProfile, OwnerProfileStatus } from "../../types/ownerProfile";
import { getApiErrorMessage } from "../../utils/apiError";

const emptyProfile: OwnerProfile = { status: "NOT_SUBMITTED" };

export function OwnerProfilePage() {
  useDocumentTitle("Owner profile");

  const [coreProfile, setCoreProfile] = useState<any>(null);
  const [ownerProfile, setOwnerProfile] = useState<OwnerProfile>(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [licenseNumber, setLicenseNumber] = useState("");
  const [experienceYears, setExperienceYears] = useState(0);
  const [stableName, setStableName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [bio, setBio] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      try {
        const [core, owner] = await Promise.all([
          getMyProfile(),
          getMyOwnerProfile().catch((error) => {
            if (error?.response?.status === 404) {
              return emptyProfile;
            }
            throw error;
          }),
        ]);

        if (!active) return;
        setCoreProfile(core);
        setOwnerProfile(owner);
        setLicenseNumber(owner.licenseNumber || "");
        setExperienceYears(owner.experienceYears || 0);
        setStableName(owner.stableName || "");
        setOrganizationName(owner.organizationName || "");
        setBio(owner.bio || "");
        setEvidenceUrl(owner.evidenceUrl || "");
        setLogoUrl(owner.logoUrl || "");
      } catch (error) {
        if (active) {
          setMessage(getApiErrorMessage(error, "Could not load owner profile."));
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  const missingCore = useMemo(() => {
    if (!coreProfile) return ["Full name", "Phone", "Address", "Date of birth", "Gender"];
    const missing: string[] = [];
    if (!coreProfile.fullName) missing.push("Full name");
    if (!coreProfile.phone) missing.push("Phone");
    if (!coreProfile.address) missing.push("Address");
    if (!coreProfile.dateOfBirth) missing.push("Date of birth");
    if (!coreProfile.gender) missing.push("Gender");
    return missing;
  }, [coreProfile]);

  const readiness = useMemo(() => {
    const stableReady = Boolean(stableName.trim() || organizationName.trim());
    return {
      coreReady: missingCore.length === 0,
      licenseReady: Boolean(licenseNumber.trim()),
      evidenceReady: Boolean(evidenceUrl.trim()),
      stableReady,
    };
  }, [missingCore, licenseNumber, evidenceUrl, stableName, organizationName]);

  const submitDisabled =
    !readiness.coreReady || !readiness.licenseReady || !readiness.evidenceReady || !readiness.stableReady;

  const displayName = stableName.trim() || organizationName.trim();
  const status: OwnerProfileStatus = ownerProfile.status;

  const handleEvidenceChange = async (file: File | null) => {
    if (!file) return;
    if (!["application/pdf", "image/jpeg", "image/png"].includes(file.type)) {
      setMessage("Evidence must be PDF, JPG, or PNG.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMessage("Evidence must be 5MB or smaller.");
      return;
    }
    setMessage(null);
    setEvidenceFile(file);
    const upload = await uploadOwnerEvidence(file);
    setEvidenceUrl(upload.url);
  };

  const handleLogoChange = async (file: File | null) => {
    if (!file) return;
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      setMessage("Logo must be JPG or PNG.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setMessage("Logo must be 2MB or smaller.");
      return;
    }
    setMessage(null);
    setLogoFile(file);
    const upload = await uploadStableLogo(file);
    setLogoUrl(upload.url);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitDisabled) return;

    const verificationChanged =
      ownerProfile.status === "APPROVED" &&
      (
        (ownerProfile.licenseNumber || "") !== licenseNumber.trim() ||
        (ownerProfile.evidenceUrl || "") !== evidenceUrl.trim()
      );

    if (ownerProfile.status === "APPROVED" && verificationChanged) {
      const confirmed = window.confirm("Changing verification information will require admin review again.");
      if (!confirmed) return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const updated = await updateMyOwnerProfile({
        licenseNumber: licenseNumber.trim(),
        experienceYears,
        evidenceUrl: evidenceUrl.trim(),
        stableName: stableName.trim(),
        organizationName: organizationName.trim(),
        bio: bio.trim(),
        logoUrl: logoUrl.trim(),
      });
      setOwnerProfile(updated);
      setMessage("Owner profile submitted for review.");
    } catch (error) {
      setMessage(getApiErrorMessage(error, "Could not submit owner profile."));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <OwnerLayout>
        <div className="rounded-lg border border-slate-200 bg-white py-16 text-center text-sm font-bold text-slate-500">
          Loading owner profile...
        </div>
      </OwnerLayout>
    );
  }

  return (
    <OwnerLayout>
      <section className="space-y-6" aria-labelledby="owner-profile-title">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.14em] text-[#006d5b]">Owner verification</p>
          <h1 id="owner-profile-title" className="mt-2 text-4xl font-black tracking-tight">Owner Profile</h1>
          <p className="mt-2 max-w-3xl text-base leading-7 text-slate-600">
            Submit verification details and manage your public stable presence.
          </p>
        </div>

        {message && (
          <p className="rounded-md border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700" role="status">
            {message}
          </p>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Personal identity (read-only) */}
            <section className="rounded-lg border border-slate-200 bg-white p-5">
              <h2 className="text-xl font-black">Personal identity</h2>
              <p className="mt-2 text-sm text-slate-600">Manage these fields from /profile.</p>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="text-sm font-bold text-slate-700">Full name: {coreProfile?.fullName || "-"}</div>
                <div className="text-sm font-bold text-slate-700">Phone: {coreProfile?.phone || "-"}</div>
                <div className="text-sm font-bold text-slate-700">Address: {coreProfile?.address || "-"}</div>
                <div className="text-sm font-bold text-slate-700">Date of birth: {coreProfile?.dateOfBirth || "-"}</div>
                <div className="text-sm font-bold text-slate-700">Gender: {coreProfile?.gender || "-"}</div>
              </div>
              {missingCore.length > 0 && (
                <div className="mt-4 border-l-4 border-amber-400 bg-amber-50 p-4 text-sm font-bold text-amber-900">
                  Complete your personal profile before submitting owner verification. Missing: {missingCore.join(", ")}
                  <div className="mt-2">
                    <a className="underline" href="/profile">Go to profile</a>
                  </div>
                </div>
              )}
            </section>

            {/* Verification profile */}
            <section className="rounded-lg border border-slate-200 bg-white p-5">
              <h2 className="text-xl font-black">Verification profile</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <label className="text-sm font-bold text-slate-700">
                  License number
                  <input
                    className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    disabled={status === "SUSPENDED"}
                  />
                </label>
                <label className="text-sm font-bold text-slate-700">
                  Experience years
                  <input
                    className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2"
                    type="number"
                    min={0}
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(Number(e.target.value))}
                    disabled={status === "SUSPENDED"}
                  />
                </label>
              </div>
              <label className="mt-4 block text-sm font-bold text-slate-700">
                Evidence document (PDF/JPG/PNG, max 5MB)
                <input
                  className="mt-2 block w-full text-sm"
                  type="file"
                  accept="application/pdf,image/jpeg,image/png"
                  onChange={(e) => handleEvidenceChange(e.target.files?.[0] || null)}
                  disabled={status === "SUSPENDED"}
                />
              </label>
              {evidenceUrl && (
                <div className="mt-2 text-sm font-bold text-slate-600">Uploaded: {evidenceUrl}</div>
              )}
            </section>

            {/* Public stable profile */}
            <section className="rounded-lg border border-slate-200 bg-white p-5">
              <h2 className="text-xl font-black">Public stable profile</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <label className="text-sm font-bold text-slate-700">
                  Stable name
                  <input
                    className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2"
                    value={stableName}
                    onChange={(e) => setStableName(e.target.value)}
                    disabled={status === "SUSPENDED"}
                  />
                </label>
                <label className="text-sm font-bold text-slate-700">
                  Organization name
                  <input
                    className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    disabled={status === "SUSPENDED"}
                  />
                </label>
              </div>
              <label className="mt-4 block text-sm font-bold text-slate-700">
                Bio
                <textarea
                  className="mt-2 min-h-[120px] w-full rounded-md border border-slate-300 px-3 py-2"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  disabled={status === "SUSPENDED"}
                />
              </label>
              <label className="mt-4 block text-sm font-bold text-slate-700">
                Stable logo (JPG/PNG, max 2MB)
                <input
                  className="mt-2 block w-full text-sm"
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={(e) => handleLogoChange(e.target.files?.[0] || null)}
                  disabled={status === "SUSPENDED"}
                />
              </label>
            </section>

            <button
              className="inline-flex min-h-12 items-center justify-center rounded-md bg-[#006d5b] px-6 text-sm font-black text-white disabled:opacity-50"
              disabled={submitDisabled || saving || status === "SUSPENDED"}
              type="submit"
            >
              Submit for verification
            </button>
          </form>

          {/* Sticky panel */}
          <aside className="space-y-4 lg:sticky lg:top-6">
            <div className="rounded-lg border border-slate-200 bg-white p-5">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Status</p>
              <p className="mt-2 text-2xl font-black">{status}</p>
              {status === "REJECTED" && ownerProfile.rejectionReason && (
                <p className="mt-2 text-sm font-bold text-rose-700">{ownerProfile.rejectionReason}</p>
              )}
              {status === "SUSPENDED" && (
                <p className="mt-2 text-sm font-bold text-rose-700">
                  Your owner profile has been suspended. Please contact the administrator.
                </p>
              )}
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Submission checklist</p>
              <ul className="mt-3 space-y-2 text-sm font-bold">
                <li>{readiness.coreReady ? "✅" : "❌"} Personal profile completed</li>
                <li>{readiness.licenseReady ? "✅" : "❌"} License number provided</li>
                <li>{readiness.evidenceReady ? "✅" : "❌"} Evidence uploaded</li>
                <li>{readiness.stableReady ? "✅" : "❌"} Stable or organization name provided</li>
              </ul>
              {status === "PENDING" && (
                <p className="mt-3 text-sm font-bold text-amber-700">⏳ Waiting for admin approval</p>
              )}
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Public preview</p>
              <div className="mt-3 flex items-center gap-3">
                {logoUrl ? (
                  <img className="h-12 w-12 rounded-full object-cover" alt="Stable logo" src={logoUrl} />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-slate-200" aria-hidden="true" />
                )}
                <div>
                  <p className="text-sm font-black">{displayName || "Stable name"}</p>
                  <p className="text-xs text-slate-600">{bio || "Public bio preview"}</p>
                </div>
              </div>
              {status === "APPROVED" && (
                <span className="mt-3 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">
                  Approved
                </span>
              )}
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Review history</p>
              <p className="mt-2 text-sm font-bold text-slate-700">Submitted: {ownerProfile.createdAt || "-"}</p>
              <p className="mt-1 text-sm font-bold text-slate-700">Approved: {ownerProfile.approvedAt || "-"}</p>
            </div>
          </aside>
        </div>
      </section>
    </OwnerLayout>
  );
}
```

- [ ] **Step 4: Update routes + nav**

```tsx
// frontend/src/routes/AppRouter.tsx
import { OwnerProfilePage } from "../pages/owner/OwnerProfilePage";

// add route
<Route path="owner/profile" element={authRoute(<OwnerProfilePage />)} />
// Do not add a HORSE_OWNER role guard to this route.
```

```tsx
// frontend/src/layouts/OwnerLayout.tsx
const ownerNavItems = [
  { label: "Dashboard", href: "/owner/dashboard", icon: Gauge },
  { label: "Horse Roster", href: "/owner/horses", icon: Trophy },
  { label: "Tournament Registrations", href: "/owner/registrations", icon: ClipboardList },
  { label: "Owner Profile", href: "/owner/profile", icon: User },
  { label: "Personal Profile", href: "/profile", icon: User },
];
```

- [ ] **Step 5: Run UI tests to verify they pass**

Run: `npm test -- --run OwnerProfilePage.test.tsx`

Expected: PASS

- [ ] **Step 6: Commit**

Skip commit (user requested no git operations).

---

## Self-Review Checklist

**Spec coverage:**
- /owner/profile accessible for authenticated users: covered in AppRouter + OwnerLayout.
- Single admin approval via role request: covered in AdminRoleRequestService sync tasks.
- Status transitions and SUSPENDED: covered in OwnerProfileService + tests.
- Upload categories and limits: covered in FileStorageService + UploadProperties.
- Owner operations require role + approved profile: covered in HorseService + TournamentRegistrationService.
- UI split layout + sticky panel + checklist: covered in OwnerProfilePage.

**Placeholder scan:** no TODO/TBD language; all steps have concrete code.

**Type consistency:** request/response fields match spec and frontend types (licenseNumber, experienceYears, evidenceUrl, stableName, organizationName, bio, logoUrl).

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-29-owner-profile.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
