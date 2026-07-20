import { AdminLayout } from "../../layouts/AdminLayout";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { useAdminDashboard } from "./hooks/useAdminDashboard";
import { RefreshCw } from "lucide-react";



export function AdminOverviewPage() {
  useDocumentTitle("Admin operations");
  const { dashboard, isLoading, error } = useAdminDashboard();

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <RefreshCw className="h-8 w-8 animate-spin text-[#b3193a]" />
        </div>
      </AdminLayout>
    );
  }

  if (error || !dashboard) {
    return (
      <AdminLayout>
        <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
          <p className="text-xl font-black text-slate-800">Failed to load dashboard</p>
          <p className="mt-2 text-sm text-slate-500">Please check your connection and try again.</p>
        </div>
      </AdminLayout>
    );
  }

  const dynamicMetrics = [
    { label: "Pending role requests", value: dashboard.metrics.pendingRoleRequests.toString(), detail: dashboard.metrics.pendingRoleRequestsDetail, tone: "text-[#b3193a]" },
    { label: "Upcoming tournaments", value: dashboard.metrics.upcomingTournaments.toString(), detail: dashboard.metrics.upcomingTournamentsDetail, tone: "text-[#006d5b]" },
    { label: "Active users", value: dashboard.metrics.activeUsers.toString(), detail: dashboard.metrics.activeUsersDetail, tone: "text-[#070f4f]" },
    { label: "Blog drafts", value: dashboard.metrics.blogDrafts.toString(), detail: dashboard.metrics.blogDraftsDetail, tone: "text-[#5a3b00]" },
  ];

  return (
    <AdminLayout>
      <section aria-labelledby="admin-overview-title" className="space-y-6">
        {/* Title Header Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b3193a]">
              Tournament operations
            </p>
            <h1 id="admin-overview-title" className="mt-2 text-3xl font-black tracking-tight text-[#070f4f]">
              Admin Operations
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-500">
              Monitor role approvals, tournament readiness, race content, and user activity from one compact workspace.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              className="flex min-h-11 items-center rounded-lg border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b3193a]"
              href="/admin/role-requests"
            >
              Review Requests
            </a>
            <a
              className="flex min-h-11 items-center rounded-lg bg-emerald-600 px-5 text-sm font-black text-white hover:bg-emerald-700 shadow-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b3193a]"
              href="/admin/tournaments"
            >
              New Tournament
            </a>
            <a
              className="flex min-h-11 items-center rounded-lg bg-blue-600 px-5 text-sm font-black text-white hover:bg-blue-700 shadow-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b3193a]"
              href="/admin/disputes"
            >
              Disputes
            </a>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {dynamicMetrics.map((metric) => (
            <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition duration-300" key={metric.label}>
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                {metric.label}
              </p>
              <p className={`mt-2 text-4xl font-black ${metric.tone}`}>{metric.value}</p>
              <p className="mt-2 text-xs font-semibold text-slate-500">{metric.detail}</p>
            </article>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden" aria-labelledby="review-queue-title">
            <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 id="review-queue-title" className="text-lg font-black text-slate-900">
                  Role Request Review Queue
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Fast scan of requests that need admin attention.
                </p>
              </div>
              <a className="text-xs font-black text-[#b3193a] underline hover:text-[#8f1430]" href="/admin/role-requests">
                View all
              </a>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Applicant</th>
                    <th className="px-5 py-3">Role</th>
                    <th className="px-5 py-3">Submitted</th>
                    <th className="px-5 py-3">Signal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ececec]">
                  {dashboard.queueRows.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-8 text-center text-slate-500">
                        No pending role requests.
                      </td>
                    </tr>
                  ) : (
                    dashboard.queueRows.map((row) => (
                      <tr className="hover:bg-[#fafafa]" key={row.id}>
                        <td className="px-5 py-4">
                          <p className="font-black text-[#171717]">{row.name}</p>
                          <p className="text-xs text-slate-500">{row.email}</p>
                        </td>
                        <td className="px-5 py-4 font-black text-[#006d5b]">{row.role}</td>
                        <td className="px-5 py-4 text-slate-650 font-medium">{row.submitted}</td>
                        <td className="px-5 py-4">
                          <span className="rounded-full bg-[#f1f1f1] px-3 py-1 text-xs font-bold text-slate-700">
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <aside className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="admin-alerts-title">
            <h2 id="admin-alerts-title" className="text-lg font-black text-slate-900">
              Operations Alerts
            </h2>
            <div className="mt-5 space-y-4">
              {dashboard.alerts.length === 0 ? (
                <div className="text-xs text-slate-400 font-semibold">No active alerts.</div>
              ) : (
                dashboard.alerts.map((alert, index) => (
                  <div className="border-l-4 border-[#b3193a] bg-slate-50 p-4 rounded-r-lg" key={index}>
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                      Alert {index + 1}
                    </p>
                    <p className="mt-2 text-xs font-semibold leading-5 text-slate-650">{alert}</p>
                  </div>
                ))
              )}
            </div>
          </aside>
        </div>
      </section>
    </AdminLayout>
  );
}
