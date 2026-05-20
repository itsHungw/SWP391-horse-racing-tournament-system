import { useEffect, useState } from "react";
import { StatusBadge } from "../components/StatusBadge";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { RoleRequest } from "../types/adminRoleRequest";
import { getRoleRequests, approveRequest, rejectRequest } from "../api/adminRoleRequestApi";
import { AdminRoleRequestsPage } from "./admin/AdminRoleRequestsPage";
import { AdminRoleRequestDetailPage } from "./admin/AdminRoleRequestDetailPage";
import { RejectModal } from "../components/RejectModal";

// Dữ liệu Mock dự phòng khi API chưa chạy
const fallbackMockData: RoleRequest[] = [
  {
    id: 1,
    userId: 101,
    fullName: "Nguyễn Văn A",
    email: "vana@gmail.com",
    requestedRole: "JOCKEY",
    status: "PENDING",
    reason: "Tôi đã có 3 năm kinh nghiệm huấn luyện và điều khiển ngựa đua.",
    evidenceUrl: "https://example.com/cert-vana",
    createdAt: "2026-05-20T10:00:00",
  },
  {
    id: 2,
    userId: 102,
    fullName: "Trần Thị B",
    email: "thib@gmail.com",
    requestedRole: "OWNER",
    status: "APPROVED",
    reason: "Sở hữu trang trại nuôi ngựa đua đạt tiêu chuẩn quốc tế.",
    evidenceUrl: "https://example.com/cert-thib",
    createdAt: "2026-05-19T14:30:00",
  },
  {
    id: 3,
    userId: 103,
    fullName: "Lê Hoàng C",
    email: "hoangc@gmail.com",
    requestedRole: "REFEREE",
    status: "REJECTED",
    reason: "Muốn xin làm trọng tài chấm điểm các chặng đua.",
    adminNote: "Hồ sơ đính kèm không hợp lệ hoặc thiếu chứng nhận trọng tài.",
    createdAt: "2026-05-18T09:15:00",
  },
];

type RoleDashboardPageProps = {
  role: "Spectator" | "Owner" | "Jockey" | "Referee" | "Admin";
};

export function RoleDashboardPage({ role }: RoleDashboardPageProps) {
  useDocumentTitle(`${role} dashboard`);

  // Local state for admin view
  const [requests, setRequests] = useState<RoleRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("PENDING");
  const [currentView, setCurrentView] = useState<"LIST" | "DETAIL">("LIST");
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
  
  // Modals & forms
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Custom Toast notifications
  const [toast, setToast] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToast({ text, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getRoleRequests(selectedStatus === "ALL" ? undefined : selectedStatus);
      if (!Array.isArray(data)) {
        throw new Error("Dữ liệu trả về từ API không phải là một mảng.");
      }
      setRequests(data);
    } catch (err) {
      console.warn("API thật chưa sẵn sàng hoặc dữ liệu lỗi, sử dụng Mock Data dự phòng:", err);
      // Sử dụng mock data dự phòng kết hợp filter
      const mockFiltered = fallbackMockData.filter(
        (req) => selectedStatus === "ALL" || req.status === selectedStatus
      );
      setRequests(mockFiltered);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role === "Admin") {
      fetchData();
    }
  }, [role, selectedStatus]);

  const handleApprove = async () => {
    if (selectedRequestId === null) return;
    setProcessing(true);
    try {
      await approveRequest(selectedRequestId);
      showToast("Đã phê duyệt vai trò thành công!");
    } catch (err) {
      console.warn("API thật lỗi, tự động cập nhật Mock Data nội bộ:", err);
      const req = fallbackMockData.find((r) => r.id === selectedRequestId);
      if (req) {
        req.status = "APPROVED";
      }
      showToast("Phê duyệt thành công (Mock)!");
    } finally {
      setProcessing(false);
      setCurrentView("LIST");
      setSelectedRequestId(null);
      fetchData();
    }
  };

  const handleRejectConfirm = async (reason: string) => {
    if (selectedRequestId === null) return;
    setProcessing(true);
    try {
      await rejectRequest(selectedRequestId, reason);
      showToast("Đã từ chối yêu cầu thành công.");
    } catch (err) {
      console.warn("API thật lỗi, tự động từ chối Mock Data nội bộ:", err);
      const req = fallbackMockData.find((r) => r.id === selectedRequestId);
      if (req) {
        req.status = "REJECTED";
        req.adminNote = reason;
      }
      showToast("Từ chối thành công (Mock)!");
    } finally {
      setProcessing(false);
      setIsRejectOpen(false);
      setCurrentView("LIST");
      setSelectedRequestId(null);
      fetchData();
    }
  };

  const activeRequest = requests.find((r) => r.id === selectedRequestId);

  if (role === "Admin") {
    return (
      <div className="space-y-6 relative">
        {/* Custom Toast Alert */}
        {toast && (
          <div className="fixed top-4 right-4 z-50 flex items-center rounded-lg border border-slate-100 bg-white px-4 py-3 shadow-lg transition-all animate-bounce">
            <span
              className={`mr-2 h-2.5 w-2.5 rounded-full ${
                toast.type === "success" ? "bg-emerald-500" : "bg-rose-500"
              }`}
            />
            <p className="text-sm font-medium text-slate-800">{toast.text}</p>
          </div>
        )}

        <section aria-labelledby="role-dashboard-title" className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4">
            <StatusBadge tone="ready">Đã kích hoạt Flow Admin</StatusBadge>
          </div>

          {currentView === "LIST" ? (
            <AdminRoleRequestsPage
              requests={requests}
              loading={loading}
              selectedStatus={selectedStatus}
              onStatusChange={setSelectedStatus}
              onViewDetail={(id) => {
                setSelectedRequestId(id);
                setCurrentView("DETAIL");
              }}
              onRefresh={fetchData}
            />
          ) : (
            activeRequest && (
              <AdminRoleRequestDetailPage
                request={activeRequest}
                onApprove={handleApprove}
                onReject={() => setIsRejectOpen(true)}
                onBack={() => {
                  setCurrentView("LIST");
                  setSelectedRequestId(null);
                }}
                processing={processing}
              />
            )
          )}
        </section>

        {/* Modal nhập lý do khi từ chối */}
        <RejectModal
          isOpen={isRejectOpen}
          onClose={() => setIsRejectOpen(false)}
          onConfirm={handleRejectConfirm}
          isSubmitting={processing}
        />
      </div>
    );
  }

  return (
    <section aria-labelledby="role-dashboard-title" className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <StatusBadge tone="draft">Route placeholder</StatusBadge>
      <h2 id="role-dashboard-title" className="mt-4 text-2xl font-semibold">
        {role} dashboard
      </h2>
      <p className="mt-3 max-w-2xl text-slate-700">
        This route is reserved for the {role.toLowerCase()} workflow.
      </p>
    </section>
  );
}
