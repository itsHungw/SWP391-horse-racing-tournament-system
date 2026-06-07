# Owner Workspace And Profile UI Design

## Design Read

This is an owner-facing product workspace for horse racing tournament operations. The audience is horse owners who need to manage horses, documents, registrations, and account readiness without feeling like they are inside an admin back office. The visual language should be quiet operational SaaS: polished, trustworthy, dense enough for repeated work, and consistent with the existing emerald racing brand.

Design dials:

- DESIGN_VARIANCE: 5
- MOTION_INTENSITY: 3
- VISUAL_DENSITY: 6

## Scope

The redesign covers the owner workspace shell and the owner-related role profile experience:

- `OwnerLayout`
- `OwnerDashboardPage`
- Owner horse roster, horse profile, and tournament registration pages where shared styling needs alignment
- `OwnerProfilePage` at `/owner/profile`

No route slugs, API contracts, form field names, or authentication flows change.

The default `/profile` page remains the user's core account identity profile. It is not the HORSE_OWNER verification profile.

## Recommended Approach

Use a quiet owner operations UI. The interface should feel like a durable workspace rather than a marketing page or heavy admin console.

Core principles:

- Keep the current React, Vite, Tailwind v4, and lucide stack.
- Use the existing emerald brand accent as the primary accent.
- Use red only for destructive or rejected states.
- Use a light neutral page background with white work surfaces.
- Keep radius consistent: `rounded-md` for controls and `rounded-lg` for grouped surfaces.
- Prefer clear hierarchy, compact metrics, and inline status over decorative cards.
- Maintain accessible focus states and readable button contrast.

## Semantic Color Mapping

The UI should use one consistent semantic color system across owner pages and profile surfaces:

| Token | Usage | Visual Direction |
| --- | --- | --- |
| Primary | Main actions, active navigation, focus emphasis | Emerald |
| Success | Approved horses, completed profile items, successful save feedback | Green |
| Warning | Pending review, incomplete readiness, waiting states | Amber |
| Danger | Rejected horses, rejected registrations, destructive actions, errors | Red |
| Neutral | Inactive navigation, secondary metadata, empty states | Slate |
| Active | Active registrations and in-progress participation | Emerald outline or restrained blue-tinted neutral |

Avoid introducing new accent colors per page. Status color should be driven by meaning, not decoration.

## Owner Workspace Shell

The owner shell should be a stable command surface:

- Header: compact brand area, search, user identity, and logout action.
- Sidebar: clear active state, stable icon and label alignment, mobile horizontal fallback.
- Main area: restrained page padding, max width preserved for large monitors, no full-screen hero treatment.
- Navigation labels stay unchanged to avoid breaking tests and user familiarity.

Expected result: owners immediately know where they are, what section is active, and how to move between dashboard, roster, registrations, and profile.

## Owner Dashboard

The dashboard should become the daily owner overview:

- Top page header with title, brief helper text, and primary actions.
- Metric strip for total horses, approved horses, pending review, and active registrations.
- Metric visual priority should be: active registrations, pending review, approved horses, total horses.
- Main content split between open tournaments and review alerts.
- Empty states should feel intentional, not like missing data.
- Loading state should match final layout proportions better than a single text block.
- Error/status messages remain inline and accessible.

The dashboard should avoid marketing-style oversized sections. It is a work surface.

Dashboard empty states should include the next useful action:

- No horses registered yet: show `Register First Horse`.
- No active registrations: show `Browse Tournaments` or route to registrations if tournament browsing is represented there.
- No rejected items: show a quiet positive state, not a warning.

## Owner Roster, Horse Profile, And Registrations

These pages should receive style alignment where necessary:

- Buttons should match owner workspace shape and color rules.
- Status blocks and rejection states should use consistent red alert treatment.
- Tables, lists, tabs, and forms should use the same border, radius, spacing, and focus conventions.
- Horse profile tabs should feel like segmented workspace navigation rather than loose text tabs.
- Registration wizard surfaces should remain clear and functional, with no information architecture changes.
- Rejection alerts should show the reason and the next action, for example: reason `Health certificate expired`, action `Upload new document`.

The goal is visual coherence without rewriting business logic.

## Profile Page

The owner profile page should be a stable operations profile inside the owner workspace, not a role application, verification form, or clone of the default `/profile` page.

Structure:

- Basic Information captures `stableName`, `ownerName`, `logoUrl`, and `description`.
- Contact Information captures phone, email, and address used for tournament operations.
- Registration Readiness checks only fields that support current business flows: stable name, phone, email, and address.
- Summary shows registered horses, approved horses, active registrations, and last updated.
- Success and error feedback stays close to the stable profile form.

Behavior stays the same:

- Load default account data from `getMyProfile` only to prefill contact defaults.
- Load stable profile data from `getMyOwnerProfile`.
- Treat missing stable profile as an empty stable profile.
- Save through the owner-profile upsert endpoint when backend support exists.
- Load owner horses and registrations for the operations summary.

Out of current scope:

- Owner license number.
- Years active.
- Racing association or region.
- Extra owner verification status.
- Public stable page, public preview, or stable directory.

## States

The implementation must preserve and polish these states:

- Loading: skeleton or structured placeholder matching the target layout.
- Empty: clear message plus next action where relevant.
- Error: inline alert with strong contrast.
- Saving: disabled submit with clear label.
- Rejected review items: red alert treatment, not generic cards.

## Testing And Verification

Focused tests should be updated only where text, roles, or accessible names change. Existing route and behavior tests must keep passing.

Verification commands:

- `npm test`
- `npm run build`

Manual browser check should cover:

- Owner dashboard desktop and mobile widths
- Owner navigation active states
- Profile loading, readiness incomplete, readiness complete, and form save states
- Button text wrapping and obvious contrast issues

## Non-Goals

- No new backend endpoints.
- No new dependency unless implementation reveals a hard need.
- No motion library.
- No route restructuring.
- No rewriting owner business logic.
- No changing profile field names, order, or validation semantics unless required for accessibility.
