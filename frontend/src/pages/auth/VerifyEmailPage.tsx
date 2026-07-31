import { FormEvent, useEffect, useMemo, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, ArrowRight, ArrowLeft, Loader2, CheckCircle2, AlertCircle, RefreshCw, HelpCircle, ChevronDown } from "lucide-react";

import { resendVerificationEmail, verifyEmail } from "../../api/authApi";
import heroImage from "../../assets/slide.jpg";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { getApiErrorMessage } from "../../utils/apiError";

type NoticeTone = "success" | "error";

function Notice({ children, tone }: { children: string; tone: NoticeTone }) {
  const isError = tone === "error";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className={`mt-5 rounded-xl border p-4 text-sm font-semibold flex items-start gap-3 ${isError
        ? "border-red-200 bg-red-50 text-red-700"
        : "border-emerald-200 bg-emerald-50 text-emerald-700"
        }`}
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
    >
      {isError ? (
        <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
      ) : (
        <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
      )}
      <span>{children}</span>
    </motion.div>
  );
}

const translateApiError = (rawMessage: string): string => {
  const clean = rawMessage.toUpperCase();
  if (
    clean.includes("INVALID_EMAIL_VERIFICATION_TOKEN") ||
    clean.includes("EXPIRED") ||
    clean.includes("INVALID")
  ) {
    return "Invalid or expired verification code. Please check and try again.";
  }
  if (clean.includes("EMAIL_ALREADY_VERIFIED") || clean.includes("ALREADY VERIFIED")) {
    return "This email has already been verified.";
  }
  if (clean.includes("USER_NOT_FOUND") || clean.includes("NOT FOUND")) {
    return "Account not found. Please return to the registration page.";
  }
  return rawMessage;
};

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
  const [shouldShake, setShouldShake] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const hasPendingEmail = email !== "";
  const canVerify = hasPendingEmail && otpCode.length === 6 && !verifying;

  // Refs for the 6 input boxes
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

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
    const cleanVal = value.replace(/\D/g, "").slice(0, 6);
    setOtpCode(cleanVal);

    // Automatically focus appropriate box when the master hidden value changes (e.g. from tests)
    const nextIdx = Math.min(cleanVal.length, 5);
    inputRefs.current[nextIdx]?.focus();
  };

  const handleBoxChange = (index: number, value: string) => {
    setError(null);
    setMessage(null);
    const digits = otpCode.split("");
    // Take only the last typed character in case of multiple inputs in one box
    const char = value.slice(-1).replace(/\D/g, "");

    digits[index] = char;
    const newOtp = digits.join("").slice(0, 6);
    setOtpCode(newOtp);

    if (char !== "" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace") {
      const digits = otpCode.split("");
      if (digits[index] === undefined || digits[index] === "") {
        // Current box is already empty, move to previous box
        if (index > 0) {
          inputRefs.current[index - 1]?.focus();
        }
      } else {
        // Clear current box digit
        digits[index] = "";
        setOtpCode(digits.join(""));
      }
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pastedData = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    setOtpCode(pastedData);

    // Focus the appropriate input box
    const focusIdx = Math.min(pastedData.length, 5);
    inputRefs.current[focusIdx]?.focus();
  };

  // F1: Xác thực email
  const handleVerify = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canVerify) {
      setShouldShake(true);
      setTimeout(() => setShouldShake(false), 500);
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
      setShouldShake(true);
      setTimeout(() => setShouldShake(false), 500);
      const rawError = getApiErrorMessage(err, "Verification code expired or invalid.");
      setError(translateApiError(rawError));
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
      setError(getApiErrorMessage(err, "Could not resend the verification code. Please try again later."));
    } finally {
      setSending(false);
    }
  };

  const viewState = useMemo(() => {
    if (verifying) {
      return {
        heading: "Verifying your code",
        eyebrow: "Secure account check",
        description: "Please wait while we confirm your tournament account.",
      };
    }

    if (verified) {
      return {
        heading: "Email verified",
        eyebrow: "Account activated",
        description: "Your account is active. Continue to login and enter the tournament platform.",
      };
    }

    if (error && otpCode.length === 6) {
      return {
        heading: "Code not accepted",
        eyebrow: "Verification failed",
        description: "Request a new code if this one expired, or confirm the email address was typed correctly.",
      };
    }

    return {
      heading: "Check your inbox",
      eyebrow: "One more step",
      description: hasPendingEmail
        ? "Enter the 6 digit verification code we sent to your email."
        : "We need an email address before we can resend a verification code.",
    };
  }, [error, hasPendingEmail, otpCode.length, verified, verifying]);

  const resendLabel = resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Resend code";

  // Create digit array for the individual boxes
  const otpDigits = Array(6)
    .fill("")
    .map((_, i) => otpCode[i] || "");

  return (
    <div className="min-h-screen bg-white font-sans text-nyraDark selection:bg-nyraGreen selection:text-white lg:grid lg:grid-cols-[minmax(0,1.45fr)_minmax(420px,0.8fr)]">
      {/* Sticky Hero Banner */}
      <section
        aria-label="Tournament operations introduction"
        className="relative min-h-[300px] overflow-hidden bg-[#00081e] lg:sticky lg:top-0 lg:h-screen lg:min-h-screen"
      >
        <motion.img
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 2, ease: "easeOut" }}
          alt="Elite thoroughbred racing"
          className="absolute inset-0 h-full w-full object-cover opacity-60 mix-blend-overlay"
          src={heroImage}
        />
        <div className="absolute inset-0 bg-[#00081e]/30" />
        <div className="relative z-10 flex min-h-[300px] flex-col justify-end bg-gradient-to-t from-[#00081e] via-[#00081e]/25 to-transparent p-6 sm:p-8 md:p-12 lg:min-h-screen lg:p-16">
          <div className="max-w-2xl pt-10">
            <span className="border-b-2 border-nyraGold pb-1 text-xs font-bold uppercase tracking-[0.2em] text-nyraGold">
              Official Tournament Operations
            </span>
            <h1 className="mt-4 font-serif text-4xl leading-tight text-white sm:text-5xl md:text-6xl">
              Verify Account
            </h1>
            <p className="mt-6 max-w-md text-base font-light leading-relaxed text-gray-300 sm:text-lg">
              Confirm your identity to gain verified credentials for registrations, jockeys, and owner stables.
            </p>
          </div>
        </div>
      </section>

      {/* Verification Area */}
      <section
        aria-label="OTP verification form"
        className="flex w-full justify-center bg-white px-6 py-12 sm:px-8 lg:h-screen lg:overflow-y-auto lg:items-start"
      >
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto w-full max-w-[430px] lg:my-auto flex flex-col justify-center min-h-[calc(100vh-6rem)] lg:min-h-0"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={viewState.heading}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="text-left mb-8"
            >
              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-nyraGreen">
                {viewState.eyebrow}
              </span>
              <h2 className="mt-2 font-serif text-4xl text-nyraDark leading-tight">
                {viewState.heading}
              </h2>
              <p className="mt-3 font-light text-slate-600 leading-relaxed text-sm">
                {viewState.description}
              </p>
            </motion.div>
          </AnimatePresence>

          {hasPendingEmail && !verified && (
            <div className="mb-6 rounded-2xl border border-slate-100 bg-slate-50/50 p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-nyraGreen/10 flex items-center justify-center text-nyraGreen shrink-0">
                <Mail className="h-5 w-5" />
              </div>
              <div className="overflow-hidden">
                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Sent verification email to</p>
                <p className="text-sm font-bold text-slate-900 truncate" title={email}>{email}</p>
              </div>
            </div>
          )}

          {hasPendingEmail && !verified && (
            <form onSubmit={handleVerify} className="space-y-6">
              {/* Accessibility/Testing Input (Hidden from view but in DOM) */}
              <div className="sr-only">
                <label htmlFor="verification-code">Verification code</label>
                <input
                  aria-describedby="verification-code-help"
                  autoComplete="one-time-code"
                  id="verification-code"
                  inputMode="numeric"
                  maxLength={6}
                  onChange={(e) => handleOtpChange(e.target.value)}
                  pattern="[0-9]{6}"
                  type="text"
                  value={otpCode}
                />
              </div>

              {/* Redesigned 6-digit individual input grid */}
              <motion.div
                animate={shouldShake ? { x: [-10, 10, -10, 10, -5, 5, 0] } : {}}
                transition={{ duration: 0.5 }}
                className="grid grid-cols-6 gap-2 sm:gap-3 justify-center py-2"
              >
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => { inputRefs.current[idx] = el; }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleBoxChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    onPaste={handlePaste}
                    className={`h-14 w-full sm:h-16 text-center font-mono text-2xl font-bold rounded-xl border outline-none transition-all duration-200 ${digit
                      ? "border-nyraGreen bg-nyraGreen/5 text-nyraDark shadow-sm"
                      : "border-slate-200 bg-white text-slate-400 focus:border-nyraGreen focus:ring-2 focus:ring-nyraGreen/10"
                      }`}
                  />
                ))}
              </motion.div>

              <p className="text-xs text-center text-slate-400" id="verification-code-help">
                Type or paste the 6-digit security code.
              </p>

              {/* Alert Notification Display */}
              <AnimatePresence mode="wait">
                {error && <Notice tone="error">{error}</Notice>}
                {message && <Notice tone="success">{message}</Notice>}
              </AnimatePresence>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 pt-2">
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  disabled={!canVerify}
                  className="w-full bg-nyraGreen py-4 rounded-xl text-xs font-bold uppercase tracking-[0.2em] text-white shadow-lg shadow-nyraGreen/15 hover:bg-nyraLightGreen transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  type="submit"
                >
                  {verifying ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Verifying Code...</span>
                    </>
                  ) : (
                    <>
                      <span>Verify Email</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  disabled={sending || verifying || resendCooldown > 0}
                  onClick={handleResend}
                  className="w-full border border-slate-200 py-4 rounded-xl text-xs font-bold uppercase tracking-[0.2em] text-slate-600 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  type="button"
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4.5 w-4.5" />
                  )}
                  <span>{resendLabel}</span>
                </motion.button>
              </div>

              {/* Help Accordion */}
              <div className="mt-6 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowHelp(!showHelp)}
                  className="flex w-full items-center justify-between py-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-nyraGreen transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <HelpCircle className="h-4 w-4" />
                    Need help?
                  </span>
                  <motion.span
                    animate={{ rotate: showHelp ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </motion.span>
                </button>

                <AnimatePresence initial={false}>
                  {showHelp && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 space-y-4 rounded-xl bg-slate-50 p-4 text-xs leading-relaxed text-slate-600 border border-slate-100">
                        <div>
                          <p className="font-bold text-slate-950">1. Invalid Code</p>
                          <p className="mt-1">
                            Make sure you entered the correct 6-digit code from the latest verification email. Requesting a new code invalidates all previous codes.
                          </p>
                        </div>
                        <div>
                          <p className="font-bold text-slate-950">2. Expired Code</p>
                          <p className="mt-1">
                            Verification codes are valid for a limited time (e.g., 10 minutes). If your code has expired, click the <strong>Resend code</strong> button above to request a new one.
                          </p>
                        </div>
                        <div>
                          <p className="font-bold text-slate-950">3. No Email Received</p>
                          <p className="mt-1">
                            Check your spam, promotions, or trash folder. If you still don't see it, wait 1-2 minutes and request a new code.
                          </p>
                        </div>
                        <div>
                          <p className="font-bold text-slate-950">4. Incorrect Email Address</p>
                          <p className="mt-1">
                            If the email address shown above is typed incorrectly, click <strong>Back to register</strong> below to register a new account.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </form>
          )}

          {/* Simple alert display for generic non-form error/message alerts */}
          {!hasPendingEmail && !verified && (
            <div className="space-y-4">
              <AnimatePresence>
                {error && <Notice tone="error">{error}</Notice>}
                {message && <Notice tone="success">{message}</Notice>}
              </AnimatePresence>
            </div>
          )}

          {verified && (
            <div className="space-y-4">
              <AnimatePresence>
                {message && <Notice tone="success">{message}</Notice>}
              </AnimatePresence>
            </div>
          )}

          {/* Navigation Links */}
          <div className="mt-8 flex justify-center border-t border-slate-100 pt-6">
            {verified ? (
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-xl bg-nyraGreen px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-white shadow-md shadow-nyraGreen/30 transition-all duration-200 hover:bg-nyraLightGreen hover:shadow-nyraGreen/40 hover:scale-[1.03] active:scale-95"
              >
                <span>Go to Login</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ) : hasPendingEmail ? (
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-xl border border-nyraGreen/40 bg-nyraGreen/8 px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-nyraGreen shadow-sm transition-all duration-200 hover:bg-nyraGreen hover:text-white hover:shadow-nyraGreen/30 hover:scale-[1.03] active:scale-95"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to Login</span>
              </Link>
            ) : (
              <div className="flex gap-3">
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-slate-600 shadow-sm transition-all duration-200 hover:border-nyraGreen/40 hover:bg-nyraGreen/8 hover:text-nyraGreen hover:scale-[1.03] active:scale-95"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Back to Register</span>
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 rounded-xl bg-nyraGreen px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-white shadow-md shadow-nyraGreen/30 transition-all duration-200 hover:bg-nyraLightGreen hover:shadow-nyraGreen/40 hover:scale-[1.03] active:scale-95"
                >
                  <span>Back to Login</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}
          </div>

          <footer className="mt-16 flex flex-col gap-4 border-t border-gray-100 pt-8">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-nyraGreen/10 text-sm font-black text-nyraGreen">
                V
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-nyraGreen">
                Certified Championship Partner
              </p>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">2026 Tournament</span>
            </div>
          </footer>
        </motion.div>
      </section>
    </div>
  );
}
