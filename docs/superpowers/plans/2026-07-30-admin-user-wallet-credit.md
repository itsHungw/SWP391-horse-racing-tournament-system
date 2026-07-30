# Admin User Wallet Credit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add complete wallet visibility and audited positive-only admin credits to User Details.

**Architecture:** Extend the existing admin user and wallet-control APIs, route credits through `WalletService.adjust`, and expose the existing append-only ledger through a paginated admin endpoint. Keep user-facing adjustment descriptions generic while returning full audit descriptions to admins.

**Tech Stack:** Java 21, Spring Boot, Spring Data JPA, React 19, TypeScript, Vitest, Testing Library.

---

### Task 1: Backend credit and history contract

- [x] Add failing integration tests for credit, history, validation, self-credit, locked wallet, and balance.
- [x] Add request/response DTOs, repository pagination, service methods, and controller routes.
- [x] Run the focused backend integration test.

### Task 2: User detail and safe description

- [x] Add failing assertions for `lastLoginAt` and generic user-facing admin-credit descriptions.
- [x] Map `lastLoginAt` and mask only user-facing `ADMIN_ADJUSTMENT` descriptions.
- [x] Run the focused backend integration test.

### Task 3: Frontend API and types

- [x] Add failing API tests for credit and paginated wallet history.
- [x] Add request/response types and API functions.
- [x] Run the focused API test.

### Task 4: User Details wallet UI

- [x] Add failing behavior tests for last login, balance, credit submission, and history rendering.
- [x] Add the balance dialog, Balance History tab, pagination, refresh wiring, and accessible labels.
- [x] Run the focused page test.

### Task 5: Verification

- [x] Run focused backend and frontend tests.
- [x] Run the backend test suite and frontend production build.
- [x] Review the diff and preserve the existing `demo_data_script.sql` change.
