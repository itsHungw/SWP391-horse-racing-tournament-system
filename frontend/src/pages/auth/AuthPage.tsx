import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";

import { login, register } from "../../api/authApi";
import heroImage from "../../assets/slide.jpg";
import logo from "../../assets/logo.png";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { getRolesFromAccessToken } from "../../utils/authRoles";
import {
  sanitizePhoneNumber,
  validateEmail,
  validatePasswordStrength,
  validateVietnamesePhone,
} from "../../utils/validation";
import { setClientSession } from "../../utils/authSession";

type AuthMode = "login" | "register";

type ApiError = {
  response?: {
    data?: {
      error?: string;
    };
  };
};

function getApiErrorMessage(error: unknown, fallback: string) {
  return (error as ApiError).response?.data?.error || fallback;
}

function Field({
  autoComplete,
  compact = false,
  id,
  label,
  onChange,
  placeholder,
  type = "text",
  value,
}: {
  autoComplete?: string;
  compact?: boolean;
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
        className={`w-full rounded-sm border border-gray-200 px-4 text-sm font-sans transition-all focus:border-nyraGreen focus:ring-0 ${
          compact ? "py-3" : "py-4"
        }`}
        id={id}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type={type}
        value={value}
      />
    </div>
  );
}

export function AuthPage({ initialMode }: { initialMode: AuthMode }) {
  useDocumentTitle(initialMode === "login" ? "Login | EquinePro Elite" : "Create Account | EquinePro Elite");

  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isLogin = mode === "login";

  const switchMode = (nextMode: AuthMode) => {
    setError(null);
    setMode(nextMode);
    navigate(nextMode === "login" ? "/login" : "/register", { replace: true });
  };

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();

    if (!loginEmail || !loginPassword) {
      setError("Please enter both email and password.");
      return;
    }

    if (!validateEmail(loginEmail)) {
      setError("Email format is invalid.");
      return;
    }

    try {
      setError(null);
      setLoading(true);
      const response = await login({ email: loginEmail, password: loginPassword });
      setClientSession(response.accessToken, response.fullName, response.email);
      const roles = getRolesFromAccessToken(response.accessToken);
      if (roles.includes("ADMIN")) {
        navigate("/admin", { replace: true });
      } else if (roles.includes("REFEREE")) {
        navigate("/referee", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    } catch (err) {
      setError(getApiErrorMessage(err, "Login failed. Please check your credentials."));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (event: FormEvent) => {
    event.preventDefault();
    const cleanPhone = sanitizePhoneNumber(phone);

    if (!fullName || !registerEmail || !registerPassword || !confirmPassword || !phone) {
      setError("Please complete all required account fields.");
      return;
    }

    if (!validateEmail(registerEmail)) {
      setError("Email format is invalid.");
      return;
    }

    if (!validatePasswordStrength(registerPassword)) {
      setError("Password must be at least 8 characters and include letters and numbers.");
      return;
    }

    if (registerPassword !== confirmPassword) {
      setError("Password confirmation does not match.");
      return;
    }

    if (!validateVietnamesePhone(cleanPhone)) {
      setError("Phone number must be a valid Vietnamese mobile number.");
      return;
    }

    if (!acceptedTerms) {
      setError("Please accept the tournament rules before creating an account.");
      return;
    }

    try {
      setError(null);
      setLoading(true);
      await register({
        email: registerEmail,
        fullName,
        password: registerPassword,
        phone: cleanPhone,
      });
      localStorage.setItem("pendingVerifyEmail", registerEmail);
      navigate("/verify-email", { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err, "Registration failed. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-nyraDark selection:bg-nyraGreen selection:text-white lg:grid lg:grid-cols-[minmax(0,1.45fr)_minmax(420px,0.8fr)]">
      <section
        aria-label="Tournament operations introduction"
        className="relative min-h-[420px] overflow-hidden bg-[#00081e] sm:min-h-[460px] lg:sticky lg:top-0 lg:h-screen lg:min-h-screen"
      >
        <img
          alt="Elite thoroughbred racing"
          className="absolute inset-0 h-full w-full object-cover opacity-70 mix-blend-overlay"
          src={heroImage}
        />
        <div className="absolute inset-0 bg-[#00081e]/30" />
        <div className="relative z-10 flex min-h-[420px] flex-col justify-end bg-gradient-to-t from-[#00081e] via-[#00081e]/25 to-transparent px-8 py-10 sm:min-h-[460px] md:px-12 lg:min-h-screen lg:px-16 lg:py-16">
          <div className="mb-6">
            <span className="border-b-2 border-nyraGold pb-1 text-xs font-bold uppercase tracking-[0.2em] text-nyraGold">
              Official Tournament Operations
            </span>
          </div>
          <h1 className="max-w-2xl font-serif text-4xl leading-[0.95] tracking-tight text-white sm:text-5xl md:text-6xl xl:text-7xl">
            The Prestige of Performance.
          </h1>
          <p className="mt-6 max-w-md text-base font-light leading-relaxed text-gray-300 sm:text-lg md:text-xl">
            Access the racing tournament ecosystem and join the upper echelon of tournament operations.
          </p>
        </div>
      </section>

      <section
        aria-label="Authentication"
        className={`flex w-full justify-center bg-white px-6 py-8 sm:px-8 lg:h-screen lg:overflow-y-auto lg:py-10 ${
          isLogin ? "lg:items-center" : "lg:items-start"
        }`}
      >
        <div className="mx-auto w-full max-w-[430px]">
          <div className="relative mb-8 flex w-full overflow-hidden rounded-2xl border border-white/70 bg-white/55 p-1 shadow-[0_18px_45px_rgba(15,23,42,0.10)] ring-1 ring-slate-900/5 backdrop-blur-xl sm:mb-10">
            <div
              className={`auth-toggle-pill absolute h-[calc(100%-8px)] w-[calc(50%-4px)] rounded-[14px] bg-nyraGreen/95 shadow-[0_14px_34px_rgba(0,77,61,0.28),inset_0_1px_0_rgba(255,255,255,0.22)] ring-1 ring-white/25 backdrop-blur-2xl ${
                isLogin ? "translate-x-0" : "translate-x-full"
              }`}
              aria-hidden="true"
            />
            <button
              aria-pressed={isLogin}
              className={`relative z-10 min-h-11 flex-1 rounded-[14px] py-3 text-[11px] font-bold uppercase tracking-wider transition-colors duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nyraGreen sm:text-xs sm:tracking-widest ${
                isLogin ? "text-white" : "text-slate-500 hover:text-slate-700"
              }`}
              onClick={() => switchMode("login")}
              type="button"
            >
              Login
            </button>
            <button
              aria-label="Create account tab"
              aria-pressed={!isLogin}
              className={`relative z-10 min-h-11 flex-1 rounded-[14px] py-3 text-[11px] font-bold uppercase tracking-wider transition-colors duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nyraGreen sm:text-xs sm:tracking-widest ${
                isLogin ? "text-slate-500 hover:text-slate-700" : "text-white"
              }`}
              onClick={() => switchMode("register")}
              type="button"
            >
              Create Account
            </button>
          </div>

          {error && (
            <div className="mb-6 rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">
              {error}
            </div>
          )}

          {isLogin ? (
            <div className="auth-panel-motion">
              <header className="mb-8 sm:mb-10">
                <h2 className="mb-3 font-serif text-4xl text-nyraDark">Welcome Back</h2>
                <p className="font-light text-gray-600">
                  Enter your secure credentials to access the tournament terminal.
                </p>
              </header>

              <form className="space-y-6" onSubmit={handleLogin}>
                <Field
                  autoComplete="email"
                  id="login-email"
                  label="Email Address"
                  onChange={setLoginEmail}
                  placeholder="official@nyra.com"
                  type="email"
                  value={loginEmail}
                />
                <Field
                  autoComplete="current-password"
                  id="login-password"
                  label="Password"
                  onChange={setLoginPassword}
                  placeholder="Password1"
                  type="password"
                  value={loginPassword}
                />
                <button
                  className="w-full bg-nyraRed py-5 text-xs font-bold uppercase tracking-[0.2em] text-white shadow-lg shadow-red-900/20 transition-colors hover:bg-red-700 disabled:opacity-60"
                  disabled={loading}
                  type="submit"
                >
                  {loading ? "Signing in..." : "Secure Login"}
                </button>
              </form>
            </div>
          ) : (
            <div className="auth-panel-motion">
              <header className="mb-6 sm:mb-8">
                <h2 className="mb-3 font-serif text-4xl text-nyraDark">Join the Circuit</h2>
                <p className="font-light text-gray-600">
                  Register for official tournament participation.
                </p>
              </header>

              <form className="space-y-4" onSubmit={handleRegister}>
                <Field
                  autoComplete="name"
                  compact
                  id="register-full-name"
                  label="Full Name"
                  onChange={setFullName}
                  placeholder="Julian Sterling"
                  value={fullName}
                />
                <Field
                  autoComplete="email"
                  compact
                  id="register-email"
                  label="Email Address"
                  onChange={setRegisterEmail}
                  placeholder="sterling@stable.com"
                  type="email"
                  value={registerEmail}
                />
                <Field
                  autoComplete="tel"
                  compact
                  id="register-phone"
                  label="Phone Number"
                  onChange={setPhone}
                  placeholder="0901234567"
                  value={phone}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    autoComplete="new-password"
                    compact
                    id="register-password"
                    label="Password"
                    onChange={setRegisterPassword}
                    placeholder="Password1"
                    type="password"
                    value={registerPassword}
                  />
                  <Field
                    autoComplete="new-password"
                    compact
                    id="register-confirm-password"
                    label="Confirm Password"
                    onChange={setConfirmPassword}
                    placeholder="Password1"
                    type="password"
                    value={confirmPassword}
                  />
                </div>
                <div className="flex items-start gap-3 py-2">
                  <input
                    checked={acceptedTerms}
                    className="mt-1 h-4 w-4 rounded-sm border-gray-300 text-nyraGreen focus:ring-nyraGreen"
                    id="terms"
                    onChange={(event) => setAcceptedTerms(event.target.checked)}
                    type="checkbox"
                  />
                  <label className="text-[12px] font-light leading-relaxed text-gray-500" htmlFor="terms">
                    I agree to the <span className="font-bold text-nyraGreen underline">Tournament Rules</span> and
                    official participation policies.
                  </label>
                </div>
                <button
                  className="w-full bg-nyraDark py-5 text-xs font-bold uppercase tracking-[0.2em] text-white shadow-lg transition-colors hover:bg-black disabled:opacity-60"
                  disabled={loading}
                  type="submit"
                >
                  {loading ? "Creating account..." : "Create Account"}
                </button>
              </form>
            </div>
          )}

          <footer className={`flex flex-col gap-4 border-t border-gray-100 pt-8 ${isLogin ? "mt-16" : "mt-10"}`}>
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
              <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">2026 EquinePro Elite</span>
            </div>
          </footer>
        </div>
      </section>
    </div>
  );
}
