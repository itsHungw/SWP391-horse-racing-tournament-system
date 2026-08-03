# Source Reference

Documentation of the code as it exists, aimed at someone who has to change it. Where the
`specs/` folder answers *what the product does and why*, this folder answers *where it lives
and what constrains it*.

| Document | Covers |
| --- | --- |
| [Backend Source Guide](backend-source-guide.md) | `backend/src` — package layout, configuration surface, security chain, error contract, every domain module, scheduled jobs, migration history, test conventions |
| [Frontend Source Guide](frontend-source-guide.md) | `frontend/src` — composition rules, routing and guards, session handling, API layer, design tokens, component and page clusters, Vitest setup |
| [API Endpoint Reference](api-endpoints.md) | all 264 endpoints across 53 controllers, grouped by module, with the effective access requirement for each |

## Keeping these current

These documents are derived from source, not from intent. When behaviour changes:

| Change | Update |
| --- | --- |
| new or renamed endpoint | [api-endpoints.md](api-endpoints.md) |
| new backend package, service, scheduler or migration | [backend-source-guide.md](backend-source-guide.md) |
| new route, guard, hook or token family | [frontend-source-guide.md](frontend-source-guide.md) |
| new authorization prefix | all three, plus `SecurityConfig` and `utils/routeAccess.ts` |

## Related documentation

- [`../specs/`](../specs/) — product scope, business rules, workflows, database design
- [`../ba/`](../ba/) — business-analysis notes for the organizer and wallet features
- [`../db/`](../db/) — schema normalization notes and the demo-database runbook
- [`../reports/`](../reports/) — audits and task history
- [`../../DESIGN.md`](../../DESIGN.md), [`../../PRODUCT.md`](../../PRODUCT.md) — design system and product positioning
