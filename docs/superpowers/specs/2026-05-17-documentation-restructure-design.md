# Documentation Restructure Design

## 1. Goal

Rewrite the project documentation from scratch so it is:

- easy for lecturers/reviewers to understand,
- practical for the development team to use,
- fully aligned with the updated database model,
- explicit that the product is a **clean prediction game**, not a betting or real-money system.

The new documentation should replace the old flat `docs/specs` structure with a clearer audience-first structure.

## 2. Product Positioning

The system has two layers:

1. **Core system:** horse racing tournament management.
2. **Engagement layer:** a clean prediction game using virtual in-system points.

The prediction layer must never be described or implemented as betting:

- no real money,
- no deposits,
- no withdrawals,
- no cash conversion,
- no redistribution pool between users,
- no odds,
- no wagering language.

Points are internal game points only.

## 3. Chosen Documentation Structure

The documentation will be organized by reader intent:

```text
docs/
  README.md

  product/
    01_project-overview.md
    02_scope-and-non-goals.md
    03_roles-and-user-journeys.md

  business/
    01_domain-model.md
    02_core-business-rules.md
    03_race-lifecycle.md
    04_prediction-game-rules.md
    05_blog-reward-rules.md

  technical/
    01_system-architecture.md
    02_backend-architecture.md
    03_frontend-architecture.md
    04_api-contract.md
    05_error-handling-and-security.md
    06_ai-race-insight.md

  data/
    01_database-overview.md
    02_erd.md
    03_data-dictionary.md
    04_seed-data.md

  delivery/
    01_implementation-roadmap.md
    02_testing-strategy.md
    03_demo-scenarios.md
```

`docs/README.md` will act as the landing page and reading guide for both reviewers and developers.

## 4. Business Model

### 4.1 Core Racing Management

The documentation will preserve the project's existing core domain:

- users and multi-role access,
- role approval,
- horse approval,
- tournament registration,
- race creation and lifecycle,
- jockey invitation,
- referee checks,
- violations,
- official result confirmation and publication,
- rankings and notifications.

This remains the heart of the system.

### 4.2 Clean Prediction Game

The new rules will be:

- users earn virtual points through valid blog reading or system/event rewards,
- each prediction has a fixed system-defined entry cost,
- successful predictions receive fixed rewards defined by business rules,
- predictions are locked before race start,
- race cancellation refunds the fixed entry cost,
- points are only for in-system progression and leaderboard value.

Recommended scoring:

| Prediction type | Result | Reward |
| --- | --- | --- |
| WINNER | correct winner | +10 points |
| TOP3 | exact order | +30 points |
| TOP3 | correct horses, wrong order | +15 points |
| any | incorrect | +0 points |

The design explicitly removes:

- prediction pools,
- reward multipliers,
- system retention percentages,
- user-to-user redistribution.

### 4.3 Blog Reward Rules

The documentation will preserve and explain the updated anti-farming model:

- blog must be published,
- each user may claim a blog reward once,
- minimum reading time is required,
- minimum scroll threshold is required,
- a daily point earning limit is enforced.

## 5. AI Scope

The project will include one lightweight AI feature in the main design:

### AI Race Insight

Purpose:

- help spectators understand race context before making predictions.

Inputs may include:

- horse recent form,
- horse win rate,
- jockey win rate,
- distance compatibility,
- track condition compatibility.

Outputs:

- a relative score or ranking for participants,
- a short explanation of why certain horses stand out,
- optional confidence metadata.

Constraints:

- AI does not place predictions for users,
- AI does not determine official results,
- AI does not replace referee/admin decisions,
- AI should be presented as supportive insight, not authoritative truth.

This is intentionally small enough to be explainable, testable, and realistic for the project scope.

## 6. Content Rewrite Rules

When rewriting the old docs:

- replace stale terminology such as `wallet`, `betting`, `pool`, `prize_amount`,
- prefer `point account`, `prediction game`, `entry cost`, `prize points`,
- keep wording consistent across product, business, technical, and data docs,
- use cross-references instead of duplicating long explanations,
- keep docs useful to both non-technical reviewers and developers.

## 7. Source of Truth

Because the database script is newer than the current markdown specs, the rewrite will treat these files as the current source of truth:

- `database/001_create_tables.sql`
- `database/002_seed_data.sql`

The new docs should align with the database, while correcting any database elements that still reflect the removed pool-based prediction model.

## 8. Success Criteria

The rewrite is successful when:

1. a reviewer can understand the project from `docs/README.md` without opening every file,
2. a developer can locate a needed rule/API/database explanation quickly,
3. no document implies real-money betting,
4. the prediction game model is clean and internally consistent,
5. the AI scope feels useful rather than decorative or oversized,
6. the docs and database no longer contradict each other on the central product model.
