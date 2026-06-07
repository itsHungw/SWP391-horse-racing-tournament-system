import { AdminLayout } from "../../layouts/AdminLayout";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";

const dayTabs = ["Today", "Pending Reviews", "Upcoming", "Race Day", "Content Queue"];

const metrics = [
  { label: "Pending role requests", value: "18", detail: "6 high priority", tone: "text-[#b3193a]" },
  { label: "Upcoming tournaments", value: "7", detail: "Next race day in 3 days", tone: "text-[#006d5b]" },
  { label: "Active users", value: "1,248", detail: "84 joined this week", tone: "text-[#070f4f]" },
  { label: "Blog drafts", value: "12", detail: "4 awaiting review", tone: "text-[#5a3b00]" },
];

const queueRows = [
  {
    name: "Minh Quan",
    email: "quan@gmail.com",
    role: "JOCKEY",
    submitted: "May 22, 2026",
    status: "Profile complete",
  },
  {
    name: "Linh Tran",
    email: "linh.owner@example.com",
    role: "OWNER",
    submitted: "May 21, 2026",
    status: "Evidence attached",
  },
  {
    name: "Hoang Le",
    email: "hoang.ref@example.com",
    role: "REFEREE",
    submitted: "May 20, 2026",
    status: "Needs review",
  },
];

const alerts = [
  "Review jockey requests before publishing the next tournament bracket.",
  "Three users completed profiles but have not submitted role requests.",
  "Blog reward rules need admin confirmation before launch.",
];

export function AdminOverviewPage() {
  useDocumentTitle("Admin operations");

  return (
    <AdminLayout>
      <section aria-labelledby="admin-overview-title" className="space-y-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-[#b3193a]">
              Tournament operations
            </p>
            <h1 id="admin-overview-title" className="mt-2 text-4xl font-black tracking-tight">
              Admin Operations
            </h1>
            <p className="mt-2 max-w-3xl text-base text-slate-600">
              Monitor role approvals, tournament readiness, race content, and user activity from one compact workspace.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              className="flex min-h-11 items-center rounded-md border-2 border-[#070f4f] px-5 text-sm font-black text-[#070f4f] hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b3193a]"
              href="/admin/role-requests"
            >
              Review Requests
            </a>
            <a
              className="flex min-h-11 items-center rounded-md bg-[#a6ff3f] px-5 text-sm font-black text-[#07110d] hover:bg-[#c4ff72] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b3193a]"
              href="/admin/tournaments"
            >
              New Tournament
            </a>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-[#d8d8d8] bg-white">
          <div className="flex min-w-[760px]">
            {dayTabs.map((tab) => (
              <button
                className={`min-h-14 flex-1 border-r border-[#d8d8d8] px-5 text-sm font-bold last:border-r-0 ${
                  tab === "Today" ? "bg-white text-[#b3193a]" : "bg-[#f7f7f7] text-[#171717]"
                }`}
                key={tab}
                type="button"
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <article className="rounded-lg border border-[#d8d8d8] bg-white p-5" key={metric.label}>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                {metric.label}
              </p>
              <p className={`mt-3 text-4xl font-black ${metric.tone}`}>{metric.value}</p>
              <p className="mt-2 text-sm font-medium text-slate-600">{metric.detail}</p>
            </article>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <section className="rounded-lg border border-[#d8d8d8] bg-white" aria-labelledby="review-queue-title">
            <div className="flex flex-col gap-3 border-b border-[#d8d8d8] p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 id="review-queue-title" className="text-xl font-black">
                  Role Request Review Queue
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Fast scan of requests that need admin attention.
                </p>
              </div>
              <a className="text-sm font-black text-[#b3193a] underline" href="/admin/role-requests">
                View all
              </a>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-[#f7f7f7] text-xs uppercase tracking-[0.14em] text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Applicant</th>
                    <th className="px-5 py-3">Role</th>
                    <th className="px-5 py-3">Submitted</th>
                    <th className="px-5 py-3">Signal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ececec]">
                  {queueRows.map((row) => (
                    <tr className="hover:bg-[#fafafa]" key={row.email}>
                      <td className="px-5 py-4">
                        <p className="font-black text-[#171717]">{row.name}</p>
                        <p className="text-xs text-slate-500">{row.email}</p>
                      </td>
                      <td className="px-5 py-4 font-black text-[#006d5b]">{row.role}</td>
                      <td className="px-5 py-4 text-slate-600">{row.submitted}</td>
                      <td className="px-5 py-4">
                        <span className="rounded-full bg-[#f1f1f1] px-3 py-1 text-xs font-bold text-slate-700">
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <aside className="rounded-lg border border-[#d8d8d8] bg-white p-5" aria-labelledby="admin-alerts-title">
            <h2 id="admin-alerts-title" className="text-xl font-black">
              Operations Alerts
            </h2>
            <div className="mt-5 space-y-4">
              {alerts.map((alert, index) => (
                <div className="border-l-4 border-[#b3193a] bg-[#fafafa] p-4" key={alert}>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                    Alert {index + 1}
                  </p>
                  <p className="mt-2 text-sm font-medium leading-6 text-slate-700">{alert}</p>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>
    </AdminLayout>
  );
}
