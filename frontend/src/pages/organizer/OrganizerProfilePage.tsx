import { FormEvent, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BadgeCheck, Building2, Camera, Check, Loader2 } from "lucide-react";

import { getMyOrganization } from "../../api/racingApi";
import { getMyProfile, updateMyProfile, uploadAvatar } from "../../api/profileApi";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import type { Profile } from "../../types/profile";
import type { Organization } from "../../types/racing";
import { getApiErrorMessage } from "../../utils/apiError";

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "OP";
  return parts.slice(0, 2).map((p) => p[0]).join("").toUpperCase();
}

const ORG_STATUS_TONE: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  ACTIVE: "bg-emerald-100 text-emerald-800",
  SUSPENDED: "bg-rose-100 text-rose-700",
  REJECTED: "bg-rose-100 text-rose-700",
};

const fieldClass =
  "mt-1.5 block w-full rounded-lg border border-[#e2d9c8] bg-white px-3.5 py-2.5 text-sm font-semibold text-[#3a342d] outline-none transition placeholder:font-medium placeholder:text-[#b3a892] focus:border-[#bb8a3c] focus:ring-2 focus:ring-[#bb8a3c]/20 disabled:cursor-not-allowed disabled:opacity-60";
const labelClass = "text-[11px] font-black uppercase tracking-[0.12em] text-[#8a8276]";

type FormState = {
  fullName: string;
  phone: string;
  gender: string;
  dateOfBirth: string;
  address: string;
  avatarUrl: string;
};

export function OrganizerProfilePage() {
  useDocumentTitle("Profile | Organizer");

  const [profile, setProfile] = useState<Profile | null>(null);
  const [org, setOrg] = useState<Organization | null>(null);
  const [form, setForm] = useState<FormState>({
    fullName: "",
    phone: "",
    gender: "",
    dateOfBirth: "",
    address: "",
    avatarUrl: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const [p, o] = await Promise.allSettled([getMyProfile(), getMyOrganization()]);
      if (!active) return;
      if (p.status === "fulfilled") {
        setProfile(p.value);
        setForm({
          fullName: p.value.fullName ?? "",
          phone: p.value.phone ?? "",
          gender: p.value.gender ?? "",
          dateOfBirth: p.value.dateOfBirth ?? "",
          address: p.value.address ?? "",
          avatarUrl: p.value.avatarUrl ?? "",
        });
      } else {
        setError(getApiErrorMessage(p.reason, "Could not load your profile."));
      }
      if (o.status === "fulfilled") setOrg(o.value);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const set = (key: keyof FormState, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  };

  const handleAvatar = async (file: File) => {
    try {
      setUploadingAvatar(true);
      setError(null);
      const { url } = await uploadAvatar(file);
      setForm((f) => ({ ...f, avatarUrl: url }));
      setImgError(false);
      setSaved(false);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not upload the photo."));
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (form.fullName.trim().length < 2) {
      setError("Please enter your full name.");
      return;
    }
    try {
      setSaving(true);
      setError(null);
      const updated = await updateMyProfile({
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        gender: form.gender,
        dateOfBirth: form.dateOfBirth,
        address: form.address.trim(),
        avatarUrl: form.avatarUrl || undefined,
      });
      setProfile(updated);
      setSaved(true);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not save your changes."));
    } finally {
      setSaving(false);
    }
  };

  const displayName = form.fullName || profile?.fullName || "Organizer";
  const showAvatar = Boolean(form.avatarUrl) && !imgError;

  return (
    <div className="mx-auto max-w-3xl space-y-7">
      <div>
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#a8801f]">Workspace</p>
        <h1 className="mt-2 font-display text-3xl font-light tracking-tight text-[#211d1a] md:text-4xl">Profile</h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#6f665b]">
          Your personal account on the platform. Keep it current — this is the identity behind every approval you sign.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-bold text-rose-700" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <div className="h-72 animate-pulse rounded-xl border border-[#e7e0d3] bg-white" />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-7">
          {/* Identity ─────────────────────────────────── */}
          <section className="overflow-hidden rounded-xl border border-[#e7e0d3] bg-[#1c1816] text-[#efe9df]">
            <div className="flex flex-wrap items-center gap-5 px-6 py-7 sm:px-8">
              <div className="relative">
                <span className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-[#bb8a3c] font-display text-3xl font-semibold text-[#1c1816]">
                  {showAvatar ? (
                    <img
                      src={form.avatarUrl}
                      alt={displayName}
                      className="h-full w-full object-cover"
                      onError={() => setImgError(true)}
                    />
                  ) : (
                    getInitials(displayName)
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  disabled={uploadingAvatar}
                  aria-label="Change profile photo"
                  className="absolute -bottom-1.5 -right-1.5 flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#1c1816] bg-white text-[#3a342d] shadow-md transition hover:bg-[#f3ead6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#cfa24f] disabled:opacity-60"
                >
                  {uploadingAvatar ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                </button>
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void handleAvatar(f);
                    e.target.value = "";
                  }}
                />
              </div>

              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#cfa24f]">Account holder</p>
                <h2 className="mt-1 truncate font-display text-2xl font-light text-white">{displayName}</h2>
                <p className="mt-1 truncate text-sm text-white/55">{profile?.email}</p>
              </div>

              <div className="ml-auto flex flex-col items-end gap-2">
                <div className="flex flex-wrap justify-end gap-1.5">
                  {(profile?.roles?.length ? profile.roles : ["ORGANIZER"]).map((r) => (
                    <span key={r} className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-[#cfa24f]">
                      {r}
                    </span>
                  ))}
                </div>
                {profile?.ageVerified && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-emerald-300/90">
                    <BadgeCheck className="h-3.5 w-3.5" /> Age verified
                  </span>
                )}
              </div>
            </div>
          </section>

          {/* Editable details ─────────────────────────── */}
          <section className="overflow-hidden rounded-xl border border-[#e7e0d3] bg-white">
            <div className="border-b border-[#efe9dd] px-6 py-5 sm:px-8">
              <h2 className="font-display text-xl font-light tracking-tight text-[#211d1a]">Personal details</h2>
            </div>
            <div className="grid gap-5 px-6 py-6 sm:grid-cols-2 sm:px-8">
              <div className="sm:col-span-2">
                <label className={labelClass} htmlFor="p-name">Full name</label>
                <input id="p-name" className={fieldClass} value={form.fullName} onChange={(e) => set("fullName", e.target.value)} placeholder="Your full name" />
              </div>
              <div>
                <label className={labelClass} htmlFor="p-email">Email</label>
                <input id="p-email" className={`${fieldClass} bg-[#f6f1e7] text-[#8a8276]`} value={profile?.email ?? ""} disabled readOnly />
                <p className="mt-1 text-[11px] text-[#a99f8c]">Email can’t be changed here.</p>
              </div>
              <div>
                <label className={labelClass} htmlFor="p-phone">Phone</label>
                <input id="p-phone" className={fieldClass} value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="e.g. 0901 234 567" />
              </div>
              <div>
                <label className={labelClass} htmlFor="p-gender">Gender</label>
                <select id="p-gender" className={fieldClass} value={form.gender} onChange={(e) => set("gender", e.target.value)}>
                  <option value="">Prefer not to say</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className={labelClass} htmlFor="p-dob">Date of birth</label>
                <input id="p-dob" type="date" className={fieldClass} value={form.dateOfBirth} onChange={(e) => set("dateOfBirth", e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass} htmlFor="p-address">Address</label>
                <input id="p-address" className={fieldClass} value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="City, country" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-[#efe9dd] bg-[#faf7f0] px-6 py-4 sm:px-8">
              {saved && (
                <span className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-700" aria-live="polite">
                  <Check className="h-4 w-4" /> Saved
                </span>
              )}
              <button
                type="submit"
                disabled={saving || uploadingAvatar}
                className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#1c1816] px-5 text-sm font-black uppercase tracking-wide text-[#f7f4ee] transition hover:bg-[#2a241f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#bb8a3c] disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </section>

          {/* Organization summary ─────────────────────── */}
          {org && (
            <Link
              to="/organizer/organization"
              className="group flex items-center gap-4 rounded-xl border border-[#e7e0d3] bg-white px-6 py-5 transition hover:border-[#bb8a3c] hover:bg-[#fdf8ee] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#bb8a3c] sm:px-8"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#1c1816] text-[#cfa24f]">
                <Building2 className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#a99f8c]">Your organization</p>
                <p className="truncate font-display text-lg font-light text-[#211d1a]">{org.name}</p>
              </div>
              <span className={`ml-auto rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wide ${ORG_STATUS_TONE[org.status] ?? "bg-[#efe9dd] text-[#8a8276]"}`}>
                {org.status}
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-[#bdb3a0] transition group-hover:translate-x-0.5 group-hover:text-[#bb8a3c]" />
            </Link>
          )}
        </form>
      )}
    </div>
  );
}
