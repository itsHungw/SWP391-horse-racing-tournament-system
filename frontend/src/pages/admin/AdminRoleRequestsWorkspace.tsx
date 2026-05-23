import { useEffect, useState } from "react";

import { approveRequest, getRoleRequests, rejectRequest } from "../../api/adminRoleRequestApi";
import { RejectModal } from "../../components/RejectModal";
import { AdminLayout } from "../../layouts/AdminLayout";
import { RoleRequest } from "../../types/adminRoleRequest";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { AdminRoleRequestDetailPage } from "./AdminRoleRequestDetailPage";
import { AdminRoleRequestsPage } from "./AdminRoleRequestsPage";

const fallbackMockData: RoleRequest[] = [
  {
    id: 1,
    userId: 101,
    fullName: "Nguyen Van A",
    email: "vana@gmail.com",
    requestedRole: "JOCKEY",
    status: "PENDING",
    reason: "I have three years of horse training and race riding experience.",
    evidenceUrl: "https://example.com/cert-vana",
    createdAt: "2026-05-20T10:00:00",
    user: {
      id: 101,
      fullName: "Nguyen Van A",
      email: "vana@gmail.com",
      phone: "0901000101",
      dateOfBirth: "1998-03-12",
      gender: "MALE",
      address: "District 7, Ho Chi Minh City",
      status: "ACTIVE",
      emailVerified: true,
      phoneVerified: true,
      ageVerified: true,
      profileCompleted: true,
      roles: ["SPECTATOR"],
      createdAt: "2026-05-05T08:30:00",
      lastLoginAt: "2026-05-22T09:45:00",
    },
  },
  {
    id: 2,
    userId: 102,
    fullName: "Tran Thi B",
    email: "thib@gmail.com",
    requestedRole: "OWNER",
    status: "APPROVED",
    reason: "I operate a racing stable and want to register owner workflows.",
    evidenceUrl: "https://example.com/cert-thib",
    createdAt: "2026-05-19T14:30:00",
    user: {
      id: 102,
      fullName: "Tran Thi B",
      email: "thib@gmail.com",
      phone: "0902000202",
      dateOfBirth: "1992-11-24",
      gender: "FEMALE",
      address: "Thu Duc City, Ho Chi Minh City",
      status: "ACTIVE",
      emailVerified: true,
      phoneVerified: false,
      ageVerified: true,
      profileCompleted: true,
      roles: ["SPECTATOR", "OWNER"],
      createdAt: "2026-04-28T11:00:00",
      lastLoginAt: "2026-05-21T17:10:00",
    },
  },
  {
    id: 3,
    userId: 103,
    fullName: "Le Hoang C",
    email: "hoangc@gmail.com",
    requestedRole: "REFEREE",
    status: "REJECTED",
    reason: "I want to review and score race results as a referee.",
    adminNote: "The attached document does not match the requested referee role.",
    createdAt: "2026-05-18T09:15:00",
    reviewedAt: "2026-05-19T10:20:00",
    reviewedBy: {
      id: 1,
      fullName: "Admin Operator",
      email: "admin@equinepro.test",
    },
    user: {
      id: 103,
      fullName: "Le Hoang C",
      email: "hoangc@gmail.com",
      phone: "0903000303",
      dateOfBirth: "2001-07-08",
      gender: "MALE",
      address: "Bien Hoa, Dong Nai",
      status: "ACTIVE",
      emailVerified: true,
      phoneVerified: false,
      ageVerified: false,
      profileCompleted: false,
      roles: ["SPECTATOR"],
      createdAt: "2026-05-10T13:15:00",
      lastLoginAt: undefined,
    },
  },
];

export function AdminRoleRequestsWorkspace() {
  useDocumentTitle("Admin role requests");

  const [requests, setRequests] = useState<RoleRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("PENDING");
  const [currentView, setCurrentView] = useState<"LIST" | "DETAIL">("LIST");
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [toast, setToast] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToast({ text, type });
    window.setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getRoleRequests(selectedStatus === "ALL" ? undefined : selectedStatus);
      if (!Array.isArray(data)) {
        throw new Error("Role request API returned a non-array response.");
      }
      setRequests(data);
    } catch (err) {
      console.warn("Admin role request API unavailable. Using local fallback data.", err);
      const mockFiltered = fallbackMockData.filter(
        (request) => selectedStatus === "ALL" || request.status === selectedStatus,
      );
      setRequests(mockFiltered);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedStatus]);

  const handleApprove = async () => {
    if (selectedRequestId === null) return;
    setProcessing(true);
    try {
      await approveRequest(selectedRequestId);
      showToast("Role request approved.");
    } catch (err) {
      console.warn("Approve API failed. Updating fallback data locally.", err);
      const request = fallbackMockData.find((item) => item.id === selectedRequestId);
      if (request) {
        request.status = "APPROVED";
      }
      showToast("Role request approved in local fallback mode.");
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
      showToast("Role request rejected.");
    } catch (err) {
      console.warn("Reject API failed. Updating fallback data locally.", err);
      const request = fallbackMockData.find((item) => item.id === selectedRequestId);
      if (request) {
        request.status = "REJECTED";
        request.adminNote = reason;
      }
      showToast("Role request rejected in local fallback mode.");
    } finally {
      setProcessing(false);
      setIsRejectOpen(false);
      setCurrentView("LIST");
      setSelectedRequestId(null);
      fetchData();
    }
  };

  const activeRequest = requests.find((request) => request.id === selectedRequestId);

  return (
    <AdminLayout>
      <div className="relative space-y-6">
        {toast && (
          <div
            className="fixed right-4 top-4 z-50 flex items-center rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-lg"
            role="status"
          >
            <span
              className={`mr-2 h-2.5 w-2.5 rounded-full ${
                toast.type === "success" ? "bg-emerald-500" : "bg-rose-500"
              }`}
            />
            <p className="text-sm font-bold text-slate-800">{toast.text}</p>
          </div>
        )}

        {currentView === "LIST" ? (
          <AdminRoleRequestsPage
            loading={loading}
            onRefresh={fetchData}
            onStatusChange={setSelectedStatus}
            onViewDetail={(id) => {
              setSelectedRequestId(id);
              setCurrentView("DETAIL");
            }}
            requests={requests}
            selectedStatus={selectedStatus}
          />
        ) : (
          activeRequest && (
            <AdminRoleRequestDetailPage
              onApprove={handleApprove}
              onBack={() => {
                setCurrentView("LIST");
                setSelectedRequestId(null);
              }}
              onReject={() => setIsRejectOpen(true)}
              processing={processing}
              request={activeRequest}
            />
          )
        )}

        <RejectModal
          isOpen={isRejectOpen}
          isSubmitting={processing}
          onClose={() => setIsRejectOpen(false)}
          onConfirm={handleRejectConfirm}
        />
      </div>
    </AdminLayout>
  );
}
