import { FormEvent, useState } from "react";
import { CheckCircle2, Medal, Save } from "lucide-react";

import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { JockeyLayout } from "../../layouts/JockeyLayout";
import { careerRecord, championshipArchive, jockeyChampionships } from "./jockeyWorkspaceData";

export function JockeyProfilePage() {
  useDocumentTitle("Racing passport");
  const [saved, setSaved] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaved(true);
  };

  const currentAssignment = jockeyChampionships[0];

  return (
    <JockeyLayout>
      <section aria-labelledby="passport-title" className="space-y-6">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-black uppercase tracking-[0.14em] text-[#006d5b]">Athlete profile</p>
          <h1 id="passport-title" className="mt-2 text-4xl font-black tracking-tight text-slate-950">
            Racing Passport
          </h1>
          <p className="mt-2 max-w-3xl text-sm font-bold leading-6 text-slate-500">
            Maintain rider details, championship assignment context, and official career record.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_390px]">
          <form className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm" onSubmit={handleSubmit}>
            <h2 className="text-2xl font-black text-slate-950">Rider Profile</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {[
                ["Display Name", "Nguyen Van A"],
                ["Height", "172 cm"],
                ["Weight", "54 kg"],
                ["Years Experience", "6"],
                ["Riding Style", "Late acceleration"],
              ].map(([label, value]) => (
                <label className="grid gap-2 text-sm font-black text-slate-700" key={label}>
                  {label}
                  <input
                    className="min-h-11 rounded-md border border-slate-300 px-3 text-sm font-bold text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#006d5b]"
                    defaultValue={value}
                  />
                </label>
              ))}
              <label className="grid gap-2 text-sm font-black text-slate-700">
                Availability
                <select className="min-h-11 rounded-md border border-slate-300 px-3 text-sm font-bold text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#006d5b]">
                  <option>Available</option>
                  <option>Busy</option>
                  <option>Unavailable</option>
                </select>
              </label>
              <label className="grid gap-2 text-sm font-black text-slate-700 md:col-span-2">
                Bio
                <textarea
                  className="min-h-28 rounded-md border border-slate-300 px-3 py-2 text-sm font-bold text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#006d5b]"
                  defaultValue="Professional jockey focused on championship consistency and late-race control."
                />
              </label>
            </div>
            {saved && (
              <p className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-[#006d5b]" role="status">
                <CheckCircle2 className="mr-2 inline h-4 w-4" aria-hidden="true" />
                Racing passport saved.
              </p>
            )}
            <button
              className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-md bg-[#006d5b] px-5 text-sm font-black text-white hover:bg-[#004d3d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006d5b]"
              type="submit"
            >
              <Save className="h-4 w-4" aria-hidden="true" />
              Save Passport
            </button>
          </form>

          <aside className="space-y-5">
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="career-record-title">
              <div className="flex items-center justify-between gap-4">
                <h2 id="career-record-title" className="text-2xl font-black text-slate-950">
                  Career Record
                </h2>
                <Medal className="h-6 w-6 text-[#006d5b]" aria-hidden="true" />
              </div>
              <dl className="mt-5 grid grid-cols-2 gap-3">
                {[
                  ["Official Starts", careerRecord.officialStarts],
                  ["Wins", careerRecord.wins],
                  ["Top 3 Finishes", careerRecord.top3Finishes],
                  ["Top 3 Rate", careerRecord.top3Rate],
                  ["Championships Joined", careerRecord.championshipsJoined],
                  ["Championships Won", careerRecord.championshipsWon],
                ].map(([label, value]) => (
                  <div className="rounded-md border border-slate-200 bg-slate-50 p-3" key={label}>
                    <dt className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">{label}</dt>
                    <dd className="mt-2 text-2xl font-black text-slate-950">{value}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="current-assignment-title">
              <h2 id="current-assignment-title" className="text-xl font-black text-slate-950">
                Current Championship Assignment
              </h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="font-bold text-slate-500">Stable</dt>
                  <dd className="text-right font-black text-slate-950">{currentAssignment.stable}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="font-bold text-slate-500">Horse</dt>
                  <dd className="text-right font-black text-slate-950">{currentAssignment.horse}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="font-bold text-slate-500">Championship</dt>
                  <dd className="text-right font-black text-slate-950">{currentAssignment.name}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="font-bold text-slate-500">Status</dt>
                  <dd className="text-right font-black text-[#006d5b]">{currentAssignment.commitmentStatus}</dd>
                </div>
              </dl>
            </section>
          </aside>
        </div>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="archive-title">
          <h2 id="archive-title" className="text-2xl font-black text-slate-950">
            Championship Archive
          </h2>
          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            {championshipArchive.map((item) => (
              <article className="rounded-md border border-slate-200 bg-slate-50 p-4" key={item.championship}>
                <p className="font-black text-slate-950">{item.championship}</p>
                <p className="mt-2 text-sm font-black text-[#006d5b]">
                  Rank {item.rank} - {item.points} pts
                </p>
                <p className="mt-1 text-sm font-bold text-slate-500">
                  {item.horse} - {item.stable}
                </p>
              </article>
            ))}
          </div>
        </section>
      </section>
    </JockeyLayout>
  );
}
