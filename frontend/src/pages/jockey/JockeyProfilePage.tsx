import { FormEvent, useState } from "react";
import { 
  CheckCircle2, 
  Medal, 
  Save, 
  User, 
  ShieldCheck, 
  Fingerprint, 
  Calendar, 
  Activity, 
  Trophy, 
  Flag 
} from "lucide-react";

import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { useClientSession } from "../../hooks/useClientSession";
import { JockeyLayout } from "../../layouts/JockeyLayout";
import { careerRecord, championshipArchive, jockeyChampionships } from "./jockeyWorkspaceData";

export function JockeyProfilePage() {
  useDocumentTitle("Racing passport");
  const { session } = useClientSession();
  const [saved, setSaved] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000); // clear saved message after 3s
  };

  const currentAssignment = jockeyChampionships[0];

  return (
    <JockeyLayout>
      <section aria-labelledby="passport-title" className="space-y-6">
        
        {/* Digital Rider License */}
        <div className="relative overflow-hidden rounded-xl border border-emerald-200 bg-white shadow-sm">
          {/* Decorative background pattern */}
          <div className="absolute right-0 top-0 h-full w-full bg-gradient-to-l from-emerald-50/80 to-transparent md:w-1/2"></div>
          
          <div className="relative flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between lg:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              {/* Avatar Placeholder */}
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl border-2 border-emerald-100 bg-emerald-50 text-emerald-600 shadow-sm">
                <User className="h-10 w-10" />
              </div>
              
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-[#006d5b]" />
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-[#006d5b]">Official Racing Passport</p>
                </div>
                <h1 id="passport-title" className="mt-1 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                  {session?.fullName || "Nguyen Van A"}
                </h1>
                <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-bold text-slate-500">
                  <div className="flex items-center gap-1.5"><Activity className="h-4 w-4 text-slate-400" /> Status: Active</div>
                </div>
              </div>
            </div>
            
            {/* Official Seal */}
            <div className="hidden shrink-0 lg:block">
               <div className="flex h-24 w-24 items-center justify-center rounded-full border-[3px] border-dashed border-emerald-200 bg-white/60 backdrop-blur-sm">
                  <span className="rotate-[-12deg] text-xs font-black uppercase tracking-widest text-[#006d5b]">Verified</span>
               </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_400px]">
          
          {/* Left Column: Stats & Form */}
          <div className="space-y-6">
            
            {/* Career Record / Telemetry */}
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8" aria-labelledby="career-record-title">
              <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <h2 id="career-record-title" className="text-2xl font-black text-slate-950">
                    Career Telemetry
                  </h2>
                  <p className="mt-1 text-sm font-bold text-slate-500">Official track performance metrics</p>
                </div>
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-slate-50 text-slate-400">
                  <Medal className="h-6 w-6" aria-hidden="true" />
                </div>
              </div>
              
              <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
                {[
                  ["Official Starts", careerRecord.officialStarts],
                  ["Wins", careerRecord.wins],
                  ["Top 3 Finishes", careerRecord.top3Finishes],
                  ["Top 3 Rate", careerRecord.top3Rate],
                  ["Championships Joined", careerRecord.championshipsJoined],
                  ["Championships Won", careerRecord.championshipsWon],
                ].map(([label, value]) => (
                  <div className="flex flex-col justify-center rounded-xl border border-slate-100 bg-slate-50/50 p-4 transition-colors hover:border-emerald-200 hover:bg-emerald-50/30" key={label}>
                    <dt className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-500">{label}</dt>
                    <dd className="mt-1.5 text-3xl font-black tracking-tight text-slate-950">{value}</dd>
                  </div>
                ))}
              </dl>
            </section>

            {/* Editable Profile Form */}
            <form className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8" onSubmit={handleSubmit}>
              <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
                <div>
                  <h2 className="text-2xl font-black text-slate-950">Personal Details</h2>
                  <p className="mt-1 text-sm font-bold text-slate-500">Update your contact and physical information</p>
                </div>
              </div>

              <div className="mt-6 grid gap-x-6 gap-y-5 md:grid-cols-2">
                <label className="grid gap-2 text-sm font-black text-slate-700 md:col-span-2">
                  Phone number
                  <input
                    className="min-h-11 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-900 transition-colors focus:border-[#006d5b] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#006d5b]"
                    defaultValue="0901234567"
                  />
                </label>
                <label className="grid gap-2 text-sm font-black text-slate-700 md:col-span-2">
                  Email address
                  <input
                    className="min-h-11 cursor-not-allowed rounded-lg border border-slate-200 bg-slate-100 px-3 text-sm font-bold text-slate-500 focus-visible:outline-none"
                    readOnly
                    value={session?.email || ""}
                  />
                </label>
                {[
                  ["Display Name", session?.fullName || "Nguyen Van A"],
                  ["Height", "172 cm"],
                  ["Weight", "54 kg"],
                  ["Years Experience", "6"],
                  ["Riding Style", "Late acceleration"],
                ].map(([label, value]) => (
                  <label className="grid gap-2 text-sm font-black text-slate-700" key={label}>
                    {label}
                    <input
                      className="min-h-11 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-900 transition-colors focus:border-[#006d5b] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#006d5b]"
                      defaultValue={value}
                    />
                  </label>
                ))}
                <label className="grid gap-2 text-sm font-black text-slate-700">
                  Availability
                  <select className="min-h-11 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-900 transition-colors focus:border-[#006d5b] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#006d5b]">
                    <option>Available</option>
                    <option>Busy</option>
                    <option>Unavailable</option>
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-black text-slate-700 md:col-span-2">
                  Bio
                  <textarea
                    className="min-h-28 resize-y rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-bold text-slate-900 transition-colors focus:border-[#006d5b] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#006d5b]"
                    defaultValue="Professional jockey focused on championship consistency and late-race control."
                  />
                </label>
              </div>
              
              <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-6">
                <div className="h-8">
                  {saved && (
                    <p className="inline-flex items-center rounded-md bg-emerald-50 px-3 py-1.5 text-xs font-black uppercase tracking-[0.1em] text-[#006d5b]" role="status">
                      <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                      Passport Updated
                    </p>
                  )}
                </div>
                <button
                  className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#006d5b] px-6 text-sm font-black text-white transition-colors hover:bg-[#004d3d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006d5b]"
                  type="submit"
                >
                  <Save className="h-4 w-4" aria-hidden="true" />
                  Save Passport
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Active Assignment & Archive */}
          <aside className="space-y-6">
            
            <section className="relative overflow-hidden rounded-xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm sm:p-8" aria-labelledby="current-assignment-title">
              {/* Subtle background icon */}
              <Trophy className="absolute -bottom-6 -right-6 h-32 w-32 text-emerald-600/5" aria-hidden="true" />
              
              <div className="relative">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-[#006d5b]">Active Contract</p>
                <h2 id="current-assignment-title" className="mt-1 text-2xl font-black text-slate-950">
                  Current Assignment
                </h2>
                
                <div className="mt-6 space-y-4 rounded-lg bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-1">
                    <dt className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">Championship</dt>
                    <dd className="text-base font-black text-slate-950">{currentAssignment.name}</dd>
                  </div>
                  <div className="h-px w-full bg-slate-100"></div>
                  <div className="flex flex-col gap-1">
                    <dt className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">Stable</dt>
                    <dd className="text-sm font-bold text-slate-700">{currentAssignment.stable}</dd>
                  </div>
                  <div className="flex flex-col gap-1">
                    <dt className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">Horse</dt>
                    <dd className="text-sm font-bold text-slate-700">{currentAssignment.horse}</dd>
                  </div>
                  <div className="mt-2 inline-flex">
                    <span className="rounded-md bg-emerald-100 px-2 py-1 text-xs font-black uppercase tracking-[0.1em] text-[#006d5b]">
                      {currentAssignment.commitmentStatus}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8" aria-labelledby="archive-title">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
                <Flag className="h-5 w-5 text-slate-400" aria-hidden="true" />
                <h2 id="archive-title" className="text-lg font-black text-slate-950">
                  Championship Archive
                </h2>
              </div>
              
              <div className="mt-5 space-y-4">
                {championshipArchive.map((item, index) => (
                  <article className="group relative pl-4" key={item.championship}>
                    {/* Timeline line */}
                    <div className="absolute bottom-0 left-[7px] top-6 w-px bg-slate-100 group-last:hidden"></div>
                    {/* Timeline dot */}
                    <div className="absolute left-0 top-1.5 h-[15px] w-[15px] rounded-full border-[3px] border-white bg-slate-200"></div>
                    
                    <div className="ml-3">
                      <p className="text-base font-black text-slate-950">{item.championship}</p>
                      <p className="mt-1 text-sm font-black text-[#006d5b]">
                        Rank {item.rank} <span className="font-bold text-slate-400 mx-1">•</span> {item.points} pts
                      </p>
                      <p className="mt-1 text-xs font-bold text-slate-500">
                        {item.horse} - {item.stable}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </section>

          </aside>
        </div>
      </section>
    </JockeyLayout>
  );
}
