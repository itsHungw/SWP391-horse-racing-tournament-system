import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { AdminLayout } from "../../layouts/AdminLayout";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import {
  getTournamentDetail,
  updateTournament,
  deleteTournament,
  updateTournamentStatus,
  CreateTournamentPayload,
} from "../../api/adminTournamentApi";
import type { Tournament } from "../../types/racing";

export function AdminTournamentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const tournamentId = Number(id);

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"settings" | "races" | "registrations">("settings");

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

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Modals
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState<{ show: boolean; targetStatus: string }>({
    show: false,
    targetStatus: "",
  });
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useDocumentTitle(tournament ? `${tournament.name} detail` : "Tournament detail");

  const loadDetail = async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      const data = await getTournamentDetail(tournamentId);
      setTournament(data);
      setForm({
        name: data.name,
        code: data.code || "",
        description: data.description || "",
        location: data.location || "",
        startDate: data.startDate || "",
        endDate: data.endDate || "",
        registrationStartAt: data.registrationStartAt || "",
        registrationEndAt: data.registrationEndAt || "",
        maxHorses: data.maxHorses || undefined,
      });
    } catch (err: any) {
      setErrorMsg("Failed to load tournament detail.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tournamentId) {
      loadDetail();
    }
  }, [tournamentId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!form.name || !form.code || !form.location || !form.startDate || !form.endDate || !form.registrationStartAt || !form.registrationEndAt) {
      setErrorMsg("Please fill in all required fields.");
      return;
    }

    if (new Date(form.endDate) < new Date(form.startDate)) {
      setErrorMsg("Tournament End Date cannot be before Start Date.");
      return;
    }

    if (new Date(form.registrationEndAt) < new Date(form.registrationStartAt)) {
      setErrorMsg("Registration End Time cannot be before Start Time.");
      return;
    }

    try {
      setSaving(true);
      await updateTournament(tournamentId, {
        ...form,
        maxHorses: form.maxHorses ? Number(form.maxHorses) : undefined,
      });
      setSuccessMsg("Tournament settings updated successfully.");
      loadDetail();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Failed to update tournament.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      setDeleting(true);
      await deleteTournament(tournamentId);
      setShowDeleteModal(false);
      navigate("/admin/tournaments");
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Failed to delete tournament.");
      setShowDeleteModal(false);
    } finally {
      setDeleting(false);
    }
  };

  const handleStatusTransition = async () => {
    const { targetStatus } = showStatusModal;
    try {
      setUpdatingStatus(true);
      await updateTournamentStatus(tournamentId, targetStatus);
      setShowStatusModal({ show: false, targetStatus: "" });
      setSuccessMsg(`Status updated successfully to ${targetStatus === "CANCELLED" ? "SUSPENDED" : targetStatus.replace("_", " ")}.`);
      loadDetail();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Failed to update tournament status.");
      setShowStatusModal({ show: false, targetStatus: "" });
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading && !tournament) {
    return (
      <AdminLayout>
        <div className="flex h-96 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#b3193a] border-t-transparent" />
        </div>
      </AdminLayout>
    );
  }

  if (!tournament) {
    return (
      <AdminLayout>
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
          <p className="text-lg font-bold text-slate-700">Tournament not found</p>
          <Link to="/admin/tournaments" className="mt-4 inline-block font-bold text-[#b3193a] underline">
            Back to Tournaments
          </Link>
        </div>
      </AdminLayout>
    );
  }

  const isLocked = ["ONGOING", "COMPLETED", "CANCELLED"].includes(tournament.status);
  const isDraft = tournament.status === "DRAFT";

  // Calculate status badge style
  const getBadgeStyle = (status: string) => {
    switch (status) {
      case "OPEN_REGISTRATION":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "ONGOING":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "COMPLETED":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "CANCELLED":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "CLOSED_REGISTRATION":
        return "bg-amber-100 text-amber-800 border-amber-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
          <Link to="/admin/tournaments" className="hover:text-[#b3193a]">
            Tournaments
          </Link>
          <span>/</span>
          <span className="text-slate-800">{tournament.code || tournament.id}</span>
        </div>

        {/* Status Alert Messages */}
        {errorMsg && (
          <div className="rounded bg-rose-50 p-4 text-sm font-bold text-rose-700 border border-rose-100">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="rounded bg-emerald-50 p-4 text-sm font-bold text-emerald-700 border border-emerald-100">
            {successMsg}
          </div>
        )}

        {/* Main Header / Status Panel */}
        <div className="flex flex-col gap-5 rounded-lg border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <span className={`rounded border px-3 py-1.5 text-xs font-black tracking-wider uppercase ${getBadgeStyle(tournament.status)}`}>
              {tournament.status === "CANCELLED" ? "SUSPENDED" : tournament.status.replace("_", " ")}
            </span>
            <div>
              <h1 className="text-2xl font-black text-slate-900">{tournament.name}</h1>
              <p className="text-xs font-bold text-slate-500 mt-0.5">
                Location: {tournament.location} &bull; Code: {tournament.code}
              </p>
            </div>
          </div>

          {/* Lifecycle Action Buttons */}
          <div className="flex flex-wrap gap-2">
            {tournament.status === "DRAFT" && (
              <>
                <button
                  onClick={() => setShowStatusModal({ show: true, targetStatus: "OPEN_REGISTRATION" })}
                  className="rounded bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                >
                  Open Registration
                </button>
                <button
                  onClick={() => setShowStatusModal({ show: true, targetStatus: "CANCELLED" })}
                  className="rounded border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Suspend Tournament
                </button>
              </>
            )}

            {tournament.status === "OPEN_REGISTRATION" && (
              <>
                <button
                  onClick={() => setShowStatusModal({ show: true, targetStatus: "CLOSED_REGISTRATION" })}
                  className="rounded bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700"
                >
                  Close Registration
                </button>
                <button
                  onClick={() => setShowStatusModal({ show: true, targetStatus: "ONGOING" })}
                  className="rounded bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700"
                >
                  Start Tournament
                </button>
                <button
                  onClick={() => setShowStatusModal({ show: true, targetStatus: "CANCELLED" })}
                  className="rounded border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Suspend Tournament
                </button>
              </>
            )}

            {tournament.status === "CLOSED_REGISTRATION" && (
              <>
                <button
                  onClick={() => setShowStatusModal({ show: true, targetStatus: "ONGOING" })}
                  className="rounded bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700"
                >
                  Start Tournament
                </button>
                <button
                  onClick={() => setShowStatusModal({ show: true, targetStatus: "CANCELLED" })}
                  className="rounded border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Suspend Tournament
                </button>
              </>
            )}

            {tournament.status === "ONGOING" && (
              <>
                <button
                  onClick={() => setShowStatusModal({ show: true, targetStatus: "COMPLETED" })}
                  className="rounded bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-700"
                >
                  Complete Tournament
                </button>
                <button
                  onClick={() => setShowStatusModal({ show: true, targetStatus: "CANCELLED" })}
                  className="rounded border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Suspend Tournament
                </button>
              </>
            )}

            {tournament.status === "CANCELLED" && (
              <>
                <button
                  onClick={() => setShowStatusModal({ show: true, targetStatus: "OPEN_REGISTRATION" })}
                  className="rounded bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                >
                  Reopen (Open Registration)
                </button>
                <button
                  onClick={() => setShowStatusModal({ show: true, targetStatus: "CLOSED_REGISTRATION" })}
                  className="rounded bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700"
                >
                  Reopen (Closed Registration)
                </button>
                <button
                  onClick={() => setShowStatusModal({ show: true, targetStatus: "ONGOING" })}
                  className="rounded bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700"
                >
                  Reopen (Ongoing)
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-slate-200">
          <nav className="flex gap-6 text-sm font-bold">
            <button
              onClick={() => setActiveTab("settings")}
              className={`pb-3 ${
                activeTab === "settings"
                  ? "border-b-2 border-[#b3193a] text-[#b3193a]"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Tournament Settings
            </button>
            <button
              onClick={() => setActiveTab("races")}
              className={`pb-3 ${
                activeTab === "races"
                  ? "border-b-2 border-[#b3193a] text-[#b3193a]"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Races
            </button>
            <button
              onClick={() => setActiveTab("registrations")}
              className={`pb-3 ${
                activeTab === "registrations"
                  ? "border-b-2 border-[#b3193a] text-[#b3193a]"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Registrations
            </button>
          </nav>
        </div>

        {/* Tab Contents */}
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          {activeTab === "settings" && (
            <form onSubmit={handleSave} className="flex flex-col gap-6">
              {isLocked && (
                <div className="rounded border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800">
                  This tournament is currently {tournament.status === "CANCELLED" ? "suspended" : tournament.status.toLowerCase()}. Main fields are locked for editing.
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
                    disabled={isLocked}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-slate-500 focus:border-[#b3193a] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Tournament Code *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={isLocked}
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-slate-500 focus:border-[#b3193a] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Location *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={isLocked}
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-slate-500 focus:border-[#b3193a] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Tournament Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    disabled={isLocked}
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-slate-500 focus:border-[#b3193a] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Tournament End Date *
                  </label>
                  <input
                    type="date"
                    required
                    disabled={isLocked}
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-slate-500 focus:border-[#b3193a] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Registration Start Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    disabled={isLocked}
                    value={form.registrationStartAt}
                    onChange={(e) => setForm({ ...form, registrationStartAt: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-slate-500 focus:border-[#b3193a] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Registration End Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    disabled={isLocked}
                    value={form.registrationEndAt}
                    onChange={(e) => setForm({ ...form, registrationEndAt: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-slate-500 focus:border-[#b3193a] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Max Horse Participants (Optional)
                  </label>
                  <input
                    type="number"
                    disabled={isLocked}
                    value={form.maxHorses || ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        maxHorses: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-slate-500 focus:border-[#b3193a] focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    disabled={isLocked}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-slate-500 focus:border-[#b3193a] focus:outline-none"
                  />
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                {isDraft ? (
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(true)}
                    className="rounded border border-rose-300 bg-white px-4 py-2 text-sm font-bold text-rose-600 hover:bg-rose-50"
                  >
                    Delete Tournament
                  </button>
                ) : (
                  <div />
                )}

                {!isLocked && (
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded bg-[#b3193a] px-5 py-2 text-sm font-bold text-white hover:bg-[#92122d] disabled:opacity-50"
                  >
                    {saving ? "Saving Changes..." : "Save Changes"}
                  </button>
                )}
              </div>
            </form>
          )}

          {activeTab === "races" && (
            <div className="flex h-48 flex-col items-center justify-center text-center">
              <p className="text-base font-bold text-slate-700">Races List</p>
              <p className="mt-1 text-sm text-slate-500">
                Race configuration for this tournament will appear here in the next implementation phase.
              </p>
            </div>
          )}

          {activeTab === "registrations" && (
            <div className="flex h-48 flex-col items-center justify-center text-center">
              <p className="text-base font-bold text-slate-700">Registrations Queue</p>
              <p className="mt-1 text-sm text-slate-500">
                Horse owner tournament registrations queue will appear here in the next implementation phase.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-xl font-black text-rose-600">Delete Tournament</h2>
            <p className="mt-3 text-sm text-slate-600">
              Are you sure you want to delete <strong>{tournament.name}</strong>? This action will completely remove it from the system.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="rounded border border-slate-300 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteConfirm}
                className="rounded bg-rose-600 px-4 py-2 text-sm font-bold text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Transition Modal */}
      {showStatusModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-xl font-black text-slate-900">Change Status</h2>
            <p className="mt-3 text-sm text-slate-600">
              Are you sure you want to transition this tournament status to{" "}
              <strong>{showStatusModal.targetStatus === "CANCELLED" ? "SUSPENDED" : showStatusModal.targetStatus.replace("_", " ")}</strong>?
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowStatusModal({ show: false, targetStatus: "" })}
                className="rounded border border-slate-300 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={updatingStatus}
                onClick={handleStatusTransition}
                className="rounded bg-[#b3193a] px-4 py-2 text-sm font-bold text-white hover:bg-[#92122d] disabled:opacity-50"
              >
                {updatingStatus ? "Updating..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
