import { useCallback, useEffect, useState, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import { FileText, Send, Users, X, Info, Search, Filter, SlidersHorizontal, RotateCcw, Calendar, CheckCircle2, ChevronRight, FileCheck2, Loader2 } from "lucide-react";

import {
  getOwnerTournamentRegistrationsPage,
  getOwnerAvailableJockeys,
  sendOwnerContract,
  uploadAgreementDocument,
} from "../../api/racingApi";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { OwnerLayout } from "../../layouts/OwnerLayout";
import type { JockeyPoolApplication, TournamentRegistration } from "../../types/racing";
import { getApiErrorMessage } from "../../utils/apiError";
import { resolveFileUrl } from "../../utils/fileUrl";

export function OwnerJockeyInvitationsPage() {
  useDocumentTitle("Jockey Invitations - Owner");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [registrations, setRegistrations] = useState<TournamentRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageMessage, setPageMessage] = useState<string | null>(null);

  const [contractRegistration, setContractRegistration] = useState<TournamentRegistration | null>(null);
  const [availableJockeys, setAvailableJockeys] = useState<JockeyPoolApplication[]>([]);
  const [selectedJockeyApplicationId, setSelectedJockeyApplicationId] = useState<number | "">("");
  const [jockeySearchQuery, setJockeySearchQuery] = useState("");
  const [contractMessage, setContractMessage] = useState("");
  const [agreementFile, setAgreementFile] = useState<File | null>(null);
  const [agreementFileName, setAgreementFileName] = useState("");
  const [contractLoading, setContractLoading] = useState(false);
  const [contractSubmitting, setContractSubmitting] = useState(false);
  const [contractError, setContractError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTournament, setSelectedTournament] = useState("");
  const [sortBy, setSortBy] = useState("horse-asc");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getOwnerTournamentRegistrationsPage({ page: 0, size: 100 });
      const content = Array.isArray(data.content) ? data.content : [];
      // Filter for APPROVED only
      const approvedOnly = content.filter((r: TournamentRegistration) => r.status === "APPROVED");
      setRegistrations(approvedOnly);
      setPageMessage(null);
    } catch (error) {
      setPageMessage(getApiErrorMessage(error, "Could not load approved horses."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const uniqueTournaments = useMemo(() => {
    const names = registrations.map((r) => r.tournamentName);
    return Array.from(new Set(names)).sort();
  }, [registrations]);

  const filteredAndSortedRegistrations = useMemo(() => {
    let result = [...registrations];

    // Search Query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (r) =>
          r.horseName.toLowerCase().includes(query) ||
          r.tournamentName.toLowerCase().includes(query)
      );
    }

    // Tournament Filter
    if (selectedTournament) {
      result = result.filter((r) => r.tournamentName === selectedTournament);
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === "horse-asc") {
        return a.horseName.localeCompare(b.horseName);
      } else if (sortBy === "horse-desc") {
        return b.horseName.localeCompare(a.horseName);
      } else if (sortBy === "tournament-asc") {
        return a.tournamentName.localeCompare(b.tournamentName);
      } else if (sortBy === "tournament-desc") {
        return b.tournamentName.localeCompare(a.tournamentName);
      }
      return 0;
    });

    return result;
  }, [registrations, searchQuery, selectedTournament, sortBy]);

  const openContractModal = async (registration: TournamentRegistration) => {
    setContractRegistration(registration);
    setSelectedJockeyApplicationId("");
    setJockeySearchQuery("");
    setContractMessage(`We would like you to ride ${registration.horseName} in ${registration.tournamentName}.`);
    setAgreementFile(null);
    setAgreementFileName(`${registration.tournamentName.toLowerCase().replaceAll(" ", "-")}-assignment-agreement.pdf`);
    setContractError("");
    setContractLoading(true);
    try {
      const pool = await getOwnerAvailableJockeys(registration.tournamentId);
      setAvailableJockeys(pool);
    } catch (error) {
      setAvailableJockeys([]);
      setContractError(getApiErrorMessage(error, "Could not load the approved jockey pool."));
    } finally {
      setContractLoading(false);
    }
  };

  const closeContractModal = () => {
    setContractRegistration(null);
    setAvailableJockeys([]);
    setSelectedJockeyApplicationId("");
    setJockeySearchQuery("");
    setContractError("");
    setAgreementFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSendContract = async () => {
    if (!contractRegistration || !selectedJockeyApplicationId) return;

    setContractSubmitting(true);
    setContractError("");
    try {
      const uploadedAgreement = agreementFile ? await uploadAgreementDocument(agreementFile) : null;
      const contract = await sendOwnerContract(contractRegistration.tournamentId, {
        horseRegistrationId: contractRegistration.id,
        jockeyApplicationId: selectedJockeyApplicationId,
        message: contractMessage.trim() || undefined,
        agreementUrl: uploadedAgreement?.url,
        agreementFileName: agreementFile ? agreementFile.name : agreementFileName.trim() || undefined,
      });
      setPageMessage(
        `Contract sent to ${contract.jockeyName} for ${contract.horseName}. Waiting for jockey response.`
      );
      closeContractModal();
    } catch (error) {
      setContractError(getApiErrorMessage(error, "Could not send this assignment contract."));
    } finally {
      setContractSubmitting(false);
    }
  };

  return (
    <OwnerLayout>
      <section aria-labelledby="invitations-title" className="space-y-6">
        {/* Standardized Hero Header */}
        <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="absolute top-0 left-0 h-1.5 w-full bg-gradient-to-r from-[#008670] to-[#006d5b]"></div>
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.14em] text-[#006d5b]">Workspace Dashboard</p>
              <h1 id="invitations-title" className="mt-2 text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
                Jockey Invitations
              </h1>
              <p className="mt-2 max-w-3xl text-base leading-7 text-slate-600">
                Form winning combinations. Browse the approved jockey pool and send custom assignment contracts to secure elite riders for your certified horses.
              </p>
            </div>
          </div>
        </div>

        {pageMessage && (
          <div className="flex items-center justify-between rounded-xl border border-emerald-100 bg-[#f0fdfa] px-5 py-4 text-xs font-bold text-[#006d5b] shadow-sm" role="status">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              <span>{pageMessage}</span>
            </div>
            <button aria-label="Dismiss message" onClick={() => setPageMessage(null)} className="cursor-pointer text-slate-400 hover:text-slate-600 transition">
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Search, Filter, Sort Toolbar */}
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1 md:max-w-md">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by horse name or championship..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-10 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#006d5b] focus:bg-white focus:ring-2 focus:ring-[#006d5b]/10"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Championship Filter */}
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1.5 min-h-[44px]">
              <Filter className="h-4 w-4 text-slate-500" />
              <select
                value={selectedTournament}
                onChange={(e) => setSelectedTournament(e.target.value)}
                className="bg-transparent text-sm font-semibold text-slate-700 outline-none cursor-pointer pr-4"
              >
                <option value="">All Championships</option>
                {uniqueTournaments.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1.5 min-h-[44px]">
              <SlidersHorizontal className="h-4 w-4 text-slate-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-sm font-semibold text-slate-700 outline-none cursor-pointer pr-4"
              >
                <option value="horse-asc">Horse (A - Z)</option>
                <option value="horse-desc">Horse (Z - A)</option>
                <option value="tournament-asc">Championship (A - Z)</option>
                <option value="tournament-desc">Championship (Z - A)</option>
              </select>
            </div>

            {/* Reset Button */}
            {(searchQuery || selectedTournament || sortBy !== "horse-asc") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedTournament("");
                  setSortBy("horse-asc");
                }}
                className="flex items-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-2 text-sm font-bold text-slate-600 hover:border-slate-400 hover:bg-slate-50 transition cursor-pointer min-h-[44px]"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </button>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-800">Approved Horses Needing Jockeys</h2>
            {!loading && filteredAndSortedRegistrations.length > 0 && (
              <span className="text-xs font-semibold text-slate-500">
                Showing {filteredAndSortedRegistrations.length} of {registrations.length} horses
              </span>
            )}
          </div>
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white py-24 text-center text-sm font-bold text-slate-400 shadow-sm">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#006d5b] mb-4" />
              Loading approved horses...
            </div>
          ) : registrations.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
              <FileCheck2 className="mx-auto h-12 w-12 text-[#006d5b]/45" />
              <h3 className="mt-4 text-lg font-black text-slate-900">No approved horses</h3>
              <p className="mt-2 text-sm font-semibold text-slate-500 max-w-md mx-auto">
                None of your registered horses are approved by the organizer yet. Once approved, you can recruit jockeys here.
              </p>
            </div>
          ) : filteredAndSortedRegistrations.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center shadow-sm">
              <Search className="mx-auto h-10 w-10 text-slate-300" />
              <h3 className="mt-4 text-base font-black text-slate-800">No matching horses</h3>
              <p className="mt-2 text-sm font-semibold text-slate-500 max-w-md mx-auto">
                No approved horses matched your search or filters. Try adjusting your query or resetting filters.
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedTournament("");
                  setSortBy("horse-asc");
                }}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#006d5b] px-5 py-2.5 text-xs font-black text-white hover:bg-[#005c4d] transition shadow-sm"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredAndSortedRegistrations.map((reg) => (
                <div
                  key={reg.id}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-[#006d5b]/30 hover:shadow-xl"
                >
                  {/* Card Header Image / Backdrop */}
                  <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                    {reg.horseImageUrl ? (
                      <img
                        src={resolveFileUrl(reg.horseImageUrl)}
                        alt={reg.horseName}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#005f51] to-[#013c33] text-white select-none">
                        <span className="text-4xl font-black tracking-wider opacity-35">
                          {reg.horseName.slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <span className="absolute left-3.5 top-3.5 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/90 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-white shadow-sm backdrop-blur-sm">
                      <CheckCircle2 className="h-3 w-3" />
                      Approved
                    </span>
                  </div>

                  {/* Card Content */}
                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex-1">
                      <h3 className="text-xl font-black text-slate-950 transition-colors group-hover:text-[#006d5b]">
                        {reg.horseName}
                      </h3>
                      
                      <div className="mt-3.5 space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-slate-600 font-semibold">
                          <Calendar className="h-4 w-4 shrink-0 text-[#006d5b]" />
                          <span className="truncate">{reg.tournamentName}</span>
                        </div>
                        {reg.note && (
                          <div className="mt-3 rounded-lg bg-slate-50 p-3 border border-slate-100 text-xs font-semibold text-slate-500 italic leading-relaxed">
                            "{reg.note}"
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100">
                      <button
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#008670] to-[#006d5b] px-4 py-3 text-sm font-black text-white shadow-[0_2px_4px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.15)] transition-all hover:from-[#009b82] hover:to-[#007a66] hover:shadow-lg hover:shadow-[#006d5b]/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006d5b]"
                        onClick={() => openContractModal(reg)}
                        type="button"
                      >
                        <Users className="h-4 w-4" aria-hidden="true" />
                        Browse Jockey Pool
                        <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal goes here */}
        {contractRegistration && (
          <div
            aria-label="Send assignment contract"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 sm:p-6"
            role="dialog"
          >
            <div className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
              {/* HEADER - Fixed */}
              <div className="shrink-0 flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-[#006d5b]">
                    Tournament Assignment Contract
                  </p>
                  <h2 className="mt-1 text-2xl font-black text-slate-950">Send Contract</h2>
                  <p className="mt-1 text-sm font-bold text-slate-500">
                    {contractRegistration.horseName} is approved for {contractRegistration.tournamentName}.
                  </p>
                </div>
                <button
                  aria-label="Close contract form"
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#006d5b]"
                  onClick={closeContractModal}
                  type="button"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>

              {/* BODY - Split Pane */}
              <div className="flex-1 flex flex-col min-h-0 lg:overflow-hidden">
                <div className="flex flex-col min-h-0 lg:flex-1 lg:flex-row">
                  {/* LEFT PANE - Jockey Selection */}
                  <div className="w-full lg:w-1/2 p-6 lg:overflow-y-auto modal-scrollbar min-h-0 flex flex-col border-b border-slate-100 lg:border-b-0">
                    <div className="mb-5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h3 className="text-lg font-black text-slate-950">
                            1. Select Jockey
                          </h3>
                          <p className="mt-1 text-sm font-bold text-slate-500">
                            Only jockeys approved for this pool are shown.
                          </p>
                        </div>
                        {availableJockeys.length > 0 && (
                          <div className="relative w-full sm:max-w-[220px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                              type="text"
                              placeholder="Search by name or email..."
                              value={jockeySearchQuery}
                              onChange={(e) => setJockeySearchQuery(e.target.value)}
                              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-xs font-bold text-slate-800 outline-none focus:border-[#006d5b] focus:bg-white focus:ring-2 focus:ring-[#006d5b]/10 placeholder-slate-400 transition"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {contractLoading ? (
                      <div className="space-y-3">
                        {[1, 2, 3].map((item) => (
                          <div className="h-20 animate-pulse rounded-xl border border-slate-200 bg-slate-50" key={item} />
                        ))}
                      </div>
                    ) : availableJockeys.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center flex-1 flex flex-col justify-center">
                        <Users className="mx-auto h-8 w-8 text-slate-400" aria-hidden="true" />
                        <p className="mt-3 text-sm font-black text-slate-800">No approved jockeys yet</p>
                        <p className="mt-1 text-sm font-bold text-slate-500">
                          Admin must approve jockey pool applications first.
                        </p>
                      </div>
                    ) : (
                      <div className="grid gap-3">
                        {(() => {
                          const filtered = availableJockeys.filter((j) => 
                            j.jockeyName.toLowerCase().includes(jockeySearchQuery.toLowerCase()) || 
                            j.jockeyEmail?.toLowerCase().includes(jockeySearchQuery.toLowerCase())
                          );

                          if (filtered.length === 0) {
                            return (
                              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                                <p className="text-sm font-bold text-slate-500">No jockeys match your search.</p>
                              </div>
                            );
                          }

                          return filtered.map((jockey) => {
                            const selected = selectedJockeyApplicationId === jockey.id;
                            return (
                              <button
                                aria-pressed={selected}
                                className={[
                                  "w-full rounded-xl border p-4 text-left transition-all duration-200 hover:-translate-y-[1px] hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006d5b]",
                                  selected 
                                    ? "border-[#006d5b] bg-[#f0fdfa]/80 backdrop-blur shadow-sm ring-1 ring-[#006d5b] hover:bg-[#f0fdfa]" 
                                    : "border-slate-200 bg-white hover:border-[#006d5b]/20 hover:bg-slate-50/50",
                                ].join(" ")}
                                key={jockey.id}
                                onClick={() => setSelectedJockeyApplicationId(jockey.id)}
                                type="button"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <span className="block text-base font-black text-slate-950">{jockey.jockeyName}</span>
                                    <span className="mt-1 block text-sm font-bold text-slate-500">
                                      {jockey.jockeyEmail || "Approved pool rider"}
                                    </span>
                                  </div>
                                  <div className="flex flex-col items-end gap-2">
                                    <span className="rounded-full border border-emerald-100 bg-emerald-50/60 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-[#006d5b]">
                                      Approved
                                    </span>
                                    {selected && (
                                       <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#006d5b] text-white shadow-sm shadow-[#006d5b]/20">
                                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                       </span>
                                    )}
                                  </div>
                                </div>
                                {jockey.message && (
                                  <p className="mt-3 text-sm font-semibold leading-6 text-slate-600 bg-white/50 p-3 rounded-lg border border-slate-100">
                                    "{jockey.message}"
                                  </p>
                                )}
                              </button>
                            );
                          });
                        })()}
                      </div>
                    )}
                  </div>

                  {/* RIGHT PANE - Contract Details */}
                  <div className="w-full lg:w-1/2 border-t border-slate-200 bg-gradient-to-b from-slate-50/80 to-slate-100/50 p-5 lg:border-l lg:border-t-0 lg:overflow-y-auto modal-scrollbar flex flex-col gap-4 min-h-0">
                    <div className="shrink-0">
                      <h3 className="text-lg font-black text-slate-950">
                        2. Contract Details
                      </h3>
                      <p className="text-sm font-bold text-slate-500">
                        Add an optional message or agreement PDF.
                      </p>
                    </div>

                    {/* Selected Jockey Summary Card */}
                    {selectedJockeyApplicationId ? (
                      <div className="flex items-center gap-3 rounded-xl border border-emerald-200/80 bg-[#f0fdfa]/90 p-3 shadow-sm transition-all duration-200 shrink-0">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#006d5b] text-white shadow-md shadow-[#006d5b]/10">
                           <Users className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-[0.12em] text-[#006d5b]">Selected Jockey</p>
                          <p className="text-sm font-black text-slate-900 mt-0.5">
                             {availableJockeys.find(j => j.id === selectedJockeyApplicationId)?.jockeyName}
                          </p>
                          <p className="text-xs font-semibold text-slate-500">
                             {availableJockeys.find(j => j.id === selectedJockeyApplicationId)?.jockeyEmail || "Approved pool rider"}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-slate-200 bg-white/80 p-4 text-center shadow-sm shrink-0">
                        <Users className="mx-auto h-6 w-6 text-slate-300" />
                        <p className="text-xs font-bold text-slate-500 mt-1">No jockey selected yet.</p>
                        <p className="text-[11px] text-slate-400 mt-0.5 font-semibold">Choose a rider from the pool on the left.</p>
                      </div>
                    )}

                    <div className="space-y-3.5 flex-1 min-h-0">
                      <label className="block">
                        <span className="text-xs font-black text-slate-800">Owner message</span>
                        <textarea
                          className="mt-1.5 min-h-[72px] w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-900 outline-none focus:border-[#006d5b] focus:ring-2 focus:ring-[#006d5b]/20 resize-none transition"
                          onChange={(event) => setContractMessage(event.target.value)}
                          value={contractMessage}
                        />
                      </label>

                      <div className="rounded-xl border border-slate-200 bg-white/70 p-3 shadow-sm hover:border-[#006d5b]/30 hover:bg-white transition-all">
                        <label htmlFor="agreement-file-input" className="block text-xs font-black text-slate-800 cursor-pointer">
                          Agreement file (Optional)
                        </label>
                        <div className="mt-2 flex items-center gap-3 bg-slate-50/60 p-2 rounded-lg border border-slate-100/80">
                          <input
                            id="agreement-file-input"
                            ref={fileInputRef}
                            type="file"
                            accept="application/pdf"
                            className="hidden"
                            onChange={(event) => {
                              const file = event.target.files?.[0] ?? null;
                              setAgreementFile(file);
                              if (file) {
                                setAgreementFileName(file.name);
                              }
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="inline-flex min-h-8 items-center justify-center rounded-md bg-[#006d5b] px-3.5 text-xs font-black text-white hover:bg-[#004d3d] transition cursor-pointer shadow-sm shadow-[#006d5b]/10"
                          >
                            Choose File
                          </button>
                          <span className="text-xs font-semibold text-slate-500 truncate flex-1 min-w-0 pr-2">
                            {agreementFile ? agreementFile.name : "No file chosen"}
                          </span>
                          {agreementFile && (
                            <button
                              type="button"
                              onClick={() => {
                                  setAgreementFile(null);
                                  setAgreementFileName("");
                                  if (fileInputRef.current) fileInputRef.current.value = "";
                              }}
                              className="text-xs font-black text-rose-600 hover:text-rose-800 transition pr-1"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        <p className="mt-1.5 text-[10px] text-slate-500 font-semibold leading-normal">
                          Upload PDF if you require the jockey to review terms.
                        </p>
                      </div>

                      {agreementFile && (
                         <label className="block">
                           <span className="text-xs font-black text-slate-800">File display name</span>
                           <input
                             className="mt-1.5 min-h-10 w-full rounded-lg border border-slate-300 px-4 text-xs font-bold text-slate-900 outline-none focus:border-[#006d5b] focus:ring-2 focus:ring-[#006d5b]/20 transition"
                             onChange={(event) => setAgreementFileName(event.target.value)}
                             placeholder="assignment-agreement.pdf"
                             value={agreementFileName}
                           />
                         </label>
                      )}

                      {contractError && (
                        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-700" role="alert">
                          {contractError}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* FOOTER - Fixed */}
              <div className="shrink-0 flex items-center justify-between border-t border-slate-200 bg-white px-6 py-4">
                 <p className="text-sm font-bold text-slate-500 hidden sm:block">
                    {selectedJockeyApplicationId ? "Ready to send." : "Please select a jockey first."}
                 </p>
                 <div className="flex w-full sm:w-auto gap-3">
                  <button
                    className="flex-1 sm:flex-none inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 text-sm font-black text-slate-700 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006d5b]"
                    onClick={closeContractModal}
                    type="button"
                  >
                    Cancel
                  </button>
                  <button
                    className="flex-1 sm:flex-none inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#008670] to-[#006d5b] px-6 text-sm font-black text-white shadow-[0_1px_2px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.2)] transition-all hover:from-[#009b82] hover:to-[#007a66] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006d5b]"
                    disabled={!selectedJockeyApplicationId || contractSubmitting}
                    onClick={handleSendContract}
                    type="button"
                  >
                    <Send className="h-4 w-4" aria-hidden="true" />
                    {contractSubmitting ? "Sending..." : "Send Contract"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </OwnerLayout>
  );
}
