import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getAssignedRaces } from "../../api/refereeApi";
import { getMyProfile } from "../../api/profileApi";
import { useClientSession } from "../../hooks/useClientSession";
import { MonthRaceCalendar } from "./race-day/MonthRaceCalendar";
import { normalizeAssignedRace } from "./race-day/refereeRaceDayAdapter";
import { AssignedRace } from "./race-day/refereeRaceDayModels";
import { Profile } from "../../types/profile";

type RefereeProfileDashboardPageProps = {
  now?: Date;
};

function isSameDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function metricLabel(status: string) {
  if (status === "ONGOING") return "Live / Ongoing";
  if (status === "PUBLISHED") return "Published Results";
  return "Ready For Pre-Race";
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "RF";
  return parts.slice(0, 2).map((p) => p[0]).join("").toUpperCase();
}

export function RefereeProfileDashboardPage({ now }: RefereeProfileDashboardPageProps) {
  const referenceNow = useMemo(() => now ?? new Date(), [now]);
  const navigate = useNavigate();
  const { session } = useClientSession();
  
  const [races, setRaces] = useState<AssignedRace[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(undefined);
      const [racesData, profileData] = await Promise.all([
        getAssignedRaces(),
        getMyProfile()
      ]);
      setRaces(racesData.map((race) => normalizeAssignedRace(race, referenceNow)));
      setProfile(profileData);
    } catch {
      setError("Unable to load referee profile dashboard.");
    } finally {
      setLoading(false);
    }
  }, [referenceNow]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const racesToday = races.filter((race) => isSameDay(new Date(race.scheduledAt), referenceNow));
  const readyForPreRace = races.filter((race) => ["SCHEDULED", "CHECKING", "READY"].includes(race.status));
  const ongoingRaces = races.filter((race) => race.status === "ONGOING");
  const publishedResults = races.filter((race) => race.status === "PUBLISHED");

  if (loading) {
    return (
      <div className="max-w-[1486px] rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#006f5f]">Preparing referee profile dashboard</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-4">
          <div className="h-20 rounded-xl bg-slate-100 animate-pulse" />
          <div className="h-20 rounded-xl bg-slate-100 animate-pulse" />
          <div className="h-20 rounded-xl bg-slate-100 animate-pulse" />
          <div className="h-20 rounded-xl bg-slate-100 animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-[1486px] rounded-xl border border-rose-200 bg-rose-50 p-6" role="alert">
        <p className="font-black text-rose-800">{error}</p>
        <button className="mt-4 min-h-11 rounded-md bg-rose-700 px-5 text-sm font-black text-white" onClick={() => void loadData()} type="button">
          Retry
        </button>
      </div>
    );
  }

  const refInfo = profile?.refereeProfile;

  // Status mapping classes
  let statusClass = "bg-slate-50 text-slate-700 border-slate-200";
  if (refInfo?.status === "ACTIVE") {
    statusClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
  } else if (refInfo?.status === "PENDING") {
    statusClass = "bg-amber-50 text-amber-700 border-amber-200";
  } else if (refInfo?.status === "SUSPENDED" || refInfo?.status === "REJECTED") {
    statusClass = "bg-rose-50 text-rose-700 border-rose-200";
  }

  return (
    <section className="max-w-[1486px] space-y-6" aria-labelledby="referee-profile-title">
      {/* Bento Grid Top: General Profile & Credentials */}
      <div className="grid gap-6 lg:grid-cols-2">
        
        {/* Bento Item 1: Identity & Account Settings */}
        <article className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <header className="flex items-center gap-4 border-b border-slate-100 pb-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#007a68] text-2xl font-black uppercase text-white shadow-md">
                {profile?.avatarUrl ? (
                  <img alt="Referee Avatar" className="h-full w-full object-cover" src={profile.avatarUrl} />
                ) : (
                  <span>{getInitials(profile?.fullName || "Referee")}</span>
                )}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-2xl font-black tracking-tight text-slate-950" id="referee-profile-title">
                    {profile?.fullName || "Assigned official"}
                  </h2>
                  <span className="inline-flex rounded-full bg-[#007a68] px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">
                    REFEREE
                  </span>
                </div>
                <p className="mt-1 text-sm font-semibold text-slate-500">{session?.email || "No email available"}</p>
              </div>
            </header>

            <div className="mt-4 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Phone Number</span>
                <p className="font-bold text-slate-800">{profile?.phone ? `+84 ${profile.phone}` : "Not specified"}</p>
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Gender</span>
                <p className="font-bold text-slate-800 capitalize">{profile?.gender?.toLowerCase() || "Not specified"}</p>
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Date of Birth</span>
                <p className="font-bold text-slate-800">
                  {profile?.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                  }) : "Not specified"}
                </p>
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Address</span>
                <p className="font-bold text-slate-800 leading-tight">{profile?.address || "Not specified"}</p>
              </div>
            </div>

            {/* Verification Badges */}
            <div className="mt-5 flex flex-wrap gap-2">
              <span className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-black uppercase border ${profile?.profileCompleted ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-50 text-slate-400 border-slate-200"}`}>
                {profile?.profileCompleted ? "✓ Profile Completed" : "✗ Profile Incomplete"}
              </span>
              <span className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-black uppercase border ${profile?.phoneVerified ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-50 text-slate-400 border-slate-200"}`}>
                {profile?.phoneVerified ? "✓ Phone Verified" : "✗ Phone Unverified"}
              </span>
              <span className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-black uppercase border ${profile?.ageVerified ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-50 text-slate-400 border-slate-200"}`}>
                {profile?.ageVerified ? "✓ Age Verified" : "✗ Age Unverified"}
              </span>
            </div>
          </div>

          <div className="mt-6 border-t border-slate-100 pt-4">
            <Link
              to="/profile"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-white transition hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
            >
              <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Manage Account Settings
            </Link>
          </div>
        </article>

        {/* Bento Item 2: Official Credentials */}
        <article className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <header className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#006f5f]">Official Credentials</p>
                <h3 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
                  {refInfo?.certification || "Not Certified"}
                </h3>
              </div>
              {refInfo?.status && (
                <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wider ${statusClass}`}>
                  {refInfo.status}
                </span>
              )}
            </header>

            {/* Biography Block */}
            <div className="mt-4 rounded-xl border-l-4 border-[#007a68] bg-[#f8fcfb] p-4">
              <p className="line-clamp-4 text-sm font-semibold italic leading-relaxed text-slate-600">
                {refInfo?.bio ? `"${refInfo.bio}"` : "No biography provided. Bio credentials must be submitted to administrators for certification verification."}
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 text-sm text-slate-700">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">License Number</span>
              <p className="font-bold text-slate-800">
                {refInfo?.licenseNumber ? (
                  <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-800 border border-slate-200">{refInfo.licenseNumber}</code>
                ) : (
                  "Not Issued"
                )}
              </p>
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Experience</span>
              <p className="font-bold text-slate-800">{refInfo?.experienceYears ? `${refInfo.experienceYears} years` : "0 years"}</p>
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Approved Date</span>
              <p className="font-bold text-slate-800">
                {refInfo?.approvedAt ? new Date(refInfo.approvedAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric"
                }) : "N/A"}
              </p>
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Approved By</span>
              <p className="font-bold text-slate-800">System Admin</p>
            </div>
          </div>
        </article>

      </div>

      {/* Middle: KPI Cards bridge */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["Assigned Today", racesToday.length],
          ["Ready For Pre-Race", readyForPreRace.length],
          [metricLabel("ONGOING"), ongoingRaces.length],
          [metricLabel("PUBLISHED"), publishedResults.length],
        ].map(([label, value]) => (
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" key={label}>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">{label}</p>
            <p className="mt-3 text-4xl font-black text-[#006f5f]">{value}</p>
          </article>
        ))}
      </div>

      {/* Bottom: Month calendar anchor */}
      <div className="mt-6">
        <MonthRaceCalendar
          races={races}
          referenceDate={referenceNow}
          onRaceSelect={(race) => navigate(`/referee/assigned-races?raceId=${race.id}`)}
        />
      </div>
    </section>
  );
}
