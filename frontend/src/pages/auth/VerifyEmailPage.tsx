import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { resendVerificationEmail, verifyEmail } from "../../api/authApi";
import heroImage from "../../assets/slide.jpg";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";

type NoticeTone = "success" | "error";

function Notice({ children, tone }: { children: string; tone: NoticeTone }) {
  const isError = tone === "error";

  return (
    <div
      className={`mt-5 rounded-sm border px-4 py-3 text-sm font-semibold ${
        isError
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-emerald-200 bg-emerald-50 text-emerald-700"
      }`}
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
    >
      {children}
    </div>
  );
}

function StatusBadge({ children, tone }: { children: string; tone: "pending" | "success" | "error" }) {
  const toneClass =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : tone === "error"
        ? "border-red-200 bg-red-50 text-red-700"
        : "border-nyraGold/30 bg-nyraGold/10 text-nyraGreen";

  return (
    <div
      className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full border text-lg font-black ${toneClass}`}
      aria-hidden="true"
    >
      {children}
    </div>
  );
}

export function VerifyEmailPage() {
  useDocumentTitle("Verify Email");

  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hasPendingEmail = email !== "";
  const canVerify = hasPendingEmail && otpCode.length === 6 && !verifying;

  useEffect(() => {
    setEmail(localStorage.getItem("pendingVerifyEmail") || "");
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setResendCooldown((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  const handleOtpChange = (value: string) => {
    setError(null);
    setMessage(null);
    setOtpCode(value.replace(/\D/g, "").slice(0, 6));
  };

  // F1: Xác thực email
  const handleVerify = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canVerify) {
      setError("Enter the 6 digit verification code from your email.");
      return;
    }

    try {
      setError(null);
      setMessage(null);
      setVerifying(true);
      await verifyEmail(otpCode);
      localStorage.removeItem("pendingVerifyEmail");
      setEmail("");
      setVerified(true);
      setMessage("Email verified successfully. You can now log in.");
    } catch (err: any) {
      setVerified(false);
      setError(err.response?.data?.error || "Verification code expired or invalid.");
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!hasPendingEmail) {
      setError("We could not find the email for this verification request. Please register again.");
      return;
    }

    try {
      setError(null);
      setMessage(null);
      setSending(true);
      await resendVerificationEmail(email);
      setOtpCode("");
      setResendCooldown(60);
      setMessage("A new verification code has been sent to your inbox.");
    } catch (err: any) {
      setError(err.response?.data?.error || "Could not resend the verification code. Please try again later.");
    } finally {
      setSending(false);
    }
  };

  const viewState = useMemo(() => {
    if (verifying) {
      return {
        badge: "...",
        badgeTone: "pending" as const,
        heading: "Verifying your code",
        eyebrow: "Secure account check",
        description: "Please wait while we confirm your tournament account.",
      };
    }

    if (verified) {
      return {
        badge: "V",
        badgeTone: "success" as const,
        heading: "Email verified",
        eyebrow: "Account activated",
        description: "Your account is active. Continue to login and enter the tournament platform.",
      };
    }

    if (error && otpCode.length === 6) {
      return {
        badge: "!",
        badgeTone: "error" as const,
        heading: "Code not accepted",
        eyebrow: "Verification failed",
        description: "Request a new code if this one expired, or confirm the email address was typed correctly.",
      };
    }

    return {
      badge: "6",
      badgeTone: "pending" as const,
      heading: "Check your inbox",
      eyebrow: "One more step",
      description: hasPendingEmail
        ? "Enter the 6 digit verification code we sent to your email."
        : "We need an email address before we can resend a verification code.",
    };
  }, [error, hasPendingEmail, otpCode.length, verified, verifying]);

  const resendLabel = resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Resend code";

  return (
    <section className="min-h-screen bg-[#f6f7f6] text-nyraDark">
      <div className="relative overflow-hidden bg-[#00081e]">
        <img
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-30 mix-blend-overlay"
          src={heroImage}
        />
        <div className="relative mx-auto flex min-h-[254px] w-full max-w-6xl flex-col px-6 py-6 sm:px-8 lg:min-h-[300px] lg:px-10 lg:py-8">
          <Link
            to="/"
            className="inline-flex w-fit items-center border-l-4 border-nyraGold pl-3 text-xs font-black uppercase tracking-[0.22em] text-nyraGold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            EquinePro Elite
          </Link>
          <div className="mt-auto max-w-2xl pt-10">
            <p className="mb-3 border-l-4 border-nyraGold pl-4 text-xs font-black uppercase tracking-[0.22em] text-nyraGold">
              {viewState.eyebrow}
            </p>
            <h1 className="font-serif text-4xl leading-tight text-white sm:text-5xl">Verify your tournament account</h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-white/75">
              Keep your account secure before joining races, predictions, and role requests.
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-8 sm:px-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(320px,0.65fr)] lg:px-10 lg:py-12">
        <div className="rounded-sm border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:p-10">
          <StatusBadge tone={viewState.badgeTone}>{viewState.badge}</StatusBadge>

          <div role="status" aria-live="polite" className="mt-6 text-center">
            <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">{viewState.heading}</h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">{viewState.description}</p>
          </div>

          {hasPendingEmail && !verified && (
            <div className="mx-auto mt-6 max-w-md rounded-sm border border-slate-200 bg-slate-50 px-4 py-3 text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-nyraGreen">Verification email</p>
              <p className="mt-1 break-all text-sm font-bold text-slate-900">{email}</p>
            </div>
          )}

          {hasPendingEmail && !verified && (
            <form className="mx-auto mt-6 max-w-md" onSubmit={handleVerify}>
              <label className="mb-2 block text-center text-[10px] font-black uppercase tracking-[0.18em] text-nyraGreen" htmlFor="verification-code">
                Verification code
              </label>
              <input
                aria-describedby="verification-code-help"
                autoComplete="one-time-code"
                className="h-14 w-full rounded-sm border border-slate-300 bg-white px-4 text-center font-mono text-2xl font-black tracking-[0.45em] text-slate-950 outline-none transition focus:border-nyraGreen focus:ring-2 focus:ring-nyraGreen/20"
                id="verification-code"
                inputMode="numeric"
                maxLength={6}
                onChange={(event) => handleOtpChange(event.target.value)}
                pattern="[0-9]{6}"
                placeholder="000000"
                type="text"
                value={otpCode}
              />
              <p className="mt-2 text-center text-xs text-slate-500" id="verification-code-help">
                Paste or type the 6 digit code from your email.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <button
                  className="inline-flex min-h-11 items-center justify-center rounded-sm bg-nyraGreen px-6 py-3 text-xs font-black uppercase tracking-[0.18em] text-white transition-colors hover:bg-nyraLightGreen disabled:cursor-not-allowed disabled:opacity-55 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nyraGreen"
                  disabled={!canVerify}
                  type="submit"
                >
                  {verifying ? "Verifying..." : "Verify Email"}
                </button>
                <button
                  onClick={handleResend}
                  disabled={sending || verifying || resendCooldown > 0}
                  className="inline-flex min-h-11 items-center justify-center rounded-sm border border-slate-300 px-6 py-3 text-xs font-black uppercase tracking-[0.18em] text-slate-700 transition-colors hover:border-nyraGreen hover:text-nyraGreen disabled:cursor-not-allowed disabled:opacity-55 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nyraGreen"
                  type="button"
                >
                  {sending ? "Sending..." : resendLabel}
                </button>
              </div>
            </form>
          )}

          {error && <Notice tone="error">{error}</Notice>}
          {message && <Notice tone="success">{message}</Notice>}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            {verified ? (
              <Link
                to="/login"
                className="inline-flex min-h-11 items-center justify-center rounded-sm bg-nyraGreen px-6 py-3 text-xs font-black uppercase tracking-[0.18em] text-white transition-colors hover:bg-nyraLightGreen focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nyraGreen"
              >
                Go to Login
              </Link>
            ) : hasPendingEmail ? (
              <Link
                to="/login"
                className="inline-flex min-h-11 items-center justify-center rounded-sm border border-slate-300 px-6 py-3 text-xs font-black uppercase tracking-[0.18em] text-slate-700 transition-colors hover:border-nyraGreen hover:text-nyraGreen focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nyraGreen"
              >
                Back to login
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="inline-flex min-h-11 items-center justify-center rounded-sm bg-nyraGreen px-6 py-3 text-xs font-black uppercase tracking-[0.18em] text-white transition-colors hover:bg-nyraLightGreen focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nyraGreen"
                >
                  Back to register
                </Link>
                <Link
                  to="/login"
                  className="inline-flex min-h-11 items-center justify-center rounded-sm border border-slate-300 px-6 py-3 text-xs font-black uppercase tracking-[0.18em] text-slate-700 transition-colors hover:border-nyraGreen hover:text-nyraGreen focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nyraGreen"
                >
                  Back to login
                </Link>
              </>
            )}
          </div>
        </div>

        <aside className="rounded-sm border border-slate-200 bg-white p-6 shadow-sm lg:p-7" aria-label="Verification help">
          <h3 className="text-sm font-black uppercase tracking-[0.18em] text-nyraGreen">Need help?</h3>
          <div className="mt-5 space-y-5 text-sm leading-6 text-slate-600">
            <div>
              <p className="font-bold text-slate-950">Check your spam folder</p>
              <p className="mt-1">Some mail providers filter new tournament emails on the first send.</p>
            </div>
            <div>
              <p className="font-bold text-slate-950">Use the newest code</p>
              <p className="mt-1">If you request a new code, older verification codes may stop working.</p>
            </div>
            <div>
              <p className="font-bold text-slate-950">Still blocked?</p>
              <p className="mt-1">Return to registration and confirm the email address was typed correctly.</p>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
