import { FormEvent, useEffect, useMemo, useState } from "react";

import { getMyProfile } from "../../api/profileApi";
import { getMyRoleRequests, submitRoleRequest } from "../../api/roleRequestApi";
import { ClientHeader } from "../../components/client/ClientHeader";
import { SkeletonLoader } from "../../components/common/SkeletonLoader";
import { StatusBadge } from "../../components/StatusBadge";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { Profile } from "../../types/profile";
import { RoleRequest, RequestedRole } from "../../types/roleRequest";

type RoleOption = {
  role: RequestedRole;
  title: string;
  eyebrow: string;
  description: string;
  requirements: string[];
};

const roleOptions: RoleOption[] = [
  {
    role: "JOCKEY",
    title: "Jockey",
    eyebrow: "Race participation",
    description: "Apply for race-day access, lineup eligibility, and future performance tracking.",
    requirements: ["Complete profile", "Riding background", "Admin review"],
  },
  {
    role: "HORSE_OWNER",
    title: "Owner",
    eyebrow: "Stable operations",
    description: "Request owner access for stable participation and tournament operations workflows.",
    requirements: ["Verified account", "Owner intent", "Contact details"],
  },
  {
    role: "REFEREE",
    title: "Referee",
    eyebrow: "Tournament integrity",
    description: "Support fair tournament operations, race oversight, and structured review decisions.",
    requirements: ["Operational experience", "Clear reason", "Admin approval"],
  },
];

function normalizeRoleName(role: string): RequestedRole | null {
  const normalized = role.trim().toUpperCase();
  if (normalized === "OWNER") {
    return "HORSE_OWNER";
  }

  if (normalized === "HORSE_OWNER" || normalized === "JOCKEY" || normalized === "REFEREE") {
    return normalized;
  }

  return null;
}

function roleTitle(role: RequestedRole | string) {
  const normalized = normalizeRoleName(role);
  return roleOptions.find((option) => option.role === normalized)?.title ?? role.replace("_", " ");
}

function formatDate(value: string) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function statusTone(status: RoleRequest["status"]) {
  if (status === "APPROVED") {
    return "success";
  }

  if (status === "REJECTED" || status === "CANCELLED") {
    return "critical";
  }

  return "draft";
}

function statusLabel(status: RoleRequest["status"]) {
  const labels: Record<RoleRequest["status"], string> = {
    PENDING: "Under review",
    APPROVED: "Approved",
    REJECTED: "Rejected",
    CANCELLED: "Cancelled",
  };

  return labels[status];
}

function getApiErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "response" in error) {
    const response = (error as { response?: { data?: { message?: string; error?: string } } }).response;
    return response?.data?.message || response?.data?.error || "Unable to submit application.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to submit application.";
}

function ReadinessDot({ ready }: { ready: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`mt-1 h-4 w-4 shrink-0 rounded-full border-4 ${
        ready ? "border-nyraGreen bg-nyraGreen" : "border-slate-300 bg-white"
      }`}
    />
  );
}

export function MyRoleRequestsPage() {
  useDocumentTitle("Role Applications | Horse Racing Tournament");

  const [profile, setProfile] = useState<Profile | null>(null);
  const [requests, setRequests] = useState<RoleRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<RequestedRole>("JOCKEY");
  const [reason, setReason] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadInitialData() {
      try {
        setLoading(true);
        const [profileData, requestData] = await Promise.all([getMyProfile(), getMyRoleRequests()]);

        if (!active) {
          return;
        }

        setProfile(profileData);
        setRequests(requestData);
        setError(null);
      } catch {
        if (active) {
          setError("Unable to load your application workspace. Please try again.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadInitialData();

    return () => {
      active = false;
    };
  }, []);

  const profileCompleted = Boolean(profile?.profileCompleted);
  const selectedOption = roleOptions.find((option) => option.role === selectedRole) ?? roleOptions[0];

  const latestByRole = useMemo(() => {
    return requests.reduce<Partial<Record<RequestedRole, RoleRequest>>>((acc, request) => {
      if (!acc[request.requestedRole]) {
        acc[request.requestedRole] = request;
      }
      return acc;
    }, {});
  }, [requests]);

  const readinessItems = [
    {
      label: "Email verified",
      ready: true,
      helper: "Required before account access.",
    },
    {
      label: profileCompleted ? "Profile complete" : "Profile incomplete",
      ready: profileCompleted,
      helper: "Required before applications can be reviewed.",
    },

    {
      label: profile?.ageVerified ? "Age verified" : "Age verification pending",
      ready: Boolean(profile?.ageVerified),
      helper: "Used later for prediction eligibility.",
    },
  ];

  const selectedRequest = latestByRole[selectedRole];
  const activeSpecialistRole = useMemo(() => {
    const roleFromProfile = profile?.roles?.map(normalizeRoleName).find(Boolean);
    if (roleFromProfile) {
      return roleFromProfile;
    }

    return requests.find((request) => request.status === "APPROVED" && normalizeRoleName(request.requestedRole))
      ?.requestedRole;
  }, [profile?.roles, requests]);
  const pendingSpecialistRequest = useMemo(() => {
    if (activeSpecialistRole) {
      return undefined;
    }

    return requests.find((request) => request.status === "PENDING" && normalizeRoleName(request.requestedRole));
  }, [activeSpecialistRole, requests]);
  const specialistApplicationsLocked = Boolean(activeSpecialistRole || pendingSpecialistRequest);
  const selectedRoleBlocked =
    specialistApplicationsLocked || selectedRequest?.status === "PENDING" || selectedRequest?.status === "APPROVED";
  const canSubmit = profileCompleted && !selectedRoleBlocked && !submitting;

  const handleApply = async (event: FormEvent) => {
    event.preventDefault();

    const cleanReason = reason.trim();
    const cleanResumeUrl = resumeUrl.trim();

    if (!profileCompleted) {
      setError("Complete your profile before submitting an application.");
      return;
    }

    if (selectedRoleBlocked) {
      setError(`${selectedOption.title} already has an active application state.`);
      return;
    }

    if (cleanReason.length < 20 || cleanReason.length > 500) {
      setError("Application reason must be between 20 and 500 characters.");
      return;
    }

    if (!cleanResumeUrl) {
      setError("Resume PDF link is required before submitting an application.");
      return;
    }

    try {
      setError(null);
      setSuccess(null);
      setSubmitting(true);
      const newRequest = await submitRoleRequest(selectedRole, cleanReason, cleanResumeUrl);
      setRequests((current) => [newRequest, ...current]);
      setSuccess("Application submitted. The operations team will review it soon.");
      setReason("");
      setResumeUrl("");
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-dvh bg-white text-[#171717]">
      <ClientHeader />

      <main className="mx-auto max-w-[1536px] px-6 py-12 md:px-11 md:py-16">
        {loading ? (
          <div className="mx-auto max-w-5xl">
            <SkeletonLoader />
          </div>
        ) : (
          <div className="space-y-10">
            <section className="grid gap-8 border-b border-slate-200 pb-10 lg:grid-cols-[1fr_420px]">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-nyraGreen">Join the circuit</p>
                <h1 className="mt-3 text-5xl font-black uppercase leading-none tracking-tight text-nyraDark md:text-6xl">
                  Role Applications
                </h1>
                <p className="mt-5 max-w-3xl text-lg font-bold leading-8 text-slate-600">
                  Choose the role that matches your track, submit a concise reason, and keep your application status in
                  one review queue.
                </p>
              </div>

              <aside className="border border-slate-200 bg-slate-50 p-6" aria-labelledby="readiness-title">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-nyraGreen">Account readiness</p>
                    <h2 id="readiness-title" className="mt-2 text-2xl font-black uppercase tracking-tight">
                      Review Gate
                    </h2>
                  </div>
                  <StatusBadge tone={profileCompleted ? "success" : "draft"}>
                    {profileCompleted ? "Ready" : "Action needed"}
                  </StatusBadge>
                </div>

                <ul aria-label="Application readiness" className="mt-6 space-y-4">
                  {readinessItems.map((item) => (
                    <li className="flex gap-3" key={item.label}>
                      <ReadinessDot ready={item.ready} />
                      <div>
                        <p className="text-sm font-black text-slate-900">{item.label}</p>
                        <p className="text-xs font-bold leading-5 text-slate-500">{item.helper}</p>
                      </div>
                    </li>
                  ))}
                </ul>

                {!profileCompleted && (
                  <a
                    className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-sm bg-lime-400 px-5 py-3 text-sm font-black uppercase tracking-widest text-black transition hover:bg-[#b7ff4a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-nyraGreen"
                    href="/profile"
                  >
                    Complete Profile
                  </a>
                )}
              </aside>
            </section>

            {!profileCompleted ? (
              <section className="border border-slate-200 bg-white p-8 shadow-sm" aria-labelledby="profile-needed">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-nyraGreen">Application locked</p>
                <h2 id="profile-needed" className="mt-3 text-4xl font-black uppercase tracking-tight">
                  Complete Your Profile
                </h2>
                <p className="mt-4 max-w-3xl text-base font-bold leading-7 text-slate-600">
                  Admin needs your name, phone number, date of birth, gender, and address before reviewing a specialist
                  role request. Finish that first, then return here to choose your track.
                </p>
              </section>
            ) : (
              <section className="space-y-8" aria-labelledby="role-selection-title">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-nyraGreen">Open applications</p>
                  <h2 id="role-selection-title" className="mt-3 text-4xl font-black uppercase tracking-tight">
                    Choose Your Track
                  </h2>
                </div>

                {activeSpecialistRole && (
                  <div className="border-l-4 border-nyraGreen bg-emerald-50 p-5 text-sm font-bold text-emerald-900">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-nyraGreen">
                      Active specialist role
                    </p>
                    <p className="mt-2">
                      You currently hold {roleTitle(activeSpecialistRole)} access. Contact admin if you need to change
                      your specialist track.
                    </p>
                  </div>
                )}

                {!activeSpecialistRole && pendingSpecialistRequest && (
                  <div className="border-l-4 border-amber-500 bg-amber-50 p-5 text-sm font-bold text-amber-900">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-700">
                      Specialist application pending
                    </p>
                    <p className="mt-2">
                      Your {roleTitle(pendingSpecialistRequest.requestedRole)} application is under review. Wait for
                      admin decision before applying for another specialist track.
                    </p>
                  </div>
                )}

                <div className="grid gap-5 lg:grid-cols-3">
                  {roleOptions.map((option) => {
                    const request = latestByRole[option.role];
                    const pending = request?.status === "PENDING";
                    const approved = request?.status === "APPROVED";
                    const lockedByPendingSpecialist = Boolean(
                      pendingSpecialistRequest && pendingSpecialistRequest.requestedRole !== option.role,
                    );
                    const blocked = specialistApplicationsLocked || pending || approved;
                    const selected = selectedRole === option.role;
                    let buttonLabel = `Select ${option.title} role`;
                    if (activeSpecialistRole) {
                      buttonLabel = "Locked by active specialist role";
                    } else if (lockedByPendingSpecialist) {
                      buttonLabel = "Locked while another specialist application is pending";
                    } else if (pending) {
                      buttonLabel = `${option.title} application under review`;
                    } else if (approved) {
                      buttonLabel = `${option.title} role already granted`;
                    }

                    return (
                      <button
                        aria-pressed={selected}
                        className={`min-h-[330px] cursor-pointer border bg-white p-6 text-left shadow-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-nyraGreen disabled:cursor-not-allowed disabled:opacity-70 ${
                          selected ? "border-nyraGreen shadow-xl" : "border-slate-200 hover:-translate-y-1 hover:border-nyraGreen"
                        }`}
                      disabled={blocked}
                        key={option.role}
                        onClick={() => setSelectedRole(option.role)}
                        type="button"
                      >
                        <div className="flex h-full flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between gap-4">
                              <p className="text-xs font-black uppercase tracking-[0.18em] text-nyraGreen">
                                {option.eyebrow}
                              </p>
                              {request && <StatusBadge tone={statusTone(request.status)}>{statusLabel(request.status)}</StatusBadge>}
                            </div>
                            <h3 className="mt-5 text-4xl font-black uppercase tracking-tight text-nyraDark">
                              {option.title}
                            </h3>
                            <p className="mt-4 text-base font-bold leading-7 text-slate-600">{option.description}</p>
                            <ul className="mt-6 space-y-3">
                              {option.requirements.map((requirement) => (
                                <li className="flex gap-3 text-sm font-bold text-slate-700" key={requirement}>
                                  <ReadinessDot ready />
                                  <span>{requirement}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <span className="mt-7 block border-t border-slate-200 pt-4 text-sm font-black uppercase tracking-widest text-nyraGreen">
                            {buttonLabel}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            <section className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]" aria-labelledby="application-form-title">
              <form
                className="border border-slate-200 bg-white p-6 shadow-sm md:p-8"
                onSubmit={handleApply}
              >
                <p className="text-xs font-black uppercase tracking-[0.2em] text-nyraGreen">Selected role</p>
                <h2 id="application-form-title" className="mt-3 text-3xl font-black uppercase tracking-tight">
                  {selectedOption.title} Application
                </h2>
                <p className="mt-3 text-sm font-bold leading-6 text-slate-600">{selectedOption.description}</p>

                {error && (
                  <div className="mt-6 border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-800" role="alert">
                    {error}
                  </div>
                )}
                {success && (
                  <div
                    aria-live="polite"
                    className="mt-6 border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-800"
                  >
                    {success}
                  </div>
                )}

                <div className="mt-6 space-y-5">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-[0.16em] text-nyraGreen" htmlFor="reason">
                      Application reason
                    </label>
                    <textarea
                      className="mt-2 min-h-[150px] w-full resize-y border border-slate-300 bg-white px-4 py-3 text-base font-bold text-slate-900 outline-none transition focus:border-nyraGreen focus:ring-2 focus:ring-nyraGreen/20"
                      disabled={!profileCompleted || selectedRoleBlocked}
                      id="reason"
                      maxLength={500}
                      minLength={20}
                      onChange={(event) => setReason(event.target.value)}
                      placeholder="Tell the operations team why this role fits your experience."
                      required
                      value={reason}
                    />
                    <p className="mt-2 text-xs font-bold text-slate-500">{reason.length}/500 characters</p>
                  </div>

                  <div>
                    <label
                      className="block text-xs font-black uppercase tracking-[0.16em] text-nyraGreen"
                      htmlFor="resumeUrl"
                    >
                      Resume PDF URL
                    </label>
                    <input
                      className="mt-2 h-12 w-full border border-slate-300 bg-white px-4 text-base font-bold text-slate-900 outline-none transition focus:border-nyraGreen focus:ring-2 focus:ring-nyraGreen/20"
                      disabled={!profileCompleted || selectedRoleBlocked}
                      id="resumeUrl"
                      onChange={(event) => setResumeUrl(event.target.value)}
                      placeholder="https://example.com/resume.pdf"
                      required
                      type="url"
                      value={resumeUrl}
                    />
                    <p className="mt-2 text-xs font-bold text-slate-500">
                      Required. Add a shareable PDF resume link for admin CV screening.
                    </p>
                  </div>
                </div>

                <button
                  className="mt-7 inline-flex min-h-12 w-full items-center justify-center rounded-sm bg-nyraGreen px-5 py-3 text-sm font-black uppercase tracking-widest text-white transition hover:bg-[#006d5b] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-nyraGreen"
                  disabled={!canSubmit}
                  type="submit"
                >
                  {submitting ? "Submitting..." : "Submit Application"}
                </button>
              </form>

              <section className="border border-slate-200 bg-slate-50 p-6 md:p-8" aria-labelledby="application-history-title">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-nyraGreen">My applications</p>
                    <h2 id="application-history-title" className="mt-3 text-3xl font-black uppercase tracking-tight">
                      Review Queue
                    </h2>
                  </div>
                  <p className="text-sm font-bold text-slate-500">{requests.length} total</p>
                </div>

                <div className="mt-6 space-y-4">
                  {requests.length === 0 ? (
                    <div className="border border-dashed border-slate-300 bg-white p-8 text-center">
                      <p className="text-sm font-black uppercase tracking-widest text-slate-500">No applications yet</p>
                      <p className="mt-2 text-sm font-bold text-slate-500">
                        Select a role and submit your first application.
                      </p>
                    </div>
                  ) : (
                    requests.map((request) => (
                      <article className="border border-slate-200 bg-white p-5" key={request.id}>
                        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                          <div>
                            <p className="text-xs font-black uppercase tracking-[0.18em] text-nyraGreen">
                              {roleTitle(request.requestedRole)}
                            </p>
                            <h3 className="mt-2 text-xl font-black uppercase tracking-tight text-nyraDark">
                              {statusLabel(request.status)}
                            </h3>
                          </div>
                          <StatusBadge tone={statusTone(request.status)}>{statusLabel(request.status)}</StatusBadge>
                        </div>
                        <ol className="mt-5 grid gap-2 text-xs font-black uppercase tracking-widest text-slate-500 md:grid-cols-3">
                          <li className="border-l-4 border-nyraGreen bg-slate-50 p-3">Submitted</li>
                          <li className="border-l-4 border-amber-500 bg-slate-50 p-3">Under review</li>
                          <li
                            className={`border-l-4 bg-slate-50 p-3 ${
                              request.status === "APPROVED"
                                ? "border-emerald-600"
                                : request.status === "REJECTED"
                                  ? "border-red-600"
                                  : "border-slate-300"
                            }`}
                          >
                            Decision
                          </li>
                        </ol>
                        <dl className="mt-5 grid gap-4 text-sm md:grid-cols-2">
                          <div>
                            <dt className="font-black uppercase tracking-widest text-slate-400">Submitted on</dt>
                            <dd className="mt-1 font-bold text-slate-700">{formatDate(request.createdAt)}</dd>
                          </div>
                          <div>
                            <dt className="font-black uppercase tracking-widest text-slate-400">Resume</dt>
                            <dd className="mt-1 font-bold text-slate-700">
                              {request.resumeUrl ? (
                                <a className="text-nyraGreen underline" href={request.resumeUrl}>
                                  Open resume
                                </a>
                              ) : (
                                "Not provided"
                              )}
                            </dd>
                          </div>
                          <div>
                            <dt className="font-black uppercase tracking-widest text-slate-400">CV screening</dt>
                            <dd className="mt-1 font-bold text-slate-700">
                              {request.cvReviewStatus === "PASSED" ? "Passed CV screening" : "Waiting for CV review"}
                            </dd>
                          </div>
                        </dl>
                        {request.rejectReason && (
                          <p className="mt-4 border-l-4 border-red-600 bg-red-50 p-4 text-sm font-bold text-red-800">
                            {request.rejectReason}
                          </p>
                        )}
                      </article>
                    ))
                  )}
                </div>
              </section>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
