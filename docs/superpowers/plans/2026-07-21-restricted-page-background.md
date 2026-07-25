# Restricted Page Background Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an atmospheric horse-racing background to the suspended/banned account page without reducing decision readability or changing enforcement behavior.

**Architecture:** Reuse the existing local race hero image as a decorative full-viewport layer. Compose image, navy/burgundy gradient, vignette, and subtle line texture behind the existing decision card; keep all account and wallet actions unchanged.

**Tech Stack:** React, TypeScript, Tailwind CSS, Vite

---

### Task 1: Add the themed background layers

**Files:**
- Modify: `frontend/src/pages/account/AccountRestrictedPage.tsx`

- [ ] **Step 1: Import the existing race image**

Add the local asset import next to the API and hook imports:

```tsx
import raceHero from "../../assets/slide.jpg";
```

- [ ] **Step 2: Replace the plain page wrapper with an isolated viewport canvas**

Wrap the page in a dark isolated container and keep the existing content in a foreground `main`:

```tsx
<div className="relative isolate min-h-screen overflow-hidden bg-[#020817]">
  <img
    src={raceHero}
    alt=""
    aria-hidden="true"
    className="absolute inset-0 -z-30 h-full w-full object-cover object-center opacity-40"
  />
  <div className="absolute inset-0 -z-20 bg-[linear-gradient(115deg,rgba(2,8,23,0.96)_0%,rgba(7,17,38,0.86)_48%,rgba(73,30,18,0.82)_100%)]" />
  <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_78%_18%,rgba(245,158,11,0.18),transparent_30%),linear-gradient(to_top,rgba(2,8,23,0.92),transparent_55%)]" />
  <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:100%_44px]" />
  <main className="mx-auto flex min-h-screen max-w-5xl items-center px-5 py-12 md:py-16">
    {/* existing restriction section */}
  </main>
</div>
```

The image remains decorative, and every visual layer stays behind content through negative z-index values inside the isolated container.

- [ ] **Step 3: Refine the foreground card for the darker scene**

Use a restrained translucent border and deeper shadow while preserving the white content surface:

```tsx
<section className="w-full overflow-hidden rounded-[2rem] border border-amber-300/50 bg-white shadow-[0_30px_90px_-30px_rgba(0,0,0,0.75)] ring-1 ring-white/10">
```

Do not change status copy, decision data, wallet data, session synchronization, or action handlers.

- [ ] **Step 4: Check responsive composition manually**

Run:

```powershell
npm run dev
```

Verify at approximately 390px, 768px, and 1440px widths that the card stays readable, no horizontal scrolling appears, and the background remains decorative rather than competing with the decision.

### Task 2: Verify and commit

**Files:**
- Verify: `frontend/src/pages/account/AccountRestrictedPage.tsx`

- [ ] **Step 1: Run the production build**

Run:

```powershell
npm run build
```

Expected: TypeScript and Vite complete with exit code 0.

- [ ] **Step 2: Check patch formatting**

Run:

```powershell
git diff --check
```

Expected: no output and exit code 0.

- [ ] **Step 3: Commit the isolated visual change**

```powershell
git add frontend/src/pages/account/AccountRestrictedPage.tsx docs/superpowers/plans/2026-07-21-restricted-page-background.md
git commit -m "feat: add racing backdrop to restricted accounts"
```

The account-appeal implementation starts only after the dispute subsystem is merged into `develop`, as defined in `docs/superpowers/specs/2026-07-21-account-enforcement-appeal-design.md`.
