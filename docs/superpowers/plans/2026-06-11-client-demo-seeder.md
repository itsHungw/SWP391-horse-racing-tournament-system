# Client Demo Seeder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Populate a fresh dev database with complete, repeatable client demo data.

**Architecture:** Keep one dev-profile JDBC seeder, but make each record
idempotent by stable natural key. Verify behavior through an H2 integration test
and a local SQL Server smoke boot.

**Tech Stack:** Java 21, Spring Boot, JdbcTemplate, JUnit 5, H2, SQL Server.

---

### Task 1: Add the seeder integration test

**Files:**
- Create: `backend/src/test/java/com/example/horseracingtournamentsystem/config/DevDemoSeederIntegrationTest.java`

- [ ] Seed reference roles and the local admin in test setup.
- [ ] Run `DevDemoSeeder` twice.
- [ ] Assert demo entity counts, open and settled predictions, and unchanged
      balances/counts after the second run.
- [ ] Run the targeted test and confirm it fails because predictions and
      tournament participants are not seeded.

### Task 2: Complete and harden the demo seeder

**Files:**
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/config/DevDemoSeeder.java`

- [ ] Replace the all-or-nothing tournament guard with natural-key find-or-create
      helpers.
- [ ] Seed tournament registrations and participants for the ongoing meet.
- [ ] Seed pending and settled race predictions with consistent point balances.
- [ ] Run the targeted test until it passes.

### Task 3: Document and verify

**Files:**
- Modify: `README.md`

- [ ] Document all demo credentials and seeded client scenarios.
- [ ] Run the full backend test suite.
- [ ] Smoke-run the backend against the local SQL Server dev database, then
      verify row counts and re-run idempotency.
