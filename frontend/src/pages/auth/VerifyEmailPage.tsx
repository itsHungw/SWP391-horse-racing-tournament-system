import { useState, useEffect } from "react";
import { resendVerificationEmail } from "../../api/authApi";

export function VerifyEmailPage() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const savedEmail = localStorage.getItem("pendingVerifyEmail") || "tài khoản của bạn";
    setEmail(savedEmail);
  }, []);

  const handleResend = async () => {
    const targetEmail = localStorage.getItem("pendingVerifyEmail");
    if (!targetEmail) {
      setError("Không tìm thấy thông tin email. Vui lòng thử lại sau.");
      return;
    }

    try {
      setError(null);
      setSending(true);
      await resendVerificationEmail(targetEmail);
      setMessage("Một liên kết kích hoạt mới đã được gửi vào hộp thư của bạn.");
    } catch (err: any) {
      setError(err.response?.data?.error || "Gửi lại email thất bại. Thử lại sau.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mx-auto max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm text-center space-y-4">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-2xl text-emerald-600 font-bold">
        ✉
      </div>
      <h2 className="text-xl font-bold text-slate-900">Xác thực Email của bạn</h2>
      <p className="text-sm text-slate-600">
        Chúng tôi đã gửi link kích hoạt đến email <strong className="text-slate-900">{email}</strong>. Vui lòng mở hộp thư và nhấn vào đường dẫn để kích hoạt tài khoản.
      </p>
      {error && <div className="rounded bg-red-50 p-2.5 text-xs text-red-600 border border-red-100">{error}</div>}
      {message && <div className="rounded bg-emerald-50 p-2.5 text-xs text-emerald-600 border border-emerald-100">{message}</div>}
      
      <div className="pt-2">
        <p className="text-xs text-slate-500 mb-2">Chưa nhận được email?</p>
        <button
          onClick={handleResend}
          disabled={sending}
          className="rounded bg-slate-100 hover:bg-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 disabled:opacity-50 transition-colors"
        >
          {sending ? "Đang gửi..." : "Gửi lại Email xác nhận"}
        </button>
      </div>
    </div>
  );
}
