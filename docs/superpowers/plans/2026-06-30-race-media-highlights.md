# Plan triển khai — Race Media (YouTube highlights)

**Ngày:** 2026-06-30
**Branch đề xuất:** `feat/race-media`
**Liên quan:** [Design spec rev 3](../specs/2026-06-30-race-media-highlights-design.md)

**Quyết định kiến trúc đã chốt (xem spec):**
- Product = "Race highlight"; table/kiến trúc = **`race_media`** generic (provider-based) để scale upload/HLS/live sau, NHƯNG UI chỉ YouTube — *seam, không cathedral*, không provider-picker.
- MVP: 1 highlight/race, lưu `provider_video_id` chuẩn hóa (KHÔNG dùng raw URL làm nguồn embed).
- **Validate 2 tầng:** structural (offline → gate SAVE) vs embeddable (oEmbed network, best-effort → gate PUBLISH). Cột `verification_status`.
- Public chỉ thấy `PUBLISHED + VERIFIED`. Authz organizer `isManagedBy`, admin override.

> ⚠️ **Nguyên tắc số 1 (đừng tái phạm lỗi review đã bắt):** provider (YouTube/oEmbed) **KHÔNG BAO GIỜ** nằm trên critical path của *save draft*. Link hợp lệ về cấu trúc thì luôn lưu được; oEmbed chỉ quyết định có cho Publish hay không.

---

## 0. Nguyên tắc xuyên suốt
1. **Generic schema, YouTube-only behavior.** `provider`/`media_type` là cột + enum; MVP chỉ 1 giá trị mỗi cái. Không build UI chọn provider.
2. **Tách structural vs embeddable validation.** `normalizeId` (offline) ném `InvalidMediaUrlException` → 422 chặn save. `verify` (oEmbed) ném `VideoNotEmbeddableException`/`ProviderUnavailableException` → chỉ ảnh hưởng `verification_status` + Publish.
3. **Invariant `PUBLISHED ⇒ VERIFIED`** = DB CHECK + guard service. Không có đường nào set PUBLISHED khi chưa VERIFIED.
4. **iframe src LUÔN build lại từ `provider_video_id`** (`youtube-nocookie.com/embed/{id}`), KHÔNG dùng `source_url` (chống inject). `source_url` chỉ để audit.
5. **oEmbed:** host cố định `www.youtube.com`, timeout ngắn (connect+read), không follow redirect tùy ý, không retry-storm. Lỗi → đánh dấu, không throw lên save.
6. **One-per-race-type** guard ở **service layer** (test được trên H2) + partial unique index `(race_id, media_type) WHERE deleted_at IS NULL` (defense-in-depth, Postgres).
7. **Authz:** mọi op organizer qua `Tournament.isManagedBy(email)`; admin bypass nhưng ghi actor (`published_by`).
8. **Mỗi slice compile + test xanh** trước khi qua slice kế.

---

## 1. Domain map (Slice 1)

### Bảng `race_media` (migration `V20`)
Cột + constraint theo spec §Data Model + §Migration Sketch. Điểm chốt: `verification_status` (UNVERIFIED/VERIFIED/FAILED), `last_verified_at`, `provider_error_code`; CHECK `status`/`provider`/`media_type`/`verification_status`; CHECK đa cột `status <> 'PUBLISHED' OR verification_status = 'VERIFIED'`; FK `race_id`/`created_by`/`updated_by`/`published_by`; partial unique `(race_id, media_type)`.

### Enum (package `race.media.enums`)
```
MediaType                { HIGHLIGHT }
MediaProviderType        { YOUTUBE }
MediaStatus              { DRAFT, PUBLISHED }        // mirror BlogStatus
MediaVerificationStatus  { UNVERIFIED, VERIFIED, FAILED }
```

### Entity `RaceMedia` (mirror `Race`: `@Getter`, `@NoArgsConstructor(PROTECTED)`, static factory, soft delete, audit)
Hành vi đặt trong entity (không setter trần):
| method | tác dụng |
| :-- | :-- |
| `static create(race, provider, videoId, sourceUrl, title, creator)` | row mới = DRAFT + UNVERIFIED |
| `changeSource(videoId, sourceUrl, editor)` | nếu videoId KHÁC cũ: set videoId/sourceUrl, **demote** `status=DRAFT`, `verification=UNVERIFIED`, clear `published_at/by` |
| `changeTitle(title, editor)` | chỉ đổi title (không đụng status/verification) |
| `markVerified(meta, at)` | `verification=VERIFIED`, snapshot `provider_title`/`thumbnail_url`, set `last_verified_at`, clear `provider_error_code` |
| `markFailed(errorCode, at)` | `verification=FAILED`, set `provider_error_code` |
| `publish(publisher)` | **precondition** `verification==VERIFIED` (ném nếu không) → `status=PUBLISHED`, set `published_at/by` |
| `unpublish()` | `status=DRAFT` (giữ verification) |
| `softDelete()` | set `deleted_at` |

### Repository `RaceMediaRepository`
- `Optional<RaceMedia> findActiveByRaceId(Long raceId)` (deleted_at IS NULL)
- `List<RaceMedia> findPublishedByRaceIds(Collection<Long> raceIds)` — batch cho championship rail (chỉ PUBLISHED+VERIFIED)
- `Optional<RaceMedia> findPublishedByRaceId(Long raceId)` — race detail public

**DoD Slice 1:** `./mvnw compile` xanh; entity + enum + repo + migration V20 có mặt; chưa cần endpoint.

---

## 2. Provider + oEmbed (Slice 2)

### Interface `HighlightProvider` + impl `YouTubeProvider`
```
MediaProviderType type()                         // YOUTUBE
String normalizeId(String url)                   // structural; InvalidMediaUrlException
ProviderMeta verify(String videoId)              // network; VideoNotEmbeddableException / ProviderUnavailableException
String embedUrl(String videoId)                  // youtube-nocookie/embed/{id}
record ProviderMeta(String title, String thumbnailUrl)
```
- **`normalizeId`:** `java.net.URI` parse → whitelist host (`youtube.com`, `www.youtube.com`, `m.youtube.com`, `youtu.be`) → lấy id theo path/query (`watch?v=`, `/embed/{id}`, `/shorts/{id}`, `/live/{id}`, `youtu.be/{id}`) → validate `[A-Za-z0-9_-]{11}`. KHÔNG mega-regex.
- **`verify`:** Spring `RestClient` GET `https://www.youtube.com/oembed?url=<watchUrl>&format=json`, timeout ngắn. non-2xx (401/404…) → `VideoNotEmbeddableException`; timeout/IO → `ProviderUnavailableException`; 2xx → parse `title`+`thumbnail_url` thành `ProviderMeta`.
- Bean RestClient riêng cho provider (timeout cấu hình qua properties `racemedia.youtube.*`).

**DoD Slice 2:** unit test `normalizeId` đủ các dạng URL + reject (sai host, `evil.com/youtube.com/...`, id sai độ dài); test `verify` mock RestClient: ok / not-embeddable / timeout. `./mvnw test` xanh.

---

## 3. Service (Slice 3) — `RaceMediaService`

Hợp đồng từng method (tất cả `@Transactional` khi ghi; mọi op organizer kiểm `isManagedBy`):

```
getForManage(raceId, actor)            // organizer/admin xem (draft+published)
validate(raceId, url, actor) -> RaceMediaValidateResponse
   normalizeId (422 nếu fail) → verify best-effort → trả {videoId,title,thumb,verificationStatus,errorCode,message}. KHÔNG lưu.
upsertDraft(raceId, url, title?, actor):
   videoId = normalizeId(url)                       // 422 INVALID_YOUTUBE_URL nếu fail (chặn save)
   media = findActive or create(DRAFT,UNVERIFIED)
   nếu videoId đổi → media.changeSource(...)        // demote nếu đang published
   media.changeTitle(title) nếu có
   try verify → markVerified ; catch NotEmbeddable → markFailed(NOT_EMBEDDABLE) ; catch Unavailable → markFailed(TIMEOUT)
   save → trả RaceMediaResponse (200 + warning nếu chưa VERIFIED)
publish(raceId, actor):
   assert race.status ∈ {RESULT_CONFIRMED, PUBLISHED}     // 409 RESULT_NOT_OFFICIAL
   re-verify oEmbed:
      NotEmbeddable → markFailed → 422 VIDEO_NOT_EMBEDDABLE (giữ DRAFT)
      Unavailable   → 503 PROVIDER_UNAVAILABLE (không đổi state)
      ok            → markVerified → media.publish(actor)  // precondition VERIFIED trong entity
unpublish / reverify / delete(raceId, actor)
```
One-per-race-type: `create` chỉ khi `findActiveByRaceId` rỗng (guard service); index DB đỡ tầng dưới.

**DoD Slice 3:** unit/slice test trên H2: save khi provider timeout vẫn ra DRAFT+UNVERIFIED; publish chặn khi chưa official / chưa verified; edit đổi videoId demote published; title-only giữ published; non-owner → 403. `./mvnw test` xanh.

---

## 4. Endpoints & DTO (Slice 4)

- **Organizer:** thêm vào `OrganizerRaceController` các route `/{raceId}/media[ /validate | /publish | /unpublish | /reverify ]` + `PUT`/`DELETE /{raceId}/media` (bảng spec §Backend Endpoints).
- **Admin:** `AdminRaceMediaController` prefix `/api/v1/admin/races` — cùng op, không check ownership.
- **Public read (KHÔNG đụng `RaceResponse`):**
  - Race detail: `GET /api/v1/races/{raceId}/highlight` → `RaceMediaPublicResponse | 204`. (Đã nằm trong matcher `GET /api/v1/races/** permitAll` của [SecurityConfig](../../backend/src/main/java/com/example/horseracingtournamentsystem/security/SecurityConfig.java) — KHÔNG cần sửa security.)
  - Championship detail: service championship gọi `findPublishedByRaceIds(...)` (batch) gắn vào response sẵn có dưới key `highlights`.
- **DTO:** `RaceMediaRequest`, `RaceMediaValidateResponse(... verificationStatus, providerErrorCode, message)`, `RaceMediaResponse(... verificationStatus, lastVerifiedAt, canPublish, publishBlockedReason)`, `RaceMediaPublicResponse`.
- Map lỗi sang mã trong bảng error contract qua GlobalExceptionHandler (thêm các exception mới).

**DoD Slice 4:** MockMvc test: organizer happy path (validate→draft→publish), admin override, public chỉ trả PUBLISHED+VERIFIED, draft không lộ. `./mvnw test` xanh.

---

## 5. Frontend organizer (Slice 5)
- **Media tab** trong Race Control (office theme) theo **mock đã duyệt**: states Empty / Draft (publish locked + amber banner) / Published / Admin. FAILED/UNVERIFIED hiện nút **Re-verify** (không mất link).
- Components: `RaceMediaPanel`, `YouTubePreviewCard` (facade), `useRaceMedia`, `raceMediaApi.ts`. Reuse `StatusPill`/`EmptyState`.
- `canPublish` + `publishBlockedReason` từ BE để render khóa, không tự suy luận lifecycle.

**DoD Slice 5:** `tsc -b` sạch; vitest panel (empty/draft-locked/published/failed-reverify). 

---

## 6. Frontend spectator + CSP (Slice 6)
- `RaceHighlightPlayer` (Race Detail, cinematic, gold facade → click mới mount iframe) + `ChampionshipHighlightsRail` + badge "Highlight" trên race card.
- **iframe attrs:** `allow=...`, `allowfullscreen`, `referrerpolicy="strict-origin-when-cross-origin"`, optional `sandbox`.
- **Frontend CSP:** thêm `frame-src https://www.youtube-nocookie.com; img-src 'self' https://i.ytimg.com data:;` (chỗ FE set CSP — meta/host header). Backend CSP chỉ sửa nếu serve SPA.

**DoD Slice 6:** `tsc -b` sạch; verify embed load thật trong browser (preview) 1 video published.

---

## 7. Postgres integration (Slice 7)
- Profile `postgres-integration` (Testcontainers Postgres) chạy **Flyway thật** + assert: partial unique `(race_id, media_type)` chặn bản ghi thứ 2; CHECK `published⇒verified` chặn insert sai; migration V20 apply sạch.
- Tách khỏi fast suite (CI thường khỏi Docker), nhưng **bắt buộc chạy trước merge/deploy**.

**DoD Slice 7:** `./mvnw verify -Ppostgres-integration` xanh.

---

## Thứ tự & rollback
1→2→3→4 (backend trọn vẹn, demo bằng Swagger) → 5→6 (UI) → 7 (gate deploy). Mỗi slice 1 commit. Rollback = drop V20 + xóa package `race.media` (chưa ai phụ thuộc). User tự commit ([[workflow-git-commits]]).
