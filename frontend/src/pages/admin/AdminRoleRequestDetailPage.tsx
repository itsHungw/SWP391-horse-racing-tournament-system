import { RoleRequest } from "../../types/adminRoleRequest";
import { RoleRequestStatusBadge } from "../../components/RoleRequestStatusBadge";

type Props = {
  request: RoleRequest;
  onApprove: () => void;
  onReject: () => void;
  onBack: () => void;
  processing: boolean;
};

export function AdminRoleRequestDetailPage({
  request,
  onApprove,
  onReject,
  onBack,
  processing,
}: Props) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none cursor-pointer"
          >
            &larr; Quay lại danh sách
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-500">Mã yêu cầu: #{request.id}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Cột Trái: Thông tin người gửi */}
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h3 className="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-3">
            Thông tin tài khoản
          </h3>
          <div className="space-y-3 text-sm">
            <div>
              <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Họ và tên</span>
              <span className="font-medium text-slate-950">{request.fullName}</span>
            </div>
            <div>
              <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Email liên hệ</span>
              <span className="font-medium text-slate-950">{request.email}</span>
            </div>
            <div>
              <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Mã định danh User</span>
              <span className="font-medium text-slate-950">#{request.userId}</span>
            </div>
            <div>
              <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Trạng thái xử lý</span>
              <div className="mt-1">
                <RoleRequestStatusBadge status={request.status} />
              </div>
            </div>
          </div>
        </div>

        {/* Cột Phải: Thông tin nâng cấp */}
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h3 className="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-3">
            Hồ sơ nâng cấp vai trò
          </h3>
          <div className="space-y-3 text-sm">
            <div>
              <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Vai trò đăng ký</span>
              <span className="font-mono font-bold text-slate-950">{request.requestedRole}</span>
            </div>
            <div>
              <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Lý do xin nâng cấp</span>
              <p className="mt-1 rounded bg-slate-50 p-3 text-slate-700 border border-slate-100">
                {request.reason || "Không cung cấp lý do."}
              </p>
            </div>
            {request.evidenceUrl && (
              <div>
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Bằng chứng / Chứng chỉ</span>
                <a
                  href={request.evidenceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center text-emerald-600 hover:text-emerald-700 font-medium break-all"
                >
                  {request.evidenceUrl} &rarr;
                </a>
              </div>
            )}
            {request.adminNote && (
              <div>
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Ghi chú của Admin</span>
                <p className="mt-1 rounded bg-rose-50/70 p-3 text-rose-800 border border-rose-100">
                  {request.adminNote}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {request.status === "PENDING" && (
        <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
          <button
            onClick={onReject}
            disabled={processing}
            className="rounded-md bg-rose-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-rose-700 focus:outline-none cursor-pointer"
          >
            Từ chối yêu cầu
          </button>
          <button
            onClick={onApprove}
            disabled={processing}
            className="rounded-md bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 focus:outline-none cursor-pointer"
          >
            {processing ? "Đang xử lý..." : "Phê duyệt quyền"}
          </button>
        </div>
      )}
    </div>
  );
}
