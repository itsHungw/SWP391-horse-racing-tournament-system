# Changelog
All notable changes to this project will be documented in this file.

## [2026-05-15] - Architecture & Database Blueprint Initialization
### Added
- Created 11 Specification markdown files detailing the Executive Summary, Database ERD, User Stories, Architecture, and Business Rules.
- Created `docs/ai/` directory as the persistent memory system (`system_overview.md`, `schema.md`, `business_rules.md`).
- Designed MVP SQL Server Database schema (`001_create_tables.sql`) containing 25 tables.
- Added Pari-mutuel Betting Mechanism (Total Pool betting) with `user_wallets` and `wallet_transactions` tables.
- Added Hardening Patch introducing extensive `CHECK` and `UNIQUE` constraints to secure the database.

### Changed
- Refactored `DATETIME` to `DATETIME2` in SQL Server for higher timestamp precision (critical for `finish_time_seconds`).
- Refactored textual columns (names, locations, addresses) from `VARCHAR` to `NVARCHAR` to properly support Vietnamese characters without font corruption.
- Redesigned the `predictions` table to accommodate `bet_amount`, `payout_amount`, and `payout_rate`.
