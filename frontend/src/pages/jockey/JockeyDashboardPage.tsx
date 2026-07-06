import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  CheckCircle,
  Clock3,
  FileCheck2,
  Loader2,
  ShieldCheck,
  Trophy,
} from "lucide-react";

import {
  getJockeyChampionships,
  getJockeyContracts,
  getJockeyParticipants,
  getJockeyPoolApplications,
  getJockeySchedule,
} from "../../api/racingApi";
import racingImage from "../../assets/slide.jpg";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { JockeyLayout } from "../../layouts/JockeyLayout";
import type {
  JockeyChampionship,
  JockeyInvitation,
  JockeyPoolApplication,
  JockeyScheduleItem,
  TournamentParticipant,
} from "../../types/racing";
import { getApiErrorMessage } from "../../utils/apiError";

type DashboardState =
  | {
      kind: "official";
      participant: TournamentParticipant;
    }
  | {
      kind: "committed";
      contract: JockeyInvitation;
    }
  | {
      kind: "pending-contract";
      contract: JockeyInvitation;
    }
  | {
      kind: "approved-pool";
      championship: JockeyChampionship;
    }
  | {
      kind: "pending-application";
      championship: JockeyChampionship;
    }
  | {
      kind: "empty";
    };

const visibleDate = new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" });
const visibleTime = new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" });

function pickDashboardState(
  participants: TournamentParticipant[],
  contracts: JockeyInvitation[],
  championships: JockeyChampionship[],
): DashboardState {
  const official = participants.find((participant) => participant.status === "ACTIVE") ?? participants[0];
  if (official) return { kind: "official", participant: official };

  const acceptedContract = contracts.find((contract) => contract.status === "ACCEPTED");
  if (acceptedContract) return { kind: "committed", contract: acceptedContract };

  const pendingContract = contracts.find((contract) => contract.status === "PENDING");
  if (pendingContract) return { kind: "pending-contract", contract: pendingContract };

  const approvedPool = championships.find((championship) => championship.applicationStatus === "APPROVED_FOR_POOL");
  if (approvedPool) return { kind: "approved-pool", championship: approvedPool };

  const pendingApplication = championships.find((championship) => championship.applicationStatus === "PENDING");
  if (pendingApplication) return { kind: "pending-application", championship: pendingApplication };

  return { kind: "empty" };
}

function stateCopy(state: DashboardState, nextRace: JockeyScheduleItem | null) {
  switch (state.kind) {
    case "official":
      if (nextRace) {
        return {
          eyebrow: "Next Race",
          title: nextRace.raceName,
          subtitle: `${visibleDate.format(new Date(nextRace.raceAt))} at ${visibleTime.format(new Date(nextRace.raceAt))}`,
          description: `${nextRace.horseName} is assigned for ${nextRace.championshipName}. Open the schedule for the full race card and race-day details.`,
          badge: "Official Schedule",
          ctaLabel: "View Schedule",
          ctaHref: "/jockey/schedule",
        };
      }
      return {
        eyebrow: "Official Championship Assignment",
        title: state.participant.championshipName,
        subtitle: `${state.participant.horseName} with ${state.participant.ownerName}`,
        description:
          "Your Horse + Jockey pair is locked. Waiting for admin to publish the official race schedule.",
        badge: "Official Participant",
        ctaLabel: "Open Schedule",
        ctaHref: "/jockey/schedule",
      };
    case "committed":
      return {
        eyebrow: "Committed Assignment",
        title: state.contract.championshipName,
        subtitle: `${state.contract.horseName} with ${state.contract.ownerName}`,
        description:
          "You accepted the assignment contract. Admin still needs to lock participants before this becomes an official racing entry.",
        badge: "Pending Admin Lock",
        ctaLabel: "View Contract",
        ctaHref: "/jockey/contracts",
      };
    case "pending-contract":
      return {
        eyebrow: "Contract Review Needed",
        title: state.contract.championshipName,
        subtitle: `${state.contract.horseName} from ${state.contract.ownerName}`,
        description:
          "A stable owner sent you a championship assignment contract. Review the agreement before accepting or rejecting it.",
        badge: "Pending Review",
        ctaLabel: "Review Contract",
        ctaHref: "/jockey/contracts",
      };
    case "approved-pool":
      return {
        eyebrow: "Approved For Pool",
        title: state.championship.name,
        subtitle: state.championship.location || "Championship pool",
        description:
          "You are visible to owners in this championship pool. A committed assignment appears after an owner sends a contract and you accept it.",
        badge: "Visible to Owners",
        ctaLabel: "Browse Championships",
        ctaHref: "/jockey/championships",
      };
    case "pending-application":
      return {
        eyebrow: "Application Under Review",
        title: state.championship.name,
        subtitle: state.championship.location || "Championship pool",
        description:
          "Your jockey pool application is waiting for admin review. Owner contracts unlock only after approval.",
        badge: "Pending Review",
        ctaLabel: "Track Application",
        ctaHref: "/jockey/championships",
      };
    default:
      return {
        eyebrow: "No Active Championship",
        title: "No active assignment yet",
        subtitle: "Apply to a championship pool",
        description:
          "Join an open championship pool to become visible to stable owners and receive assignment contracts.",
        badge: "Not Applied",
        ctaLabel: "Browse Championships",
        ctaHref: "/jockey/championships",
      };
  }
}

export function JockeyDashboardPage() {
  useDocumentTitle("Jockey dashboard");

  const [championships, setChampionships] = useState<JockeyChampionship[]>([]);
  const [applications, setApplications] = useState<JockeyPoolApplication[]>([]);
  const [contracts, setContracts] = useState<JockeyInvitation[]>([]);
  const [participants, setParticipants] = useState<TournamentParticipant[]>([]);
  const [schedule, setSchedule] = useState<JockeyScheduleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadDashboard() {
      setIsLoading(true);
      setError("");
      try {
        const [championshipData, applicationData, contractData, participantData, scheduleData] = await Promise.all([
          getJockeyChampionships(),
          getJockeyPoolApplications(),
          getJockeyContracts(),
          getJockeyParticipants(),
          getJockeySchedule(),
        ]);
        if (!ignore) {
          setChampionships(championshipData);
          setApplications(applicationData);
          setContracts(contractData);
          setParticipants(participantData);
          setSchedule(scheduleData);
        }
      } catch (err) {
        if (!ignore) {
          setError(getApiErrorMessage(err, "Could not load jockey dashboard."));
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      ignore = true;
    };
  }, []);

  const dashboardState = useMemo(
    () => pickDashboardState(participants, contracts, championships),
    [championships, contracts, participants],
  );
  const nextRace =
    schedule.find((item) => !["FINISHED", "PUBLISHED", "CANCELLED"].includes(item.raceStatus)) ?? null;
  const upcomingRaces = schedule.filter((item) => !["FINISHED", "PUBLISHED", "CANCELLED"].includes(item.raceStatus)).length;
  const copy = stateCopy(dashboardState, nextRace);
  const pendingContracts = contracts.filter((contract) => contract.status === "PENDING").length;
  const approvedApplications = applications.filter((application) => application.status === "APPROVED_FOR_POOL").length;
  const pendingApplications = applications.filter((application) => application.status === "PENDING").length;

  return (
    <JockeyLayout
      sidebarPanel={
        dashboardState.kind === "official" ? (
          <OfficialSidebarPanel
            participant={dashboardState.participant}
            nextRace={nextRace}
            upcomingRaces={upcomingRaces}
            pendingContracts={pendingContracts}
          />
        ) : undefined
      }
    >
      <section aria-labelledby="jockey-dashboard-title" className="space-y-6">
        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700" role="alert">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {isLoading ? (
          <div className="grid gap-6">
            <div className="h-80 animate-pulse rounded-2xl border border-slate-200 bg-white" />
            <div className="grid gap-4 md:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <div className="h-28 animate-pulse rounded-xl border border-slate-200 bg-white" key={item} />
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Header Banner - Standardized to Jockey Theme */}
            <div
              className="relative overflow-hidden rounded-2xl border border-[#002d25]/10 bg-gradient-to-br from-[#002d25] via-[#003d32] to-[#014d3e] p-6 text-white shadow-md sm:p-8"
              style={{ backgroundImage: `url(${racingImage})`, backgroundPosition: "center", backgroundSize: "cover" }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#002d25]/95 via-[#003d32]/92 to-[#014d3e]/90" />
              
              {/* Soft visual glow accents */}
              <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />
              <div className="absolute -left-20 -bottom-20 h-72 w-72 rounded-full bg-teal-400/10 blur-3xl" />
              
              <div className="relative grid gap-8 xl:grid-cols-[1fr_360px]">
                <div className="flex flex-col justify-between">
                  <div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/20 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-emerald-300">
                      {copy.eyebrow}
                    </span>
                    
                    <h1 id="jockey-dashboard-title" className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl leading-tight">
                      {copy.title}
                    </h1>
                    
                    <p className="mt-2.5 text-lg font-bold text-emerald-100/90">{copy.subtitle}</p>
                    
                    <p className="mt-4 max-w-2xl text-sm font-semibold leading-relaxed text-emerald-50/75">
                      {copy.description}
                    </p>
                  </div>

                  <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-lg bg-white/10 border border-white/15 px-3 py-1.5 text-xs font-black text-emerald-50 tracking-wide">
                        {copy.badge}
                      </span>
                      {dashboardState.kind === "official" && (
                        <span className="rounded-lg bg-white/10 border border-white/15 px-3 py-1.5 text-xs font-black text-emerald-50 tracking-wide">
                          Current Points: {dashboardState.participant.points}
                        </span>
                      )}
                      {dashboardState.kind === "committed" && dashboardState.contract.acceptedAt && (
                        <span className="rounded-lg bg-white/10 border border-white/15 px-3 py-1.5 text-xs font-black text-emerald-50 tracking-wide">
                          Accepted contract
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 sm:ml-auto">
                      <a
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-6 text-sm font-black text-[#004d3d] hover:bg-emerald-50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                        href={copy.ctaHref}
                      >
                        {copy.ctaLabel}
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </a>
                      <a
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 text-sm font-black text-white hover:bg-white/10 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                        href="/jockey/contracts"
                      >
                        Contract Inbox
                      </a>
                    </div>
                  </div>
                </div>

                {/* Race Focus section styled as an authentic ticket card */}
                <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm flex flex-col justify-between">
                  <div className="absolute top-0 right-0 p-2 text-white/5">
                    <Trophy className="h-32 w-32 -mr-8 -mt-8 rotate-12" />
                  </div>
                  
                  <div className="relative">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <span className="text-xs font-black uppercase tracking-[0.16em] text-emerald-200">Race Focus</span>
                      {nextRace && (
                        <span className="inline-flex items-center rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300 ring-1 ring-emerald-500/30">
                          {nextRace.raceStatus.replaceAll("_", " ")}
                        </span>
                      )}
                    </div>
                    
                    {nextRace ? (
                      <div className="mt-4 space-y-4">
                        <div>
                          <h3 className="text-2xl font-black text-white tracking-tight leading-tight">{nextRace.raceName}</h3>
                          <p className="mt-1.5 text-xs font-bold text-emerald-200/70">
                            {visibleDate.format(new Date(nextRace.raceAt))} • {visibleTime.format(new Date(nextRace.raceAt))}
                          </p>
                        </div>
                        
                        <div className="space-y-2.5 border-t border-dashed border-white/15 pt-4">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-emerald-100/60 font-semibold">Horse</span>
                            <span className="font-black text-white">{nextRace.horseName}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-emerald-100/60 font-semibold">Distance</span>
                            <span className="font-black text-white">{nextRace.distanceMeters}m</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-emerald-100/60 font-semibold">Championship</span>
                            <span className="font-black text-white truncate max-w-[170px]">{nextRace.championshipName}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-6 flex flex-col items-center justify-center text-center py-6">
                        <div className="rounded-full bg-white/5 p-3.5 text-emerald-300/80 mb-3">
                          <CalendarDays className="h-6 w-6" aria-hidden="true" />
                        </div>
                        <p className="text-base font-black text-white">Schedule Not Published</p>
                        <p className="mt-2 text-xs leading-relaxed text-emerald-50/60 max-w-[240px]">
                          Your assignment is official. Race cards will appear here once the administrator publishes the schedule.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" aria-label="Jockey dashboard summary">
              <SummaryCard icon={Trophy} label="Upcoming Races" value={upcomingRaces} />
              <SummaryCard icon={ShieldCheck} label="Official Assignments" value={participants.length} />
              <SummaryCard icon={FileCheck2} label="Pending Contracts" value={pendingContracts} />
              <SummaryCard icon={Clock3} label="Championships" value={approvedApplications + pendingApplications + participants.length} />
            </div>

            {/* Action & Readiness blocks */}
            <section className="grid gap-5 xl:grid-cols-[1fr_360px]" aria-label="Operational follow-up">
              <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-[#006d5b]">Race Readiness</p>
                  <h2 className="mt-3 text-2xl font-black text-slate-900">
                    {nextRace ? "Next race is ready to review" : "Waiting for official schedule"}
                  </h2>
                  <p className="mt-2.5 text-sm font-semibold leading-relaxed text-slate-500">
                    {nextRace
                      ? `${nextRace.raceName} is now on your official calendar. Review time, distance, horse, and race-day status before the event.`
                      : dashboardState.kind === "official"
                        ? "Your assignment is official. The dashboard will switch to race-day details after admin publishes the schedule."
                        : "Your next operational item appears here after a contract, participant lock, or published schedule exists."}
                  </p>
                </div>
                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <InfoBlock label="Assignment" value={dashboardState.kind === "official" ? "Official" : copy.badge} />
                  <InfoBlock label="Schedule" value={nextRace ? "Published" : "Waiting"} />
                  <InfoBlock label="Upcoming" value={`${upcomingRaces} races`} />
                </div>
              </article>

              <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-[#006d5b]">Needs Attention</p>
                  {pendingContracts > 0 ? (
                    <div className="mt-3">
                      <h2 className="text-3xl font-black text-slate-900">{pendingContracts} {pendingContracts === 1 ? "contract" : "contracts"}</h2>
                      <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-500">
                        Review pending assignment contracts before the owner can move toward participant formation.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-3 flex flex-col items-center justify-center text-center py-6">
                      <div className="rounded-full bg-emerald-50 border border-emerald-100 p-3 text-[#006d5b] mb-3">
                        <CheckCircle className="h-6 w-6" aria-hidden="true" />
                      </div>
                      <h2 className="text-lg font-black text-slate-900">Inbox is Clear</h2>
                      <p className="mt-2.5 text-xs font-bold leading-relaxed text-slate-400 max-w-[200px]">
                        Your dashboard will surface owner contracts here as soon as they arrive.
                      </p>
                    </div>
                  )}
                </div>
                
                {pendingContracts > 0 && (
                  <div className="mt-6">
                    <a
                      className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#006d5b] px-5 text-sm font-black text-white hover:bg-[#005244] shadow-sm shadow-[#006d5b]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006d5b] transition-colors"
                      href="/jockey/contracts"
                    >
                      Review Inbox
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </a>
                  </div>
                )}
              </article>
            </section>
          </>
        )}
      </section>
    </JockeyLayout>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Trophy;
  label: string;
  value: number;
}) {
  return (
    <article className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:border-emerald-600/30 hover:shadow-md hover:shadow-emerald-950/[0.02]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 group-hover:text-emerald-700/80 transition-colors">{label}</p>
          <p className="mt-2 text-3xl font-black text-slate-900 tracking-tight">{value}</p>
        </div>
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50/50 border border-emerald-100/50 text-[#006d5b] group-hover:scale-110 transition-transform duration-300">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>
    </article>
  );
}

function MiniFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/10 p-3">
      <p className="text-[11px] font-black uppercase tracking-[0.12em] text-emerald-100/75">{label}</p>
      <p className="mt-1 text-sm font-black text-white">{value}</p>
    </div>
  );
}

function OfficialSidebarPanel({
  participant,
  nextRace,
  upcomingRaces,
  pendingContracts,
}: {
  participant: TournamentParticipant;
  nextRace: JockeyScheduleItem | null;
  upcomingRaces: number;
  pendingContracts: number;
}) {
  return (
    <section className="mt-8 hidden rounded-xl border border-white/10 bg-white/5 p-4 lg:block" aria-label="Current assignment">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-100">Current Assignment</p>
        <Trophy className="h-4 w-4 text-emerald-100" aria-hidden="true" />
      </div>
      <div className="mt-4 rounded-lg border border-white/10 bg-white/10 p-3">
        <p className="text-lg font-black text-white">{participant.horseName}</p>
        <p className="mt-1 text-sm font-semibold text-emerald-100">{participant.championshipName}</p>
        <p className="mt-1 text-xs font-semibold text-emerald-100/75">{participant.ownerName}</p>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <SidebarStat label="Upcoming" value={upcomingRaces} />
        <SidebarStat label="Points" value={participant.points} />
        <SidebarStat label="Contracts" value={pendingContracts} />
        <SidebarStat label="Status" value="Active" />
      </div>
      <div className="mt-4 rounded-lg border border-white/10 bg-white/5 p-3">
        <p className="text-[11px] font-black uppercase tracking-[0.12em] text-emerald-100/75">Next Race</p>
        <p className="mt-1 text-sm font-black text-white">{nextRace?.raceName ?? "Waiting for schedule"}</p>
        <p className="mt-1 text-xs font-semibold text-emerald-100/75">
          {nextRace ? visibleDate.format(new Date(nextRace.raceAt)) : "Admin has not published the schedule yet"}
        </p>
      </div>
    </section>
  );
}

function SidebarStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/10 p-3">
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-emerald-100/70">{label}</p>
      <p className="mt-1 text-lg font-black text-white">{value}</p>
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 transition-colors hover:bg-slate-50">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1.5 text-sm font-extrabold text-slate-800">{value}</p>
    </div>
  );
}
