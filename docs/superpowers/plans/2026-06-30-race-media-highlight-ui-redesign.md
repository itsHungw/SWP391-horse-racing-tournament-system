# Race Media Highlight UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make race highlight UI feel like a professional post-race media workflow instead of a plain URL form.

**Architecture:** Keep the existing backend/API contract unchanged. Refactor only the React presentation layer: public pages stay content-first, while admin/organizer management becomes a preview-first workflow with clear publish states.

**Tech Stack:** React, TypeScript, Tailwind CSS, lucide-react, Vitest/Testing Library.

---

### Task 1: Public Highlight Placement And Player Polish

**Files:**
- Modify: `frontend/src/components/race-media/RaceHighlightPlayer.tsx`
- Modify: `frontend/src/pages/public/RaceDetailPage.tsx`

- [ ] **Step 1: Keep full player after official result**

The player remains below the Official Result section so spectators see race outcome context before watching video.

- [ ] **Step 2: Add a compact player header and metadata**

Update `RaceHighlightPlayer` so it has a smaller, content-first header, stable 16:9 facade, accessible play button, and iframe mounts only after user action.

- [ ] **Step 3: Add a compact near-hero CTA only when highlight exists**

In `RaceDetailPage`, add a lightweight "Official highlight available" anchor near the race detail summary instead of moving the full player above core race content.

### Task 2: Championship Highlight Rail

**Files:**
- Modify: `frontend/src/components/race-media/ChampionshipHighlightsRail.tsx`
- Modify: `frontend/src/pages/public/ChampionshipDetailPage.tsx`

- [ ] **Step 1: Keep rail after stats and before schedule**

This placement gives media visibility without burying the race schedule.

- [ ] **Step 2: Redesign rail as featured replay + compact cards**

Use the newest/first highlight as a featured visual and render remaining highlights as compact cards. Keep all cards keyboard-focusable links with clear names.

### Task 3: Management Panel As Media Workflow

**Files:**
- Modify: `frontend/src/components/race-media/RaceMediaPanel.tsx`

- [ ] **Step 1: Convert from form-first to preview-first**

Empty state shows a paste zone. Saved/validated media shows thumbnail, title, provider status, verification status, and source link metadata before fields.

- [ ] **Step 2: Use progressive disclosure for fields**

Show the title override only when a URL exists or media already exists. Keep helper text near fields and errors near the relevant action area.

- [ ] **Step 3: Enforce one primary action per state**

When no media exists, primary is `Save draft`. When verified draft exists, primary is `Publish`. Secondary actions are `Validate`, `Re-verify`, `Unpublish`, and `Remove`.

- [ ] **Step 4: Preserve accessibility**

All controls are semantic buttons/inputs, have visible focus states, touch target height at least 44px, and dynamic success/error messages use `role="status"` or `role="alert"`.

### Task 4: Admin/Organizer Placement

**Files:**
- Modify: `frontend/src/pages/admin/AdminTournamentDetailPage.tsx`
- Modify: `frontend/src/pages/organizer/OrganizerTournamentDetailPage.tsx`

- [ ] **Step 1: Place management UI after result context**

Keep `RaceMediaPanel` near result management in the race drawer, but visually label it as the race's Media workspace.

- [ ] **Step 2: Avoid mixing destructive/media actions with race lifecycle CTA**

Do not place media delete/unpublish buttons beside race status transition buttons.

### Task 5: Verification

**Commands:**
- `npm run build` from `frontend`
- Targeted Vitest if existing public/admin tests still compile cleanly.

- [ ] **Step 1: Run frontend build**

Expected: TypeScript and Vite build pass.

- [ ] **Step 2: Report residual risk**

If browser visual verification is not run, state that clearly and list the manual UI screens to check.
