# Client Cinematic Redesign Design

## Status

Approved design direction for a full client/public UI redesign.

## Goal

Redesign the client-facing UI into a premium cinematic racetrack portal for the Horse Racing Championship System. The redesign should preserve the existing product behavior while improving visual quality, UX clarity, animation, consistency, and demo-readiness.

Client-facing copy will use **Championship** instead of **Tournament** where appropriate. This is a UI copy change only.

Do not rename in this phase:

- backend entities or services;
- API endpoints;
- frontend API clients;
- TypeScript domain types;
- files or hooks that are named around `Tournament`;
- routes such as `/tournaments`.

## Visual Direction

The visual system should feel like a premium racing club and championship portal rather than a generic SaaS dashboard.

Primary traits:

- deep racing green, near-black, warm gold, ivory, and emerald highlights;
- cinematic image treatment using existing racing imagery where possible;
- track arcs, racing lane lines, speed trails, gold pulse, subtle grain, and glass/dark panels;
- strong editorial headings, uppercase eyebrow labels, and readable body text;
- English premium racing copy.

The Home page is the main cinematic showcase. Functional pages should share the same premium language but use restrained animation to preserve clarity.

## Animation Strategy

Use **framer-motion** as the phase-one animation dependency.

Use it for:

- hero entrance choreography;
- section reveal on viewport;
- mobile navigation transitions;
- card hover and active states;
- prediction tab transitions;
- subtle route/page content transitions where useful.

Use CSS/Tailwind keyframes for decorative racing lines, track scans, glow pulses, and reduced-motion fallbacks.

Do not add GSAP or Lottie in phase one unless a future scope explicitly requires them.

Rules:

- respect `prefers-reduced-motion`;
- do not hide loading, error, or empty states behind animation;
- make Home cinematic and keep functional pages restrained;
- avoid animation that makes the UI feel like gambling or betting.

## Shared Client Component System

Create or refine shared client components under `frontend/src/components/client/`.

Recommended components:

- `ClientPageLayout.tsx` — common public page shell with layout variants such as light, dark, and cinematic.
- `ClientHeader.tsx` — refactor existing header into a responsive premium navigation system with auth-aware actions.
- `ClientFooter.tsx` — shared footer with championship links and virtual-points disclaimer.
- `AnimatedBackground.tsx` — decorative track arcs, racing lines, gold glow, and grain overlays. No business logic.
- `MotionSection.tsx` — reusable viewport reveal wrapper with reduced-motion fallback.
- `SectionHeader.tsx` — consistent eyebrow/title/description/action pattern.
- `PremiumCard.tsx` — reusable card shell with light, dark, glass, and gold variants.
- `ClientBadge.tsx` — client-facing status badge for championship, race, blog reward, and prediction statuses.

The shared components should prevent each public page from inventing its own visual system.

## Page-by-Page Design

### Global Client Shell

Refactor `frontend/src/components/client/ClientHeader.tsx`.

Design requirements:

- premium sticky navigation with deep green/black glass and gold accent;
- clear active route state;
- responsive mobile menu using framer-motion;
- guest actions: Log In and Join Championship;
- authenticated actions: Dashboard, Profile, Logout;
- accessible keyboard behavior and focus states.

Navigation labels:

- Championships -> `/tournaments`
- Races -> `/races`
- Predictions -> `/spectator/predictions`
- Blog -> `/blogs`
- Leaderboard -> `/leaderboard`
- Join Us -> `/join-us`

### Home Landing

Refactor `frontend/src/pages/public/HomePage.tsx` into composed sections, ideally under `frontend/src/pages/public/home/`.

Recommended sections:

- `HeroSection` — cinematic image backdrop, animated racing lane lines, gold CTA cluster.
- `ChampionshipOverviewSection` — cards for championships, race routes, and leaderboard.
- `RacePulseSection` — premium race-route/live-pulse preview.
- `PredictionTeaserSection` — virtual-points explanation and prediction CTA.
- `LatestBlogSection` — latest posts via the existing blog API.
- `JoinPaddockSection` — role application CTA.
- `ClientFooter`.

Home data rules:

- keep `blogApi.getPublishedBlogs(undefined, 0, 3)` for latest posts;
- do not add backend dependencies unless the implementation plan calls for them;
- static metrics must be described as platform highlights or experience previews, not fake live backend data.

### Championships, Races, and Leaderboard

Keep `frontend/src/pages/public/RaceRoutesPage.tsx` in phase one to reduce risk. Long-term, this can be split into:

- `ChampionshipsPage.tsx`;
- `RacesPage.tsx`;
- `LeaderboardPage.tsx`.

Routes stay unchanged:

- `/tournaments`;
- `/races`;
- `/leaderboard`.

Design requirements:

- UI copy uses Championship where applicable;
- `/tournaments` continues to call `getPublicTournaments()`;
- `/races` and `/leaderboard` may keep static preview content if no backend data is wired;
- static/demo content must be framed as platform highlights or experience previews;
- loading, error, and empty states must be visible to users, not only screen-reader-only.

### Blog List

Refactor `frontend/src/pages/public/SpectatorBlogListPage.tsx`.

Design requirements:

- premium championship newsroom hero;
- search panel styled as a command strip;
- blog cards use `PremiumCard` where appropriate;
- loading, error, and empty states remain clear;
- copy changes from tournament newsroom language to championship newsroom language.

### Blog Detail

Refactor `frontend/src/pages/public/SpectatorBlogDetailPage.tsx`.

Design requirements:

- premium article hero;
- visible reading progress;
- clearer reward panel with progress for reading time and scroll depth;
- reward claim result uses `aria-live`;
- reward status can use `ClientBadge`.

Preserve the current `dangerouslySetInnerHTML` behavior for now. Content sanitization and security hardening are separate tasks and are out of scope for this redesign.

### Join Us

Refactor `frontend/src/pages/public/JoinUsPage.tsx`.

Design requirements:

- direction: “Join the Championship Paddock”;
- role cards for Owner, Jockey, and Referee;
- application flow as a premium qualification-lane timeline;
- guest CTA routes to registration;
- authenticated CTA routes to role requests;
- no changes to the role request backend flow.

### Prediction Arena

Refactor visual presentation for `frontend/src/pages/spectator/predictions/SpectatorPredictionsPage.tsx` and its child components.

Keep:

- `useSpectatorPredictions`;
- existing prediction APIs;
- existing submit/update behavior.

Always show this disclaimer prominently:

> Virtual points only — no real-money betting.

Avoid these words in client prediction UI:

- odds;
- stake;
- wager;
- bet;
- betting;
- cashout.

Use these words instead:

- prediction;
- race pick;
- entry cost;
- virtual points;
- reward.

Design requirements:

- premium arena header with point balance and disclaimer;
- clearer open-race card hierarchy;
- stronger selected-race state;
- clearer prediction form for entry cost and reward;
- prediction history as cards or timeline;
- restrained tab and selected-card transitions with framer-motion.

### Auth and Client-Adjacent Pages

Apply visual wrapper only to:

- `frontend/src/pages/auth/LoginPage.tsx`;
- `frontend/src/pages/auth/RegisterPage.tsx`;
- `frontend/src/pages/auth/VerifyEmailPage.tsx`;
- `frontend/src/pages/user/ProfilePage.tsx`.

Do not change:

- auth API;
- token handling;
- form validation rules;
- redirect rules;
- session behavior.

## UX State Rules

Every redesigned public page must include visible states for:

- loading;
- error;
- empty content.

Prediction Arena must handle:

- no open races;
- low virtual-point balance;
- no prediction history;
- API errors.

No runtime failure or data-loading error should be represented only as `sr-only` text.

## Accessibility Requirements

- Respect `prefers-reduced-motion`.
- Mobile navigation must be keyboard-reachable.
- Focus-visible states must be clear.
- Use links for navigation and buttons for actions.
- Decorative images use empty alt text.
- Content images use meaningful alt text.
- Blog reward claim results use `aria-live`.
- Small uppercase text must maintain adequate contrast.
- Prediction disclaimer must be visible without requiring interaction.

## Route Cleanup

Implementation must include a separate task to resolve duplicate `/spectator` and `/spectator/dashboard` declarations in `frontend/src/routes/AppRouter.tsx`.

Requirements:

- canonical spectator destination remains `/spectator/predictions`;
- do not change protected workspace behavior;
- keep existing route/API behavior otherwise intact.

## Testing and Verification Plan

Implementation should verify:

- install dependency if adding `framer-motion`;
- frontend build succeeds;
- relevant Vitest tests pass or failures are reported clearly;
- `/tournaments`, `/races`, `/leaderboard`, `/blogs`, `/blogs/:slug`, `/join-us`, and `/spectator/predictions` still route correctly;
- UI copy changes do not imply backend domain renames;
- Prediction Arena disclaimer is visible;
- reduced-motion behavior works;
- mobile nav is usable by keyboard.

Tests likely needing updates:

- UI text assertions that mention Tournament in public/client views;
- route tests around spectator redirects if duplicate route cleanup is implemented;
- component tests affected by header/nav structure.

API behavior tests should not require changes because API contracts remain unchanged.

## Scope Exclusions

This phase does not:

- rename backend Tournament domain;
- rename frontend API clients, types, hooks, or files;
- change backend endpoints;
- change auth/session/token flow;
- sanitize blog HTML content;
- implement real leaderboard backend data;
- redesign admin, owner, jockey, or referee workspaces;
- add GSAP or Lottie;
- change protected workspace behavior.

## Approved Direction

Use a Motion-first cinematic premium approach with framer-motion, shared client components, clear non-betting prediction language, and visible UX states. Home is the cinematic flagship; functional pages are polished and restrained.
