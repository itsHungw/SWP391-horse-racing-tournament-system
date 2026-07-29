import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CalendarDays, Flag, MapPin, Search, Trophy, Users } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";

import { searchPublicTournaments } from "../../api/racingApi";
import { BannerCarousel } from "../../components/client/BannerCarousel";
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
import { PublicPagination } from "./components/PublicPagination";
import { StatusPill } from "./components/StatusPill";

const EMPTY_PAGE: PageResponse<TournamentSummary> = {
  content: [],
  number: 0,
  size: 12,
  totalElements: 0,
  totalPages: 0,
};

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
            <Link to={primary.to} className="inline-flex min-h-11 items-center gap-2 bg-emerald-glow px-5 text-xs font-bold uppercase tracking-[0.14em] text-turf-950 transition-colors hover:bg-emerald-soft">
              {primary.label} <ArrowRight size={14} />
            </Link>
            <Link to={`/championships/${championship.id}`} className="inline-flex min-h-11 items-center border border-white/15 px-5 text-xs font-bold uppercase tracking-[0.14em] text-ivory transition-colors hover:border-gold-400/60">
              Programme
            </Link>
            {championship.status === "OPEN_REGISTRATION" && owner ? (
              <Link to={`/owner/tournament-registrations?tournamentId=${championship.id}`} className="inline-flex min-h-11 items-center border border-white/15 px-5 text-xs font-bold uppercase tracking-[0.14em] text-ivory-dim transition-colors hover:border-gold-400/60 hover:text-ivory">
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
    <article className="group border-t border-white/10 py-7 transition-colors hover:border-gold-400/40">
      <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-start">
        <div className="min-w-0">
          {/* Trạng thái đứng trước tên: câu hỏi đầu tiên khi quét danh sách là
              "giải này đang chạy / mở đăng ký / hay đã xong", không phải nó tên gì. */}
          <StatusPill tone={status.tone} label={status.label} />
          <h3 className="mt-3 text-balance font-display text-2xl font-medium tracking-tight text-ivory transition-colors group-hover:text-gold-200 md:text-3xl">
            {championship.name}
          </h3>
          <p className="mt-2 text-sm text-ivory-dim">
            {championship.location || "Circuit venue TBA"} · {formatDateRange(championship.startDate, championship.endDate)}
          </p>

          <div className="mt-4">
            {championship.nextRace ? (
              <NextRaceLine championship={championship} />
            ) : (
              <p className="text-sm text-ivory-faint">
                {championship.status === "COMPLETED" ? "Season complete" : "Schedule to be published"}
              </p>
            )}
          </div>

          {/* Danh sách chạy chữ thay cho lưới 3 cột cứng — đó là chỗ tiền VND từng
              tràn ô, buộc phải hạ cỡ chữ. Wrap tự nhiên thì không bao giờ vỡ. */}
          <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 font-data text-xs uppercase tracking-[0.14em] text-ivory-faint">
            <div><dd className="inline text-sm text-ivory">{championship.raceCount}</dd> rounds</div>
            <div><dd className="inline text-sm text-ivory">{championship.participantCount}</dd> horses</div>
            {championship.totalPrizePool != null ? (
              <div><dd className="inline text-sm text-gold-300">{formatVndCompact(championship.totalPrizePool)}</dd> prize</div>
            ) : null}
          </dl>
        </div>

        <Link to={`/championships/${championship.id}`} className="inline-flex min-h-11 shrink-0 items-center gap-2 self-center border border-white/15 px-5 text-xs font-bold uppercase tracking-[0.14em] text-ivory transition-colors hover:border-gold-400/60 hover:text-gold-200">
          View <ArrowRight size={14} />
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
  const focusList = rankChampionshipsInFocus(focusPool).slice(0, 5);

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
              <p className="mt-2 max-w-xl text-ivory-dim">The programmes shaping the 2026 season.</p>
            </div>
            <p role="status" aria-live="polite" className="font-data text-xs uppercase tracking-[0.18em] text-ivory-faint">
              {pageData.totalElements} championships
            </p>
          </div>
        </section>

        <section className="bg-turf-900 pb-14 pt-2 md:pb-16" aria-labelledby="focus-title">
          <div className="mx-auto max-w-[1400px] px-6 md:px-12">
            <div className="mb-6 flex items-end justify-between gap-5">
              <div>
                <p className="eyebrow text-gold-300">In Focus</p>
                <h2 id="focus-title" className="mt-3 font-display text-3xl font-light md:text-4xl">The championship that matters now.</h2>
              </div>
              <Trophy size={30} className="text-gold-400/60" aria-hidden="true" />
            </div>
            {focusQuery.loading ? <div className="h-72 animate-pulse border border-white/10 bg-turf-950" aria-label="Loading focused championship" /> : focusList.length > 0 ? (
              <BannerCarousel
                label="Championships in focus"
                slides={focusList.map((championship) => ({
                  key: championship.id,
                  node: <FocusCard championship={championship} owner={owner} />,
                }))}
              />
            ) : focusQuery.error ? (
              <div role="alert" className="border border-nyraRed/50 bg-turf-950 px-7 py-9"><h3 className="font-display text-3xl font-light">The featured championship could not be loaded.</h3><p className="mt-3 text-ivory-dim">Check your connection and try again in a moment.</p></div>
            ) : (
              <div className="border border-gold-400/40 bg-turf-950 px-7 py-9"><h3 className="font-display text-3xl font-light">No active championship right now.</h3><p className="mt-3 text-ivory-dim">Explore completed championships or check back later.</p></div>
            )}
          </div>
        </section>

        <section className="bg-turf-950 pb-24" aria-labelledby="discovery-title">
          <div className="sticky top-[var(--client-header-h)] z-30 border-y border-white/10 bg-turf-950/95 backdrop-blur-xl">
            <form
              className="mx-auto grid max-w-[1400px] gap-3 px-6 py-4 md:grid-cols-[1fr_190px_170px_230px] md:px-12"
              onSubmit={(event) => { event.preventDefault(); updateParams({ search: draftSearch, page: 0 }); }}
            >
              <label className="relative">
                <span className="sr-only">Search championships</span>
                <Search size={16} className="pointer-events-none absolute left-4 top-3.5 text-ivory-faint" />
                <input type="search" aria-label="Search championships" value={draftSearch} onChange={(event) => setDraftSearch(event.target.value)} placeholder="Search championships..." className="h-11 w-full border border-white/15 bg-turf-900 pl-11 pr-4 text-sm text-ivory outline-none placeholder:text-ivory-faint focus:border-gold-400/70" />
              </label>
              <select aria-label="Championship status" value={state.status} onChange={(event) => updateParams({ status: event.target.value, page: 0 })} className="h-11 border border-white/15 bg-turf-900 px-3 text-sm text-ivory outline-none focus:border-gold-400/70">
                <option value="">All statuses</option><option value="ONGOING">Ongoing</option><option value="OPEN_REGISTRATION">Registration open</option><option value="SCHEDULE_PUBLISHED">Upcoming</option><option value="COMPLETED">Completed</option>
              </select>
              <select aria-label="Season year" value={state.year ?? ""} onChange={(event) => updateParams({ year: event.target.value, page: 0 })} className="h-11 border border-white/15 bg-turf-900 px-3 text-sm text-ivory outline-none focus:border-gold-400/70">
                <option value="">All seasons</option>
                {seasonOptions().map((year) => <option key={year} value={year}>{year} season</option>)}
              </select>
              <select aria-label="Sort championships" value={state.sortBy} onChange={(event) => updateParams({ sortBy: event.target.value, page: 0 })} className="h-11 border border-white/15 bg-turf-900 px-3 text-sm text-ivory outline-none focus:border-gold-400/70">
                <option value="ONGOING_FIRST">Ongoing first</option><option value="REGISTRATION_CLOSING_SOON">Registration closing soon</option><option value="LATEST">Latest season</option>
              </select>
            </form>
          </div>
          <div className="mx-auto max-w-[1400px] px-6 pt-12 md:px-12">
            <MotionReveal className="flex items-end justify-between gap-5 border-b border-white/10 pb-6">
              <div><h2 id="discovery-title" className="font-display text-4xl font-light tracking-tight">Discover the season.</h2><GoldRule className="mt-5 w-20" /></div>
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
