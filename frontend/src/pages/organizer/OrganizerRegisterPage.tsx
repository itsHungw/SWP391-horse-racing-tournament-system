import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, UploadCloud, AlertCircle, FileText, Image as ImageIcon } from "lucide-react";

import { getMyProfile } from "../../api/profileApi";
import {
  getMyOrganization,
  registerOrganization,
  uploadOrganizationLicense,
  uploadOrganizationLogo,
} from "../../api/racingApi";
import { ClientFooter } from "../../components/client/ClientFooter";
import { ClientHeader } from "../../components/client/ClientHeader";
import { Eyebrow, GoldRule, MotionReveal } from "../../components/client/primitives";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import type { Profile } from "../../types/profile";
import type { Organization, OrganizationStatus } from "../../types/racing";
import { getApiErrorMessage } from "../../utils/apiError";

const statusCopy: Record<OrganizationStatus, { label: string; tone: string; note: string }> = {
  PENDING: {
    label: "Under review",
    tone: "text-gold-300 border-gold-400/30 bg-gold-400/10",
    note: "Your organization application is awaiting admin approval (Gate 1). You will be granted ORGANIZER access once approved.",
  },
  ACTIVE: {
    label: "Active",
    tone: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10",
    note: "Your organization is approved. You can now create and run tournaments.",
  },
  SUSPENDED: {
    label: "Suspended",
    tone: "text-rose-400 border-rose-400/30 bg-rose-400/10",
    note: "Your organization is currently suspended by the platform. Please contact the admin.",
  },
  REJECTED: {
    label: "Rejected",
    tone: "text-rose-400 border-rose-400/30 bg-rose-400/10",
    note: "Your application was rejected. Review the reason below, update your details, and resubmit.",
  },
};

const reviewSteps = [
  { title: "Submit your application", detail: "Share your organization details and upload your license document." },
  { title: "KYB verification", detail: "Our compliance team reviews it — usually within 1–3 business days." },
  { title: "ORGANIZER access", detail: "Once approved, create and run tournaments straight away." },
];

const inputClass =
  "mt-2 block w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-ivory outline-none transition-all placeholder:text-ivory-faint focus:border-gold-400/50 focus:bg-white/10 focus:ring-1 focus:ring-gold-400/50 disabled:cursor-not-allowed disabled:opacity-50";

const emptyOrganizationForm = {
  name: "",
  licenseNumber: "",
  contactEmail: "",
  contactPhone: "",
  description: "",
  evidenceUrl: "",
  logoUrl: "",
  applicationNote: "",
};

function organizationToForm(organization: Organization) {
  return {
    name: organization.name || "",
    licenseNumber: organization.licenseNumber || "",
    contactEmail: organization.contactEmail || "",
    contactPhone: organization.contactPhone || "",
    description: organization.description || "",
    evidenceUrl: organization.evidenceUrl || "",
    logoUrl: organization.logoUrl || "",
    applicationNote: organization.applicationNote || "",
  };
}

export function OrganizerRegisterPage() {
  useDocumentTitle("Become an Organizer | Night at the Races");

  const [org, setOrg] = useState<Organization | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyOrganizationForm);
  const [licenseName, setLicenseName] = useState<string | null>(null);
  const [logoName, setLogoName] = useState<string | null>(null);
  const [uploading, setUploading] = useState({ license: false, logo: false });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const [profileResult, orgResult] = await Promise.allSettled([getMyProfile(), getMyOrganization()]);
      if (!active) {
        return;
      }
      if (profileResult.status === "fulfilled") {
        setProfile(profileResult.value);
      }
      if (orgResult.status === "fulfilled") {
        const organization = orgResult.value;
        setOrg(organization);
        if (organization.status === "REJECTED") {
          setForm(organizationToForm(organization));
          setLicenseName(organization.evidenceUrl ? "Previously uploaded license" : null);
          setLogoName(organization.logoUrl ? "Previously uploaded logo" : null);
        }
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const profileCompleted = Boolean(profile?.profileCompleted);
  const canResubmit = org?.status === "REJECTED";
  const showForm = !org || canResubmit;
  const busyUploading = uploading.license || uploading.logo;
  const formDisabled = submitting || busyUploading || !profileCompleted;
  const pageEyebrow = canResubmit ? "Corrections Requested" : "Join The Elite";
  const pageTitle = canResubmit ? "Resubmission Workspace" : "Organizer Application";
  const organizerRoleMissing = org?.status === "ACTIVE"
    && !profile?.roles?.some((role) => role.toUpperCase() === "ORGANIZER");
  const pageDescription = canResubmit
    ? "Your application is still in play. Review the admin note, update the fields below, and send a cleaner submission back through Gate 1."
    : "Apply for platform clearance to host professional tournaments. We run a secure KYB review — once verified, your account receives full ORGANIZER access to our suite of tools.";

  const update =
    (key: keyof typeof form) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((current) => ({ ...current, [key]: event.target.value }));

  const handleLicenseFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    try {
      setError(null);
      setUploading((current) => ({ ...current, license: true }));
      const { url } = await uploadOrganizationLicense(file);
      setForm((current) => ({ ...current, evidenceUrl: url }));
      setLicenseName(file.name);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not upload the license document."));
    } finally {
      setUploading((current) => ({ ...current, license: false }));
    }
  };

  const handleLogoFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    try {
      setError(null);
      setUploading((current) => ({ ...current, logo: true }));
      const { url } = await uploadOrganizationLogo(file);
      setForm((current) => ({ ...current, logoUrl: url }));
      setLogoName(file.name);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not upload the logo."));
    } finally {
      setUploading((current) => ({ ...current, logo: false }));
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!profileCompleted) {
      setError("Complete your personal profile before applying.");
      return;
    }
    const name = form.name.trim();
    const license = form.licenseNumber.trim();
    const email = form.contactEmail.trim();
    const note = form.applicationNote.trim();
    if (name.length < 3) {
      setError("Organization name must be at least 3 characters.");
      return;
    }
    if (!license) {
      setError("A business / operating license number is required.");
      return;
    }
    if (!form.evidenceUrl) {
      setError("Please upload your business / operating license document (PDF or image).");
      return;
    }
    if (!email) {
      setError("An official contact email is required.");
      return;
    }
    if (note.length < 50) {
      setError("The capability statement must be at least 50 characters.");
      return;
    }
    try {
      setError(null);
      setSuccess(null);
      setSubmitting(true);
      const created = await registerOrganization({
        name,
        licenseNumber: license,
        contactEmail: email,
        contactPhone: form.contactPhone.trim() || undefined,
        description: form.description.trim() || undefined,
        evidenceUrl: form.evidenceUrl,
        logoUrl: form.logoUrl || undefined,
        applicationNote: note,
      });
      setOrg(created);
      setSuccess("Application submitted. The platform team will review it shortly.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not submit your application."));
    } finally {
      setSubmitting(false);
    }
  };

  const statusBanner = org && (
    <div className="rounded-2xl border border-white/10 bg-turf-900/50 p-8 backdrop-blur-md shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gold-500/20 via-gold-400 to-gold-500/20"></div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Eyebrow tone="ivory">Application Status</Eyebrow>
          <h2 className="mt-2 font-display text-3xl font-light tracking-tight text-white">{org.name}</h2>
        </div>
        <div className={`px-4 py-2 rounded-full border text-xs font-bold uppercase tracking-wider ${statusCopy[org.status].tone}`}>
          {statusCopy[org.status].label}
        </div>
      </div>
      
      <p className="mt-5 text-base leading-relaxed text-ivory-dim bg-white/5 p-4 rounded-xl border border-white/5">
        {statusCopy[org.status].note}
      </p>

      {organizerRoleMissing && (
        <p
          className="mt-4 rounded-xl border border-gold-400/25 bg-gold-400/10 p-4 text-sm text-gold-200"
          role="status"
        >
          Your organizer access was restored. Please sign out and sign in again to refresh your session roles.
        </p>
      )}
      
      {org.rejectionReason && (
        <div className="mt-5 flex items-start gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-200">
          <AlertCircle className="shrink-0 text-rose-400" size={18} />
          <p>{org.rejectionReason}</p>
        </div>
      )}
      
      {org.status === "ACTIVE" && (
        <Link
          to="/organizer/tournaments"
          className="mt-8 inline-flex min-h-12 items-center justify-center rounded-lg bg-gold-400 px-8 text-sm font-bold uppercase tracking-[0.14em] text-turf-950 transition-all hover:bg-gold-300 hover:shadow-[0_0_20px_-5px_rgba(212,175,55,0.5)]"
        >
          Go to my tournaments
        </Link>
      )}
    </div>
  );

  const requirementsPanel = (
    <div className="rounded-2xl border border-white/10 bg-turf-900/40 p-8 backdrop-blur-md sticky top-28">
      {/* Profile gate — the one real blocker before applying */}
      <div className="rounded-xl bg-white/5 p-5 border border-white/5">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${profileCompleted ? "bg-emerald-400/20 text-emerald-400" : "bg-gold-400/20 text-gold-400"}`}>
            {profileCompleted ? <Check size={20} /> : <AlertCircle size={20} />}
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">Profile {profileCompleted ? "ready" : "incomplete"}</h4>
            <p className={`text-xs ${profileCompleted ? "text-emerald-400/80" : "text-gold-400/80"}`}>
              {profileCompleted ? "You're eligible to apply" : "Required before you can apply"}
            </p>
          </div>
        </div>
        {!profileCompleted && (
          <Link
            className="mt-4 flex w-full min-h-10 items-center justify-center rounded-lg bg-white/10 px-5 text-xs font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-white/20 border border-white/10"
            to="/profile"
          >
            Complete Profile First
          </Link>
        )}
      </div>

      {/* How review works — sets expectations instead of repeating the form */}
      <div className="mt-8">
        <Eyebrow tone="gold">How it works</Eyebrow>
        <ol className="mt-5 space-y-5">
          {reviewSteps.map((step, i) => (
            <motion.li
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * i, duration: 0.4 }}
              className="flex gap-4"
              key={step.title}
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-gold-400/30 bg-gold-400/10 text-xs font-bold text-gold-300">
                {i + 1}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{step.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-ivory-dim">{step.detail}</p>
              </div>
            </motion.li>
          ))}
        </ol>
      </div>

      {/* Trust note */}
      <div className="mt-8 flex items-start gap-3 rounded-xl border border-white/5 bg-white/5 p-4">
        <FileText className="mt-0.5 shrink-0 text-gold-400/70" size={16} />
        <p className="text-xs leading-relaxed text-ivory-dim">
          Your license document is stored privately and only visible to platform admins for verification.
        </p>
      </div>
    </div>
  );

  const resubmissionPanel = canResubmit && org && (
    <MotionReveal delay={0.05}>
      <section
        aria-labelledby="resubmission-summary-title"
        className="mb-10 overflow-hidden rounded-2xl border border-rose-400/20 bg-[linear-gradient(135deg,rgba(127,29,29,0.34),rgba(4,47,36,0.62))] shadow-2xl"
      >
        <div className="grid gap-6 p-6 md:grid-cols-[minmax(0,1fr)_280px] md:p-8">
          <div>
            <Eyebrow tone="gold">Admin review returned</Eyebrow>
            <h2 id="resubmission-summary-title" className="mt-3 font-display text-3xl font-light text-white">
              Fix the flagged details and resubmit.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-ivory-dim">
              We kept your previous application loaded into the form below so you only need to correct what changed.
              Upload a replacement license scan if the review note asks for clearer evidence.
            </p>
            <div className="mt-6 rounded-xl border border-rose-300/25 bg-rose-950/35 p-4" role="note">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 shrink-0 text-rose-300" size={18} aria-hidden="true" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-rose-200">Reason from admin</p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-rose-50">
                    {org.rejectionReason || "No rejection note was provided. Review your details before resubmitting."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <dl className="grid content-start gap-3 rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
            <div>
              <dt className="text-[10px] font-black uppercase tracking-[0.18em] text-ivory-faint">Application</dt>
              <dd className="mt-1 font-semibold text-white">{org.name}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-black uppercase tracking-[0.18em] text-ivory-faint">Status</dt>
              <dd className="mt-1 inline-flex rounded-full border border-rose-300/30 bg-rose-400/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-rose-200">
                Rejected
              </dd>
            </div>
            <div>
              <dt className="text-[10px] font-black uppercase tracking-[0.18em] text-ivory-faint">Next step</dt>
              <dd className="mt-1 text-ivory-dim">Update the form and resubmit for Gate 1 review.</dd>
            </div>
          </dl>
        </div>
      </section>
    </MotionReveal>
  );

  return (
    <div className="client-theme min-h-screen bg-turf-950 text-ivory selection:bg-gold-400/30 selection:text-gold-200">
      <ClientHeader />
      
      {/* Background elements for premium feel */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[50vw] h-[50vw] rounded-full bg-gold-500/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-emerald-500/5 blur-[100px]" />
      </div>

      <main className="relative z-10 mx-auto max-w-6xl px-6 py-16 md:px-12 md:py-24">
        <MotionReveal>
          <div className="max-w-3xl text-center mx-auto mb-16">
            <Eyebrow tone="gold" className="justify-center">{pageEyebrow}</Eyebrow>
            <h1 className="mt-5 font-display text-5xl md:text-6xl font-light tracking-tight text-white">
              {pageTitle}<span className="text-gold-400">.</span>
            </h1>
            <div className="mt-6 flex justify-center">
              <div className="h-px w-24 bg-gradient-to-r from-transparent via-gold-400/50 to-transparent"></div>
            </div>
            <p className="mt-6 text-lg leading-relaxed text-ivory-dim max-w-2xl mx-auto">
              {pageDescription}
            </p>
          </div>
        </MotionReveal>

        {!loading && resubmissionPanel}

        {loading ? (
          <div className="mx-auto max-w-3xl h-96 animate-pulse rounded-2xl border border-white/5 bg-white/5" />
        ) : org && !showForm ? (
          /* Already applied (PENDING / ACTIVE / SUSPENDED) */
          <MotionReveal>
            <div className="mx-auto max-w-3xl">{statusBanner}</div>
          </MotionReveal>
        ) : (
          /* Application view */
          <div className="grid items-start gap-8 lg:grid-cols-[380px_minmax(0,1fr)] lg:gap-12">
            <MotionReveal delay={0.1}>
              <aside>
                {requirementsPanel}
              </aside>
            </MotionReveal>

            <MotionReveal delay={0.2}>
              <form 
                className="rounded-2xl border border-white/10 bg-turf-900/60 p-8 md:p-10 backdrop-blur-md shadow-2xl relative" 
                onSubmit={handleSubmit}
              >
                <div className="mb-8 border-b border-white/10 pb-6">
                  <h2 className="font-display text-2xl text-white">Application Details</h2>
                  <p className="mt-2 text-sm text-ivory-dim">Please provide accurate information for our compliance team.</p>
                </div>

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    className="mb-8 flex items-center gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-5 py-4 text-sm text-rose-200 shadow-lg" 
                    role="alert"
                  >
                    <AlertCircle className="shrink-0 text-rose-400" size={18} />
                    <p>{error}</p>
                  </motion.div>
                )}
                
                {success && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    aria-live="polite"
                    className="mb-8 flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-300 shadow-lg"
                  >
                    <Check className="shrink-0 text-emerald-400" size={18} />
                    <p>{success}</p>
                  </motion.div>
                )}

                <fieldset className="space-y-8" disabled={formDisabled}>
                  <div className="space-y-6">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-gold-300" htmlFor="org-name">
                        Organization name <span className="text-rose-400">*</span>
                      </label>
                      <input
                        id="org-name"
                        className={inputClass}
                        onChange={update("name")}
                        placeholder="e.g. Saigon Racing Club"
                        required
                        value={form.name}
                      />
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-gold-300" htmlFor="org-license">
                          Business License <span className="text-rose-400">*</span>
                        </label>
                        <input
                          id="org-license"
                          className={inputClass}
                          onChange={update("licenseNumber")}
                          placeholder="Registration number"
                          required
                          value={form.licenseNumber}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-gold-300" htmlFor="org-phone">
                          Contact phone
                        </label>
                        <input
                          id="org-phone"
                          className={inputClass}
                          onChange={update("contactPhone")}
                          placeholder="+84 123 456 789"
                          value={form.contactPhone}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-gold-300" htmlFor="org-email">
                        Official contact email <span className="text-rose-400">*</span>
                      </label>
                      <input
                        id="org-email"
                        type="email"
                        className={inputClass}
                        onChange={update("contactEmail")}
                        placeholder="director@your-org.com"
                        required
                        value={form.contactEmail}
                      />
                    </div>
                  </div>

                  <div className="h-px w-full bg-white/10" />

                  <div className="space-y-6">
                    <h3 className="text-sm font-semibold text-white">Documents & Media</h3>
                    
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="relative group">
                        <label className="text-xs font-bold uppercase tracking-wider text-gold-300 mb-2 block" htmlFor="org-license-file">
                          License Scan <span className="text-rose-400">*</span>
                        </label>
                        <div className="relative overflow-hidden rounded-xl border border-dashed border-white/20 bg-white/5 p-6 text-center transition-all group-hover:border-gold-400/50 group-hover:bg-white/10">
                          <input
                            id="org-license-file"
                            type="file"
                            accept="application/pdf,image/jpeg,image/png"
                            className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                            onChange={handleLicenseFile}
                            disabled={uploading.license}
                          />
                          <div className="flex flex-col items-center gap-3">
                            <div className={`rounded-full p-3 ${form.evidenceUrl ? "bg-emerald-400/20 text-emerald-400" : "bg-white/10 text-white"}`}>
                              {uploading.license ? (
                                <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                              ) : form.evidenceUrl ? (
                                <Check size={24} />
                              ) : (
                                <FileText size={24} />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">
                                {uploading.license ? "Uploading..." : form.evidenceUrl ? "License Uploaded" : "Upload Document"}
                              </p>
                              <p className="mt-1 text-xs text-ivory-faint line-clamp-1 px-2">
                                {licenseName ?? "PDF, JPG or PNG (Max 5MB)"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="relative group">
                        <label className="text-xs font-bold uppercase tracking-wider text-gold-300 mb-2 block" htmlFor="org-logo-file">
                          Organization Logo
                        </label>
                        <div className="relative overflow-hidden rounded-xl border border-dashed border-white/20 bg-white/5 p-6 text-center transition-all group-hover:border-gold-400/50 group-hover:bg-white/10">
                          <input
                            id="org-logo-file"
                            type="file"
                            accept="image/jpeg,image/png"
                            className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                            onChange={handleLogoFile}
                            disabled={uploading.logo}
                          />
                          <div className="flex flex-col items-center gap-3">
                            <div className={`rounded-full p-3 ${form.logoUrl ? "bg-emerald-400/20 text-emerald-400" : "bg-white/10 text-white"}`}>
                              {uploading.logo ? (
                                <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                              ) : form.logoUrl ? (
                                <Check size={24} />
                              ) : (
                                <ImageIcon size={24} />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">
                                {uploading.logo ? "Uploading..." : form.logoUrl ? "Logo Uploaded" : "Upload Logo"}
                              </p>
                              <p className="mt-1 text-xs text-ivory-faint line-clamp-1 px-2">
                                {logoName ?? "JPG or PNG (Square recommended)"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="h-px w-full bg-white/10" />

                  <div className="space-y-6">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-gold-300" htmlFor="org-desc">
                        Short Tagline
                      </label>
                      <input
                        id="org-desc"
                        className={inputClass}
                        onChange={update("description")}
                        placeholder="A brief summary of your club"
                        value={form.description}
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-gold-300 flex justify-between" htmlFor="org-note">
                        <span>Capability Statement <span className="text-rose-400">*</span></span>
                        <span className={`font-data text-[10px] ${form.applicationNote.length >= 50 ? 'text-emerald-400' : 'text-ivory-faint'}`}>
                          {form.applicationNote.length}/2000 (Min: 50)
                        </span>
                      </label>
                      <textarea
                        id="org-note"
                        className={`${inputClass} min-h-[160px] resize-y py-4 leading-relaxed`}
                        maxLength={2000}
                        minLength={50}
                        onChange={update("applicationNote")}
                        placeholder="Detail your operational experience, the scale of tournaments you plan to host, your venue connections, and why you should be granted organizer status..."
                        required
                        value={form.applicationNote}
                      />
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      className="group relative flex min-h-14 w-full items-center justify-center overflow-hidden rounded-xl bg-gold-400 px-8 text-sm font-bold uppercase tracking-[0.15em] text-turf-950 transition-all hover:bg-gold-300 hover:shadow-[0_0_30px_-5px_rgba(212,175,55,0.6)] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-ivory-faint disabled:shadow-none"
                      type="submit"
                    >
                      <span className="relative z-10 flex items-center gap-2">
                        {submitting
                          ? "Submitting Application..."
                          : busyUploading
                            ? "Processing Files..."
                            : canResubmit
                              ? "Resubmit Application"
                              : "Submit Application"}
                      </span>
                      {!formDisabled && (
                        <div className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] transition-transform duration-1000 group-hover:translate-x-[100%]" />
                      )}
                    </button>
                    {!profileCompleted && (
                      <p className="mt-4 text-center text-sm text-rose-400/80">
                        Please complete your profile to enable submission.
                      </p>
                    )}
                  </div>
                </fieldset>
              </form>
            </MotionReveal>
          </div>
        )}
      </main>
      <ClientFooter />
    </div>
  );
}
