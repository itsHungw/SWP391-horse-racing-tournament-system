import { StatusBadge } from "../../components/StatusBadge";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";

export function HomePage() {
  useDocumentTitle("Race operations");

  return (
    <section aria-labelledby="home-title" className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <StatusBadge tone="ready">Frontend ready</StatusBadge>
        <h2 id="home-title" className="mt-4 text-3xl font-semibold">
          Race operations
        </h2>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-700">
          This React workspace is ready for tournament registration, race
          scheduling, predictions, and role-based dashboards.
        </p>
      </div>
      <aside
        aria-labelledby="next-steps-title"
        className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h2 id="next-steps-title" className="text-lg font-semibold">
          Build order
        </h2>
        <ol className="mt-4 space-y-3 text-sm text-slate-700">
          <li>1. Connect authentication routes.</li>
          <li>2. Add protected layouts per role.</li>
          <li>3. Wire API services to Spring Boot endpoints.</li>
        </ol>
      </aside>
    </section>
  );
}
