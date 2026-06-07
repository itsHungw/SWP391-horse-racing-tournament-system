# Frontend Initialization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a React, Vite, TypeScript frontend foundation in `frontend/`.

**Architecture:** The app is a client-rendered React shell with React Router route groups matching the product roles. API access is isolated behind an Axios client so later auth work can add interceptors without touching pages.

**Tech Stack:** React, TypeScript, Vite, Tailwind CSS, React Router, Axios, Vitest, Testing Library.

---

### Task 1: Test Harness

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/vite.config.ts`
- Create: `frontend/tsconfig.json`
- Create: `frontend/tsconfig.app.json`
- Create: `frontend/tsconfig.node.json`
- Create: `frontend/src/test/setup.ts`
- Create: `frontend/src/App.test.tsx`

- [x] **Step 1: Add project scripts and test dependencies**

Create package metadata with `test`, `build`, and `dev` scripts.

- [x] **Step 2: Add a failing smoke test**

Test that the app shell renders navigation and the home page. It should fail before `src/App.tsx` exists.

### Task 2: App Scaffold

**Files:**
- Create: `frontend/index.html`
- Create: `frontend/src/main.tsx`
- Create: `frontend/src/App.tsx`
- Create: `frontend/src/routes/AppRouter.tsx`
- Create: `frontend/src/layouts/AppLayout.tsx`
- Create: `frontend/src/pages/public/HomePage.tsx`
- Create: `frontend/src/pages/RoleDashboardPage.tsx`
- Create: `frontend/src/components/StatusBadge.tsx`
- Create: `frontend/src/hooks/useDocumentTitle.ts`
- Create: `frontend/src/api/httpClient.ts`
- Create: `frontend/src/styles.css`
- Create: `frontend/src/vite-env.d.ts`

- [ ] **Step 1: Implement the minimal router shell**

Add semantic landmarks, accessible navigation links, and role placeholder routes.

- [ ] **Step 2: Add API client foundation**

Create one Axios instance using `VITE_API_BASE_URL`, defaulting to `/api`.

- [ ] **Step 3: Verify**

Run `npm test -- --run` and `npm run build` from `frontend/`.
