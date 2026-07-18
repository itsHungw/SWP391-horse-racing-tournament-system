import { useState, useEffect } from "react";
import { MessageSquareWarning, Search, Eye, AlertCircle, FileText } from "lucide-react";
import { disputeApi, DisputeResponse, DisputeStatus } from "../../../api/disputeApi";
import { resolveFileUrl } from "../../../utils/fileUrl";
import { AuthenticatedFileLink } from "../../../components/AuthenticatedFileLink";
import { AuthenticatedImage } from "../../../components/AuthenticatedImage";
import { ClientHeader } from "../../../components/client/ClientHeader";
import { ClientFooter } from "../../../components/client/ClientFooter";
export function SpectatorDisputesPage() {
  const [disputes, setDisputes] = useState<DisputeResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDispute, setSelectedDispute] = useState<DisputeResponse | null>(null);

  const formatDate = (dateString: string, includeYear = true) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      ...(includeYear ? { year: "numeric" } : {})
    }).format(new Date(dateString));
  };

  useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      const data = await disputeApi.getSpectatorDisputes();
      setDisputes(data);
    } catch (error) {
      console.error("Failed to fetch disputes:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: DisputeStatus) => {
    switch (status) {
      case "OPEN":
        return <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-400 border border-blue-500/20">Open</span>;
      case "IN_PROGRESS":
        return <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-400 border border-amber-500/20">In Progress</span>;
      case "ESCALATED":
        return <span className="inline-flex items-center rounded-full bg-orange-500/10 px-2.5 py-0.5 text-xs font-medium text-orange-400 border border-orange-500/20">Escalated</span>;
      case "RESOLVED":
        return <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400 border border-emerald-500/20">Resolved</span>;
      case "REJECTED":
        return <span className="inline-flex items-center rounded-full bg-rose-500/10 px-2.5 py-0.5 text-xs font-medium text-rose-400 border border-rose-500/20">Rejected</span>;
      default:
        return null;
    }
  };

  const filteredDisputes = disputes.filter(
    (d) =>
      d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.id.toString().includes(searchTerm) ||
      d.referenceType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="client-theme min-h-screen bg-turf-950 pb-20 text-ivory flex flex-col">
      <ClientHeader />
      <main className="mx-auto w-full max-w-5xl px-6 py-10 flex-1">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-medium tracking-tight text-ivory">My Disputes</h1>
            <p className="mt-2 text-sm text-ivory-dim">
              Track and manage issues reported on predictions or transactions.
            </p>
          </div>
          <MessageSquareWarning size={48} className="text-gold-400/20" />
        </div>

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ivory-dim" />
            <input
              type="text"
              placeholder="Search by ID, title, or type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-10 pr-4 text-sm text-ivory placeholder-ivory-faint transition-colors focus:border-gold-400/50 focus:outline-none focus:ring-1 focus:ring-gold-400/50"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-gold-400 border-t-transparent"></div>
          </div>
        ) : filteredDisputes.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-12 text-center">
            <MessageSquareWarning size={48} className="mx-auto mb-4 text-ivory-faint" />
            <p className="text-lg font-medium text-ivory">No disputes found</p>
            <p className="mt-2 text-sm text-ivory-dim">
              You haven't submitted any disputes or reports yet.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredDisputes.map((dispute) => (
              <div
                key={dispute.id}
                onClick={() => setSelectedDispute(dispute)}
                className="group cursor-pointer rounded-xl border border-white/10 bg-white/5 p-5 transition-all hover:border-gold-400/40 hover:bg-white/10"
              >
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-data text-xs font-bold text-gold-400">
                      #{dispute.id.toString().padStart(5, "0")}
                    </span>
                    {getStatusBadge(dispute.status)}
                  </div>
                  <span className="font-data text-xs text-ivory-faint">
                    {formatDate(dispute.createdAt, true)}
                  </span>
                </div>
                <h3 className="mb-1 truncate text-base font-semibold text-ivory">
                  {dispute.title}
                </h3>
                <p className="mb-4 line-clamp-2 text-sm text-ivory-dim">
                  {dispute.description}
                </p>
                <div className="flex items-center justify-between border-t border-white/5 pt-3">
                  <div className="flex items-center gap-2 text-xs text-ivory-faint">
                    <FileText size={14} />
                    <span>{dispute.category.replace("_", " ")}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-medium text-gold-300 opacity-0 transition-opacity group-hover:opacity-100">
                    <span>View details</span>
                    <Eye size={14} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Detail Modal */}
        {selectedDispute && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-turf-950/80 p-4 backdrop-blur-sm">
            <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-turf-900 shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-6 py-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-bold text-ivory">Dispute #{selectedDispute.id}</h2>
                  {getStatusBadge(selectedDispute.status)}
                </div>
                <button
                  onClick={() => setSelectedDispute(null)}
                  className="rounded-full p-1.5 text-ivory-dim transition-colors hover:bg-white/10 hover:text-ivory"
                >
                  <Search size={20} className="rotate-45" /> {/* Close icon visual hack */}
                </button>
              </div>

              <div className="max-h-[70vh] overflow-y-auto p-6">
                <div className="mb-6 grid grid-cols-2 gap-4 rounded-xl border border-white/10 bg-white/5 p-4 sm:grid-cols-4">
                  <div>
                    <p className="text-xs text-ivory-faint uppercase tracking-wider">Type</p>
                    <p className="font-medium text-ivory">{selectedDispute.category}</p>
                  </div>
                  <div>
                    <p className="text-xs text-ivory-faint uppercase tracking-wider">Reference</p>
                    <p className="font-medium text-ivory">{selectedDispute.referenceType}</p>
                  </div>
                  <div>
                    <p className="text-xs text-ivory-faint uppercase tracking-wider">Ref ID</p>
                    <p className="font-data font-medium text-ivory">#{selectedDispute.referenceId}</p>
                  </div>
                  <div>
                    <p className="text-xs text-ivory-faint uppercase tracking-wider">Created</p>
                    <p className="font-medium text-ivory">{formatDate(selectedDispute.createdAt, false)}</p>
                  </div>
                </div>

                <div className="mb-8">
                  <h3 className="mb-2 text-lg font-semibold text-gold-300">{selectedDispute.title}</h3>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-ivory-dim">
                    {selectedDispute.description}
                  </p>
                </div>

                {selectedDispute.attachments && selectedDispute.attachments.length > 0 && (
                  <div className="mb-8">
                    <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ivory-faint">Evidence Files</h4>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {selectedDispute.attachments.map((att, i) => (
                        <AuthenticatedFileLink
                          key={att.id}
                          href={resolveFileUrl(att.fileUrl)}
                          className="group relative aspect-video overflow-hidden rounded-lg border border-white/10 bg-turf-950 block"
                        >
                          <AuthenticatedImage
                            src={resolveFileUrl(att.fileUrl)}
                            alt={`Evidence ${i + 1}`}
                            className="h-full w-full object-cover opacity-80 transition-opacity group-hover:opacity-100"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                            <Eye size={24} className="text-white" />
                          </div>
                        </AuthenticatedFileLink>
                      ))}
                    </div>
                  </div>
                )}

                {selectedDispute.resolutionNote && (
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-5">
                    <div className="mb-2 flex items-center gap-2 text-emerald-400">
                      <AlertCircle size={18} />
                      <h4 className="font-bold">Resolution from Support</h4>
                    </div>
                    <p className="whitespace-pre-wrap text-sm text-emerald-200/80">
                      {selectedDispute.resolutionNote}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
      <ClientFooter />
    </div>
  );
}
