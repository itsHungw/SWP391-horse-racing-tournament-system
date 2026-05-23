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
    return <div className="text-center py-10 text-slate-600">Đang tải hồ sơ...</div>;
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
