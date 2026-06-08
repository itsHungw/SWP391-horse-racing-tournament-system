# Project Overview

## 1. Project Purpose

The Horse Racing Tournament Management System manages the end-to-end workflow for horse racing tournaments. It covers user onboarding, role approval, horse registration, tournament registration, jockey participation, race-day referee operations, race results, and spectator engagement through blogs and prediction challenges.

The implementation is split into:

- a Spring Boot backend in `backend/src/main/java/com/example/horseracingtournamentsystem`;
- a React frontend in `frontend/src`;
- SQL Server schema and migrations in `backend/src/main/resources` and `database/`.

## 2. Product Goals

- Centralize tournament and race operations for administrators.
- Let horse owners maintain horse profiles and register horses for tournaments.
- Let jockeys apply for championship pools, accept owner contracts, and view their schedule.
- Let referees manage race-day checks, incidents, violations, and result submission.
- Let spectators read racing content, earn internal points, and join prediction challenges.
- Provide auditable admin views for users, role requests, horses, tournaments, registrations, blogs, points, and predictions.

## 3. Implemented User Workspaces

- Public: home page, join-us page, public blog list/detail.
- Authenticated user: profile and role request history.
- Spectator: prediction arena and point account.
- Owner: dashboard, horse roster, horse detail, owner profile, tournament registrations.
- Jockey: dashboard, championship applications, contracts, schedule, profile.
- Referee: dashboard, assigned races, race control, pre-race check, officiating, incident report, result history, profile.
- Admin: overview, role requests, users, horses, tournament registrations, tournaments, blogs, predictions, point settings.

## 4. Source Mapping

- Backend domain modules: `auth`, `user`, `horse`, `tournament`, `tournamentregistration`, `championship`, `race`, `referee`, `result`, `prediction`, `blog`, `point`, `filestorage`, `security`, `common`.
- Frontend page groups: `public`, `auth`, `user`, `owner`, `jockey`, `referee`, `admin`, `spectator/predictions`.
- Shared frontend layers: `api`, `types`, `routes`, `layouts`, `components`, `hooks`, `utils`.

## 5. Report Summary

This system demonstrates a role-based web application with domain-first backend architecture, protected frontend workspaces, relational database design, transactional service workflows, file upload support, JWT security, and automated tests for major business flows.
