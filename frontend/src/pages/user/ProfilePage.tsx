import { FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowRight, UploadCloud } from "lucide-react";
import { Link } from "react-router-dom";

import { getMyProfile, updateMyProfile, uploadAvatar } from "../../api/profileApi";
import { ClientFooter } from "../../components/client/ClientFooter";
import { ClientHeader } from "../../components/client/ClientHeader";
import { ClientToast, useClientToast } from "../../components/client/ClientToast";
import { Eyebrow, MotionReveal } from "../../components/client/primitives";
import { useClientSession } from "../../hooks/useClientSession";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { Profile } from "../../types/profile";
import { resolveFileUrl } from "../../utils/fileUrl";

type ReadinessItem = {
  label: string;
  ready: boolean;
  helper: string;
};

const defaultAvatar = "";

/* Premium inputs: deep backgrounds, elegant typography, inner shadows. */
const ledgerLabel = "block font-data text-[10px] font-bold text-gold-300/80 mb-3 uppercase tracking-[0.15em]";
const ledgerInput =
  "block w-full rounded border border-white/10 bg-black/20 px-5 py-4 font-display text-xl font-light tracking-tight text-ivory shadow-inner outline-none transition-all [color-scheme:dark] placeholder:text-white/20 hover:border-white/20 hover:bg-black/30 focus:border-gold-400 focus:bg-black/40 focus:ring-1 focus:ring-gold-400/50";

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "EP";
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

/** Gold corner ticks — frames the portrait like a numbered saddle plate. */
function FrameTicks() {
  return (
    <>
      <span aria-hidden="true" className="absolute -left-1.5 -top-1.5 h-3.5 w-3.5 border-l border-t border-gold-400" />
      <span aria-hidden="true" className="absolute -right-1.5 -top-1.5 h-3.5 w-3.5 border-r border-t border-gold-400" />
      <span aria-hidden="true" className="absolute -bottom-1.5 -left-1.5 h-3.5 w-3.5 border-b border-l border-gold-400" />
      <span aria-hidden="true" className="absolute -bottom-1.5 -right-1.5 h-3.5 w-3.5 border-b border-r border-gold-400" />
    </>
  );
}

function normalizePhoneForProfile(value: string) {
  const trimmed = value.trim();
  if (/^[1-9]\d{8}$/.test(trimmed)) {
    return `0${trimmed}`;
  }
  return trimmed;
}

function ReadinessDiamond({ ready }: { ready: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`h-2 w-2 shrink-0 rotate-45 ${ready ? "bg-emerald-soft" : "border border-ivory-faint"}`}
    />
  );
}

export function ProfilePage() {
  useDocumentTitle("Profile | Night at the Races");
  const { session } = useClientSession();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast, show: showToast, dismiss: dismissToast } = useClientToast();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [address, setAddress] = useState("");
  const [avatarPreview, setAvatarPreview] = useState(defaultAvatar);
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);

  useEffect(() => {
    let active = true;

    async function fetchProfile() {
      try {
        setLoading(true);
        const data = await getMyProfile();

        if (!active) {
          return;
        }

        setProfile(data);
        setFullName(data.fullName || "");
        setPhone(data.phone || "");
        setGender(data.gender || "");
        setDateOfBirth(data.dateOfBirth || "");
        setAddress(data.address || "");
        setAvatarPreview(resolveFileUrl(data.avatarUrl) || defaultAvatar);
      } catch {
        if (active) {
          showToast("Unable to load your profile. Please try again.", "error");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    fetchProfile();

    return () => {
      active = false;
    };
  }, []);

  const profileComplete = Boolean(profile?.profileCompleted);

  const readinessItems: ReadinessItem[] = useMemo(
    () => [
      {
        label: "Full name",
        ready: fullName.trim().length > 0,
        helper: "Used by admins when reviewing personal role applications.",
      },
      {
        label: "Phone number",
        ready: phone.trim().length > 0,
        helper: "So operations can reach you quickly.",
      },
      {
        label: "Gender",
        ready: gender.trim().length > 0,
        helper: "Used for accurate member records and admin review context.",
      },
      {
        label: "Date of birth",
        ready: dateOfBirth.trim().length > 0,
        helper: "Keeps age-sensitive features and future eligibility checks consistent.",
      },
      {
        label: "Address",
        ready: address.trim().length > 0,
        helper: "Required before role requests can be reviewed.",
      },
      {
        label: "Profile saved",
        ready: profileComplete,
        helper: "Save your profile once all required information is ready.",
      },
    ],
    [address, dateOfBirth, fullName, gender, phone, profileComplete],
  );

  const readyCount = readinessItems.filter((item) => item.ready).length;
  const readinessLabel = `${readyCount} of ${readinessItems.length} ready`;
  const readinessPercent = Math.round((readyCount / readinessItems.length) * 100);
  const avatarLabel = avatarPreview ? "Profile avatar" : "Profile initials";

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!["image/jpeg", "image/jpg", "image/png"].includes(file.type)) {
      showToast("Only JPG, JPEG, or PNG avatar files are supported.", "error");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showToast("Avatar image must be 2MB or smaller.", "error");
      return;
    }

    setPendingAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!fullName.trim() || !phone.trim() || !gender.trim() || !dateOfBirth.trim() || !address.trim()) {
      showToast("Full name, phone number, gender, date of birth, and address are required.", "error");
      return;
    }

    try {
      setSaving(true);

      let finalAvatarUrl = profile?.avatarUrl || "";

      if (pendingAvatarFile) {
        const uploadResult = await uploadAvatar(pendingAvatarFile);
        finalAvatarUrl = uploadResult.url;
      }

      const updatedProfile = await updateMyProfile({
        fullName: fullName.trim(),
        phone: normalizePhoneForProfile(phone),
        gender,
        dateOfBirth,
        address: address.trim(),
        avatarUrl: finalAvatarUrl,
      });

      setProfile(updatedProfile);
      setPendingAvatarFile(null);
      showToast("Profile updated successfully.", "success");
    } catch (err: any) {
      showToast(err?.message || "Unable to update your profile. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="client-theme min-h-screen bg-turf-950 text-ivory">
        <ClientHeader />
        <main className="mx-auto max-w-[1400px] px-6 py-16 md:px-12">
          <p className="eyebrow text-gold-300">Opening the members&apos; book</p>
          <div className="mt-10 h-64 animate-pulse border border-white/10 bg-turf-900" />
          <div className="mt-8 grid grid-cols-2 gap-px md:grid-cols-6">
            {[0, 1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="h-32 animate-pulse border border-white/5 bg-turf-900/60" />
            ))}
          </div>
          <div className="mt-8 h-96 animate-pulse border border-white/10 bg-turf-900/40" />
        </main>
        <ClientFooter />
      </div>
    );
  }

  return (
    <div className="client-theme min-h-screen bg-turf-950 text-ivory">
      <ClientHeader />

      <main>
        {/* ═══ Identity hero — the member is the headline ═══════════════ */}
        <section className="grain relative isolate overflow-hidden border-b border-white/10">
          <div className="turf-vignette absolute inset-0 -z-10" />
          <div className="pointer-events-none absolute inset-y-0 right-0 -z-10 w-2/3 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.12),transparent_60%)]" />
          <div className="mx-auto max-w-[1400px] px-6 pb-14 pt-12 md:px-12 md:pb-16 md:pt-16">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <Eyebrow tone="gold">The Members&apos; Book · Season 2026</Eyebrow>
              <span
                className={`inline-flex items-center gap-2 rounded-full border bg-turf-950/60 px-3 py-1 ${
                  profileComplete ? "border-emerald-glow/40" : "border-gold-400/40"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${profileComplete ? "bg-emerald-soft" : "bg-gold-300"}`}
                  aria-hidden="true"
                />
                <span className={`eyebrow ${profileComplete ? "text-emerald-soft" : "text-gold-300"}`}>
                  {profileComplete ? "Profile Complete" : "Needs Update"}
                </span>
              </span>
            </div>

            <h1 className="mt-6 font-display text-xl font-light tracking-tight text-ivory-dim md:text-2xl">
              Member Credentials<span className="text-foil">.</span>
            </h1>

            <div className="mt-10 grid gap-10 lg:grid-cols-[auto_1fr_auto] lg:items-end">
              <div className="relative h-32 w-32 md:h-40 md:w-40">
                <FrameTicks />
                <div className="flex h-full w-full items-center justify-center overflow-hidden bg-turf-900 font-display text-4xl font-light text-gold-200">
                  {avatarPreview ? (
                    <img alt={avatarLabel} className="h-full w-full object-cover" src={avatarPreview} />
                  ) : (
                    <span>{getInitials(fullName)}</span>
                  )}
                </div>
              </div>

              <div className="min-w-0">
                <p className="font-display text-5xl font-light leading-[0.95] tracking-tight text-ivory md:text-7xl">
                  {fullName.trim() || "Unnamed Member"}
                </p>
                <p className="mt-5 max-w-xl text-base leading-relaxed text-ivory-dim">
                  {profileComplete
                    ? "Your account is ready for personal role applications."
                    : "Complete required fields before applying for a role."}
                </p>
              </div>

              <div className="flex flex-col gap-5 lg:items-end lg:text-right">
                <div>
                  <p className="font-data text-foil text-6xl font-semibold leading-none">{readinessPercent}%</p>
                  <p className="eyebrow mt-3 text-ivory-faint">Application readiness</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link
                    to="/join-us"
                    className="inline-flex min-h-11 items-center border border-white/15 px-4 text-xs font-bold uppercase tracking-[0.14em] text-ivory transition-colors hover:border-gold-400/60 hover:text-gold-200"
                  >
                    Go to Join Us
                  </Link>
                  {profileComplete ? (
                    <Link
                      to="/my-role-requests"
                      className="inline-flex min-h-11 items-center gap-2 bg-gold-400 px-4 text-xs font-bold uppercase tracking-[0.14em] text-turf-950 transition-colors hover:bg-gold-300"
                    >
                      Continue to Role Application
                      <ArrowRight size={14} aria-hidden="true" />
                    </Link>
                  ) : (
                    <a
                      href="#profile-form"
                      className="inline-flex min-h-11 items-center gap-2 border border-gold-400/50 px-4 text-xs font-bold uppercase tracking-[0.14em] text-gold-300 transition-colors hover:bg-gold-400 hover:text-turf-950"
                    >
                      Complete Required Fields
                      <ArrowRight size={14} aria-hidden="true" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Finish-line readiness track */}
            <div className="mt-14">
              <div className="relative h-px w-full bg-white/10">
                <div
                  aria-hidden="true"
                  className="gold-rule absolute inset-y-0 left-0 transition-all duration-700"
                  style={{ width: `${readinessPercent}%` }}
                />
                <span
                  aria-hidden="true"
                  className="absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rotate-45 bg-gold-400 transition-all duration-700"
                  style={{ left: `calc(${readinessPercent}% - 5px)` }}
                />
              </div>
              <div className="mt-4 flex items-center justify-between">
                <p className="font-data text-[10px] uppercase tracking-[0.22em] text-ivory-faint">Paddock</p>
                <p className="font-data text-xs uppercase tracking-[0.18em] text-gold-300">{readinessLabel}</p>
                <p className="font-data text-[10px] uppercase tracking-[0.22em] text-ivory-faint">Finish Post</p>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ Form guide — six numbered gates ══════════════════════════ */}
        <MotionReveal as="section" className="border-b border-white/10 bg-turf-900/40">
          <ol className="mx-auto grid max-w-[1400px] grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
            {readinessItems.map((item, index) => (
              <li
                key={item.label}
                className="border-b border-r border-white/5 p-6 transition-colors last:border-r-0 hover:bg-white/[0.02] md:border-b-0"
              >
                <div className="flex items-center justify-between">
                  <span className={`font-data text-xs ${item.ready ? "text-emerald-soft" : "text-ivory-faint"}`}>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <ReadinessDiamond ready={item.ready} />
                </div>
                <p className="mt-5 text-sm font-bold text-ivory">{item.label}</p>
                <p className="mt-1.5 text-xs leading-5 text-ivory-faint">{item.helper}</p>
              </li>
            ))}
          </ol>
        </MotionReveal>

        {/* ═══ The ledger — write your record ═══════════════════════════ */}
        <MotionReveal as="section" delay={0.08} className="mx-auto max-w-5xl px-6 py-16 md:px-12 md:py-20">
          <div id="profile-form" aria-labelledby="profile-form-title">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <Eyebrow tone="gold">Profile details</Eyebrow>
                <h2 id="profile-form-title" className="mt-4 font-display text-4xl font-light tracking-tight md:text-5xl">
                  Write your record.
                </h2>
              </div>
              <p className="max-w-xs text-sm leading-relaxed text-ivory-dim">
                These details are shown to administrators during role request review.
              </p>
            </div>

            <form className="mt-10" onSubmit={handleSubmit}>
              {/* 01 · Identity */}
              <div className="grid gap-8 border-t border-white/10 py-12 lg:grid-cols-[200px_1fr] lg:gap-14">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full border border-gold-400/30 bg-gold-400/10 font-data text-[10px] font-bold text-gold-300">01</span>
                    <h3 className="font-display text-2xl font-light tracking-tight text-ivory">Identity</h3>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-ivory-dim">Who appears in the members&apos; book.</p>
                </div>
                <div className="grid gap-10 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className={ledgerLabel} htmlFor="fullName">
                      Full name
                    </label>
                    <input
                      className={ledgerInput}
                      id="fullName"
                      onChange={(event) => setFullName(event.target.value)}
                      placeholder="Nguyen Van A"
                      type="text"
                      value={fullName}
                    />
                  </div>
                  <div>
                    <label className={ledgerLabel} htmlFor="gender">
                      Gender
                    </label>
                    <select
                      className={ledgerInput}
                      id="gender"
                      onChange={(event) => setGender(event.target.value)}
                      value={gender}
                    >
                      <option value="">Select gender</option>
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                      <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                    </select>
                  </div>
                  <div>
                    <label className={ledgerLabel} htmlFor="dateOfBirth">
                      Date of birth
                    </label>
                    <input
                      className={ledgerInput}
                      id="dateOfBirth"
                      max={new Date().toISOString().slice(0, 10)}
                      onChange={(event) => setDateOfBirth(event.target.value)}
                      type="date"
                      value={dateOfBirth}
                    />
                  </div>
                </div>
              </div>

              {/* 02 · Contact */}
              <div className="grid gap-8 border-t border-white/10 py-12 lg:grid-cols-[200px_1fr] lg:gap-14">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full border border-gold-400/30 bg-gold-400/10 font-data text-[10px] font-bold text-gold-300">02</span>
                    <h3 className="font-display text-2xl font-light tracking-tight text-ivory">Contact</h3>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-ivory-dim">How operations reaches you on race day.</p>
                </div>
                <div className="grid gap-10 sm:grid-cols-2">
                  <div>
                    <label className={ledgerLabel} htmlFor="phone">
                      Phone number
                    </label>
                    <input
                      className={ledgerInput}
                      id="phone"
                      inputMode="tel"
                      onChange={(event) => setPhone(event.target.value)}
                      placeholder="0901 234 567"
                      type="tel"
                      value={phone}
                    />
                    <p className="mt-2 text-xs text-ivory-faint">So operations can reach you on race day.</p>
                  </div>
                  <div>
                    <label className={ledgerLabel} htmlFor="emailAddress">
                      Email address
                    </label>
                    <input
                      className={`${ledgerInput} cursor-not-allowed border-white/5 bg-white/5 text-ivory-faint shadow-none`}
                      id="emailAddress"
                      readOnly
                      type="email"
                      value={profile?.email || session?.email || ""}
                    />
                  </div>
                </div>
              </div>

              {/* 03 · Residence */}
              <div className="grid gap-8 border-t border-white/10 py-12 lg:grid-cols-[200px_1fr] lg:gap-14">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full border border-gold-400/30 bg-gold-400/10 font-data text-[10px] font-bold text-gold-300">03</span>
                    <h3 className="font-display text-2xl font-light tracking-tight text-ivory">Residence</h3>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-ivory-dim">Required before role requests are reviewed.</p>
                </div>
                <div>
                  <label className={ledgerLabel} htmlFor="address">
                    Address
                  </label>
                  <textarea
                    className="block min-h-[140px] w-full resize-y rounded border border-white/10 bg-black/20 px-5 py-4 font-display text-xl font-light leading-relaxed tracking-tight text-ivory shadow-inner outline-none transition-all placeholder:text-white/20 hover:border-white/20 hover:bg-black/30 focus:border-gold-400 focus:bg-black/40 focus:ring-1 focus:ring-gold-400/50"
                    id="address"
                    onChange={(event) => setAddress(event.target.value)}
                    placeholder="District 1, Ho Chi Minh City"
                    value={address}
                  />
                </div>
              </div>

              {/* 04 · Portrait */}
              <div className="grid gap-8 border-t border-white/10 py-12 lg:grid-cols-[200px_1fr] lg:gap-14">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full border border-gold-400/30 bg-gold-400/10 font-data text-[10px] font-bold text-gold-300">04</span>
                    <h3 className="font-display text-2xl font-light tracking-tight text-ivory">Portrait</h3>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-ivory-dim">JPG or PNG, up to 2MB.</p>
                </div>
                <div className="flex flex-wrap items-start gap-8">
                  <div className="relative h-28 w-28 shrink-0">
                    <FrameTicks />
                    <div className="flex h-full w-full items-center justify-center overflow-hidden rounded bg-turf-900 font-display text-3xl font-light text-gold-200">
                      {avatarPreview ? (
                        <img alt={avatarLabel} className="h-full w-full object-cover" src={avatarPreview} />
                      ) : (
                        <span>{getInitials(fullName)}</span>
                      )}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <label className={ledgerLabel} htmlFor="avatar">
                      Avatar
                    </label>
                    <div className="mt-1 flex w-full justify-center rounded border border-dashed border-white/20 bg-black/10 px-6 py-8 transition-colors hover:border-gold-400/50 hover:bg-black/20">
                      <div className="text-center">
                        <UploadCloud className="mx-auto h-8 w-8 text-gold-400/60" aria-hidden="true" />
                        <div className="mt-4 flex text-sm leading-6 text-ivory-dim justify-center">
                          <label
                            htmlFor="avatar"
                            className="relative cursor-pointer rounded-md font-semibold text-gold-300 focus-within:outline-none hover:text-gold-200"
                          >
                            <span>Upload a file</span>
                            <input
                              id="avatar"
                              name="avatar"
                              type="file"
                              className="sr-only"
                              accept="image/jpeg,image/jpg,image/png"
                              onChange={handleFileChange}
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs leading-5 text-ivory-faint mt-1">PNG, JPG up to 2MB</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sign the book */}
              <div className="flex flex-col gap-6 border-t border-white/10 pt-10 sm:flex-row sm:items-center sm:justify-between">
                <p className="max-w-sm text-sm leading-relaxed text-ivory-faint">
                  Saving updates your application readiness immediately.
                </p>
                <button
                  className="group inline-flex min-h-14 items-center justify-center gap-3 bg-gold-400 px-12 font-data text-xs font-bold uppercase tracking-[0.15em] text-turf-950 transition-all hover:bg-gold-300 hover:shadow-[0_0_20px_rgba(212,175,55,0.3)] disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={saving}
                  type="submit"
                >
                  {saving ? "Saving Profile..." : "Save Profile"}
                  {!saving && <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />}
                </button>
              </div>
            </form>
          </div>
        </MotionReveal>
      </main>
      <ClientFooter />
      <ClientToast toast={toast} onDismiss={dismissToast} />
    </div>
  );
}
