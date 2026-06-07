# Referee Workspace UI Refresh Design

## Goal

Redesign the referee workspace visual shell so it feels intentional and consistent with the project theme, while preserving existing route behavior and referee workflows.

The selected direction is **Steward Control Room**: a premium racing-heritage operations surface. The implementation must use the existing project palette instead of introducing a new color theme:

- Primary green: `#004d3d` / `nyraGreen`
- Accent gold: `#d4af37` / `nyraGold`
- Dark text and shell surfaces: project slate/near-black neutrals
- Warm light canvas: ivory/parchment neutrals that complement the current NYRA-inspired theme

## Scope

This refresh covers:

- `frontend/src/layouts/RefereeLayout.tsx`
- `frontend/src/pages/referee/RefereeOverviewPage.tsx`
- Existing tests for the layout/overview where assertions need to match updated accessible text
- Minimal shared CSS only if needed for focus, motion, or reusable visual tokens

This refresh does not change backend APIs, route paths, race state logic, or the large unified officiating workflow inside `RefereeOfficiatePage.tsx`.

## Shell Design

The referee layout should become a complete workspace shell:

- Use semantic landmarks: `header`, `nav`, `main`, and descriptive `aria-label` values.
- Replace emoji navigation icons with consistent text/shape markers that can be themed and read correctly by assistive tech.
- Use a dark green sidebar with gold active indicators and warm text contrast.
- Give each nav item a stable touch target of at least 44px high.
- Keep active route state obvious with more than color alone: left rail/accent, contrast change, and label weight.
- Header should show workspace identity, operational status, signed-in referee name, and an exit action.
- Header and sidebar colors must remain aligned with the existing project identity, not a new unrelated palette.

## Overview Page Design

The referee overview should be redesigned as the landing surface for assigned race tasks:

- Page heading and description should be stronger and align with the Steward Control Room tone.
- Season/status chip should use project green/gold accents.
- Race cards should use warm white surfaces, compact metadata, and clear task grouping.
- CTA buttons should be text-first with consistent visual weight and no emoji icons.
- Empty and loading states should feel designed, not plain text.
- Layout must remain responsive: cards stack cleanly on narrow screens, actions wrap without overflow.

## Accessibility And Interaction

The implementation must follow the UI/UX Pro Max and frontend accessibility rules:

- Visible focus rings for links/buttons.
- No structural emoji icons.
- Sufficient text contrast on dark green and warm light surfaces.
- Interactive elements have at least 44px height where practical.
- Hover/active transitions should be subtle and should not cause layout shift.
- Color should not be the only active/status signal.

## Testing

Update or add focused frontend tests for:

- Referee layout renders workspace identity, signed-in referee name, exit link, and all navigation labels.
- Navigation remains accessible by text after removing emoji.
- Overview page still renders task actions for the selected mode.

Run at minimum:

```bash
npm test -- --run RefereeLayout RefereeOverviewPage
```

If broader frontend changes occur, run:

```bash
npm test -- --run
npm run build
```

## Open Decisions

None. The user approved Steward Control Room direction with the constraint that colors should stay synchronized with the existing project theme.
