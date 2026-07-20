import { useState, useEffect, useMemo } from "react";
import { MessageSquareWarning, Search, Eye, AlertCircle, FileText, ChevronRight, Filter, Clock, CheckCircle2, Inbox, X, Plus } from "lucide-react";
import { disputeApi, DisputeResponse, DisputeStatus } from "../../../api/disputeApi";
import { resolveFileUrl } from "../../../utils/fileUrl";
import { AuthenticatedFileLink } from "../../../components/AuthenticatedFileLink";
import { AuthenticatedImage } from "../../../components/AuthenticatedImage";
import { ClientHeader } from "../../../components/client/ClientHeader";
import { ClientFooter } from "../../../components/client/ClientFooter";
import { CreateDisputeModal } from "./components/CreateDisputeModal";

type TabType = "ALL" | "ACTIVE" | "RESOLVED";

export function SpectatorDisputesPage() {
  const [disputes, setDisputes] = useState<DisputeResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("ALL");
  const [selectedDispute, setSelectedDispute] = useState<DisputeResponse | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

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
        return <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-400 border border-blue-500/20"><span className="h-1.5 w-1.5 rounded-full bg-blue-400"></span>Open</span>;
      case "IN_PROGRESS":
        return <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-400 border border-amber-500/20"><span className="h-1.5 w-1.5 rounded-full bg-amber-400 live-pulse"></span>In Progress</span>;
      case "ESCALATED":
        return <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/10 px-2.5 py-1 text-xs font-medium text-orange-400 border border-orange-500/20"><span className="h-1.5 w-1.5 rounded-full bg-orange-400 live-pulse"></span>Escalated</span>;
      case "RESOLVED":
        return <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400 border border-emerald-500/20"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>Resolved</span>;
      case "REJECTED":
        return <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-2.5 py-1 text-xs font-medium text-rose-400 border border-rose-500/20"><span className="h-1.5 w-1.5 rounded-full bg-rose-400"></span>Rejected</span>;
      default:
        return null;
    }
  };

  const stats = useMemo(() => {
    const active = disputes.filter(d => ['OPEN', 'IN_PROGRESS', 'ESCALATED'].includes(d.status)).length;
    const resolved = disputes.filter(d => ['RESOLVED', 'REJECTED'].includes(d.status)).length;
    return { total: disputes.length, active, resolved };
  }, [disputes]);

  const filteredDisputes = disputes.filter((d) => {
    const matchesSearch = d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          d.id.toString().includes(searchTerm) ||
                          d.referenceType.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTab = activeTab === "ALL" ? true :
                       activeTab === "ACTIVE" ? ['OPEN', 'IN_PROGRESS', 'ESCALATED'].includes(d.status) :
                       ['RESOLVED', 'REJECTED'].includes(d.status);
    
    return matchesSearch && matchesTab;
  });

  return (
    <div className="client-theme min-h-screen bg-turf-950 pb-20 text-ivory flex flex-col font-grotesk">
      <ClientHeader />
      
      {/* Cinematic Hero Header */}
      <div className="relative overflow-hidden border-b border-white/5 bg-turf-900 pt-16 pb-12">
        <div className="absolute inset-0 turf-vignette opacity-80 pointer-events-none"></div>
        <div className="absolute right-0 top-0 h-full w-1/2 opacity-20 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(circle at 70% 30%, var(--color-gold-400) 0%, transparent 50%)'
        }}></div>
        
        <main className="relative z-10 mx-auto w-full max-w-5xl px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <span className="eyebrow text-gold-300 mb-4 block">Support Center</span>
              <h1 className="font-display text-4xl md:text-5xl font-medium tracking-tight text-white text-shadow">My Disputes</h1>
              <p className="mt-3 text-base text-ivory-dim max-w-xl">
                Track the status of your reported issues, transaction queries, and prediction disputes in one place.
              </p>
            </div>
            
            {/* Stats Overview */}
            <div className="flex gap-4">
              <div className="rounded-xl border border-white/10 bg-black/40 backdrop-blur-md p-4 min-w-[120px]">
                <p className="text-xs font-medium text-ivory-faint uppercase tracking-wider mb-1">Active</p>
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-3xl font-medium text-gold-400">{stats.active}</span>
                  <span className="text-xs text-ivory-dim">cases</span>
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/40 backdrop-blur-md p-4 min-w-[120px]">
                <p className="text-xs font-medium text-ivory-faint uppercase tracking-wider mb-1">Resolved</p>
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-3xl font-medium text-white">{stats.resolved}</span>
                  <span className="text-xs text-ivory-dim">cases</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <main className="mx-auto w-full max-w-5xl px-6 py-10 flex-1 relative z-10">
        {/* Filters and Search */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 p-1 backdrop-blur-sm">
            {(["ALL", "ACTIVE", "RESOLVED"] as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  activeTab === tab 
                    ? "bg-white/10 text-white shadow-sm" 
                    : "text-ivory-dim hover:text-white hover:bg-white/5"
                }`}
              >
                {tab === "ALL" ? "All Cases" : tab === "ACTIVE" ? "Action Required" : "History"}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative max-w-md w-full sm:w-auto flex-1 group">
              <Search className="absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 pointer-events-none text-slate-400 transition-colors group-focus-within:text-gold-400" />
              <input
                type="text"
                placeholder="Search ID, title, or type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-black/20 backdrop-blur-sm py-2 pl-10 pr-4 text-sm text-ivory placeholder-ivory-faint transition-all focus:border-gold-400/50 focus:bg-white/5 focus:outline-none focus:ring-1 focus:ring-gold-400/50"
              />
            </div>
            
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 rounded-lg bg-gold-400 px-4 py-2.5 text-sm font-bold text-turf-950 transition-all hover:bg-gold-300 hover:shadow-[0_0_15px_-3px_rgba(212,175,55,0.4)] whitespace-nowrap"
            >
              <Plus size={18} /> 
              <span className="hidden sm:inline">New Dispute</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold-400 border-t-transparent"></div>
          </div>
        ) : filteredDisputes.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-white/5 p-16 text-center backdrop-blur-sm">
            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-white/5">
              <Inbox size={32} className="text-gold-400/50" />
            </div>
            <h3 className="font-display text-2xl text-white mb-2">No disputes found</h3>
            <p className="max-w-sm text-sm text-ivory-dim">
              {searchTerm 
                ? "We couldn't find any cases matching your search criteria." 
                : "Your record is clean. You haven't submitted any disputes or reports yet."}
            </p>
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm("")}
                className="mt-6 text-sm font-medium text-gold-400 hover:text-gold-300"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredDisputes.map((dispute) => (
              <div
                key={dispute.id}
                onClick={() => setSelectedDispute(dispute)}
                className="group relative overflow-hidden rounded-xl border border-white/5 bg-white/5 transition-all hover:bg-white/10 hover:border-gold-400/30 flex flex-col md:flex-row md:items-center p-5 gap-4 cursor-pointer"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-gold-400/0 via-gold-400/5 to-gold-400/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 pointer-events-none"></div>
                
                {/* Left: ID & Date */}
                <div className="flex flex-row md:flex-col md:w-32 justify-between md:justify-center border-b md:border-b-0 md:border-r border-white/10 pb-3 md:pb-0 md:pr-4">
                  <span className="font-data text-sm font-bold text-gold-400 text-foil">
                    #{dispute.id.toString().padStart(5, "0")}
                  </span>
                  <span className="text-xs text-ivory-faint mt-1">
                    {formatDate(dispute.createdAt, true)}
                  </span>
                </div>
                
                {/* Middle: Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1.5">
                    <h3 className="font-semibold text-ivory text-base truncate pr-4">
                      {dispute.title}
                    </h3>
                    <div className="shrink-0 hidden md:block">
                      {getStatusBadge(dispute.status)}
                    </div>
                  </div>
                  <p className="text-sm text-ivory-dim line-clamp-1 pr-4">
                    {dispute.description}
                  </p>
                  
                  {/* Mobile Status */}
                  <div className="mt-3 md:hidden">
                    {getStatusBadge(dispute.status)}
                  </div>
                </div>
                
                {/* Right: Actions */}
                <div className="flex items-center justify-between md:justify-end gap-4 mt-1 md:mt-0 pt-3 md:pt-0 border-t md:border-t-0 border-white/10 shrink-0">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-ivory-faint bg-black/30 px-2.5 py-1 rounded-md">
                    <FileText size={12} className="text-gold-500" /> 
                    <span className="tracking-wide uppercase">{dispute.category.replace("_", " ")}</span>
                  </div>
                  
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-white/5 text-gold-400 group-hover:bg-gold-400 group-hover:text-turf-950 transition-colors">
                    <ChevronRight size={18} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Cinematic Detail Modal (Moved outside of relative <main> to fix header z-index issue) */}
      {selectedDispute && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-turf-950/90 backdrop-blur-md" onClick={() => setSelectedDispute(null)}></div>
          
          <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-turf-900 shadow-2xl modal-scrollbar auth-panel-motion">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 bg-black/20 px-6 py-5">
              <div className="flex items-center gap-4">
                <div>
                  <p className="font-data text-xs font-bold tracking-wider text-gold-400 mb-1 uppercase">
                    Case #{selectedDispute.id.toString().padStart(5, "0")}
                  </p>
                  <h2 className="text-lg font-bold text-white leading-none pr-8">{selectedDispute.title}</h2>
                </div>
              </div>
              <button
                onClick={() => setSelectedDispute(null)}
                className="rounded-full p-2 text-ivory-dim transition-colors hover:bg-white/10 hover:text-white shrink-0"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              
              {/* Status Timeline */}
              <div className="mb-8 rounded-xl border border-white/5 bg-black/20 p-6">
                <h4 className="text-xs font-medium uppercase tracking-wider text-ivory-faint mb-6">Case Timeline</h4>
                <div className="flex items-start justify-between relative">
                  
                  {/* Step 1: Created */}
                  <div className="flex flex-col items-center flex-1 relative">
                    <div className="flex items-center w-full">
                      <div className="w-1/2 h-[2px] bg-transparent"></div>
                      <div className="shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-gold-400 text-turf-950 shadow-[0_0_15px_-3px_rgba(212,175,55,0.4)] relative z-10">
                        <CheckCircle2 size={20} />
                      </div>
                      <div className={`w-1/2 h-[2px] transition-colors duration-500 ${
                        ['IN_PROGRESS', 'ESCALATED', 'RESOLVED', 'REJECTED'].includes(selectedDispute.status) 
                          ? 'bg-gold-400/50' 
                          : 'bg-white/10'
                      }`}></div>
                    </div>
                    <div className="text-center mt-4">
                      <p className="text-sm font-bold text-white">Submitted</p>
                      <p className="font-data text-[11px] text-ivory-dim mt-1">{formatDate(selectedDispute.createdAt, false)}</p>
                    </div>
                  </div>

                  {/* Step 2: In Progress */}
                  <div className="flex flex-col items-center flex-1 relative">
                    <div className="flex items-center w-full">
                      <div className={`w-1/2 h-[2px] transition-colors duration-500 ${
                        ['IN_PROGRESS', 'ESCALATED', 'RESOLVED', 'REJECTED'].includes(selectedDispute.status) 
                          ? 'bg-gold-400/50' 
                          : 'bg-white/10'
                      }`}></div>
                      <div className={`shrink-0 flex h-10 w-10 items-center justify-center rounded-full transition-all duration-500 relative z-10 ${
                        ['IN_PROGRESS', 'ESCALATED', 'RESOLVED', 'REJECTED'].includes(selectedDispute.status) 
                          ? 'bg-amber-400 text-turf-950 shadow-[0_0_15px_-3px_rgba(251,191,36,0.4)]' + (['IN_PROGRESS', 'ESCALATED'].includes(selectedDispute.status) ? ' live-pulse' : '')
                          : 'bg-turf-900 border border-white/10 text-white/30'
                      }`}>
                        <Clock size={20} />
                      </div>
                      <div className={`w-1/2 h-[2px] transition-colors duration-500 ${
                        ['RESOLVED', 'REJECTED'].includes(selectedDispute.status) 
                          ? (selectedDispute.status === 'RESOLVED' ? 'bg-emerald-400/50' : 'bg-rose-400/50')
                          : 'bg-white/10'
                      }`}></div>
                    </div>
                    <div className="text-center mt-4">
                      <p className={`text-sm font-bold transition-colors ${['IN_PROGRESS', 'ESCALATED', 'RESOLVED', 'REJECTED'].includes(selectedDispute.status) ? 'text-white' : 'text-ivory-dim'}`}>Reviewing</p>
                      <p className="font-data text-[11px] text-transparent select-none mt-1">.</p>
                    </div>
                  </div>

                  {/* Step 3: Resolved */}
                  <div className="flex flex-col items-center flex-1 relative">
                    <div className="flex items-center w-full">
                      <div className={`w-1/2 h-[2px] transition-colors duration-500 ${
                        ['RESOLVED', 'REJECTED'].includes(selectedDispute.status) 
                          ? (selectedDispute.status === 'RESOLVED' ? 'bg-emerald-400/50' : 'bg-rose-400/50')
                          : 'bg-white/10'
                      }`}></div>
                      <div className={`shrink-0 flex h-10 w-10 items-center justify-center rounded-full transition-all duration-500 relative z-10 ${
                        ['RESOLVED', 'REJECTED'].includes(selectedDispute.status) 
                          ? (selectedDispute.status === 'RESOLVED' ? 'bg-emerald-400 text-turf-950 shadow-[0_0_15px_-3px_rgba(52,211,153,0.4)]' : 'bg-rose-400 text-white shadow-[0_0_15px_-3px_rgba(251,113,133,0.4)]')
                          : 'bg-turf-900 border border-white/10 text-white/30'
                      }`}>
                        <AlertCircle size={20} />
                      </div>
                      <div className="w-1/2 h-[2px] bg-transparent"></div>
                    </div>
                    <div className="text-center mt-4">
                      <p className={`text-sm font-bold transition-colors ${['RESOLVED', 'REJECTED'].includes(selectedDispute.status) ? 'text-white' : 'text-ivory-dim'}`}>Resolved</p>
                      <p className="font-data text-[11px] text-transparent select-none mt-1">.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-2 space-y-6">
                  {/* Description */}
                  <div>
                    <h4 className="text-xs font-medium uppercase tracking-wider text-ivory-faint mb-2">Description</h4>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-ivory bg-black/20 p-4 rounded-xl border border-white/5">
                      {selectedDispute.description}
                    </p>
                  </div>

                  {/* Attachments */}
                  {selectedDispute.attachments && selectedDispute.attachments.length > 0 && (
                    <div>
                      <h4 className="mb-3 text-xs font-medium uppercase tracking-wider text-ivory-faint flex items-center gap-3">
                        <span>Evidence</span>
                        <span className="bg-white/10 px-2 py-0.5 rounded text-white text-[10px]">{selectedDispute.attachments.length} files</span>
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {selectedDispute.attachments.map((att, i) => (
                          <AuthenticatedFileLink
                            key={att.id}
                            href={resolveFileUrl(att.fileUrl)}
                            className="group relative aspect-square overflow-hidden rounded-lg border border-white/10 bg-black block"
                          >
                            <AuthenticatedImage
                              src={resolveFileUrl(att.fileUrl)}
                              alt={`Evidence ${i + 1}`}
                              className="h-full w-full object-cover opacity-70 transition-all duration-300 group-hover:scale-110 group-hover:opacity-100"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100">
                              <Eye size={20} className="text-white" />
                            </div>
                          </AuthenticatedFileLink>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Resolution Note (if any) */}
                  {selectedDispute.resolutionNote && (
                    <div className="relative overflow-hidden rounded-xl border border-gold-500/30 bg-gold-500/10 p-5">
                      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDIiLz4KPHBhdGggZD0iTTAgMEw4IDhaTTEgMEw4IDdaIiBzdHJva2U9IiNmZmYiIHN0cm9rZS1vcGFjaXR5PSIwLjAyIiBzdHJva2Utd2lkdGg9IjEiLz4KPC9zdmc+')] opacity-50"></div>
                      <div className="relative z-10">
                        <div className="mb-2 flex items-center gap-2 text-gold-400">
                          <AlertCircle size={18} />
                          <h4 className="font-bold">Official Resolution</h4>
                        </div>
                        <p className="whitespace-pre-wrap text-sm text-gold-100/90 leading-relaxed">
                          {selectedDispute.resolutionNote}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                  <div className="rounded-xl border border-white/5 bg-white/5 p-4 space-y-4">
                    <div>
                      <p className="text-xs text-ivory-faint uppercase tracking-wider mb-1">Category</p>
                      <p className="font-medium text-white text-sm bg-black/40 px-3 py-1.5 rounded inline-block">
                        {selectedDispute.category.replace(/_/g, " ")}
                      </p>
                    </div>
                    <div className="gold-rule h-[1px] w-full opacity-30"></div>
                    <div>
                      <p className="text-xs text-ivory-faint uppercase tracking-wider mb-1">Reference</p>
                      <p className="font-medium text-ivory text-sm">{selectedDispute.referenceType}</p>
                      {selectedDispute.referenceType !== "GENERAL" && (
                        <p className="font-data font-medium text-gold-400 text-xs mt-0.5">ID: #{selectedDispute.referenceId}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <CreateDisputeModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        referenceType="GENERAL"
        referenceId={0}
        onSuccess={() => {
          fetchDisputes();
        }}
      />

      <ClientFooter />
    </div>
  );
}
