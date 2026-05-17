# Docs Specs Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the existing `docs/specs/` markdown set into nested folders, rewrite the content in detail, and align all documentation with a clean non-betting prediction game model.

**Architecture:** Keep `docs/specs/` as the main documentation home, split it by reader intent (`product`, `business`, `technical`, `data`, `delivery`), and use `docs/README.md` as the entry point. Reuse valid content from the current flat files, but rewrite stale sections so the docs match the newer database direction and the approved business design.

**Tech Stack:** Markdown documentation, Mermaid diagrams, SQL Server schema references, Git.

---

## Planned File Structure

- Create `docs/README.md` as the documentation landing page.
- Create `docs/specs/product/` for product-facing documents.
- Create `docs/specs/business/` for business rules and workflows.
- Create `docs/specs/technical/` for architecture, API, AI, storage, and errors.
- Create `docs/specs/data/` for database and lifecycle references.
- Create `docs/specs/delivery/` for implementation guidance.
- Remove or retire the old flat `docs/specs/*.md` files after their useful content is migrated.

### Target files

```text
docs/
  README.md
  specs/
    product/
      01_project-overview.md
      02_scope-and-non-goals.md
      03_roles-and-user-stories.md
    business/
      01_domain-model.md
      02_business-rules.md
      03_workflows.md
      04_prediction-game.md
      05_blog-rewards.md
    technical/
      01_tech-stack.md
      02_backend-architecture.md
      03_frontend-architecture.md
      04_api-and-ui.md
      05_error-codes.md
      06_ai-race-insight.md
      07_file-storage.md
    data/
      01_database-design.md
      02_erd-and-status-lifecycles.md
    delivery/
      01_implementation-checklist.md
```

## Task 1: Create the documentation navigation shell

**Files:**
- Create: `docs/README.md`
- Create: `docs/specs/product/.gitkeep`
- Create: `docs/specs/business/.gitkeep`
- Create: `docs/specs/technical/.gitkeep`
- Create: `docs/specs/data/.gitkeep`
- Create: `docs/specs/delivery/.gitkeep`

- [ ] **Step 1: Create the new directory structure**

Run:

```powershell
New-Item -ItemType Directory -Force `
  'docs/specs/product', `
  'docs/specs/business', `
  'docs/specs/technical', `
  'docs/specs/data', `
  'docs/specs/delivery'
```

Expected: all five folders exist under `docs/specs/`.

- [ ] **Step 2: Add a detailed `docs/README.md`**

Write a landing page that includes:

```markdown
# Horse Racing Tournament Management System Documentation

## How to read this documentation

- If you are reviewing the project idea, start with `specs/product/`.
- If you need business rules and workflows, use `specs/business/`.
- If you are implementing the system, use `specs/technical/` and `specs/data/`.
- If you are planning delivery, use `specs/delivery/`.

## Product position

This project is a horse racing tournament management system with a clean in-system prediction game.

- No real money
- No deposits
- No withdrawals
- No cash conversion
- No odds
- No user-to-user point redistribution
```

- [ ] **Step 3: Verify the shell exists**

Run:

```powershell
Get-ChildItem 'docs/specs' -Directory | Select-Object -ExpandProperty Name
```

Expected: `business`, `data`, `delivery`, `product`, `technical`.

- [ ] **Step 4: Commit**

```powershell
git add docs/README.md docs/specs
git commit -m "docs: create structured documentation layout"
```

## Task 2: Refactor product documentation

**Files:**
- Create: `docs/specs/product/01_project-overview.md`
- Create: `docs/specs/product/02_scope-and-non-goals.md`
- Create: `docs/specs/product/03_roles-and-user-stories.md`
- Source from: `docs/specs/00_requirements.md`
- Source from: `docs/specs/01_executive_summary.md`

- [ ] **Step 1: Write `01_project-overview.md`**

Include:

- project purpose,
- two-layer product model,
- high-level actors,
- core capabilities,
- clean prediction game positioning,
- one-paragraph AI positioning.

- [ ] **Step 2: Write `02_scope-and-non-goals.md`**

Include explicit `In Scope`, `Out of Scope`, and `Future Enhancements`.

Use this non-goal wording exactly:

```markdown
The system does not support betting, real-money wagering, deposits, withdrawals, cash conversion, odds, or user-to-user point redistribution.
```

- [ ] **Step 3: Write `03_roles-and-user-stories.md`**

Migrate and clean the role matrix and user stories from the old flat files.

Ensure:

- `Guest`, `Spectator`, `Horse Owner`, `Jockey`, `Referee`, `Admin` remain,
- `Prediction` stories use game wording,
- no role story implies gambling or real-money rewards.

- [ ] **Step 4: Review product docs for stale language**

Run:

```powershell
Get-ChildItem 'docs/specs/product' -File | Select-String -Pattern 'bet|wallet|pool|cash|withdraw|deposit|prize_amount'
```

Expected: no unintended matches.

- [ ] **Step 5: Commit**

```powershell
git add docs/specs/product
git commit -m "docs: refactor product specifications"
```

## Task 3: Refactor business documentation

**Files:**
- Create: `docs/specs/business/01_domain-model.md`
- Create: `docs/specs/business/02_business-rules.md`
- Create: `docs/specs/business/03_workflows.md`
- Create: `docs/specs/business/04_prediction-game.md`
- Create: `docs/specs/business/05_blog-rewards.md`
- Source from: `docs/specs/03_logic_flowcharts.md`
- Source from: `docs/specs/09_business_rules_and_checklist.md`
- Source from: `database/001_create_tables.sql`

- [ ] **Step 1: Write `01_domain-model.md`**

Cover:

- main entities,
- entity relationships in prose,
- why racing management is the core domain,
- how the prediction game attaches to published race results.

- [ ] **Step 2: Write `02_business-rules.md`**

Migrate and improve the core rules:

- user/role,
- horse,
- tournament,
- registration,
- race,
- invitation,
- result,
- ranking,
- prediction,
- notification.

Replace any pool-based or wallet-based rule with fixed-cost/fixed-reward wording.

- [ ] **Step 3: Write `03_workflows.md`**

Add Mermaid flows for:

- registration and role request,
- horse approval and tournament registration,
- race operation,
- prediction lifecycle,
- jockey invitation.

Update the prediction flow so it shows:

```text
earn points -> pay fixed entry cost -> submit prediction -> lock -> evaluate -> fixed reward
```

- [ ] **Step 4: Write `04_prediction-game.md`**

Define:

- point source,
- fixed entry cost,
- fixed reward table,
- cancellation refund rule,
- leaderboard purpose,
- anti-betting clarification.

- [ ] **Step 5: Write `05_blog-rewards.md`**

Define:

- one-time reward per blog,
- minimum reading seconds,
- minimum scroll threshold,
- daily reward limit,
- anti-farming rationale.

- [ ] **Step 6: Verify prediction vocabulary**

Run:

```powershell
Get-ChildItem 'docs/specs/business' -File | Select-String -Pattern 'prediction pool|reward multiplier|retention|wallet|betting'
```

Expected: no unintended matches.

- [ ] **Step 7: Commit**

```powershell
git add docs/specs/business
git commit -m "docs: refactor business specifications"
```

## Task 4: Refactor technical documentation

**Files:**
- Create: `docs/specs/technical/01_tech-stack.md`
- Create: `docs/specs/technical/02_backend-architecture.md`
- Create: `docs/specs/technical/03_frontend-architecture.md`
- Create: `docs/specs/technical/04_api-and-ui.md`
- Create: `docs/specs/technical/05_error-codes.md`
- Create: `docs/specs/technical/06_ai-race-insight.md`
- Create: `docs/specs/technical/07_file-storage.md`
- Source from: `docs/specs/04_api_and_ui.md`
- Source from: `docs/specs/05_tech_stack.md`
- Source from: `docs/specs/06_backend_architecture.md`
- Source from: `docs/specs/07_frontend_architecture.md`
- Source from: `docs/specs/08_file_storage.md`
- Source from: `docs/specs/10_error_codes.md`

- [ ] **Step 1: Rewrite technical stack and architecture files**

Preserve useful stack choices but update terminology to match the new business model.

- [ ] **Step 2: Rewrite API and UI contract**

Ensure API naming matches clean game language:

- point account,
- prediction entry cost,
- fixed prediction rewards,
- no pool endpoints.

- [ ] **Step 3: Add `06_ai-race-insight.md`**

Define:

- purpose,
- inputs,
- scoring approach,
- explanation output,
- limitations,
- testability.

Use this framing:

```markdown
AI Race Insight is a support feature for spectators. It highlights notable participants before a race, but it never places predictions, never changes official results, and never replaces referee or admin decisions.
```

- [ ] **Step 4: Verify technical docs against DB terms**

Run:

```powershell
Get-ChildItem 'docs/specs/technical' -File | Select-String -Pattern 'prediction_pools|reward_multiplier|system_retention_percent|wallet'
```

Expected: no unintended matches.

- [ ] **Step 5: Commit**

```powershell
git add docs/specs/technical
git commit -m "docs: refactor technical specifications"
```

## Task 5: Refactor data documentation

**Files:**
- Create: `docs/specs/data/01_database-design.md`
- Create: `docs/specs/data/02_erd-and-status-lifecycles.md`
- Source from: `docs/specs/02_database_design.md`
- Source from: `database/001_create_tables.sql`

- [ ] **Step 1: Write `01_database-design.md`**

Document:

- table groups,
- major constraints,
- how points are represented,
- which database objects must be updated to remove pool semantics.

- [ ] **Step 2: Write `02_erd-and-status-lifecycles.md`**

Include:

- refreshed ERD,
- tournament lifecycle,
- race lifecycle,
- role request lifecycle,
- jockey invitation lifecycle,
- prediction lifecycle for the clean game.

- [ ] **Step 3: Mark database drift explicitly**

Add a section listing database items that need follow-up refactor:

- `prediction_pools`,
- `points_committed`,
- `reward_multiplier`,
- `system_retention_percent`,
- any redistribution-specific transaction type.

- [ ] **Step 4: Commit**

```powershell
git add docs/specs/data
git commit -m "docs: refactor data specifications"
```

## Task 6: Refactor delivery documentation

**Files:**
- Create: `docs/specs/delivery/01_implementation-checklist.md`
- Source from: `docs/specs/09_business_rules_and_checklist.md`

- [ ] **Step 1: Rewrite the implementation checklist**

Keep the phased roadmap but update the prediction phase so it reflects:

- fixed entry cost,
- fixed reward evaluation,
- blog reward limits,
- AI race insight as the only AI item in the main roadmap.

- [ ] **Step 2: Add documentation maintenance notes**

Include:

- database source-of-truth note,
- rule for updating docs when schema changes,
- rule for keeping non-goals explicit.

- [ ] **Step 3: Commit**

```powershell
git add docs/specs/delivery
git commit -m "docs: refactor delivery checklist"
```

## Task 7: Retire the old flat docs and verify consistency

**Files:**
- Delete after migration:
  - `docs/specs/00_requirements.md`
  - `docs/specs/01_executive_summary.md`
  - `docs/specs/02_database_design.md`
  - `docs/specs/03_logic_flowcharts.md`
  - `docs/specs/04_api_and_ui.md`
  - `docs/specs/05_tech_stack.md`
  - `docs/specs/06_backend_architecture.md`
  - `docs/specs/07_frontend_architecture.md`
  - `docs/specs/08_file_storage.md`
  - `docs/specs/09_business_rules_and_checklist.md`
  - `docs/specs/10_error_codes.md`

- [ ] **Step 1: Confirm every old topic has a new home**

Run:

```powershell
Get-ChildItem 'docs/specs' -Recurse -File | Select-Object -ExpandProperty FullName
```

Expected: every former subject area exists in one of the new nested folders.

- [ ] **Step 2: Delete the migrated flat files**

Use PowerShell native deletion:

```powershell
Remove-Item -LiteralPath `
  'docs/specs/00_requirements.md', `
  'docs/specs/01_executive_summary.md', `
  'docs/specs/02_database_design.md', `
  'docs/specs/03_logic_flowcharts.md', `
  'docs/specs/04_api_and_ui.md', `
  'docs/specs/05_tech_stack.md', `
  'docs/specs/06_backend_architecture.md', `
  'docs/specs/07_frontend_architecture.md', `
  'docs/specs/08_file_storage.md', `
  'docs/specs/09_business_rules_and_checklist.md', `
  'docs/specs/10_error_codes.md'
```

- [ ] **Step 3: Run repository-wide stale-language scan**

Run:

```powershell
Get-ChildItem 'docs' -Recurse -File | Select-String -Pattern 'betting|wallet|prediction pool|reward multiplier|system retention|prize_amount'
```

Expected: only intentional mentions inside anti-betting clarifications or drift notes remain.

- [ ] **Step 4: Run link/path sanity check**

Run:

```powershell
Get-ChildItem 'docs' -Recurse -File | Select-Object -ExpandProperty FullName
```

Expected: all documented paths referenced in `docs/README.md` exist.

- [ ] **Step 5: Commit**

```powershell
git add docs
git commit -m "docs: retire legacy flat specs"
```

## Task 8: Final self-review

**Files:**
- Review all files under `docs/`

- [ ] **Step 1: Check coverage against the approved design**

Confirm the docs cover:

- audience-first structure,
- clean prediction game,
- blog reward anti-farming,
- lightweight AI race insight,
- database drift notes,
- implementation guidance.

- [ ] **Step 2: Scan for placeholders**

Run:

```powershell
Get-ChildItem 'docs' -Recurse -File | Select-String -Pattern 'TBD|TODO|fill later|coming soon'
```

Expected: no matches.

- [ ] **Step 3: Commit any cleanup**

```powershell
git add docs
git commit -m "docs: polish restructured specifications"
```

## Self-Review Notes

- **Spec coverage:** Every approved section from the design spec maps to at least one task above.
- **Placeholder scan:** No task uses placeholder instructions.
- **Type consistency:** The plan consistently uses `point account`, `fixed entry cost`, `fixed reward`, and `AI race insight`.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-17-docs-specs-refactor.md`. Two execution options:

1. **Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration
2. **Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
