import { RoleRequest } from "../../types/adminRoleRequest";
import { RoleRequestStatusBadge } from "../../components/RoleRequestStatusBadge";

type Props = {
  requests: RoleRequest[];
  loading: boolean;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  onViewDetail: (id: number) => void;
  onRefresh: () => void;
};

export function AdminRoleRequestsPage({
  requests,
  loading,
  selectedStatus,
  onStatusChange,
  onViewDetail,
  onRefresh,
}: Props) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Danh sách yêu cầu nâng cấp vai trò</h2>
          <p className="text-sm text-slate-500 mt-1">Duyệt hồ sơ xin quyền nài ngựa, trọng tài, chủ sở hữu.</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            id="status-filter"
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-emerald-500 focus:outline-none"
            aria-label="Lọc theo trạng thái"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="PENDING">Chờ duyệt</option>
            <option value="APPROVED">Đã duyệt</option>
            <option value="REJECTED">Đã từ chối</option>
          </select>
          <button
            onClick={onRefresh}
            className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none cursor-pointer"
          >
            Tải lại
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <p className="text-slate-500 text-sm animate-pulse">Đang tải dữ liệu...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-slate-200 rounded-lg bg-slate-50">
          <p className="text-slate-500 text-sm">Không có yêu cầu nâng cấp nào được tìm thấy.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3">Người gửi</th>
                <th className="px-6 py-3">Vai trò yêu cầu</th>
                <th className="px-6 py-3">Trạng thái</th>
                <th className="px-6 py-3">Ngày gửi</th>
                <th className="px-6 py-3 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {requests.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{req.fullName}</div>
                    <div className="text-xs text-slate-500">{req.email}</div>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs">{req.requestedRole}</td>
                  <td className="px-6 py-4">
                    <RoleRequestStatusBadge status={req.status} />
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">
                    {new Date(req.createdAt).toLocaleDateString("vi-VN", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => onViewDetail(req.id)}
                      className="inline-flex items-center rounded-md bg-white px-3 py-1.5 text-xs font-medium text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:outline-none cursor-pointer"
                    >
                      Xem chi tiết
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
