import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { resendVerificationEmail, verifyEmail } from "../../api/authApi";

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const savedEmail = localStorage.getItem("pendingVerifyEmail") || "your account";
    setEmail(savedEmail);
  }, []);

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      return;
    }

    let isMounted = true;

    const confirmEmail = async () => {
      try {
        setError(null);
        setMessage(null);
        setVerifying(true);
        await verifyEmail(token);

        if (!isMounted) {
          return;
        }

        localStorage.removeItem("pendingVerifyEmail");
        setVerified(true);
        setMessage("Email verified successfully. You can now log in.");
      } catch (err: any) {
        if (!isMounted) {
          return;
        }

        setError(err.response?.data?.error || "Email verification failed. The link may be expired or invalid.");
      } finally {
        if (isMounted) {
          setVerifying(false);
        }
      }
    };

    confirmEmail();

    return () => {
      isMounted = false;
    };
  }, [searchParams]);

  const handleResend = async () => {
    const targetEmail = localStorage.getItem("pendingVerifyEmail");
    if (!targetEmail) {
      setError("We could not find the email for this verification request. Please register or log in again.");
      return;
    }

    try {
      setError(null);
      setSending(true);
      await resendVerificationEmail(targetEmail);
      setMessage("A new verification link has been sent to your inbox.");
    } catch (err: any) {
      setError(err.response?.data?.error || "Could not resend the verification email. Please try again later.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mx-auto max-w-md rounded-sm border border-slate-200 bg-white p-8 text-center shadow-sm">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-xl font-bold text-emerald-700">
        V
      </div>
      <h2 className="mt-5 text-2xl font-black text-slate-950">
        {verified ? "Email Verified" : verifying ? "Verifying Email" : "Verify Your Email"}
      </h2>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        {verifying ? (
          "Please wait while we confirm your account."
        ) : verified ? (
          "Your account is active. Continue to the login page to enter the tournament platform."
        ) : (
          <>
            We sent a verification link to <strong className="text-slate-950">{email}</strong>. Open your inbox and
            follow the link to activate your account.
          </>
        )}
      </p>

      {error && <div className="mt-5 rounded-sm border border-red-100 bg-red-50 p-3 text-xs text-red-700">{error}</div>}
      {message && (
        <div className="mt-5 rounded-sm border border-emerald-100 bg-emerald-50 p-3 text-xs text-emerald-700">
          {message}
        </div>
      )}

      {verified ? (
        <Link
          to="/login"
          className="mt-6 inline-flex w-full items-center justify-center bg-nyraGreen px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-white transition-colors hover:bg-nyraLightGreen"
        >
          Go to Login
        </Link>
      ) : (
        <div className="pt-6">
          <p className="mb-2 text-xs text-slate-500">Did not receive the email?</p>
          <button
            onClick={handleResend}
            disabled={sending || verifying}
            className="rounded-sm bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-200 disabled:opacity-50"
          >
            {sending ? "Sending..." : "Resend verification email"}
          </button>
        </div>
      )}
    </div>
  );
}
