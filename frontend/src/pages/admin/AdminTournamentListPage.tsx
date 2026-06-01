import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "../../layouts/AdminLayout";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import {
  getAdminTournaments,
  createTournament,
  CreateTournamentPayload,
} from "../../api/adminTournamentApi";
import type { Tournament } from "../../types/racing";

export function AdminTournamentListPage() {
  useDocumentTitle("Tournaments admin");

  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [form, setForm] = useState<CreateTournamentPayload>({
    name: "",
    code: "",
    description: "",
    location: "",
    startDate: "",
    endDate: "",
    registrationStartAt: "",
    registrationEndAt: "",
    maxHorses: undefined,
  });

  const [formError, setFormError] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getAdminTournaments();
      setTournaments(data);
    } catch (err) {
      console.error("Failed to load tournaments", err);
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

    if (new Date(form.endDate) < new Date(form.startDate)) {
      setFormError("Tournament End Date cannot be before Start Date.");
      return;
    }

    if (new Date(form.registrationEndAt) < new Date(form.registrationStartAt)) {
      setFormError("Registration End Time cannot be before Start Time.");
      return;
    }

    try {
      setSubmitting(true);
      await createTournament({
        ...form,
        maxHorses: form.maxHorses ? Number(form.maxHorses) : undefined,
      });
      setShowCreateModal(false);
      setForm({
        name: "",
        code: "",
        description: "",
        location: "",
        startDate: "",
        endDate: "",
        registrationStartAt: "",
        registrationEndAt: "",
        maxHorses: undefined,
      });
      loadData();
    } catch (err: any) {
      setFormError(err.response?.data?.message || "Failed to create tournament.");
    } finally {
      setSubmitting(false);
    }
  };

  // Filters
  const filteredTournaments = tournaments.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.code || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "" || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate Overview Stats
  const totalCount = tournaments.length;
  const ongoingCount = tournaments.filter((t) => t.status === "ONGOING").length;
  const openRegCount = tournaments.filter((t) => t.status === "OPEN_REGISTRATION").length;

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6">
        {/* Page Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#b3193a]">
              Ecosystem control
            </p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900">
              Tournaments
            </h1>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="self-start rounded bg-[#b3193a] px-5 py-2.5 text-sm font-bold text-white shadow transition hover:bg-[#92122d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b3193a]"
          >
            Create Tournament
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-5 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Tournaments
            </p>
            <p className="mt-2 text-3xl font-black text-slate-900">{totalCount}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Active / Ongoing
            </p>
            <p className="mt-2 text-3xl font-black text-[#070f4f]">{ongoingCount}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Open Registration
            </p>
            <p className="mt-2 text-3xl font-black text-emerald-600">{openRegCount}</p>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
          <div className="flex-1">
            <label className="sr-only" htmlFor="search-tournaments">
              Search by name or code
            </label>
            <input
              id="search-tournaments"
              type="text"
              placeholder="Search tournaments by name or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-[#b3193a] focus:outline-none"
            />
          </div>
          <div className="w-full sm:w-48">
            <label className="sr-only" htmlFor="status-filter">
              Filter by status
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-[#b3193a] focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="OPEN_REGISTRATION">Open Registration</option>
              <option value="CLOSED_REGISTRATION">Closed Registration</option>
              <option value="ONGOING">Ongoing</option>
              <option value="COMPLETED">Completed</option>
              <option value="POSTPONED">Postponed</option>
            </select>
          </div>
        </div>

        {/* Tournaments List Table */}
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#b3193a] border-t-transparent" />
            </div>
          ) : filteredTournaments.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center p-6 text-center">
              <p className="text-lg font-bold text-slate-700">No tournaments found</p>
              <p className="mt-1 text-sm text-slate-500">
                Try adjusting your search filters or create a new tournament.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-6 py-4">Code</th>
                    <th className="px-6 py-4">Tournament Name</th>
                    <th className="px-6 py-4">Location</th>
                    <th className="px-6 py-4">Max Horses</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Dates</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTournaments.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/50">
                      <td className="whitespace-nowrap px-6 py-4 font-mono font-bold text-[#070f4f]">
                        {t.code || "—"}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900">{t.name}</td>
                      <td className="px-6 py-4 text-slate-600">{t.location || "—"}</td>
                      <td className="px-6 py-4 text-slate-600">{t.maxHorses || "Unlimited"}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                            t.status === "OPEN_REGISTRATION"
                              ? "bg-emerald-100 text-emerald-800"
                              : t.status === "ONGOING"
                              ? "bg-blue-100 text-blue-800"
                              : t.status === "COMPLETED"
                              ? "bg-purple-100 text-purple-800"
                              : t.status === "POSTPONED"
                              ? "bg-orange-100 text-orange-800"
                              : t.status === "CLOSED_REGISTRATION"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-slate-100 text-slate-800"
                          }`}
                        >
                          {t.status === "POSTPONED" ? "POSTPONED" : t.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        <div>
                          Start: <strong className="text-slate-700">{t.startDate}</strong>
                        </div>
                        <div>
                          End: <strong className="text-slate-700">{t.endDate}</strong>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right">
                        <Link
                          to={`/admin/tournaments/${t.id}`}
                          className="font-bold text-[#b3193a] underline hover:text-[#070f4f]"
                        >
                          Manage
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl overflow-hidden rounded-lg bg-white shadow-xl">
            <div className="border-b border-slate-100 px-6 py-4">
              <h2 className="text-xl font-black text-slate-900">Create New Tournament</h2>
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
                      Tournament Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-[#b3193a] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Tournament Code *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.code}
                      onChange={(e) => setForm({ ...form, code: e.target.value })}
                      className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-[#b3193a] focus:outline-none"
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
                      className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-[#b3193a] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Tournament Start Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={form.startDate}
                      onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                      className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-[#b3193a] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Tournament End Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={form.endDate}
                      onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                      className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-[#b3193a] focus:outline-none"
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
                      className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-[#b3193a] focus:outline-none"
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
                      className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-[#b3193a] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Max Horse Participants (Optional)
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
                      className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-[#b3193a] focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Description
                    </label>
                    <textarea
                      rows={3}
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-[#b3193a] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded border border-slate-300 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded bg-[#b3193a] px-4 py-2 text-sm font-bold text-white hover:bg-[#92122d] disabled:opacity-50"
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
