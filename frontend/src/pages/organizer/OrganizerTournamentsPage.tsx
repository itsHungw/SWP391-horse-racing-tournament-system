import { useEffect, useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Plus,
  Search,
  MapPin,
  Calendar,
  Users,
  Trophy,
  X,
  FileText,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

import {
  getMyOrganizerTournaments,
  createOrganizerTournament,
} from "../../api/racingApi";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import type { Tournament } from "../../types/racing";
import { getApiErrorMessage } from "../../utils/apiError";
import { getTournamentDateValidationError } from "../../utils/tournamentDateValidation";

const statusBadgeStyle: Record<string, string> = {
  DRAFT: "border-slate-200 bg-slate-50 text-slate-700",
  PENDING_APPROVAL: "border-amber-250 bg-amber-50 text-amber-800",
  APPROVED: "border-emerald-200 bg-emerald-50 text-emerald-800",
  OPEN_REGISTRATION: "border-emerald-250 bg-emerald-50 text-emerald-800",
  CLOSED_REGISTRATION: "border-amber-200 bg-amber-50 text-amber-850",
  PARTICIPANTS_LOCKED: "border-indigo-200 bg-indigo-50 text-indigo-800",
  SCHEDULE_PUBLISHED: "border-sky-200 bg-sky-50 text-sky-850",
  ONGOING: "border-[#bb8a3c]/35 bg-[#bb8a3c]/5 text-[#8a6a1c]",
  COMPLETED: "border-slate-200 bg-slate-100 text-slate-650",
  POSTPONED: "border-rose-250 bg-rose-50 text-rose-800",
};

const emptyCreateForm = {
  name: "",
  code: "",
  description: "",
  location: "",
  startDate: "",
  endDate: "",
  registrationStartAt: "",
  registrationEndAt: "",
  maxHorses: "",
  maxHorsesPerOwner: "2",
  totalPrizePool: "0",
};

function formatDate(value?: string) {
  if (!value) return "TBD";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? "TBD"
    : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function OrganizerTournamentsPage() {
  useDocumentTitle("My Championships | Organizer");

  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") ?? "");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Create Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [createError, setCreateError] = useState("");
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getMyOrganizerTournaments();
      setTournaments(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load your championships."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  // Filter logic
  const filteredTournaments = useMemo(() => {
    return tournaments.filter((t) => {
      const query = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !query ||
        `${t.name} ${t.code} ${t.location ?? ""}`
          .toLowerCase()
          .includes(query);
      const matchesStatus =
        statusFilter === "ALL" || t.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [tournaments, searchTerm, statusFilter]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");

    if (
      !createForm.name ||
      !createForm.code ||
      !createForm.location ||
      !createForm.startDate ||
      !createForm.endDate ||
      !createForm.registrationStartAt ||
      !createForm.registrationEndAt
    ) {
      setCreateError("Please fill in all required fields.");
      return;
    }

    const dateValidationError = getTournamentDateValidationError(createForm);
    if (dateValidationError) {
      setCreateError(dateValidationError);
      return;
    }

    try {
      setCreating(true);
      const payload = {
        name: createForm.name,
        code: createForm.code,
        description: createForm.description || undefined,
        location: createForm.location,
        startDate: createForm.startDate,
        endDate: createForm.endDate,
        registrationStartAt: createForm.registrationStartAt,
        registrationEndAt: createForm.registrationEndAt,
        maxHorses: createForm.maxHorses ? Number(createForm.maxHorses) : undefined,
        maxHorsesPerOwner: createForm.maxHorsesPerOwner ? Number(createForm.maxHorsesPerOwner) : 2,
        totalPrizePool: Number(createForm.totalPrizePool || 0),
      };

      const newChampionship = await createOrganizerTournament(payload);
      setShowCreateModal(false);
      setCreateForm(emptyCreateForm);
      await load();
      setError(null);
    } catch (err: any) {
      setCreateError(getApiErrorMessage(err, "Failed to create championship."));
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Header Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#bb8a3c]">
              Organizer Workspace
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
              My Championships
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
              Create and coordinate your championship seasons. Set registration timelines, manage official pairings, assign referees, and oversee race day operations.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setCreateError("");
              setCreateForm(emptyCreateForm);
              setShowCreateModal(true);
            }}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#bb8a3c] px-5 text-sm font-black text-[#1c1816] hover:bg-[#cfa24f] transition focus:outline-none focus:ring-2 focus:ring-[#bb8a3c] focus:ring-offset-2"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Create Championship
          </button>
        </div>
      </div>

      {error && (
        <div
          className="rounded-lg border border-rose-100 bg-rose-50 px-5 py-4 text-sm font-bold text-rose-700"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* Toolbar filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search championships by name, code or location..."
            className="w-full rounded-md border border-slate-300 py-2 pl-9 pr-3 text-sm font-semibold text-slate-900 placeholder:text-slate-450 focus:border-[#bb8a3c] focus:outline-none focus:ring-2 focus:ring-[#bb8a3c]/20"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-slate-300 py-2 pl-3 pr-8 text-sm font-semibold text-slate-900 focus:border-[#bb8a3c] focus:outline-none focus:ring-2 focus:ring-[#bb8a3c]/20 sm:w-48 cursor-pointer"
        >
          <option value="ALL">All Statuses</option>
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

      {/* Championships Display Area */}
      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-64 animate-pulse rounded-xl border border-slate-200 bg-white"
            />
          ))}
        </div>
      ) : tournaments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-350 bg-slate-50/50 px-8 py-16 text-center">
          <Trophy className="mx-auto h-12 w-12 text-slate-400" aria-hidden="true" />
          <h3 className="mt-4 text-lg font-black text-slate-900">No championships hosted yet</h3>
          <p className="mt-2 text-sm text-slate-500">
            Get started by creating your first official horse racing championship season.
          </p>
        </div>
      ) : filteredTournaments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-350 bg-slate-50/50 px-8 py-16 text-center">
          <Search className="mx-auto h-12 w-12 text-slate-400" aria-hidden="true" />
          <h3 className="mt-4 text-lg font-black text-slate-900">No matching results</h3>
          <p className="mt-2 text-sm text-slate-500">
            No championships match the chosen filters or search query.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTournaments.map((t) => {
            const statusStyle =
              statusBadgeStyle[t.status] ??
              "border-slate-200 bg-slate-50 text-slate-700";

            return (
              <article
                key={t.id}
                className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white shadow-sm transition-transform hover:-translate-y-1 hover:shadow-md duration-300"
              >
                <div className="p-5">
                  {/* Card Badge Header */}
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-xs font-black tracking-wider text-slate-400">
                      {t.code}
                    </span>
                    <span
                      className={`rounded-md border px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${statusStyle}`}
                    >
                      {t.status.replace(/_/g, " ")}
                    </span>
                  </div>

                  {/* Championship Title */}
                  <h3 className="mt-3 text-lg font-bold text-slate-950 line-clamp-2">
                    {t.name}
                  </h3>

                  {t.description && (
                    <p className="mt-2 text-xs font-medium text-slate-500 line-clamp-2">
                      {t.description}
                    </p>
                  )}

                  {/* Details Meta list */}
                  <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                      <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                      <span className="truncate">{t.location || "TBD Location"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                      <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                      <span>
                        {formatDate(t.startDate)} – {formatDate(t.endDate)}
                      </span>
                    </div>
                    {t.maxHorses && (
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                        <Users className="h-3.5 w-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                        <span>Max Cap: {t.maxHorses} horses</span>
                      </div>
                    )}
                    {t.totalPrizePool !== undefined && t.totalPrizePool !== null && (
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                        <Trophy className="h-3.5 w-3.5 text-[#bb8a3c] shrink-0" aria-hidden="true" />
                        <span>Prize Pool: <strong className="text-[#bb8a3c]">{t.totalPrizePool.toLocaleString()} VND</strong></span>
                      </div>
                    )}
                  </div>

                  {t.status === "PENDING_APPROVAL" && (
                    <div className="mt-3 flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 p-2 text-xs font-bold text-amber-800">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      <span>Awaiting Admin Gate Approval</span>
                    </div>
                  )}

                  {t.status === "APPROVED" && (
                    <div className="mt-3 flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 p-2 text-xs font-bold text-emerald-800">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Ready to Open Registration</span>
                    </div>
                  )}

                  {t.status === "DRAFT" && t.rejectionReason && (
                    <div className="mt-3 rounded-md border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-800">
                      <p className="font-black">Rejection Reason:</p>
                      <p className="mt-0.5 font-medium leading-4">{t.rejectionReason}</p>
                    </div>
                  )}
                </div>

                {/* Card Action Footer */}
                <div className="border-t border-slate-100 bg-slate-50/50 p-4">
                  <Link
                    to={`/organizer/tournaments/${t.id}`}
                    className="flex min-h-10 w-full items-center justify-center rounded-md bg-[#bb8a3c] text-xs font-black uppercase tracking-wider text-[#1c1816] hover:bg-[#cfa24f] transition duration-200 shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-[#bb8a3c]"
                  >
                    Manage Championship
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* CREATE CHAMPIONSHIP MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
          <div
            aria-labelledby="create-championship-title"
            className="w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-2xl"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4 bg-slate-50">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-[#bb8a3c]">
                  New Season Setup
                </p>
                <h2 id="create-championship-title" className="text-xl font-black text-slate-950">
                  Create Championship
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="rounded-md p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-800"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit}>
              <div className="grid gap-4 p-6 sm:grid-cols-2 max-h-[70vh] overflow-y-auto premium-scrollbar">
                {createError && (
                  <div className="sm:col-span-2 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm font-bold text-rose-700">
                    {createError}
                  </div>
                )}

                <div className="sm:col-span-2">
                  <label htmlFor="create-name" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Championship Name *
                  </label>
                  <input
                    id="create-name"
                    type="text"
                    required
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#bb8a3c] focus:outline-none focus:ring-2 focus:ring-[#bb8a3c]/20"
                    placeholder="Continental Crown Championship 2026"
                  />
                </div>

                <div>
                  <label htmlFor="create-code" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Championship Code *
                  </label>
                  <input
                    id="create-code"
                    type="text"
                    required
                    value={createForm.code}
                    onChange={(e) => setCreateForm({ ...createForm, code: e.target.value })}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#bb8a3c] focus:outline-none focus:ring-2 focus:ring-[#bb8a3c]/20"
                    placeholder="CCC_2026"
                  />
                </div>

                <div>
                  <label htmlFor="create-location" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Location *
                  </label>
                  <input
                    id="create-location"
                    type="text"
                    required
                    value={createForm.location}
                    onChange={(e) => setCreateForm({ ...createForm, location: e.target.value })}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#bb8a3c] focus:outline-none focus:ring-2 focus:ring-[#bb8a3c]/20"
                    placeholder="Saigon Racing Center, HCMC"
                  />
                </div>

                <div>
                  <label htmlFor="create-start" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Start Date *
                  </label>
                  <input
                    id="create-start"
                    type="date"
                    required
                    value={createForm.startDate}
                    onChange={(e) => setCreateForm({ ...createForm, startDate: e.target.value })}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#bb8a3c] focus:outline-none focus:ring-2 focus:ring-[#bb8a3c]/20"
                  />
                </div>

                <div>
                  <label htmlFor="create-end" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    End Date *
                  </label>
                  <input
                    id="create-end"
                    type="date"
                    required
                    value={createForm.endDate}
                    onChange={(e) => setCreateForm({ ...createForm, endDate: e.target.value })}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#bb8a3c] focus:outline-none focus:ring-2 focus:ring-[#bb8a3c]/20"
                  />
                </div>

                <div>
                  <label htmlFor="create-reg-start" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Registration Start Time *
                  </label>
                  <input
                    id="create-reg-start"
                    type="datetime-local"
                    required
                    value={createForm.registrationStartAt}
                    onChange={(e) => setCreateForm({ ...createForm, registrationStartAt: e.target.value })}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#bb8a3c] focus:outline-none focus:ring-2 focus:ring-[#bb8a3c]/20"
                  />
                </div>

                <div>
                  <label htmlFor="create-reg-end" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Registration End Time *
                  </label>
                  <input
                    id="create-reg-end"
                    type="datetime-local"
                    required
                    value={createForm.registrationEndAt}
                    onChange={(e) => setCreateForm({ ...createForm, registrationEndAt: e.target.value })}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#bb8a3c] focus:outline-none focus:ring-2 focus:ring-[#bb8a3c]/20"
                  />
                </div>

                <div>
                  <label htmlFor="create-max-horses" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Max Horse Capacity
                  </label>
                  <input
                    id="create-max-horses"
                    type="number"
                    min={1}
                    value={createForm.maxHorses}
                    onChange={(e) => setCreateForm({ ...createForm, maxHorses: e.target.value })}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#bb8a3c] focus:outline-none focus:ring-2 focus:ring-[#bb8a3c]/20"
                    placeholder="Unlimited"
                  />
                </div>

                <div>
                  <label htmlFor="create-max-horses-owner" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Max Horses Per Owner *
                  </label>
                  <input
                    id="create-max-horses-owner"
                    type="number"
                    min={1}
                    required
                    value={createForm.maxHorsesPerOwner}
                    onChange={(e) => setCreateForm({ ...createForm, maxHorsesPerOwner: e.target.value })}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#bb8a3c] focus:outline-none focus:ring-2 focus:ring-[#bb8a3c]/20"
                  />
                </div>

                <div>
                  <label htmlFor="create-prizepool" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Total Prize Pool (VND) *
                  </label>
                  <input
                    id="create-prizepool"
                    type="number"
                    min={0}
                    required
                    value={createForm.totalPrizePool}
                    onChange={(e) => setCreateForm({ ...createForm, totalPrizePool: e.target.value })}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#bb8a3c] focus:outline-none focus:ring-2 focus:ring-[#bb8a3c]/20"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="create-desc" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Description / About
                  </label>
                  <textarea
                    id="create-desc"
                    rows={3}
                    value={createForm.description}
                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#bb8a3c] focus:outline-none focus:ring-2 focus:ring-[#bb8a3c]/20"
                    placeholder="Describe the season details, prizes, or restrictions..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm font-bold text-slate-650 hover:bg-slate-150"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-md bg-[#bb8a3c] px-5 py-2 text-sm font-bold text-[#1c1816] hover:bg-[#cfa24f] disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
