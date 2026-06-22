# Design System — "Race Office" (Organizer workspace)

Scope: the **organizer workspace** surface (charcoal + brass on parchment). Distinct from the
public/spectator "Night at the Races" cinematic theme (`turf-*` / `gold-*` tokens). Identity and
voice live in [PRODUCT.md](PRODUCT.md) — _composed, authoritative, legible; workspace, not showroom._

This file is the **reference the team migrates toward**. Tokens + primitives exist so polish
propagates without copy-pasted hex. Adopt incrementally (see Propagation below), not big-bang.

---

## Color tokens

Defined in `frontend/src/styles.css` under `@theme`. Tailwind v4 surfaces them as utilities:
`bg-office-charcoal`, `text-office-muted`, `border-office-line`, `outline-office-brass-bright`, …

| Token | Value | Use |
| :--- | :--- | :--- |
| `office-brass` | `#bb8a3c` | Primary accent — buttons, active nav, links |
| `office-brass-bright` | `#cfa24f` | Accent hover |
| `office-brass-ink` | `#a8801f` | Eyebrow / accent label on light |
| `office-gilt` | `#8a6a1c` | Deep brass — link text, small icons |
| `office-charcoal` | `#1c1816` | Dark surfaces — sidebar, drawer header, dark buttons |
| `office-charcoal-soft` | `#2a241f` | Charcoal hover |
| `office-bg` | `#f7f4ee` | Workspace background (parchment) |
| `office-bg-soft` | `#faf7f0` | Subtle fill / row hover / footer bar |
| `office-panel` | `#fdfbf6` | Raised panel / header surface |
| `office-ink` | `#211d1a` | Primary text |
| `office-ink-soft` | `#3a342d` | Strong secondary text / input text |
| `office-muted` | `#6f665b` | Muted body (~5.3:1 on light — **AA**) |
| `office-muted-soft` | `#8a8276` | Faint label — **large text only** (see a11y note) |
| `office-faint` | `#a99f8c` | Faintest meta — non-essential only |
| `office-line` | `#e7e0d3` | Card / panel borders |
| `office-line-soft` | `#efe9dd` | Dividers |
| `office-line-strong` | `#e2d9c8` | Input borders |
| `office-sand` | `#f3ead6` | Brass-tint chip / avatar / icon-badge bg |
| `office-go` | `#0d4a37` | Confirm / approve action (success-action green) |
| `office-go-bright` | `#0b5a41` | Confirm action hover |

Reds (reject/danger) and the status-pill tints (amber/emerald/sky/indigo) intentionally use
Tailwind defaults (`rose-600`, `amber-100`, …) — standard, consistent, no need to tokenise.

### Type
- `font-display` (Fraunces, global utility) for headings; `font-sans` for everything else. One
  family for UI per the product register — no display fonts in labels/buttons/data.

---

## Primitives — `frontend/src/components/office/`

Import from the barrel: `import { Drawer, StatusPill, EmptyState } from "../office";`

### `<Drawer>`
The shared "open a row → review → act" shell. Bottom-sheet on mobile, centred panel ≥sm; charcoal
header (eyebrow/title/visual/close), scrollable body, optional sticky footer. Owns Escape +
backdrop close (disabled while `busy`). Callers supply content, never chrome.

```tsx
<Drawer onClose={close} busy={busy} eyebrow="Horse entry" title={name}
        visual={<img … />} headerMeta={<StatusPill status={status} />}
        footer={<…actions…/>}>
  {/* body */}
</Drawer>
```
Props: `onClose`, `title`, `eyebrow?`, `visual?`, `headerMeta?`, `footer?`, `size?` (md|lg|xl),
`busy?`, `labelledById?`. Used by Registration / Referee / Race detail drawers.

### `<StatusPill>` + `statusTone()` / `prettyStatus()`
Single source of truth for status → colour tone, replacing the per-page `statusBadge` maps.
Status is **never colour-alone** — the label always rides along.

```tsx
<StatusPill status={t.status} />                       // auto tone from the status string
<StatusPill status="NOT_ENGAGED" tone="neutral" label="Not engaged" />  // overrides
```
Tones: `amber emerald rose sky indigo brass charcoal neutral`.

### `<EmptyState>`
Dashed parchment panel that teaches the next action.

```tsx
<EmptyState icon={Trophy} title="No tournaments yet"
            description="Create your first championship to get started."
            action={<Link …>Create</Link>} />
```

---

## Accessibility notes
- **Contrast:** `office-muted` (#6f665b) passes AA on light surfaces. **`office-muted-soft`
  (#8a8276 ≈ 3.8:1) and `office-faint` (#a99f8c) are below AA for small body text** — use them
  only for large or genuinely non-essential meta (timestamps, faint eyebrows). For essential small
  text, use `office-muted`. _Recommended next step when propagating: bump muted-soft toward ink._
- Status never by colour alone (label always present). Visible focus rings via
  `focus-visible:outline-office-brass-bright`. `prefers-reduced-motion` honored globally.

---

## Propagation (incremental — pick a page, not the whole app)
When touching an organizer page, migrate it as you go:
1. **Hex → token:** `text-[#6f665b]` → `text-office-muted`, `bg-[#1c1816]` → `bg-office-charcoal`, etc.
2. **Badge map → `<StatusPill>`:** delete the local `statusBadge`/`contractBadge`/`raceBadge` record, render `<StatusPill status={…} />`.
3. **Modal/overlay → `<Drawer>`:** drop the hand-rolled overlay/escape/header; pass content.
4. **Empty block → `<EmptyState>`.**

Already migrated (reference implementations): `RegistrationDetailDrawer`, `RefereeDetailDrawer`,
`RaceDetailDrawer`. Still on hardcoded hex (propagate later): the four Operations pages, Dashboard,
Tournaments, layout, `RaceResultModal` (Results page), `NotificationBell`, `ConfirmDialog`.
