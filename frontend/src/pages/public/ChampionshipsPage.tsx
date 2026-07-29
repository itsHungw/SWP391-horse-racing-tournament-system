import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CalendarDays, Flag, MapPin, Search, Trophy, Users } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";

import { searchPublicTournaments } from "../../api/racingApi";
import { ClientFooter } from "../../components/client/ClientFooter";
import { ClientHeader } from "../../components/client/ClientHeader";
import { Countdown } from "../../components/client/Countdown";
import { GoldRule, MotionReveal } from "../../components/client/primitives";
import { useClientSession } from "../../hooks/useClientSession";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { usePublicQuery } from "../../hooks/usePublicQuery";
import type { PageResponse, TournamentSummary } from "../../types/racing";
import { formatVndCompact } from "../../utils/money";
import { championshipStatus, formatDateRange, formatPostTime } from "./publicRacingData";
import { parseChampionshipDiscoveryQuery, rankChampionshipsInFocus } from "./racingDiscovery";
import { MetaDot } from "./components/MetaDot";
import { PublicPagination } from "./components/PublicPagination";
import { SegmentedControl } from "./components/SegmentedControl";
import { StatusPill } from "./components/StatusPill";

const EMPTY_PAGE: PageResponse<TournamentSummary> = {
  content: [],
  number: 0,
  size: 12,
  totalElements: 0,
  totalPages: 0,
};

// Nhãn ngắn: ở 375px lưới 2 cột chỉ cho mỗi nút ~159px, "All championships" bị cắt
// thành "All championsh…" — mà nó lại đúng là option mặc định đang chọn. Trong một
// radiogroup đã có nhãn "Championship status filters" thì "All" không hề mơ hồ.
const STATUS_FILTERS = [
  { label: "All", value: "" },
  { label: "Running now", value: "ONGOING" },
  { label: "Registration", value: "OPEN_REGISTRATION" },
  { label: "Upcoming", value: "SCHEDULE_PUBLISHED" },
  { label: "Completed", value: "COMPLETED" },
] as const;

/** Mùa giải cho ô chọn — thay <input type="number"> (mũi tên tăng/giảm cho một cái năm là vô nghĩa). */
function seasonOptions(): number[] {
  const now = new Date().getFullYear();
  return [now + 1, now, now - 1, now - 2, now - 3, now - 4];
}

/**
 * Khối "race kế tiếp" — thứ khán giả cần thấy trước nhất trên trang này.
 * Trả về null khi giải chưa có lịch, để nơi gọi tự quyết định fallback.
 */
function NextRaceLine({ championship }: { championship: TournamentSummary }) {
  if (!championship.nextRace) return null;
  return (
    <Link
      to={`/races/${championship.nextRace.id}`}
      className="group/next inline-flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm text-ivory-dim transition-colors hover:text-gold-200"
    >
      <span className="font-data text-[10px] uppercase tracking-[0.2em] text-gold-400">Next race</span>
      <span className="font-medium text-ivory group-hover/next:text-gold-200">{championship.nextRace.name}</span>
      <span>{formatPostTime(championship.nextRace.raceDateTime)}</span>
      <ArrowRight size={13} className="translate-y-px opacity-0 transition-opacity group-hover/next:opacity-100" />
    </Link>
  );
}

function FocusCard({ championship, owner }: { championship: TournamentSummary; owner: boolean }) {
  const status = championshipStatus(championship.status);
  const nextRace = championship.nextRace;

  // Khán giả đặt cược là đối tượng chính: nếu giải có race kế tiếp thì hành động
  // đầu tiên luôn là đi tới race đó. Đăng ký ngựa (owner) tụt xuống hàng phụ.
  const primary = nextRace
    ? { label: "View Next Race", to: `/races/${nextRace.id}` }
    : championship.status === "COMPLETED"
      ? { label: "View Results", to: `/races?scope=RESULTS&tournamentId=${championship.id}` }
      : { label: "View Championship", to: `/championships/${championship.id}` };

  return (
    <article className="relative overflow-hidden border border-gold-400/25 bg-turf-950 p-7 shadow-[0_35px_100px_-50px_rgba(212,175,55,0.5)] md:p-10">
      <div className="pointer-events-none absolute right-0 top-0 h-full w-2/5 bg-[linear-gradient(135deg,transparent,rgba(212,175,55,0.06))]" />
      <div className="relative grid gap-8 lg:grid-cols-[1fr_320px] lg:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-4">
            <StatusPill tone={status.tone} label={status.label} />
            <span className="font-data text-[10px] uppercase tracking-[0.22em] text-ivory-faint">{championship.code}</span>
          </div>
          <h3 className="mt-5 max-w-3xl text-balance font-display text-3xl font-light leading-[1.05] tracking-tight text-ivory md:text-5xl">
            {championship.name}
          </h3>

          <dl className="mt-6 flex flex-wrap gap-x-7 gap-y-3 text-sm text-ivory-dim">
            <div className="inline-flex items-center gap-2"><CalendarDays size={15} className="text-gold-400" /> {formatDateRange(championship.startDate, championship.endDate)}</div>
            {championship.location ? <div className="inline-flex items-center gap-2"><MapPin size={15} className="text-gold-400" /> {championship.location}</div> : null}
            <div className="inline-flex items-center gap-2"><Flag size={15} className="text-gold-400" /> {championship.raceCount} rounds</div>
            <div className="inline-flex items-center gap-2"><Users size={15} className="text-gold-400" /> {championship.participantCount} horses</div>
            {championship.totalPrizePool != null ? (
              <div className="inline-flex items-center gap-2"><Trophy size={15} className="text-gold-400" /> {formatVndCompact(championship.totalPrizePool)} prize</div>
            ) : null}
          </dl>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link to={primary.to} className="inline-flex min-h-11 items-center gap-2 rounded-sm bg-emerald-glow px-5 text-xs font-bold uppercase tracking-[0.14em] text-turf-950 transition-colors hover:bg-emerald-soft">
              {primary.label} <ArrowRight size={14} />
            </Link>
            {primary.to !== `/championships/${championship.id}` ? (
              <Link to={`/championships/${championship.id}`} className="inline-flex min-h-11 items-center rounded-sm border border-white/15 px-5 text-xs font-bold uppercase tracking-[0.14em] text-ivory transition-colors hover:border-gold-400/60">
                Full Programme
              </Link>
            ) : null}
            {championship.status === "OPEN_REGISTRATION" && owner ? (
              <Link to={`/owner/tournament-registrations?tournamentId=${championship.id}`} className="inline-flex min-h-11 items-center rounded-sm border border-white/15 px-5 text-xs font-bold uppercase tracking-[0.14em] text-ivory-dim transition-colors hover:border-gold-400/60 hover:text-ivory">
                Register Horse
              </Link>
            ) : null}
          </div>
        </div>

        {/* Cột phải là mỏ neo của khán giả: đếm ngược tới giờ xuất phát. */}
        <div className="border-t border-white/10 pt-6 lg:border-l lg:border-t-0 lg:pl-7 lg:pt-0">
          {nextRace ? (
            <>
              <p className="font-data text-[10px] uppercase tracking-[0.22em] text-ivory-faint">Countdown to post</p>
              <div className="mt-4"><Countdown target={nextRace.raceDateTime} doneLabel="Underway" /></div>
              <p className="mt-4 font-display text-xl font-medium text-ivory">{nextRace.name}</p>
              <p className="mt-1 text-sm text-ivory-dim">{formatPostTime(nextRace.raceDateTime)}</p>
            </>
          ) : championship.status.toUpperCase() === "ONGOING" ? (
            <>
              <p className="font-data text-[10px] uppercase tracking-[0.22em] text-gold-300">Championship underway</p>
              <p className="mt-4 font-display text-2xl font-medium text-ivory">Standings in motion</p>
              <p className="mt-3 text-sm leading-relaxed text-ivory-dim">Open the championship to follow completed rounds, current points, and the next published card.</p>
            </>
          ) : championship.status === "OPEN_REGISTRATION" ? (
            <>
              <p className="font-data text-[10px] uppercase tracking-[0.22em] text-emerald-soft">Registration window</p>
              <p className="mt-4 font-display text-2xl font-medium text-ivory">
                {championship.registrationEndAt ? formatPostTime(championship.registrationEndAt) : "Open now"}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-ivory-dim">Owners can review eligibility and submit a horse from the championship programme.</p>
            </>
          ) : (
            <p className="text-sm leading-relaxed text-ivory-dim">
              {championship.status === "COMPLETED"
                ? "The final result is now part of the season record."
                : "Race programme details will appear when the schedule is published."}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}

function ChampionshipRow({ championship }: { championship: TournamentSummary }) {
  const status = championshipStatus(championship.status);
  return (
    // Kẻ phân cách nâng từ white/10 lên white/[0.18]: trên nền turf-950, 10% chỉ cho
    // contrast 1.28:1 (đo bằng canvas) — mắt thường không thấy nên các row trôi thành
    // một khối chữ liền. 18% lên 1.69:1; không đẩy tới mốc 3:1 vì rule sáng như vậy
    // biến list thành lưới bảng, phá tông tối của theme. Phần tách còn lại do mỏ neo
    // giờ-đua căn thẳng đỉnh row và row thấp bớt đảm nhiệm.
    <article className="group border-t border-white/[0.18] py-7 transition-colors hover:border-gold-400/50">
      <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-start">
        <div className="min-w-0">
          {/* Trạng thái đứng trước tên: câu hỏi đầu tiên khi quét danh sách là
              "giải này đang chạy / mở đăng ký / hay đã xong", không phải nó tên gì. */}
          <StatusPill tone={status.tone} label={status.label} />
          <h3 className="mt-2.5 text-balance font-display text-2xl font-medium tracking-tight text-ivory transition-colors group-hover:text-gold-200 md:text-3xl">
            {championship.name}
          </h3>

          {/* Địa điểm/thời gian và ba con số gộp thành MỘT dòng meta chạy chữ, thay vì
              hai khối xếp chồng. Wrap tự nhiên nên tiền VND không bao giờ tràn ô. */}
          <dl className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-ivory-dim">
            <span>{championship.location || "Circuit venue TBA"}</span>
            <MetaDot />
            <span>{formatDateRange(championship.startDate, championship.endDate)}</span>
            <MetaDot />
            <div><dd className="inline font-semibold text-ivory">{championship.raceCount}</dd> rounds</div>
            <MetaDot />
            <div><dd className="inline font-semibold text-ivory">{championship.participantCount}</dd> horses</div>
            {championship.totalPrizePool != null ? (
              <>
                <MetaDot />
                <div><dd className="inline font-semibold text-gold-300">{formatVndCompact(championship.totalPrizePool)}</dd> prize</div>
              </>
            ) : null}
          </dl>

          <div className="mt-3">
            {championship.nextRace ? (
              <NextRaceLine championship={championship} />
            ) : (
              <p className="text-sm text-ivory-faint">
                {championship.status === "COMPLETED" ? "Season complete" : "Schedule to be published"}
              </p>
            )}
          </div>
        </div>

        <Link to={`/championships/${championship.id}`} className="inline-flex min-h-11 shrink-0 items-center gap-2 self-center rounded-sm border border-white/15 px-5 text-xs font-bold uppercase tracking-[0.14em] text-ivory transition-colors hover:border-gold-400/60 hover:text-gold-200">
          Open championship <ArrowRight size={14} />
        </Link>
      </div>
    </article>
  );
}

export function ChampionshipsPage() {
  useDocumentTitle("Championships | Night at the Races");
  const { session } = useClientSession();
  const [params, setParams] = useSearchParams();
  const state = useMemo(() => parseChampionshipDiscoveryQuery(params), [params]);
  const [draftSearch, setDraftSearch] = useState(state.search);
  const owner = session?.roles.some((role) => role.toUpperCase() === "HORSE_OWNER") ?? false;

  useEffect(() => setDraftSearch(state.search), [state.search]);

  const listParams = useMemo(
    () => ({ page: state.page, size: 12, search: state.search || undefined, status: state.status || undefined, year: state.year, sortBy: state.sortBy }),
    [state],
  );
  const listQuery = usePublicQuery(`championships:list:${JSON.stringify(listParams)}`, () => searchPublicTournaments(listParams));
  const focusQuery = usePublicQuery("championships:focus", () =>
    searchPublicTournaments({ page: 0, size: 12, sortBy: "ONGOING_FIRST" }),
  );

  const pageData = listQuery.data ?? EMPTY_PAGE;
  const focusPool: TournamentSummary[] = focusQuery.data?.content ?? [];

  const updateParams = (updates: Record<string, string | number | undefined>) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(updates)) {
      if (value === undefined || value === "") next.delete(key);
      else next.set(key, String(value));
    }
    setParams(next);
  };
  // Lấy tối đa 5 giải đáng chú ý nhất cho banner lật, thay vì chỉ hiện đúng một.
  // Xếp hạng đã ưu tiên ONGOING (có race kế) trước, rồi mở đăng ký, rồi sắp tới.
  const focusChampionship = rankChampionshipsInFocus(focusPool)[0] ?? null;

  // Search chạy trễ 350ms thay vì đợi bấm nút. Trước đây status/year/sort áp dụng
  // ngay còn search phải submit — người dùng gõ xong ngồi đợi mà không có gì xảy ra.
  useEffect(() => {
    if (draftSearch === state.search) return;
    const timer = setTimeout(() => updateParams({ search: draftSearch, page: 0 }), 350);
    return () => clearTimeout(timer);
    // updateParams đọc `params` mới nhất mỗi lần chạy nên không cần vào deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftSearch, state.search]);

  return (
    <div className="client-theme min-h-screen bg-turf-950 text-ivory">
      <ClientHeader />
      <main>
        {/* Masthead gọn thay cho hero cao nguyên màn hình: nav đã cho biết đang ở đâu,
            nên chỗ này chỉ cần định vị mùa giải rồi nhường chỗ ngay cho race kế tiếp. */}
        <section className="grain relative isolate overflow-hidden border-b border-white/10 bg-turf-900">
          <div className="turf-vignette absolute inset-0 -z-10" />
          <div className="mx-auto flex max-w-[1400px] flex-wrap items-end justify-between gap-x-8 gap-y-4 px-6 py-9 md:px-12">
            <div>
              <h1 className="font-display text-4xl font-light tracking-tight md:text-5xl">
                Championships<span className="text-foil">.</span>
              </h1>
              <p className="mt-2 max-w-xl text-ivory-dim">Follow each programme from registration to the final result.</p>
            </div>
            <p role="status" aria-live="polite" className="font-data text-xs uppercase tracking-[0.18em] text-ivory-faint">
              {pageData.totalElements} championships
            </p>
          </div>
        </section>

        <section className="border-b border-white/8 bg-turf-900 pb-14 pt-8 md:pb-16 md:pt-10" aria-labelledby="focus-title">
          <div className="mx-auto max-w-[1400px] px-6 md:px-12">
            <div className="mb-6 flex flex-col gap-3 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="eyebrow text-gold-300">Season Priority</p>
                <h2 id="focus-title" className="mt-3 font-display text-3xl font-light tracking-tight md:text-4xl">The programme to follow now.</h2>
              </div>
              <Link to="/races" className="inline-flex min-h-11 items-center gap-2 self-start text-[11px] font-bold uppercase tracking-[0.16em] text-ivory-dim transition-colors hover:text-gold-200 sm:self-auto">
                Open race desk <ArrowRight size={14} />
              </Link>
            </div>
            {focusQuery.loading ? (
              <div className="h-72 animate-pulse border border-white/10 bg-turf-950" aria-label="Loading season priority" />
            ) : focusChampionship ? (
              <FocusCard championship={focusChampionship} owner={owner} />
            ) : focusQuery.error ? (
              <div role="alert" className="border border-nyraRed/50 bg-turf-950 px-7 py-9"><h3 className="font-display text-3xl font-light">The season priority could not be loaded.</h3><p className="mt-3 text-ivory-dim">Check your connection and try again in a moment.</p></div>
            ) : (
              <div className="border border-gold-400/40 bg-turf-950 px-7 py-9"><h3 className="font-display text-3xl font-light">No active championship right now.</h3><p className="mt-3 text-ivory-dim">Explore completed championships or check back when the next programme opens.</p></div>
            )}
          </div>
        </section>

        <section className="bg-turf-950 pb-24" aria-labelledby="discovery-title">
          <div className="border-y border-white/10 bg-turf-950/95 backdrop-blur-xl lg:sticky lg:top-[var(--client-header-h)] lg:z-30">
            <div className="mx-auto max-w-[1400px] px-6 py-4 md:px-12">
              <div className="grid gap-4">
                <SegmentedControl
                  label="Championship status filters"
                  value={state.status}
                  options={STATUS_FILTERS}
                  onChange={(status) => updateParams({ status, page: 0 })}
                  className="grid-cols-2 [&>button:last-child]:col-span-2 sm:grid-cols-5 sm:[&>button:last-child]:col-span-1"
                />

                <form
                  className="grid min-w-0 gap-3 border-t border-white/8 pt-4 sm:grid-cols-2 xl:grid-cols-[minmax(300px,1fr)_180px_250px]"
                  onSubmit={(event) => { event.preventDefault(); updateParams({ search: draftSearch, page: 0 }); }}
                >
                  <label className="relative sm:col-span-2 xl:col-span-1">
                    <span className="sr-only">Search championships</span>
                    <Search size={16} className="pointer-events-none absolute left-4 top-3.5 text-ivory-dim" />
                    <input type="search" aria-label="Search championships" value={draftSearch} onChange={(event) => setDraftSearch(event.target.value)} placeholder="Search by name or venue" className="h-11 w-full rounded-lg border border-white/15 bg-turf-900 pl-11 pr-4 text-sm text-ivory outline-none placeholder:text-ivory-dim focus:border-gold-400/70" />
                  </label>
                  <select aria-label="Season year" value={state.year ?? ""} onChange={(event) => updateParams({ year: event.target.value, page: 0 })} className="h-11 rounded-lg border border-white/15 bg-turf-900 px-3 text-sm text-ivory outline-none focus:border-gold-400/70">
                    <option value="">All seasons</option>
                    {seasonOptions().map((year) => <option key={year} value={year}>{year} season</option>)}
                  </select>
                  <select aria-label="Sort championships" value={state.sortBy} onChange={(event) => updateParams({ sortBy: event.target.value, page: 0 })} className="h-11 rounded-lg border border-white/15 bg-turf-900 px-3 text-sm text-ivory outline-none focus:border-gold-400/70">
                    <option value="ONGOING_FIRST">Most relevant</option><option value="REGISTRATION_CLOSING_SOON">Registration closing soon</option><option value="LATEST">Latest season</option>
                  </select>
                </form>
              </div>
            </div>
          </div>
          <div className="mx-auto max-w-[1400px] px-6 pt-12 md:px-12">
            <MotionReveal className="flex items-end justify-between gap-5 border-b border-white/10 pb-6">
              <div><p className="eyebrow text-gold-300">Championship archive</p><h2 id="discovery-title" className="mt-3 font-display text-4xl font-light tracking-tight">All championships.</h2><GoldRule className="mt-5 w-20" /></div>
            </MotionReveal>
            <div className="mt-3">
              {listQuery.loading ? [0, 1, 2, 3].map((item) => <div key={item} className="h-32 animate-pulse border-t border-white/10 bg-white/[0.02]" />) : listQuery.error && !listQuery.data ? (
                <div role="alert" className="border border-nyraRed/50 bg-turf-900 px-6 py-7"><p className="text-rose-300">Could not load championships right now.</p><button type="button" onClick={listQuery.retry} className="mt-5 inline-flex min-h-11 items-center border border-white/15 px-5 text-xs font-bold uppercase tracking-[0.14em] text-ivory transition-colors hover:border-gold-400/60">Try again</button></div>
              ) : pageData.content.length === 0 ? <div className="border border-gold-400/40 bg-turf-900 px-7 py-9"><h3 className="font-display text-3xl font-light">No championships match this view.</h3><p className="mt-3 text-ivory-dim">Reset the filters or explore another season.</p></div> : (
                <div aria-busy={listQuery.fetching} className={`transition-opacity duration-300 ${listQuery.fetching ? "opacity-50" : "opacity-100"}`}>
                  {pageData.content.map((championship) => <ChampionshipRow key={championship.id} championship={championship} />)}
                </div>
              )}
            </div>
            <PublicPagination page={pageData.number} totalPages={pageData.totalPages} onChange={(page) => updateParams({ page })} />
          </div>
        </section>
      </main>
      <ClientFooter />
    </div>
  );
}
