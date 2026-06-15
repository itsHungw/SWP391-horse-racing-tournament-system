import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "../../layouts/AdminLayout";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import {
  CreateTournamentPayload,
  createTournament,
  getAdminTournaments,
} from "../../api/adminTournamentApi";
import { approveTournamentLaunch, rejectTournamentLaunch } from "../../api/racingApi";
import { getApiErrorMessage } from "../../utils/apiError";
import type { Tournament } from "../../types/racing";
import { getTournamentDateValidationError } from "../../utils/tournamentDateValidation";
import {
  Search,
  Filter,
  Calendar,
  Users,
  Trophy,
  ChevronRight,
  Plus,
  MapPin,
  Activity,
  X,
} from "lucide-react";

const championshipPhases = [
  "Registration",
  "Pool Formation",
  "Assignment",
  "Schedule",
  "Racing",
  "Completed",
];

function getChampionshipPhase(status: string) {
  switch (status) {
    case "DRAFT":
      return { label: "Setup", index: 0 };
    case "OPEN_REGISTRATION":
      return { label: "Registration", index: 0 };
    case "CLOSED_REGISTRATION":
      return { label: "Pool Formation", index: 1 };
    case "PARTICIPANTS_LOCKED":
      return { label: "Assignment", index: 2 };
    case "SCHEDULE_PUBLISHED":
      return { label: "Schedule", index: 3 };
    case "ONGOING":
      return { label: "Racing", index: 4 };
    case "COMPLETED":
      return { label: "Completed", index: 5 };
    case "POSTPONED":
      return { label: "Paused", index: 0 };
    default:
      return { label: status.replace("_", " "), index: 0 };
  }
}

function getStatusBadgeClass(status: string) {
  switch (status) {
    case "OPEN_REGISTRATION":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "ONGOING":
      return "border-blue-200 bg-blue-50 text-blue-800";
    case "COMPLETED":
      return "border-purple-200 bg-purple-50 text-purple-800";
    case "POSTPONED":
      return "border-orange-200 bg-orange-50 text-orange-800";
    case "CLOSED_REGISTRATION":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "PARTICIPANTS_LOCKED":
      return "border-[#b3193a]/25 bg-[#b3193a]/5 text-[#b3193a]";
    case "SCHEDULE_PUBLISHED":
      return "border-sky-200 bg-sky-50 text-sky-800";
    case "PENDING_APPROVAL":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "APPROVED":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

function getChampionshipNextAction(status: string) {
  switch (status) {
    case "DRAFT":
      return "Open Registration";
    case "OPEN_REGISTRATION":
      return "Close Registration";
    case "CLOSED_REGISTRATION":
      return "Lock Participants";
    case "PARTICIPANTS_LOCKED":
      return "Publish Schedule";
    case "SCHEDULE_PUBLISHED":
      return "Start Championship";
    case "ONGOING":
      return "Continue Round Control";
    case "COMPLETED":
      return "Review Standings";
    case "POSTPONED":
      return "Review Postponement";
    default:
      return "Review Championship";
  }
}

const emptyForm: CreateTournamentPayload = {
  name: "",
  code: "",
  description: "",
  location: "",
  startDate: "",
  endDate: "",
  registrationStartAt: "",
  registrationEndAt: "",
  maxHorses: undefined,
  maxHorsesPerOwner: 2,
};

export function AdminTournamentListPage() {
  useDocumentTitle("Championships admin");

  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<CreateTournamentPayload>(emptyForm);
  const [formError, setFormError] = useState("");
  const [reviewingId, setReviewingId] = useState<number | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getAdminTournaments();
      setTournaments(data);
    } catch (err) {
      console.error("Failed to load championships", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (
      !form.name ||
      !form.code ||
      !form.location ||
      !form.startDate ||
      !form.endDate ||
      !form.registrationStartAt ||
      !form.registrationEndAt
    ) {
      setFormError("Please fill in all required fields.");
      return;
    }

    const dateValidationError = getTournamentDateValidationError(form);
    if (dateValidationError) {
      setFormError(dateValidationError);
      return;
    }

    try {
      setSubmitting(true);
      await createTournament({
        ...form,
        maxHorses: form.maxHorses ? Number(form.maxHorses) : undefined,
        maxHorsesPerOwner: form.maxHorsesPerOwner ? Number(form.maxHorsesPerOwner) : 2,
      });
      setShowCreateModal(false);
      setForm(emptyForm);
      loadData();
    } catch (err: any) {
      setFormError(err.response?.data?.message || "Failed to create championship.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (id: number) => {
    setReviewingId(id);
    try {
      await approveTournamentLaunch(id);
      await loadData();
    } catch (err) {
      alert(getApiErrorMessage(err, "Could not approve this tournament."));
    } finally {
      setReviewingId(null);
    }
  };

  const handleReject = async (id: number) => {
    const reason = window.prompt("Rejection reason (sent to the organizer):");
    if (!reason || !reason.trim()) return;
    setReviewingId(id);
    try {
      await rejectTournamentLaunch(id, reason.trim());
      await loadData();
    } catch (err) {
      alert(getApiErrorMessage(err, "Could not reject this tournament."));
    } finally {
      setReviewingId(null);
    }
  };

  const filteredTournaments = tournaments.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.code || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "" || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalCount = tournaments.length;
  const ongoingCount = tournaments.filter((t) => t.status === "ONGOING").length;
  const openRegCount = tournaments.filter((t) => t.status === "OPEN_REGISTRATION").length;

  return (
    <AdminLayout>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-[#b3193a]">
              Championship Operations
            </p>
            <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-900">
              Championships
            </h1>
            <p className="mt-2 max-w-2xl text-base text-slate-600">
              Manage season phase, registration windows, round progression, and
              championship readiness.
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="group flex min-h-12 items-center justify-center gap-2 self-start rounded-lg bg-[#b3193a] px-6 text-sm font-black text-white shadow-lg shadow-[#b3193a]/20 transition-all hover:-translate-y-0.5 hover:bg-[#92122d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b3193a]"
            type="button"
          >
            <Plus className="h-5 w-5 transition-transform group-hover:rotate-90" />
            Create Championship
          </button>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
            <div className="absolute -right-4 -top-4 rounded-full bg-slate-50 p-8 transition-transform group-hover:scale-110">
              <Trophy className="h-8 w-8 text-slate-300" />
            </div>
            <div className="relative">
              <p className="text-xs font-black uppercase tracking-wider text-slate-500">
                Total Championships
              </p>
              <p className="mt-3 text-4xl font-black text-slate-900">
                {totalCount}
              </p>
            </div>
          </div>
          <div className="group relative overflow-hidden rounded-2xl border border-[#070f4f]/10 bg-gradient-to-br from-[#070f4f]/5 to-white p-6 shadow-sm transition-all hover:shadow-md">
            <div className="absolute -right-4 -top-4 rounded-full bg-[#070f4f]/10 p-8 transition-transform group-hover:scale-110">
              <Activity className="h-8 w-8 text-[#070f4f]/30" />
            </div>
            <div className="relative">
              <p className="text-xs font-black uppercase tracking-wider text-[#070f4f]">
                Active Racing
              </p>
              <p className="mt-3 text-4xl font-black text-[#070f4f]">
                {ongoingCount}
              </p>
            </div>
          </div>
          <div className="group relative overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-6 shadow-sm transition-all hover:shadow-md">
            <div className="absolute -right-4 -top-4 rounded-full bg-emerald-100 p-8 transition-transform group-hover:scale-110">
              <Users className="h-8 w-8 text-emerald-200" />
            </div>
            <div className="relative">
              <p className="text-xs font-black uppercase tracking-wider text-emerald-800">
                Open Registration
              </p>
              <p className="mt-3 text-4xl font-black text-emerald-600">
                {openRegCount}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              id="search-championships"
              type="text"
              placeholder="Search championships by name or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 w-full rounded-xl border-none bg-transparent pl-11 pr-4 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0"
            />
          </div>
          <div className="h-px bg-slate-200 sm:h-8 sm:w-px" />
          <div className="relative w-full sm:w-64">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
              <Filter className="h-5 w-5 text-slate-400" />
            </div>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-12 w-full appearance-none rounded-xl border-none bg-transparent pl-11 pr-10 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-0"
            >
              <option value="">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="PENDING_APPROVAL">Pending Approval</option>
              <option value="APPROVED">Approved</option>
              <option value="OPEN_REGISTRATION">Open Registration</option>
              <option value="CLOSED_REGISTRATION">Closed Registration</option>
              <option value="PARTICIPANTS_LOCKED">Participants Locked</option>
              <option value="SCHEDULE_PUBLISHED">Schedule Published</option>
              <option value="ONGOING">Ongoing</option>
              <option value="COMPLETED">Completed</option>
              <option value="POSTPONED">Postponed</option>
            </select>
          </div>
        </div>

        <div className="min-h-[400px]">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#b3193a] border-t-transparent" />
            </div>
          ) : filteredTournaments.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
              <Trophy className="h-12 w-12 text-slate-300" />
              <p className="mt-4 text-lg font-black text-slate-700">
                No championships found
              </p>
              <p className="mt-1 max-w-sm text-sm font-medium text-slate-500">
                Try adjusting your search filters or create a new championship
                to get started.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-6 font-bold text-[#b3193a] hover:underline"
              >
                Create Championship &rarr;
              </button>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              {filteredTournaments.map((t) => {
                const phase = getChampionshipPhase(t.status);
                const nextAction = getChampionshipNextAction(t.status);
                return (
                  <article
                    key={t.id}
                    className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/50"
                  >
                    <div className="flex-1 p-6">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`rounded-md border px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${getStatusBadgeClass(
                                t.status
                              )}`}
                            >
                              {t.status.replace("_", " ")}
                            </span>
                            <span className="rounded-md bg-slate-100 px-2.5 py-1 font-mono text-[10px] font-black tracking-widest text-slate-500">
                              {t.code || "NO CODE"}
                            </span>
                          </div>
                          <h2 className="mt-4 line-clamp-1 text-2xl font-black tracking-tight text-slate-900">
                            {t.name}
                          </h2>
                          <div className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-slate-500">
                            <MapPin className="h-4 w-4" />
                            {t.location || "Location not set"}
                          </div>
                        </div>
                      </div>

                      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-stretch">
                        <div className="flex-1 rounded-xl bg-slate-50 p-4">
                          <p className="mb-4 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                            <Calendar className="h-3.5 w-3.5" />
                            Schedule & Deadlines
                          </p>
                          <div className="grid grid-cols-2 gap-y-4 gap-x-4">
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Reg. Opens</p>
                              <p className="mt-0.5 text-xs font-black text-slate-900">
                                {t.registrationStartAt ? new Date(t.registrationStartAt).toLocaleDateString() : "TBD"}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Reg. Closes</p>
                              <p className="mt-0.5 text-xs font-black text-slate-900">
                                {t.registrationEndAt ? new Date(t.registrationEndAt).toLocaleDateString() : "TBD"}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Season Starts</p>
                              <p className="mt-0.5 text-xs font-black text-[#006d5b]">
                                {t.startDate ? new Date(t.startDate).toLocaleDateString() : "TBD"}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Season Ends</p>
                              <p className="mt-0.5 text-xs font-black text-[#b3193a]">
                                {t.endDate ? new Date(t.endDate).toLocaleDateString() : "TBD"}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex w-full flex-row gap-4 sm:w-32 sm:flex-col">
                          <div className="flex-1 rounded-xl bg-slate-50 p-4">
                            <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                              <Users className="h-3.5 w-3.5" />
                              Quota
                            </p>
                            <p className="mt-1 text-xl font-black text-slate-900">{t.maxHorsesPerOwner ?? 2}</p>
                          </div>
                          <div className="flex-1 rounded-xl bg-slate-50 p-4">
                            <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                              <Trophy className="h-3.5 w-3.5" />
                              Total Cap
                            </p>
                            <p className="mt-1 text-xl font-black text-slate-900">{t.maxHorses ? t.maxHorses : "∞"}</p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-8">
                        <div className="flex items-center justify-between text-xs font-black uppercase tracking-widest text-slate-400">
                          <span>Phase Progress</span>
                          <span className="text-[#b3193a]">{phase.label}</span>
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-1">
                          {championshipPhases.map((phaseLabel, index) => {
                            const isCompleted = index < phase.index;
                            const isCurrent = index === phase.index;
                            return (
                              <div
                                key={phaseLabel}
                                className="group relative flex w-full flex-col items-center"
                              >
                                <div
                                  className={`h-2 w-full rounded-full transition-colors ${
                                    isCompleted
                                      ? "bg-[#b3193a]"
                                      : isCurrent
                                      ? "bg-[#b3193a]/50"
                                      : "bg-slate-100"
                                  }`}
                                />
                                <div className="absolute -bottom-8 hidden group-hover:block">
                                  <div className="rounded bg-slate-900 px-2 py-1 text-[10px] font-bold text-white shadow-lg">
                                    {phaseLabel}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-6 py-5">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Next Action
                        </p>
                        <p className="mt-0.5 text-sm font-bold text-[#b3193a]">
                          {nextAction}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {t.status === "PENDING_APPROVAL" && (
                          <>
                            <button
                              type="button"
                              disabled={reviewingId === t.id}
                              onClick={() => handleApprove(t.id)}
                              className="min-h-[40px] rounded-lg bg-emerald-600 px-4 text-sm font-bold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              disabled={reviewingId === t.id}
                              onClick={() => handleReject(t.id)}
                              className="min-h-[40px] rounded-lg border border-rose-300 px-4 text-sm font-bold text-rose-700 transition-colors hover:bg-rose-50 disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        <Link
                          to={`/admin/tournaments/${t.id}`}
                          className="group flex min-h-[40px] items-center gap-2 rounded-lg bg-[#070f4f] px-5 text-sm font-bold text-white transition-colors hover:bg-[#0a1570] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#070f4f]"
                        >
                          Manage
                          <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-900/5">
            <div className="flex items-center justify-between border-b border-slate-100 px-8 py-6">
              <div>
                <h2 className="text-2xl font-black tracking-tight text-slate-900">
                  Create Championship
                </h2>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  Configure a new tournament season and parameters.
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b3193a]"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit}>
              <div className="max-h-[65vh] overflow-y-auto px-8 py-6">
                {formError && (
                  <div className="mb-6 rounded-lg bg-rose-50 p-4 text-sm font-bold text-rose-600 border border-rose-100">
                    {formError}
                  </div>
                )}

                <div className="space-y-8">
                  {/* Basic Info Section */}
                  <section>
                    <h3 className="mb-4 text-xs font-black uppercase tracking-widest text-slate-400">
                      Basic Information
                    </h3>
                    <div className="grid gap-5 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                          Championship Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={form.name}
                          onChange={(e) =>
                            setForm({ ...form, name: e.target.value })
                          }
                          className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium focus:border-[#b3193a] focus:ring-1 focus:ring-[#b3193a] focus:outline-none"
                          placeholder="e.g. Summer Derby 2026"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                          Championship Code *
                        </label>
                        <input
                          type="text"
                          required
                          value={form.code}
                          onChange={(e) =>
                            setForm({ ...form, code: e.target.value.toUpperCase() })
                          }
                          className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold uppercase focus:border-[#b3193a] focus:ring-1 focus:ring-[#b3193a] focus:outline-none"
                          placeholder="e.g. SD26"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                          Location *
                        </label>
                        <input
                          type="text"
                          required
                          value={form.location}
                          onChange={(e) =>
                            setForm({ ...form, location: e.target.value })
                          }
                          className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium focus:border-[#b3193a] focus:ring-1 focus:ring-[#b3193a] focus:outline-none"
                          placeholder="e.g. Grand Arena"
                        />
                      </div>
                      
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                          Description
                        </label>
                        <textarea
                          rows={3}
                          value={form.description}
                          onChange={(e) =>
                            setForm({ ...form, description: e.target.value })
                          }
                          className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium focus:border-[#b3193a] focus:ring-1 focus:ring-[#b3193a] focus:outline-none"
                          placeholder="Brief description of the tournament..."
                        />
                      </div>
                    </div>
                  </section>

                  {/* Schedule Section */}
                  <section>
                    <h3 className="mb-4 text-xs font-black uppercase tracking-widest text-slate-400">
                      Schedule & Dates
                    </h3>
                    <div className="grid gap-5 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                          Season Start Date *
                        </label>
                        <input
                          type="date"
                          required
                          value={form.startDate}
                          onChange={(e) =>
                            setForm({ ...form, startDate: e.target.value })
                          }
                          className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium focus:border-[#b3193a] focus:ring-1 focus:ring-[#b3193a] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                          Season End Date *
                        </label>
                        <input
                          type="date"
                          required
                          value={form.endDate}
                          onChange={(e) =>
                            setForm({ ...form, endDate: e.target.value })
                          }
                          className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium focus:border-[#b3193a] focus:ring-1 focus:ring-[#b3193a] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                          Registration Opens *
                        </label>
                        <input
                          type="datetime-local"
                          required
                          value={form.registrationStartAt}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              registrationStartAt: e.target.value,
                            })
                          }
                          className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium focus:border-[#b3193a] focus:ring-1 focus:ring-[#b3193a] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                          Registration Closes *
                        </label>
                        <input
                          type="datetime-local"
                          required
                          value={form.registrationEndAt}
                          onChange={(e) =>
                            setForm({ ...form, registrationEndAt: e.target.value })
                          }
                          className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium focus:border-[#b3193a] focus:ring-1 focus:ring-[#b3193a] focus:outline-none"
                        />
                      </div>
                    </div>
                  </section>

                  {/* Limits Section */}
                  <section>
                    <h3 className="mb-4 text-xs font-black uppercase tracking-widest text-slate-400">
                      Participation Limits
                    </h3>
                    <div className="grid gap-5 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                          Global Horse Cap
                        </label>
                        <input
                          type="number"
                          value={form.maxHorses || ""}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              maxHorses: e.target.value
                                ? Number(e.target.value)
                                : undefined,
                            })
                          }
                          className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium focus:border-[#b3193a] focus:ring-1 focus:ring-[#b3193a] focus:outline-none"
                          placeholder="Unlimited"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                          Max Horses Per Owner
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={form.maxHorsesPerOwner || ""}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              maxHorsesPerOwner: e.target.value
                                ? Number(e.target.value)
                                : undefined,
                            })
                          }
                          className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium focus:border-[#b3193a] focus:ring-1 focus:ring-[#b3193a] focus:outline-none"
                        />
                        <p className="mt-2 text-[11px] font-bold text-slate-500">
                          Default is 2 active horses per owner.
                        </p>
                      </div>
                    </div>
                  </section>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 px-8 py-5">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl px-5 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-[#b3193a] px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-[#b3193a]/20 transition-all hover:bg-[#92122d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b3193a] disabled:opacity-50"
                >
                  {submitting ? "Creating..." : "Create Championship"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
