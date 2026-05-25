import { useEffect, useState } from "react";

import { approveRequest, getRoleRequests, passCvReview, rejectRequest } from "../../api/adminRoleRequestApi";
import { RejectModal } from "../../components/RejectModal";
import { AdminLayout } from "../../layouts/AdminLayout";
import { RoleRequest } from "../../types/adminRoleRequest";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { AdminRoleRequestDetailPage } from "./AdminRoleRequestDetailPage";
import { AdminRoleRequestsPage } from "./AdminRoleRequestsPage";

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
      console.error("Admin role request API unavailable.", err);
      setRequests([]);
      showToast("Could not load role requests from the server.", "error");
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
      console.error("Approve API failed.", err);
      showToast("Could not approve this role request.", "error");
    } finally {
      setProcessing(false);
      setCurrentView("LIST");
      setSelectedRequestId(null);
      fetchData();
    }
  };

  const handlePassCv = async () => {
    if (selectedRequestId === null) return;
    setProcessing(true);
    try {
      const updatedRequest = await passCvReview(selectedRequestId, "CV passed. Ready for interview.");
      setRequests((current) => current.map((item) => (item.id === selectedRequestId ? updatedRequest : item)));
      showToast("CV screening marked as passed.");
    } catch (err) {
      console.error("Pass CV API failed.", err);
      showToast("Could not mark CV screening as passed.", "error");
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectConfirm = async (reason: string) => {
    if (selectedRequestId === null) return;
    setProcessing(true);
    try {
      await rejectRequest(selectedRequestId, reason);
      showToast("Role request rejected.");
    } catch (err) {
      console.error("Reject API failed.", err);
      showToast("Could not reject this role request.", "error");
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
              onPassCv={handlePassCv}
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
