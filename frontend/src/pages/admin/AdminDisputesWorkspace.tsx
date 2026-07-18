import { useState, useEffect } from "react";
import { MessageSquareWarning, Search, Filter, RefreshCw } from "lucide-react";
import { AdminLayout } from "../../layouts/AdminLayout";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { disputeApi, DisputeResponse, DisputeStatus } from "../../api/disputeApi";
import { AdminDisputeDetailModal } from "./components/AdminDisputeDetailModal";

export function AdminDisputesWorkspace() {
  useDocumentTitle("Disputes Workspace | Admin");
  
  const [disputes, setDisputes] = useState<DisputeResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<DisputeStatus | "ALL">("ALL");
  const [selectedDispute, setSelectedDispute] = useState<DisputeResponse | null>(null);

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      const data = await disputeApi.getAdminDisputes();
      setDisputes(data);
    } catch (error) {
      console.error("Failed to fetch disputes:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, []);

  const handleUpdateStatus = async (id: number, status: DisputeStatus, priority: any, resolutionNote: string) => {
    try {
      const updated = await disputeApi.updateDisputeStatus(id, { status, priority, resolutionNote });
      setDisputes(disputes.map(d => d.id === id ? updated : d));
      setSelectedDispute(updated);
    } catch (error) {
      console.error("Failed to update dispute:", error);
      alert("Failed to update dispute. Check console for details.");
    }
  };

  const filteredDisputes = disputes.filter(d => {
    const matchesSearch = d.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          d.id.toString().includes(searchTerm) ||
                          d.referenceType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: DisputeStatus) => {
    switch (status) {
      case "OPEN": return <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-700">Open</span>;
      case "IN_PROGRESS": return <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700">In Progress</span>;
      case "ESCALATED": return <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-bold text-orange-700">Escalated</span>;
      case "RESOLVED": return <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700">Resolved</span>;
      case "REJECTED": return <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-700">Rejected</span>;
      default: return null;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "URGENT": return <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">URGENT</span>;
      case "HIGH": return <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">HIGH</span>;
      case "MEDIUM": return <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">MEDIUM</span>;
      case "LOW": return <span className="text-xs font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">LOW</span>;
      default: return null;
    }
  };

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b3193a]">Workspace</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-[#070f4f]">Dispute Management</h1>
            <p className="mt-1 text-sm text-slate-500">Review, track, and resolve user complaints across the platform.</p>
          </div>
          <button 
            onClick={fetchDisputes}
            className="flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm border border-slate-200 hover:bg-slate-50 transition"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex flex-col sm:flex-row border-b border-slate-200 bg-slate-50 p-4 gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by ID, title, reference..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-4 text-sm outline-none focus:border-[#b3193a] focus:ring-1 focus:ring-[#b3193a]"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="rounded-lg border border-slate-300 bg-white py-2 px-3 text-sm font-semibold text-slate-700 outline-none focus:border-[#b3193a] focus:ring-1 focus:ring-[#b3193a]"
              >
                <option value="ALL">All Statuses</option>
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="ESCALATED">Escalated</option>
                <option value="RESOLVED">Resolved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-white border-b border-slate-200 text-xs font-black uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Details</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Priority</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      <div className="flex justify-center mb-2">
                        <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
                      </div>
                      Loading disputes...
                    </td>
                  </tr>
                ) : filteredDisputes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      <MessageSquareWarning className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                      No disputes found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredDisputes.map((dispute) => (
                    <tr 
                      key={dispute.id} 
                      onClick={() => setSelectedDispute(dispute)}
                      className="hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4 font-data font-bold text-slate-900">
                        #{dispute.id}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900 max-w-xs truncate">{dispute.title}</p>
                        <p className="text-xs text-slate-500">{dispute.referenceType} #{dispute.referenceId}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md text-xs">
                          {dispute.category.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {getPriorityBadge(dispute.priority)}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(dispute.status)}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-600">
                        {new Date(dispute.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selectedDispute && (
        <AdminDisputeDetailModal 
          dispute={selectedDispute}
          onClose={() => setSelectedDispute(null)}
          onUpdate={handleUpdateStatus}
        />
      )}
    </AdminLayout>
  );
}
