# Database Schema Overview
*Last Updated: 2026-05-15*
*Target DB: SQL Server*

## Current Status
- Version 1.3: MVP Production-Ready (25 Tables)
- Includes Hardening Patch (Constraints, Unique Indexes)
- NVARCHAR localized support for names and addresses
- Pari-mutuel Betting architecture supported.

## Tables (25 Total)
### 1. Core Users (4)
- `users`: Core account (NVARCHAR used for full_name, address)
- `roles`: System roles
- `user_roles`: Many-to-many relationship mapping
- `user_role_history`: Audit trail for role changes
- `role_requests`: Upgrade role workflows

### 2. Profiles (3)
- `horse_owner_profiles`: Owner specific info
- `jockey_profiles`: Jockey specific info
- `referee_profiles`: Referee specific info

### 3. Horse & Tournaments (4)
- `horses`: The core entity being raced
- `tournaments`: The grouping event
- `tournament_prize_tiers`: Configuration of prizes
- `races`: Individual instances inside a tournament

### 4. Race Operations (6)
- `tournament_registrations`: Horse registers to a tournament
- `jockey_invitations`: Owner invites a Jockey to ride their horse in a specific race
- `race_participants`: The combination of Race + Horse + Jockey
- `pre_race_checks`: Referee verifies health, weight, equipment
- `violations`: Any rule breaks recorded
- `referee_reports`: Official closing statement of the race by the referee

### 5. Results & Rankings (2)
- `race_results`: Final standing, time, and distributed prize/points
- `tournament_rankings`: Aggregated leaderboards

### 6. Pari-mutuel Betting & Notifications (4)
- `user_wallets`: User point balances (with check >= 0)
- `wallet_transactions`: Immutable ledger for all balance changes
- `predictions`: User betting tickets (`bet_amount`, `payout_rate`)
- `ai_predictions`: AI generated odds and predicted winners
- `notifications`: System alerts and bells
