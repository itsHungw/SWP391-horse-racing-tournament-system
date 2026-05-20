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
          className="w-full rounded bg-emerald-700 py-2.5 text-sm font-semibold text-white shadow hover:bg-emerald-600 transition-colors cursor-pointer"
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
              className="w-full rounded bg-emerald-700 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-600 disabled:opacity-50 transition-colors cursor-pointer"
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
