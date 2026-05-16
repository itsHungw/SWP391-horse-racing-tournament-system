# System Overview & Architecture
*Last Updated: 2026-05-15*

## 1. Project Information
- **Project Name**: Horse Racing Tournament Management System (SU26SWP03)
- **Tech Stack**:
  - Backend: Java 17+, Spring Boot 3.x, Spring Security (JWT), Spring Data JPA, Maven (Mono-repo)
  - Frontend: React 18+, Tailwind CSS, Axios, React Router v6
  - Database: SQL Server (Production-Ready Schema MVP)
  - Storage: Local File System (Development) -> Cloud Storage (Production)

## 2. Core Modules
1. **Authentication & Authorization**: Role-Based Access Control (RBAC). A user has ONE active role (Owner, Jockey, Referee, Spectator, Admin).
2. **Profile Management**: Specialized profiles for Horse Owners, Jockeys, and Referees requiring Admin approval.
3. **Horse & Tournament Operations**: Managing horses, tournaments, races, registrations, and jockey invitations.
4. **Race Execution**: Pre-race checks, violation tracking, referee reports, and race results processing.
5. **Pari-mutuel Betting System**: System wallet, transaction ledger, and proportion-based payout for predictions.

## 3. Strict Architectural Rules
- **Backend**: Controllers -> Services -> Repositories. NO cross-layer bypassing.
- **Frontend**: Pages -> Components -> Hooks -> Services.
- **Business Logic**: Complex domain rules (e.g., Pari-mutuel payout calculations, 1-user-1-role constraint) MUST be encapsulated in the Service layer, using `@Transactional` and appropriate locking mechanisms.
