import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "../../layouts/AdminLayout";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import {
  CreateTournamentPayload,
  createTournament,
  getAdminTournaments,
} from "../../api/adminTournamentApi";
import type { Tournament } from "../../types/racing";
import { getTournamentDateValidationError } from "../../utils/tournamentDateValidation";

const championshipPhases = ["Registration", "Pool Formation", "Assignment", "Schedule", "Racing", "Completed"];

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

    if (!form.name || !form.code || !form.location || !form.startDate || !form.endDate || !form.registrationStartAt || !form.registrationEndAt) {
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
      <div className="flex flex-col gap-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#b3193a]">
              Championship operations
            </p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900">
              Championships
            </h1>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Manage season phase, registration windows, round progression, and championship readiness.
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="self-start rounded-md bg-[#b3193a] px-5 py-2.5 text-sm font-bold text-white shadow transition hover:bg-[#92122d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b3193a]"
            type="button"
          >
            Create Championship
          </button>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Championships</p>
            <p className="mt-2 text-3xl font-black text-slate-900">{totalCount}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Racing</p>
            <p className="mt-2 text-3xl font-black text-[#070f4f]">{ongoingCount}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Open Registration</p>
            <p className="mt-2 text-3xl font-black text-emerald-600">{openRegCount}</p>
          </div>
        </div>

        <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
          <div className="flex-1">
            <label className="sr-only" htmlFor="search-championships">
              Search by name or code
            </label>
            <input
              id="search-championships"
              type="text"
              placeholder="Search championships by name or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#b3193a] focus:outline-none"
            />
          </div>
          <div className="w-full sm:w-56">
            <label className="sr-only" htmlFor="status-filter">
              Filter by status
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#b3193a] focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="DRAFT">Draft</option>
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

        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#b3193a] border-t-transparent" />
            </div>
          ) : filteredTournaments.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center p-6 text-center">
              <p className="text-lg font-bold text-slate-700">No championships found</p>
              <p className="mt-1 text-sm text-slate-500">
                Try adjusting your search filters or create a new championship.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 p-4 lg:grid-cols-2">
              {filteredTournaments.map((t) => {
                const phase = getChampionshipPhase(t.status);
                const nextAction = getChampionshipNextAction(t.status);
                return (
                  <article key={t.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-md border px-2.5 py-1 text-xs font-black uppercase tracking-wide ${getStatusBadgeClass(t.status)}`}>
                            {t.status.replace("_", " ")}
                          </span>
                          <span className="font-mono text-xs font-black text-slate-400">{t.code || "NO CODE"}</span>
                        </div>
                        <h2 className="mt-3 text-xl font-black text-slate-950">{t.name}</h2>
                        <p className="mt-1 text-sm font-semibold text-slate-500">{t.location || "Location not set"}</p>
                      </div>
                      <Link
                        to={`/admin/tournaments/${t.id}`}
                        aria-label={`Continue ${t.name}`}
                        className="inline-flex min-h-10 items-center justify-center rounded-md bg-[#b3193a] px-4 text-sm font-black text-white hover:bg-[#92122d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b3193a] focus-visible:ring-offset-2"
                      >
                        Continue
                      </Link>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                      <div className="rounded-md border border-slate-100 bg-slate-50 p-3">
                        <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">Horse cap</p>
                        <p className="mt-1 text-lg font-black text-slate-950">{t.maxHorses || "Unlimited"}</p>
                      </div>
                      <div className="rounded-md border border-slate-100 bg-slate-50 p-3">
                        <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">Owner quota</p>
                        <p className="mt-1 text-lg font-black text-slate-950">{t.maxHorsesPerOwner ?? 2}</p>
                      </div>
                      <div className="rounded-md border border-slate-100 bg-slate-50 p-3">
                        <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">Current phase</p>
                        <p className="mt-1 text-lg font-black text-slate-950">{phase.label}</p>
                      </div>
                      <div className="rounded-md border border-slate-100 bg-slate-50 p-3">
                        <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">Season dates</p>
                        <p className="mt-1 text-sm font-black text-slate-950">
                          {t.startDate || "TBD"} to {t.endDate || "TBD"}
                        </p>
                      </div>
                      <div className="rounded-md border border-[#b3193a]/20 bg-[#b3193a]/5 p-3">
                        <p className="text-[11px] font-black uppercase tracking-wide text-[#b3193a]">Next Action</p>
                        <p className="mt-1 text-lg font-black text-slate-950">{nextAction}</p>
                      </div>
                    </div>

                    <div className="mt-5">
                      <div className="flex items-center justify-between text-xs font-black uppercase tracking-wide text-slate-400">
                        <span>Phase progress</span>
                        <span>{phase.label}</span>
                      </div>
                      <div className="mt-3 grid grid-cols-5 gap-2">
                        {championshipPhases.map((phaseLabel, index) => (
                          <div key={phaseLabel} className="min-w-0">
                            <div className={`h-2 rounded-full ${index <= phase.index ? "bg-[#b3193a]" : "bg-slate-200"}`} />
                            <p className="mt-2 truncate text-[11px] font-bold text-slate-500">{phaseLabel}</p>
                          </div>
                        ))}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl overflow-hidden rounded-lg bg-white shadow-xl">
            <div className="border-b border-slate-100 px-6 py-4">
              <h2 className="text-xl font-black text-slate-900">Create New Championship</h2>
            </div>

            <form onSubmit={handleCreateSubmit}>
              <div className="max-h-[60vh] overflow-y-auto p-6">
                {formError && (
                  <div className="mb-4 rounded bg-rose-50 p-3 text-sm font-bold text-rose-600">
                    {formError}
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Championship Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#b3193a] focus:outline-none"
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
                      onChange={(e) => setForm({ ...form, code: e.target.value })}
                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#b3193a] focus:outline-none"
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
                      onChange={(e) => setForm({ ...form, location: e.target.value })}
                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#b3193a] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Championship Start Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={form.startDate}
                      onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#b3193a] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Championship End Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={form.endDate}
                      onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#b3193a] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Registration Start Time *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={form.registrationStartAt}
                      onChange={(e) => setForm({ ...form, registrationStartAt: e.target.value })}
                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#b3193a] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Registration End Time *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={form.registrationEndAt}
                      onChange={(e) => setForm({ ...form, registrationEndAt: e.target.value })}
                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#b3193a] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Max Horse Participants
                    </label>
                    <input
                      type="number"
                      value={form.maxHorses || ""}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          maxHorses: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#b3193a] focus:outline-none"
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
                          maxHorsesPerOwner: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#b3193a] focus:outline-none"
                    />
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      Default is 2 active horse registrations per owner.
                    </p>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Description
                    </label>
                    <textarea
                      rows={3}
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#b3193a] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-md bg-[#b3193a] px-4 py-2 text-sm font-bold text-white hover:bg-[#92122d] disabled:opacity-50"
                >
                  {submitting ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
