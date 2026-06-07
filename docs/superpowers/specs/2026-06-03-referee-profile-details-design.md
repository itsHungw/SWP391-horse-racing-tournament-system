# Referee Profile Details Integration Design

Date: 2026-06-03
Status: APPROVED

## Goal

Enhance the Referee Profile dashboard page (`/referee`) to display all details of the logged-in referee. This includes:
1. **General user account details** (Avatar, Full Name, Email, Phone Number, Gender, Date of Birth, Address, and Verification Badges).
2. **Referee-specific regulatory credentials** (License Number, Certification, Years of Experience, Biography/Bio, and Approval Status) fetched from the `referee_profiles` database table.
3. A clean **Bento Grid layout** showing these details side-by-side above the monthly race calendar.
4. **Read-Only Dashboard with Account Redirection**: Referee-specific credentials remain locked and read-only. General user settings can be updated by clicking a "Manage Account Settings" button that redirects the referee to the main `/profile` page.

---

## Proposed Changes

### Backend Component

We will map the database table `referee_profiles` to a JPA entity and join it to the `User` entity, ensuring optimal performance by fetching it eagerly when retrieving profiles.

#### 1. [NEW] [RefereeProfileStatus.java](file:///d:/FBT/5/SWP391/SWP391-horse-racing-tournament-system-1/backend/src/main/java/com/example/horseracingtournamentsystem/user/entity/RefereeProfileStatus.java)
An enum representing the official status constraint in the database:
```java
package com.example.horseracingtournamentsystem.user.entity;

public enum RefereeProfileStatus {
    PENDING, ACTIVE, REJECTED, SUSPENDED, INACTIVE
}
```

#### 2. [NEW] [RefereeProfile.java](file:///d:/FBT/5/SWP391/SWP391-horse-racing-tournament-system-1/backend/src/main/java/com/example/horseracingtournamentsystem/user/entity/RefereeProfile.java)
JPA entity mapping the `referee_profiles` table:
```java
package com.example.horseracingtournamentsystem.user.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "referee_profiles")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RefereeProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "license_number", length = 100)
    private String licenseNumber;

    @Column(name = "certification", length = 255)
    private String certification;

    @Column(name = "experience_years", nullable = false)
    private int experienceYears;

    @Lob
    @Column(name = "bio")
    private String bio;

    @Column(name = "evidence_url", length = 500)
    private String evidenceUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private RefereeProfileStatus status;

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
}
```

#### 3. [MODIFY] [User.java](file:///d:/FBT/5/SWP391/SWP391-horse-racing-tournament-system-1/backend/src/main/java/com/example/horseracingtournamentsystem/user/entity/User.java)
Map the inverse side of the `@OneToOne` association:
```java
    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private RefereeProfile refereeProfile;
```

#### 4. [NEW] [RefereeProfileInfo.java](file:///d:/FBT/5/SWP391/SWP391-horse-racing-tournament-system-1/backend/src/main/java/com/example/horseracingtournamentsystem/user/dto/response/RefereeProfileInfo.java)
DTO to expose public, non-sensitive referee details:
```java
package com.example.horseracingtournamentsystem.user.dto.response;

import com.example.horseracingtournamentsystem.user.entity.RefereeProfile;
import java.time.LocalDateTime;

public record RefereeProfileInfo(
        String licenseNumber,
        String certification,
        int experienceYears,
        String bio,
        String status,
        LocalDateTime approvedAt
) {
    public static RefereeProfileInfo from(RefereeProfile profile) {
        if (profile == null) return null;
        return new RefereeProfileInfo(
                profile.getLicenseNumber(),
                profile.getCertification(),
                profile.getExperienceYears(),
                profile.getBio(),
                profile.getStatus().name(),
                profile.getApprovedAt()
        );
    }
}
```

#### 5. [MODIFY] [UserProfileResponse.java](file:///d:/FBT/5/SWP391/SWP391-horse-racing-tournament-system-1/backend/src/main/java/com/example/horseracingtournamentsystem/user/dto/response/UserProfileResponse.java)
Add `refereeProfile` field to profile response:
```java
public record UserProfileResponse(
        String fullName,
        String phone,
        String gender,
        LocalDate dateOfBirth,
        String address,
        String avatarUrl,
        Set<String> roles,
        boolean profileCompleted,
        boolean phoneVerified,
        boolean ageVerified,
        RefereeProfileInfo refereeProfile
) {
    public static UserProfileResponse from(User user) {
        return new UserProfileResponse(
                user.getFullName(),
                user.getPhone(),
                user.getGender(),
                user.getDateOfBirth(),
                user.getAddress(),
                user.getAvatarUrl(),
                user.getActiveRoleNames(),
                user.isProfileCompleted(),
                user.isPhoneVerified(),
                user.isAgeVerified(),
                RefereeProfileInfo.from(user.getRefereeProfile())
        );
    }
}
```

#### 6. [MODIFY] [UserRepository.java](file:///d:/FBT/5/SWP391/SWP391-horse-racing-tournament-system-1/backend/src/main/java/com/example/horseracingtournamentsystem/user/repository/UserRepository.java)
Prevent N+1 lazy-loading issues by eagerly fetching the referee profile and roles during profile retrieval:
```java
    @EntityGraph(attributePaths = {"userRoles", "userRoles.role", "refereeProfile"})
    Optional<User> findWithUserRolesByEmail(String email);
```

---

### Frontend Component

We will update the frontend profile models and display both cards side-by-side on the `/referee` profile page.

#### 1. [MODIFY] [profile.ts](file:///d:/FBT/5/SWP391/SWP391-horse-racing-tournament-system-1/frontend/src/types/profile.ts)
Extend types with nested referee details:
```typescript
export interface RefereeProfileInfo {
  licenseNumber: string;
  certification: string;
  experienceYears: number;
  bio: string;
  status: "PENDING" | "ACTIVE" | "REJECTED" | "SUSPENDED" | "INACTIVE";
  approvedAt?: string;
}

export interface Profile {
  fullName: string;
  phone: string;
  gender?: string;
  dateOfBirth?: string;
  address: string;
  avatarUrl?: string;
  roles?: string[];
  profileCompleted: boolean;
  phoneVerified: boolean;
  ageVerified: boolean;
  refereeProfile?: RefereeProfileInfo;
}
```

#### 2. [MODIFY] [RefereeProfileDashboardPage.tsx](file:///d:/FBT/5/SWP391/SWP391-horse-racing-tournament-system-1/frontend/src/pages/referee/RefereeProfileDashboardPage.tsx)
- Call `getMyProfile()` from `profileApi.ts` inside a `useEffect` hook to load full details.
- Render Bento Grid Layout:
  - **Left Item (General User Profile Card)**:
    - User Avatar image (or initials circle if null).
    - Full Name, Email, Phone, Gender, Date of Birth, Address.
    - Status Badges: Profile Completed, Phone Verified, Age Verified.
    - "Manage Account Settings" button: Links to `/profile`.
  - **Right Item (Official Credentials Card)**:
    - Certification header (e.g., *FEI Certified Steward*).
    - Biography quote with a `line-clamp-4` limit and hover-expand or tooltip if needed.
    - Metadata table: License number, Years of Experience, Approved Date, and Status Badge.
  - Set specific color styles for the **Status Badge**:
    - `ACTIVE`: `bg-emerald-50 text-emerald-700 border-emerald-200`
    - `PENDING`: `bg-amber-50 text-amber-700 border-amber-200`
    - `SUSPENDED` / `REJECTED`: `bg-rose-50 text-rose-700 border-rose-200`
    - `INACTIVE`: `bg-slate-50 text-slate-700 border-slate-200`

---

## Verification Plan

### Automated Tests

#### Backend Tests
- Update `UserProfileIntegrationTest.java`:
  - Verify that a user profile request for a referee successfully returns the nested `refereeProfile` DTO.
  - Verify that a non-referee user request returns a null `refereeProfile` field.

#### Frontend Tests
- Update `RefereeProfileDashboardPage.test.tsx`:
  - Mock `getMyProfile()` to return a complete profile with `refereeProfile` credentials.
  - Assert that all general details, credentials, and verification status badges are rendered correctly.
  - Verify the link redirect path of the "Manage Account Settings" button.

### Manual Verification
1. Start database, backend, and frontend dev server.
2. Log in as a referee (e.g., `referee@demo.local`).
3. Access `/referee` workspace and verify the Bento Grid displays the correct avatar, name, email, credentials, and work calendar.
4. Click the "Manage Account Settings" button and verify it navigates to the user `/profile` page, letting you edit phone or address.
5. Edit phone or address, save, navigate back to `/referee` and check that the dashboard shows the updated values instantly.
