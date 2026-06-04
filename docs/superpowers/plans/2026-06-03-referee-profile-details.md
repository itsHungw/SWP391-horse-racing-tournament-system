# Referee Profile Details Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a real-time data flow that retrieves referee-specific credentials (license, certification, experience, bio) from the database and displays them alongside general account details in a clean Bento Grid layout on the Referee Profile Dashboard, keeping credentials read-only and general account settings editable via a link to `/profile`.

**Architecture:** Extend backend `UserProfileResponse` DTO to return a nested `RefereeProfileInfo` DTO for referees. Join and fetch `RefereeProfile` using `@EntityGraph` in `UserRepository` to avoid N+1 queries. Call `getMyProfile()` in frontend dashboard page in a `useEffect` hook and render the details side-by-side.

**Tech Stack:** Java 21, Spring Boot, JPA/Hibernate, SQL Server, React 19, TypeScript, Tailwind CSS, Vitest.

---

## File Structure

- **Create**:
  - `backend/src/main/java/com/example/horseracingtournamentsystem/user/entity/RefereeProfileStatus.java` (Enum representing official status)
  - `backend/src/main/java/com/example/horseracingtournamentsystem/user/entity/RefereeProfile.java` (JPA Entity for referee credentials)
  - `backend/src/main/java/com/example/horseracingtournamentsystem/user/dto/response/RefereeProfileInfo.java` (Record for nested DTO response)
- **Modify**:
  - `backend/src/main/java/com/example/horseracingtournamentsystem/user/entity/User.java` (Establish @OneToOne association)
  - `backend/src/main/java/com/example/horseracingtournamentsystem/user/repository/UserRepository.java` (Add query with EntityGraph)
  - `backend/src/main/java/com/example/horseracingtournamentsystem/user/dto/response/UserProfileResponse.java` (Include referee credentials in response)
  - `backend/src/test/java/com/example/horseracingtournamentsystem/user/UserProfileIntegrationTest.java` (Verify integration flow in backend)
  - `frontend/src/types/profile.ts` (Extend TypeScript types)
  - `frontend/src/pages/referee/RefereeProfileDashboardPage.tsx` (Bento Grid layout UI and API hook integration)
  - `frontend/src/pages/referee/RefereeProfileDashboardPage.test.tsx` (Verify Bento Grid dashboard content and link button)

---

## Tasks

### Task 1: Backend Entity Mapping

**Files:**
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/user/entity/RefereeProfileStatus.java`
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/user/entity/RefereeProfile.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/user/entity/User.java`

- [ ] **Step 1: Create the RefereeProfileStatus enum**
  Write to `backend/src/main/java/com/example/horseracingtournamentsystem/user/entity/RefereeProfileStatus.java`:
  ```java
  package com.example.horseracingtournamentsystem.user.entity;

  public enum RefereeProfileStatus {
      PENDING, ACTIVE, REJECTED, SUSPENDED, INACTIVE
  }
  ```

- [ ] **Step 2: Create the RefereeProfile JPA Entity**
  Write to `backend/src/main/java/com/example/horseracingtournamentsystem/user/entity/RefereeProfile.java`:
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

      public static RefereeProfile create(User user, String licenseNumber, String certification, int experienceYears, String bio, RefereeProfileStatus status) {
          RefereeProfile profile = new RefereeProfile();
          profile.user = user;
          profile.licenseNumber = licenseNumber;
          profile.certification = certification;
          profile.experienceYears = experienceYears;
          profile.bio = bio;
          profile.status = status;
          profile.createdAt = LocalDateTime.now();
          return profile;
      }
  }
  ```

- [ ] **Step 3: Update User entity with association**
  Modify `backend/src/main/java/com/example/horseracingtournamentsystem/user/entity/User.java` (insert near other fields, e.g., around line 91):
  ```java
      @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
      private RefereeProfile refereeProfile;
  ```

- [ ] **Step 4: Verify Compilation**
  Run:
  ```powershell
  $env:JAVA_HOME="C:\Program Files\Java\jdk-21.0.10"; $env:Path="C:\Program Files\Java\jdk-21.0.10\bin;$env:Path"; .\mvnw.cmd clean compile
  ```
  Expected: BUILD SUCCESS

- [ ] **Step 5: Commit changes**
  ```powershell
  git add backend/src/main/java/com/example/horseracingtournamentsystem/user/entity/
  git commit -m "feat: add RefereeProfile entity and User association"
  ```

---

### Task 2: Data Pipeline & Query Optimization

**Files:**
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/user/repository/UserRepository.java`
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/user/dto/response/RefereeProfileInfo.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/user/dto/response/UserProfileResponse.java`
- Modify: `backend/src/test/java/com/example/horseracingtournamentsystem/user/UserProfileIntegrationTest.java`

- [ ] **Step 1: Optimize UserRepository query**
  Modify `backend/src/main/java/com/example/horseracingtournamentsystem/user/repository/UserRepository.java` (replace the `@EntityGraph` annotation on line 12):
  ```java
      @EntityGraph(attributePaths = {"userRoles", "userRoles.role", "refereeProfile"})
      Optional<User> findWithUserRolesByEmail(String email);
  ```

- [ ] **Step 2: Create nested record RefereeProfileInfo**
  Write to `backend/src/main/java/com/example/horseracingtournamentsystem/user/dto/response/RefereeProfileInfo.java`:
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
          if (profile == null) {
              return null;
          }
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

- [ ] **Step 3: Update UserProfileResponse**
  Replace `backend/src/main/java/com/example/horseracingtournamentsystem/user/dto/response/UserProfileResponse.java` to support the referee details:
  ```java
  package com.example.horseracingtournamentsystem.user.dto.response;

  import com.example.horseracingtournamentsystem.user.entity.User;
  import java.time.LocalDate;
  import java.util.Set;

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

- [ ] **Step 4: Update integration tests**
  Modify `backend/src/test/java/com/example/horseracingtournamentsystem/user/UserProfileIntegrationTest.java` (add a test to verify nested profile details):
  First, imports:
  ```java
  import com.example.horseracingtournamentsystem.user.entity.RefereeProfile;
  import com.example.horseracingtournamentsystem.user.entity.RefereeProfileStatus;
  import org.springframework.test.util.ReflectionTestUtils;
  import org.junit.jupiter.api.AfterEach;
  ```
  In `setUp()` (empty out referee profiles before running):
  ```java
      @Autowired
      private jakarta.persistence.EntityManager entityManager;
  ```
  Add a transaction helper or `deleteAll()` for referee profiles. Wait, `roleRequestRepository.deleteAll(); userRoleRepository.deleteAll(); roleRepository.deleteAll(); userRepository.deleteAll();` is done in `setUp()`. Because `User` has cascade-delete/no constraint issues, deleting `userRepository` cleans `referee_profiles` if mapped correctly or we can delete manually:
  Let's add a test:
  ```java
      @Test
      void refereeUserCanGetProfileWithRefereeInfo() throws Exception {
          Role refereeRole = roleRepository.save(Role.of("REFEREE", "Referee"));
          userRoleRepository.save(com.example.horseracingtournamentsystem.user.entity.UserRole.active(user, refereeRole, user));
          
          RefereeProfile refProfile = RefereeProfile.create(
              user,
              "REF-2026-X89",
              "FEI Certified Steward",
              8,
              "Steward bio details",
              RefereeProfileStatus.ACTIVE
          );
          ReflectionTestUtils.setField(user, "refereeProfile", refProfile);
          userRepository.save(user);

          String refToken = jwtService.generateToken(user.getEmail(), Set.of("REFEREE"));

          mockMvc.perform(get("/api/v1/users/me/profile")
                          .header(HttpHeaders.AUTHORIZATION, "Bearer " + refToken))
                  .andExpect(status().isOk())
                  .andExpect(jsonPath("$.fullName").value("Minh Quan"))
                  .andExpect(jsonPath("$.refereeProfile").exists())
                  .andExpect(jsonPath("$.refereeProfile.licenseNumber").value("REF-2026-X89"))
                  .andExpect(jsonPath("$.refereeProfile.certification").value("FEI Certified Steward"))
                  .andExpect(jsonPath("$.refereeProfile.experienceYears").value(8))
                  .andExpect(jsonPath("$.refereeProfile.status").value("ACTIVE"));
      }
  ```

- [ ] **Step 5: Run integration tests**
  Run:
  ```powershell
  $env:JAVA_HOME="C:\Program Files\Java\jdk-21.0.10"; $env:Path="C:\Program Files\Java\jdk-21.0.10\bin;$env:Path"; .\mvnw.cmd test
  ```
  Expected: BUILD SUCCESS (All tests pass)

- [ ] **Step 6: Commit changes**
  ```powershell
  git add backend/src/main/java/com/example/horseracingtournamentsystem/user/repository/UserRepository.java backend/src/main/java/com/example/horseracingtournamentsystem/user/dto/response/RefereeProfileInfo.java backend/src/main/java/com/example/horseracingtournamentsystem/user/dto/response/UserProfileResponse.java backend/src/test/java/com/example/horseracingtournamentsystem/user/UserProfileIntegrationTest.java
  git commit -m "feat: implement Optimized Referee Profile data pipeline & integration tests"
  ```

---

### Task 3: Frontend Model Synchronisation & Test Setup

**Files:**
- Modify: `frontend/src/types/profile.ts`
- Modify: `frontend/src/pages/referee/RefereeProfileDashboardPage.test.tsx`

- [ ] **Step 1: Sync Frontend Profile interface**
  Replace `frontend/src/types/profile.ts` with:
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

  export interface UpdateProfileRequest {
    fullName: string;
    phone: string;
    gender: string;
    dateOfBirth: string;
    address: string;
    avatarUrl?: string;
  }
  ```

- [ ] **Step 2: Add failing tests for Bento details display**
  Replace `frontend/src/pages/referee/RefereeProfileDashboardPage.test.tsx` to expect profile details rendering and redirects:
  ```tsx
  import { fireEvent, render, screen, waitFor } from "@testing-library/react";
  import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
  import { describe, expect, it, vi } from "vitest";
  import * as refereeApi from "../../api/refereeApi";
  import * as profileApi from "../../api/profileApi";
  import { RefereeProfileDashboardPage } from "./RefereeProfileDashboardPage";

  vi.mock("../../api/refereeApi");
  vi.mock("../../api/profileApi");
  vi.mock("../../hooks/useClientSession", () => ({
    useClientSession: () => ({
      session: {
        email: "referee@equine.com",
        fullName: "Julian Sterling",
        roles: ["REFEREE"],
      },
    }),
  }));

  const mockRaces = [
    {
      id: 1,
      name: "Royal Ascot Gold Cup - Qualifiers A",
      code: "R-2026-001",
      distanceMeters: 1600,
      status: "SCHEDULED",
      scheduledAt: "2026-06-02T14:00:00+07:00",
      venue: "Turf Tower C",
    },
  ];

  const mockProfile = {
    fullName: "Julian Sterling",
    phone: "0909123456",
    gender: "MALE",
    dateOfBirth: "1985-06-12",
    address: "123 Turf Tower Road",
    avatarUrl: "",
    roles: ["REFEREE"],
    profileCompleted: true,
    phoneVerified: true,
    ageVerified: true,
    refereeProfile: {
      licenseNumber: "REF-2026-X89",
      certification: "FEI Certified Steward",
      experienceYears: 8,
      bio: "Veteran steward bio details.",
      status: "ACTIVE" as const,
    },
  };

  function LocationProbe() {
    const location = useLocation();
    return <p data-testid="location">{location.pathname}{location.search}</p>;
  }

  describe("RefereeProfileDashboardPage", () => {
    it("renders referee bento grid profile details and calendar", async () => {
      vi.spyOn(refereeApi, "getAssignedRaces").mockResolvedValue(mockRaces);
      vi.spyOn(profileApi, "getMyProfile").mockResolvedValue(mockProfile);

      render(
        <MemoryRouter>
          <RefereeProfileDashboardPage now={new Date("2026-06-02T12:30:00+07:00")} />
        </MemoryRouter>
      );

      expect(screen.getByText(/Preparing referee profile dashboard/i)).toBeInTheDocument();
      
      // Wait for loading to finish
      expect(await screen.findByRole("heading", { name: "Referee Profile" })).toBeInTheDocument();
      
      // Verify Bento items exist
      expect(screen.getByText("Julian Sterling")).toBeInTheDocument();
      expect(screen.getByText("referee@equine.com")).toBeInTheDocument();
      expect(screen.getByText("+84 0909123456")).toBeInTheDocument();
      expect(screen.getByText("123 Turf Tower Road")).toBeInTheDocument();
      
      // Badges
      expect(screen.getByText("✓ Profile Completed")).toBeInTheDocument();
      
      // Credentials
      expect(screen.getByText("FEI Certified Steward")).toBeInTheDocument();
      expect(screen.getByText("REF-2026-X89")).toBeInTheDocument();
      expect(screen.getByText("8 years")).toBeInTheDocument();
      
      // Status badge check
      const statusBadge = screen.getByText("ACTIVE");
      expect(statusBadge).toHaveClass("bg-emerald-50");
    });

    it("redirects to profile settings on Manage Account Settings click", async () => {
      vi.spyOn(refereeApi, "getAssignedRaces").mockResolvedValue(mockRaces);
      vi.spyOn(profileApi, "getMyProfile").mockResolvedValue(mockProfile);

      render(
        <MemoryRouter initialEntries={["/referee"]}>
          <Routes>
            <Route path="/referee" element={<RefereeProfileDashboardPage now={new Date("2026-06-02T12:30:00+07:00")} />} />
            <Route path="*" element={<LocationProbe />} />
          </Routes>
        </MemoryRouter>
      );

      const manageBtn = await screen.findByRole("link", { name: /Manage Account Settings/i });
      expect(manageBtn).toHaveAttribute("href", "/profile");
    });
  });
  ```

- [ ] **Step 3: Run Vitest to check test failures**
  In `frontend/` directory, run:
  ```powershell
  npm test -- --run src/pages/referee/RefereeProfileDashboardPage.test.tsx
  ```
  Expected: FAIL because components do not fetch `getMyProfile` or render Bento elements yet.

- [ ] **Step 4: Commit test and model changes**
  ```powershell
  git add frontend/src/types/profile.ts frontend/src/pages/referee/RefereeProfileDashboardPage.test.tsx
  git commit -m "test: add failed test specs for referee profile bento grid details"
  ```

---

### Task 4: Bento Grid UI Layout

**Files:**
- Modify: `frontend/src/pages/referee/RefereeProfileDashboardPage.tsx`

- [ ] **Step 1: Replace implementation of RefereeProfileDashboardPage**
  Replace `frontend/src/pages/referee/RefereeProfileDashboardPage.tsx` with full Bento Grid layout:
  ```tsx
  import { useCallback, useEffect, useMemo, useState } from "react";
  import { useNavigate, Link } from "react-router-dom";
  import { getAssignedRaces } from "../../api/refereeApi";
  import { getMyProfile } from "../../api/profileApi";
  import { useClientSession } from "../../hooks/useClientSession";
  import { MonthRaceCalendar } from "./race-day/MonthRaceCalendar";
  import { normalizeAssignedRace } from "./race-day/refereeRaceDayAdapter";
  import { AssignedRace } from "./race-day/refereeRaceDayModels";
  import { Profile } from "../../types/profile";

  type RefereeProfileDashboardPageProps = {
    now?: Date;
  };

  function isSameDay(left: Date, right: Date) {
    return (
      left.getFullYear() === right.getFullYear() &&
      left.getMonth() === right.getMonth() &&
      left.getDate() === right.getDate()
    );
  }

  function metricLabel(status: string) {
    if (status === "ONGOING") return "Live / Ongoing";
    if (status === "PUBLISHED") return "Published Results";
    return "Ready For Pre-Race";
  }

  function getInitials(name: string) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "RF";
    return parts.slice(0, 2).map((p) => p[0]).join("").toUpperCase();
  }

  export function RefereeProfileDashboardPage({ now }: RefereeProfileDashboardPageProps) {
    const referenceNow = useMemo(() => now ?? new Date(), [now]);
    const navigate = useNavigate();
    const { session } = useClientSession();
    
    const [races, setRaces] = useState<AssignedRace[]>([]);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>();

    const loadData = useCallback(async () => {
      try {
        setLoading(true);
        setError(undefined);
        const [racesData, profileData] = await Promise.all([
          getAssignedRaces(),
          getMyProfile()
        ]);
        setRaces(racesData.map((race) => normalizeAssignedRace(race, referenceNow)));
        setProfile(profileData);
      } catch {
        setError("Unable to load referee profile dashboard.");
      } finally {
        setLoading(false);
      }
    }, [referenceNow]);

    useEffect(() => {
      void loadData();
    }, [loadData]);

    const racesToday = races.filter((race) => isSameDay(new Date(race.scheduledAt), referenceNow));
    const readyForPreRace = races.filter((race) => ["SCHEDULED", "CHECKING", "READY"].includes(race.status));
    const ongoingRaces = races.filter((race) => race.status === "ONGOING");
    const publishedResults = races.filter((race) => race.status === "PUBLISHED");

    if (loading) {
      return (
        <div className="max-w-[1486px] rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#006f5f]">Preparing referee profile dashboard</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            <div className="h-20 rounded-xl bg-slate-100 animate-pulse" />
            <div className="h-20 rounded-xl bg-slate-100 animate-pulse" />
            <div className="h-20 rounded-xl bg-slate-100 animate-pulse" />
            <div className="h-20 rounded-xl bg-slate-100 animate-pulse" />
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="max-w-[1486px] rounded-xl border border-rose-200 bg-rose-50 p-6" role="alert">
          <p className="font-black text-rose-800">{error}</p>
          <button className="mt-4 min-h-11 rounded-md bg-rose-700 px-5 text-sm font-black text-white" onClick={() => void loadData()} type="button">
            Retry
          </button>
        </div>
      );
    }

    const refInfo = profile?.refereeProfile;

    // Status mapping classes
    let statusClass = "bg-slate-50 text-slate-700 border-slate-200";
    if (refInfo?.status === "ACTIVE") {
      statusClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
    } else if (refInfo?.status === "PENDING") {
      statusClass = "bg-amber-50 text-amber-700 border-amber-200";
    } else if (refInfo?.status === "SUSPENDED" || refInfo?.status === "REJECTED") {
      statusClass = "bg-rose-50 text-rose-700 border-rose-200";
    }

    return (
      <section className="max-w-[1486px] space-y-6" aria-labelledby="referee-profile-title">
        {/* Bento Grid Top: General Profile & Credentials */}
        <div className="grid gap-6 lg:grid-cols-2">
          
          {/* Bento Item 1: Identity & Account Settings */}
          <article className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <header className="flex items-center gap-4 border-b border-slate-100 pb-4">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#007a68] text-2xl font-black uppercase text-white shadow-md">
                  {profile?.avatarUrl ? (
                    <img alt="Referee Avatar" className="h-full w-full object-cover" src={profile.avatarUrl} />
                  ) : (
                    <span>{getInitials(profile?.fullName || "Referee")}</span>
                  )}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-2xl font-black tracking-tight text-slate-950" id="referee-profile-title">
                      {profile?.fullName || "Assigned official"}
                    </h2>
                    <span className="inline-flex rounded-full bg-[#007a68] px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">
                      REFEREE
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-slate-500">{session?.email || "No email available"}</p>
                </div>
              </header>

              <div className="mt-4 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Phone Number</span>
                  <p className="font-bold text-slate-800">{profile?.phone ? `+84 ${profile.phone}` : "Not specified"}</p>
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Gender</span>
                  <p className="font-bold text-slate-800 capitalize">{profile?.gender?.toLowerCase() || "Not specified"}</p>
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Date of Birth</span>
                  <p className="font-bold text-slate-800">
                    {profile?.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric"
                    }) : "Not specified"}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Address</span>
                  <p className="font-bold text-slate-800 leading-tight">{profile?.address || "Not specified"}</p>
                </div>
              </div>

              {/* Verification Badges */}
              <div className="mt-5 flex flex-wrap gap-2">
                <span className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-black uppercase border ${profile?.profileCompleted ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-50 text-slate-400 border-slate-200"}`}>
                  {profile?.profileCompleted ? "✓ Profile Completed" : "✗ Profile Incomplete"}
                </span>
                <span className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-black uppercase border ${profile?.phoneVerified ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-50 text-slate-400 border-slate-200"}`}>
                  {profile?.phoneVerified ? "✓ Phone Verified" : "✗ Phone Unverified"}
                </span>
                <span className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-black uppercase border ${profile?.ageVerified ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-50 text-slate-400 border-slate-200"}`}>
                  {profile?.ageVerified ? "✓ Age Verified" : "✗ Age Unverified"}
                </span>
              </div>
            </div>

            <div className="mt-6 border-t border-slate-100 pt-4">
              <Link
                to="/profile"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-white transition hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
              >
                <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="h-4 w-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Manage Account Settings
              </Link>
            </div>
          </article>

          {/* Bento Item 2: Official Credentials */}
          <article className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <header className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#006f5f]">Official Credentials</p>
                  <h3 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
                    {refInfo?.certification || "Not Certified"}
                  </h3>
                </div>
                {refInfo?.status && (
                  <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wider ${statusClass}`}>
                    {refInfo.status}
                  </span>
                )}
              </header>

              {/* Biography Block */}
              <div className="mt-4 rounded-xl border-l-4 border-[#007a68] bg-[#f8fcfb] p-4">
                <p className="line-clamp-4 text-sm font-semibold italic leading-relaxed text-slate-600">
                  {refInfo?.bio ? `"${refInfo.bio}"` : "No biography provided. Bio credentials must be submitted to administrators for certification verification."}
                </p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 text-sm text-slate-700">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">License Number</span>
                <p className="font-bold text-slate-800">
                  {refInfo?.licenseNumber ? (
                    <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-800 border border-slate-200">{refInfo.licenseNumber}</code>
                  ) : (
                    "Not Issued"
                  )}
                </p>
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Experience</span>
                <p className="font-bold text-slate-800">{refInfo?.experienceYears ? `${refInfo.experienceYears} years` : "0 years"}</p>
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Approved Date</span>
                <p className="font-bold text-slate-800">
                  {refInfo?.approvedAt ? new Date(refInfo.approvedAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                  }) : "N/A"}
                </p>
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Approved By</span>
                <p className="font-bold text-slate-800">System Admin</p>
              </div>
            </div>
          </article>

        </div>

        {/* Middle: KPI Cards bridge */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            ["Assigned Today", racesToday.length],
            ["Ready For Pre-Race", readyForPreRace.length],
            [metricLabel("ONGOING"), ongoingRaces.length],
            [metricLabel("PUBLISHED"), publishedResults.length],
          ].map(([label, value]) => (
            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" key={label}>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">{label}</p>
              <p className="mt-3 text-4xl font-black text-[#006f5f]">{value}</p>
            </article>
          ))}
        </div>

        {/* Bottom: Month calendar anchor */}
        <div className="mt-6">
          <MonthRaceCalendar
            races={races}
            referenceDate={referenceNow}
            onRaceSelect={(race) => navigate(`/referee/assigned-races?raceId=${race.id}`)}
          />
        </div>
      </section>
    );
  }
  ```

- [ ] **Step 2: Run Vitest to check test success**
  In `frontend/` directory, run:
  ```powershell
  npm test -- --run src/pages/referee/RefereeProfileDashboardPage.test.tsx
  ```
  Expected: PASS.

- [ ] **Step 3: Commit changes**
  ```powershell
  git add frontend/src/pages/referee/RefereeProfileDashboardPage.tsx
  git commit -m "feat: complete Bento Grid Referee Profile Dashboard UI layout"
  ```

---

### Task 5: Full E2E Verification & Integration Tests

- [ ] **Step 1: Run all frontend tests**
  In `frontend/` directory, run:
  ```powershell
  npm test -- --run
  ```
  Expected: PASS (Check that `RefereeProfileDashboardPage`, `RefereeLayout`, `RefereeOverviewPage` all pass).

- [ ] **Step 2: Build Frontend**
  In `frontend/` directory, run:
  ```powershell
  npm run build
  ```
  Expected: SUCCESS (Checks type consistency and Vite compile output).

- [ ] **Step 3: Run all backend tests**
  In `backend/` directory, run:
  ```powershell
  $env:JAVA_HOME="C:\Program Files\Java\jdk-21.0.10"; $env:Path="C:\Program Files\Java\jdk-21.0.10\bin;$env:Path"; .\mvnw.cmd test
  ```
  Expected: BUILD SUCCESS (Check that `UserProfileIntegrationTest` is passing).

- [ ] **Step 4: Verify git status and check for whitespaces**
  Run:
  ```powershell
  git status
  git diff --check
  ```
  Expected: Clean index without syntax errors or whitespace warning logs.
