# Referee Workspace UI Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refresh the referee workspace shell and overview page into the approved Steward Control Room design while keeping colors aligned to the existing project theme.

**Architecture:** Keep the work scoped to React presentation components. `RefereeLayout.tsx` owns the workspace shell, landmarks, navigation, and header. `RefereeOverviewPage.tsx` owns the assigned race task list and mode-specific actions.

**Tech Stack:** React 19, React Router 7, Tailwind CSS 4, Vitest, Testing Library.

---

### Task 1: Referee Layout Shell

**Files:**
- Modify: `frontend/src/layouts/RefereeLayout.test.tsx`
- Modify: `frontend/src/layouts/RefereeLayout.tsx`

- [ ] **Step 1: Write the failing layout test**

Update `frontend/src/layouts/RefereeLayout.test.tsx` to assert semantic workspace text and no emoji-driven role label:

```tsx
expect(screen.getByRole("banner", { name: /Referee operations header/i })).toBeInTheDocument();
expect(screen.getByRole("navigation", { name: /Referee workspace/i })).toBeInTheDocument();
expect(screen.getByText("Head Referee")).toBeInTheDocument();
expect(screen.getByText("Steward Control Room")).toBeInTheDocument();
expect(screen.getByText("On duty")).toBeInTheDocument();
```

- [ ] **Step 2: Run layout test to verify it fails**

Run:

```bash
npm test -- --run RefereeLayout
```

Expected: FAIL because current header lacks the new accessible names and Steward Control Room text.

- [ ] **Step 3: Implement layout shell**

Replace the emoji sidebar/header with a semantic dark-green shell:

- module-level `refereeNavItems` with `label`, `href`, `marker`, and `description`
- `<header aria-label="Referee operations header">`
- `<nav aria-label="Referee workspace">`
- dark `#004d3d` sidebar, gold `#d4af37` accents, warm light main canvas
- active route indicated by gold rail, surface contrast, and font weight

- [ ] **Step 4: Run layout test to verify it passes**

Run:

```bash
npm test -- --run RefereeLayout
```

Expected: PASS.

### Task 2: Referee Overview Surface

**Files:**
- Modify: `frontend/src/pages/referee/RefereeOverviewPage.test.tsx`
- Modify: `frontend/src/pages/referee/RefereeOverviewPage.tsx`

- [ ] **Step 1: Write the failing overview test**

Update `frontend/src/pages/referee/RefereeOverviewPage.test.tsx` to assert the designed loading/empty/action surfaces:

```tsx
expect(screen.getByText(/Preparing steward assignments/i)).toBeInTheDocument();
expect(await screen.findByText("Race Steward Assignments")).toBeInTheDocument();
expect(screen.getByText("OFFICIATING QUEUE")).toBeInTheDocument();
expect(screen.getByRole("link", { name: /Open Pre-Check/i })).toBeInTheDocument();
expect(screen.getByRole("link", { name: /Record Results/i })).toBeInTheDocument();
expect(screen.getByRole("link", { name: /File Incident/i })).toBeInTheDocument();
```

- [ ] **Step 2: Run overview test to verify it fails**

Run:

```bash
npm test -- --run RefereeOverviewPage
```

Expected: FAIL because current labels are still generic and emoji-based.

- [ ] **Step 3: Implement overview surface**

Refactor `RefereeOverviewPage.tsx`:

- introduce `modeCopy` to avoid conditional title mutation
- render designed loading and empty states
- use warm cards with status pills and compact metadata
- replace emoji buttons with text-first links: `Open Pre-Check`, `Record Results`, `File Incident`
- preserve route targets and mode filtering behavior

- [ ] **Step 4: Run overview test to verify it passes**

Run:

```bash
npm test -- --run RefereeOverviewPage
```

Expected: PASS.

### Task 3: Verification

**Files:**
- Verify: `frontend/src/layouts/RefereeLayout.tsx`
- Verify: `frontend/src/pages/referee/RefereeOverviewPage.tsx`

- [ ] **Step 1: Run focused tests**

Run:

```bash
npm test -- --run RefereeLayout RefereeOverviewPage
```

Expected: both suites pass.

- [ ] **Step 2: Run production build**

Run:

```bash
npm run build
```

Expected: TypeScript and Vite build complete successfully.
