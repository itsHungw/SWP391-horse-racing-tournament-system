import React, { useState } from "react";
import { register } from "../../api/authApi";
import { validateEmail, validateVietnamesePhone, validatePasswordStrength } from "../../utils/validation";

export function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password || !phone) {
      setError("Vui lòng điền đầy đủ mọi thông tin.");
      return;
    }
    if (!validateEmail(email)) {
      setError("Email không đúng định dạng.");
      return;
    }
    if (!validatePasswordStrength(password)) {
      setError("Mật khẩu phải tối thiểu 8 ký tự, bao gồm cả chữ và số.");
      return;
    }
    if (!validateVietnamesePhone(phone)) {
      setError("Số điện thoại không hợp lệ (Phải là số điện thoại Việt Nam).");
      return;
    }

    try {
      setError(null);
      setLoading(true);
      await register({ fullName, email, password, phone });
      localStorage.setItem("pendingVerifyEmail", email);
      window.location.href = "/verify-email";
    } catch (err: any) {
      setError(err.response?.data?.error || "Đăng ký không thành công. Hãy thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-bold text-slate-900">Đăng Ký Tài Khoản</h2>
      {error && <div className="mt-4 rounded bg-red-50 p-3 text-sm text-red-600 border border-red-100">{error}</div>}
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">Họ và Tên</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="mt-1 block w-full rounded border border-slate-300 px-3 py-2 text-sm shadow-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            placeholder="Nguyễn Văn A"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full rounded border border-slate-300 px-3 py-2 text-sm shadow-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            placeholder="example@gmail.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Mật khẩu</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full rounded border border-slate-300 px-3 py-2 text-sm shadow-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            placeholder="Tối thiểu 8 ký tự, có chữ và số"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Số điện thoại</label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1 block w-full rounded border border-slate-300 px-3 py-2 text-sm shadow-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            placeholder="0901234567"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-emerald-700 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-600 disabled:opacity-50 transition-colors"
        >
          {loading ? "Đang tạo tài khoản..." : "Đăng Ký"}
        </button>
      </form>
    </div>
  );
}
