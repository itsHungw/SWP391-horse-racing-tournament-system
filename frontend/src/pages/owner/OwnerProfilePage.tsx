import { FormEvent, useEffect, useMemo, useState } from "react";
import { Building2, CheckCircle2, Clock3, Mail, MapPin, Phone, UploadCloud, UserRound } from "lucide-react";

import { getMyOwnerProfile, updateMyOwnerProfile, uploadStableLogo } from "../../api/ownerProfileApi";
import { getMyProfile } from "../../api/profileApi";
import { getOwnerHorses, getOwnerTournamentRegistrations } from "../../api/racingApi";
import { useClientSession } from "../../hooks/useClientSession";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { OwnerLayout } from "../../layouts/OwnerLayout";
import type { OwnerProfile } from "../../types/ownerProfile";
import type { Horse, TournamentRegistration } from "../../types/racing";
import { getApiErrorMessage } from "../../utils/apiError";

const emptyOwnerProfile: OwnerProfile = {
  status: "NOT_SUBMITTED",
  stableName: "",
  ownerName: "",
  description: "",
  contactPhone: "",
  contactEmail: "",
  contactAddress: "",
  logoUrl: "",
};

function formatDate(value?: string) {
  if (!value) {
    return "Not updated yet";
  }

  return new Date(value).toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function readinessLabel(ready: boolean) {
  return ready ? "Ready For Tournament Registration" : "Missing Required Information";
}

export function OwnerProfilePage() {
  useDocumentTitle("Stable profile");
  const { session } = useClientSession();

  const [ownerProfile, setOwnerProfile] = useState<OwnerProfile>(emptyOwnerProfile);
  const [horses, setHorses] = useState<Horse[]>([]);
  const [registrations, setRegistrations] = useState<TournamentRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [stableName, setStableName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [description, setDescription] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactAddress, setContactAddress] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        const [coreProfile, stableProfile, horseData, registrationData] = await Promise.all([
          getMyProfile(),
          getMyOwnerProfile(),
          getOwnerHorses(),
          getOwnerTournamentRegistrations(),
        ]);
        const nextProfile = stableProfile ?? emptyOwnerProfile;

        if (!active) {
          return;
        }

        setOwnerProfile(nextProfile);
        setHorses(Array.isArray(horseData) ? horseData : []);
        setRegistrations(Array.isArray(registrationData) ? registrationData : []);
        setStableName(nextProfile.stableName || "");
        setOwnerName(nextProfile.ownerName || coreProfile.fullName || session?.fullName || "");
        setDescription(nextProfile.description || nextProfile.bio || "");
        setContactPhone(nextProfile.contactPhone || coreProfile.phone || "");
        setContactEmail(nextProfile.contactEmail || session?.email || "");
        setContactAddress(nextProfile.contactAddress || coreProfile.address || "");
        setLogoUrl(nextProfile.logoUrl || "");
        setMessage(null);
      } catch (error) {
        if (active) {
          setMessage(getApiErrorMessage(error, "Unable to load stable profile."));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [session?.email, session?.fullName]);

  const checklist = useMemo(
    () => [
      { label: "Stable Name", ready: stableName.trim().length > 0 },
      { label: "Phone", ready: contactPhone.trim().length > 0 },
      { label: "Email", ready: contactEmail.trim().length > 0 },
      { label: "Address", ready: contactAddress.trim().length > 0 },
    ],
    [contactAddress, contactEmail, contactPhone, stableName],
  );

  const readyCount = checklist.filter((item) => item.ready).length;
  const ready = readyCount === checklist.length;
  const activeRegistrations = registrations.filter((item) => item.status === "PENDING" || item.status === "APPROVED").length;
  const approvedHorses = horses.filter((horse) => horse.status === "APPROVED").length;

  const uploadLogo = async (file?: File) => {
    if (!file) {
      return;
    }

    if (!["image/jpeg", "image/jpg", "image/png"].includes(file.type)) {
      setMessage("Stable logo must be a JPG or PNG file.");
      return;
    }

    try {
      setMessage(null);
      const result = await uploadStableLogo(file);
      setLogoUrl(result.url);
    } catch (error) {
      setMessage(getApiErrorMessage(error, "Unable to upload stable logo."));
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!ready) {
      setMessage("Stable name, phone, email, and address are required before tournament registration.");
      setSuccess(null);
      return;
    }

    try {
      setSaving(true);
      setMessage(null);
      setSuccess(null);

      const updated = await updateMyOwnerProfile({
        stableName: stableName.trim(),
        ownerName: ownerName.trim(),
        description: description.trim(),
        contactPhone: contactPhone.trim(),
        contactEmail: contactEmail.trim(),
        contactAddress: contactAddress.trim(),
        logoUrl,
      });

      setOwnerProfile(updated);
      setSuccess("Stable profile saved.");
    } catch (error) {
      setMessage(getApiErrorMessage(error, "Unable to save stable profile."));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <OwnerLayout>
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm" aria-label="Loading stable profile">
          <div className="h-5 w-44 rounded-md bg-slate-200" />
          <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_360px]">
            <div className="space-y-4">
              <div className="h-64 rounded-lg bg-slate-100" />
              <div className="h-52 rounded-lg bg-slate-100" />
            </div>
            <div className="h-80 rounded-lg bg-slate-100" />
          </div>
        </section>
      </OwnerLayout>
    );
  }

  return (
    <OwnerLayout>
      <section aria-labelledby="stable-profile-title" className="space-y-6">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.14em] text-[#006d5b]">Owner operations</p>
              <h1 id="stable-profile-title" className="mt-2 text-4xl font-black tracking-tight text-slate-950">
                Stable Profile
              </h1>
              <p className="mt-2 max-w-3xl text-base font-bold leading-7 text-slate-600">
                Manage owner information used for horse management and tournament registration.
              </p>
            </div>
            <div
              className={`inline-flex min-h-12 items-center gap-3 rounded-lg border px-4 text-sm font-black ${
                ready ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800"
              }`}
            >
              {ready ? <CheckCircle2 className="h-5 w-5" aria-hidden="true" /> : <Clock3 className="h-5 w-5" aria-hidden="true" />}
              {readinessLabel(ready)}
            </div>
          </div>
        </div>

        {message && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-800" role="alert">
            {message}
          </div>
        )}
        {success && (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800" role="status">
            {success}
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="basic-info-title">
              <div className="border-b border-slate-200 pb-5">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-[#006d5b]">Basic information</p>
                <h2 id="basic-info-title" className="mt-2 text-2xl font-black text-slate-950">
                  Stable Identity
                </h2>
              </div>

              <div className="mt-5 grid gap-5 lg:grid-cols-[180px_1fr]">
                <div>
                  <label className="block text-xs font-black uppercase tracking-[0.14em] text-slate-600" htmlFor="stableLogo">
                    Logo
                  </label>
                  <div className="mt-2 flex h-32 w-32 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-emerald-50 text-[#006d5b]">
                    {logoUrl ? <img alt="" className="h-full w-full object-cover" src={logoUrl} /> : <Building2 className="h-12 w-12" aria-hidden="true" />}
                  </div>
                  <input
                    accept="image/jpeg,image/jpg,image/png"
                    className="mt-4 block w-full text-sm font-bold text-slate-600 file:mr-3 file:min-h-10 file:cursor-pointer file:rounded-md file:border-0 file:bg-slate-950 file:px-4 file:text-xs file:font-black file:text-white hover:file:bg-[#006d5b]"
                    id="stableLogo"
                    onChange={(event) => uploadLogo(event.target.files?.[0])}
                    type="file"
                  />
                </div>

                <div className="grid gap-5">
                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <label className="block text-xs font-black uppercase tracking-[0.14em] text-slate-600" htmlFor="stableName">
                        Stable Name
                      </label>
                      <input
                        className="mt-2 min-h-12 w-full rounded-md border border-slate-300 px-4 font-bold text-slate-950 outline-none focus:border-[#006d5b] focus:ring-2 focus:ring-[#006d5b]/20"
                        id="stableName"
                        onChange={(event) => setStableName(event.target.value)}
                        placeholder="Saigon Racing Stable"
                        value={stableName}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black uppercase tracking-[0.14em] text-slate-600" htmlFor="ownerName">
                        Owner Name
                      </label>
                      <input
                        className="mt-2 min-h-12 w-full rounded-md border border-slate-300 px-4 font-bold text-slate-950 outline-none focus:border-[#006d5b] focus:ring-2 focus:ring-[#006d5b]/20"
                        id="ownerName"
                        onChange={(event) => setOwnerName(event.target.value)}
                        placeholder="Nguyen Van A"
                        value={ownerName}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase tracking-[0.14em] text-slate-600" htmlFor="description">
                      Description
                    </label>
                    <textarea
                      className="mt-2 min-h-28 w-full rounded-md border border-slate-300 px-4 py-3 font-bold leading-7 text-slate-950 outline-none focus:border-[#006d5b] focus:ring-2 focus:ring-[#006d5b]/20"
                      id="description"
                      onChange={(event) => setDescription(event.target.value)}
                      placeholder="Short note about your stable for tournament operations."
                      value={description}
                    />
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="contact-info-title">
              <div className="border-b border-slate-200 pb-5">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-[#006d5b]">Contact information</p>
                <h2 id="contact-info-title" className="mt-2 text-2xl font-black text-slate-950">
                  Tournament Operations Contact
                </h2>
              </div>
              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <div>
                  <label className="block text-xs font-black uppercase tracking-[0.14em] text-slate-600" htmlFor="contactPhone">
                    Phone
                  </label>
                  <div className="relative mt-2">
                    <Phone className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" aria-hidden="true" />
                    <input
                      className="min-h-12 w-full rounded-md border border-slate-300 pl-10 pr-4 font-bold text-slate-950 outline-none focus:border-[#006d5b] focus:ring-2 focus:ring-[#006d5b]/20"
                      id="contactPhone"
                      onChange={(event) => setContactPhone(event.target.value)}
                      placeholder="0901234567"
                      value={contactPhone}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-[0.14em] text-slate-600" htmlFor="contactEmail">
                    Email
                  </label>
                  <div className="relative mt-2">
                    <Mail className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" aria-hidden="true" />
                    <input
                      className="min-h-12 w-full rounded-md border border-slate-300 pl-10 pr-4 font-bold text-slate-950 outline-none focus:border-[#006d5b] focus:ring-2 focus:ring-[#006d5b]/20"
                      id="contactEmail"
                      onChange={(event) => setContactEmail(event.target.value)}
                      placeholder="stable@example.com"
                      type="email"
                      value={contactEmail}
                    />
                  </div>
                </div>
              </div>
              <div className="mt-5">
                <label className="block text-xs font-black uppercase tracking-[0.14em] text-slate-600" htmlFor="contactAddress">
                  Address
                </label>
                <div className="relative mt-2">
                  <MapPin className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" aria-hidden="true" />
                  <textarea
                    className="min-h-24 w-full rounded-md border border-slate-300 py-3 pl-10 pr-4 font-bold leading-7 text-slate-950 outline-none focus:border-[#006d5b] focus:ring-2 focus:ring-[#006d5b]/20"
                    id="contactAddress"
                    onChange={(event) => setContactAddress(event.target.value)}
                    placeholder="Stable base address used for tournament operations."
                    value={contactAddress}
                  />
                </div>
              </div>
            </section>

            <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-bold text-slate-500">
                Required fields control readiness for tournament registration.
              </p>
              <button
                className="inline-flex min-h-12 items-center justify-center rounded-md bg-[#006d5b] px-6 text-sm font-black text-white hover:bg-[#004d3d] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
                disabled={saving}
                type="submit"
              >
                {saving ? "Saving..." : "Save Stable Profile"}
              </button>
            </div>
          </form>

          <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="readiness-title">
              <div
                className={`rounded-lg border p-4 ${
                  ready ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-amber-200 bg-amber-50 text-amber-900"
                }`}
              >
                <div className="flex items-start gap-3">
                  {ready ? <CheckCircle2 className="mt-1 h-6 w-6" aria-hidden="true" /> : <Clock3 className="mt-1 h-6 w-6" aria-hidden="true" />}
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.14em]">Registration readiness</p>
                    <h2 id="readiness-title" className="mt-1 text-xl font-black">
                      {readinessLabel(ready)}
                    </h2>
                  </div>
                </div>
              </div>

              <ul className="mt-5 space-y-4">
                {checklist.map((item) => (
                  <li className="flex items-center justify-between gap-4" key={item.label}>
                    <span className="text-sm font-black text-slate-700">{item.label}</span>
                    {item.ready ? (
                      <span className="inline-flex items-center gap-2 text-sm font-black text-[#006d5b]">
                        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                        Ready
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2 text-sm font-black text-amber-700">
                        <Clock3 className="h-4 w-4" aria-hidden="true" />
                        Missing
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="summary-title">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[#006d5b]">Summary</p>
              <h2 id="summary-title" className="mt-2 text-2xl font-black text-slate-950">
                Operations Snapshot
              </h2>
              <dl className="mt-5 grid gap-3">
                {[
                  ["Registered Horses", horses.length],
                  ["Approved Horses", approvedHorses],
                  ["Active Registrations", activeRegistrations],
                  ["Last Updated", formatDate(ownerProfile.updatedAt || ownerProfile.createdAt)],
                ].map(([label, value]) => (
                  <div className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-4 py-3" key={label}>
                    <dt className="text-sm font-bold text-slate-500">{label}</dt>
                    <dd className="text-sm font-black text-slate-950">{value}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="stable-card-title">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[#006d5b]">Stable card</p>
              <div className="mt-4 flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-emerald-50 text-[#006d5b]">
                  {logoUrl ? <img alt="" className="h-full w-full object-cover" src={logoUrl} /> : <Building2 className="h-7 w-7" aria-hidden="true" />}
                </div>
                <div>
                  <h2 id="stable-card-title" className="text-xl font-black text-slate-950">
                    {stableName || "Stable name missing"}
                  </h2>
                  <p className="mt-1 text-sm font-bold text-slate-600">{ownerName || "Owner name missing"}</p>
                  <p className="mt-2 text-sm font-bold leading-6 text-slate-500">{description || "Add a short stable description for internal operations."}</p>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </section>
    </OwnerLayout>
  );
}
