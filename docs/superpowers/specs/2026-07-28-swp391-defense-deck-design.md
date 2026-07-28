# SWP391 Defense Deck — Design & Speaker Notes

**Date:** 28 July 2026
**Deliverable:** `pptx/SWP391-Defense-HorseRacing.pptx` (18 slides, English)
**Build:** `node pptx/build-defense-deck.cjs`
(set `OUT_PPTX=<path>` to build elsewhere when the file is open in PowerPoint —
Windows holds an exclusive lock and the write fails with `EBUSY`.)

## 1. Where the structure came from

The structure follows review notes taken from Mr. Hoang's SWP391 class, plus a
recording and two photographs of a deck he reviewed there (a parking-system
group). The observed reference structure was:

| Slide | Layout |
| --- | --- |
| Table of Contents | 7 numbered items |
| Project Introduction | "Context" bullets + a filled "Problem" panel |
| System Architecture | Context diagram — system centred, actors around it, third parties below, **every arrow labelled with the data it carries** |
| Actor & Feature | One column per actor, illustration over a bullet list |
| Technology Stack | Rows per layer with logos, third-party services in a right sidebar |
| Scenario #N | One slide per demo flow, icon-and-arrow, snake layout |

Constraints taken from the same notes and applied here:

- Between the table of contents and the demo index there must be **exactly five
  slides**, delivered in four to five minutes.
- Achievements are stated **without specific figures** — concrete numbers invite
  hard questioning from the committee.
- Technologies and architecture elements are **ordered by importance**, and more
  important icons are drawn larger.
- Achievements and Limitations share **one** slide.
- The closing slide carries a visible **Q&A** cue.
- Each demo scenario gets its own slide, matching the demo index one-to-one.

## 2. Deck structure

| # | Slide | Purpose |
| --- | --- | --- |
| 1 | Title | System name, group, class, semester, supervisor |
| 2 | Team & Contribution | Member, student ID, responsibility, contribution % |
| 3 | Table of Contents | 7 items |
| 4 | Context & Problem | The four-party coordination problem |
| 5 | Proposed Solution | Three product layers + the three approval gates |
| 6 | System Architecture | Context diagram — 7 actors ↔ platform core ↔ 4 third parties, every arrow labelled in both directions |
| 7 | Technical Architecture | Front-end block, VPS boundary containing the layered back-end and PostgreSQL, external gateways below |
| 8 | Technology Stack | Frontend → Backend → Database → Storage → Deployment → Testing |
| 9 | Key Features | Six features, icon per card |
| 10 | Demonstration index | The six scenarios |
| 11–16 | Scenario #01–#06 | Six-step flow each |
| 17 | Achievements & Future Improvements | Two columns, one slide |
| 18 | Thank You / Q&A | Closing + Q&A cue |

**Deviation to be aware of:** slides 4–9 are now *six* slides before the demo
index, not the five the notes call for. The second architecture slide was added
deliberately (the reference deck carried the same technical/layered diagram), but
if the supervisor holds strictly to five, merge Context & Problem with Proposed
Solution into a single three-column "Project Introduction" slide.

### Slide 6 vs slide 7

They answer different questions and should not be merged:

- **Slide 6 (context)** — *who talks to the system and what data crosses the
  boundary.* Each actor has two labelled arrows: what they send up, what the
  system returns. Third parties carry the same treatment inside their cards.
- **Slide 7 (technical)** — *what the system is made of and where it runs.*
  Front-end block, a dashed VPS boundary containing API → business logic → data
  access and PostgreSQL, solid request paths and dashed response paths, and
  dotted call-outs from the business-logic layer to the four external gateways.

## 3. Demo scenarios

1. **Account & Role Onboarding** — register → verify email → sign in → request
   role → admin reviews → workspace unlocked.
2. **Organizer & Tournament Approval** — KYB → *Gate 1* → workspace → create
   tournament → *Gate 2* → registration opens.
3. **Building the Field** — horse + evidence → admin approves → register →
   jockey applies → contract accepted → field locked.
4. **Race Day & Official Results** — contracted referee → pre-race check → start
   → incident → results submitted → *Gate 3* published.
5. **Spectator Money Loop** — open race → VNPay top-up → place prediction →
   market locks → official result → payout.
6. **Platform Governance** — withdrawal → funds held → risk review → payment and
   receipt → dispute handling → finance audit.

## 4. Visual system

Colours are taken verbatim from `frontend/src/styles.css` so the deck and the
running application read as one system during the live demo.

| Token | Value | Use |
| --- | --- | --- |
| `turf-950` | `#04140F` | Slide background |
| `turf-850` | `#082821` | Panels |
| `turf-700` / `turf-600` | `#0E3C30` / `#135041` | Borders, rules |
| `gold-400` / `gold-300` | `#D4AF37` / `#E8CD7E` | Accent, icons, badges |
| `office-brass` | `#BB8A3C` | Arrows, hairlines |
| `ivory` / `ivory-dim` / `ivory-faint` | `#F5F1E6` / `#CBC7B6` / `#8F8C7E` | Text tiers |
| `emerald-glow` | `#1F9D76` | Achievements marker |

Display type is Georgia; body type is Calibri. Both ship with Windows and
Office, so the file renders correctly on a lab machine.

The icon set in `pptx/_media` is navy and would vanish on this background, so
`pptx/recolor-icons.py` rewrites all 25 icons to `gold-300` into
`pptx/_media_gold`, preserving the alpha channel (including anti-aliased edges).

### Brand logos

Real vendor logos live in `pptx/_logos/<slug>.png`, baked from SVG by
`pptx/prepare-logos.cjs` (uses `sharp`, already in the repo's `node_modules`).
Every logo sits on a white tile, because most vendor marks — VNPay's navy,
Vercel's black, Google's blues — are drawn for light backgrounds and disappear
against `turf-950`.

Any slug without a file falls back to a wordmark chip, so the deck always builds.
Fallback text is passed through `inkOn()`, which darkens the brand colour until
it clears 4.5:1 on white: React's `#61DAFB` is 1.6:1 as text and would otherwise
be unreadable.

All 16 marks are real logos and nothing is downloaded:

| Source | Slugs |
| --- | --- |
| Vendored in this repo | `vnpay` — `frontend/public/banks/VNPAY.svg` |
| `react-icons/si` (Simple Icons, already in `node_modules`) | `react`, `vite`, `typescript`, `tailwind`, `spring`, `java`, `postgresql`, `docker`, `nginx`, `vercel`, `githubactions`, `google`, `gmail`, `cloudflare`, `youtube` |

`react-icons` compiles each icon to a function whose body holds the icon
definition as a JSON literal, so `prepare-logos.cjs` reads it back out of
`Function.toString()` — that is the only way to reach the path data without a
React runtime. Official brand hex is applied per icon.

To override any of them: drop `<slug>.svg` into `pptx/_logos_src/`, run
`node pptx/prepare-logos.cjs`, then rebuild. Hand-supplied files are baked last
and win. No code change needed.

### Third-party services on the deck

Five, all verified as genuine integrations in the backend:

| Service | Evidence |
| --- | --- |
| VNPay | `wallet/service/VNPayService.java`, signed payment URL + verified return/IPN |
| Google OAuth | `auth/service/GoogleOAuth2ProviderService.java` |
| SMTP Mail | `auth/email/SmtpEmailSender.java` |
| **YouTube oEmbed** | `race/media/provider/RestClientYouTubeOEmbedClient.java` — a real server-to-server `RestClient` call to `https://www.youtube.com/oembed` (2s connect / 3s read timeout) that reads `title` and `thumbnail_url` and maps failures to `PROVIDER_UNAVAILABLE` / `NOT_EMBEDDABLE`. The frontend embeds via `youtube-nocookie.com`, explicitly allowed in the CSP at `application.yml`. This is an integration, not just an iframe. |
| Cloudflare R2 | `filestorage` module over the AWS S3 SDK |

## 5. Verification

There is no PowerPoint or LibreOffice on the build machine, so the deck cannot
be rendered conventionally. Two tools stand in, both reading the generated file
rather than a re-description of it:

- `pptx/qa-pptx.py` — parses the OOXML and reports slide count, embedded media,
  per-slide shape counts, out-of-bounds geometry, and full extracted text.
- `pptx/render-pptx.py` — rebuilds each slide as positioned HTML from the same
  XML (geometry, fills, borders, images, type), producing
  `pptx/SWP391-Defense-Preview.html` for visual inspection and for scripted
  measurement in a browser.

Results on the current build:

| Check | Result |
| --- | --- |
| Slides | 18 |
| Shapes outside the 13.33 × 7.50 in area | 0 |
| Text boxes overflowing their shape | 0 |
| Text-on-text collisions | 0 |
| Text ink over a light logo tile | 0 |
| Text ink over an image | 0 |
| WCAG AA contrast failures (412 runs) | 0 — lowest ratio 4.6:1 |

The light-tile check was added after real logos went in and immediately paid for
itself: text-on-text comparison cannot see a caption sitting on top of a white
logo tile, because the tile carries no text. It caught muted captions running
over the service tiles on slide 6 and over the front-end logo grid on slide 7.

**Measure glyphs, not boxes.** A text-versus-image check first reported 48
overlaps on the scenario slides. All 48 were artefacts: pptxgenjs text boxes are
wide and centre-aligned, so the *box* touches the step icon while the glyphs sit
comfortably inside. `Range.getBoundingClientRect()` does not help either — a
range over a block element returns the line box, which spans the full container
width. Only the inline `<span>` rects shrink-wrap to the actual glyph run; measured
that way the real count is 0, with a smallest true gap of 5px between an actor's
name and its icon on slide 6.

Defects found and fixed this way:

1. Technology Stack chip rows ran under the third-party sidebar. They passed the
   out-of-bounds check because they were still inside the slide — the lesson is
   that edge checks do not catch *inter-element* collisions. The builder now
   throws rather than drawing past `x = 8.95in`.
2. The Proposed Solution statement wrapped out of its box.
3. Nine wordmark fallbacks failed contrast on their white tiles (React at
   1.62:1). Fixed by `inkOn()` rather than by hand-picking replacement colours.
4. `Docker · nginx · VPS` sat at 4.25:1 against the core panel; moved to the
   brighter ink tier.

Two bugs were also found in the QA renderer itself, both of which had been
quietly hiding real geometry: diagonal lines were drawn as box borders (so the
dotted gateway call-outs appeared as vertical bars in the wrong place), and
`prstDash` was read from the drawing namespace instead of `p:spPr`, so every
dashed connector previewed as solid. Both are fixed; the call-outs were then
confirmed to run from the business-logic layer's bottom edge to each gateway
card's centre.

**Caveat:** browser font metrics are not PowerPoint's, so text wrapping is
indicative rather than exact. Open the `.pptx` once before presenting.

## 6. Placeholders still to fill

Everything outstanding is wrapped in guillemets — use Ctrl+H on `«` in
PowerPoint to find them all.

- Slide 1 — `«group code»`, `«class code»`, `«semester»`, `«lecturer name»`
- Slide 2 — members 2–5, and the responsibility / contribution % for every row
  including Nguyen Vinh Hung (SE200559)
- Slide 6 — `«live URL»`
- Slide 17 — `«group code»`

## 7. Documentation defects found while sourcing the deck

Audited against the code rather than the docs, because the two disagree.

| # | Finding |
| --- | --- |
| 1 | `aiinsight` contains only `.gitkeep`, yet `docs/specs/technical/06_ai-race-insight.md` specifies it and an `ai_predictions` table exists. **Excluded from the deck; listed under Limitations.** |
| 2 | `docs/specs/technical/01_tech-stack.md` claims migrations run "V1 through V18"; the tree holds **V1–V36**. |
| 3 | The same file omits Google OAuth, Apache POI, `tesseract.js` (receipt OCR) and `qrcode.react` (VietQR). |
| 4 | `docs/specs/business/05_blog-rewards.md` describes a rewards economy deleted by `V11__remove_gamification.sql`. |
| 5 | `docs/specs/business/03_workflows.md` omits disputes, account enforcement and appeal, race media and live stream, notifications, the admin finance dashboard, tournament prize pool and Google login. |
| 6 | `README.md` and `.github/workflows/deploy.yml` say DigitalOcean; `infra/.env.prod.example` still carries `yourdomain.com` placeholders. |

Claims placed on slide 16 were verified against source before use:
notifications are polled (`frontend/src/components/NotificationBell.tsx:80`,
no WebSocket or SSE anywhere in the backend), and VNPay defaults to the sandbox
endpoint (`backend/src/main/resources/application.yml:60`).

## 8. Delivery notes

Timing — roughly one minute for slides 1–3, four to five for 4–8, thirty seconds
on the demo index, then each scenario slide immediately before its live demo.

From the class notes:

- Invite the next speaker by name before handing over; the incoming speaker
  greets the committee again.
- Ask permission to begin the demo, and state clearly when it ends.
- If the committee skips ahead while you are talking, the slide was already
  clear — do not talk over it.
- Include every flow even if there is not time to demo them all; being asked
  about a skipped flow afterwards is normal and expected.
