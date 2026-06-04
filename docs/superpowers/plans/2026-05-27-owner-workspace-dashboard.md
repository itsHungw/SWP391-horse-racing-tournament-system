# Owner Workspace Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a polished Horse Owner workspace with role-aware dashboard navigation, owner overview, horse management, tournament registration, and the backend review rules needed to support the flow.

**Architecture:** Keep public navigation clean and move role-specific work into an `OwnerLayout`. Add focused frontend racing API/types and pages, then add backend owner/admin APIs without disturbing teammate-owned admin user CRUD and role request screens. Owner-created horses must be review-first (`PENDING`), while existing admin CRUD can keep direct admin management behavior.

**Tech Stack:** React, React Router, TypeScript, Tailwind CSS, Vitest, Testing Library, Spring Boot 4, Spring Security, Spring Data JPA, MockMvc, SQL Server-compatible `schema.sql`.

---

## UI/UX Rules From ui-ux-pro-max

- Use an operations-dashboard feel: dense, scannable, professional, not marketing/hero style.
- Keep public header public only; role operations live in workspace navigation.
- Use one owner workspace primary nav with clear labels: Dashboard, My Horses, Tournament Registrations, Profile.
- Keep touch/click targets at least `min-h-11`.
- Use visible labels for every form field; do not rely on placeholders.
- Show loading, empty, success, and error states close to the relevant UI.
- Use status badges with text labels; color must not be the only signal.
- Use lucide icons where helpful, but never icon-only controls without accessible names.
- Tables must remain horizontally scrollable on small screens without breaking the page.
- Use restrained colors already present in the app: green for owner/workflow success, red for review errors, navy for secondary actions, white/slate surfaces for data.

## File Structure

### Frontend Files

- Create `frontend/src/utils/dashboardRoute.ts`
  - Resolves the authenticated `Dashboard` link from JWT roles.
- Modify `frontend/src/components/client/ClientHeader.tsx`
  - Use role-aware dashboard target.
  - Keep public nav free of role feature links.
- Create `frontend/src/layouts/OwnerLayout.tsx`
  - Owner workspace shell and sidebar/top nav.
- Create `frontend/src/pages/owner/OwnerDashboardPage.tsx`
  - Owner overview only; no create horse form.
- Create `frontend/src/pages/owner/OwnerHorsesPage.tsx`
  - Stable management and horse evidence form.
- Create `frontend/src/pages/owner/OwnerTournamentRegistrationsPage.tsx`
  - Registration creation, status history, withdraw.
- Create `frontend/src/types/racing.ts`
  - Shared horse, tournament, and registration types.
- Create `frontend/src/api/racingApi.ts`
  - Frontend HTTP functions for owner/admin racing workflows.
- Modify `frontend/src/routes/AppRouter.tsx`
  - Add owner routes and reserved shell routes for spectator/jockey/referee.
  - Keep `/admin` unchanged.
- Modify `frontend/src/App.test.tsx`
  - Route/header integration coverage.
- Add page tests:
  - `frontend/src/layouts/OwnerLayout.test.tsx`
  - `frontend/src/pages/owner/OwnerDashboardPage.test.tsx`
  - `frontend/src/pages/owner/OwnerHorsesPage.test.tsx`
  - `frontend/src/pages/owner/OwnerTournamentRegistrationsPage.test.tsx`
- Add API/type tests:
  - `frontend/src/utils/dashboardRoute.test.ts`
  - `frontend/src/api/racingApi.test.ts`

### Backend Files

- Modify `backend/src/main/resources/schema.sql`
  - Add horse evidence/review columns and tournament registration table migration.
- Modify `backend/src/main/java/com/example/horseracingtournamentsystem/horse/entity/Horse.java`
  - Add evidence/review fields and owner create/review methods.
- Modify `backend/src/main/java/com/example/horseracingtournamentsystem/horse/dto/request/HorseRequest.java`
  - Keep admin create request.
- Create `backend/src/main/java/com/example/horseracingtournamentsystem/horse/dto/request/OwnerHorseRequest.java`
  - Owner create request without `ownerId`.
- Create `backend/src/main/java/com/example/horseracingtournamentsystem/horse/dto/request/RejectHorseRequest.java`
  - Admin reject request.
- Modify `backend/src/main/java/com/example/horseracingtournamentsystem/horse/dto/response/HorseResponse.java`
  - Include evidence/review fields.
- Modify `backend/src/main/java/com/example/horseracingtournamentsystem/horse/repository/HorseRepository.java`
  - Add owner/status queries.
- Modify `backend/src/main/java/com/example/horseracingtournamentsystem/horse/service/HorseService.java`
  - Add owner create/list and admin approve/reject methods.
- Create `backend/src/main/java/com/example/horseracingtournamentsystem/horse/controller/OwnerHorseController.java`
  - `/api/v1/owner/horses`.
- Modify `backend/src/main/java/com/example/horseracingtournamentsystem/horse/controller/AdminHorseController.java`
  - Add status filter and approve/reject endpoints.
- Create tournament registration package:
  - `backend/src/main/java/com/example/horseracingtournamentsystem/tournamentregistration/entity/TournamentRegistration.java`
  - `backend/src/main/java/com/example/horseracingtournamentsystem/tournamentregistration/repository/TournamentRegistrationRepository.java`
  - `backend/src/main/java/com/example/horseracingtournamentsystem/tournamentregistration/dto/request/TournamentRegistrationRequest.java`
  - `backend/src/main/java/com/example/horseracingtournamentsystem/tournamentregistration/dto/request/RejectTournamentRegistrationRequest.java`
  - `backend/src/main/java/com/example/horseracingtournamentsystem/tournamentregistration/dto/response/TournamentRegistrationResponse.java`
  - `backend/src/main/java/com/example/horseracingtournamentsystem/tournamentregistration/service/TournamentRegistrationService.java`
  - `backend/src/main/java/com/example/horseracingtournamentsystem/tournamentregistration/controller/OwnerTournamentRegistrationController.java`
  - `backend/src/main/java/com/example/horseracingtournamentsystem/tournamentregistration/controller/AdminTournamentRegistrationController.java`
- Add backend tests:
  - `backend/src/test/java/com/example/horseracingtournamentsystem/horse/OwnerHorseIntegrationTest.java`
  - Extend `backend/src/test/java/com/example/horseracingtournamentsystem/horse/HorseIntegrationTest.java`
  - Add `backend/src/test/java/com/example/horseracingtournamentsystem/tournamentregistration/TournamentRegistrationIntegrationTest.java`

---

### Task 1: Role-Aware Dashboard Link

**Files:**
- Create: `frontend/src/utils/dashboardRoute.ts`
- Test: `frontend/src/utils/dashboardRoute.test.ts`
- Modify: `frontend/src/components/client/ClientHeader.tsx`
- Modify: `frontend/src/App.test.tsx`

- [ ] **Step 1: Write failing route helper tests**

Create `frontend/src/utils/dashboardRoute.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { getDashboardRouteForRoles } from "./dashboardRoute";

describe("getDashboardRouteForRoles", () => {
  it("routes admins to the existing admin overview", () => {
    expect(getDashboardRouteForRoles(["ADMIN", "HORSE_OWNER"])).toBe("/admin");
  });

  it("routes horse owners to the owner workspace dashboard", () => {
    expect(getDashboardRouteForRoles(["HORSE_OWNER"])).toBe("/owner/dashboard");
  });

  it("routes jockeys and referees to their reserved dashboards", () => {
    expect(getDashboardRouteForRoles(["JOCKEY"])).toBe("/jockey/dashboard");
    expect(getDashboardRouteForRoles(["REFEREE"])).toBe("/referee/dashboard");
  });

  it("falls back to spectator dashboard", () => {
    expect(getDashboardRouteForRoles([])).toBe("/spectator/dashboard");
    expect(getDashboardRouteForRoles(["SPECTATOR"])).toBe("/spectator/dashboard");
  });
});
```

- [ ] **Step 2: Run helper test to verify it fails**

Run:

```powershell
npm test -- --run src/utils/dashboardRoute.test.ts
```

Expected: FAIL because `dashboardRoute.ts` does not exist.

- [ ] **Step 3: Implement route helper**

Create `frontend/src/utils/dashboardRoute.ts`:

```ts
const rolePriorityRoutes: Array<{ role: string; route: string }> = [
  { role: "ADMIN", route: "/admin" },
  { role: "HORSE_OWNER", route: "/owner/dashboard" },
  { role: "JOCKEY", route: "/jockey/dashboard" },
  { role: "REFEREE", route: "/referee/dashboard" },
];

export function getDashboardRouteForRoles(roles: string[]) {
  const normalizedRoles = new Set(roles.map((role) => role.toUpperCase()));
  return rolePriorityRoutes.find((item) => normalizedRoles.has(item.role))?.route ?? "/spectator/dashboard";
}
```

- [ ] **Step 4: Update ClientHeader dashboard href**

In `frontend/src/components/client/ClientHeader.tsx`, import the helper and session:

```ts
import { getDashboardRouteForRoles } from "../../utils/dashboardRoute";
```

Update hook usage:

```ts
const { isAuthenticated, logout, session } = useClientSession();
const dashboardHref = getDashboardRouteForRoles(session?.roles ?? []);
```

Update the dashboard link:

```tsx
<a className="opacity-85 hover:opacity-100" href={dashboardHref}>
  Dashboard
</a>
```

- [ ] **Step 5: Update App header expectations**

In `frontend/src/App.test.tsx`, change the existing authenticated spectator expectation from `/spectator` to `/spectator/dashboard`.

Add an owner case:

```ts
it("routes horse owner dashboard link to the owner workspace", () => {
  localStorage.setItem("accessToken", createTokenWithRoles(["HORSE_OWNER"]));
  localStorage.setItem("fullName", "Owner User");
  localStorage.setItem("email", "owner@example.com");

  render(<App />);

  expect(screen.getByRole("link", { name: /^dashboard$/i })).toHaveAttribute(
    "href",
    "/owner/dashboard",
  );
});
```

- [ ] **Step 6: Run tests**

Run:

```powershell
npm test -- --run src/utils/dashboardRoute.test.ts src/App.test.tsx
```

Expected: PASS.

- [ ] **Step 7: Commit**

```powershell
git add frontend/src/utils/dashboardRoute.ts frontend/src/utils/dashboardRoute.test.ts frontend/src/components/client/ClientHeader.tsx frontend/src/App.test.tsx
git commit -m "feat: route dashboard by user role"
```

---

### Task 2: Owner Layout and Workspace Routes

**Files:**
- Create: `frontend/src/layouts/OwnerLayout.tsx`
- Test: `frontend/src/layouts/OwnerLayout.test.tsx`
- Modify: `frontend/src/routes/AppRouter.tsx`
- Modify: `frontend/src/pages/RoleDashboardPage.tsx`
- Modify: `frontend/src/pages/RoleDashboardPage.test.tsx`
- Modify: `frontend/src/App.test.tsx`

- [ ] **Step 1: Write failing OwnerLayout test**

Create `frontend/src/layouts/OwnerLayout.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { OwnerLayout } from "./OwnerLayout";

describe("OwnerLayout", () => {
  it("renders owner workspace navigation with accessible links", () => {
    render(
      <MemoryRouter>
        <OwnerLayout>
          <h1>Owner dashboard content</h1>
        </OwnerLayout>
      </MemoryRouter>,
    );

    expect(screen.getByRole("banner", { name: /owner workspace header/i })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: /owner workspace/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /dashboard/i })).toHaveAttribute("href", "/owner/dashboard");
    expect(screen.getByRole("link", { name: /my horses/i })).toHaveAttribute("href", "/owner/horses");
    expect(screen.getByRole("link", { name: /tournament registrations/i })).toHaveAttribute(
      "href",
      "/owner/registrations",
    );
    expect(screen.getByRole("link", { name: /profile/i })).toHaveAttribute("href", "/profile");
    expect(screen.getByRole("heading", { name: /owner dashboard content/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run layout test to verify it fails**

```powershell
npm test -- --run src/layouts/OwnerLayout.test.tsx
```

Expected: FAIL because `OwnerLayout` does not exist.

- [ ] **Step 3: Implement OwnerLayout with ui-ux-pro-max rules**

Create `frontend/src/layouts/OwnerLayout.tsx`:

```tsx
import { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { ClipboardList, Gauge, LogOut, Trophy, User, Workflow } from "lucide-react";

import logo from "../assets/logo.png";
import { useClientSession } from "../hooks/useClientSession";

type OwnerLayoutProps = {
  children: ReactNode;
};

const ownerNavItems = [
  { label: "Dashboard", href: "/owner/dashboard", icon: Gauge },
  { label: "My Horses", href: "/owner/horses", icon: Trophy },
  { label: "Tournament Registrations", href: "/owner/registrations", icon: ClipboardList },
  { label: "Profile", href: "/profile", icon: User },
];

export function OwnerLayout({ children }: OwnerLayoutProps) {
  const navigate = useNavigate();
  const { logout, session } = useClientSession();

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-dvh bg-[#eef1ef] text-slate-950">
      <header aria-label="Owner workspace header" className="border-b border-slate-200 bg-white" role="banner">
        <div className="mx-auto flex min-h-20 max-w-[1680px] flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <a className="flex items-center gap-3" href="/owner/dashboard" aria-label="EquinePro owner dashboard">
            <img alt="" className="h-10 w-10 object-contain" src={logo} />
            <div>
              <p className="text-2xl font-black tracking-tight text-[#006d5b]">Owner Workspace</p>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Stable operations</p>
            </div>
          </a>

          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-md border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-700">
              {session?.fullName || "Horse Owner"}
            </span>
            <button
              className="inline-flex min-h-11 items-center gap-2 rounded-md bg-[#070f4f] px-4 text-sm font-black text-white hover:bg-[#111b63] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006d5b]"
              onClick={handleLogout}
              type="button"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid min-h-[calc(100dvh-81px)] max-w-[1680px] lg:grid-cols-[260px_1fr]">
        <aside className="border-b border-slate-200 bg-[#f8faf9] lg:border-b-0 lg:border-r">
          <nav aria-label="Owner workspace" className="flex overflow-x-auto p-3 lg:block lg:space-y-2">
            {ownerNavItems.map((item) => (
              <NavLink
                className={({ isActive }) =>
                  [
                    "flex min-h-11 min-w-max items-center gap-3 rounded-md px-4 text-sm font-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006d5b]",
                    isActive ? "bg-[#006d5b] text-white" : "text-slate-700 hover:bg-white",
                  ].join(" ")
                }
                key={item.href}
                to={item.href}
              >
                <item.icon className="h-5 w-5" aria-hidden="true" />
                {item.label}
              </NavLink>
            ))}
            <div className="hidden border-t border-slate-200 pt-3 lg:mt-3 lg:block">
              <div className="flex min-h-11 items-center gap-3 rounded-md px-4 text-sm font-bold text-slate-400">
                <Workflow className="h-5 w-5" aria-hidden="true" />
                Jockey Invitations
              </div>
            </div>
          </nav>
        </aside>

        <main className="min-w-0 px-5 py-6 sm:px-7 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Add owner and reserved role routes**

In `frontend/src/routes/AppRouter.tsx`, import owner pages as they are added in later tasks. For this task, use `RoleDashboardPage` shells for reserved dashboards and redirect `/owner`:

```tsx
<Route path="spectator" element={<Navigate to="/spectator/dashboard" replace />} />
<Route path="spectator/dashboard" element={<RoleDashboardPage role="Spectator" />} />
<Route path="owner" element={authRoute(<Navigate to="/owner/dashboard" replace />)} />
<Route path="owner/dashboard" element={authRoute(<RoleDashboardPage role="Owner" />)} />
<Route path="jockey" element={<Navigate to="/jockey/dashboard" replace />} />
<Route path="jockey/dashboard" element={<RoleDashboardPage role="Jockey" />} />
<Route path="jockey/invitations" element={<RoleDashboardPage role="Jockey" />} />
<Route path="jockey/races" element={<RoleDashboardPage role="Jockey" />} />
<Route path="referee" element={<Navigate to="/referee/dashboard" replace />} />
<Route path="referee/dashboard" element={<RoleDashboardPage role="Referee" />} />
<Route path="referee/races" element={<RoleDashboardPage role="Referee" />} />
<Route path="referee/checks" element={<RoleDashboardPage role="Referee" />} />
<Route path="referee/results" element={<RoleDashboardPage role="Referee" />} />
```

- [ ] **Step 5: Update shell copy test**

Update `frontend/src/pages/RoleDashboardPage.test.tsx` to expect Coming Soon wording:

```tsx
expect(screen.getByText(/coming soon/i)).toBeInTheDocument();
```

- [ ] **Step 6: Add route redirect integration test**

In `frontend/src/App.test.tsx`:

```tsx
it("redirects owner base route to owner dashboard for authenticated owners", async () => {
  window.history.pushState({}, "", "/owner");
  localStorage.setItem("accessToken", createTokenWithRoles(["HORSE_OWNER"]));
  localStorage.setItem("fullName", "Owner User");
  localStorage.setItem("email", "owner@example.com");

  render(<App />);

  expect(await screen.findByRole("heading", { name: /owner dashboard/i })).toBeInTheDocument();
});
```

- [ ] **Step 7: Run tests**

```powershell
npm test -- --run src/layouts/OwnerLayout.test.tsx src/pages/RoleDashboardPage.test.tsx src/App.test.tsx
```

Expected: PASS.

- [ ] **Step 8: Commit**

```powershell
git add frontend/src/layouts/OwnerLayout.tsx frontend/src/layouts/OwnerLayout.test.tsx frontend/src/routes/AppRouter.tsx frontend/src/pages/RoleDashboardPage.tsx frontend/src/pages/RoleDashboardPage.test.tsx frontend/src/App.test.tsx
git commit -m "feat: add owner workspace shell"
```

---

### Task 3: Frontend Racing Types and API Client

**Files:**
- Create: `frontend/src/types/racing.ts`
- Create: `frontend/src/api/racingApi.ts`
- Test: `frontend/src/api/racingApi.test.ts`

- [ ] **Step 1: Write failing API test**

Create `frontend/src/api/racingApi.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from "vitest";

import { httpClient } from "./httpClient";
import { createOwnerHorse, createOwnerTournamentRegistration, getOwnerHorses } from "./racingApi";

vi.mock("./httpClient", () => ({
  httpClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe("racingApi", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("loads owner horses from the owner endpoint", async () => {
    vi.mocked(httpClient.get).mockResolvedValueOnce({ data: [{ id: 1, name: "Nova", status: "PENDING" }] });

    await expect(getOwnerHorses()).resolves.toEqual([{ id: 1, name: "Nova", status: "PENDING" }]);
    expect(httpClient.get).toHaveBeenCalledWith("/owner/horses");
  });

  it("creates owner horses without ownerId", async () => {
    vi.mocked(httpClient.post).mockResolvedValueOnce({ data: { id: 1, name: "Nova", status: "PENDING" } });

    await createOwnerHorse({
      name: "Nova",
      gender: "FEMALE",
      imageUrl: "https://cdn.example.com/nova.jpg",
      evidenceUrl: "https://cdn.example.com/nova.pdf",
    });

    expect(httpClient.post).toHaveBeenCalledWith("/owner/horses", {
      name: "Nova",
      gender: "FEMALE",
      imageUrl: "https://cdn.example.com/nova.jpg",
      evidenceUrl: "https://cdn.example.com/nova.pdf",
    });
  });

  it("submits owner tournament registrations", async () => {
    vi.mocked(httpClient.post).mockResolvedValueOnce({ data: { id: 10, status: "PENDING" } });

    await createOwnerTournamentRegistration({ tournamentId: 2, horseId: 1, note: "Ready" });

    expect(httpClient.post).toHaveBeenCalledWith("/owner/tournament-registrations", {
      tournamentId: 2,
      horseId: 1,
      note: "Ready",
    });
  });
});
```

- [ ] **Step 2: Run API test to verify it fails**

```powershell
npm test -- --run src/api/racingApi.test.ts
```

Expected: FAIL because `racingApi.ts` and `racing.ts` do not exist.

- [ ] **Step 3: Add racing types**

Create `frontend/src/types/racing.ts`:

```ts
export type HorseStatus = "PENDING" | "APPROVED" | "REJECTED" | "INACTIVE" | "SUSPENDED";

export type Horse = {
  id: number;
  ownerId?: number;
  ownerName?: string;
  name: string;
  registrationCode?: string;
  breed?: string;
  gender: "MALE" | "FEMALE" | string;
  dateOfBirth?: string;
  color?: string;
  heightCm?: number;
  weightKg?: number;
  healthStatus?: string;
  imageUrl?: string;
  evidenceUrl?: string;
  medicalNote?: string;
  description?: string;
  status: HorseStatus;
  rejectionReason?: string;
  approvedAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type HorsePayload = {
  name: string;
  gender: "MALE" | "FEMALE" | "";
  imageUrl: string;
  evidenceUrl: string;
  registrationCode?: string;
  breed?: string;
  dateOfBirth?: string;
  color?: string;
  heightCm?: number;
  weightKg?: number;
  healthStatus?: string;
  medicalNote?: string;
  description?: string;
};

export type Tournament = {
  id: number;
  name: string;
  code?: string;
  description?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  registrationStartAt?: string;
  registrationEndAt?: string;
  maxHorses?: number;
  status: string;
};

export type TournamentRegistrationStatus = "PENDING" | "APPROVED" | "REJECTED" | "WITHDRAWN";

export type TournamentRegistration = {
  id: number;
  tournamentId: number;
  tournamentName: string;
  horseId: number;
  horseName: string;
  horseImageUrl?: string;
  horseEvidenceUrl?: string;
  ownerId?: number;
  ownerName?: string;
  note?: string;
  status: TournamentRegistrationStatus;
  rejectionReason?: string;
  createdAt?: string;
  reviewedAt?: string;
};

export type TournamentRegistrationPayload = {
  tournamentId: number;
  horseId: number;
  note?: string;
};
```

- [ ] **Step 4: Add racing API client**

Create `frontend/src/api/racingApi.ts`:

```ts
import { httpClient } from "./httpClient";
import type {
  Horse,
  HorsePayload,
  HorseStatus,
  Tournament,
  TournamentRegistration,
  TournamentRegistrationPayload,
  TournamentRegistrationStatus,
} from "../types/racing";

export async function getPublicTournaments(): Promise<Tournament[]> {
  const response = await httpClient.get<Tournament[]>("/tournaments");
  return response.data;
}

export async function getOwnerHorses(): Promise<Horse[]> {
  const response = await httpClient.get<Horse[]>("/owner/horses");
  return response.data;
}

export async function createOwnerHorse(payload: HorsePayload): Promise<Horse> {
  const response = await httpClient.post<Horse>("/owner/horses", payload);
  return response.data;
}

export async function getAdminHorses(status?: HorseStatus): Promise<Horse[]> {
  const response = await httpClient.get<Horse[]>("/admin/horses", {
    params: { status: status || undefined },
  });
  return response.data;
}

export async function approveAdminHorse(id: number): Promise<Horse> {
  const response = await httpClient.post<Horse>(`/admin/horses/${id}/approve`);
  return response.data;
}

export async function rejectAdminHorse(id: number, reason: string): Promise<Horse> {
  const response = await httpClient.post<Horse>(`/admin/horses/${id}/reject`, { reason });
  return response.data;
}

export async function getOwnerTournamentRegistrations(): Promise<TournamentRegistration[]> {
  const response = await httpClient.get<TournamentRegistration[]>("/owner/tournament-registrations");
  return response.data;
}

export async function createOwnerTournamentRegistration(
  payload: TournamentRegistrationPayload,
): Promise<TournamentRegistration> {
  const response = await httpClient.post<TournamentRegistration>("/owner/tournament-registrations", payload);
  return response.data;
}

export async function withdrawOwnerTournamentRegistration(id: number): Promise<TournamentRegistration> {
  const response = await httpClient.post<TournamentRegistration>(`/owner/tournament-registrations/${id}/withdraw`);
  return response.data;
}

export async function getAdminTournamentRegistrations(
  status?: TournamentRegistrationStatus,
): Promise<TournamentRegistration[]> {
  const response = await httpClient.get<TournamentRegistration[]>("/admin/tournament-registrations", {
    params: { status: status || undefined },
  });
  return response.data;
}

export async function approveAdminTournamentRegistration(id: number): Promise<TournamentRegistration> {
  const response = await httpClient.post<TournamentRegistration>(`/admin/tournament-registrations/${id}/approve`);
  return response.data;
}

export async function rejectAdminTournamentRegistration(
  id: number,
  reason: string,
): Promise<TournamentRegistration> {
  const response = await httpClient.post<TournamentRegistration>(`/admin/tournament-registrations/${id}/reject`, {
    reason,
  });
  return response.data;
}
```

- [ ] **Step 5: Run API test**

```powershell
npm test -- --run src/api/racingApi.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add frontend/src/types/racing.ts frontend/src/api/racingApi.ts frontend/src/api/racingApi.test.ts
git commit -m "feat: add racing api client"
```

---

### Task 4: Owner Dashboard Page

**Files:**
- Create: `frontend/src/pages/owner/OwnerDashboardPage.tsx`
- Test: `frontend/src/pages/owner/OwnerDashboardPage.test.tsx`
- Modify: `frontend/src/routes/AppRouter.tsx`
- Modify: `frontend/src/App.test.tsx`

- [ ] **Step 1: Write failing page test**

Create `frontend/src/pages/owner/OwnerDashboardPage.test.tsx`:

```tsx
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getOwnerHorses, getOwnerTournamentRegistrations, getPublicTournaments } from "../../api/racingApi";
import { OwnerDashboardPage } from "./OwnerDashboardPage";

vi.mock("../../api/racingApi", () => ({
  getOwnerHorses: vi.fn(),
  getOwnerTournamentRegistrations: vi.fn(),
  getPublicTournaments: vi.fn(),
}));

describe("OwnerDashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getOwnerHorses).mockResolvedValue([
      { id: 1, name: "Nova", gender: "FEMALE", status: "APPROVED" },
      { id: 2, name: "Storm", gender: "MALE", status: "PENDING" },
      { id: 3, name: "Comet", gender: "MALE", status: "REJECTED", rejectionReason: "Missing evidence" },
    ]);
    vi.mocked(getOwnerTournamentRegistrations).mockResolvedValue([
      {
        id: 9,
        tournamentId: 4,
        tournamentName: "Spring Cup",
        horseId: 1,
        horseName: "Nova",
        status: "PENDING",
      },
    ]);
    vi.mocked(getPublicTournaments).mockResolvedValue([
      { id: 4, name: "Spring Cup", location: "Saigon Track", status: "OPEN_REGISTRATION" },
    ]);
  });

  it("shows owner KPI summary, next actions, alerts, and open tournaments", async () => {
    render(
      <MemoryRouter>
        <OwnerDashboardPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: /owner dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /add horse/i })).toHaveAttribute("href", "/owner/horses");
    expect(screen.getByRole("link", { name: /register tournament/i })).toHaveAttribute(
      "href",
      "/owner/registrations",
    );

    const stats = screen.getByLabelText(/owner stable summary/i);
    expect(within(stats).getByText("3")).toBeInTheDocument();
    expect(within(stats).getByText(/approved horses/i)).toBeInTheDocument();
    expect(screen.getByText(/missing evidence/i)).toBeInTheDocument();
    expect(screen.getByText(/spring cup/i)).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: /horse name/i })).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run page test to verify it fails**

```powershell
npm test -- --run src/pages/owner/OwnerDashboardPage.test.tsx
```

Expected: FAIL because `OwnerDashboardPage` does not exist.

- [ ] **Step 3: Implement OwnerDashboardPage**

Create `frontend/src/pages/owner/OwnerDashboardPage.tsx` with:

```tsx
import { useEffect, useMemo, useState } from "react";

import { getOwnerHorses, getOwnerTournamentRegistrations, getPublicTournaments } from "../../api/racingApi";
import { OwnerLayout } from "../../layouts/OwnerLayout";
import type { Horse, Tournament, TournamentRegistration } from "../../types/racing";
import { getApiErrorMessage } from "../../utils/apiError";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";

export function OwnerDashboardPage() {
  useDocumentTitle("Owner dashboard");

  const [horses, setHorses] = useState<Horse[]>([]);
  const [registrations, setRegistrations] = useState<TournamentRegistration[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const [horseData, registrationData, tournamentData] = await Promise.all([
          getOwnerHorses(),
          getOwnerTournamentRegistrations(),
          getPublicTournaments(),
        ]);
        if (active) {
          setHorses(Array.isArray(horseData) ? horseData : []);
          setRegistrations(Array.isArray(registrationData) ? registrationData : []);
          setTournaments(Array.isArray(tournamentData) ? tournamentData : []);
          setMessage(null);
        }
      } catch (error) {
        if (active) {
          setMessage(getApiErrorMessage(error, "Could not load owner dashboard."));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  const summary = useMemo(
    () => ({
      total: horses.length,
      approved: horses.filter((horse) => horse.status === "APPROVED").length,
      pending: horses.filter((horse) => horse.status === "PENDING").length,
      activeRegistrations: registrations.filter((item) => item.status === "PENDING" || item.status === "APPROVED")
        .length,
    }),
    [horses, registrations],
  );

  const rejectedHorses = horses.filter((horse) => horse.status === "REJECTED");
  const openTournaments = tournaments.filter((tournament) => tournament.status === "OPEN_REGISTRATION");

  return (
    <OwnerLayout>
      <section aria-labelledby="owner-dashboard-title" className="space-y-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.14em] text-[#006d5b]">Stable command center</p>
            <h1 id="owner-dashboard-title" className="mt-2 text-4xl font-black tracking-tight">
              Owner Dashboard
            </h1>
            <p className="mt-2 max-w-3xl text-base leading-7 text-slate-600">
              Track horse approvals, open tournament windows, and registration review progress in one workspace.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a className="flex min-h-11 items-center rounded-md bg-[#006d5b] px-5 text-sm font-black text-white" href="/owner/horses">
              Add Horse
            </a>
            <a className="flex min-h-11 items-center rounded-md border border-[#070f4f] px-5 text-sm font-black text-[#070f4f]" href="/owner/registrations">
              Register Tournament
            </a>
          </div>
        </div>

        {message && <p className="rounded-md border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700" role="status">{message}</p>}

        <div aria-label="Owner stable summary" className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            ["Total horses", summary.total],
            ["Approved horses", summary.approved],
            ["Pending review", summary.pending],
            ["Active registrations", summary.activeRegistrations],
          ].map(([label, value]) => (
            <article className="rounded-lg border border-slate-200 bg-white p-5" key={label}>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">{label}</p>
              <p className="mt-3 text-4xl font-black text-slate-950">{value}</p>
            </article>
          ))}
        </div>

        {loading ? (
          <div className="rounded-lg border border-slate-200 bg-white py-16 text-center text-sm font-bold text-slate-500">
            Loading owner workspace...
          </div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
            <section className="rounded-lg border border-slate-200 bg-white p-5" aria-labelledby="open-tournaments-title">
              <h2 id="open-tournaments-title" className="text-xl font-black">Open Tournaments</h2>
              <div className="mt-4 space-y-3">
                {openTournaments.length === 0 ? (
                  <p className="text-sm font-bold text-slate-500">No tournaments are open for registration.</p>
                ) : (
                  openTournaments.map((tournament) => (
                    <div className="rounded-md border border-slate-200 p-4" key={tournament.id}>
                      <p className="font-black text-slate-950">{tournament.name}</p>
                      <p className="text-sm text-slate-600">{tournament.location || "Location pending"}</p>
                    </div>
                  ))
                )}
              </div>
            </section>

            <aside className="rounded-lg border border-slate-200 bg-white p-5" aria-labelledby="review-alerts-title">
              <h2 id="review-alerts-title" className="text-xl font-black">Review Alerts</h2>
              <div className="mt-4 space-y-3">
                {rejectedHorses.length === 0 ? (
                  <p className="text-sm font-bold text-slate-500">No rejected horses.</p>
                ) : (
                  rejectedHorses.map((horse) => (
                    <div className="border-l-4 border-rose-700 bg-rose-50 p-4" key={horse.id}>
                      <p className="font-black text-rose-900">{horse.name}</p>
                      <p className="text-sm font-bold text-rose-800">{horse.rejectionReason || "Review rejected."}</p>
                    </div>
                  ))
                )}
              </div>
            </aside>
          </div>
        )}
      </section>
    </OwnerLayout>
  );
}
```

- [ ] **Step 4: Route `/owner/dashboard` to real page**

In `frontend/src/routes/AppRouter.tsx`, import `OwnerDashboardPage` and replace the owner dashboard shell route:

```tsx
<Route path="owner/dashboard" element={authRoute(<OwnerDashboardPage />)} />
```

- [ ] **Step 5: Run tests**

```powershell
npm test -- --run src/pages/owner/OwnerDashboardPage.test.tsx src/App.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add frontend/src/pages/owner/OwnerDashboardPage.tsx frontend/src/pages/owner/OwnerDashboardPage.test.tsx frontend/src/routes/AppRouter.tsx frontend/src/App.test.tsx
git commit -m "feat: add owner dashboard overview"
```

---

### Task 5: Owner Horses Page

**Files:**
- Create: `frontend/src/pages/owner/OwnerHorsesPage.tsx`
- Test: `frontend/src/pages/owner/OwnerHorsesPage.test.tsx`
- Modify: `frontend/src/routes/AppRouter.tsx`

- [ ] **Step 1: Write failing owner horses page test**

Create `frontend/src/pages/owner/OwnerHorsesPage.test.tsx`:

```tsx
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createOwnerHorse, getOwnerHorses } from "../../api/racingApi";
import { OwnerHorsesPage } from "./OwnerHorsesPage";

vi.mock("../../api/racingApi", () => ({
  createOwnerHorse: vi.fn(),
  getOwnerHorses: vi.fn(),
}));

describe("OwnerHorsesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getOwnerHorses).mockResolvedValue([
      {
        id: 1,
        name: "Nova",
        gender: "FEMALE",
        imageUrl: "https://cdn.example.com/nova.jpg",
        evidenceUrl: "https://cdn.example.com/nova.pdf",
        status: "PENDING",
      },
    ]);
    vi.mocked(createOwnerHorse).mockResolvedValue({
      id: 2,
      name: "Storm",
      gender: "MALE",
      imageUrl: "https://cdn.example.com/storm.jpg",
      evidenceUrl: "https://cdn.example.com/storm.pdf",
      status: "PENDING",
    });
  });

  it("creates a horse with required evidence and refreshes the stable", async () => {
    render(
      <MemoryRouter>
        <OwnerHorsesPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: /my horses/i })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/horse name/i), { target: { value: "Storm" } });
    fireEvent.change(screen.getByLabelText(/gender/i), { target: { value: "MALE" } });
    fireEvent.change(screen.getByLabelText(/horse image url/i), { target: { value: "https://cdn.example.com/storm.jpg" } });
    fireEvent.change(screen.getByLabelText(/evidence url/i), { target: { value: "https://cdn.example.com/storm.pdf" } });
    fireEvent.click(screen.getByRole("button", { name: /add horse/i }));

    await waitFor(() => {
      expect(createOwnerHorse).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Storm",
          gender: "MALE",
          imageUrl: "https://cdn.example.com/storm.jpg",
          evidenceUrl: "https://cdn.example.com/storm.pdf",
        }),
      );
    });
  });
});
```

- [ ] **Step 2: Run page test to verify it fails**

```powershell
npm test -- --run src/pages/owner/OwnerHorsesPage.test.tsx
```

Expected: FAIL because page does not exist.

- [ ] **Step 3: Implement OwnerHorsesPage**

Create `frontend/src/pages/owner/OwnerHorsesPage.tsx` with this component shape. Keep the field labels exactly as shown so tests and accessibility queries stay stable:

```tsx
import { FormEvent, useCallback, useEffect, useState } from "react";

import { createOwnerHorse, getOwnerHorses } from "../../api/racingApi";
import { OwnerLayout } from "../../layouts/OwnerLayout";
import type { Horse, HorsePayload } from "../../types/racing";
import { getApiErrorMessage } from "../../utils/apiError";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";

const emptyForm: HorsePayload = {
  name: "",
  gender: "",
  imageUrl: "",
  evidenceUrl: "",
  registrationCode: "",
  breed: "",
  dateOfBirth: "",
  color: "",
  heightCm: undefined,
  weightKg: undefined,
  healthStatus: "",
  medicalNote: "",
  description: "",
};

export function OwnerHorsesPage() {
  useDocumentTitle("Owner horses");

  const [horses, setHorses] = useState<Horse[]>([]);
  const [form, setForm] = useState<HorsePayload>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadHorses = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getOwnerHorses();
      setHorses(Array.isArray(data) ? data : []);
      setMessage(null);
    } catch (error) {
      setMessage(getApiErrorMessage(error, "Could not load your horses."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadHorses();
  }, [loadHorses]);

  const updateField = (field: keyof HorsePayload, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: field === "heightCm" || field === "weightKg" ? (value.trim() ? Number(value) : undefined) : value,
    }));
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await createOwnerHorse(form);
      setForm(emptyForm);
      setMessage("Horse submitted for admin review.");
      await loadHorses();
    } catch (error) {
      setMessage(getApiErrorMessage(error, "Could not submit this horse."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <OwnerLayout>
      <section aria-labelledby="owner-horses-title" className="space-y-6">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.14em] text-[#006d5b]">Stable management</p>
          <h1 id="owner-horses-title" className="mt-2 text-4xl font-black tracking-tight">
            My Horses
          </h1>
          <p className="mt-2 max-w-3xl text-base leading-7 text-slate-600">
            Submit horse profiles with image and ownership evidence for admin approval.
          </p>
        </div>

        {message && (
          <p className="rounded-md border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700" role="status">
            {message}
          </p>
        )}

        <form className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 md:grid-cols-2 xl:grid-cols-4" onSubmit={handleCreate}>
          <label className="space-y-1 text-sm font-bold text-slate-700">
            <span>Horse name</span>
            <input className="min-h-11 w-full rounded-md border border-slate-300 px-3" onChange={(event) => updateField("name", event.target.value)} required value={form.name} />
          </label>
          <label className="space-y-1 text-sm font-bold text-slate-700">
            <span>Gender</span>
            <select className="min-h-11 w-full rounded-md border border-slate-300 px-3" onChange={(event) => updateField("gender", event.target.value)} required value={form.gender}>
              <option value="">Select gender</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
            </select>
          </label>
          <label className="space-y-1 text-sm font-bold text-slate-700 md:col-span-2">
            <span>Horse image URL</span>
            <input className="min-h-11 w-full rounded-md border border-slate-300 px-3" onChange={(event) => updateField("imageUrl", event.target.value)} required type="url" value={form.imageUrl} />
          </label>
          <label className="space-y-1 text-sm font-bold text-slate-700 md:col-span-2">
            <span>Evidence URL</span>
            <input className="min-h-11 w-full rounded-md border border-slate-300 px-3" onChange={(event) => updateField("evidenceUrl", event.target.value)} required type="url" value={form.evidenceUrl} />
          </label>
          <label className="space-y-1 text-sm font-bold text-slate-700">
            <span>Breed</span>
            <input className="min-h-11 w-full rounded-md border border-slate-300 px-3" onChange={(event) => updateField("breed", event.target.value)} value={form.breed} />
          </label>
          <label className="space-y-1 text-sm font-bold text-slate-700">
            <span>Color</span>
            <input className="min-h-11 w-full rounded-md border border-slate-300 px-3" onChange={(event) => updateField("color", event.target.value)} value={form.color} />
          </label>
          <div className="flex items-end xl:col-span-4">
            <button className="min-h-11 rounded-md bg-[#006d5b] px-5 text-sm font-black text-white disabled:opacity-50" disabled={saving} type="submit">
              {saving ? "Saving..." : "Add Horse"}
            </button>
          </div>
        </form>

        {loading ? (
          <div className="rounded-lg border border-slate-200 bg-white py-16 text-center text-sm font-bold text-slate-500">Loading horses...</div>
        ) : horses.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white py-16 text-center text-sm font-bold text-slate-500">No horses submitted yet.</div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-xs font-black uppercase text-slate-500">
                <tr>
                  <th className="px-6 py-3">Horse</th>
                  <th className="px-6 py-3">Gender</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {horses.map((horse) => (
                  <tr key={horse.id}>
                    <td className="px-6 py-4">
                      <p className="font-black">{horse.name}</p>
                      <div className="mt-2 flex gap-3 text-xs font-black">
                        {horse.imageUrl && <a className="text-[#006d5b] underline" href={horse.imageUrl}>Open image</a>}
                        {horse.evidenceUrl && <a className="text-[#070f4f] underline" href={horse.evidenceUrl}>Open evidence</a>}
                      </div>
                    </td>
                    <td className="px-6 py-4">{horse.gender}</td>
                    <td className="px-6 py-4">
                      <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-black">{horse.status}</span>
                      {horse.rejectionReason && <p className="mt-2 text-xs font-bold text-rose-700">{horse.rejectionReason}</p>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </OwnerLayout>
  );
}
```

- [ ] **Step 4: Add route**

In `frontend/src/routes/AppRouter.tsx`:

```tsx
<Route path="owner/horses" element={authRoute(<OwnerHorsesPage />)} />
```

- [ ] **Step 5: Run tests**

```powershell
npm test -- --run src/pages/owner/OwnerHorsesPage.test.tsx src/App.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add frontend/src/pages/owner/OwnerHorsesPage.tsx frontend/src/pages/owner/OwnerHorsesPage.test.tsx frontend/src/routes/AppRouter.tsx
git commit -m "feat: add owner horse management page"
```

---

### Task 6: Owner Tournament Registrations Page

**Files:**
- Create: `frontend/src/pages/owner/OwnerTournamentRegistrationsPage.tsx`
- Test: `frontend/src/pages/owner/OwnerTournamentRegistrationsPage.test.tsx`
- Modify: `frontend/src/routes/AppRouter.tsx`

- [ ] **Step 1: Write failing registration page test**

Create `frontend/src/pages/owner/OwnerTournamentRegistrationsPage.test.tsx`:

```tsx
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createOwnerTournamentRegistration,
  getOwnerHorses,
  getOwnerTournamentRegistrations,
  getPublicTournaments,
} from "../../api/racingApi";
import { OwnerTournamentRegistrationsPage } from "./OwnerTournamentRegistrationsPage";

vi.mock("../../api/racingApi", () => ({
  createOwnerTournamentRegistration: vi.fn(),
  getOwnerHorses: vi.fn(),
  getOwnerTournamentRegistrations: vi.fn(),
  getPublicTournaments: vi.fn(),
  withdrawOwnerTournamentRegistration: vi.fn(),
}));

describe("OwnerTournamentRegistrationsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getPublicTournaments).mockResolvedValue([
      { id: 1, name: "Spring Cup", status: "OPEN_REGISTRATION" },
      { id: 2, name: "Closed Cup", status: "CLOSED_REGISTRATION" },
    ]);
    vi.mocked(getOwnerHorses).mockResolvedValue([
      { id: 3, name: "Approved Horse", gender: "MALE", status: "APPROVED" },
      { id: 4, name: "Pending Horse", gender: "FEMALE", status: "PENDING" },
    ]);
    vi.mocked(getOwnerTournamentRegistrations).mockResolvedValue([]);
    vi.mocked(createOwnerTournamentRegistration).mockResolvedValue({
      id: 8,
      tournamentId: 1,
      tournamentName: "Spring Cup",
      horseId: 3,
      horseName: "Approved Horse",
      status: "PENDING",
    });
  });

  it("submits an approved horse into an open tournament", async () => {
    render(
      <MemoryRouter>
        <OwnerTournamentRegistrationsPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: /tournament registrations/i })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /approved horse/i })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: /pending horse/i })).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/^tournament$/i), { target: { value: "1" } });
    fireEvent.change(screen.getByLabelText(/^horse$/i), { target: { value: "3" } });
    fireEvent.click(screen.getByRole("button", { name: /submit registration/i }));

    await waitFor(() => {
      expect(createOwnerTournamentRegistration).toHaveBeenCalledWith({ tournamentId: 1, horseId: 3, note: undefined });
    });
  });
});
```

- [ ] **Step 2: Run page test to verify it fails**

```powershell
npm test -- --run src/pages/owner/OwnerTournamentRegistrationsPage.test.tsx
```

Expected: FAIL because page does not exist.

- [ ] **Step 3: Implement page**

Create `frontend/src/pages/owner/OwnerTournamentRegistrationsPage.tsx`. The implementation must keep these concrete behaviors:

```tsx
const openTournaments = tournaments.filter((tournament) => tournament.status === "OPEN_REGISTRATION");
const approvedHorses = horses.filter((horse) => horse.status === "APPROVED");
```

Submit exactly this payload shape:

```tsx
await createOwnerTournamentRegistration({
  tournamentId: Number(form.tournamentId),
  horseId: Number(form.horseId),
  note: form.note.trim() || undefined,
});
```

Use this withdraw guard in the table action:

```tsx
<button
  disabled={registration.status !== "PENDING" || saving}
  onClick={() => handleWithdraw(registration)}
  type="button"
>
  Withdraw
</button>
```

The page must use `OwnerLayout`, `getApiErrorMessage`, visible labels `Tournament`, `Horse`, and `Note`, a submit button named `Submit Registration`, a status table with `rejectionReason`, and an `overflow-x-auto` wrapper around the table.

- [ ] **Step 4: Add route**

In `frontend/src/routes/AppRouter.tsx`:

```tsx
<Route path="owner/registrations" element={authRoute(<OwnerTournamentRegistrationsPage />)} />
```

- [ ] **Step 5: Run tests**

```powershell
npm test -- --run src/pages/owner/OwnerTournamentRegistrationsPage.test.tsx src/App.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add frontend/src/pages/owner/OwnerTournamentRegistrationsPage.tsx frontend/src/pages/owner/OwnerTournamentRegistrationsPage.test.tsx frontend/src/routes/AppRouter.tsx
git commit -m "feat: add owner tournament registrations page"
```

---

### Task 7: Backend Owner Horse Creation and Admin Review

**Files:**
- Modify: `backend/src/main/resources/schema.sql`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/horse/entity/Horse.java`
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/horse/dto/request/OwnerHorseRequest.java`
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/horse/dto/request/RejectHorseRequest.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/horse/dto/response/HorseResponse.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/horse/repository/HorseRepository.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/horse/service/HorseService.java`
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/horse/controller/OwnerHorseController.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/horse/controller/AdminHorseController.java`
- Test: `backend/src/test/java/com/example/horseracingtournamentsystem/horse/OwnerHorseIntegrationTest.java`
- Test: `backend/src/test/java/com/example/horseracingtournamentsystem/horse/HorseIntegrationTest.java`

- [ ] **Step 1: Write failing owner horse integration test**

Create `OwnerHorseIntegrationTest` with tests:

- `ownerCreatesPendingHorseWithoutOwnerId`
- `missingEvidenceReturnsValidationError`
- `spectatorCannotCreateOwnerHorse`

Use setup style from existing `HorseIntegrationTest`, but create `HORSE_OWNER` role and token:

```java
ownerToken = jwtService.generateToken(ownerUser.getEmail(), Set.of("HORSE_OWNER"));
```

POST body must not include ownerId:

```json
{
  "name": "Nova",
  "gender": "FEMALE",
  "imageUrl": "https://cdn.example.com/nova.jpg",
  "evidenceUrl": "https://cdn.example.com/nova.pdf"
}
```

Expected assertions:

```java
.andExpect(status().isCreated())
.andExpect(jsonPath("$.name").value("Nova"))
.andExpect(jsonPath("$.ownerId").value(ownerUser.getId()))
.andExpect(jsonPath("$.status").value("PENDING"))
.andExpect(jsonPath("$.imageUrl").value("https://cdn.example.com/nova.jpg"))
.andExpect(jsonPath("$.evidenceUrl").value("https://cdn.example.com/nova.pdf"));
```

- [ ] **Step 2: Write failing admin review tests**

Extend `HorseIntegrationTest` with:

- `adminApprovesPendingHorse`
- `adminRejectsPendingHorseWithReason`
- `adminCannotReviewApprovedHorseAgain`

Expected review failure:

```java
.andExpect(status().isConflict())
.andExpect(jsonPath("$.message").value("Only pending horses can be reviewed"));
```

- [ ] **Step 3: Run backend horse tests to verify failure**

```powershell
mvn test "-Dtest=OwnerHorseIntegrationTest,HorseIntegrationTest"
```

Expected: FAIL because owner endpoints and review endpoints do not exist.

- [ ] **Step 4: Add schema migration**

Append idempotent SQL Server-compatible checks to `backend/src/main/resources/schema.sql` for:

- `horses.image_url`
- `horses.evidence_url`
- `horses.medical_note`
- `horses.height_cm`
- `horses.weight_kg`
- `horses.health_status`
- `horses.description`
- `horses.rejection_reason`
- `horses.approved_by`
- `horses.approved_at`

Use the same idempotent `IF OBJECT_ID` plus `COL_LENGTH` pattern already in `schema.sql`.

- [ ] **Step 5: Add DTOs and entity methods**

Create `OwnerHorseRequest` with `@NotBlank imageUrl`, `@NotBlank evidenceUrl`, `@Pattern(regexp = "MALE|FEMALE")`, `@PastOrPresent dateOfBirth`, `@Positive heightCm`, and `@Positive weightKg`.

Create `RejectHorseRequest`:

```java
package com.example.horseracingtournamentsystem.horse.dto.request;

import jakarta.validation.constraints.NotBlank;

public record RejectHorseRequest(@NotBlank(message = "Rejection reason is required") String reason) {
}
```

Add Horse methods:

```java
public static Horse submitForReview(User owner, OwnerHorseRequest request, String registrationCode) {
    Horse horse = new Horse();
    horse.owner = owner;
    horse.name = request.name();
    horse.registrationCode = registrationCode;
    horse.breed = request.breed();
    horse.gender = request.gender();
    horse.dateOfBirth = request.dateOfBirth();
    horse.color = request.color();
    horse.imageUrl = request.imageUrl();
    horse.evidenceUrl = request.evidenceUrl();
    horse.heightCm = request.heightCm();
    horse.weightKg = request.weightKg();
    horse.healthStatus = request.healthStatus();
    horse.medicalNote = request.medicalNote();
    horse.description = request.description();
    horse.status = "PENDING";
    horse.createdAt = LocalDateTime.now();
    return horse;
}

public void approve(User reviewer) {
    if (!"PENDING".equals(this.status)) {
        throw new ResponseStatusException(HttpStatus.CONFLICT, "Only pending horses can be reviewed");
    }
    this.status = "APPROVED";
    this.approvedBy = reviewer;
    this.approvedAt = LocalDateTime.now();
    this.rejectionReason = null;
    this.updatedAt = LocalDateTime.now();
}

public void reject(String reason) {
    if (!"PENDING".equals(this.status)) {
        throw new ResponseStatusException(HttpStatus.CONFLICT, "Only pending horses can be reviewed");
    }
    this.status = "REJECTED";
    this.rejectionReason = reason;
    this.approvedBy = null;
    this.approvedAt = null;
    this.updatedAt = LocalDateTime.now();
}
```

- [ ] **Step 6: Add service/controller methods**

Add service methods:

- `getOwnerHorses(String email)`
- `createOwnerHorse(String email, OwnerHorseRequest request)`
- `approveHorse(Long id, String adminEmail)`
- `rejectHorse(Long id, String adminEmail, String reason)`

Create `OwnerHorseController`:

```java
@RestController
@RequestMapping("/api/v1/owner/horses")
@RequiredArgsConstructor
public class OwnerHorseController {
    private final HorseService horseService;

    @GetMapping
    public List<HorseResponse> listMine(Authentication authentication) {
        return horseService.getOwnerHorses(authentication.getName());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public HorseResponse create(Authentication authentication, @Valid @RequestBody OwnerHorseRequest request) {
        return horseService.createOwnerHorse(authentication.getName(), request);
    }
}
```

Add admin endpoints:

```java
@PostMapping("/{id}/approve")
public HorseResponse approve(@PathVariable Long id, Authentication authentication) {
    return horseService.approveHorse(id, authentication.getName());
}

@PostMapping("/{id}/reject")
public HorseResponse reject(@PathVariable Long id, Authentication authentication, @Valid @RequestBody RejectHorseRequest request) {
    return horseService.rejectHorse(id, authentication.getName(), request.reason());
}
```

- [ ] **Step 7: Run backend tests**

```powershell
mvn test "-Dtest=OwnerHorseIntegrationTest,HorseIntegrationTest"
```

Expected: PASS.

- [ ] **Step 8: Commit**

```powershell
git add backend/src/main/resources/schema.sql backend/src/main/java/com/example/horseracingtournamentsystem/horse backend/src/test/java/com/example/horseracingtournamentsystem/horse
git commit -m "feat: add owner horse review workflow"
```

---

### Task 8: Backend Tournament Registration Workflow

**Files:**
- Modify: `backend/src/main/resources/schema.sql`
- Create package: `backend/src/main/java/com/example/horseracingtournamentsystem/tournamentregistration/**`
- Test: `backend/src/test/java/com/example/horseracingtournamentsystem/tournamentregistration/TournamentRegistrationIntegrationTest.java`

- [ ] **Step 1: Write failing integration tests**

Create tests for:

- `ownerRegistersApprovedOwnHorseIntoOpenTournament`
- `ownerCannotRegisterPendingHorse`
- `ownerCannotRegisterAnotherOwnersHorse`
- `ownerCanWithdrawPendingRegistration`
- `adminApprovesPendingRegistration`
- `adminRejectsPendingRegistrationWithReason`
- `adminCannotReviewApprovedRegistrationAgain`

Use expected status values:

```java
.andExpect(jsonPath("$.status").value("PENDING"));
.andExpect(jsonPath("$.status").value("WITHDRAWN"));
.andExpect(jsonPath("$.status").value("APPROVED"));
.andExpect(jsonPath("$.status").value("REJECTED"));
```

- [ ] **Step 2: Run registration tests to verify failure**

```powershell
mvn test "-Dtest=TournamentRegistrationIntegrationTest"
```

Expected: FAIL because package/endpoints do not exist.

- [ ] **Step 3: Add schema migration**

Append idempotent SQL Server-compatible creation for `tournament_registrations`:

- `id`
- `tournament_id`
- `horse_id`
- `owner_id`
- `status`
- `note`
- `rejection_reason`
- `reviewed_by`
- `reviewed_at`
- `created_at`
- `updated_at`
- `withdrawn_at`

Add foreign keys only when missing.

- [ ] **Step 4: Add entity, repository, DTOs, mapper**

Entity must have methods:

```java
public static TournamentRegistration pending(Tournament tournament, Horse horse, User owner, String note) {
    TournamentRegistration registration = new TournamentRegistration();
    registration.tournament = tournament;
    registration.horse = horse;
    registration.owner = owner;
    registration.note = note;
    registration.status = "PENDING";
    registration.createdAt = LocalDateTime.now();
    return registration;
}

public void approve(User reviewer) {
    ensurePendingForReview();
    this.status = "APPROVED";
    this.reviewedBy = reviewer;
    this.reviewedAt = LocalDateTime.now();
    this.rejectionReason = null;
    this.updatedAt = LocalDateTime.now();
}

public void reject(User reviewer, String reason) {
    ensurePendingForReview();
    this.status = "REJECTED";
    this.reviewedBy = reviewer;
    this.reviewedAt = LocalDateTime.now();
    this.rejectionReason = reason;
    this.updatedAt = LocalDateTime.now();
}

public void withdraw() {
    if (!"PENDING".equals(this.status)) {
        throw new ResponseStatusException(HttpStatus.CONFLICT, "Only pending registrations can be withdrawn");
    }
    this.status = "WITHDRAWN";
    this.withdrawnAt = LocalDateTime.now();
    this.updatedAt = LocalDateTime.now();
}

private void ensurePendingForReview() {
    if (!"PENDING".equals(this.status)) {
        throw new ResponseStatusException(HttpStatus.CONFLICT, "Only pending registrations can be reviewed");
    }
}
```

Each review method must throw:

```java
throw new ResponseStatusException(HttpStatus.CONFLICT, "Only pending registrations can be reviewed");
```

Withdrawal must throw:

```java
throw new ResponseStatusException(HttpStatus.CONFLICT, "Only pending registrations can be withdrawn");
```

- [ ] **Step 5: Add service business rules**

Service creation must check:

- current user exists
- horse belongs to current user
- horse status is `APPROVED`
- tournament status is `OPEN_REGISTRATION`
- current time is within registration window
- no non-withdrawn duplicate exists
- approved registration count is below `maxHorses` when max is present

Use exact response messages:

- `Horse does not belong to current owner`
- `Horse must be approved before tournament registration`
- `Tournament is not open for registration`
- `Registration window is closed`
- `Horse already has a registration for this tournament`
- `Tournament is full`

- [ ] **Step 6: Add owner/admin controllers**

Owner:

- `GET /api/v1/owner/tournament-registrations`
- `POST /api/v1/owner/tournament-registrations`
- `POST /api/v1/owner/tournament-registrations/{id}/withdraw`

Admin:

- `GET /api/v1/admin/tournament-registrations?status=PENDING`
- `POST /api/v1/admin/tournament-registrations/{id}/approve`
- `POST /api/v1/admin/tournament-registrations/{id}/reject`

- [ ] **Step 7: Run backend tests**

```powershell
mvn test "-Dtest=TournamentRegistrationIntegrationTest"
```

Expected: PASS.

- [ ] **Step 8: Commit**

```powershell
git add backend/src/main/resources/schema.sql backend/src/main/java/com/example/horseracingtournamentsystem/tournamentregistration backend/src/test/java/com/example/horseracingtournamentsystem/tournamentregistration
git commit -m "feat: add tournament registration workflow"
```

---

### Task 9: Admin Review Page Integration

**Files:**
- Create: `frontend/src/pages/admin/AdminHorsesPage.tsx`
- Create: `frontend/src/pages/admin/AdminHorsesPage.test.tsx`
- Create: `frontend/src/pages/admin/AdminTournamentRegistrationsPage.tsx`
- Create: `frontend/src/pages/admin/AdminTournamentRegistrationsPage.test.tsx`
- Modify: `frontend/src/layouts/AdminLayout.tsx`
- Modify: `frontend/src/routes/AppRouter.tsx`
- Modify: `frontend/src/App.test.tsx`

- [ ] **Step 1: Write failing admin horse page test**

Test that `/admin/horses` loads pending horses, shows evidence link, and calls `approveAdminHorse`.

- [ ] **Step 2: Write failing admin registration page test**

Test that `/admin/tournament-registrations` loads pending registrations, shows horse/tournament/owner, and calls `approveAdminTournamentRegistration`.

- [ ] **Step 3: Run admin page tests to verify failure**

```powershell
npm test -- --run src/pages/admin/AdminHorsesPage.test.tsx src/pages/admin/AdminTournamentRegistrationsPage.test.tsx
```

Expected: FAIL because pages/routes do not exist.

- [ ] **Step 4: Implement admin pages**

Use existing `AdminLayout`, do not redesign it. Follow current admin table/card visual language. Add status filters, evidence links, approve buttons, reject reason forms, and disabled actions for non-`PENDING` states.

- [ ] **Step 5: Add admin nav entries with lucide icons**

In `frontend/src/layouts/AdminLayout.tsx`, add:

```ts
{ label: "Horse Approvals", href: "/admin/horses", icon: Trophy },
{ label: "Registrations", href: "/admin/tournament-registrations", icon: ClipboardList },
```

Use existing icon imports or add `ClipboardList`.

- [ ] **Step 6: Add routes and App tests**

In `frontend/src/routes/AppRouter.tsx`:

```tsx
<Route path="admin/horses" element={adminRoute(<AdminHorsesPage />)} />
<Route path="admin/tournament-registrations" element={adminRoute(<AdminTournamentRegistrationsPage />)} />
```

Add App tests for both admin routes and nav links.

- [ ] **Step 7: Run frontend admin tests**

```powershell
npm test -- --run src/pages/admin/AdminHorsesPage.test.tsx src/pages/admin/AdminTournamentRegistrationsPage.test.tsx src/App.test.tsx
```

Expected: PASS.

- [ ] **Step 8: Commit**

```powershell
git add frontend/src/pages/admin/AdminHorsesPage.tsx frontend/src/pages/admin/AdminHorsesPage.test.tsx frontend/src/pages/admin/AdminTournamentRegistrationsPage.tsx frontend/src/pages/admin/AdminTournamentRegistrationsPage.test.tsx frontend/src/layouts/AdminLayout.tsx frontend/src/routes/AppRouter.tsx frontend/src/App.test.tsx
git commit -m "feat: add admin racing review pages"
```

---

### Task 10: Full Verification and Polish

**Files:**
- Modify only files needed for fixes found by verification.

- [ ] **Step 1: Run backend full test suite**

```powershell
mvn test
```

Expected: BUILD SUCCESS.

- [ ] **Step 2: Run frontend full test suite**

```powershell
npm test -- --run
```

Expected: all test files pass.

- [ ] **Step 3: Run frontend production build**

```powershell
npm run build
```

Expected: TypeScript build and Vite build pass.

- [ ] **Step 4: UI quality pass**

Review owner pages manually in code against these checks:

- Public header does not contain owner/admin feature links.
- Owner dashboard has no horse creation form.
- Owner pages have visible labels and `min-h-11` controls.
- Tables use `overflow-x-auto`.
- Error/status messages use text labels, not color alone.
- Admin layout still contains existing user CRUD and role request nav.

- [ ] **Step 5: Commit verification fixes if any**

If verification required changes, first run:

```powershell
git status --short
```

Then stage only the files changed during Task 10 and commit:

```powershell
git commit -m "fix: polish owner workspace flow"
```

If no changes were required, do not create an empty commit.

---

## Self-Review

- Spec coverage: Owner workspace routing, public header cleanup, OwnerLayout, dashboard, horses page, registrations page, backend owner horse flow, tournament registration flow, and admin integration are covered.
- Admin scope: Existing admin overview/user CRUD/role request pages are explicitly preserved.
- UI/UX coverage: The plan includes ui-ux-pro-max rules for navigation, touch targets, forms, feedback, status badges, responsive tables, and dashboard hierarchy.
- Testing coverage: Each major frontend page and backend business rule has a focused test task.
- Type consistency: Frontend types in Task 3 are reused by owner/admin pages and API functions in later tasks.
