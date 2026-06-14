import { FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

import { getMyProfile } from "../../api/profileApi";
import { getMyRoleRequests, submitRoleRequest, uploadResumeDocument } from "../../api/roleRequestApi";
import { AuthenticatedFileLink } from "../../components/AuthenticatedFileLink";
import { ClientFooter } from "../../components/client/ClientFooter";
import { ClientHeader } from "../../components/client/ClientHeader";
import { Eyebrow, GoldRule, MotionReveal } from "../../components/client/primitives";
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

function statusLabel(status: RoleRequest["status"]) {
  const labels: Record<RoleRequest["status"], string> = {
    PENDING: "Under review",
    APPROVED: "Approved",
    REJECTED: "Rejected",
    CANCELLED: "Cancelled",
  };

  return labels[status];
}

const statusPillClasses: Record<RoleRequest["status"], { dot: string; text: string; ring: string }> = {
  PENDING: { dot: "bg-gold-300 live-pulse", text: "text-gold-300", ring: "border-gold-400/40" },
  APPROVED: { dot: "bg-emerald-soft", text: "text-emerald-soft", ring: "border-emerald-glow/40" },
  REJECTED: { dot: "bg-rose-400", text: "text-rose-300", ring: "border-nyraRed/50" },
  CANCELLED: { dot: "bg-ivory-faint", text: "text-ivory-faint", ring: "border-white/15" },
};

function RoleStatusPill({ status }: { status: RoleRequest["status"] }) {
  const tone = statusPillClasses[status];
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border ${tone.ring} bg-turf-950/60 px-3 py-1`}>
      <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} aria-hidden="true" />
      <span className={`eyebrow ${tone.text}`}>{statusLabel(status)}</span>
    </span>
  );
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

function ReadinessDiamond({ ready }: { ready: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`mt-1.5 h-2 w-2 shrink-0 rotate-45 ${ready ? "bg-emerald-soft" : "border border-ivory-faint"}`}
    />
  );
}

export function MyRoleRequestsPage() {
  useDocumentTitle("Role Applications | Night at the Races");

  const [profile, setProfile] = useState<Profile | null>(null);
  const [requests, setRequests] = useState<RoleRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<RequestedRole>("JOCKEY");
  const [reason, setReason] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
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

    if (!resumeFile) {
      setError("Resume PDF file is required before submitting an application.");
      return;
    }

    try {
      setError(null);
      setSuccess(null);
      setSubmitting(true);
      const uploadedResume = await uploadResumeDocument(resumeFile);
      const newRequest = await submitRoleRequest(selectedRole, cleanReason, uploadedResume.url);
      setRequests((current) => [newRequest, ...current]);
      setSuccess("Application submitted. The operations team will review it soon.");
      setReason("");
      setResumeFile(null);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="client-theme min-h-screen bg-turf-950 text-ivory">
      <ClientHeader />

      <main>
        {loading ? (
          <div className="mx-auto max-w-[1400px] px-6 py-16 md:px-12">
            <p className="eyebrow text-gold-300">Opening the application desk</p>
            <div className="mt-10 grid gap-px md:grid-cols-3">
              {[0, 1, 2].map((item) => (
                <div key={item} className="h-96 animate-pulse border border-white/10 bg-turf-900" />
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* ═══ Statement hero + readiness gates ═══════════════════ */}
            <section className="grain relative isolate overflow-hidden border-b border-white/10">
              <div className="turf-vignette absolute inset-0 -z-10" />
              <div className="pointer-events-none absolute inset-y-0 right-0 -z-10 w-2/3 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.1),transparent_60%)]" />
              <div className="mx-auto max-w-[1400px] px-6 pb-12 pt-14 md:px-12 md:pt-18">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <Eyebrow tone="gold">Join the Circuit</Eyebrow>
                  <span
                    className={`inline-flex items-center gap-2 rounded-full border bg-turf-950/60 px-3 py-1 ${
                      profileCompleted ? "border-emerald-glow/40" : "border-gold-400/40"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${profileCompleted ? "bg-emerald-soft" : "bg-gold-300"}`}
                      aria-hidden="true"
                    />
                    <span className={`eyebrow ${profileCompleted ? "text-emerald-soft" : "text-gold-300"}`}>
                      {profileCompleted ? "Ready for review" : "Action needed"}
                    </span>
                  </span>
                </div>
                <h1 className="mt-6 max-w-4xl font-display text-5xl font-light leading-[0.95] tracking-tight md:text-7xl">
                  Role Applications<span className="text-foil">.</span>
                </h1>
                <p className="mt-6 max-w-xl text-lg leading-relaxed text-ivory-dim">
                  Choose the track that matches your craft, submit a concise reason, and follow your application
                  through one review queue.
                </p>

                <ul
                  aria-label="Application readiness"
                  className="mt-12 grid gap-px border-y border-white/10 bg-white/5 sm:grid-cols-3"
                >
                  {readinessItems.map((item) => (
                    <li className="flex gap-3 bg-turf-950 p-5" key={item.label}>
                      <ReadinessDiamond ready={item.ready} />
                      <div>
                        <p className="text-sm font-bold text-ivory">{item.label}</p>
                        <p className="mt-0.5 text-xs leading-5 text-ivory-faint">{item.helper}</p>
                      </div>
                    </li>
                  ))}
                </ul>

                {!profileCompleted && (
                  <Link
                    className="mt-8 inline-flex min-h-12 items-center justify-center bg-gold-400 px-8 text-xs font-bold uppercase tracking-[0.14em] text-turf-950 transition-colors hover:bg-gold-300"
                    to="/profile"
                  >
                    Complete Profile
                  </Link>
                )}
              </div>
            </section>

            <div className="mx-auto max-w-[1400px] space-y-20 px-6 py-16 md:px-12">
              {!profileCompleted ? (
                <MotionReveal>
                  <section
                    aria-labelledby="profile-needed"
                    className="relative overflow-hidden border border-white/10 bg-turf-900 px-8 py-14 text-center md:py-18"
                  >
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-display text-[200px] font-light leading-none text-white/[0.03]"
                    >
                      §
                    </span>
                    <Eyebrow tone="gold" className="justify-center">
                      Application locked
                    </Eyebrow>
                    <h2 id="profile-needed" className="mt-5 font-display text-4xl font-light tracking-tight md:text-5xl">
                      Complete Your Profile
                    </h2>
                    <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-ivory-dim">
                      Admin needs your name, phone number, date of birth, gender, and address before reviewing a
                      specialist role request. Finish that first, then return here to choose your track.
                    </p>
                  </section>
                </MotionReveal>
              ) : (
                <MotionReveal>
                  <section className="space-y-10" aria-labelledby="role-selection-title">
                  <div className="flex items-end justify-between gap-5">
                    <div>
                      <Eyebrow tone="gold">Open applications</Eyebrow>
                      <h2 id="role-selection-title" className="mt-4 font-display text-4xl font-light tracking-tight md:text-5xl">
                        Choose your track.
                      </h2>
                      <GoldRule className="mt-5 w-20" />
                    </div>
                    <p className="hidden font-data text-xs uppercase tracking-[0.18em] text-ivory-faint md:block">
                      {String(roleOptions.length).padStart(2, "0")} tracks open
                    </p>
                  </div>

                  {activeSpecialistRole && (
                    <div className="border-l-2 border-emerald-glow bg-turf-900 px-6 py-5">
                      <p className="eyebrow text-emerald-soft">Active specialist role</p>
                      <p className="mt-2 text-sm leading-relaxed text-ivory-dim">
                        You currently hold {roleTitle(activeSpecialistRole)} access. Contact admin if you need to
                        change your specialist track.
                      </p>
                    </div>
                  )}

                  {!activeSpecialistRole && pendingSpecialistRequest && (
                    <div className="border-l-2 border-gold-400 bg-turf-900 px-6 py-5">
                      <p className="eyebrow text-gold-300">Specialist application pending</p>
                      <p className="mt-2 text-sm leading-relaxed text-ivory-dim">
                        Your {roleTitle(pendingSpecialistRequest.requestedRole)} application is under review. Wait for
                        admin decision before applying for another specialist track.
                      </p>
                    </div>
                  )}

                  {/* The triptych — three museum panels, one choice */}
                  <div className="grid border border-white/10 lg:grid-cols-3">
                    {roleOptions.map((option, index) => {
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
                          className={`group relative flex min-h-[440px] cursor-pointer flex-col justify-between overflow-hidden border-b border-white/10 p-9 text-left transition-colors duration-300 last:border-b-0 lg:border-b-0 lg:border-r lg:last:border-r-0 ${
                            selected ? "bg-turf-900" : "bg-turf-950 hover:bg-turf-900/50"
                          } disabled:cursor-not-allowed disabled:opacity-40`}
                          disabled={blocked}
                          key={option.role}
                          onClick={() => setSelectedRole(option.role)}
                          type="button"
                        >
                          {selected && (
                            <span aria-hidden="true" className="pointer-events-none absolute inset-3 border border-gold-400/50" />
                          )}
                          <span
                            aria-hidden="true"
                            className="pointer-events-none absolute -bottom-10 -right-4 font-display text-[180px] font-light leading-none text-white/[0.04]"
                          >
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <span className="relative block">
                            <span className="flex items-start justify-between gap-4">
                              <Eyebrow tone={selected ? "gold" : "ivory"}>{option.eyebrow}</Eyebrow>
                              {request && <RoleStatusPill status={request.status} />}
                            </span>
                            <span
                              className={`mt-8 block font-display text-5xl font-light tracking-tight transition-colors ${
                                selected ? "text-gold-200" : "text-ivory group-hover:text-gold-200"
                              }`}
                            >
                              {option.title}
                            </span>
                            <span className="mt-5 block max-w-xs text-sm leading-relaxed text-ivory-dim">
                              {option.description}
                            </span>
                            <span className="mt-8 block space-y-3 border-t border-white/10 pt-6">
                              {option.requirements.map((requirement) => (
                                <span className="flex gap-3 text-sm text-ivory-dim" key={requirement}>
                                  <ReadinessDiamond ready />
                                  <span>{requirement}</span>
                                </span>
                              ))}
                            </span>
                          </span>
                          <span
                            className={`relative mt-10 block font-data text-[10px] uppercase tracking-[0.2em] ${
                              selected ? "text-gold-300" : "text-ivory-faint group-hover:text-gold-300"
                            }`}
                          >
                            {buttonLabel}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  </section>
                </MotionReveal>
              )}

              {/* ═══ The application desk — centered telegram ═══════════ */}
              <MotionReveal delay={0.08}>
                <section aria-labelledby="application-form-title">
                <div className="mx-auto max-w-3xl">
                  <div className="text-center">
                    <Eyebrow tone="gold" className="justify-center">
                      The application desk
                    </Eyebrow>
                    <h2 id="application-form-title" className="mt-4 font-display text-4xl font-light tracking-tight">
                      {selectedOption.title} Application
                    </h2>
                    <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-ivory-dim">
                      {selectedOption.description}
                    </p>
                  </div>

                  {error && (
                    <div className="mt-8 border-l-2 border-nyraRed bg-turf-900 px-5 py-4 text-sm text-rose-300" role="alert">
                      {error}
                    </div>
                  )}
                  {success && (
                    <div
                      aria-live="polite"
                      className="mt-8 border-l-2 border-emerald-glow bg-turf-900 px-5 py-4 text-sm text-emerald-soft"
                    >
                      {success}
                    </div>
                  )}

                  <form className="mt-9 border border-white/10 bg-turf-900 p-7 md:p-10" onSubmit={handleApply}>
                    <div className="space-y-8">
                      <div>
                        <label className="eyebrow block text-gold-300" htmlFor="reason">
                          Application reason
                        </label>
                        <textarea
                          className="mt-3 min-h-[150px] w-full resize-y border border-white/15 bg-turf-950 px-4 py-3 text-sm leading-relaxed text-ivory outline-none transition-colors placeholder:text-ivory-faint focus:border-gold-400/70 disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={!profileCompleted || selectedRoleBlocked}
                          id="reason"
                          maxLength={500}
                          minLength={20}
                          onChange={(event) => setReason(event.target.value)}
                          placeholder="Tell the operations team why this role fits your experience."
                          required
                          value={reason}
                        />
                        <p className="mt-2 text-right font-data text-xs text-ivory-faint">{reason.length}/500 characters</p>
                      </div>

                      <div>
                        <label className="eyebrow block text-gold-300" htmlFor="resumeFile">
                          Resume PDF File
                        </label>
                        <input
                          accept="application/pdf"
                          className="mt-3 block w-full border border-dashed border-white/20 bg-turf-950 px-4 py-4 text-xs text-ivory-dim outline-none transition-colors file:mr-4 file:min-h-10 file:cursor-pointer file:border-0 file:bg-gold-400 file:px-4 file:text-xs file:font-bold file:uppercase file:tracking-[0.14em] file:text-turf-950 hover:file:bg-gold-300 focus:border-gold-400/70 disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={!profileCompleted || selectedRoleBlocked}
                          id="resumeFile"
                          onChange={(event) => setResumeFile(event.target.files?.[0] ?? null)}
                          type="file"
                        />
                        <p className="mt-2 text-xs leading-5 text-ivory-faint">
                          Required. Upload a PDF resume for admin CV screening.
                          {resumeFile ? ` Selected: ${resumeFile.name}` : ""}
                        </p>
                      </div>

                      <button
                        className="inline-flex min-h-12 w-full items-center justify-center bg-gold-400 px-5 text-xs font-bold uppercase tracking-[0.14em] text-turf-950 transition-colors hover:bg-gold-300 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-ivory-faint"
                        disabled={!canSubmit}
                        type="submit"
                      >
                        {submitting ? "Submitting..." : "Submit Application"}
                      </button>
                    </div>
                  </form>
                </div>
                </section>
              </MotionReveal>

              {/* ═══ The review queue — season record rows ═══════════════ */}
              <MotionReveal delay={0.05}>
                <section aria-labelledby="application-history-title">
                <div className="flex items-end justify-between gap-5 border-b border-white/10 pb-6">
                  <div>
                    <Eyebrow tone="gold">My applications</Eyebrow>
                    <h2 id="application-history-title" className="mt-4 font-display text-4xl font-light tracking-tight">
                      The review queue.
                    </h2>
                    <GoldRule className="mt-5 w-20" />
                  </div>
                  <p className="font-data text-xs uppercase tracking-[0.18em] text-ivory-faint">{requests.length} total</p>
                </div>

                {requests.length === 0 ? (
                  <div className="mt-8 border border-dashed border-white/15 bg-turf-900/50 px-8 py-14 text-center">
                    <p className="eyebrow text-ivory-faint">No applications yet</p>
                    <p className="mt-3 text-sm text-ivory-dim">Select a role and submit your first application.</p>
                  </div>
                ) : (
                  <div>
                    {requests.map((request) => (
                      <article
                        className="group grid gap-5 border-b border-white/10 py-8 transition-colors hover:border-gold-400/30 md:grid-cols-[150px_1fr_auto] md:items-start"
                        key={request.id}
                      >
                        <time className="font-data text-sm text-gold-200" dateTime={request.createdAt}>
                          {formatDate(request.createdAt)}
                        </time>
                        <div className="min-w-0">
                          <h3 className="font-display text-3xl font-light tracking-tight text-ivory transition-colors group-hover:text-gold-200">
                            {roleTitle(request.requestedRole)}
                          </h3>
                          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 font-data text-[10px] uppercase tracking-[0.16em] text-ivory-faint">
                            <span className="inline-flex items-center gap-2">
                              <span aria-hidden="true" className="h-1.5 w-1.5 rotate-45 bg-emerald-soft" /> Submitted
                            </span>
                            <span className="inline-flex items-center gap-2">
                              <span aria-hidden="true" className="h-1.5 w-1.5 rotate-45 bg-gold-300" /> Under review
                            </span>
                            <span className="inline-flex items-center gap-2">
                              <span
                                aria-hidden="true"
                                className={`h-1.5 w-1.5 rotate-45 ${
                                  request.status === "APPROVED"
                                    ? "bg-emerald-soft"
                                    : request.status === "REJECTED"
                                      ? "bg-rose-400"
                                      : "border border-ivory-faint"
                                }`}
                              />
                              Decision
                            </span>
                          </div>
                          <p className="mt-3 text-sm text-ivory-dim">
                            {request.cvReviewStatus === "PASSED" ? "Passed CV screening" : "Waiting for CV review"}
                            {request.resumeUrl ? (
                              <>
                                {" · "}
                                <AuthenticatedFileLink
                                  className="inline-flex items-center gap-1 text-gold-300 underline decoration-gold-400/40 underline-offset-4 transition-colors hover:text-gold-200"
                                  href={request.resumeUrl}
                                >
                                  Open resume <ArrowUpRight size={13} aria-hidden="true" />
                                </AuthenticatedFileLink>
                              </>
                            ) : (
                              " · Resume not provided"
                            )}
                          </p>
                          {request.rejectReason && (
                            <p className="mt-4 border-l-2 border-nyraRed bg-turf-900 px-4 py-3 text-sm text-rose-300">
                              {request.rejectReason}
                            </p>
                          )}
                        </div>
                        <RoleStatusPill status={request.status} />
                      </article>
                    ))}
                  </div>
                )}
                </section>
              </MotionReveal>
            </div>
          </>
        )}
      </main>
      <ClientFooter />
    </div>
  );
}
