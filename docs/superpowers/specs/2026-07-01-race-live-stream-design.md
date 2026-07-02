# Race Live Stream Design

Date: 2026-07-01
Status: approved design direction (MVP: YouTube live, one per race, organizer/admin publishes it, hidden after terminal race status)

## Goal

Let an organizer (or admin) attach one YouTube live-stream URL to a race, publish it before the
race starts, and let the public Race Detail page play it until the race reaches a terminal status.
This removes the dependency on the referee pressing "Start Race" before the public live can appear.

This extends the existing Race Media system with a second `media_type` (`LIVE_STREAM` beside
`HIGHLIGHT`). The whole point of this spec is to add it **without duplicating the highlight
CRUD** and **without special-casing media type with `if/else` in the service**. The clean-code
architecture (per-type policy, provider registry, single rule source) is the deliverable, not an
afterthought.

## Non-goals / constraints

- Do NOT add new `RaceStatus` values.
- Do NOT add a broadcast lifecycle (`PRE_LIVE` / `LIVE_PHASE` / `broadcast_ended_at`) for MVP.
- Do NOT support channel-auto-live URLs (`youtube.com/@channel/live`) -- they have no stable
  11-char video id; require a concrete broadcast URL.
- Do NOT add YouTube Data API / live-status polling. The `<iframe>` shows YouTube's own
  "offline / waiting" state when the stream is not broadcasting.

## Core Decisions

1. `LIVE_STREAM` is a new `MediaType` on the SAME `race_media` table. The existing partial
   unique index `(race_id, media_type) WHERE deleted_at IS NULL` already gives "one live per
   race" AND lets a race hold both a highlight and a live stream. Only the `media_type` CHECK
   must be relaxed (migration V22).
2. Reuse the YouTube provider's normalize / verify / embed logic unchanged.
3. **Publish gate is per-media-type, not global** (the one real business divergence):
   - `HIGHLIGHT`: publish requires the race result official (`RESULT_CONFIRMED`/`PUBLISHED`) AND verified.
   - `LIVE_STREAM`: publish requires only `VERIFIED`. There is NO race-status gate -- the organizer
     can publish before the race so the public page can show the YouTube waiting room/countdown.
4. Public visibility of the live player is organizer/admin controlled by publish/unpublish, with a
   terminal-status cutoff on the frontend. The player is visible when the public endpoint returns a
   published+verified live and race status is not `FINISHED`, `RESULT_SUBMITTED`, `RESULT_CONFIRMED`,
   `PUBLISHED`, or `CANCELLED`.
5. Verification confirms embeddability, NOT that the stream is currently broadcasting. A
   scheduled-but-not-yet-public live URL may fail oEmbed at configure time -- the existing
   save-as-draft + `reverify` flow covers that; publish is blocked until VERIFIED.
6. Race status is not a broadcast lifecycle. It only provides the terminal cutoff that hides the
   live after the race is over or cancelled. The live window itself is controlled by media publish
   state.

## Data Model

No new columns. `race_media` already has everything (`media_type`, `provider`,
`provider_video_id`, `source_url`, `status`, `verification_status`, ...).

Migration `V22`: relax the media-type CHECK.

```sql
-- V22: allow LIVE_STREAM alongside HIGHLIGHT in race_media.
ALTER TABLE race_media DROP CONSTRAINT IF EXISTS ck_race_media_type;
ALTER TABLE race_media ADD CONSTRAINT ck_race_media_type
    CHECK (media_type IN ('HIGHLIGHT', 'LIVE_STREAM'));
```

`MediaType` enum gains `LIVE_STREAM`. Keep enum and CHECK in sync with a contract test
(see Test Plan) -- mirrors the existing `EnumStatusContractTest` pattern.

## Architecture -- the clean-code levers

These are the substance of this spec; they are what make the feature scalable / maintainable /
no-hardcode. "Add a media type later" must mean "add a bean", never "edit the service".

### 1. Per-type policy (Strategy) -- kills `if (type == ...)`

The only place the two media types genuinely differ in business rules is the publish gate.
Encode that as a strategy, not a conditional.

```java
public interface MediaTypePolicy {
    MediaType type();
    PublishDecision canPublish(Race race, RaceMedia media); // {allowed: boolean, blockedReason: MediaBlockedReason|null}
}

@Component class HighlightPolicy implements MediaTypePolicy   // official result + verified
@Component class LiveStreamPolicy implements MediaTypePolicy  // verified only, no race-status gate
```

`RaceMediaService` never branches on type; it resolves the policy from a registry:

```java
private final Map<MediaType, MediaTypePolicy> policies; // Spring injects all beans keyed by type() -- register in a @Configuration or via a small init map
policies.get(media.getMediaType()).canPublish(race, media);
```

Adding a media type later = add one policy bean. Policies are POJOs -> unit-testable with no DB.
The current global `OFFICIAL_RESULT_STATUSES` gate in `RaceMediaService.publish` moves into
`HighlightPolicy`.

### 2. Provider registry -- no hard-wired "YouTube"

Today a single `HighlightProvider` is injected directly (implicitly hard-codes one provider).
Replace with a registry keyed by `MediaProviderType`, and rename the interface to reflect that it
serves all media types, not just highlights:

```java
// HighlightProvider -> MediaProvider (rename: it verifies/embeds video for highlight AND live)
private final Map<MediaProviderType, MediaProvider> providers;
providers.get(media.getProvider()); // choose by data, not by hard-coded type
```

A future provider (upload / HLS) is a new bean; the service is untouched.

### 3. Error codes as an enum, not string literals

`"NOT_EMBEDDABLE"`, `"PROVIDER_UNAVAILABLE"`, `"INVALID_YOUTUBE_URL"`, `"RESULT_NOT_OFFICIAL"`,
`"MEDIA_NOT_VERIFIED"` become a single `MediaErrorCode` enum. One source of truth, stable FE
contract, no drift between endpoints.

### 4. Reliability -- external call OUT of `@Transactional`

`MediaProvider.verify()` (oEmbed HTTP) must not run inside the write transaction; holding a Hikari
connection across a network call exhausts the pool under load (people configure live around post
time). Pattern: verify first (no tx), then open a short transaction to persist the result.
Timeouts stay in `RaceMediaYouTubeProperties` (already 2s/3s). Failure -> FAILED/UNVERIFIED, no
retry storm. Circuit breaker is deferred (the provider interface makes it addable later without
touching the service).

### 5. One rule source -- FE never re-derives publish rules

The manage DTO carries `mediaType`, `canPublish`, and `blockedReason` (computed by the policy).
The frontend renders that; it does not re-implement "when can I publish". Business rules live in
one place (backend policy).

### 6. Generalize `RaceMediaService` by type -- semantic URLs, shared logic

Parameterize the service and repo by `MediaType`; expose thin, semantic controller routes over it.

- `RaceMedia.create(mediaType, provider, videoId, sourceUrl, title, actor)` (was hard-coded to HIGHLIGHT).
- `RaceMediaRepository.findActiveByRaceIdAndType(raceId, mediaType)` (was `findActiveByRaceId` hard-filtering HIGHLIGHT).
- `RaceMediaService.upsertDraft(raceId, mediaType, request, actor)` etc.
- Controllers keep readable URLs: `/highlight` and `/live-stream` are thin wrappers that pass the
  right `MediaType` into one shared, type-parametric service. No duplicated CRUD.

## Backend Endpoints

Organizer (`hasRole('ORGANIZER')`, ownership via `Tournament.isManagedBy`) and Admin
(`hasRole('ADMIN')`) get a live-stream set parallel to highlight, both delegating to the shared
service with `MediaType.LIVE_STREAM`:

| method | path                                   | purpose                                            |
| ------ | -------------------------------------- | -------------------------------------------------- |
| GET    | `/{raceId}/live-stream`                | current live media (draft or published)            |
| POST   | `/{raceId}/live-stream/validate`       | normalize + best-effort oEmbed (no persistence)    |
| PUT    | `/{raceId}/live-stream`                | upsert draft (422 on unextractable id; save+warn on oEmbed fail) |
| POST   | `/{raceId}/live-stream/publish`        | policy.canPublish (verified only) -> PUBLISHED     |
| POST   | `/{raceId}/live-stream/unpublish`      | back to DRAFT                                       |
| POST   | `/{raceId}/live-stream/reverify`       | re-run oEmbed                                       |
| DELETE | `/{raceId}/live-stream`                | soft delete                                         |

Public (`permitAll`): `GET /api/v1/races/{raceId}/live-stream` -> `RaceMediaPublicResponse | 204`
(published + verified only). Parallel to `/races/{raceId}/highlight`. The frontend hides rendering
after terminal race statuses; the endpoint itself is status-agnostic.

## Validation / verification semantics for live

- URL must resolve to an 11-char video id via the existing whitelist parser (`watch?v=`,
  `youtu.be/`, `embed/`, `live/{id}`). Channel-auto-live (`/@channel/live`, `youtube.com/live`
  with no id) is rejected with `INVALID_YOUTUBE_URL`.
- oEmbed verify = embeddability only. A scheduled live that is not yet public may return FAILED
  at save -> stays DRAFT, organizer uses `reverify` once it is public. Publish blocked until VERIFIED.
- Published live but stream offline/ended -> the iframe shows YouTube's own state. No server
  detection.

## Frontend

Single source of truth for live visibility:

```ts
const LIVE_BLOCKED_STATUSES = new Set([
  "FINISHED",
  "RESULT_SUBMITTED",
  "RESULT_CONFIRMED",
  "PUBLISHED",
  "CANCELLED",
]);
function canShowLiveStream(status: RaceStatus): boolean { /* one place */ }
```

State -> render:

| race.status                         | live payload      | main render                                      |
| ----------------------------------- | ----------------- | ------------------------------------------------ |
| SCHEDULED / CHECKING / READY        | published+verified | `RaceLivePlayer` + countdown + field             |
| SCHEDULED / CHECKING / READY        | none              | countdown + field                                |
| ONGOING                             | published+verified | `RaceLivePlayer` + field                         |
| ONGOING                             | none              | field, no live block                             |
| FINISHED / RESULT_SUBMITTED         | any               | "result pending" (no live, no highlight)         |
| RESULT_CONFIRMED / PUBLISHED        | any               | official result + `RaceHighlightPlayer` (if any) |
| CANCELLED                           | any               | cancelled race view, no live                     |

- `RaceLivePlayer` and `RaceHighlightPlayer` share one `<YouTubeEmbed videoId autoplay? muted? />`
  facade (nocookie embed URL built from the id; iframe mounted on demand). No duplicated embed logic.
- `RaceDetailPage` fetches the public live stream alongside the existing race / options / results /
  highlight calls (`Promise.allSettled`).
- `raceMediaApi` gains live-stream calls (mirror the highlight ones; generalize by type internally).
- Reuse the same `<YouTubeEmbed>` for the organizer/admin preview.
- CSP already allows `frame-src https://www.youtube-nocookie.com` and `img-src https://i.ytimg.com`
  -- no change. Live embed uses `.../embed/{id}?autoplay=1&mute=1`; `allow="autoplay"` already set.

## Operational note (document for organizers/referees)

Because live visibility is media-publish controlled:
- Organizer/admin can configure and publish the live before scheduled start time. The public page
  will show the YouTube player even if the race is still `SCHEDULED`.
- Referee `ONGOING` is no longer required to make the public live appear.
- Moving the race to `FINISHED`, `RESULT_SUBMITTED`, `RESULT_CONFIRMED`, `PUBLISHED`, or
  `CANCELLED` hides the public live immediately, even if the YouTube broadcast is still running.
- Organizer/admin can also unpublish manually if they need to hide the stream earlier.

This keeps the MVP simple: no new race status, no broadcast lifecycle table, and no dependency on
the referee for pre-show coverage.

## Out of Scope / where to stop (anti over-engineering)

Deliberately NOT now (the policy + provider-registry seams make each addable later without touching
the core): circuit breaker / Resilience4j, broadcast lifecycle state, provider-picker UI, multiple
live angles per race, channel-auto-live resolution, YouTube Data API live-status detection, generic
media CMS. Scalable means "cheap to extend", not "everything pre-built".

## Test Plan

- `HighlightPolicy` / `LiveStreamPolicy` unit tests (POJO, no DB): highlight blocked pre-result;
  live publishable when verified regardless of race status; both blocked when unverified.
- Service test: publishing a live stream on a `SCHEDULED` race succeeds (would fail under the old
  global gate) -- guards the per-type divergence.
- One-per-race-type: a race can hold a HIGHLIGHT and a LIVE_STREAM simultaneously; a second active
  LIVE_STREAM is rejected.
- Normalize: `live/{id}` accepted; `/@channel/live` rejected.
- Public read: endpoint returns only published+verified; frontend renders it before/during the race
  and hides it after terminal statuses.
- Frontend regression: a `SCHEDULED` race with a published live stream renders `RaceLivePlayer`.
- Enum <-> DB CHECK contract test (every `MediaType` is in the allowed set).
- Regression: existing highlight tests stay green through the generalization refactor.
- `postgres-integration` (Testcontainers): V22 CHECK + partial unique exercised on real Postgres
  (H2 builds from ddl-auto and skips Flyway).

## Migration sequence

`V22__race_media_live_stream.sql` (relax CHECK, above). Rollback = re-add the HIGHLIGHT-only CHECK
after deleting any LIVE_STREAM rows.
