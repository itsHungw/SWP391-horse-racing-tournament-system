export function RefereeProfileDashboardPage() {
  return (
    <section className="max-w-[1486px]" aria-labelledby="referee-profile-title">
      <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.28em] text-[#006f5f]">Main Dashboard</p>
        <h2 className="mt-3 text-4xl font-black tracking-tight text-slate-950" id="referee-profile-title">
          Referee Profile
        </h2>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
          Check your race-day workload and monthly assignments.
        </p>
      </header>
    </section>
  );
}
