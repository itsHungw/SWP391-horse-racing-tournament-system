import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { RoleRequestStatusBadge } from "../../components/RoleRequestStatusBadge";
import { RoleRequest } from "../../types/adminRoleRequest";

type Props = {
  requests: RoleRequest[];
  loading: boolean;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  onViewDetail: (id: number) => void;
  onRefresh: () => void;
};

function cvReviewLabel(status?: RoleRequest["cvReviewStatus"]) {
  return status === "PASSED" ? "CV passed" : "CV not reviewed";
}

export function AdminRoleRequestsPage({
  requests,
  loading,
  selectedStatus,
  onStatusChange,
  onViewDetail,
  onRefresh,
}: Props) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredRequests = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return requests;
    return requests.filter(
      (req) =>
        req.fullName.toLowerCase().includes(q) ||
        req.email.toLowerCase().includes(q) ||
        req.requestedRole.toLowerCase().includes(q)
    );
  }, [requests, searchTerm]);

  const sortedRequests = useMemo(() => {
    return [...filteredRequests].sort((a, b) => {
      if (a.status === "PENDING" && b.status !== "PENDING") return -1;
      if (a.status !== "PENDING" && b.status === "PENDING") return 1;
      return b.id - a.id;
    });
  }, [filteredRequests]);

  return (
    <section aria-labelledby="admin-role-requests-title" className="space-y-6">
      {/* Title Header Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b3193a]">
          Access control
        </p>
        <h1 id="admin-role-requests-title" className="mt-2 text-3xl font-black tracking-tight text-[#070f4f]">
          Role Request Review Queue
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-500">
          Review jockey, owner, and referee access requests before users can enter specialist workflows.
        </p>
      </div>

      {/* Operations Filter Bar */}
      <div className="grid gap-4 md:grid-cols-[1fr_200px_120px] bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        {/* Search box */}
        <div className="relative">
          <Search aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search applicants by name, email, or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="min-h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#b3193a] focus:ring-2 focus:ring-[#b3193a]/10"
          />
        </div>

        {/* Status Filter */}
        <div>
          <select
            aria-label="Filter role requests by status"
            className="min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800 outline-none transition focus:border-[#b3193a] focus:ring-2 focus:ring-[#b3193a]/10"
            id="status-filter"
            onChange={(event) => onStatusChange(event.target.value)}
            value={selectedStatus}
          >
            <option value="ALL">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        {/* Refresh Button */}
        <button
          className="min-h-11 w-full rounded-lg border border-[#070f4f] bg-white px-4 text-xs font-black uppercase tracking-wider text-[#070f4f] hover:bg-slate-50 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b3193a]"
          onClick={onRefresh}
          type="button"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center rounded-xl border border-slate-200 bg-white py-16">
          <p className="text-sm font-bold text-slate-500">Loading role requests...</p>
        </div>
      ) : sortedRequests.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-350 bg-slate-50/50 py-16 text-center">
          <p className="text-sm font-bold text-slate-505">No role requests match your search or filter.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-[#ececec] text-left text-sm text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              <tr>
                <th className="px-6 py-3">Applicant</th>
                <th className="px-6 py-3">Requested role</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">CV</th>
                <th className="px-6 py-3">Submitted</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ececec] bg-white">
              {sortedRequests.map((request) => (
                <tr className="transition-colors hover:bg-[#fafafa]" key={request.id}>
                  <td className="px-6 py-4">
                    <div className="font-black text-[#171717]">{request.fullName}</div>
                    <div className="text-xs text-slate-500">{request.email}</div>
                  </td>
                  <td className="px-6 py-4 font-black text-[#006d5b]">{request.requestedRole}</td>
                  <td className="px-6 py-4">
                    <RoleRequestStatusBadge status={request.status} />
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-md px-2.5 py-1 text-xs font-black ${
                        request.cvReviewStatus === "PASSED"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {cvReviewLabel(request.cvReviewStatus)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">
                    {new Date(request.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      className="min-h-11 rounded-md border border-[#070f4f] bg-white px-4 text-xs font-black text-[#070f4f] hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b3193a]"
                      onClick={() => onViewDetail(request.id)}
                      type="button"
                    >
                      View Detail
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
