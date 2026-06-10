import { FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Circle, ShieldCheck, UploadCloud, UserRound } from "lucide-react";

import { getMyProfile, updateMyProfile, uploadAvatar } from "../../api/profileApi";
import { useClientSession } from "../../hooks/useClientSession";
import { ClientHeader } from "../../components/client/ClientHeader";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { Profile } from "../../types/profile";
import { sanitizePhoneNumber, validateVietnamesePhone } from "../../utils/validation";

type ReadinessItem = {
  label: string;
  ready: boolean;
  helper: string;
};

const defaultAvatar = "";

function normalizePhoneForInput(value: string) {
  if (value.startsWith("+84")) {
    return value.slice(3);
  }

  if (value.startsWith("84") && value.length > 9) {
    return value.slice(2);
  }

  if (value.startsWith("0")) {
    return value.slice(1);
  }

  return value;
}

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

function ReadinessMark({ ready }: { ready: boolean }) {
  return (
    <span aria-hidden="true" className={`mt-0.5 shrink-0 ${ready ? "text-[#006d5b]" : "text-amber-600"}`}>
      {ready ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
    </span>
  );
}

export function ProfilePage() {
  useDocumentTitle("Profile | Horse Racing Tournament");
  const { session } = useClientSession();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [address, setAddress] = useState("");
  const [countryCode, setCountryCode] = useState("+84");
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
        setPhone(normalizePhoneForInput(data.phone || ""));
        setGender(data.gender || "");
        setDateOfBirth(data.dateOfBirth || "");
        setAddress(data.address || "");
        setAvatarPreview(data.avatarUrl || defaultAvatar);
        setError(null);
      } catch {
        if (active) {
          setError("Unable to load your profile. Please try again.");
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

  const fullPhoneNumber = `${countryCode}${phone}`;
  const cleanedPhone = sanitizePhoneNumber(fullPhoneNumber);
  const profileComplete = Boolean(profile?.profileCompleted);

  const readinessItems: ReadinessItem[] = useMemo(
    () => [
      {
        label: "Full name",
        ready: fullName.trim().length > 0,
        helper: "Used by admins when reviewing specialist applications.",
      },
      {
        label: "Phone number",
        ready: phone.trim().length > 0 && validateVietnamesePhone(fullPhoneNumber),
        helper: "A valid Vietnam phone number helps operations contact you quickly.",
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
    [address, dateOfBirth, fullName, fullPhoneNumber, gender, phone, profileComplete],
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
      setError("Only JPG, JPEG, or PNG avatar files are supported.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError("Avatar image must be 2MB or smaller.");
      return;
    }

    setError(null);
    setPendingAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!fullName.trim() || !phone.trim() || !gender.trim() || !dateOfBirth.trim() || !address.trim()) {
      setError("Full name, phone number, gender, date of birth, and address are required.");
      setSuccess(null);
      return;
    }

    if (!validateVietnamesePhone(fullPhoneNumber)) {
      setError("Phone number must be a valid Vietnam mobile number.");
      setSuccess(null);
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      let finalAvatarUrl = profile?.avatarUrl || "";

      if (pendingAvatarFile) {
        const uploadResult = await uploadAvatar(pendingAvatarFile);
        finalAvatarUrl = uploadResult.url;
      }

      const updatedProfile = await updateMyProfile({
        fullName: fullName.trim(),
        phone: cleanedPhone,
        gender,
        dateOfBirth,
        address: address.trim(),
        avatarUrl: finalAvatarUrl,
      });

      setProfile(updatedProfile);
      setPendingAvatarFile(null);
      setSuccess("Profile updated successfully.");
    } catch (err: any) {
      setError(err?.message || "Unable to update your profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-dvh bg-[#f3f6f4] text-slate-950">
        <ClientHeader />
        <section className="mx-auto max-w-[1536px] px-5 py-8 sm:px-7 lg:px-8">
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#006d5b]">Loading profile</p>
            <div className="mt-5 grid gap-6 lg:grid-cols-[0.72fr_1.28fr]">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
                <div className="h-24 w-24 rounded-full bg-slate-200" />
                <div className="mt-5 h-7 w-56 rounded-md bg-slate-200" />
                <div className="mt-3 h-4 w-64 rounded-md bg-slate-100" />
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-5">
                <div className="h-7 w-72 rounded-md bg-slate-200" />
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {[1, 2, 3, 4].map((item) => (
                    <div className="h-12 rounded-md bg-slate-100" key={item} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[#f3f6f4] text-slate-950">
      <ClientHeader />

      <section className="mx-auto max-w-[1536px] px-5 py-8 sm:px-7 lg:px-8">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-end">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.14em] text-[#006d5b]">Credential workspace</p>
              <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950 md:text-5xl">Member Credentials</h1>
              <p className="mt-3 max-w-2xl text-base font-bold leading-7 text-slate-600">
                Keep your account ready for tournament applications, specialist role requests, and admin review.
              </p>
            </div>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-[#006d5b]">Profile completion</p>
                  <p className="mt-2 text-4xl font-black text-slate-950">{readinessPercent}%</p>
                </div>
                <ShieldCheck className="h-10 w-10 text-[#006d5b]" aria-hidden="true" />
              </div>
              <div className="mt-4 h-2 rounded-full bg-white">
                <div
                  aria-hidden="true"
                  className="h-full rounded-full bg-[#006d5b] transition-all"
                  style={{ width: `${readinessPercent}%` }}
                />
              </div>
              <p className="mt-3 text-sm font-bold text-emerald-900">{readinessLabel}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1536px] gap-8 px-5 pb-12 sm:px-7 lg:grid-cols-[0.78fr_1.22fr] lg:px-8">
        <aside className="space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-5">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#006d5b] text-3xl font-black uppercase text-white ring-4 ring-emerald-50">
                {avatarPreview ? (
                  <img alt={avatarLabel} className="h-full w-full object-cover" src={avatarPreview} />
                ) : (
                  <span>{getInitials(fullName)}</span>
                )}
              </div>
              <div>
                <p className={`text-xs font-black uppercase tracking-[0.16em] ${profileComplete ? "text-[#006d5b]" : "text-amber-700"}`}>
                  {profileComplete ? "Profile Complete" : "Needs Update"}
                </p>
                <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                  {fullName.trim() || "Unnamed Member"}
                </h2>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  {profileComplete
                    ? "Your account is ready for specialist role applications."
                    : "Complete required fields before applying for a role."}
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <a
                className="inline-flex min-h-12 items-center justify-center rounded-md bg-slate-950 px-4 py-3 text-sm font-black text-white transition hover:bg-[#006d5b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#006d5b]"
                href="/join-us"
              >
                Go to Join Us
              </a>
              <a
                className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-md px-4 py-3 text-center text-sm font-black transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#006d5b] ${
                  profileComplete
                    ? "bg-[#006d5b] text-white hover:bg-[#004d3d]"
                    : "border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100"
                }`}
                href={profileComplete ? "/my-role-requests" : "#profile-form"}
              >
                {profileComplete ? "Continue to Role Application" : "Complete Required Fields"}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#006d5b]">Application readiness</p>
                <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">{readinessLabel}</h2>
              </div>
              <div className="text-right text-5xl font-black tracking-tight text-[#006d5b]">
                {readinessPercent}%
              </div>
            </div>

            <div className="mt-6 h-2 rounded-full bg-slate-200">
              <div
                aria-hidden="true"
                className="h-full rounded-full bg-[#006d5b] transition-all"
                style={{ width: `${readinessPercent}%` }}
              />
            </div>

            <ul className="mt-7 space-y-5">
              {readinessItems.map((item) => (
                <li className="flex gap-3" key={item.label}>
                  <ReadinessMark ready={item.ready} />
                  <div>
                    <p className="text-sm font-black text-slate-950">{item.label}</p>
                    <p className="mt-1 text-sm font-bold leading-6 text-slate-500">{item.helper}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <section id="profile-form" className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm" aria-labelledby="profile-form-title">
          <div className="mb-8 flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#006d5b]">Profile details</p>
              <h2 id="profile-form-title" className="mt-2 text-4xl font-black tracking-tight text-slate-950">
                Review Your Information
              </h2>
            </div>
            <p className="max-w-sm text-sm font-bold leading-6 text-slate-500">
              These details are shown to administrators during role request review.
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-800" role="alert">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-6 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800" role="status">
              {success}
            </div>
          )}

          <form className="space-y-7" onSubmit={handleSubmit}>
            <div className="grid gap-6 lg:grid-cols-[0.7fr_1.3fr]">
              <div>
                <label className="block text-xs font-black uppercase tracking-[0.16em] text-[#006d5b]" htmlFor="avatar">
                  Avatar
                </label>
                <div className="mt-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#006d5b] text-xl font-black uppercase text-white">
                      {avatarPreview ? (
                        <img alt={avatarLabel} className="h-full w-full object-cover" src={avatarPreview} />
                      ) : (
                        <span>{getInitials(fullName)}</span>
                      )}
                    </div>
                    <div>
                      <p className="flex items-center gap-2 text-sm font-black text-slate-950">
                        <UploadCloud className="h-4 w-4 text-[#006d5b]" aria-hidden="true" />
                        Upload profile image
                      </p>
                      <p className="mt-1 text-xs font-bold leading-5 text-slate-500">JPG or PNG, up to 2MB.</p>
                    </div>
                  </div>
                  <input
                    accept="image/jpeg,image/jpg,image/png"
                    className="mt-4 block w-full text-sm font-bold text-slate-600 file:mr-4 file:min-h-11 file:cursor-pointer file:rounded-md file:border-0 file:bg-slate-950 file:px-4 file:py-2 file:text-xs file:font-black file:text-white hover:file:bg-[#006d5b]"
                    id="avatar"
                    onChange={handleFileChange}
                    type="file"
                  />
                </div>
              </div>

              <div className="grid gap-6">
                <div>
                  <label className="block text-xs font-black uppercase tracking-[0.16em] text-[#006d5b]" htmlFor="fullName">
                    Full name
                  </label>
                  <input
                    className="mt-2 block min-h-12 w-full rounded-md border border-slate-300 px-4 py-3 text-base font-bold text-slate-950 outline-none transition focus:border-[#006d5b] focus:ring-2 focus:ring-[#006d5b]/20"
                    id="fullName"
                    onChange={(event) => setFullName(event.target.value)}
                    placeholder="Nguyen Van A"
                    type="text"
                    value={fullName}
                  />
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-[0.16em] text-[#006d5b]" htmlFor="gender">
                      Gender
                    </label>
                    <select
                      className="mt-2 block min-h-12 w-full rounded-md border border-slate-300 bg-white px-4 py-3 text-base font-bold text-slate-950 outline-none transition focus:border-[#006d5b] focus:ring-2 focus:ring-[#006d5b]/20"
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
                    <label className="block text-xs font-black uppercase tracking-[0.16em] text-[#006d5b]" htmlFor="dateOfBirth">
                      Date of birth
                    </label>
                    <input
                      className="mt-2 block min-h-12 w-full rounded-md border border-slate-300 px-4 py-3 text-base font-bold text-slate-950 outline-none transition focus:border-[#006d5b] focus:ring-2 focus:ring-[#006d5b]/20"
                      id="dateOfBirth"
                      max={new Date().toISOString().slice(0, 10)}
                      onChange={(event) => setDateOfBirth(event.target.value)}
                      type="date"
                      value={dateOfBirth}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-[0.16em] text-[#006d5b]" htmlFor="phone">
                    Phone number
                  </label>
                  <div className="mt-2 grid grid-cols-[112px_1fr]">
                    <label className="sr-only" htmlFor="countryCode">
                      Country code
                    </label>
                    <select
                      className="min-h-12 rounded-l-md border border-r-0 border-slate-300 bg-slate-50 px-3 text-sm font-black text-slate-950 outline-none focus:border-[#006d5b] focus:ring-2 focus:ring-[#006d5b]/20"
                      id="countryCode"
                      onChange={(event) => setCountryCode(event.target.value)}
                      value={countryCode}
                    >
                      <option value="+84">VN +84</option>
                      <option value="+1">US +1</option>
                      <option value="+81">JP +81</option>
                    </select>
                    <input
                      className="min-h-12 rounded-r-md border border-slate-300 px-4 py-3 text-base font-bold text-slate-950 outline-none transition focus:border-[#006d5b] focus:ring-2 focus:ring-[#006d5b]/20"
                      id="phone"
                      inputMode="tel"
                      onChange={(event) => setPhone(event.target.value)}
                      placeholder="901234567"
                      type="text"
                      value={phone}
                    />
                  </div>
                  <p className="mt-2 text-xs font-bold text-slate-500">Vietnam mobile format is validated before saving.</p>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-[0.16em] text-[#006d5b]" htmlFor="emailAddress">
                    Email address
                  </label>
                  <input
                    className="mt-2 block min-h-12 w-full cursor-not-allowed rounded-md border border-slate-300 bg-slate-50 px-4 py-3 text-base font-bold text-slate-500 outline-none"
                    id="emailAddress"
                    readOnly
                    type="email"
                    value={profile?.email || session?.email || ""}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-[0.16em] text-[#006d5b]" htmlFor="address">
                Address
              </label>
              <textarea
                className="mt-2 block min-h-28 w-full rounded-md border border-slate-300 px-4 py-3 text-base font-bold leading-7 text-slate-950 outline-none transition focus:border-[#006d5b] focus:ring-2 focus:ring-[#006d5b]/20"
                id="address"
                onChange={(event) => setAddress(event.target.value)}
                placeholder="District 1, Ho Chi Minh City"
                value={address}
              />
            </div>

            <div className="flex flex-col gap-4 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-bold text-slate-500">
                Saving updates your application readiness immediately.
              </p>
              <button
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[#006d5b] px-8 py-4 text-sm font-black text-white shadow-[0_16px_34px_rgba(0,77,61,0.18)] transition hover:bg-[#004d3d] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#006d5b]"
                disabled={saving}
                type="submit"
              >
                <UserRound className="h-4 w-4" aria-hidden="true" />
                {saving ? "Saving Profile..." : "Save Profile"}
              </button>
            </div>
          </form>
        </section>
      </section>
    </div>
  );
}
