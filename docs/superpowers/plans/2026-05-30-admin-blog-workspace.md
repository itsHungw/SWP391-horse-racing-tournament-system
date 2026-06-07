# Admin Blog Workspace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align admin blog UI with the existing admin workspace and restore authenticated blog creation.

**Architecture:** Keep API access in `frontend/src/api/blogApi.ts`, UI behavior in the two admin blog page components, and backend author lookup in `AdminBlogController`. Use the shared `httpClient` for JWT, refresh, and FormData handling.

**Tech Stack:** React 19, React Router 7, Vitest, Testing Library, Spring Boot 4, MockMvc.

---

### Task 1: Frontend Blog API

**Files:**
- Modify: `frontend/src/api/blogApi.ts`
- Create: `frontend/src/api/blogApi.test.ts`

- [ ] Write failing tests that admin blog APIs call `httpClient`, including create, update, status, delete, and file upload expectations through consumers.
- [ ] Run `npm test -- --run src/api/blogApi.test.ts`.
- [ ] Replace raw `axios` usage with shared `httpClient`.
- [ ] Run the API test again and confirm it passes.

### Task 2: Admin Blog List UI

**Files:**
- Modify: `frontend/src/pages/admin/AdminBlogListPage.tsx`
- Create: `frontend/src/pages/admin/AdminBlogListPage.test.tsx`

- [ ] Write failing tests for `AdminLayout` presence, loading, empty, error, search, and status toggle/delete flows.
- [ ] Run `npm test -- --run src/pages/admin/AdminBlogListPage.test.tsx`.
- [ ] Rework the page to match admin role request workspace patterns.
- [ ] Run the list page test again and confirm it passes.

### Task 3: Admin Blog Form UI

**Files:**
- Modify: `frontend/src/pages/admin/AdminBlogFormPage.tsx`
- Create: `frontend/src/pages/admin/AdminBlogFormPage.test.tsx`

- [ ] Write failing tests for create save, edit load, upload via shared API, and error feedback.
- [ ] Run `npm test -- --run src/pages/admin/AdminBlogFormPage.test.tsx`.
- [ ] Rework the page into an admin form workspace and remove raw `axios`/`alert`.
- [ ] Run the form page test again and confirm it passes.

### Task 4: Backend Author Resolution

**Files:**
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/blog/controller/AdminBlogController.java`
- Create: `backend/src/test/java/com/example/horseracingtournamentsystem/blog/AdminBlogIntegrationTest.java`

- [ ] Write a failing MockMvc test where an authenticated admin creates a blog and receives author fields.
- [ ] Run `mvnw.cmd -Dtest=AdminBlogIntegrationTest test`.
- [ ] Resolve the authenticated admin from `Authentication.getName()` through `UserRepository`.
- [ ] Run the backend test again and confirm it passes.

### Task 5: Verification

**Files:**
- Check all modified files.

- [ ] Run focused frontend tests for blog API/pages.
- [ ] Run focused backend blog integration test.
- [ ] Run `npm run build`.
- [ ] Run relevant backend tests if time permits.
