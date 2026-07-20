import { useState } from "react";
import { X, Eye, Save, Clock, AlertCircle, RefreshCw } from "lucide-react";
import { DisputeResponse, DisputeStatus, DisputePriority } from "../../../api/disputeApi";
import { resolveFileUrl } from "../../../utils/fileUrl";
import { AuthenticatedFileLink } from "../../../components/AuthenticatedFileLink";
import { AuthenticatedImage } from "../../../components/AuthenticatedImage";

interface Props {
  dispute: DisputeResponse;
  onClose: () => void;
  onUpdate: (id: number, status: DisputeStatus, priority: DisputePriority, resolutionNote: string) => Promise<void>;
}

export function AdminDisputeDetailModal({ dispute, onClose, onUpdate }: Props) {
  const [status, setStatus] = useState<DisputeStatus>(dispute.status);
  const [priority, setPriority] = useState<DisputePriority>(dispute.priority);
  const [resolutionNote, setResolutionNote] = useState(dispute.resolutionNote || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await onUpdate(dispute.id, status, priority, resolutionNote);
    setIsSaving(false);
    onClose();
  };

  const isResolved = status === "RESOLVED" || status === "REJECTED";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl flex flex-col max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200">
        
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50">
          <div>
            <h2 className="text-xl font-black text-slate-900">Dispute #{dispute.id}</h2>
            <p className="text-xs font-semibold text-slate-500 mt-1">
              Submitted on {new Date(dispute.createdAt).toLocaleString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto modal-scrollbar p-6 flex flex-col md:flex-row gap-8">
          {/* Left Column: Details */}
          <div className="flex-1 flex flex-col gap-6">
            
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col gap-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Requester Info</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] uppercase text-slate-400 block mb-1">Name</span>
                  <p className="text-sm font-bold text-slate-800">{dispute.requesterName}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-400 block mb-1">Email</span>
                  <p className="text-sm font-semibold text-slate-600 truncate" title={dispute.requesterEmail}>{dispute.requesterEmail}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-400 block mb-1">Role</span>
                  <p className="text-sm font-semibold text-slate-600">{dispute.requesterRole}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-400 block mb-1">User ID</span>
                  <p className="text-sm font-data font-semibold text-slate-600">#{dispute.requesterId}</p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Category</span>
                <div className="mt-1.5">
                  <span className={`font-bold px-2 py-1 rounded-md text-[11px] uppercase tracking-wider ${
                    dispute.category === 'FINANCE' ? 'bg-emerald-100 text-emerald-700' :
                    dispute.category === 'PREDICTION' ? 'bg-indigo-100 text-indigo-700' :
                    dispute.category === 'SYSTEM' ? 'bg-rose-100 text-rose-700' :
                    'bg-slate-200 text-slate-700'
                  }`}>
                    {dispute.category.replace('_', ' ')}
                  </span>
                </div>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Reference</span>
                <p className="font-semibold text-slate-800 mt-1">{dispute.referenceType} #{dispute.referenceId}</p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-black text-[#070f4f] mb-2">{dispute.title}</h3>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                {dispute.description}
              </div>
            </div>

            {dispute.attachments && dispute.attachments.length > 0 && (
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">Evidence Files</h4>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {dispute.attachments.map((att, i) => (
                    <AuthenticatedFileLink
                      key={att.id}
                      href={resolveFileUrl(att.fileUrl)}
                      className="group relative aspect-video overflow-hidden rounded-lg border border-slate-200 bg-slate-100 shadow-sm block"
                    >
                      <AuthenticatedImage
                        src={resolveFileUrl(att.fileUrl)}
                        alt={`Evidence ${i + 1}`}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-900/40 opacity-0 transition-opacity group-hover:opacity-100">
                        <Eye size={24} className="text-white drop-shadow-md" />
                      </div>
                    </AuthenticatedFileLink>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Actions */}
          <div className="w-full md:w-80 flex flex-col gap-6 border-l border-slate-100 md:pl-8">
            <div>
              <label className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2 block">
                Update Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as DisputeStatus)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-bold text-slate-800 outline-none focus:border-[#b3193a] focus:ring-1 focus:ring-[#b3193a] shadow-sm"
              >
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="ESCALATED">Escalated</option>
                <option value="RESOLVED">Resolved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2 block">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as DisputePriority)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-bold text-slate-800 outline-none focus:border-[#b3193a] focus:ring-1 focus:ring-[#b3193a] shadow-sm"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            <div className="flex-1">
              <label className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2 flex items-center justify-between">
                <span>Resolution Note</span>
                {isResolved && <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Required for closing</span>}
              </label>
              <textarea
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                placeholder="Explain the outcome or next steps..."
                className="w-full h-32 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#b3193a] focus:ring-1 focus:ring-[#b3193a] shadow-sm resize-none modal-scrollbar"
              />
            </div>

            {dispute.resolvedAt && (
              <div className="flex items-start gap-2 text-xs font-medium text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <Clock size={14} className="mt-0.5 shrink-0" />
                <span>
                  Resolved at:<br/>
                  <strong className="text-slate-700">{new Date(dispute.resolvedAt).toLocaleString()}</strong>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || (isResolved && !resolutionNote.trim())}
            className="flex items-center gap-2 rounded-lg bg-[#070f4f] px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#101a70] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
