import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
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
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700" role="alert">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="grid gap-5">
            <div className="h-80 animate-pulse rounded-lg border border-slate-200 bg-white" />
            <div className="grid gap-4 md:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <div className="h-28 animate-pulse rounded-lg border border-slate-200 bg-white" key={item} />
              ))}
            </div>
          </div>
        ) : (
          <>
            <div
              className="relative overflow-hidden rounded-lg border border-emerald-900/20 bg-[#072f29] p-5 text-white shadow-sm sm:p-6"
              style={{ backgroundImage: `url(${racingImage})`, backgroundPosition: "center", backgroundSize: "cover" }}
            >
              <div className="absolute inset-0 bg-[#072f29]/90" />
              <div className="absolute inset-x-10 top-8 h-28 rounded-[50%] border border-white/10 opacity-40" />
              <div className="relative grid gap-6 xl:grid-cols-[1fr_330px]">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-100">{copy.eyebrow}</p>
                  <h1 id="jockey-dashboard-title" className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
                    {copy.title}
                  </h1>
                  <p className="mt-3 text-xl font-black tracking-tight text-emerald-50">{copy.subtitle}</p>
                  <p className="mt-4 max-w-3xl text-base font-bold leading-7 text-emerald-50/85">
                    {copy.description}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <span className="rounded-md bg-white/10 px-3 py-2 text-sm font-black text-emerald-50 ring-1 ring-white/15">
                      {copy.badge}
                    </span>
                    {dashboardState.kind === "official" && (
                      <span className="rounded-md bg-white/10 px-3 py-2 text-sm font-black text-emerald-50 ring-1 ring-white/15">
                        Current Points: {dashboardState.participant.points}
                      </span>
                    )}
                    {dashboardState.kind === "committed" && dashboardState.contract.acceptedAt && (
                      <span className="rounded-md bg-white/10 px-3 py-2 text-sm font-black text-emerald-50 ring-1 ring-white/15">
                        Accepted contract
                      </span>
                    )}
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <a
                      className="inline-flex min-h-11 items-center gap-2 rounded-md bg-white px-5 text-sm font-black text-[#004d3d] hover:bg-emerald-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-100"
                      href={copy.ctaHref}
                    >
                      {copy.ctaLabel}
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </a>
                    <a
                      className="inline-flex min-h-11 items-center gap-2 rounded-md border border-white/25 px-5 text-sm font-black text-white hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-100"
                      href="/jockey/contracts"
                    >
                      Contract Inbox
                    </a>
                  </div>
                </div>

                <aside aria-label="Race focus" className="rounded-lg border border-white/15 bg-white/10 p-5">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-100">Race Focus</p>
                  {nextRace ? (
                    <div className="mt-5 space-y-4">
                      <div>
                        <p className="text-2xl font-black text-white">{nextRace.raceName}</p>
                        <p className="mt-1 text-sm font-bold text-emerald-50/80">
                          {visibleDate.format(new Date(nextRace.raceAt))} - {visibleTime.format(new Date(nextRace.raceAt))}
                        </p>
                      </div>
                      <div className="grid gap-2">
                        <MiniFact label="Horse" value={nextRace.horseName} />
                        <MiniFact label="Distance" value={`${nextRace.distanceMeters}m`} />
                        <MiniFact label="Status" value={nextRace.raceStatus.replaceAll("_", " ")} />
                      </div>
                    </div>
                  ) : (
                    <div className="mt-5 rounded-md border border-white/15 bg-white/10 p-4">
                      <p className="text-xl font-black text-white">Schedule not published</p>
                      <p className="mt-2 text-sm font-bold leading-6 text-emerald-50/80">
                        Your assignment is official. Race dates appear here after admin publishes the schedule.
                      </p>
                    </div>
                  )}
                </aside>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" aria-label="Jockey dashboard summary">
              <SummaryCard icon={Trophy} label="Upcoming Races" value={upcomingRaces} />
              <SummaryCard icon={ShieldCheck} label="Official Assignments" value={participants.length} />
              <SummaryCard icon={FileCheck2} label="Pending Contracts" value={pendingContracts} />
              <SummaryCard icon={Clock3} label="Championships" value={approvedApplications + pendingApplications + participants.length} />
            </div>

            <section className="grid gap-5 xl:grid-cols-[1fr_360px]" aria-label="Operational follow-up">
              <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-[#006d5b]">Race Readiness</p>
                <h2 className="mt-2 text-2xl font-black text-slate-950">
                  {nextRace ? "Next race is ready to review" : "Waiting for official schedule"}
                </h2>
                <p className="mt-3 text-sm font-bold leading-6 text-slate-600">
                  {nextRace
                    ? `${nextRace.raceName} is now on your official calendar. Review time, distance, horse, and race-day status before the event.`
                    : dashboardState.kind === "official"
                      ? "Your assignment is official. The dashboard will switch to race-day details after admin publishes the schedule."
                      : "Your next operational item appears here after a contract, participant lock, or published schedule exists."}
                </p>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <InfoBlock label="Assignment" value={dashboardState.kind === "official" ? "Official" : copy.badge} />
                  <InfoBlock label="Schedule" value={nextRace ? "Published" : "Waiting"} />
                  <InfoBlock label="Upcoming" value={`${upcomingRaces} races`} />
                </div>
              </article>

              <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-[#006d5b]">Needs Attention</p>
                {pendingContracts > 0 ? (
                  <>
                    <h2 className="mt-2 text-3xl font-black text-slate-950">{pendingContracts} contract</h2>
                    <p className="mt-2 text-sm font-bold leading-6 text-slate-600">
                      Review pending assignment contracts before the owner can move toward participant formation.
                    </p>
                    <a
                      className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-md bg-[#006d5b] px-5 text-sm font-black text-white hover:bg-[#004d3d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006d5b]"
                      href="/jockey/contracts"
                    >
                      Review Inbox
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </a>
                  </>
                ) : (
                  <>
                    <h2 className="mt-2 text-2xl font-black text-slate-950">No contract waiting</h2>
                    <p className="mt-2 text-sm font-bold leading-6 text-slate-600">
                      Your dashboard will surface owner contracts here as soon as they arrive.
                    </p>
                  </>
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
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-black text-slate-950">{value}</p>
        </div>
        <span className="rounded-md border border-[#006d5b]/20 bg-emerald-50 p-2 text-[#006d5b]">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>
    </article>
  );
}

function MiniFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/10 p-3">
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
    <section className="mt-8 hidden rounded-lg border border-white/10 bg-white/5 p-4 lg:block" aria-label="Current assignment">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-100">Current Assignment</p>
        <Trophy className="h-4 w-4 text-emerald-100" aria-hidden="true" />
      </div>
      <div className="mt-4 rounded-md border border-white/10 bg-white/10 p-3">
        <p className="text-lg font-black text-white">{participant.horseName}</p>
        <p className="mt-1 text-sm font-bold text-emerald-100">{participant.championshipName}</p>
        <p className="mt-1 text-xs font-bold text-emerald-100/75">{participant.ownerName}</p>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <SidebarStat label="Upcoming" value={upcomingRaces} />
        <SidebarStat label="Points" value={participant.points} />
        <SidebarStat label="Contracts" value={pendingContracts} />
        <SidebarStat label="Status" value="Active" />
      </div>
      <div className="mt-4 rounded-md border border-white/10 bg-white/5 p-3">
        <p className="text-[11px] font-black uppercase tracking-[0.12em] text-emerald-100/75">Next Race</p>
        <p className="mt-1 text-sm font-black text-white">{nextRace?.raceName ?? "Waiting for schedule"}</p>
        <p className="mt-1 text-xs font-bold text-emerald-100/75">
          {nextRace ? visibleDate.format(new Date(nextRace.raceAt)) : "Admin has not published the schedule yet"}
        </p>
      </div>
    </section>
  );
}

function SidebarStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/10 p-3">
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-emerald-100/70">{label}</p>
      <p className="mt-1 text-lg font-black text-white">{value}</p>
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-black text-slate-950">{value}</p>
    </div>
  );
}
