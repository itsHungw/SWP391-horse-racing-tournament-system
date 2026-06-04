import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  CalendarCheck2,
  CheckCircle2,
  ClipboardCheck,
  FileBadge,
  IdCard,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  Trophy,
  UserRound,
} from "lucide-react";
import { getAssignedRaces } from "../../api/refereeApi";
import { getMyProfile, updateMyProfile, updateMyRefereeProfile } from "../../api/profileApi";
import { useClientSession } from "../../hooks/useClientSession";
import { normalizeAssignedRace } from "./race-day/refereeRaceDayAdapter";
import { AssignedRace } from "./race-day/refereeRaceDayModels";
import { Profile, RefereeProfileInfo } from "../../types/profile";
import { sanitizePhoneNumber, validateVietnamesePhone } from "../../utils/validation";

type RefereeProfileDashboardPageProps = {
  now?: Date;
};

type ReadinessItem = {
  label: string;
  complete: boolean;
  helper: string;
};

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "RF";
  return parts.slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function formatDate(value?: string) {
  if (!value) return "Not recorded";
  return new Date(value).toLocaleDateString("en-US", {
    month: "long",
    day: "2-digit",
    year: "numeric",
  });
}

function formatPhone(value?: string) {
  if (!value) return "Phone missing";
  return value.startsWith("+") ? value : `+84 ${value}`;
}

function normalizePhoneForInput(value?: string) {
  if (!value) return "";
  if (value.startsWith("+84")) return value.slice(3);
  if (value.startsWith("84") && value.length > 9) return value.slice(2);
  if (value.startsWith("0")) return value.slice(1);
  return value;
}

function getCredentialStatus(refInfo?: RefereeProfileInfo) {
  if (!refInfo) {
    return {
      label: "Credential Review Required",
      helper: "Referee credential record has not been created yet.",
      className: "border-amber-200 bg-amber-50 text-amber-800",
    };
  }

  if (refInfo.status === "ACTIVE") {
    return {
      label: "Certified Race Official",
      helper: "Credential profile is active for assigned race operations.",
      className: "border-emerald-200 bg-emerald-50 text-emerald-800",
    };
  }

  if (refInfo.status === "PENDING") {
    return {
      label: "Credential Review Pending",
      helper: "Credentials are waiting for administrator review.",
      className: "border-amber-200 bg-amber-50 text-amber-800",
    };
  }

  if (refInfo.status === "SUSPENDED" || refInfo.status === "REJECTED") {
    return {
      label: "Credential Action Required",
      helper: "Credential status requires administrator follow-up.",
      className: "border-rose-200 bg-rose-50 text-rose-800",
    };
  }

  return {
    label: "Credential Review Required",
    helper: "Credential record is incomplete for race-day assignments.",
    className: "border-slate-200 bg-slate-50 text-slate-700",
  };
}

function getReadinessItems(profile: Profile | null): ReadinessItem[] {
  const refInfo = profile?.refereeProfile;

  return [
    {
      label: "Account profile completed",
      complete: Boolean(profile?.profileCompleted),
      helper: "Name, phone, birth date, and address are available.",
    },
    {
      label: "Phone verified",
      complete: Boolean(profile?.phoneVerified),
      helper: "Race control can reach this official during operations.",
    },
    {
      label: "License number issued",
      complete: Boolean(refInfo?.licenseNumber),
      helper: "Required for official race-day credential tracking.",
    },
    {
      label: "Certification recorded",
      complete: Boolean(refInfo?.certification),
      helper: "Shows the referee qualification level.",
    },
    {
      label: "Professional bio provided",
      complete: Boolean(refInfo?.bio),
      helper: "Useful for administrator review and assignment confidence.",
    },
  ];
}

export function RefereeProfileDashboardPage({ now }: RefereeProfileDashboardPageProps) {
  const referenceNow = useMemo(() => now ?? new Date(), [now]);
  const { session } = useClientSession();

  const [races, setRaces] = useState<AssignedRace[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [identityForm, setIdentityForm] = useState({
    fullName: "",
    phone: "",
    gender: "",
    dateOfBirth: "",
    address: "",
  });
  const [credentialForm, setCredentialForm] = useState({
    licenseNumber: "",
    certification: "",
    experienceYears: "0",
    bio: "",
    evidenceUrl: "",
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(undefined);
      const [racesData, profileData] = await Promise.all([getAssignedRaces(), getMyProfile()]);
      setRaces(racesData.map((race) => normalizeAssignedRace(race, referenceNow)));
      setProfile(profileData);
      setIdentityForm({
        fullName: profileData.fullName || "",
        phone: normalizePhoneForInput(profileData.phone),
        gender: profileData.gender || "",
        dateOfBirth: profileData.dateOfBirth || "",
        address: profileData.address || "",
      });
      setCredentialForm({
        licenseNumber: profileData.refereeProfile?.licenseNumber || "",
        certification: profileData.refereeProfile?.certification || "",
        experienceYears: String(profileData.refereeProfile?.experienceYears ?? 0),
        bio: profileData.refereeProfile?.bio || "",
        evidenceUrl: profileData.refereeProfile?.evidenceUrl || "",
      });
    } catch {
      setError("Unable to load referee credential center.");
    } finally {
      setLoading(false);
    }
  }, [referenceNow]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const fullPhoneNumber = `+84${identityForm.phone}`;
    const cleanedPhone = sanitizePhoneNumber(fullPhoneNumber);
    const experienceYears = Number(credentialForm.experienceYears);

    if (!identityForm.fullName.trim() || !identityForm.phone.trim() || !identityForm.gender || !identityForm.dateOfBirth || !identityForm.address.trim()) {
      setFormError("Full name, phone number, gender, date of birth, and address are required.");
      setFormSuccess("");
      return;
    }

    if (!validateVietnamesePhone(fullPhoneNumber)) {
      setFormError("Phone number must be a valid Vietnam mobile number.");
      setFormSuccess("");
      return;
    }

    if (!Number.isFinite(experienceYears) || experienceYears < 0) {
      setFormError("Experience years must be a valid number.");
      setFormSuccess("");
      return;
    }

    try {
      setSaving(true);
      setFormError("");
      setFormSuccess("");

      const updatedProfile = await updateMyProfile({
        fullName: identityForm.fullName.trim(),
        phone: cleanedPhone,
        gender: identityForm.gender,
        dateOfBirth: identityForm.dateOfBirth,
        address: identityForm.address.trim(),
        avatarUrl: profile?.avatarUrl || "",
      });

      const updatedRefereeProfile = await updateMyRefereeProfile({
        licenseNumber: credentialForm.licenseNumber.trim() || undefined,
        certification: credentialForm.certification.trim() || undefined,
        experienceYears,
        bio: credentialForm.bio.trim() || undefined,
        evidenceUrl: credentialForm.evidenceUrl.trim() || undefined,
      });

      setProfile({
        ...updatedProfile,
        refereeProfile: updatedRefereeProfile,
      });
      setFormSuccess("Referee profile updated. Credential changes are now ready for administrator review.");
    } catch (err: any) {
      setFormError(err?.response?.data?.message || err?.message || "Unable to update referee profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <section className="max-w-[1486px] space-y-5" aria-label="Loading referee credential center">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#006f5f]">Preparing credential center</p>
          <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_0.9fr]">
            <div className="h-64 animate-pulse rounded-xl bg-slate-100" />
            <div className="h-64 animate-pulse rounded-xl bg-slate-100" />
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <div className="max-w-[1486px] rounded-xl border border-rose-200 bg-rose-50 p-6" role="alert">
        <p className="font-black text-rose-800">{error}</p>
        <button
          className="mt-4 min-h-11 rounded-md bg-rose-700 px-5 text-sm font-black text-white"
          onClick={() => void loadData()}
          type="button"
        >
          Retry
        </button>
      </div>
    );
  }

  const refInfo = profile?.refereeProfile;
  const credentialStatus = getCredentialStatus(refInfo);
  const readinessItems = getReadinessItems(profile);
  const displayName = profile?.fullName || session?.fullName || "Assigned official";
  const completedResults = races.filter((race) => ["RESULT_CONFIRMED", "PUBLISHED"].includes(race.status)).length;
  const activeAssignments = races.filter((race) => !["RESULT_CONFIRMED", "PUBLISHED", "CANCELLED"].includes(race.status)).length;
  const reviewPackages = races.filter((race) => race.status === "RESULT_SUBMITTED").length;
  const preRaceQueue = races.filter((race) => ["SCHEDULED", "CHECKING", "READY"].includes(race.status)).length;

  return (
    <section className="max-w-[1486px] space-y-6" aria-labelledby="referee-profile-title">
      <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-[#006f5f]">Referee Credential Center</p>
          <h1 id="referee-profile-title" className="mt-3 text-4xl font-black tracking-tight text-slate-950">
            Professional race official profile
          </h1>
          <p className="mt-3 max-w-3xl text-base font-semibold leading-7 text-slate-600">
            Manage identity, race-day credentials, and assignment readiness for referee operations.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <a
            href="#edit-referee-profile"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-black text-slate-800 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007a68]"
          >
            Edit referee profile
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </a>
          <Link
            to="/referee/assigned-races"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#007a68] px-4 text-sm font-black text-white transition hover:bg-[#006f5f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007a68]"
          >
            Open assigned races
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)]">
        <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 border-b border-slate-100 pb-5 sm:flex-row sm:items-center">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#007a68] text-3xl font-black uppercase text-white shadow-sm">
              {profile?.avatarUrl ? (
                <img alt="Referee avatar" className="h-full w-full object-cover" src={profile.avatarUrl} />
              ) : (
                <span>{getInitials(displayName)}</span>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-3xl font-black tracking-tight text-slate-950">{displayName}</h2>
                <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-800">
                  REFEREE
                </span>
              </div>
              <p className="mt-2 text-sm font-semibold text-slate-500">Race Day Official</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black text-slate-700">
                  <Mail className="h-4 w-4 text-slate-500" aria-hidden="true" />
                  {session?.email || "Email missing"}
                </span>
                <span className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black text-slate-700">
                  <Phone className="h-4 w-4 text-slate-500" aria-hidden="true" />
                  {formatPhone(profile?.phone)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">Address</p>
              <p className="mt-2 text-sm font-black leading-6 text-slate-900">{profile?.address || "Address missing"}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">Date of birth</p>
              <p className="mt-2 text-sm font-black leading-6 text-slate-900">{formatDate(profile?.dateOfBirth)}</p>
            </div>
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#006f5f]">Certification status</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">{credentialStatus.label}</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">{credentialStatus.helper}</p>
            </div>
            <span className={`rounded-md border px-3 py-1.5 text-xs font-black uppercase tracking-wider ${credentialStatus.className}`}>
              {refInfo?.status ?? "INCOMPLETE"}
            </span>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <IdCard className="h-5 w-5 text-[#007a68]" aria-hidden="true" />
              <p className="mt-3 text-[11px] font-black uppercase tracking-wider text-slate-500">License number</p>
              <p className="mt-1 text-sm font-black text-slate-950">{refInfo?.licenseNumber || "License Not Issued"}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <FileBadge className="h-5 w-5 text-[#007a68]" aria-hidden="true" />
              <p className="mt-3 text-[11px] font-black uppercase tracking-wider text-slate-500">Certification</p>
              <p className="mt-1 text-sm font-black text-slate-950">{refInfo?.certification || "Credential Review Required"}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <Trophy className="h-5 w-5 text-[#007a68]" aria-hidden="true" />
              <p className="mt-3 text-[11px] font-black uppercase tracking-wider text-slate-500">Experience</p>
              <p className="mt-1 text-sm font-black text-slate-950">
                {refInfo?.experienceYears ? `${refInfo.experienceYears} years` : "Experience Not Recorded"}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <CalendarCheck2 className="h-5 w-5 text-[#007a68]" aria-hidden="true" />
              <p className="mt-3 text-[11px] font-black uppercase tracking-wider text-slate-500">Approved date</p>
              <p className="mt-1 text-sm font-black text-slate-950">{formatDate(refInfo?.approvedAt)}</p>
            </div>
          </div>
        </article>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm" aria-labelledby="credential-readiness-title">
          <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#006f5f]">Assignment readiness</p>
              <h2 id="credential-readiness-title" className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                Assignment Readiness
              </h2>
              <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
                Complete your referee profile to build trust with administrators and improve your assignment readiness.
              </p>
            </div>
            <a
              href="#edit-referee-profile"
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#007a68] px-4 text-sm font-black text-white transition hover:bg-[#006f5f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007a68]"
            >
              Complete referee profile
            </a>
          </div>

          <div className="mt-5 space-y-3">
            {readinessItems.map((item) => (
              <div key={item.label} className="flex gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                {item.complete ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" aria-hidden="true" />
                ) : (
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden="true" />
                )}
                <div>
                  <p className="text-sm font-black text-slate-950">{item.label}</p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{item.helper}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm" aria-labelledby="referee-activity-title">
          <div className="border-b border-slate-100 pb-5">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#006f5f]">Operational summary</p>
            <h2 id="referee-activity-title" className="mt-2 text-2xl font-black tracking-tight text-slate-950">
              Referee activity summary
            </h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
              Assignment activity from the official published race schedule.
            </p>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {[
              { label: "Assigned races", value: races.length, icon: ShieldCheck, helper: "Official race cards assigned" },
              { label: "Active assignments", value: activeAssignments, icon: ClipboardCheck, helper: "Still waiting for operation or result" },
              { label: "Completed packages", value: completedResults, icon: BadgeCheck, helper: "Confirmed result packages" },
              { label: "Pre-race queue", value: preRaceQueue, icon: UserRound, helper: "Checks, ready, or scheduled cards" },
            ].map(({ label, value, icon: Icon, helper }) => (
              <article key={label} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <Icon className="h-5 w-5 text-[#007a68]" aria-hidden="true" />
                <p className="mt-3 text-3xl font-black text-slate-950">{value}</p>
                <p className="mt-1 text-sm font-black text-slate-800">{label}</p>
                <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{helper}</p>
              </article>
            ))}
          </div>

          {reviewPackages > 0 && (
            <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-black text-amber-900">{reviewPackages} result package needs review</p>
              <p className="mt-1 text-sm font-semibold text-amber-800">
                Escalated packages remain visible in Result Packages until administrator follow-up.
              </p>
            </div>
          )}
        </section>
      </div>

      <section
        id="edit-referee-profile"
        className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        aria-labelledby="edit-referee-profile-title"
      >
        <div className="border-b border-slate-100 pb-5">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#006f5f]">Self-service profile</p>
          <h2 id="edit-referee-profile-title" className="mt-2 text-2xl font-black tracking-tight text-slate-950">
            Edit referee profile
          </h2>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-500">
            Keep your identity and referee credentials current inside the referee workspace. Credential changes are saved for administrator review.
          </p>
        </div>

        {formError && (
          <div className="mt-5 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm font-black text-rose-800" role="alert">
            {formError}
          </div>
        )}
        {formSuccess && (
          <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-black text-emerald-800" role="status">
            {formSuccess}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 grid gap-6 xl:grid-cols-2">
          <fieldset className="rounded-lg border border-slate-200 bg-slate-50 p-5">
            <legend className="px-2 text-sm font-black text-slate-950">Basic Identity</legend>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-600" htmlFor="referee-full-name">
                  Full name
                </label>
                <input
                  id="referee-full-name"
                  value={identityForm.fullName}
                  onChange={(event) => setIdentityForm((current) => ({ ...current, fullName: event.target.value }))}
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 focus:border-[#007a68] focus:outline-none focus:ring-2 focus:ring-[#007a68]/20"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-600" htmlFor="referee-phone">
                  Phone number
                </label>
                <div className="mt-1 flex">
                  <span className="inline-flex items-center rounded-l-md border border-r-0 border-slate-300 bg-slate-100 px-3 text-sm font-black text-slate-600">
                    +84
                  </span>
                  <input
                    id="referee-phone"
                    value={identityForm.phone}
                    onChange={(event) => setIdentityForm((current) => ({ ...current, phone: event.target.value }))}
                    className="w-full rounded-r-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 focus:border-[#007a68] focus:outline-none focus:ring-2 focus:ring-[#007a68]/20"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-600" htmlFor="referee-gender">
                  Gender
                </label>
                <select
                  id="referee-gender"
                  value={identityForm.gender}
                  onChange={(event) => setIdentityForm((current) => ({ ...current, gender: event.target.value }))}
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 focus:border-[#007a68] focus:outline-none focus:ring-2 focus:ring-[#007a68]/20"
                  required
                >
                  <option value="">Select gender</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-600" htmlFor="referee-date-of-birth">
                  Date of birth
                </label>
                <input
                  id="referee-date-of-birth"
                  type="date"
                  value={identityForm.dateOfBirth}
                  onChange={(event) => setIdentityForm((current) => ({ ...current, dateOfBirth: event.target.value }))}
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 focus:border-[#007a68] focus:outline-none focus:ring-2 focus:ring-[#007a68]/20"
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-600" htmlFor="referee-address">
                  Address
                </label>
                <input
                  id="referee-address"
                  value={identityForm.address}
                  onChange={(event) => setIdentityForm((current) => ({ ...current, address: event.target.value }))}
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 focus:border-[#007a68] focus:outline-none focus:ring-2 focus:ring-[#007a68]/20"
                  required
                />
              </div>
            </div>
          </fieldset>

          <fieldset className="rounded-lg border border-slate-200 bg-slate-50 p-5">
            <legend className="px-2 text-sm font-black text-slate-950">Professional Credentials</legend>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-600" htmlFor="referee-license">
                  License number
                </label>
                <input
                  id="referee-license"
                  value={credentialForm.licenseNumber}
                  onChange={(event) => setCredentialForm((current) => ({ ...current, licenseNumber: event.target.value }))}
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 focus:border-[#007a68] focus:outline-none focus:ring-2 focus:ring-[#007a68]/20"
                  placeholder="REF-2026-X89"
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-600" htmlFor="referee-experience">
                  Experience years
                </label>
                <input
                  id="referee-experience"
                  type="number"
                  min={0}
                  value={credentialForm.experienceYears}
                  onChange={(event) => setCredentialForm((current) => ({ ...current, experienceYears: event.target.value }))}
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 focus:border-[#007a68] focus:outline-none focus:ring-2 focus:ring-[#007a68]/20"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-600" htmlFor="referee-certification">
                  Certification
                </label>
                <input
                  id="referee-certification"
                  value={credentialForm.certification}
                  onChange={(event) => setCredentialForm((current) => ({ ...current, certification: event.target.value }))}
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 focus:border-[#007a68] focus:outline-none focus:ring-2 focus:ring-[#007a68]/20"
                  placeholder="FEI Certified Steward"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-600" htmlFor="referee-evidence">
                  Certification evidence URL
                </label>
                <input
                  id="referee-evidence"
                  value={credentialForm.evidenceUrl}
                  onChange={(event) => setCredentialForm((current) => ({ ...current, evidenceUrl: event.target.value }))}
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 focus:border-[#007a68] focus:outline-none focus:ring-2 focus:ring-[#007a68]/20"
                  placeholder="https://..."
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-600" htmlFor="referee-bio">
                  Professional bio
                </label>
                <textarea
                  id="referee-bio"
                  rows={5}
                  value={credentialForm.bio}
                  onChange={(event) => setCredentialForm((current) => ({ ...current, bio: event.target.value }))}
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 focus:border-[#007a68] focus:outline-none focus:ring-2 focus:ring-[#007a68]/20"
                  placeholder="Summarize race-day experience, stewardship background, and officiating strengths."
                />
              </div>
            </div>
          </fieldset>

          <div className="xl:col-span-2 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold leading-6 text-slate-500">
              Saving credential changes marks them for administrator review before certification becomes official.
            </p>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#007a68] px-5 text-sm font-black text-white transition hover:bg-[#006f5f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007a68] disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <Save className="h-4 w-4" aria-hidden="true" />
              {saving ? "Saving referee profile..." : "Save referee profile"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm" aria-labelledby="referee-bio-title">
        <div className="grid gap-5 xl:grid-cols-[260px_minmax(0,1fr)]">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#006f5f]">Professional notes</p>
            <h2 id="referee-bio-title" className="mt-2 text-2xl font-black tracking-tight text-slate-950">
              Referee biography
            </h2>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-semibold leading-7 text-slate-700">
              {refInfo?.bio ||
                "No referee biography has been provided yet. Add race-day experience, stewardship background, and certification notes so administrators can assign this official with confidence."}
            </p>
          </div>
        </div>
      </section>
    </section>
  );
}
