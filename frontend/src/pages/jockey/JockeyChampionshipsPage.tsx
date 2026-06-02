import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Compass,
  FileCheck2,
  History,
  Search,
  ShieldCheck,
  Trophy,
  X,
} from "lucide-react";

import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { JockeyLayout } from "../../layouts/JockeyLayout";
import racingImage from "../../assets/slide.jpg";
import {
  careerRecord,
  championshipArchive,
  getNextRound,
  getRoundsForChampionship,
  JockeyChampionship,
  jockeyChampionships,
} from "./jockeyWorkspaceData";

type ChampionshipTab = "overview" | "open" | "history";
type OpenFilter = "Open" | "Closing Soon" | "Approved for Pool" | "Committed";

const tabs: Array<{ id: ChampionshipTab; label: string; icon: typeof Trophy }> = [
  { id: "overview", label: "Overview", icon: Trophy },
  { id: "open", label: "Open Championships", icon: Compass },
  { id: "history", label: "Championship History", icon: History },
];

const filters: OpenFilter[] = ["Open", "Closing Soon", "Approved for Pool", "Committed"];

function archiveYear(championship: string) {
  return championship.match(/\d{4}/)?.[0] ?? "Career";
}

function rankTone(rank: string) {
  if (rank === "#1") return "border-amber-300 bg-amber-50 text-amber-800";
  if (rank === "#2") return "border-slate-300 bg-slate-100 text-slate-700";
  if (rank === "#3") return "border-orange-300 bg-orange-50 text-orange-800";
  return "border-slate-200 bg-white text-slate-700";
}

function statusLabel(championship: JockeyChampionship) {
  switch (championship.applicationStatus) {
    case "COMMITTED":
      return "Committed";
    case "APPROVED_FOR_POOL":
      return "Approved for Pool";
    case "PENDING_REVIEW":
      return "Pending Review";
    case "REJECTED":
      return "Rejected";
    case "WITHDRAWN":
      return "Withdrawn";
    default:
      return "Open";
  }
}

function applicationHelp(championship: JockeyChampionship) {
  switch (championship.applicationStatus) {
    case "PENDING_REVIEW":
      return "Admin will review your racing passport and application eligibility before adding you to the jockey pool.";
    case "APPROVED_FOR_POOL":
      return "You are visible in the approved jockey pool and can receive assignment contracts from stable owners.";
    case "COMMITTED":
      return "You already have a committed horse-jockey assignment for this championship.";
    case "REJECTED":
      return "This application was rejected. Review the reason before applying again.";
    default:
      return "Apply to join the reviewed jockey pool before stable owners can send assignment contracts.";
  }
}

function filterMatches(championship: JockeyChampionship, filter: OpenFilter) {
  if (filter === "Approved for Pool") return championship.applicationStatus === "APPROVED_FOR_POOL";
  if (filter === "Committed") return championship.applicationStatus === "COMMITTED";
  if (filter === "Closing Soon") return championship.applicationStatus === "NOT_APPLIED";
  return championship.applicationStatus === "NOT_APPLIED" || championship.applicationStatus === "PENDING_REVIEW";
}

export function JockeyChampionshipsPage() {
  useDocumentTitle("Jockey championships");
  const [activeTab, setActiveTab] = useState<ChampionshipTab>("overview");
  const [activeFilter, setActiveFilter] = useState<OpenFilter>("Open");
  const [searchQuery, setSearchQuery] = useState("");
  const [championships, setChampionships] = useState(jockeyChampionships);
  const [applicationTarget, setApplicationTarget] = useState<JockeyChampionship | null>(null);
  const [historyTarget, setHistoryTarget] = useState<(typeof championshipArchive)[number] | null>(null);

  const activeChampionship =
    championships.find((championship) => championship.applicationStatus === "COMMITTED") ?? championships[0];
  const activeNextRound = getNextRound(activeChampionship.id);
  const activeRounds = getRoundsForChampionship(activeChampionship.id);

  const visibleChampionships = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return championships.filter((championship) => {
      const matchesSearch =
        !query ||
        championship.name.toLowerCase().includes(query) ||
        championship.track.toLowerCase().includes(query) ||
        championship.location.toLowerCase().includes(query);

      return matchesSearch && filterMatches(championship, activeFilter);
    });
  }, [activeFilter, championships, searchQuery]);

  const submitApplication = () => {
    if (!applicationTarget) return;

    setChampionships((current) =>
      current.map((championship) =>
        championship.id === applicationTarget.id
          ? {
              ...championship,
              applicationStatus: "PENDING_REVIEW",
              applicationSubmittedAt: "Jun 2, 2026",
            }
          : championship,
      ),
    );
    setApplicationTarget(null);
  };

  return (
    <JockeyLayout>
      <section aria-labelledby="championships-title" className="space-y-5">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-black uppercase tracking-[0.14em] text-[#006d5b]">Championship Operations</p>
          <h1 id="championships-title" className="mt-2 text-4xl font-black tracking-tight text-slate-950">
            Championships
          </h1>
          <p className="mt-2 max-w-3xl text-sm font-bold leading-6 text-slate-500">
            Manage your active championship, apply to reviewed jockey pools, and track completed seasons.
          </p>
        </div>

        <div
          aria-label="Championship sections"
          className="flex flex-wrap gap-2 rounded-lg border border-slate-200 bg-white p-2 shadow-sm"
          role="tablist"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                aria-selected={isActive}
                className={`inline-flex min-h-11 items-center gap-2 rounded-md px-4 text-sm font-black transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006d5b] ${
                  isActive ? "bg-[#006d5b] text-white shadow-sm" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                }`}
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                role="tab"
                type="button"
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === "overview" && (
          <section aria-label="Championship overview" className="space-y-5">
            <div className="overflow-hidden rounded-lg border border-emerald-900/20 bg-[#082f2a] text-white shadow-sm">
              <div className="grid gap-0 lg:grid-cols-[1.45fr_0.85fr]">
                <div className="relative p-6">
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-cover bg-center opacity-15"
                    style={{ backgroundImage: `url(${racingImage})` }}
                  />
                  <div className="relative">
                    <span className="inline-flex rounded-md bg-white/10 px-2.5 py-1 text-xs font-black uppercase tracking-[0.14em] text-emerald-100 ring-1 ring-white/20">
                      Current Championship
                    </span>
                    <h2 className="mt-4 text-3xl font-black tracking-tight">{activeChampionship.name}</h2>
                    <p className="mt-2 max-w-2xl text-sm font-bold leading-6 text-emerald-50/80">
                      Committed Assignment
                    </p>
                    <div className="mt-6 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-md bg-white/10 p-3 ring-1 ring-white/15">
                        <p className="text-xs font-black uppercase tracking-[0.12em] text-emerald-100">Horse</p>
                        <p className="mt-1 text-lg font-black">{activeChampionship.horse}</p>
                      </div>
                      <div className="rounded-md bg-white/10 p-3 ring-1 ring-white/15">
                        <p className="text-xs font-black uppercase tracking-[0.12em] text-emerald-100">Stable</p>
                        <p className="mt-1 text-lg font-black">{activeChampionship.stable}</p>
                      </div>
                      <div className="rounded-md bg-white/10 p-3 ring-1 ring-white/15">
                        <p className="text-xs font-black uppercase tracking-[0.12em] text-emerald-100">Season</p>
                        <p className="mt-1 text-lg font-black">{activeChampionship.rounds} rounds</p>
                      </div>
                    </div>
                  </div>
                </div>
                <aside className="border-t border-white/10 bg-white/8 p-6 lg:border-l lg:border-t-0">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-100">Current Standing</p>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-4xl font-black">{activeChampionship.rank}</p>
                      <p className="mt-1 text-sm font-black text-emerald-100">Rank {activeChampionship.rank}</p>
                    </div>
                    <div>
                      <p className="text-4xl font-black">{activeChampionship.points}</p>
                      <p className="mt-1 text-sm font-black text-emerald-100">{activeChampionship.points} pts</p>
                    </div>
                  </div>
                  <p className="mt-5 rounded-md bg-white/10 px-3 py-2 text-sm font-black text-emerald-50">
                    Gap to leader: {activeChampionship.gapToLeader}
                  </p>
                </aside>
              </div>
            </div>

            <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
              <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-[#006d5b]">Contract Status</p>
                    <h3 className="mt-2 text-2xl font-black text-slate-950">Assignment confirmed</h3>
                  </div>
                  <FileCheck2 className="h-6 w-6 text-[#006d5b]" aria-hidden="true" />
                </div>
                <p className="mt-3 text-sm font-bold leading-6 text-slate-500">
                  This contract forms the horse-jockey participant pair for the full championship season.
                </p>
                <div className="mt-5 rounded-md border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-sm font-black text-[#006d5b]">summer-assignment-agreement.pdf</p>
                  <p className="mt-1 text-sm font-bold text-emerald-900/70">Accepted May 21, 2026</p>
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Link
                    className="inline-flex min-h-11 items-center gap-2 rounded-md bg-[#006d5b] px-4 text-sm font-black text-white hover:bg-[#004d3d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006d5b]"
                    to="/jockey/contracts"
                  >
                    Open contract
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                  <Link
                    className="inline-flex min-h-11 items-center gap-2 rounded-md border border-slate-200 px-4 text-sm font-black text-slate-700 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006d5b]"
                    to="/jockey/schedule"
                  >
                    Open schedule
                  </Link>
                </div>
              </article>

              <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-[#006d5b]">Next Round</p>
                    <h3 className="mt-2 text-2xl font-black text-slate-950">
                      {activeNextRound?.raceName ?? "No scheduled round"}
                    </h3>
                  </div>
                  <Clock3 className="h-6 w-6 text-orange-600" aria-hidden="true" />
                </div>
                {activeNextRound && (
                  <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
                    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                      <dt className="font-bold text-slate-500">Date</dt>
                      <dd className="mt-1 font-black text-slate-950">{activeNextRound.date}</dd>
                    </div>
                    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                      <dt className="font-bold text-slate-500">Time</dt>
                      <dd className="mt-1 font-black text-slate-950">{activeNextRound.time}</dd>
                    </div>
                    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                      <dt className="font-bold text-slate-500">Track</dt>
                      <dd className="mt-1 font-black text-slate-950">{activeNextRound.track}</dd>
                    </div>
                  </dl>
                )}
              </article>
            </div>

            <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-[#006d5b]">Championship Journey</p>
                  <h3 className="mt-2 text-2xl font-black text-slate-950">From application to current round</h3>
                </div>
                <span className="rounded-md bg-slate-100 px-3 py-2 text-sm font-black text-slate-600">
                  {activeRounds.length} rounds loaded
                </span>
              </div>
              <div aria-label="Championship journey" className="mt-5 overflow-x-auto rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-[#006d5b]">Season Tracker</p>
                <ol className="mt-4 flex min-w-max items-stretch">
                  {[
                    { title: "Application Approved", detail: "Pool approved", state: "done" },
                    { title: "Contract Committed", detail: "Participant formed", state: "done" },
                    ...activeRounds.map((round) => ({
                      title: `Round ${round.roundNumber}`,
                      detail:
                        round.status === "FINISHED"
                          ? `${round.position} - ${round.points} pts`
                          : round.status === "NEXT"
                            ? "Current Round"
                            : round.raceName,
                      state: round.status === "NEXT" ? "current" : round.status === "FINISHED" ? "done" : "upcoming",
                    })),
                  ].map((step, index, steps) => (
                    <li className="flex items-center" key={`${step.title}-${step.detail}`}>
                      <div
                        className={`min-h-28 w-36 rounded-md border p-3 ${
                          step.state === "current"
                            ? "border-orange-300 bg-orange-50"
                            : step.state === "done"
                              ? "border-emerald-200 bg-white"
                              : "border-slate-200 bg-white"
                        }`}
                      >
                        <span
                          className={`grid h-8 w-8 place-items-center rounded-full ${
                            step.state === "current"
                              ? "bg-orange-600 text-white"
                              : step.state === "done"
                                ? "bg-[#006d5b] text-white"
                                : "bg-slate-200 text-slate-500"
                          }`}
                        >
                          {step.state === "done" ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> : index + 1}
                        </span>
                        <p className="mt-3 text-sm font-black leading-5 text-slate-950">{step.title}</p>
                        <p className="mt-2 text-xs font-bold leading-4 text-slate-500">{step.detail}</p>
                      </div>
                      {index < steps.length - 1 && <div className="h-px w-10 bg-slate-300" aria-hidden="true" />}
                    </li>
                  ))}
                </ol>
              </div>
            </article>
          </section>
        )}

        {activeTab === "open" && (
          <section aria-label="Open championships" className="space-y-5">
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <h2 className="text-2xl font-black text-slate-950">Open Championships</h2>
                  <p className="mt-1 text-sm font-bold text-slate-500">
                    Apply to reviewed pools before stable owners can send assignment contracts.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {filters.map((filter) => (
                    <button
                      className={`min-h-10 rounded-md px-3 text-sm font-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006d5b] ${
                        activeFilter === filter
                          ? "bg-[#006d5b] text-white"
                          : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                      key={filter}
                      onClick={() => setActiveFilter(filter)}
                      type="button"
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>
              <label className="mt-4 flex min-h-11 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 focus-within:border-[#006d5b] focus-within:ring-2 focus-within:ring-emerald-100">
                <Search className="h-4 w-4 text-slate-400" aria-hidden="true" />
                <span className="sr-only">Search championships</span>
                <input
                  className="h-11 flex-1 bg-transparent text-sm font-bold text-slate-900 outline-none placeholder:text-slate-400"
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search championship, track, location..."
                  type="search"
                  value={searchQuery}
                />
              </label>
            </div>

            <div className="grid gap-4">
              {visibleChampionships.map((championship) => {
                const canApply = championship.applicationStatus === "NOT_APPLIED";
                const isPending = championship.applicationStatus === "PENDING_REVIEW";

                return (
                  <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm" key={championship.id}>
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-md px-2.5 py-1 text-xs font-black uppercase tracking-[0.12em] ${
                              isPending
                                ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                                : "bg-emerald-50 text-[#006d5b] ring-1 ring-emerald-200"
                            }`}
                          >
                            {statusLabel(championship)}
                          </span>
                          <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                            {championship.rounds} rounds
                          </span>
                        </div>
                        <h3 className="mt-3 text-2xl font-black text-slate-950">{championship.name}</h3>
                        <p className="mt-1 text-sm font-bold text-slate-500">
                          {championship.track} - {championship.location} - {championship.season}
                        </p>
                        <p className="mt-3 text-sm font-black text-slate-700">
                          Jockey Pool: {championship.poolApproved} / {championship.poolCapacity}
                        </p>
                        {championship.applicationStatus === "NOT_APPLIED" && (
                          <p className="mt-2 text-sm font-black text-amber-700">Applications close in 14 days</p>
                        )}
                        <p className="mt-2 max-w-3xl text-sm font-bold leading-6 text-slate-500">
                          {applicationHelp(championship)}
                        </p>
                      </div>

                      <div className="shrink-0">
                        {canApply ? (
                          <button
                            aria-label={`Apply for Championship ${championship.name}`}
                            className="inline-flex min-h-11 items-center gap-2 rounded-md bg-[#006d5b] px-5 text-sm font-black text-white hover:bg-[#004d3d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006d5b]"
                            onClick={() => setApplicationTarget(championship)}
                            type="button"
                          >
                            Apply for Championship
                            <ArrowRight className="h-4 w-4" aria-hidden="true" />
                          </button>
                        ) : (
                          <span className="inline-flex min-h-11 items-center rounded-md border border-slate-200 px-4 text-sm font-black text-slate-600">
                            {isPending ? "Submitted" : statusLabel(championship)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                      {championship.requirements.map((requirement) => (
                        <div className="rounded-md border border-slate-200 bg-slate-50 p-3" key={requirement.label}>
                          <div className="flex items-center gap-2">
                            {requirement.met ? (
                              <CheckCircle2 className="h-4 w-4 text-[#006d5b]" aria-hidden="true" />
                            ) : (
                              <X className="h-4 w-4 text-red-600" aria-hidden="true" />
                            )}
                            <p className="text-sm font-black text-slate-800">{requirement.label}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {activeTab === "history" && (
          <section aria-label="Championship history" className="space-y-5">
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="grid gap-0 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="relative p-6">
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-cover bg-center opacity-[0.08]"
                    style={{ backgroundImage: `url(${racingImage})` }}
                  />
                  <div className="relative">
                    <span className="inline-flex rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-black uppercase tracking-[0.14em] text-[#006d5b]">
                      Career Summary
                    </span>
                    <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950">Professional Jockey</h2>
                    <p className="mt-3 max-w-2xl text-sm font-bold leading-6 text-slate-500">
                      A championship rider profile built around stable assignments, season results, and repeatable race-day credibility.
                    </p>
                    <div className="mt-6 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-md border border-slate-200 bg-white/85 p-3">
                        <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Currently riding</p>
                        <p className="mt-1 text-lg font-black text-slate-950">{activeChampionship.horse}</p>
                      </div>
                      <div className="rounded-md border border-slate-200 bg-white/85 p-3">
                        <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Stable</p>
                        <p className="mt-1 text-lg font-black text-slate-950">{activeChampionship.stable}</p>
                      </div>
                      <div className="rounded-md border border-slate-200 bg-white/85 p-3">
                        <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Current standing</p>
                        <p className="mt-1 text-lg font-black text-slate-950">
                          Current Standing: {activeChampionship.rank} Summer Championship
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <aside className="border-t border-slate-200 bg-[#082f2a] p-6 text-white lg:border-l lg:border-t-0">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-100">Career Story</p>
                  <p className="mt-4 text-5xl font-black leading-none">{careerRecord.officialStarts}</p>
                  <p className="mt-2 text-sm font-black text-emerald-100">Official Starts</p>
                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <div className="rounded-md bg-white/10 p-3 ring-1 ring-white/15">
                      <p className="text-2xl font-black">{careerRecord.wins}</p>
                      <p className="mt-1 text-xs font-black uppercase tracking-[0.12em] text-emerald-100">Wins</p>
                    </div>
                    <div className="rounded-md bg-white/10 p-3 ring-1 ring-white/15">
                      <p className="text-2xl font-black">{careerRecord.top3Finishes}</p>
                      <p className="mt-1 text-xs font-black uppercase tracking-[0.12em] text-emerald-100">Top 3</p>
                    </div>
                  </div>
                </aside>
              </div>
            </div>

            <section aria-label="Career Record" className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-[#006d5b]">Career Record</p>
                    <h2 className="mt-2 text-2xl font-black text-slate-950">
                      {careerRecord.championshipsJoined} Championships
                    </h2>
                    <p className="mt-1 text-sm font-bold text-slate-500">
                      {careerRecord.championshipsWon} Championship Win across official seasons.
                    </p>
                  </div>
                  <Trophy className="h-6 w-6 text-[#006d5b]" aria-hidden="true" />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  ["Best Rank", careerRecord.bestRank],
                  ["Win Rate", careerRecord.winRate],
                  ["Top 3 Rate", careerRecord.top3Rate],
                ].map(([label, value]) => (
                  <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm" key={label}>
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">{label}</p>
                    <p className="mt-2 text-3xl font-black text-slate-950">{value}</p>
                  </div>
                ))}
              </div>
            </section>

            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-slate-950">Championship History</h2>
                  <p className="mt-1 text-sm font-bold text-slate-500">
                    Career timeline by season, horse, stable, and final result.
                  </p>
                </div>
                <ShieldCheck className="h-6 w-6 text-[#006d5b]" aria-hidden="true" />
              </div>
              <ol aria-label="Career timeline" className="mt-6 space-y-5">
                {[...new Set(championshipArchive.map((item) => archiveYear(item.championship)))].map((year) => (
                  <li className="grid gap-4 md:grid-cols-[84px_1fr]" key={year}>
                    <div className="text-2xl font-black text-slate-950">{year}</div>
                    <div className="space-y-3 border-l border-slate-200 pl-4">
                      {championshipArchive
                        .filter((item) => archiveYear(item.championship) === year)
                        .map((item) => (
                          <article className="rounded-lg border border-slate-200 bg-slate-50 p-4" key={item.championship}>
                            <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <h3 className="text-lg font-black text-slate-950">{item.championship}</h3>
                                  <span
                                    className={`rounded-md border px-2 py-1 text-xs font-black uppercase tracking-[0.12em] ${rankTone(
                                      item.rank,
                                    )}`}
                                  >
                                    Rank {item.rank}
                                  </span>
                                </div>
                                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                  <div className="rounded-md bg-white p-3 ring-1 ring-slate-200">
                                    <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Horse</p>
                                    <p className="mt-1 text-base font-black text-slate-950">{item.horse}</p>
                                  </div>
                                  <div className="rounded-md bg-white p-3 ring-1 ring-slate-200">
                                    <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Stable</p>
                                    <p className="mt-1 text-base font-black text-slate-950">{item.stable}</p>
                                  </div>
                                </div>
                                <p className="mt-3 text-sm font-black text-slate-700">
                                  {item.wins} wins - {item.top3Finishes} top 3 finishes - {item.points} points
                                </p>
                              </div>
                              <button
                                aria-label={`View ${item.championship} details`}
                                className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006d5b]"
                                onClick={() => setHistoryTarget(item)}
                                type="button"
                              >
                                View details
                              </button>
                            </div>
                          </article>
                        ))}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </section>
        )}

        {historyTarget && (
          <div
            aria-label="Championship result detail"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-4 sm:items-center"
            role="dialog"
          >
            <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-lg border border-slate-200 bg-white shadow-xl">
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-[#006d5b]">Championship Result</p>
                  <h2 className="mt-2 text-2xl font-black text-slate-950">{historyTarget.championship}</h2>
                  <p className="mt-1 text-sm font-bold text-slate-500">
                    Season result for {historyTarget.horse} with {historyTarget.stable}.
                  </p>
                </div>
                <button
                  aria-label="Close championship result detail"
                  className="grid h-10 w-10 place-items-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006d5b]"
                  onClick={() => setHistoryTarget(null)}
                  type="button"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              <div className="space-y-5 p-5">
                <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    ["Final Rank", historyTarget.rank],
                    ["Points", historyTarget.points],
                    ["Rounds", historyTarget.rounds],
                    ["Top 3", historyTarget.top3Finishes],
                  ].map(([label, value]) => (
                    <div className="rounded-md border border-slate-200 bg-slate-50 p-3" key={label}>
                      <dt className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">{label}</dt>
                      <dd className="mt-1 text-lg font-black text-slate-950">{value}</dd>
                    </div>
                  ))}
                </dl>
                <section aria-labelledby="race-breakdown-title" className="rounded-lg border border-slate-200 p-4">
                  <h3 id="race-breakdown-title" className="text-lg font-black text-slate-950">
                    Race Breakdown
                  </h3>
                  <ol className="mt-4 grid gap-2 sm:grid-cols-2">
                    {Array.from({ length: historyTarget.rounds }).map((_, index) => {
                      const roundNumber = index + 1;
                      const isWin = roundNumber <= historyTarget.wins;
                      const isTop3 = roundNumber <= historyTarget.top3Finishes;

                      return (
                        <li
                          className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-black text-slate-700"
                          key={roundNumber}
                        >
                          Round {roundNumber} - {isWin ? "Win" : isTop3 ? "Top 3" : "Finished"}
                        </li>
                      );
                    })}
                  </ol>
                </section>
              </div>
            </div>
          </div>
        )}

        {applicationTarget && (
          <div
            aria-label="Championship application"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-4 sm:items-center"
            role="dialog"
          >
            <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-lg border border-slate-200 bg-white shadow-xl">
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-[#006d5b]">Championship Application</p>
                  <h2 className="mt-2 text-2xl font-black text-slate-950">{applicationTarget.name}</h2>
                  <p className="mt-1 text-sm font-bold text-slate-500">
                    Submit your application for admin review before joining the available jockey pool.
                  </p>
                </div>
                <button
                  aria-label="Close championship application"
                  className="grid h-10 w-10 place-items-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006d5b]"
                  onClick={() => setApplicationTarget(null)}
                  type="button"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              <div className="space-y-5 p-5">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Season</p>
                    <p className="mt-1 text-sm font-black text-slate-950">{applicationTarget.season}</p>
                  </div>
                  <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Rounds</p>
                    <p className="mt-1 text-sm font-black text-slate-950">{applicationTarget.rounds}</p>
                  </div>
                  <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Deadline</p>
                    <p className="mt-1 text-sm font-black text-slate-950">{applicationTarget.enrollmentDeadline}</p>
                  </div>
                </div>

                <section aria-labelledby="eligibility-title" className="rounded-lg border border-slate-200 p-4">
                  <h3 id="eligibility-title" className="text-lg font-black text-slate-950">
                    Eligibility Checklist
                  </h3>
                  <div className="mt-4 grid gap-3">
                    {applicationTarget.requirements.map((requirement) => (
                      <div className="flex items-center gap-3" key={requirement.label}>
                        <CheckCircle2 className="h-5 w-5 text-[#006d5b]" aria-hidden="true" />
                        <p className="text-sm font-black text-slate-800">{requirement.label}</p>
                      </div>
                    ))}
                  </div>
                </section>

                <label className="block">
                  <span className="text-sm font-black text-slate-800">Application note</span>
                  <textarea
                    className="mt-2 min-h-28 w-full rounded-md border border-slate-200 px-3 py-2 text-sm font-bold text-slate-900 outline-none focus:border-[#006d5b] focus:ring-2 focus:ring-emerald-100"
                    placeholder="Add availability notes or racing context for admin review."
                  />
                </label>
              </div>
              <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 p-5">
                <button
                  className="inline-flex min-h-11 items-center rounded-md border border-slate-200 px-4 text-sm font-black text-slate-700 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006d5b]"
                  onClick={() => setApplicationTarget(null)}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="inline-flex min-h-11 items-center gap-2 rounded-md bg-[#006d5b] px-5 text-sm font-black text-white hover:bg-[#004d3d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006d5b]"
                  onClick={submitApplication}
                  type="button"
                >
                  Submit Application
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </JockeyLayout>
  );
}
