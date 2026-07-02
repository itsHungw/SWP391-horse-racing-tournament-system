# Race Media Highlights - Implementation Log

Date: 2026-06-30

Status: implemented MVP slices 1-6 in the working tree.

## Done

- Backend `race.media` package added with generic `race_media` schema, YouTube-only provider behavior, entity guards, service authorization, organizer/admin/public endpoints.
- Save draft is intentionally not blocked by oEmbed/provider outage; publish always re-verifies and only exposes `PUBLISHED + VERIFIED`.
- Published media source edits demote to `DRAFT`, clear publish audit, and reset verification.
- Public DTO stays separate from `RaceResponse`; public endpoints are `GET /api/v1/races/{raceId}/highlight` and `GET /api/v1/races/highlights?tournamentId=...`.
- Frontend management panel added to Organizer Round Operations and Admin Round Control Center.
- Public Race Detail shows a click-to-play `youtube-nocookie.com` highlight player; Championship Detail shows a highlights rail and race-card highlight badges.
- CSP defaults updated for `frame-src https://www.youtube-nocookie.com` and `img-src https://i.ytimg.com data:`.

## Verification Run

- `backend/.\\mvnw.cmd test` -> 202 tests passed, 1 skipped.
- `backend/.\\mvnw.cmd "-Dtest=RaceMediaIntegrationTest,SecurityHardeningIntegrationTest" test` -> passed after CSP update.
- `frontend/npm run build` -> passed; Vite kept the existing large chunk warning.

## Not Done Yet

- Postgres/Testcontainers migration gate from slice 7 is not implemented in this pass. Run or introduce a real Postgres migration check before deploy because `V20__race_media.sql` uses a partial unique index and Postgres regex check.
