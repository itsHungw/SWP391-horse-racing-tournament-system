import { useEffect, useState } from "react";
import { resolveFileUrl } from "../../utils/fileUrl";
import { useParams, useNavigate } from "react-router-dom";
import {
  getAdminUserDetail,
  getAdminUserRoleHistory,
  updateAdminUserProfile,
  updateAdminUserRoles,
  deleteAdminUser,
} from "../../api/adminUserApi";
import { AdminUserDetail, UserRoleHistoryItem } from "../../types/adminUser";
import { useClientSession } from "../../hooks/useClientSession";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { AdminLayout } from "../../layouts/AdminLayout";

const AVAILABLE_ROLES = [
  { name: "ADMIN", label: "Admin" },
  { name: "HORSE_OWNER", label: "Horse Owner" },
  { name: "JOCKEY", label: "Jockey" },
  { name: "REFEREE", label: "Referee" },
  { name: "SPECTATOR", label: "Spectator" },
];

export function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const userId = Number(id);

  useDocumentTitle(`User Details - ${userId}`);

  const { session } = useClientSession();

  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [history, setHistory] = useState<UserRoleHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"profile" | "roles" | "history">("profile");

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    fullName: "",
    phone: "",
    gender: "",
    dateOfBirth: "",
    address: "",
    status: "",
  });

  // Roles Form State
  const [selectedRoleNames, setSelectedRoleNames] = useState<string[]>([]);
  const [auditReason, setAuditReason] = useState("");

  // Submitting States
  const [submittingProfile, setSubmittingProfile] = useState(false);
  const [submittingRoles, setSubmittingRoles] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToast({ text, type });
    window.setTimeout(() => setToast(null), 3000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const userDetail = await getAdminUserDetail(userId);
      setUser(userDetail);
      setProfileForm({
        fullName: userDetail.fullName,
        phone: userDetail.phone || "",
        gender: userDetail.gender || "MALE",
        dateOfBirth: userDetail.dateOfBirth || "",
        address: userDetail.address || "",
        status: userDetail.status,
      });

      setSelectedRoleNames(AVAILABLE_ROLES.filter((r) => userDetail.roles.includes(r.name)).map((r) => r.name));

      // Load Audit History
      const historyData = await getAdminUserRoleHistory(userId);
      if (Array.isArray(historyData)) {
        setHistory(historyData.slice(0, 20)); // Limit to 20 items
      } else {
        setHistory([]);
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to load user details", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      loadData();
    }
  }, [userId]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingProfile(true);
    try {
      await updateAdminUserProfile(userId, profileForm);
      showToast("Profile updated successfully!");
      loadData();
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.message || "Failed to update profile", "error");
    } finally {
      setSubmittingProfile(false);
    }
  };

  const handleRolesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingRoles(true);
    try {
      await updateAdminUserRoles(userId, selectedRoleNames, auditReason);
      showToast("Roles updated successfully!");
      setAuditReason("");
      loadData();
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.message || "Failed to update roles", "error");
    } finally {
      setSubmittingRoles(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    try {
      await deleteAdminUser(userId);
      showToast("User deleted successfully!");
      navigate("/admin/users");
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.message || "Failed to delete user", "error");
    } finally {
      setDeleting(false);
      setShowConfirmDelete(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#b3193a] border-t-transparent" />
        </div>
      </AdminLayout>
    );
  }

  if (!user) {
    return (
      <AdminLayout>
        <div className="flex h-64 flex-col items-center justify-center text-slate-500">
          <p className="font-bold">User not found</p>
          <button onClick={() => navigate("/admin/users")} className="mt-4 text-[#b3193a] underline">
            Go back to list
          </button>
        </div>
      </AdminLayout>
    );
  }

  const isSelf = session?.email?.toLowerCase() === user.email.toLowerCase();

  // Check if roles have changed to toggle save button state
  const initialRoleNames = AVAILABLE_ROLES.filter((r) => user.roles.includes(r.name)).map((r) => r.name);
  const rolesChanged =
    selectedRoleNames.length !== initialRoleNames.length ||
    !selectedRoleNames.every((name) => initialRoleNames.includes(name));

  return (
    <AdminLayout>
      <div className="relative space-y-6">
        {toast && (
          <div
            className="fixed right-4 top-4 z-50 flex items-center rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-lg"
            role="status"
          >
            <span
              className={`mr-2 h-2.5 w-2.5 rounded-full ${
                toast.type === "success" ? "bg-emerald-500" : "bg-rose-500"
              }`}
            />
            <p className="text-sm font-bold text-slate-800">{toast.text}</p>
          </div>
        )}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <img
              src={resolveFileUrl(user.avatarUrl) || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&h=80"}
              alt={user.fullName}
              className="h-16 w-16 rounded-full border border-slate-200 object-cover shadow-sm"
            />
            <div>
              <h1 className="text-2xl font-black text-[#070f4f]">{user.fullName}</h1>
              <p className="text-sm text-slate-500">{user.email}</p>
            </div>
          </div>
          <button
            onClick={() => navigate("/admin/users")}
            className="text-sm font-bold text-slate-600 hover:text-slate-800"
          >
            &larr; Back to users
          </button>
        </div>

        {/* Tab Headers */}
        <div className="border-b border-[#d8d8d8]">
          <nav className="flex gap-6">
            <button
              onClick={() => setActiveTab("profile")}
              className={`pb-4 text-sm font-bold border-b-2 ${
                activeTab === "profile" ? "border-[#b3193a] text-[#b3193a]" : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              Profile Info
            </button>
            <button
              onClick={() => setActiveTab("roles")}
              className={`pb-4 text-sm font-bold border-b-2 ${
                activeTab === "roles" ? "border-[#b3193a] text-[#b3193a]" : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              Role Management
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`pb-4 text-sm font-bold border-b-2 ${
                activeTab === "history" ? "border-[#b3193a] text-[#b3193a]" : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              Role Audit History
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="rounded-lg border border-[#d8d8d8] bg-white p-6 shadow-sm">
          {activeTab === "profile" && (
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700">Full Name</label>
                  <input
                    required
                    type="text"
                    value={profileForm.fullName}
                    onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700">Phone</label>
                  <input
                    type="text"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700">Gender</label>
                  <select
                    value={profileForm.gender}
                    onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700">Date of Birth</label>
                  <input
                    type="date"
                    max={new Date().toISOString().split("T")[0]}
                    value={profileForm.dateOfBirth}
                    onChange={(e) => setProfileForm({ ...profileForm, dateOfBirth: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">Address</label>
                <input
                  type="text"
                  value={profileForm.address}
                  onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">Account Status</label>
                <select
                  value={profileForm.status}
                  disabled={isSelf}
                  onChange={(e) => setProfileForm({ ...profileForm, status: e.target.value })}
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm disabled:opacity-50"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="PENDING_EMAIL_VERIFY">Pending Email Verification</option>
                  <option value="BANNED">Banned</option>
                </select>
                {isSelf && (
                  <p className="mt-1 text-xs text-rose-500">You cannot modify your own account status.</p>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                <button
                  type="button"
                  disabled={isSelf}
                  onClick={() => setShowConfirmDelete(true)}
                  className="rounded border border-rose-300 bg-white px-4 py-2 text-sm font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                >
                  Ban Account
                </button>
                <button
                  type="submit"
                  disabled={submittingProfile}
                  className="rounded bg-[#070f4f] px-6 py-2 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  {submittingProfile ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          )}

          {activeTab === "roles" && (
            <form onSubmit={handleRolesSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-black uppercase tracking-[0.14em] text-slate-500 mb-2">Assign Roles</label>
                <div className="space-y-2">
                  {AVAILABLE_ROLES.map((role) => {
                    const isChecked = selectedRoleNames.includes(role.name);
                    return (
                      <label key={role.name} className={`flex items-center gap-3 rounded-lg border border-slate-200 p-3 hover:bg-slate-50 ${
                        role.name === "SPECTATOR" ? "opacity-50 cursor-not-allowed bg-slate-50" : "cursor-pointer"
                      }`}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={role.name === "SPECTATOR"}
                          onChange={() => {
                            if (isChecked) {
                              setSelectedRoleNames(selectedRoleNames.filter((name) => name !== role.name));
                            } else {
                              setSelectedRoleNames([...selectedRoleNames, role.name]);
                            }
                          }}
                          className="h-4 w-4 rounded border-slate-300 text-[#b3193a] focus:ring-[#b3193a] disabled:opacity-50"
                        />
                        <div>
                          <span className="font-bold text-slate-800">{role.label}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">Reason for Role Change</label>
                <input
                  type="text"
                  placeholder="Updated by admin"
                  value={auditReason}
                  onChange={(e) => setAuditReason(e.target.value)}
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none"
                />
              </div>

              <div className="flex justify-end border-t border-slate-100 pt-4">
                <button
                  type="submit"
                  disabled={submittingRoles || !rolesChanged}
                  className="rounded bg-[#070f4f] px-6 py-2 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  {submittingRoles ? "Updating..." : "Update Roles"}
                </button>
              </div>
            </form>
          )}

          {activeTab === "history" && (
            <div className="overflow-x-auto">
              {history.length === 0 ? (
                <div className="flex h-32 items-center justify-center text-slate-500 text-sm">
                  No role changes have been logged.
                </div>
              ) : (
                (() => {
                  // Group history records by timestamp (seconds)
                  const groups: { [key: string]: UserRoleHistoryItem[] } = {};
                  history.forEach((item) => {
                    const timeKey = item.changedAt.split(".")[0];
                    if (!groups[timeKey]) {
                      groups[timeKey] = [];
                    }
                    groups[timeKey].push(item);
                  });

                  const groupedItems = Object.keys(groups).map((timeKey) => {
                    const group = groups[timeKey];
                    const first = group[0];

                    const added = group
                      .filter((x) => x.newStatus === "ACTIVE" && x.oldStatus !== "ACTIVE" && x.roleName !== "SPECTATOR")
                      .map((x) => x.roleName);

                    const removed = group
                      .filter((x) => x.newStatus === "REMOVED" && x.roleName !== "SPECTATOR")
                      .map((x) => x.roleName);

                    let transitionText = "";
                    if (added.length > 0 && removed.length > 0) {
                      transitionText = `${removed.join(", ")} ➔ ${added.join(", ")}`;
                    } else if (added.length > 0) {
                      transitionText = `NONE ➔ ${added.join(", ")}`;
                    } else if (removed.length > 0) {
                      transitionText = `${removed.join(", ")} ➔ NONE`;
                    } else {
                      transitionText = group.map((x) => `${x.roleName}: ${x.oldStatus || "NEW"} ➔ ${x.newStatus}`).join(" | ");
                    }

                    return {
                      id: first.id,
                      changedAt: first.changedAt,
                      changedBy: first.changedBy,
                      reason: first.reason,
                      transitionText,
                    };
                  });

                  return (
                    <table className="min-w-full text-left text-sm">
                      <thead className="bg-[#f7f7f7] text-xs uppercase tracking-[0.14em] text-slate-500">
                        <tr>
                          <th className="px-4 py-3">Date</th>
                          <th className="px-4 py-3">Transition</th>
                          <th className="px-4 py-3">Changed By</th>
                          <th className="px-4 py-3">Reason</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {groupedItems.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3 text-slate-500">
                              {new Date(item.changedAt).toLocaleString()}
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-bold text-[#b3193a]">{item.transitionText}</span>
                            </td>
                            <td className="px-4 py-3 font-bold text-slate-800">
                              {item.changedBy ? item.changedBy.fullName : "System"}
                            </td>
                            <td className="px-4 py-3 text-slate-600">{item.reason || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  );
                })()
              )}
            </div>
          )}
        </div>

        {/* Soft Delete Confirm Modal */}
        {showConfirmDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
              <h2 className="text-xl font-black text-rose-600">Ban User Account</h2>
              <p className="mt-3 text-sm text-slate-600">
                Are you sure you want to ban <strong>{user.fullName}</strong>? Banned users will not be able to log in or operate on the system.
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowConfirmDelete(false)}
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
                  {deleting ? "Banning..." : "Confirm Ban"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
