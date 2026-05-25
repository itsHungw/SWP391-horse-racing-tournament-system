import { FormEvent, useEffect, useMemo, useState } from "react";

import { getMyProfile, updateMyProfile, uploadAvatar } from "../../api/profileApi";
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
    <span
      aria-hidden="true"
      className={`mt-1 h-4 w-4 shrink-0 rounded-full border-4 ${
        ready ? "border-nyraGreen bg-nyraGreen" : "border-slate-300 bg-white"
      }`}
    />
  );
}

export function ProfilePage() {
  useDocumentTitle("Profile | Horse Racing Tournament");

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
      <div className="min-h-screen bg-white text-[#171717]">
        <ClientHeader />
        <section className="mx-auto max-w-[1536px] px-6 py-20 md:px-11">
          <div className="border-l-4 border-nyraGreen bg-slate-50 px-6 py-8">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-nyraGreen">Loading profile</p>
            <p className="mt-3 text-3xl font-black uppercase tracking-tight text-nyraDark">
              Preparing your credentials...
            </p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-[#171717]">
      <ClientHeader />

      <section className="border-b border-slate-200 bg-nyraDark text-white">
        <div className="mx-auto grid max-w-[1536px] gap-10 px-6 py-14 md:px-11 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-lime-400">Member profile</p>
            <h1 className="mt-4 text-5xl font-black uppercase leading-tight tracking-tight md:text-6xl">
              Member Credentials
            </h1>
            <p className="mt-5 max-w-2xl text-lg font-bold leading-8 text-white/70">
              Keep your profile ready for tournament applications, specialist role requests, and admin review.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              ["Status", profileComplete ? "Profile Complete" : "Needs Update"],
              ["Readiness", readinessLabel],
              ["Next step", profileComplete ? "Apply for role" : "Save profile"],
            ].map(([label, value]) => (
              <div className="border-t-4 border-lime-400 bg-white px-5 py-4 text-nyraDark" key={label}>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{label}</p>
                <p className="mt-2 text-xl font-black uppercase tracking-tight">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1536px] gap-8 px-6 py-12 md:px-11 lg:grid-cols-[0.78fr_1.22fr]">
        <aside className="space-y-6">
          <div className="border border-slate-200 bg-white p-7 shadow-sm">
            <div className="flex items-center gap-5">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-nyraGreen text-3xl font-black uppercase text-white">
                {avatarPreview ? (
                  <img alt={avatarLabel} className="h-full w-full object-cover" src={avatarPreview} />
                ) : (
                  <span>{getInitials(fullName)}</span>
                )}
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-nyraGreen">
                  {profileComplete ? "Profile Complete" : "Needs Update"}
                </p>
                <h2 className="mt-2 text-3xl font-black uppercase tracking-tight text-nyraDark">
                  {fullName.trim() || "Unnamed Member"}
                </h2>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  {profileComplete
                    ? "Your account is ready for specialist role applications."
                    : "Complete required fields before applying for a role."}
                </p>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3">
              <a
                className="inline-flex min-h-12 items-center justify-center rounded-sm bg-nyraDark px-4 py-3 text-sm font-black uppercase tracking-widest text-white transition hover:bg-nyraGreen focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-nyraGreen"
                href="/join-us"
              >
                Go to Join Us
              </a>
              <a
                className={`inline-flex min-h-12 items-center justify-center rounded-sm px-4 py-3 text-center text-sm font-black uppercase tracking-widest transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-nyraGreen ${
                  profileComplete
                    ? "bg-lime-400 text-black hover:bg-[#b7ff4a]"
                    : "border border-slate-300 bg-white text-slate-500"
                }`}
                href={profileComplete ? "/my-role-requests" : "#profile-form"}
              >
                {profileComplete ? "Continue to Role Application" : "Complete Required Fields"}
              </a>
            </div>
          </div>

          <div className="border border-slate-200 bg-slate-50 p-7">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-nyraGreen">Application readiness</p>
                <h2 className="mt-2 text-3xl font-black uppercase tracking-tight text-nyraDark">{readinessLabel}</h2>
              </div>
              <div className="text-right text-5xl font-black tracking-tight text-nyraGreen">
                {Math.round((readyCount / readinessItems.length) * 100)}%
              </div>
            </div>

            <div className="mt-6 h-2 bg-slate-200">
              <div
                aria-hidden="true"
                className="h-full bg-nyraGreen transition-all"
                style={{ width: `${(readyCount / readinessItems.length) * 100}%` }}
              />
            </div>

            <ul className="mt-7 space-y-5">
              {readinessItems.map((item) => (
                <li className="flex gap-3" key={item.label}>
                  <ReadinessMark ready={item.ready} />
                  <div>
                    <p className="text-sm font-black uppercase tracking-wider text-nyraDark">{item.label}</p>
                    <p className="mt-1 text-sm font-bold leading-6 text-slate-500">{item.helper}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <section id="profile-form" className="border border-slate-200 bg-white p-7 shadow-sm" aria-labelledby="profile-form-title">
          <div className="mb-8 flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-nyraGreen">Profile details</p>
              <h2 id="profile-form-title" className="mt-2 text-4xl font-black uppercase tracking-tight text-nyraDark">
                Review Your Information
              </h2>
            </div>
            <p className="max-w-sm text-sm font-bold leading-6 text-slate-500">
              These details are shown to administrators during role request review.
            </p>
          </div>

          {error && (
            <div className="mb-6 border-l-4 border-nyraRed bg-red-50 px-4 py-3 text-sm font-bold text-red-700" role="alert">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-6 border-l-4 border-nyraGreen bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800" role="status">
              {success}
            </div>
          )}

          <form className="space-y-7" onSubmit={handleSubmit}>
            <div className="grid gap-6 lg:grid-cols-[0.7fr_1.3fr]">
              <div>
                <label className="block text-xs font-black uppercase tracking-[0.16em] text-nyraGreen" htmlFor="avatar">
                  Avatar
                </label>
                <div className="mt-3 border border-dashed border-slate-300 bg-slate-50 p-5">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-nyraGreen text-xl font-black uppercase text-white">
                      {avatarPreview ? (
                        <img alt={avatarLabel} className="h-full w-full object-cover" src={avatarPreview} />
                      ) : (
                        <span>{getInitials(fullName)}</span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-black uppercase tracking-wider text-nyraDark">Upload profile image</p>
                      <p className="mt-1 text-xs font-bold leading-5 text-slate-500">JPG or PNG, up to 2MB.</p>
                    </div>
                  </div>
                  <input
                    accept="image/jpeg,image/jpg,image/png"
                    className="mt-4 block w-full text-sm font-bold text-slate-600 file:mr-4 file:min-h-11 file:cursor-pointer file:border-0 file:bg-nyraDark file:px-4 file:py-2 file:text-xs file:font-black file:uppercase file:tracking-widest file:text-white hover:file:bg-nyraGreen"
                    id="avatar"
                    onChange={handleFileChange}
                    type="file"
                  />
                </div>
              </div>

              <div className="grid gap-6">
                <div>
                  <label className="block text-xs font-black uppercase tracking-[0.16em] text-nyraGreen" htmlFor="fullName">
                    Full name
                  </label>
                  <input
                    className="mt-2 block min-h-12 w-full border border-slate-300 px-4 py-3 text-base font-bold text-nyraDark outline-none transition focus:border-nyraGreen focus:ring-2 focus:ring-nyraGreen/20"
                    id="fullName"
                    onChange={(event) => setFullName(event.target.value)}
                    placeholder="Nguyen Van A"
                    type="text"
                    value={fullName}
                  />
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-[0.16em] text-nyraGreen" htmlFor="gender">
                      Gender
                    </label>
                    <select
                      className="mt-2 block min-h-12 w-full border border-slate-300 bg-white px-4 py-3 text-base font-bold text-nyraDark outline-none transition focus:border-nyraGreen focus:ring-2 focus:ring-nyraGreen/20"
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
                    <label className="block text-xs font-black uppercase tracking-[0.16em] text-nyraGreen" htmlFor="dateOfBirth">
                      Date of birth
                    </label>
                    <input
                      className="mt-2 block min-h-12 w-full border border-slate-300 px-4 py-3 text-base font-bold text-nyraDark outline-none transition focus:border-nyraGreen focus:ring-2 focus:ring-nyraGreen/20"
                      id="dateOfBirth"
                      max={new Date().toISOString().slice(0, 10)}
                      onChange={(event) => setDateOfBirth(event.target.value)}
                      type="date"
                      value={dateOfBirth}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-[0.16em] text-nyraGreen" htmlFor="phone">
                    Phone number
                  </label>
                  <div className="mt-2 grid grid-cols-[112px_1fr]">
                    <label className="sr-only" htmlFor="countryCode">
                      Country code
                    </label>
                    <select
                      className="min-h-12 border border-r-0 border-slate-300 bg-slate-50 px-3 text-sm font-black text-nyraDark outline-none focus:border-nyraGreen focus:ring-2 focus:ring-nyraGreen/20"
                      id="countryCode"
                      onChange={(event) => setCountryCode(event.target.value)}
                      value={countryCode}
                    >
                      <option value="+84">VN +84</option>
                      <option value="+1">US +1</option>
                      <option value="+81">JP +81</option>
                    </select>
                    <input
                      className="min-h-12 border border-slate-300 px-4 py-3 text-base font-bold text-nyraDark outline-none transition focus:border-nyraGreen focus:ring-2 focus:ring-nyraGreen/20"
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
              </div>
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-[0.16em] text-nyraGreen" htmlFor="address">
                Address
              </label>
              <textarea
                className="mt-2 block min-h-28 w-full border border-slate-300 px-4 py-3 text-base font-bold leading-7 text-nyraDark outline-none transition focus:border-nyraGreen focus:ring-2 focus:ring-nyraGreen/20"
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
                className="inline-flex min-h-12 items-center justify-center rounded-sm bg-nyraGreen px-8 py-4 text-sm font-black uppercase tracking-widest text-white shadow-[0_16px_34px_rgba(0,77,61,0.18)] transition hover:bg-nyraLightGreen disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-nyraGreen"
                disabled={saving}
                type="submit"
              >
                {saving ? "Saving Profile..." : "Save Profile"}
              </button>
            </div>
          </form>
        </section>
      </section>
    </div>
  );
}
