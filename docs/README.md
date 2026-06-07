# Horse Racing Tournament Management System Documentation

This repository documents a horse racing tournament management system with a **clean in-system prediction game** layered on top of the racing workflow.

## Start here

- `specs/product/` — what the product is, what it is not, and who uses it.
- `specs/business/` — domain rules, workflows, prediction game rules, blog rewards.
- `specs/technical/` — architecture, API/UI contract, file storage, error handling, AI.
- `specs/data/` — database structure, ERD, lifecycles, current schema notes.
- `specs/delivery/` — implementation roadmap and build checklist.

## Product position

The product has two layers:

1. **Core racing management** — users, roles, horses, tournaments, races, officials, results, rankings.
2. **Engagement layer** — spectators read blogs to earn virtual points and spend a fixed number of points to join prediction challenges.

## Clean prediction game principles

- No real money.
- No deposits or withdrawals.
- No cash conversion.
- No odds.
- No user-to-user redistribution pool.
- No betting language in product behavior.

Points are internal game points only. They exist to encourage engagement and support leaderboard play.

## Suggested reading paths

### For reviewers / lecturers
1. `specs/product/01_project-overview.md`
2. `specs/product/02_scope-and-non-goals.md`
3. `specs/business/02_business-rules.md`
4. `specs/business/04_prediction-game.md`

### For developers
1. `specs/technical/01_tech-stack.md`
2. `specs/technical/02_backend-architecture.md`
3. `specs/technical/04_api-and-ui.md`
4. `specs/data/01_database-design.md`
5. `specs/delivery/01_implementation-checklist.md`

