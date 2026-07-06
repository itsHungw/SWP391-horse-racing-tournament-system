import { useEffect, useState } from "react";
import { resolveFileUrl } from "../../utils/fileUrl";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { getAdminUsers, createAdminUser } from "../../api/adminUserApi";
import { AdminUserDetail } from "../../types/adminUser";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { AdminLayout } from "../../layouts/AdminLayout";

export function AdminUserListPage() {
  useDocumentTitle("Manage Users");

  const [users, setUsers] = useState<AdminUserDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  
  // Pagination
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const size = 10;

  // Create User Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
    gender: "MALE",
    dateOfBirth: "",
    address: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToast({ text, type });
    window.setTimeout(() => setToast(null), 3000);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await getAdminUsers(searchQuery, selectedStatus, selectedRole, page, size);
      setUsers(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (err) {
      console.error(err);
      showToast("Failed to load users list", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [searchQuery, selectedRole, selectedStatus, page]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createAdminUser({
        ...createForm,
        roleIds: [], // Defaults to regular user without special roles initially
      });
      showToast("User created successfully!");
      setIsCreateOpen(false);
      setCreateForm({
        fullName: "",
        email: "",
        password: "",
        phone: "",
        gender: "MALE",
        dateOfBirth: "",
        address: "",
      });
      fetchUsers();
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.message || "Failed to create user", "error");
    } finally {
      setSubmitting(false);
    }
  };

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

        {/* Title Header Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b3193a]">Gate 2 · Identity controls</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-[#070f4f]">User Management</h1>
            <p className="mt-2 text-sm text-slate-500">
              Manage accounts, verify profiles, edit active roles, and review audit logs.
            </p>
          </div>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex min-h-11 items-center justify-center rounded-lg bg-emerald-600 px-5 text-sm font-black text-white hover:bg-emerald-700 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b3193a] transition"
            type="button"
          >
            Create User
          </button>
        </div>

        {/* Operations Filter Bar */}
        <div className="grid gap-4 md:grid-cols-[1fr_200px_200px] bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          {/* Search box */}
          <div className="relative">
            <Search aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(0);
              }}
              className="min-h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#b3193a] focus:ring-2 focus:ring-[#b3193a]/10"
            />
          </div>

          {/* Role Filter */}
          <div>
            <select
              value={selectedRole}
              onChange={(e) => {
                setSelectedRole(e.target.value);
                setPage(0);
              }}
              className="min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800 outline-none transition focus:border-[#b3193a] focus:ring-2 focus:ring-[#b3193a]/10"
            >
              <option value="">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="HORSE_OWNER">Horse Owner</option>
              <option value="JOCKEY">Jockey</option>
              <option value="REFEREE">Referee</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(0);
              }}
              className="min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800 outline-none transition focus:border-[#b3193a] focus:ring-2 focus:ring-[#b3193a]/10"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="PENDING_EMAIL_VERIFY">Pending Verification</option>
              <option value="BANNED">Banned</option>
            </select>
          </div>
        </div>

        {/* User Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#b3193a] border-t-transparent" />
            </div>
          ) : users.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center text-slate-500">
              <p className="font-bold">No users found</p>
              <p className="text-sm">Try adjusting your filters or search query.</p>
            </div>
          ) : (
            <>
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-[0.14em] text-slate-500 font-semibold">
                  <tr>
                    <th className="px-5 py-3">User</th>
                    <th className="px-5 py-3">Phone</th>
                    <th className="px-5 py-3">Roles</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ececec]">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-[#fafafa]">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={resolveFileUrl(user.avatarUrl) || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&h=80"}
                            alt={user.fullName}
                            className="h-10 w-10 rounded-full border border-slate-200 object-cover"
                          />
                          <div>
                            <p className="font-black text-[#171717]">{user.fullName}</p>
                            <p className="text-xs text-slate-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-600">{user.phone || "—"}</td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1">
                          {user.roles.length === 0 ? (
                            <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">SPECTATOR</span>
                          ) : (
                            user.roles.map((role) => (
                              <span
                                key={role}
                                className={`rounded px-2 py-0.5 text-xs font-bold uppercase ${
                                  role === "ADMIN"
                                    ? "bg-rose-100 text-rose-700"
                                    : role === "JOCKEY"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : role === "HORSE_OWNER"
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-blue-100 text-blue-700"
                                }`}
                              >
                                {role}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            user.status === "ACTIVE"
                              ? "bg-emerald-100 text-emerald-800"
                              : user.status === "BANNED"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {user.status === "ACTIVE" ? "Active" : user.status === "BANNED" ? "Banned" : "Unverified"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <Link
                          to={`/admin/users/${user.id}`}
                          className="font-bold text-[#b3193a] underline hover:text-[#070f4f]"
                        >
                          Manage
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination Controls */}
              <div className="flex items-center justify-between border-t border-[#d8d8d8] px-5 py-4">
                <span className="text-xs text-slate-500">
                  Showing {page * size + 1} to {Math.min((page + 1) * size, totalElements)} of {totalElements} users
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={page === 0}
                    onClick={() => setPage((p) => p - 1)}
                    className="rounded border border-slate-300 px-3 py-1 text-sm disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage((p) => p + 1)}
                    className="rounded border border-slate-300 px-3 py-1 text-sm disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Create User Modal */}
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
              <h2 className="text-xl font-black text-[#070f4f]">Create New User Account</h2>
              <form onSubmit={handleCreateSubmit} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700">Full Name</label>
                  <input
                    required
                    type="text"
                    value={createForm.fullName}
                    onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#b3193a]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700">Email Address</label>
                  <input
                    required
                    type="email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#b3193a]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700">Initial Password</label>
                  <input
                    required
                    type="password"
                    minLength={6}
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#b3193a]"
                  />
                </div>

                <div className="grid gap-4 grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700">Phone</label>
                    <input
                      type="text"
                      value={createForm.phone}
                      onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                      className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700">Gender</label>
                    <select
                      value={createForm.gender}
                      onChange={(e) => setCreateForm({ ...createForm, gender: e.target.value })}
                      className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none"
                    >
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700">Date of Birth</label>
                  <input
                    type="date"
                    max={new Date().toISOString().split("T")[0]}
                    value={createForm.dateOfBirth}
                    onChange={(e) => setCreateForm({ ...createForm, dateOfBirth: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700">Address</label>
                  <input
                    type="text"
                    value={createForm.address}
                    onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="rounded border border-slate-300 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded bg-[#070f4f] px-4 py-2 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-50"
                  >
                    {submitting ? "Creating..." : "Create Account"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
