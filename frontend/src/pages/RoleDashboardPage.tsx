import { StatusBadge } from "../components/StatusBadge";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

type RoleDashboardPageProps = {
  role: "Spectator" | "Owner" | "Jockey" | "Referee" | "Admin";
};

export function RoleDashboardPage({ role }: RoleDashboardPageProps) {
  useDocumentTitle(`${role} dashboard`);

  return (
    <section aria-labelledby="role-dashboard-title" className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <StatusBadge tone="draft">Route placeholder</StatusBadge>
      <h2 id="role-dashboard-title" className="mt-4 text-2xl font-semibold">
        {role} dashboard
      </h2>
      <p className="mt-3 max-w-2xl text-slate-700">
        This route is reserved for the {role.toLowerCase()} workflow.
      </p>
    </section>
  );
}
