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
  const sortedRequests = [...requests].sort((a, b) => {
    if (a.status === "PENDING" && b.status !== "PENDING") return -1;
    if (a.status !== "PENDING" && b.status === "PENDING") return 1;
    return b.id - a.id;
  });

  return (
    <section aria-labelledby="admin-role-requests-title" className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.16em] text-[#b3193a]">
            Access control
          </p>
          <h1 id="admin-role-requests-title" className="mt-2 text-4xl font-black tracking-tight">
            Role Request Review Queue
          </h1>
          <p className="mt-2 max-w-3xl text-base text-slate-600">
            Review jockey, owner, and referee access requests before users can enter specialist workflows.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            aria-label="Filter role requests by status"
            className="min-h-11 rounded-md border border-[#bdbdbd] bg-white px-3 py-2 text-sm font-bold text-slate-700 shadow-sm focus:border-[#b3193a] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#b3193a]"
            id="status-filter"
            onChange={(event) => onStatusChange(event.target.value)}
            value={selectedStatus}
          >
            <option value="ALL">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
          <button
            className="min-h-11 rounded-md border border-[#070f4f] bg-white px-4 text-sm font-black text-[#070f4f] hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b3193a]"
            onClick={onRefresh}
            type="button"
          >
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center rounded-lg border border-[#d8d8d8] bg-white py-16">
          <p className="text-sm font-bold text-slate-500">Loading role requests...</p>
        </div>
      ) : sortedRequests.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[#bdbdbd] bg-white py-16 text-center">
          <p className="text-sm font-bold text-slate-500">No role requests match this filter.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[#d8d8d8] bg-white">
          <table className="min-w-full divide-y divide-[#ececec] text-left text-sm text-slate-700">
            <thead className="bg-[#f7f7f7] text-xs font-black uppercase tracking-[0.14em] text-slate-500">
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
