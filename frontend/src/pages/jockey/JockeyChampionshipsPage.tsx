import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Compass,
  History,
  Loader2,
  Search,
  ShieldCheck,
  Trophy,
  X,
} from "lucide-react";

import {
  applyToJockeyChampionship,
  getJockeyChampionships,
  getJockeyContracts,
  getJockeyParticipants,
  getJockeyPoolApplications,
} from "../../api/racingApi";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { JockeyLayout } from "../../layouts/JockeyLayout";
import type {
  JockeyChampionship,
  JockeyChampionshipApplicationStatus,
  JockeyInvitation,
  JockeyPoolApplication,
  TournamentParticipant,
} from "../../types/racing";
import { getApiErrorMessage } from "../../utils/apiError";
import racingImage from "../../assets/slide.jpg";

type ChampionshipTab = "current" | "open" | "history";
type OpenFilter = "Open" | "Pending" | "Approved for Pool" | "Rejected";
type CurrentState =
  | { kind: "participant"; participant: TournamentParticipant }
  | { kind: "contract"; contract: JockeyInvitation }
  | { kind: "application"; championship: JockeyChampionship }
  | { kind: "empty" };

const tabs: Array<{ id: ChampionshipTab; label: string; icon: typeof Trophy }> = [
  { id: "current", label: "Current", icon: Trophy },
  { id: "open", label: "Open Championships", icon: Compass },
  { id: "history", label: "History", icon: History },
];

const filters: OpenFilter[] = ["Open", "Pending", "Approved for Pool", "Rejected"];

const journeySteps = [
  "Application Submitted",
  "Review In Progress",
  "Approved For Pool",
  "Assignment Contract",
  "Participant Locked",
  "Championship Racing",
];

function formatDate(value?: string) {
  if (!value) return "TBD";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

function statusLabel(status: JockeyChampionshipApplicationStatus) {
  switch (status) {
    case "PENDING":
      return "Pending Review";
    case "APPROVED_FOR_POOL":
      return "Approved for Pool";
    case "REJECTED":
      return "Rejected";
    case "WITHDRAWN":
      return "Withdrawn";
    default:
      return "Not Applied";
  }
}

function statusTone(status: JockeyChampionshipApplicationStatus) {
  if (status === "APPROVED_FOR_POOL") return "border-emerald-200 bg-emerald-50 text-[#006d5b]";
  if (status === "PENDING") return "border-amber-200 bg-amber-50 text-amber-800";
  if (status === "REJECTED") return "border-rose-200 bg-rose-50 text-rose-800";
  return "border-slate-200 bg-slate-50 text-slate-600";
}

function filterMatches(championship: JockeyChampionship, filter: OpenFilter) {
  if (filter === "Pending") return championship.applicationStatus === "PENDING";
  if (filter === "Approved for Pool") return championship.applicationStatus === "APPROVED_FOR_POOL";
  if (filter === "Rejected") return championship.applicationStatus === "REJECTED";
  return championship.applicationStatus === "NOT_APPLIED" || championship.canApply;
}

function isFinalChampionshipStatus(status?: string) {
  return status === "COMPLETED" || status === "CANCELLED";
}

function isRacingChampionshipStatus(status?: string) {
  return status === "SCHEDULE_PUBLISHED" || status === "ONGOING";
}

function championshipStatus(championships: JockeyChampionship[], championshipId: number) {
  return championships.find((championship) => championship.id === championshipId)?.status;
}

function progressIndex(state: CurrentState, championships: JockeyChampionship[]) {
  if (state.kind === "participant") {
    return isRacingChampionshipStatus(championshipStatus(championships, state.participant.championshipId)) ? 5 : 4;
  }
  if (state.kind === "contract") return 3;
  if (state.kind === "application" && state.championship.applicationStatus === "APPROVED_FOR_POOL") return 2;
  if (state.kind === "application" && state.championship.applicationStatus === "PENDING") return 1;
  if (
    state.kind === "application" &&
    (state.championship.applicationStatus === "REJECTED" || state.championship.applicationStatus === "WITHDRAWN")
  ) {
    return 0;
  }
  return -1;
}

function pickCurrentState(
  participants: TournamentParticipant[],
  contracts: JockeyInvitation[],
  championships: JockeyChampionship[],
): CurrentState {
  const participant =
    participants.find(
      (item) => item.status === "ACTIVE" && !isFinalChampionshipStatus(championshipStatus(championships, item.championshipId)),
    ) ?? null;
  if (participant) return { kind: "participant", participant };

  const acceptedContract = contracts.find(
    (contract) =>
      contract.status === "ACCEPTED" &&
      !isFinalChampionshipStatus(championshipStatus(championships, contract.championshipId)),
  );
  if (acceptedContract) return { kind: "contract", contract: acceptedContract };

  const activeChampionships = championships.filter((item) => !isFinalChampionshipStatus(item.status));
  const championship =
    activeChampionships.find((item) => item.applicationStatus === "APPROVED_FOR_POOL") ??
    activeChampionships.find((item) => item.applicationStatus === "PENDING") ??
    activeChampionships.find((item) => item.applicationStatus === "REJECTED") ??
    null;

  if (championship) return { kind: "application", championship };
  return { kind: "empty" };
}

function currentTitle(state: CurrentState) {
  if (state.kind === "participant") return "Official Championship Assignment";
  if (state.kind === "contract") return "Committed Assignment";
  if (state.kind === "empty") return "No Active Championship";
  if (state.championship.applicationStatus === "PENDING") return "Application Under Review";
  if (state.championship.applicationStatus === "APPROVED_FOR_POOL") return "Approved for Pool";
  if (state.championship.applicationStatus === "REJECTED") return "Application Needs Revision";
  if (state.championship.applicationStatus === "WITHDRAWN") return "Application Withdrawn";
  return "No Active Championship";
}

function currentName(state: CurrentState) {
  if (state.kind === "participant") return state.participant.championshipName;
  if (state.kind === "contract") return state.contract.championshipName;
  if (state.kind === "application") return state.championship.name;
  return "";
}

function overviewMessage(state: CurrentState) {
  if (state.kind === "empty") {
    return "Apply to an open championship pool to become visible to stable owners and receive assignment contracts.";
  }
  if (state.kind === "participant") {
    return `${state.participant.horseName} with ${state.participant.ownerName} is now an official championship participant. Standings should appear only after published round results exist.`;
  }
  if (state.kind === "contract") {
    return `${state.contract.horseName} with ${state.contract.ownerName} is committed by contract. Admin must lock participants before this becomes the official racing pair.`;
  }

  switch (state.championship.applicationStatus) {
    case "PENDING":
      return `Your pool application is waiting for admin review. Submitted ${formatDate(
        state.championship.applicationCreatedAt,
      )}.`;
    case "APPROVED_FOR_POOL":
      return "You are visible to owners in this championship pool. Assignment contracts unlock after owners choose approved jockeys.";
    case "REJECTED":
      return "This pool application needs revision before you can become visible to owners.";
    case "WITHDRAWN":
      return "Your application was withdrawn. You can apply again while the application window is open.";
    default:
      return "Apply to an open championship pool to become visible to stable owners.";
  }
}

function currentBadge(state: CurrentState) {
  if (state.kind === "participant") {
    return { label: "Official Participant", className: "border-emerald-200 bg-emerald-50 text-[#006d5b]" };
  }
  if (state.kind === "contract") {
    return { label: "Pending Admin Lock", className: "border-sky-200 bg-sky-50 text-sky-800" };
  }
  if (state.kind === "application") {
    return {
      label: statusLabel(state.championship.applicationStatus),
      className: statusTone(state.championship.applicationStatus),
    };
  }
  return { label: "Not Applied", className: "border-slate-200 bg-slate-50 text-slate-600" };
}

function cardHelp(championship: JockeyChampionship) {
  switch (championship.applicationStatus) {
    case "PENDING":
      return "Admin will review your championship pool application before owners can see you.";
    case "APPROVED_FOR_POOL":
      return "You are visible in the approved jockey pool for owner assignment contracts.";
    case "REJECTED":
      return championship.rejectionReason || "This application was rejected. Review feedback before applying again.";
    case "WITHDRAWN":
      return "You withdrew this application. You can apply again while the application window is open.";
    default:
      return "Apply to join the reviewed jockey pool for this championship.";
  }
}

export function JockeyChampionshipsPage() {
  useDocumentTitle("Jockey championships");

  const [activeTab, setActiveTab] = useState<ChampionshipTab>("current");
  const [activeFilter, setActiveFilter] = useState<OpenFilter>("Open");
  const [searchQuery, setSearchQuery] = useState("");
  const [championships, setChampionships] = useState<JockeyChampionship[]>([]);
  const [applications, setApplications] = useState<JockeyPoolApplication[]>([]);
  const [contracts, setContracts] = useState<JockeyInvitation[]>([]);
  const [participants, setParticipants] = useState<TournamentParticipant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [applicationTarget, setApplicationTarget] = useState<JockeyChampionship | null>(null);
  const [applicationNote, setApplicationNote] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentState = pickCurrentState(participants, contracts, championships);
  const currentApplication = currentState.kind === "application" ? currentState.championship : null;
  const activeProgressIndex = progressIndex(currentState, championships);
  const badge = currentBadge(currentState);
  const completedParticipants = useMemo(
    () =>
      participants.filter((participant) =>
        isFinalChampionshipStatus(championshipStatus(championships, participant.championshipId)),
      ),
    [championships, participants],
  );

  const visibleChampionships = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return championships.filter((championship) => {
      const matchesSearch =
        !query ||
        championship.name.toLowerCase().includes(query) ||
        championship.location?.toLowerCase().includes(query) ||
        championship.code?.toLowerCase().includes(query);

      return matchesSearch && filterMatches(championship, activeFilter);
    });
  }, [activeFilter, championships, searchQuery]);

  const applicationSummary = useMemo(
    () => ({
      pending: applications.filter((application) => application.status === "PENDING").length,
      approved: applications.filter((application) => application.status === "APPROVED_FOR_POOL").length,
      rejected: applications.filter((application) => application.status === "REJECTED").length,
    }),
    [applications],
  );

  const loadChampionships = async () => {
    setIsLoading(true);
    setError("");
    try {
      const [championshipData, applicationData, contractData, participantData] = await Promise.all([
        getJockeyChampionships(),
        getJockeyPoolApplications(),
        getJockeyContracts(),
        getJockeyParticipants(),
      ]);
      setChampionships(championshipData);
      setApplications(applicationData);
      setContracts(contractData);
      setParticipants(participantData);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load jockey championships."));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadChampionships();
  }, []);

  const openApplication = (championship: JockeyChampionship) => {
    setApplicationTarget(championship);
    setApplicationNote(championship.applicationMessage || "");
    setSubmitError("");
  };

  const submitApplication = async () => {
    if (!applicationTarget) return;

    setIsSubmitting(true);
    setSubmitError("");
    try {
      await applyToJockeyChampionship(applicationTarget.id, applicationNote.trim() || undefined);
      setApplicationTarget(null);
      setApplicationNote("");
      await loadChampionships();
      setActiveTab("current");
    } catch (err) {
      setSubmitError(getApiErrorMessage(err, "Could not submit championship application."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <JockeyLayout>
      <section aria-labelledby="championships-title" className="space-y-6">
        {/* Standardized Hero Header */}
        <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="absolute top-0 left-0 h-1.5 w-full bg-gradient-to-r from-[#008670] to-[#006d5b]"></div>
          <div>
            <p className="text-sm font-black uppercase tracking-[0.14em] text-[#006d5b]">
              Championship Pool
            </p>
            <h1 id="championships-title" className="mt-2 text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
              Championships
            </h1>
            <p className="mt-2 max-w-3xl text-base leading-7 text-slate-600">
              Apply to championship pools, track admin review, and become eligible for owner assignment contracts.
            </p>
          </div>
        </div>

        {/* Tab Selection Navigation */}
        <div
          aria-label="Championship sections"
          className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm"
          role="tablist"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                aria-selected={isActive}
                className={`inline-flex min-h-11 items-center gap-2 rounded-lg px-4 text-sm font-black transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006d5b] hover:scale-[1.01] active:scale-[0.99] cursor-pointer ${
                  isActive
                    ? "bg-[#006d5b] text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
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

        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700" role="alert">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {isLoading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map((item) => (
              <div className="h-36 animate-pulse rounded-2xl border border-slate-200 bg-white" key={item} />
            ))}
          </div>
        ) : (
          <>
            {activeTab === "current" && (
              <section aria-label="Current championship state" className="space-y-6">
                {/* Hero Current State Banner */}
                <div className="overflow-hidden rounded-2xl border border-[#002d25]/10 bg-gradient-to-br from-[#002d25] via-[#003d32] to-[#014d3e] text-white shadow-md relative">
                  <div className="relative p-6 sm:p-8">
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 bg-cover bg-center opacity-10"
                      style={{ backgroundImage: `url(${racingImage})` }}
                    />
                    
                    <div className="relative max-w-4xl">
                      <span className="inline-flex rounded-full bg-white/10 border border-white/15 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-emerald-100">
                        Current State
                      </span>
                      
                      <h2 className="mt-4 text-3xl font-black tracking-tight leading-tight">
                        {currentTitle(currentState)}
                      </h2>
                      
                      {currentName(currentState) && (
                        <p className="mt-2 text-xl font-bold tracking-tight text-emerald-100">
                          {currentName(currentState)}
                        </p>
                      )}
                      
                      <p className="mt-3.5 max-w-2xl text-sm font-semibold leading-relaxed text-emerald-50/75">
                        {overviewMessage(currentState)}
                      </p>
                      
                      <div className="mt-6 flex flex-wrap items-center gap-3">
                        <span
                          className={`inline-flex min-h-10 items-center rounded-xl border px-4 text-sm font-black ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                        
                        {currentState.kind === "application" &&
                          currentState.championship.applicationStatus === "APPROVED_FOR_POOL" && (
                            <span className="inline-flex min-h-10 items-center rounded-xl border border-white/15 bg-white/10 px-4 text-sm font-black text-white">
                              Visible to Owners
                            </span>
                          )}
                        
                        {currentState.kind === "contract" && (
                          <span className="inline-flex min-h-10 items-center rounded-xl border border-white/15 bg-white/10 px-4 text-sm font-black text-white">
                            {currentState.contract.horseName} / {currentState.contract.ownerName}
                          </span>
                        )}
                        
                        {currentState.kind === "participant" && (
                          <span className="inline-flex min-h-10 items-center rounded-xl border border-white/15 bg-white/10 px-4 text-sm font-black text-white">
                            Current Points: {currentState.participant.points}
                          </span>
                        )}
                        
                        <button
                          className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-white px-5 text-sm font-black text-[#006d5b] hover:bg-emerald-50 hover:scale-[1.02] active:scale-[0.98] transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white cursor-pointer"
                          onClick={() => setActiveTab("open")}
                          type="button"
                        >
                          Browse Championships
                          <ArrowRight className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Rejected feedback panel */}
                {currentApplication?.applicationStatus === "REJECTED" && currentApplication.rejectionReason && (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-rose-700">Review Feedback</p>
                      <p className="mt-2 text-sm font-semibold leading-relaxed text-rose-900">
                        {currentApplication.rejectionReason}
                      </p>
                    </div>
                    {currentApplication.canApply && (
                      <button
                        className="shrink-0 inline-flex min-h-11 items-center rounded-xl bg-rose-600 px-5 text-sm font-black text-white hover:bg-rose-700 hover:scale-[1.02] active:scale-[0.98] transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 cursor-pointer"
                        onClick={() => openApplication(currentApplication)}
                        type="button"
                      >
                        Apply Again
                      </button>
                    )}
                  </div>
                )}

                {/* Summary Metrics */}
                <section className="grid gap-4 md:grid-cols-3" aria-label="Application summary">
                  <SummaryTile label="Pending Review" value={applicationSummary.pending} tone="amber" />
                  <SummaryTile label="Approved Pool" value={applicationSummary.approved} tone="emerald" />
                  <SummaryTile label="Rejected" value={applicationSummary.rejected} tone="rose" />
                </section>

                {/* Visual workflow timeline */}
                <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-[#006d5b]">
                        Championship Journey
                      </p>
                      <h3 className="mt-2 text-2xl font-black text-slate-900 tracking-tight">From pool application to racing</h3>
                      <p className="mt-1 text-sm font-semibold text-slate-500">
                        Contract acceptance is visible immediately. Official racing status starts after admin locks participants.
                      </p>
                    </div>
                  </div>
                  
                  <div
                    aria-label="Championship journey"
                    className="mt-6 rounded-xl border border-slate-100 bg-slate-50/50 p-5"
                  >
                    <ol className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                      {journeySteps.map((step, index) => {
                        const done = index <= activeProgressIndex;
                        const current = index === activeProgressIndex;
                        const locked = index > activeProgressIndex;

                        return (
                          <li className="flex flex-col" key={step}>
                            <div
                              className={`flex-1 rounded-xl border p-4 shadow-sm transition-all duration-300 ${
                                current
                                  ? "border-emerald-500 bg-emerald-50/50 shadow-emerald-950/[0.01]"
                                  : done
                                    ? "border-emerald-250 bg-white"
                                    : "border-slate-150 bg-white/70"
                              }`}
                            >
                              <span
                                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-black transition-colors ${
                                  done ? "bg-[#006d5b] text-white" : "bg-slate-250 text-slate-400"
                                }`}
                              >
                                {done ? <CheckCircle2 className="h-4.5 w-4.5" aria-hidden="true" /> : index + 1}
                              </span>
                              <p className="mt-3 text-sm font-black leading-snug text-slate-900 tracking-tight">{step}</p>
                              <p className={`mt-1.5 text-xs font-bold ${current ? "text-emerald-700" : "text-slate-400"}`}>
                                {current ? "Current step" : locked ? "Waiting" : "Completed"}
                              </p>
                            </div>
                          </li>
                        );
                      })}
                    </ol>
                  </div>
                </article>
              </section>
            )}

            {activeTab === "open" && (
              <section aria-label="Open championships" className="space-y-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div>
                      <h2 className="text-2xl font-black text-slate-900 tracking-tight">Open Championships</h2>
                      <p className="mt-1 text-sm font-semibold text-slate-500">
                        Apply to reviewed pools before stable owners can send assignment contracts.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {filters.map((filter) => (
                        <button
                          className={`min-h-10 rounded-xl px-4 text-xs font-black transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006d5b] cursor-pointer ${
                            activeFilter === filter
                              ? "bg-[#006d5b] text-white shadow-sm"
                              : "border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800"
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
                  
                  <label className="mt-5 flex min-h-11 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3.5 transition-all focus-within:border-[#006d5b] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#006d5b]/10 cursor-text">
                    <Search className="h-4.5 w-4.5 text-slate-400" aria-hidden="true" />
                    <span className="sr-only">Search championships</span>
                    <input
                      className="h-11 flex-1 bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400"
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="Search championship, code, location..."
                      type="search"
                      value={searchQuery}
                    />
                  </label>
                </div>

                {visibleChampionships.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-350 bg-white p-12 text-center shadow-sm">
                    <Clock3 className="mx-auto h-10 w-10 text-slate-400" aria-hidden="true" />
                    <h3 className="mt-4 text-lg font-black text-slate-900 tracking-tight">No championships match this view</h3>
                    <p className="mx-auto mt-2 max-w-md text-sm font-semibold leading-relaxed text-slate-500">
                      Try a different status filter or search term.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {visibleChampionships.map((championship) => (
                      <article
                        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:border-emerald-600/20 hover:shadow-md hover:shadow-emerald-950/[0.01]"
                        key={championship.id}
                      >
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`rounded-lg border px-2.5 py-1 text-xs font-bold uppercase tracking-wider ${statusTone(
                                  championship.applicationStatus,
                                )}`}
                              >
                                {statusLabel(championship.applicationStatus)}
                              </span>
                              <span className="rounded-lg bg-slate-100 border border-slate-150 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-slate-500">
                                {championship.status.replaceAll("_", " ")}
                              </span>
                            </div>
                            
                            <h3 className="mt-3.5 text-2xl font-black text-slate-900 tracking-tight">{championship.name}</h3>
                            
                            <p className="mt-1 text-sm font-semibold text-slate-400">
                              {championship.location || "Track TBD"} • {formatDate(championship.startDate)} to {formatDate(championship.endDate)}
                            </p>
                            
                            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                              <InfoBlock label="Approved Pool" value={`${championship.approvedPoolCount}`} />
                              <InfoBlock
                                label="Pool Capacity"
                                value={championship.maxHorses ? `${championship.maxHorses} riders` : "Open"}
                              />
                              <InfoBlock label="Apply By" value={formatDate(championship.registrationEndAt)} />
                              <InfoBlock
                                label="Prize Pool"
                                value={championship.totalPrizePool !== undefined && championship.totalPrizePool !== null ? `${championship.totalPrizePool.toLocaleString()} VND` : "TBD"}
                              />
                            </div>
                            
                            <p className="mt-4 max-w-3xl text-sm font-semibold leading-relaxed text-slate-500 bg-slate-50/50 rounded-xl p-3.5 border border-slate-100">
                              {cardHelp(championship)}
                            </p>
                          </div>

                          <div className="shrink-0 pt-1">
                            {championship.canApply ? (
                              <button
                                aria-label={`Apply for Championship ${championship.name}`}
                                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#006d5b] px-6 text-sm font-black text-white hover:bg-[#004d3d] hover:scale-[1.02] active:scale-[0.98] transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006d5b] cursor-pointer"
                                onClick={() => openApplication(championship)}
                                type="button"
                              >
                                {championship.applicationStatus === "REJECTED" ||
                                championship.applicationStatus === "WITHDRAWN"
                                  ? "Apply Again"
                                  : "Apply for Championship"}
                                <ArrowRight className="h-4 w-4" aria-hidden="true" />
                              </button>
                            ) : (
                              <span className="inline-flex min-h-11 items-center rounded-xl border border-slate-200 bg-slate-50 px-5 text-sm font-black text-slate-400">
                                {championship.applicationStatus === "PENDING"
                                  ? "Submitted"
                                  : statusLabel(championship.applicationStatus)}
                              </span>
                            )}
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            )}

            {activeTab === "history" && <HistorySection participants={completedParticipants} />}
          </>
        )}

        {applicationTarget && (
          <div
            aria-label="Championship application"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 backdrop-blur-sm p-4 sm:items-center animate-fade-in"
            role="dialog"
          >
            <div className="max-h-[90vh] w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden flex flex-col">
              <div className="overflow-y-auto no-scrollbar flex-1 min-h-0">
                <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-6 bg-slate-50/50">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-[#006d5b]">
                      Championship Application
                    </p>
                    <h2 className="mt-2 text-2xl font-black text-slate-950 tracking-tight">{applicationTarget.name}</h2>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      Submit your pool application for admin review before owners can see you.
                    </p>
                  </div>
                  <button
                    aria-label="Close championship application"
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-250 text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006d5b] cursor-pointer"
                    onClick={() => setApplicationTarget(null)}
                    type="button"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
                
                <div className="space-y-6 p-6">
                  {submitError && (
                    <div
                      className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700 animate-shake"
                      role="alert"
                    >
                      <AlertTriangle className="h-5 w-5 shrink-0" />
                      <span>{submitError}</span>
                    </div>
                  )}

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <InfoBlock
                      label="Season"
                      value={`${formatDate(applicationTarget.startDate)} - ${formatDate(applicationTarget.endDate)}`}
                    />
                    <InfoBlock label="Approved Pool" value={`${applicationTarget.approvedPoolCount} riders`} />
                    <InfoBlock label="Apply By" value={formatDate(applicationTarget.registrationEndAt)} />
                    <InfoBlock
                      label="Prize Pool"
                      value={applicationTarget.totalPrizePool !== undefined && applicationTarget.totalPrizePool !== null ? `${applicationTarget.totalPrizePool.toLocaleString()} VND` : "TBD"}
                    />
                  </div>

                  <section aria-labelledby="eligibility-title" className="rounded-xl border border-slate-200/60 bg-slate-50/30 p-5">
                    <h3 id="eligibility-title" className="text-lg font-black text-slate-905 tracking-tight">
                      Eligibility Checklist
                    </h3>
                    <div className="mt-4 grid gap-3">
                      {[
                        "Jockey role approved",
                        "Application window open",
                        "Not already approved in this championship",
                      ].map((label) => (
                        <div className="flex items-center gap-2.5" key={label}>
                          <CheckCircle2 className="h-5 w-5 text-[#006d5b] shrink-0" aria-hidden="true" />
                          <p className="text-sm font-semibold text-slate-700">{label}</p>
                        </div>
                      ))}
                    </div>
                  </section>

                  <label className="block space-y-2">
                    <span className="text-sm font-black text-slate-800">Application note</span>
                    <textarea
                      className="min-h-24 w-full rounded-xl border border-slate-300 bg-slate-50/20 px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-[#006d5b] focus:bg-white focus:ring-2 focus:ring-[#006d5b]/10"
                      onChange={(event) => setApplicationNote(event.target.value)}
                      placeholder="Add availability notes or racing context for admin review."
                      value={applicationNote}
                    />
                  </label>
                </div>
                
                <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 bg-white p-6">
                  <button
                    className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-black text-slate-700 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006d5b] cursor-pointer"
                    onClick={() => setApplicationTarget(null)}
                    type="button"
                  >
                    Cancel
                  </button>
                  <button
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#006d5b] px-6 text-sm font-black text-white hover:bg-[#004d3d] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006d5b] transition-all cursor-pointer"
                    disabled={isSubmitting}
                    onClick={submitApplication}
                    type="button"
                  >
                    {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                    {isSubmitting ? "Submitting..." : "Submit Application"}
                    {!isSubmitting && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </JockeyLayout>
  );
}

function SummaryTile({ label, value, tone }: { label: string; value: number; tone: "amber" | "emerald" | "rose" }) {
  const toneClass =
    tone === "emerald"
      ? "border-emerald-200 bg-emerald-50 text-[#006d5b]"
      : tone === "amber"
        ? "border-amber-200 bg-amber-50 text-amber-800"
        : "border-rose-200 bg-rose-50 text-rose-800";

  return (
    <div className={`rounded-2xl border p-5 shadow-sm transition-all duration-300 ${toneClass}`}>
      <p className="text-xs font-bold uppercase tracking-wider opacity-75">{label}</p>
      <p className="mt-2 text-3xl font-black leading-none">{value}</p>
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 transition-colors hover:bg-slate-50">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1.5 text-sm font-extrabold text-slate-800 leading-snug">{value}</p>
    </div>
  );
}

function HistorySection({ participants }: { participants: TournamentParticipant[] }) {
  if (participants.length > 0) {
    return (
      <section aria-label="Championship history" className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-[#006d5b]">Championship Archive</p>
          <h2 className="mt-2 text-2xl font-black text-slate-905 tracking-tight">Completed Assignments</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Finished championships move here so the Current tab stays focused on active work.
          </p>
        </div>

        <div className="grid gap-4">
          {participants.map((participant) => (
            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" key={participant.id}>
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-[#006d5b]">
                    Completed
                  </span>
                  <h3 className="mt-3.5 text-2xl font-black text-slate-905 tracking-tight">{participant.championshipName}</h3>
                  <p className="mt-1 text-sm font-semibold text-slate-400">
                    {participant.horseName} with {participant.ownerName}
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 md:min-w-72">
                  <InfoBlock label="Career Points" value={`${participant.points}`} />
                  <InfoBlock label="Assignment" value={participant.status.replaceAll("_", " ")} />
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section aria-label="Championship history" className="space-y-6">
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-emerald-50 text-[#006d5b] mb-4">
          <ShieldCheck className="h-6 w-6" aria-hidden="true" />
        </div>
        <h2 className="text-2xl font-black text-slate-950 tracking-tight">No official championship history yet</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-relaxed text-slate-500">
          History will unlock after a contract becomes an official participant and published standings exist. Until then,
          this page avoids showing fake rank, points, horse, or stable data.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-[#006d5b]">Future-ready fields</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {["Final Rank", "Total Points", "Committed Horse", "Stable"].map((item) => (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4" key={item}>
              <p className="text-sm font-black text-slate-700">{item}</p>
              <p className="mt-2 text-xs font-bold text-slate-500">Waiting for official standings API</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <div className="flex gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden="true" />
          <div>
            <h3 className="text-sm font-black text-amber-900">Truth-first display</h3>
            <p className="mt-1 text-sm font-semibold leading-relaxed text-amber-800">
              Current backend supports pool applications. Career standings should appear only after TournamentParticipant
              and published result data are available.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
