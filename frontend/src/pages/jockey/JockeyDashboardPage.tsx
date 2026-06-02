import { useMemo, useState } from "react";
import { ArrowRight, CalendarDays, FileCheck2, Flag, Medal, Timer, Trophy } from "lucide-react";

import racingImage from "../../assets/slide.jpg";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { JockeyLayout } from "../../layouts/JockeyLayout";
import { ChampionshipTimeline } from "./components/ChampionshipTimeline";
import { RaceDetailDrawer } from "./components/RaceDetailDrawer";
import {
  careerRecord,
  getNextRound,
  getRoundsForChampionship,
  jockeyChampionships,
  jockeyContracts,
  type JockeyRound,
} from "./jockeyWorkspaceData";

export function JockeyDashboardPage() {
  useDocumentTitle("Jockey dashboard");

  const [championshipId, setChampionshipId] = useState(jockeyChampionships[0]?.id ?? "");
  const [selectedRound, setSelectedRound] = useState<JockeyRound | null>(null);

  const championship = jockeyChampionships.find((item) => item.id === championshipId) ?? jockeyChampionships[0];
  const rounds = useMemo(() => getRoundsForChampionship(championship.id), [championship.id]);
  const nextRound = getNextRound(championship.id);
  const pendingContracts = jockeyContracts.filter((contract) => contract.status === "PENDING");
  const leaderGap = Math.abs(Number.parseInt(championship.gapToLeader, 10)) || 0;
  const leaderPoints = championship.points + leaderGap;
  const leaderScorePercent = leaderPoints > 0 ? Math.round((championship.points / leaderPoints) * 100) : 0;
  const currentRoundNumber = nextRound?.roundNumber ?? rounds.filter((round) => round.status === "FINISHED").length;
  const seasonProgressPercent = Math.round((currentRoundNumber / championship.rounds) * 100);

  return (
    <JockeyLayout>
      <section aria-labelledby="jockey-dashboard-title" className="space-y-6">
        <div
          className="relative overflow-hidden rounded-lg border border-emerald-900/20 bg-[#002d25] p-5 text-white shadow-sm sm:p-6"
          style={{ backgroundImage: `url(${racingImage})`, backgroundPosition: "center", backgroundSize: "cover" }}
        >
          <div className="absolute inset-0 bg-[#002d25]/88" />
          <div className="absolute inset-x-8 top-8 h-28 rounded-[50%] border border-white/10 opacity-40" />
          <div className="relative grid gap-6 xl:grid-cols-[1fr_330px]">
            <div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-100">Current Championship</p>
                <label className="w-full max-w-xs text-sm font-black text-emerald-50 sm:w-auto">
                  <span className="sr-only">Select championship</span>
                  <select
                    aria-label="Select championship"
                    className="min-h-11 w-full rounded-md border border-white/20 bg-white/10 px-3 text-sm font-black text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-100"
                    onChange={(event) => setChampionshipId(event.target.value)}
                    value={championship.id}
                  >
                    {jockeyChampionships.map((item) => (
                      <option className="text-slate-950" key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <h1 id="jockey-dashboard-title" className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">
                Current Championship
              </h1>
              <p className="mt-3 text-2xl font-black tracking-tight text-emerald-50">
                {championship.name}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-md bg-white/10 px-3 py-2 text-sm font-black text-emerald-50 ring-1 ring-white/15">
                  {championship.horse} / {championship.stable}
                </span>
                <span className="rounded-md bg-white/10 px-3 py-2 text-sm font-black text-emerald-50 ring-1 ring-white/15">
                  Round {currentRoundNumber} of {championship.rounds}
                </span>
                <span className="rounded-md bg-white/10 px-3 py-2 text-sm font-black text-emerald-50 ring-1 ring-white/15">
                  Current Standing {championship.rank}
                </span>
                {nextRound && (
                  <span className="rounded-md bg-white/10 px-3 py-2 text-sm font-black text-emerald-50 ring-1 ring-white/15">
                    Jun 6 - {nextRound.track}
                  </span>
                )}
              </div>
              <p className="mt-3 max-w-3xl text-base font-bold leading-7 text-emerald-50/85">
                {championship.horse} with {championship.stable}. Season position, points, and race-day readiness in one cockpit.
              </p>
              <div className="mt-6 max-w-xl rounded-lg border border-white/15 bg-white/10 p-4">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-100">Season Progress</p>
                  <p className="text-sm font-black text-white">{seasonProgressPercent}%</p>
                </div>
                <div className="mt-3 h-2 rounded-full bg-white/15">
                  <div className="h-2 rounded-full bg-emerald-200" style={{ width: `${seasonProgressPercent}%` }} />
                </div>
                <p className="mt-3 text-sm font-bold text-emerald-50/85">
                  {currentRoundNumber} / {championship.rounds} rounds completed
                </p>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  className="inline-flex min-h-11 items-center gap-2 rounded-md bg-white px-5 text-sm font-black text-[#004d3d] hover:bg-emerald-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-100"
                  href="/jockey/schedule"
                >
                  View Schedule
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </a>
                <a
                  className="inline-flex min-h-11 items-center gap-2 rounded-md border border-white/25 px-5 text-sm font-black text-white hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-100"
                  href="/jockey/contracts"
                >
                  Review Contracts
                </a>
              </div>
            </div>

            <aside aria-label="Current standing" className="rounded-lg border border-white/15 bg-white/10 p-5">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-100">Podium Position</p>
              <div className="mt-5">
                <p className="text-7xl font-black leading-none tracking-tight">{championship.rank}</p>
                <p className="mt-3 text-sm font-black uppercase tracking-[0.16em] text-emerald-100">Rank {championship.rank}</p>
              </div>
              <div className="mt-6 rounded-md border border-white/10 bg-white/10 p-3">
                <p className="text-sm font-bold text-emerald-100/80">Points</p>
                <p className="mt-1 text-3xl font-black">{championship.points}</p>
              </div>
              <div className="mt-5 space-y-2 text-sm font-black text-emerald-50">
                <p>Leader: {leaderPoints} pts</p>
                <p>You: {championship.points} pts</p>
              </div>
              <div className="mt-3 h-2 rounded-full bg-white/15" aria-hidden="true">
                <div className="h-2 rounded-full bg-emerald-200" style={{ width: `${leaderScorePercent}%` }} />
              </div>
              <p className="mt-3 text-sm font-black text-emerald-50">{leaderScorePercent}% of leader score</p>
              <p className="mt-4 text-sm font-bold text-emerald-50/80">
                {leaderGap} pts behind the leader
              </p>
            </aside>
          </div>
        </div>

        {nextRound && (
          <section
            aria-label="Next Race"
            className="grid gap-4 overflow-hidden rounded-lg border border-amber-200 bg-white shadow-sm xl:grid-cols-[1fr_280px]"
          >
            <div className="relative p-5 sm:p-6">
              {/* <div className="absolute right-6 top-5 hidden h-20 w-40 rounded-[50%] border border-amber-200/70 opacity-60 md:block" /> */}
              <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">Next Race</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">{nextRound.raceName}</h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 p-3">
                  <CalendarDays className="h-5 w-5 text-amber-700" aria-hidden="true" />
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Race Day</p>
                    <p className="text-sm font-black text-slate-950">{nextRound.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 p-3">
                  <Timer className="h-5 w-5 text-amber-700" aria-hidden="true" />
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Start</p>
                    <p className="text-sm font-black text-slate-950">{nextRound.time}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 p-3">
                  <Trophy className="h-5 w-5 text-amber-700" aria-hidden="true" />
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Horse</p>
                    <p className="text-sm font-black text-slate-950">{nextRound.horse}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col justify-between bg-amber-50 p-5 sm:p-6">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">Race Day Brief</p>
                <p className="mt-3 text-sm font-bold leading-6 text-slate-700">{nextRound.note}</p>
              </div>
              <button
                className="mt-5 inline-flex min-h-11 items-center justify-center rounded-md bg-amber-700 px-5 text-sm font-black text-white hover:bg-amber-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700"
                onClick={() => setSelectedRound(nextRound)}
                type="button"
              >
                Open Race Detail
              </button>
            </div>
          </section>
        )}

        <section aria-labelledby="championship-progress-title" className="space-y-3">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 id="championship-progress-title" className="text-2xl font-black tracking-tight text-slate-950">
                Championship Progress
              </h2>
              <p className="mt-1 text-sm font-bold text-slate-500">Rounds, points, and upcoming race day context.</p>
            </div>
          </div>
          <ChampionshipTimeline label="Dashboard championship timeline" onSelectRound={setSelectedRound} rounds={rounds} />
        </section>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" aria-label="Jockey dashboard summary">
          {[
            { label: "Pending Contracts", value: pendingContracts.length, icon: FileCheck2 },
            { label: "Active Championships", value: jockeyChampionships.filter((item) => item.commitmentStatus !== "Completed").length, icon: Trophy },
            { label: "Upcoming Rounds", value: rounds.filter((round) => round.status === "NEXT" || round.status === "UPCOMING").length, icon: Flag },
            { label: "Top 3 Rate", value: careerRecord.top3Rate, icon: Medal },
          ].map((item) => (
            <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm" key={item.label}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">{item.label}</p>
                  <p className="mt-3 text-3xl font-black text-slate-950">{item.value}</p>
                </div>
                <span className="rounded-md border border-[#006d5b]/20 bg-emerald-50 p-2 text-[#006d5b]">
                  <item.icon className="h-5 w-5" aria-hidden="true" />
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <RaceDetailDrawer onClose={() => setSelectedRound(null)} round={selectedRound} totalRounds={championship.rounds} />
    </JockeyLayout>
  );
}
