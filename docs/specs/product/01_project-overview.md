# Project Overview

## 1. Project Purpose

The Horse Racing Tournament Management System manages the end-to-end workflow for horse racing tournaments. It covers user onboarding, role approval, organization onboarding, horse registration, tournament registration, jockey participation, referee operations, official results, wallet transactions, spectator prediction markets, leaderboard, and public racing content.

The implementation is split into:

- a Spring Boot backend in `backend/src/main/java/com/example/horseracingtournamentsystem`;
- a React frontend in `frontend/src`;
- PostgreSQL/Flyway migrations in `backend/src/main/resources/db/migration`.

## 2. Product Goals

- Let the platform govern identities, role approvals, organizations, withdrawals, and audit views.
- Let approved organizers operate their own tournaments, registrations, schedules, officials, and results.
- Let horse owners maintain horse profiles and register approved horses for tournaments.
- Let jockeys apply for championship pools, accept owner contracts, and view their schedule.
- Let referees accept organizer contracts and operate assigned race-day workflows.
- Let spectators read racing content, fund a wallet, place VND prediction wagers, and review prediction history.
- Provide auditable admin views for users, role requests, organizations, horses, tournaments, registrations, blogs, withdrawals, predictions, and settlement jobs.

## 3. Implemented User Workspaces

- Public: home, championships, race cards/results, leaderboard, join-us, public blog list/detail.
- Authenticated user: profile, wallet, role request history, organizer application.
- Spectator: prediction arena backed by wallet balance.
- Owner: dashboard, horse roster, horse detail, owner profile, tournament registrations.
- Jockey: dashboard, championship applications, contracts, schedule, profile.
- Referee: dashboard, assigned races, contracts, race control, pre-race check, officiating, incident report, result history, profile.
- Organizer: dashboard, organization profile, tournaments, registrations, schedule, officials, results.
- Admin: overview, role requests, organizations, users, horses, tournament registrations, tournaments, blogs, predictions, withdrawals.

## 4. Source Mapping

- Backend domain modules: `aiinsight`, `auth`, `blog`, `championship`, `common`, `config`, `dashboard`, `filestorage`, `horse`, `leaderboard`, `notification`, `organization`, `prediction`, `race`, `referee`, `result`, `security`, `tournament`, `tournamentregistration`, `user`, `wallet`.
- Frontend page groups: `public`, `auth`, `user`, `wallet`, `owner`, `jockey`, `referee`, `organizer`, `admin`, `spectator/predictions`.
- Shared frontend layers: `api`, `types`, `routes`, `layouts`, `components`, `hooks`, `utils`.

## 5. Report Summary

This system demonstrates a role-based web application with domain-first backend architecture, protected frontend workspaces, organization governance, transactional wallet workflows, prediction settlement, file upload support, JWT security, and automated tests for major business flows.
