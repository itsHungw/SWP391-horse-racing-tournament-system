import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

import { forgotPassword, resetPassword, verifyResetCode } from "../../api/authApi";
import heroImage from "../../assets/slide.jpg";
import logo from "../../assets/logo.png";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { validateEmail } from "../../utils/validation";

type Step = "verify" | "reset" | "success";
type PendingAction = "send-code" | "verify-code" | "reset-password" | null;

function Field({
  autoComplete,
  id,
  label,
  onChange,
  placeholder,
  type = "text",
  value,
}: {
  autoComplete?: string;
  id: string;
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  value: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-nyraGreen" htmlFor={id}>
        {label}
      </label>
      <input
        autoComplete={autoComplete}
        className="w-full rounded-sm border border-gray-200 px-4 py-4 text-sm font-sans font-semibold transition-all focus:border-nyraGreen focus:ring-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nyraGreen/30"
        id={id}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type={type}
        value={value}
      />
    </div>
  );
}

export function ForgotPasswordPage() {
  useDocumentTitle("Forgot Password | Aqueduct");

  const [step, setStep] = useState<Step>("verify");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  const normalizedEmail = email.trim();
  const canVerifyCode = validateEmail(normalizedEmail) && token.length === 6;
  const canSubmitReset = token.length === 6 && newPassword.length >= 8 && confirmPassword.length >= 8;

  const handleRequestCode = async () => {
    if (!validateEmail(normalizedEmail)) {
      setError("Enter a valid email address.");
      setMessage("");
      return;
    }

    try {
      setPendingAction("send-code");
      setError("");
      await forgotPassword(normalizedEmail);
      setEmail(normalizedEmail);
      setToken("");
      setMessage("If this email exists, we sent a reset code.");
    } catch {
      setError("Could not request a reset code. Please try again.");
      setMessage("");
    } finally {
      setPendingAction(null);
    }
  };

  const handleVerifyCode = async (event: FormEvent) => {
    event.preventDefault();

    if (!validateEmail(normalizedEmail)) {
      setError("Enter a valid email address.");
      setMessage("");
      return;
    }

    if (!/^\d{6}$/.test(token)) {
      setError("Enter the 6 digit reset code from your email.");
      setMessage("");
      return;
    }

    try {
      setPendingAction("verify-code");
      setError("");
      await verifyResetCode({
        email: normalizedEmail,
        token,
      });
      setEmail(normalizedEmail);
      setStep("reset");
      setMessage("Code verified. Enter your new password.");
    } catch {
      setError("The reset code is invalid, expired, or locked. Request a new code and try again.");
      setMessage("");
    } finally {
      setPendingAction(null);
    }
  };

  const handleResetPassword = async (event: FormEvent) => {
    event.preventDefault();

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      setMessage("");
      return;
    }

    try {
      setPendingAction("reset-password");
      setError("");
      await resetPassword({
        email: normalizedEmail,
        token,
        newPassword,
        confirmPassword,
      });
      setStep("success");
      setMessage("Password changed successfully. You can now log in.");
      setToken("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setError("The reset code is invalid, expired, or locked. Request a new code and try again.");
    } finally {
      setPendingAction(null);
    }
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as const } },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.12 },
    },
  };

  const formPanelVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
    exit: { opacity: 0, y: -15, transition: { duration: 0.2 } },
  };

  return (
    <main className="min-h-screen bg-white font-sans text-nyraDark selection:bg-nyraGreen selection:text-white lg:grid lg:grid-cols-[minmax(0,1.45fr)_minmax(420px,0.8fr)]">
      <section
        aria-label="Tournament operations introduction"
        className="relative min-h-[420px] overflow-hidden bg-[#00081e] sm:min-h-[460px] lg:sticky lg:top-0 lg:h-screen lg:min-h-screen"
      >
        <motion.img
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 2, ease: "easeOut" }}
          alt="Elite thoroughbred racing"
          className="absolute inset-0 h-full w-full object-cover opacity-70 mix-blend-overlay"
          src={heroImage}
        />
        <div className="absolute inset-0 bg-[#00081e]/30" />
        <div className="relative z-10 flex min-h-[420px] flex-col justify-end bg-gradient-to-t from-[#00081e] via-[#00081e]/25 to-transparent px-8 py-10 sm:min-h-[460px] md:px-12 lg:min-h-screen lg:px-16 lg:py-16">
          <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
            <motion.div variants={fadeInUp} className="mb-6">
              <span className="border-b-2 border-nyraGold pb-1 text-xs font-bold uppercase tracking-[0.2em] text-nyraGold">
                Official Tournament Operations
              </span>
            </motion.div>
            <motion.h1 variants={fadeInUp} className="max-w-2xl font-serif text-4xl leading-[0.95] tracking-tight text-white sm:text-5xl md:text-6xl xl:text-7xl">
              The Prestige of Performance.
            </motion.h1>
            <motion.p variants={fadeInUp} className="mt-6 max-w-md text-base font-light leading-relaxed text-gray-300 sm:text-lg md:text-xl">
              Recover access to the racing tournament ecosystem with a verified one-time code.
            </motion.p>
          </motion.div>
        </div>
      </section>

      <section
        aria-label="Password recovery"
        className="flex w-full justify-center bg-white px-6 py-8 sm:px-8 lg:h-screen lg:items-center lg:overflow-y-auto lg:py-10"
      >
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto w-full max-w-[430px]"
        >
          <header className="mb-8 sm:mb-10">
            <p className="mb-3 text-[10px] font-black uppercase tracking-[0.22em] text-nyraGreen">
              Account recovery
            </p>
            <h2 className="mb-3 font-serif text-4xl text-nyraDark">Reset Password</h2>
            <p className="font-light leading-relaxed text-gray-600">
              Send a short-lived 6 digit code, verify it, then choose a new password.
            </p>
          </header>

          <AnimatePresence mode="wait">
            {message && (
              <motion.div
                key="message"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-6 rounded-sm border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700"
                role="status"
              >
                {message}
              </motion.div>
            )}
            {error && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-6 rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
                role="alert"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {step === "verify" && (
              <motion.form
                key="verify-panel"
                variants={formPanelVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="auth-panel-motion space-y-6"
                onSubmit={handleVerifyCode}
              >
                <Field
                  autoComplete="email"
                  id="forgot-email"
                  label="Email Address"
                  onChange={setEmail}
                  placeholder="official@nyra.com"
                  type="email"
                  value={email}
                />

                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-nyraGreen" htmlFor="reset-code">
                    Reset code
                  </label>
                  <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                    <input
                      autoComplete="one-time-code"
                      className="w-full rounded-sm border border-gray-200 px-4 py-4 text-center text-sm font-black tracking-[0.45em] transition-all focus:border-nyraGreen focus:ring-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nyraGreen/30"
                      id="reset-code"
                      inputMode="numeric"
                      maxLength={6}
                      onChange={(event) => setToken(event.target.value.replace(/\D/g, "").slice(0, 6))}
                      value={token}
                    />
                    <button
                      className="min-h-11 bg-nyraDark px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-white shadow-lg transition-colors hover:bg-black focus:outline-none focus-visible:ring-2 focus-visible:ring-nyraGold disabled:opacity-60"
                      disabled={pendingAction !== null}
                      onClick={handleRequestCode}
                      type="button"
                    >
                      {pendingAction === "send-code" ? "Sending..." : "Send code"}
                    </button>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-nyraRed py-5 text-xs font-bold uppercase tracking-[0.2em] text-white shadow-lg shadow-red-900/20 transition-colors hover:bg-red-700 disabled:opacity-60"
                  disabled={pendingAction !== null || !canVerifyCode}
                  type="submit"
                >
                  {pendingAction === "verify-code" ? "Verifying..." : "Verify code"}
                </motion.button>
              </motion.form>
            )}

            {step === "reset" && (
              <motion.form
                key="reset-panel"
                variants={formPanelVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="auth-panel-motion space-y-6"
                onSubmit={handleResetPassword}
              >
                <p className="break-all rounded-sm bg-slate-50 p-3 text-sm font-bold text-slate-700">
                  {email}
                </p>

                <Field
                  autoComplete="new-password"
                  id="new-password"
                  label="New Password"
                  onChange={setNewPassword}
                  placeholder="Password1"
                  type="password"
                  value={newPassword}
                />
                <Field
                  autoComplete="new-password"
                  id="confirm-new-password"
                  label="Confirm New Password"
                  onChange={setConfirmPassword}
                  placeholder="Password1"
                  type="password"
                  value={confirmPassword}
                />

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-nyraRed py-5 text-xs font-bold uppercase tracking-[0.2em] text-white shadow-lg shadow-red-900/20 transition-colors hover:bg-red-700 disabled:opacity-60"
                  disabled={pendingAction !== null || !canSubmitReset}
                  type="submit"
                >
                  {pendingAction === "reset-password" ? "Resetting..." : "Reset password"}
                </motion.button>
              </motion.form>
            )}

            {step === "success" && (
              <motion.div
                key="success-panel"
                variants={formPanelVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="auth-panel-motion"
              >
                <Link
                  className="block min-h-11 bg-nyraRed px-4 py-5 text-center text-xs font-bold uppercase tracking-[0.2em] text-white shadow-lg shadow-red-900/20 transition-colors hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-nyraGold"
                  to="/login"
                >
                  Go to login
                </Link>
              </motion.div>
            )}
          </AnimatePresence>

          {step !== "success" && (
            <Link
              className="mt-5 block min-h-11 py-3 text-center text-sm font-bold text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-nyraGold"
              to="/login"
            >
              Back to login
            </Link>
          )}

          <footer className="mt-16 flex flex-col gap-4 border-t border-gray-100 pt-8">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-nyraGreen/10 text-sm font-black text-nyraGreen">
                V
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-nyraGreen">
                Certified Tournament Partner
              </p>
            </div>
            <div className="flex items-center justify-between">
              <img alt="" className="h-8 opacity-40 grayscale transition-all hover:opacity-100 hover:grayscale-0" src={logo} />
              <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">2026 Aqueduct</span>
            </div>
          </footer>
        </motion.div>
      </section>
    </main>
  );
}
