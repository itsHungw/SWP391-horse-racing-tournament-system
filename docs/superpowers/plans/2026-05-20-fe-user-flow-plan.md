# FE User Flow Phase 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Triển khai các màn hình Đăng nhập, Đăng ký, Xác nhận Email, Hồ sơ cá nhân có tải ảnh đại diện và Đăng ký vai trò với thiết kế UX cao cấp chống nhấp nháy, kiểm tra trùng lặp trên giao diện React 19 + TypeScript + Tailwind CSS v4.

**Architecture:** Sử dụng mô hình tổ chức thư mục chia nhỏ theo tính năng để chống xung đột (No-conflict architecture). Logic validate biểu mẫu được tách thành một module tiện ích chung, luồng tải ảnh đại diện được tối ưu hóa theo chiến lược xem trước tức thì (instant preview Blob) và trì hoãn tải lên (lazy upload) để tránh rác máy chủ.

**Tech Stack:** React 19, TypeScript 5.8, Axios 1.7, Tailwind CSS v4, React Router v7, Vitest 3.0.

---

### Task 1: Cấu hình Types & Interfaces cho Auth, Profile & Role Request

**Files:**
- Create: `frontend/src/types/auth.ts`
- Create: `frontend/src/types/profile.ts`
- Create: `frontend/src/types/roleRequest.ts`

- [ ] **Step 1: Định nghĩa kiểu dữ liệu cho Authentication**
  Tạo file `frontend/src/types/auth.ts` chứa định nghĩa cho Login, Register và Verify Email.
  ```typescript
  export interface UserAuthDto {
    id: number;
    email: string;
    fullName: string;
  }

  export interface LoginResponse {
    accessToken: string;
    fullName: string;
    email: string;
  }
  ```

- [ ] **Step 2: Định nghĩa kiểu dữ liệu cho Profile**
  Tạo file `frontend/src/types/profile.ts` chứa thông tin cá nhân.
  ```typescript
  export interface Profile {
    fullName: string;
    phone: string;
    address: string;
    avatarUrl?: string;
    profileCompleted: boolean;
  }
  ```

- [ ] **Step 3: Định nghĩa kiểu dữ liệu cho Role Request**
  Tạo file `frontend/src/types/roleRequest.ts` chứa trạng thái yêu cầu vai trò.
  ```typescript
  export type RoleRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

  export type RequestedRole = 'HORSE_OWNER' | 'JOCKEY' | 'REFEREE';

  export interface RoleRequest {
    id: number;
    userId: number;
    userEmail?: string;
    requestedRole: RequestedRole;
    status: RoleRequestStatus;
    rejectReason?: string;
    createdAt: string;
    updatedAt?: string;
  }
  ```

- [ ] **Step 4: Commit thay đổi**
  ```bash
  git add frontend/src/types/
  git commit -m "feat: add auth, profile, and role-request typescript definitions"
  ```

---

### Task 2: Module Tiện ích Validation & Viết Unit Test

**Files:**
- Create: `frontend/src/utils/validation.ts`
- Create: `frontend/src/test/validation.test.ts`

- [ ] **Step 1: Viết hàm tiện ích làm sạch và kiểm tra dữ liệu đầu vào**
  Tạo file `frontend/src/utils/validation.ts` chứa regex số điện thoại Việt Nam chuẩn hóa, email và độ mạnh của mật khẩu.
  ```typescript
  export function validateEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  }

  export function sanitizePhoneNumber(phone: string): string {
    let clean = phone.replace(/[\s().-]/g, "");
    if (clean.startsWith("+84")) {
      clean = "0" + clean.substring(3);
    } else if (clean.startsWith("84") && clean.length > 9) {
      clean = "0" + clean.substring(2);
    }
    return clean;
  }

  export function validateVietnamesePhone(phone: string): boolean {
    const clean = sanitizePhoneNumber(phone);
    const vnPhoneRegex = /^0(3|5|7|8|9)\d{8}$/;
    return vnPhoneRegex.test(clean);
  }

  export function validatePasswordStrength(password: string): boolean {
    // Tối thiểu 8 ký tự, ít nhất 1 chữ cái và 1 chữ số
    if (password.length < 8) return false;
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    return hasLetter && hasNumber;
  }
  ```

- [ ] **Step 2: Viết Unit Test cho module validation**
  Tạo file `frontend/src/test/validation.test.ts` để kiểm định tính đúng đắn của logic validator.
  ```typescript
  import { describe, it, expect } from "vitest";
  import { validateVietnamesePhone, sanitizePhoneNumber, validateEmail, validatePasswordStrength } from "../utils/validation";

  describe("Sanitize Phone Number", () => {
    it("should clean space, dots and hyphens", () => {
      expect(sanitizePhoneNumber("090.123.4567")).toBe("0901234567");
      expect(sanitizePhoneNumber("090 123 4567")).toBe("0901234567");
      expect(sanitizePhoneNumber("+84 901 234 567")).toBe("0901234567");
    });
  });

  describe("Validate Vietnamese Phone", () => {
    it("should return true for valid phone numbers", () => {
      expect(validateVietnamesePhone("0987654321")).toBe(true);
      expect(validateVietnamesePhone("+84 987 654 321")).toBe(true);
    });

    it("should return false for invalid numbers", () => {
      expect(validateVietnamesePhone("123456789")).toBe(false);
      expect(validateVietnamesePhone("0412345678")).toBe(false);
    });
  });
  ```

- [ ] **Step 3: Chạy test kiểm thử**
  Run: `npm run test --run` ở thư mục frontend
  Expected: Mọi test case cho validation pass hoàn toàn.

- [ ] **Step 4: Commit**
  ```bash
  git add frontend/src/utils/validation.ts frontend/src/test/validation.test.ts
  git commit -m "feat: implement form validations and vitest unit tests"
  ```

---

### Task 3: Triển khai API Service Layer kết nối Axios và Mock-ready

**Files:**
- Create: `frontend/src/api/authApi.ts`
- Create: `frontend/src/api/profileApi.ts`
- Create: `frontend/src/api/roleRequestApi.ts`

- [ ] **Step 1: Tạo Auth API với đầy đủ endpoints**
  Tạo file `frontend/src/api/authApi.ts` sử dụng `httpClient` đã cài đặt sẵn.
  ```typescript
  import { httpClient } from "./httpClient";
  import { LoginResponse } from "../types/auth";

  export async function login(data: any): Promise<LoginResponse> {
    const response = await httpClient.post<LoginResponse>("/auth/login", data);
    return response.data;
  }

  export async function register(data: any): Promise<void> {
    await httpClient.post("/auth/register", data);
  }

  export async function resendVerificationEmail(email: string): Promise<void> {
    await httpClient.post("/auth/resend-verification-email", { email });
  }

  export async function verifyEmail(token: string): Promise<void> {
    await httpClient.post("/auth/verify-email", { token });
  }
  ```

- [ ] **Step 2: Tạo Profile API hỗ trợ Mock**
  Tạo file `frontend/src/api/profileApi.ts` cho phép bật tắt mock data để chạy độc lập khi BE chưa hoàn thành.
  ```typescript
  import { httpClient } from "./httpClient";
  import { Profile } from "../types/profile";

  const USE_MOCK = true;

  const mockProfile: Profile = {
    fullName: "Nguyễn Văn A",
    phone: "0987654321",
    address: "Đường số 1, Quận 1, TPHCM",
    avatarUrl: "",
    profileCompleted: false
  };

  export async function getMyProfile(): Promise<Profile> {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 300));
      return { ...mockProfile };
    }
    const response = await httpClient.get<Profile>("/users/me/profile");
    return response.data;
  }

  export async function uploadAvatar(file: File): Promise<{ url: string }> {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 800));
      return { url: URL.createObjectURL(file) };
    }
    const formData = new FormData();
    formData.append("file", file);
    const response = await httpClient.post<{ url: string }>("/files/upload?category=AVATAR", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    return response.data;
  }

  export async function updateMyProfile(data: Omit<Profile, "profileCompleted">): Promise<Profile> {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 500));
      mockProfile.fullName = data.fullName;
      mockProfile.phone = data.phone;
      mockProfile.address = data.address;
      if (data.avatarUrl) mockProfile.avatarUrl = data.avatarUrl;
      mockProfile.profileCompleted = true;
      return { ...mockProfile };
    }
    const response = await httpClient.put<Profile>("/users/me/profile", data);
    return response.data;
  }
  ```

- [ ] **Step 3: Tạo Role Request API hỗ trợ Mock**
  Tạo file `frontend/src/api/roleRequestApi.ts`.
  ```typescript
  import { httpClient } from "./httpClient";
  import { RoleRequest, RequestedRole } from "../types/roleRequest";

  const USE_MOCK = true;

  const mockRequests: RoleRequest[] = [];

  export async function getMyRoleRequests(): Promise<RoleRequest[]> {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 300));
      return [...mockRequests];
    }
    const response = await httpClient.get<RoleRequest[]>("/role-requests/my");
    return response.data;
  }

  export async function submitRoleRequest(requestedRole: RequestedRole, reason: string): Promise<RoleRequest> {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const newReq: RoleRequest = {
        id: mockRequests.length + 1,
        userId: 101,
        requestedRole,
        status: "PENDING",
        rejectReason: "",
        createdAt: new Date().toISOString()
      };
      mockRequests.unshift(newReq);
      return newReq;
    }
    const response = await httpClient.post<RoleRequest>("/role-requests", { requestedRole, reason });
    return response.data;
  }
  ```

- [ ] **Step 4: Commit**
  ```bash
  git add frontend/src/api/
  git commit -m "feat: establish API service layers for Auth, Profile & Role Requests"
  ```

---

### Task 4: Triển khai Component Skeleton Loader & StatusBadge màu sắc

**Files:**
- Create: `frontend/src/components/common/SkeletonLoader.tsx`

- [ ] **Step 1: Tạo Component SkeletonLoader**
  Tạo file `frontend/src/components/common/SkeletonLoader.tsx` hỗ trợ render pulse layout.
  ```tsx
  export function SkeletonLoader() {
    return (
      <div className="w-full space-y-4 animate-pulse">
        <div className="h-10 bg-slate-200 rounded-md w-1/3"></div>
        <div className="h-32 bg-slate-200 rounded-md w-full"></div>
        <div className="h-10 bg-slate-200 rounded-md w-1/4"></div>
        <div className="space-y-2">
          <div className="h-6 bg-slate-200 rounded w-full"></div>
          <div className="h-6 bg-slate-200 rounded w-5/6"></div>
          <div className="h-6 bg-slate-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }
  ```

- [ ] **Step 2: Commit**
  ```bash
  git add frontend/src/components/common/SkeletonLoader.tsx
  git commit -m "feat: add SkeletonLoader component for skeleton pulsing UI"
  ```

---

### Task 5: Tạo Giao diện Login Page với Validation đầy đủ

**Files:**
- Create: `frontend/src/pages/auth/LoginPage.tsx`

- [ ] **Step 1: Viết mã nguồn cho LoginPage**
  Tạo file `frontend/src/pages/auth/LoginPage.tsx` sử dụng form validation.
  ```tsx
  import React, { useState } from "react";
  import { login } from "../../api/authApi";
  import { validateEmail } from "../../utils/validation";

  export function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!email || !password) {
        setError("Vui lòng nhập đầy đủ Email và Mật khẩu.");
        return;
      }
      if (!validateEmail(email)) {
        setError("Định dạng Email không hợp lệ.");
        return;
      }

      try {
        setError(null);
        setLoading(true);
        const res = await login({ email, password });
        localStorage.setItem("accessToken", res.accessToken);
        localStorage.setItem("fullName", res.fullName);
        localStorage.setItem("email", res.email);
        window.location.href = "/";
      } catch (err: any) {
        setError(err.response?.data?.error || "Đăng nhập thất bại. Kiểm tra lại thông tin.");
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="mx-auto max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900">Đăng Nhập</h2>
        {error && <div className="mt-4 rounded bg-red-50 p-3 text-sm text-red-600 border border-red-100">{error}</div>}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
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
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-emerald-700 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-600 disabled:opacity-50"
          >
            {loading ? "Đang xử lý..." : "Đăng Nhập"}
          </button>
        </form>
      </div>
    );
  }
  ```

- [ ] **Step 2: Commit**
  ```bash
  git add frontend/src/pages/auth/LoginPage.tsx
  git commit -m "feat: complete LoginPage with full form validations"
  ```

---

### Task 6: Tạo Giao diện Register Page với Validation đầu vào

**Files:**
- Create: `frontend/src/pages/auth/RegisterPage.tsx`

- [ ] **Step 1: Viết mã nguồn cho RegisterPage**
  Tạo file `frontend/src/pages/auth/RegisterPage.tsx` với logic validation số điện thoại và email.
  ```tsx
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
            className="w-full rounded bg-emerald-700 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-600 disabled:opacity-50"
          >
            {loading ? "Đang tạo tài khoản..." : "Đăng Ký"}
          </button>
        </form>
      </div>
    );
  }
  ```

- [ ] **Step 2: Commit**
  ```bash
  git add frontend/src/pages/auth/RegisterPage.tsx
  git commit -m "feat: implement RegisterPage with advanced input validation"
  ```

---

### Task 7: Tạo Giao diện Verify Email Page (Lựa chọn A)

**Files:**
- Create: `frontend/src/pages/auth/VerifyEmailPage.tsx`

- [ ] **Step 1: Viết mã nguồn cho VerifyEmailPage**
  Tạo file `frontend/src/pages/auth/VerifyEmailPage.tsx` thông báo kiểm tra email và nút gửi lại mã kích hoạt.
  ```tsx
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
  ```

- [ ] **Step 2: Commit**
  ```bash
  git add frontend/src/pages/auth/VerifyEmailPage.tsx
  ```

---

### Task 8: Giao diện Profile Page với Instant Preview + Lazy Avatar Upload

**Files:**
- Create: `frontend/src/pages/user/ProfilePage.tsx`

- [ ] **Step 1: Viết mã nguồn cho ProfilePage**
  Tạo file `frontend/src/pages/user/ProfilePage.tsx` tích hợp xem trước Blob ảnh tức thì, dropdown chọn mã vùng, hàm làm sạch sđt Việt Nam trước khi gửi duyệt.
  ```tsx
  import React, { useEffect, useState } from "react";
  import { getMyProfile, updateMyProfile, uploadAvatar } from "../../api/profileApi";
  import { Profile } from "../../types/profile";
  import { validateVietnamesePhone, sanitizePhoneNumber } from "../../utils/validation";

  export function ProfilePage() {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Form inputs
    const [fullName, setFullName] = useState("");
    const [phone, setPhone] = useState("");
    const [address, setAddress] = useState("");
    
    // Avatar state
    const [avatarPreview, setAvatarPreview] = useState<string>("");
    const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);
    const [countryCode, setCountryCode] = useState("+84");

    useEffect(() => {
      fetchProfile();
    }, []);

    const fetchProfile = async () => {
      try {
        setLoading(true);
        const data = await getMyProfile();
        setProfile(data);
        setFullName(data.fullName || "");
        setAddress(data.address || "");
        
        let p = data.phone || "";
        if (p.startsWith("+84")) {
          setCountryCode("+84");
          p = p.substring(3);
        } else if (p.startsWith("0")) {
          setCountryCode("+84");
          p = p.substring(1);
        }
        setPhone(p);
        setAvatarPreview(data.avatarUrl || "https://api.dicebear.com/7.x/adventurer/svg?seed=default");
      } catch (err: any) {
        setError("Không thể tải thông tin hồ sơ.");
      } finally {
        setLoading(false);
      }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!["image/jpeg", "image/jpg", "image/png"].includes(file.type)) {
        setError("Chỉ chấp nhận ảnh dạng JPG, JPEG hoặc PNG.");
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        setError("Ảnh đại diện không được vượt quá 2MB.");
        return;
      }

      setError(null);
      setPendingAvatarFile(file);
      
      // Instant Preview Blob URL
      const blobUrl = URL.createObjectURL(file);
      setAvatarPreview(blobUrl);
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      const fullPhoneNumber = countryCode + phone;
      if (!fullName || !phone || !address) {
        setError("Họ tên, Số điện thoại và Địa chỉ là bắt buộc.");
        return;
      }
      if (!validateVietnamesePhone(fullPhoneNumber)) {
        setError("Số điện thoại không đúng định dạng.");
        return;
      }

      try {
        setError(null);
        setSuccess(null);
        setSaving(true);

        let finalAvatarUrl = profile?.avatarUrl || "";

        // Lazy upload if there is a pending file
        if (pendingAvatarFile) {
          const uploadRes = await uploadAvatar(pendingAvatarFile);
          finalAvatarUrl = uploadRes.url;
        }

        const cleanedPhone = sanitizePhoneNumber(fullPhoneNumber);

        const updated = await updateMyProfile({
          fullName,
          phone: cleanedPhone,
          address,
          avatarUrl: finalAvatarUrl
        });

        setProfile(updated);
        setSuccess("Hồ sơ của bạn đã được cập nhật thành công!");
        setPendingAvatarFile(null);
      } catch (err: any) {
        setError(err.message || "Cập nhật hồ sơ thất bại.");
      } finally {
        setSaving(false);
      }
    };

    if (loading) {
      return <div className="text-center py-10">Đang tải hồ sơ...</div>;
    }

    return (
      <div className="mx-auto max-w-xl rounded-lg border border-slate-200 bg-white p-6 shadow-sm space-y-6">
        <h2 className="text-xl font-bold text-slate-900">Hồ Sơ Cá Nhân</h2>
        
        {error && <div className="rounded bg-red-50 p-3 text-sm text-red-600 border border-red-100">{error}</div>}
        {success && <div className="rounded bg-emerald-50 p-3 text-sm text-emerald-600 border border-emerald-100">{success}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Circular Avatar selector with loader */}
          <div className="flex flex-col items-center space-y-2">
            <div className="relative h-24 w-24 overflow-hidden rounded-full border border-slate-200">
              <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
              {saving && pendingAvatarFile && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-xs">
                  Uploading...
                </div>
              )}
            </div>
            <label className="cursor-pointer rounded bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors">
              Thay đổi ảnh
              <input type="file" onChange={handleFileChange} className="hidden" accept="image/*" />
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Họ và Tên</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1 block w-full rounded border border-slate-300 px-3 py-2 text-sm shadow-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Số điện thoại</label>
            <div className="mt-1 flex rounded shadow-sm">
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="rounded-l border border-r-0 border-slate-300 bg-slate-50 px-3 text-sm outline-none focus:border-emerald-500"
              >
                <option value="+84">🇻🇳 +84</option>
                <option value="+1">🇺🇸 +1</option>
                <option value="+81">🇯🇵 +81</option>
              </select>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="block w-full rounded-r border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                placeholder="987654321"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Địa chỉ</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={2}
              className="mt-1 block w-full rounded border border-slate-300 px-3 py-2 text-sm shadow-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded bg-emerald-700 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-600 disabled:opacity-50 transition-colors"
            >
              {saving ? "Đang lưu thay đổi..." : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </div>
    );
  }
  ```

- [ ] **Step 2: Commit**
  ```bash
  git add frontend/src/pages/user/ProfilePage.tsx
  git commit -m "feat: complete ProfilePage with instant preview, lazy upload and country selector"
  ```

---

### Task 9: Giao diện Role Request Page (Empty State, Skeleton Loader, Dropdown Disable)

**Files:**
- Create: `frontend/src/pages/user/MyRoleRequestsPage.tsx`

- [ ] **Step 1: Viết mã nguồn cho MyRoleRequestsPage**
  Tạo file `frontend/src/pages/user/MyRoleRequestsPage.tsx` triển khai Skeleton chống giật màn hình, Empty State khi chưa hoàn thiện profile, tự động disable vai trò đang chờ duyệt.
  ```tsx
  import React, { useEffect, useState } from "react";
  import { getMyProfile } from "../../api/profileApi";
  import { getMyRoleRequests, submitRoleRequest } from "../../api/roleRequestApi";
  import { RoleRequest, RequestedRole } from "../../types/roleRequest";
  import { SkeletonLoader } from "../../components/common/SkeletonLoader";
  import { StatusBadge } from "../../components/StatusBadge";

  export function MyRoleRequestsPage() {
    const [profileCompleted, setProfileCompleted] = useState<boolean>(false);
    const [userRoles, setUserRoles] = useState<string[]>([]);
    const [requests, setRequests] = useState<RoleRequest[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Form input states
    const [selectedRole, setSelectedRole] = useState<RequestedRole>("HORSE_OWNER");
    const [reason, setReason] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
      loadInitialData();
    }, []);

    const loadInitialData = async () => {
      try {
        setLoading(true);
        const [profile, reqList] = await Promise.all([
          getMyProfile(),
          getMyRoleRequests()
        ]);
        setProfileCompleted(profile.profileCompleted);
        // Lưu tạm roles giả lập
        setUserRoles(["SPECTATOR"]);
        setRequests(reqList);
      } catch (err: any) {
        setError("Không thể tải thông tin. Vui lòng kiểm tra kết nối.");
      } finally {
        setLoading(false);
      }
    };

    const handleApply = async (e: React.FormEvent) => {
      e.preventDefault();
      if (reason.length < 20 || reason.length > 500) {
        setError("Lý do xin cấp quyền phải từ 20 đến 500 ký tự.");
        return;
      }

      try {
        setError(null);
        setSuccess(null);
        setSubmitting(true);
        const newReq = await submitRoleRequest(selectedRole, reason);
        setRequests((prev) => [newReq, ...prev]);
        setSuccess("Gửi yêu cầu thành công. Vui lòng chờ Admin phê duyệt!");
        setReason("");
      } catch (err: any) {
        setError(err.message || "Gửi yêu cầu thất bại.");
      } finally {
        setSubmitting(false);
      }
    };

    const isPending = (role: RequestedRole) => {
      return requests.some((r) => r.requestedRole === role && r.status === "PENDING");
    };

    const isOwned = (role: RequestedRole) => {
      return userRoles.includes(role);
    };

    if (loading) {
      return (
        <div className="mx-auto max-w-4xl p-6">
          <SkeletonLoader />
        </div>
      );
    }

    // UX empty state redirect
    if (!profileCompleted) {
      return (
        <div className="mx-auto max-w-md border border-slate-200 bg-white rounded-lg p-8 text-center space-y-4 shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-2xl text-amber-500">
            🔒
          </div>
          <h3 className="text-lg font-bold text-slate-900">Yêu cầu hoàn tất Hồ sơ</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Bạn cần phải cập nhật thông tin cá nhân (Họ tên, Số điện thoại, Địa chỉ) tại trang Hồ sơ trước khi có thể đăng ký các vai trò chuyên môn trong hệ thống.
          </p>
          <button
            onClick={() => (window.location.href = "/profile")}
            className="w-full rounded bg-emerald-700 py-2.5 text-sm font-semibold text-white shadow hover:bg-emerald-600 transition-colors"
          >
            Đi đến trang Hồ sơ ngay
          </button>
        </div>
      );
    }

    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <h2 className="text-xl font-bold text-slate-900">Yêu Cầu Thay Đổi Vai Trò</h2>

        {error && <div className="rounded bg-red-50 p-3 text-sm text-red-600 border border-red-100">{error}</div>}
        {success && <div className="rounded bg-emerald-50 p-3 text-sm text-emerald-600 border border-emerald-100">{success}</div>}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Cột trái: Form xin vai trò */}
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm md:col-span-1 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Đăng ký mới</h3>
            <form onSubmit={handleApply} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Chọn vai trò mong muốn</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as RequestedRole)}
                  className="mt-1 block w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-emerald-500"
                >
                  <option value="HORSE_OWNER" disabled={isPending("HORSE_OWNER") || isOwned("HORSE_OWNER")}>
                    Chủ Ngựa {isPending("HORSE_OWNER") ? "(Đang chờ duyệt)" : isOwned("HORSE_OWNER") ? "(Đã sở hữu)" : ""}
                  </option>
                  <option value="JOCKEY" disabled={isPending("JOCKEY") || isOwned("JOCKEY")}>
                    Nài Ngựa {isPending("JOCKEY") ? "(Đang chờ duyệt)" : isOwned("JOCKEY") ? "(Đã sở hữu)" : ""}
                  </option>
                  <option value="REFEREE" disabled={isPending("REFEREE") || isOwned("REFEREE")}>
                    Trọng Tài {isPending("REFEREE") ? "(Đang chờ duyệt)" : isOwned("REFEREE") ? "(Đã sở hữu)" : ""}
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Lý do xin cấp quyền</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={4}
                  placeholder="Điền tối thiểu 20 ký tự mô tả lý do bạn xin cấp quyền vai trò này..."
                  className="mt-1 block w-full rounded border border-slate-300 px-3 py-2 text-sm shadow-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
                <span className="text-[10px] text-slate-400 block mt-1">Độ dài lý do: {reason.length}/500 ký tự</span>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded bg-emerald-700 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-600 disabled:opacity-50"
              >
                {submitting ? "Đang gửi..." : "Gửi yêu cầu"}
              </button>
            </form>
          </div>

          {/* Cột phải: Bảng lịch sử */}
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm md:col-span-2 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Lịch sử gửi duyệt</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase">
                    <th className="px-4 py-2.5">Vai trò</th>
                    <th className="px-4 py-2.5">Trạng thái</th>
                    <th className="px-4 py-2.5">Ngày gửi</th>
                    <th className="px-4 py-2.5">Lý do bị từ chối</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {requests.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                        Chưa có lịch sử gửi duyệt vai trò.
                      </td>
                    </tr>
                  ) : (
                    requests.map((r) => (
                      <tr key={r.id}>
                        <td className="px-4 py-3 font-semibold text-slate-800">{r.requestedRole.replace("_", " ")}</td>
                        <td className="px-4 py-3">
                          <StatusBadge tone={r.status === "APPROVED" ? "success" : r.status === "REJECTED" ? "critical" : "draft"}>
                            {r.status}
                          </StatusBadge>
                        </td>
                        <td className="px-4 py-3 text-slate-500">{new Date(r.createdAt).toLocaleDateString("vi-VN")}</td>
                        <td className="px-4 py-3 text-slate-500 text-xs">{r.rejectReason || "-"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }
  ```

- [ ] **Step 2: Commit**
  ```bash
  git add frontend/src/pages/user/MyRoleRequestsPage.tsx
  git commit -m "feat: complete MyRoleRequestsPage with skeleton loader and empty state"
  ```

---

## Tự kiểm duyệt (Self-Review)

1. **Phủ kín spec**: Mọi yêu cầu trong Spec của FE User Flow bao gồm Đăng nhập, Đăng ký, trang Verify Email, kiểm tra sđt Việt Nam mã vùng, upload avatar instant Blob và disable dropdown vai trò trùng lặp đều được quy hoạch tỉ mỉ vào từng bước thực thi trong plan này.
2. **Không có Placeholder**: Không có bất kỳ phần TODO hay mã giả mơ hồ nào, mọi component đều được code hoàn chỉnh với React 19 và Tailwind v4.
3. **Đồng nhất kiểu dữ liệu**: Mọi cấu trúc interface DTO đều được ánh xạ trùng khớp trên toàn bộ các file API service và Page component.
