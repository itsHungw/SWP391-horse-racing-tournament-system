import { StatusBadge } from "../components/StatusBadge";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

type RoleDashboardPageProps = {
  role: "Spectator" | "Owner" | "Jockey" | "Referee" | "Admin";
};

export function RoleDashboardPage({ role }: RoleDashboardPageProps) {
  useDocumentTitle(`${role} dashboard`);

  return (
    <section
      aria-labelledby="role-dashboard-title"
      className="mx-auto mt-8 max-w-4xl rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
    >
      <StatusBadge tone="draft">Coming soon</StatusBadge>
      <h1 id="role-dashboard-title" className="mt-4 text-2xl font-semibold">
        {role} Dashboard
      </h1>
      <p className="mt-3 max-w-2xl text-slate-700">
        This workspace is reserved for the {role.toLowerCase()} workflow and will be expanded in a later slice.
      </p>
    </section>
  );
}
