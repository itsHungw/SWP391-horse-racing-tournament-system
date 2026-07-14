# Error UI And Route Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the branded 404/403/500 frontend foundation, normalize authentication/role routing, and remove dead placeholder routes without changing backend behavior.

**Architecture:** A small shared error-page family owns full-screen dead-end states, while route guards select login redirect versus access-denied rendering. An application error boundary catches render failures. The router exposes a truthful catch-all 404 and no longer advertises frontend placeholders as implemented screens.

**Tech Stack:** React 19, React Router 7, TypeScript 5.8, Tailwind CSS 4, Lucide React, Vitest, Testing Library

---

## File Structure

- Create `frontend/src/pages/errors/NotFoundPage.tsx`: cinematic horse-racing 404 and safe navigation actions.
- Create `frontend/src/pages/errors/AccessDeniedPage.tsx`: shared role-aware 403 page.
- Create `frontend/src/pages/errors/UnexpectedErrorPage.tsx`: recoverable 500/render-failure page.
- Create `frontend/src/pages/errors/ErrorPages.test.tsx`: semantic, navigation, and accessibility behavior for all three pages.
- Create `frontend/src/components/errors/AppErrorBoundary.tsx`: root render-error boundary.
- Create `frontend/src/components/errors/AppErrorBoundary.test.tsx`: boundary fallback and reset behavior.
- Modify `frontend/src/App.tsx`: mount the error boundary around the router.
- Modify `frontend/src/routes/RequireAuthRoute.tsx`: redirect unauthenticated users to login with internal `returnTo` state.
- Modify `frontend/src/routes/RequireRoleRoute.tsx`: use the shared 403 page and the same login behavior.
- Modify `frontend/src/routes/RequireAdminRoute.tsx`: delegate to the shared role guard.
- Create `frontend/src/routes/RouteGuards.test.tsx`: focused tests for login redirect, URL preservation, and missing-role 403.
- Modify `frontend/src/routes/AppRouter.tsx`: mount 404, remove placeholder routes/imports, and retain real routes.
- Modify `frontend/src/App.test.tsx`: assert branded 404 and shared 403 integration.
- Modify `frontend/src/styles.css`: add scoped error-page motion and reduced-motion overrides.
- Delete `frontend/src/pages/errors/AdminForbiddenPage.tsx`: superseded admin-only page.
- Delete `frontend/src/routes/RequireRefereeRoute.tsx` and its test: unused duplicate guard.
- Delete `frontend/src/pages/RoleDashboardPage.tsx` and its test: unused placeholder.
- Delete `frontend/src/pages/admin/AdminPlaceholderPage.tsx`: only used by placeholder routes being removed.

### Task 1: Branded Error Page Family

**Files:**
- Create: `frontend/src/pages/errors/NotFoundPage.tsx`
- Create: `frontend/src/pages/errors/AccessDeniedPage.tsx`
- Create: `frontend/src/pages/errors/UnexpectedErrorPage.tsx`
- Create: `frontend/src/pages/errors/ErrorPages.test.tsx`
- Modify: `frontend/src/styles.css`

- [ ] **Step 1: Write failing semantic and navigation tests**

Create `ErrorPages.test.tsx` with tests that render each page in `MemoryRouter`:

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { AccessDeniedPage } from "./AccessDeniedPage";
import { NotFoundPage } from "./NotFoundPage";
import { UnexpectedErrorPage } from "./UnexpectedErrorPage";

describe("error pages", () => {
  it("renders a branded 404 with safe recovery actions", () => {
    render(<MemoryRouter><NotFoundPage /></MemoryRouter>);
    expect(screen.getByRole("heading", { name: /missed the starting gate/i })).toBeInTheDocument();
    expect(screen.getByText("404")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /back to home/i })).toHaveAttribute("href", "/");
    expect(screen.getByRole("button", { name: /go back/i })).toBeInTheDocument();
  });

  it("explains the missing role without treating the user as logged out", () => {
    render(<MemoryRouter><AccessDeniedPage requiredRole="HORSE_OWNER" workspaceName="Owner Workspace" email="fan@example.com" /></MemoryRouter>);
    expect(screen.getByRole("heading", { name: /access beyond this gate is restricted/i })).toBeInTheDocument();
    expect(screen.getByText(/horse owner/i)).toBeInTheDocument();
    expect(screen.getByText(/fan@example.com/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /review role requests/i })).toHaveAttribute("href", "/my-role-requests");
  });

  it("lets an unexpected-error fallback retry", () => {
    const onRetry = vi.fn();
    render(<MemoryRouter><UnexpectedErrorPage onRetry={onRetry} /></MemoryRouter>);
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Run the focused test and verify failure**

Run:

```powershell
cd frontend
npm test -- --run src/pages/errors/ErrorPages.test.tsx
```

Expected: FAIL because the three new page modules do not exist.

- [ ] **Step 3: Implement the three pages with one visual system**

Implement these public interfaces exactly:

```ts
export type AccessDeniedPageProps = {
  requiredRole?: string;
  workspaceName?: string;
  email?: string | null;
};

export type UnexpectedErrorPageProps = {
  onRetry?: () => void;
};
```

`NotFoundPage` must use the local `slide.jpg`, logo, `useDocumentTitle`, `useNavigate`, a single `main` landmark, a visible `404`, a home link, and a `navigate(-1)` button. `AccessDeniedPage` must display the normalized role label, signed-in email, Role Requests/Home actions, and no login prompt. `UnexpectedErrorPage` must display Retry when supplied and always display Back Home.

Use existing theme tokens/classes rather than adding Helvetica or a remote video. Add only scoped classes:

```css
.error-cinematic-bg { animation: error-cinematic-drift 18s ease-in-out infinite alternate; }
.error-light-sweep { animation: error-light-sweep 9s ease-in-out infinite; }
.error-hero-enter { animation: error-hero-enter 600ms cubic-bezier(0.16, 1, 0.3, 1) both; }

@keyframes error-cinematic-drift {
  from { transform: scale(1.03); }
  to { transform: scale(1.08); }
}

@keyframes error-light-sweep {
  0%, 100% { opacity: 0.15; transform: translateX(-12%); }
  50% { opacity: 0.35; transform: translateX(12%); }
}

@keyframes error-hero-enter {
  from { opacity: 0; transform: translateY(18px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (prefers-reduced-motion: reduce) {
  .error-cinematic-bg, .error-light-sweep, .error-hero-enter {
    animation: none;
    transform: none;
  }
}
```

- [ ] **Step 4: Run focused tests**

Run `npm test -- --run src/pages/errors/ErrorPages.test.tsx`.

Expected: 3 tests PASS with no act warnings.

- [ ] **Step 5: Commit the error page family**

```powershell
git add frontend/src/pages/errors frontend/src/styles.css
git commit -m "feat: add branded error page family"
```

### Task 2: Root Error Boundary

**Files:**
- Create: `frontend/src/components/errors/AppErrorBoundary.tsx`
- Create: `frontend/src/components/errors/AppErrorBoundary.test.tsx`
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Write a failing boundary test**

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { AppErrorBoundary } from "./AppErrorBoundary";

function Broken(): never { throw new Error("render failed"); }

describe("AppErrorBoundary", () => {
  it("renders the 500 surface and can reset", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    render(<MemoryRouter><AppErrorBoundary><Broken /></AppErrorBoundary></MemoryRouter>);
    expect(screen.getByRole("heading", { name: /unexpected obstacle/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(screen.getByRole("heading", { name: /unexpected obstacle/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run and verify failure**

Run `npm test -- --run src/components/errors/AppErrorBoundary.test.tsx`.

Expected: FAIL because `AppErrorBoundary` does not exist.

- [ ] **Step 3: Implement the boundary and mount it**

Create a class component with `hasError` state, `getDerivedStateFromError`, `componentDidCatch` logging, and a reset handler that clears the error state. Render `UnexpectedErrorPage` as fallback. Wrap `<BrowserRouter><AppRouter /></BrowserRouter>` with `AppErrorBoundary` inside `App.tsx`, keeping the boundary inside `BrowserRouter` so fallback links work.

- [ ] **Step 4: Run focused tests**

Run `npm test -- --run src/components/errors/AppErrorBoundary.test.tsx`.

Expected: PASS. The console error is mocked only in the test.

- [ ] **Step 5: Commit**

```powershell
git add frontend/src/components/errors frontend/src/App.tsx
git commit -m "feat: add application error boundary"
```

### Task 3: Normalize Authentication And Role Guards

**Files:**
- Create: `frontend/src/routes/RouteGuards.test.tsx`
- Modify: `frontend/src/routes/RequireAuthRoute.tsx`
- Modify: `frontend/src/routes/RequireRoleRoute.tsx`
- Modify: `frontend/src/routes/RequireAdminRoute.tsx`
- Delete: `frontend/src/pages/errors/AdminForbiddenPage.tsx`

- [ ] **Step 1: Write failing guard tests**

Mock `useClientSession` and cover:

```tsx
it("redirects an unauthenticated visitor to login with returnTo state", () => {
  // MemoryRouter starts at /owner/dashboard; /login renders useLocation().state?.returnTo.
  // Expect the rendered returnTo to equal /owner/dashboard?tab=entries.
});

it("renders shared access denied and preserves the requested URL", () => {
  // Authenticated SPECTATOR requests /owner/dashboard.
  // Expect shared 403 heading and a probe reading /owner/dashboard.
});

it("renders children for a matching role", () => {
  // Authenticated HORSE_OWNER sees protected content.
});
```

The concrete login probe must read `useLocation().state?.returnTo`, and the location probe must render `useLocation().pathname` so the test proves the 403 does not navigate away.

- [ ] **Step 2: Run guard tests and verify failure**

Run `npm test -- --run src/routes/RouteGuards.test.tsx`.

Expected: FAIL because unauthenticated role guard currently redirects home and missing-role UI is not shared.

- [ ] **Step 3: Implement normalized guard behavior**

In both auth and role guards, derive an internal return location:

```tsx
const location = useLocation();
const returnTo = `${location.pathname}${location.search}${location.hash}`;
return <Navigate to="/login" replace state={{ returnTo }} />;
```

For a missing role, render:

```tsx
<AccessDeniedPage
  requiredRole={role}
  workspaceName={workspaceName}
  email={session?.email}
/>
```

Implement `RequireAdminRoute` as a thin wrapper around `RequireRoleRoute` with `role="ADMIN"` and `workspaceName="Admin Operations"` so behavior cannot drift.

- [ ] **Step 4: Run guard and existing app tests**

Run:

```powershell
npm test -- --run src/routes/RouteGuards.test.tsx src/App.test.tsx
```

Expected: guard tests PASS. Update only App assertions whose copy intentionally changed from the admin-specific page to shared 403.

- [ ] **Step 5: Commit**

```powershell
git add frontend/src/routes frontend/src/pages/errors/AdminForbiddenPage.tsx frontend/src/App.test.tsx
git commit -m "refactor: standardize protected route guards"
```

### Task 4: Truthful 404 Routing And Dead-Page Cleanup

**Files:**
- Modify: `frontend/src/routes/AppRouter.tsx`
- Modify: `frontend/src/App.test.tsx`
- Delete: `frontend/src/routes/RequireRefereeRoute.tsx`
- Delete: `frontend/src/routes/RequireRefereeRoute.test.tsx`
- Delete: `frontend/src/pages/RoleDashboardPage.tsx`
- Delete: `frontend/src/pages/RoleDashboardPage.test.tsx`
- Delete: `frontend/src/pages/admin/AdminPlaceholderPage.tsx`

- [ ] **Step 1: Add failing router integration tests**

Add to `App.test.tsx`:

```tsx
it("renders the branded 404 for an unknown route without redirecting home", () => {
  window.history.pushState({}, "", "/route-that-does-not-exist");
  render(<App />);
  expect(screen.getByRole("heading", { name: /missed the starting gate/i })).toBeInTheDocument();
  expect(window.location.pathname).toBe("/route-that-does-not-exist");
});

it.each(["/admin/participants", "/admin/standings", "/admin/races", "/admin/settings"])(
  "does not present removed placeholder route %s as a real workspace",
  async (path) => {
    window.history.pushState({}, "", path);
    setClientSession(createTokenWithRoles(["ADMIN"]), "Admin", "admin@example.com");
    render(<App />);
    expect(await screen.findByRole("heading", { name: /missed the starting gate/i })).toBeInTheDocument();
  },
);
```

- [ ] **Step 2: Run integration tests and verify failure**

Run `npm test -- --run src/App.test.tsx`.

Expected: unknown route redirects home and placeholder routes render `AdminPlaceholderPage`, so the new cases FAIL.

- [ ] **Step 3: Update the router and delete dead files**

- Lazy-load `NotFoundPage` or import it eagerly with the public/error surfaces.
- Remove the `AdminPlaceholderPage` import and its four routes.
- Replace `<Route path="*" element={<Navigate to="/" replace />} />` with `<Route path="*" element={<NotFoundPage />} />`.
- Delete the unused duplicate/placeholder files listed above.
- Do not remove backend admin race APIs or any real frontend route.

- [ ] **Step 4: Run frontend tests and build**

Run:

```powershell
npm test -- --run
npm run build
```

Expected: all Vitest tests PASS and TypeScript/Vite build exits 0.

- [ ] **Step 5: Commit**

```powershell
git add frontend/src/routes/AppRouter.tsx frontend/src/App.test.tsx frontend/src/routes/RequireRefereeRoute.tsx frontend/src/routes/RequireRefereeRoute.test.tsx frontend/src/pages/RoleDashboardPage.tsx frontend/src/pages/RoleDashboardPage.test.tsx frontend/src/pages/admin/AdminPlaceholderPage.tsx
git commit -m "refactor: replace placeholder routes with truthful 404"
```

### Task 5: Visual And Accessibility Verification

**Files:**
- Modify only if verification finds a concrete issue in files from Tasks 1-4.

- [ ] **Step 1: Start the frontend and inspect target routes**

Run `npm run dev -- --host 127.0.0.1` from `frontend` and inspect:

```text
/route-that-does-not-exist
/admin as an authenticated non-admin
/owner/dashboard as an authenticated spectator
```

Expected: 404 is cinematic and responsive; both missing-role cases share 403; no duplicate app-level main landmarks.

- [ ] **Step 2: Verify interaction and reduced motion**

Check keyboard order, visible focus, Back/Home actions, 320 px layout, desktop layout, and emulated `prefers-reduced-motion: reduce`.

Expected: all actions are keyboard reachable, contrast remains legible over the image, no horizontal overflow, and decorative animation stops under reduced motion.

- [ ] **Step 3: Run final automated verification**

```powershell
npm test -- --run
npm run build
```

Expected: tests PASS and build exits 0 after any visual fixes.

- [ ] **Step 4: Commit verification fixes if needed**

If verification required changes:

```powershell
git add frontend/src
git commit -m "fix: polish error page accessibility"
```

If no file changed, do not create an empty commit.
