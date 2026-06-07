import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FileText, Send, Users, X } from "lucide-react";
import {
  createOwnerTournamentRegistration,
  getOwnerHorses,
  getOwnerAvailableJockeys,
  getOwnerTournamentRegistrationsPage,
  getPublicTournaments,
  sendOwnerContract,
  withdrawOwnerTournamentRegistration,
} from "../../api/racingApi";
import { PaginationControls } from "../../components/common/PaginationControls";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { OwnerLayout } from "../../layouts/OwnerLayout";
import type { Horse, JockeyPoolApplication, Tournament, TournamentRegistration } from "../../types/racing";
import { getApiErrorMessage } from "../../utils/apiError";

import { RegistrationWizardHeader } from "./components/RegistrationWizardHeader";
import { StepSelectTournament } from "./components/StepSelectTournament";
import { StepSelectHorse } from "./components/StepSelectHorse";
import { StepConfirmRegistration } from "./components/StepConfirmRegistration";
import { RegistrationStatusTimeline } from "./components/RegistrationStatusTimeline";

const REGISTRATION_HISTORY_PAGE_SIZE = 8;

export function OwnerTournamentRegistrationsPage() {
  useDocumentTitle("Tournament Registrations - Owner");
  const [searchParams] = useSearchParams();
  const focusedRegistrationId = Number(searchParams.get("registrationId") || 0);

  // Wizard States
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [selectedHorse, setSelectedHorse] = useState<Horse | null>(null);
  const [note, setNote] = useState("");

  // Database States
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [horses, setHorses] = useState<Horse[]>([]);
  const [registrations, setRegistrations] = useState<TournamentRegistration[]>([]);

  // Operation UI States
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pageMessage, setPageMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [activeTimelineReg, setActiveTimelineReg] = useState<TournamentRegistration | null>(null);
  const [registrationPage, setRegistrationPage] = useState(1);
  const [registrationPageMeta, setRegistrationPageMeta] = useState({
    number: 0,
    size: REGISTRATION_HISTORY_PAGE_SIZE,
    totalElements: 0,
    totalPages: 1,
  });
  const [focusedPageResolved, setFocusedPageResolved] = useState(false);
  const [contractRegistration, setContractRegistration] = useState<TournamentRegistration | null>(null);
  const [availableJockeys, setAvailableJockeys] = useState<JockeyPoolApplication[]>([]);
  const [selectedJockeyApplicationId, setSelectedJockeyApplicationId] = useState<number | "">("");
  const [contractMessage, setContractMessage] = useState("");
  const [agreementUrl, setAgreementUrl] = useState("");
  const [agreementFileName, setAgreementFileName] = useState("");
  const [contractLoading, setContractLoading] = useState(false);
  const [contractSubmitting, setContractSubmitting] = useState(false);
  const [contractError, setContractError] = useState("");

  const loadWorkspaceData = useCallback(async () => {
    setLoading(true);
    try {
      const [tournamentData, horseData, registrationData] = await Promise.all([
        getPublicTournaments(),
        getOwnerHorses(),
        getOwnerTournamentRegistrationsPage({
          page: registrationPage - 1,
          size: REGISTRATION_HISTORY_PAGE_SIZE,
          focusId: focusedRegistrationId && !focusedPageResolved ? focusedRegistrationId : undefined,
        }),
      ]);
      const nextRegistrations = Array.isArray(registrationData.content) ? registrationData.content : [];
      setTournaments(Array.isArray(tournamentData) ? tournamentData : []);
      setHorses(Array.isArray(horseData) ? horseData : []);
      setRegistrations(nextRegistrations);
      setRegistrationPageMeta({
        number: registrationData.number,
        size: registrationData.size,
        totalElements: registrationData.totalElements,
        totalPages: registrationData.totalPages,
      });
      if (registrationData.number + 1 !== registrationPage) {
        setRegistrationPage(registrationData.number + 1);
      }
      if (focusedRegistrationId) {
        setFocusedPageResolved(true);
        const focusedRegistration = nextRegistrations.find((registration) => registration.id === focusedRegistrationId);
        if (focusedRegistration) {
          setActiveTimelineReg(focusedRegistration);
        }
      }
      setPageMessage(null);
    } catch (error) {
      setPageMessage(getApiErrorMessage(error, "Could not load registration data."));
    } finally {
      setLoading(false);
    }
  }, [focusedPageResolved, focusedRegistrationId, registrationPage]);

  useEffect(() => {
    void loadWorkspaceData();
  }, [loadWorkspaceData]);

  useEffect(() => {
    setFocusedPageResolved(false);
  }, [focusedRegistrationId]);

  useEffect(() => {
    if (!loading && focusedRegistrationId) {
      document.getElementById(`registration-${focusedRegistrationId}`)?.scrollIntoView({
        block: "center",
        behavior: "smooth",
      });
    }
  }, [focusedRegistrationId, loading, registrations]);

  const currentRegistrationPage = registrationPageMeta.number + 1;

  const handleSelectTournament = (tournament: Tournament) => {
    setSelectedTournament(tournament);
    setCurrentStep(2);
  };

  const handleSelectHorse = (horse: Horse) => {
    setSelectedHorse(horse);
    setCurrentStep(3);
  };

  const handleBackStep = () => {
    setSubmitError(null);
    setCurrentStep((prev) => prev - 1);
  };

  const handleFinalSubmit = async () => {
    if (!selectedTournament || !selectedHorse) return;

    setSaving(true);
    setSubmitError(null);
    try {
      const payload = {
        tournamentId: selectedTournament.id,
        horseId: selectedHorse.id,
        note: note.trim() || undefined,
      };
      const newReg = await createOwnerTournamentRegistration(payload);

      setSelectedTournament(null);
      setSelectedHorse(null);
      setNote("");
      setCurrentStep(1);

      setPageMessage("Registration submitted successfully and is pending admin review!");
      await loadWorkspaceData();

      const updatedReg = newReg.id ? newReg : null;
      if (updatedReg) {
        setActiveTimelineReg(updatedReg);
      }
    } catch (error) {
      setSubmitError(getApiErrorMessage(error, "Could not submit this registration."));
    } finally {
      setSaving(false);
    }
  };

  const handleWithdraw = async (registration: TournamentRegistration) => {
    setSaving(true);
    setPageMessage(null);
    try {
      await withdrawOwnerTournamentRegistration(registration.id);
      setPageMessage(`${registration.horseName} has been withdrawn from ${registration.tournamentName}.`);
      await loadWorkspaceData();
      if (activeTimelineReg && activeTimelineReg.id === registration.id) {
        setActiveTimelineReg({ ...activeTimelineReg, status: "WITHDRAWN" });
      }
    } catch (error) {
      setPageMessage(getApiErrorMessage(error, "Could not withdraw this registration."));
    } finally {
      setSaving(false);
    }
  };

  const openContractModal = async (registration: TournamentRegistration) => {
    setContractRegistration(registration);
    setSelectedJockeyApplicationId("");
    setContractMessage(`We would like you to ride ${registration.horseName} in ${registration.tournamentName}.`);
    setAgreementUrl("");
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
    setContractError("");
  };

  const handleSendContract = async () => {
    if (!contractRegistration || !selectedJockeyApplicationId) return;

    setContractSubmitting(true);
    setContractError("");
    try {
      const contract = await sendOwnerContract(contractRegistration.tournamentId, {
        horseRegistrationId: contractRegistration.id,
        jockeyApplicationId: selectedJockeyApplicationId,
        message: contractMessage.trim() || undefined,
        agreementUrl: agreementUrl.trim() || undefined,
        agreementFileName: agreementFileName.trim() || undefined,
      });
      setPageMessage(
        `Contract sent to ${contract.jockeyName} for ${contract.horseName}. Waiting for jockey response.`,
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
      <section aria-labelledby="owner-registrations-title" className="space-y-6">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.14em] text-[#006d5b]">Tournament desk</p>
          <h1 id="owner-registrations-title" className="mt-2 text-4xl font-black tracking-tight">
            Tournament Registrations
          </h1>
          <p className="mt-2 max-w-3xl text-base leading-7 text-slate-600">
            Submit approved horses into open registration windows and track admin review status.
          </p>
        </div>

        {pageMessage && (
          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-5 py-4 text-xs font-bold text-slate-700 shadow-sm" role="status">
            <span>{pageMessage}</span>
            <button aria-label="Dismiss message" onClick={() => setPageMessage(null)} className="cursor-pointer text-slate-400 hover:text-slate-600">
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Wizard Panel */}
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <RegistrationWizardHeader currentStep={currentStep} />

          <div className="mt-6">
            {currentStep === 1 && (
              <StepSelectTournament
                tournaments={tournaments}
                loading={loading}
                onSelect={handleSelectTournament}
              />
            )}

            {currentStep === 2 && selectedTournament && (
              <StepSelectHorse
                selectedTournament={selectedTournament}
                horses={horses}
                onPrev={handleBackStep}
                onNext={handleSelectHorse}
              />
            )}

            {currentStep === 3 && selectedTournament && selectedHorse && (
              <StepConfirmRegistration
                selectedTournament={selectedTournament}
                selectedHorse={selectedHorse}
                note={note}
                onChangeNote={setNote}
                saving={saving}
                submitError={submitError}
                onPrev={handleBackStep}
                onSubmit={handleFinalSubmit}
              />
            )}
          </div>
        </div>

        {/* Status Timeline */}
        {activeTimelineReg && (
          <RegistrationStatusTimeline
            registration={activeTimelineReg}
            onClose={() => setActiveTimelineReg(null)}
          />
        )}

        {/* Registration History */}
        <div className="space-y-4">
          <h2 className="text-xl font-black text-slate-800">Registration History & Status</h2>
          {loading ? (
            <div className="rounded-lg border border-slate-200 bg-white py-16 text-center text-sm font-bold text-slate-400">
              Loading registrations...
            </div>
          ) : registrations.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white py-16 text-center text-sm font-bold text-slate-500">
              No registration records in this workspace.
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                  <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-6 py-3.5">Tournament</th>
                      <th className="px-6 py-3.5">Horse</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5">Note</th>
                      <th className="px-6 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-semibold text-slate-700">
                    {registrations.map((registration) => {
                      const isFocusedRegistration = registration.id === focusedRegistrationId;

                      return (
                      <tr
                        id={`registration-${registration.id}`}
                        key={registration.id}
                        className={isFocusedRegistration ? "bg-red-50/70 ring-2 ring-inset ring-red-200" : "hover:bg-slate-50/50"}
                      >
                        <td className="px-6 py-4 font-black text-slate-800">{registration.tournamentName}</td>
                        <td className="px-6 py-4">{registration.horseName}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-black border uppercase ${
                            registration.status === "APPROVED"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                              : registration.status === "PENDING"
                              ? "bg-amber-50 text-amber-700 border-amber-100"
                              : registration.status === "REJECTED"
                              ? "bg-rose-50 text-rose-700 border-rose-100"
                              : "bg-slate-50 text-slate-500 border-slate-100"
                          }`}>
                            {registration.status}
                          </span>
                          {registration.rejectionReason && (
                            <p className="mt-1 text-[10px] text-rose-600 font-medium">Reason: {registration.rejectionReason}</p>
                          )}
                        </td>
                        <td className="px-6 py-4 text-slate-500 font-normal italic">{registration.note || "No note"}</td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button
                            className="text-xs font-black text-[#006d5b] hover:underline cursor-pointer"
                            onClick={() => setActiveTimelineReg(registration)}
                            type="button"
                          >
                            Track Status
                          </button>
                          <button
                            className="text-xs font-black text-rose-600 hover:text-rose-800 hover:underline disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                            disabled={registration.status !== "PENDING" || saving}
                            onClick={() => handleWithdraw(registration)}
                            type="button"
                          >
                            Withdraw
                          </button>
                          {registration.status === "APPROVED" && (
                            <button
                              className="inline-flex items-center gap-1 rounded-md border border-[#006d5b]/20 bg-emerald-50 px-2.5 py-1.5 text-xs font-black text-[#006d5b] hover:bg-emerald-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006d5b]"
                              onClick={() => openContractModal(registration)}
                              type="button"
                            >
                              <Users className="h-3.5 w-3.5" aria-hidden="true" />
                              Jockey Pool
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                    })}
                  </tbody>
                </table>
              </div>
              {registrationPageMeta.totalElements > REGISTRATION_HISTORY_PAGE_SIZE && (
                <PaginationControls
                  currentPage={currentRegistrationPage}
                  onPageChange={setRegistrationPage}
                  pageSize={REGISTRATION_HISTORY_PAGE_SIZE}
                  totalItems={registrationPageMeta.totalElements}
                />
              )}
            </div>
          )}
        </div>

        {contractRegistration && (
          <div
            aria-label="Send assignment contract"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 p-4 sm:items-center"
            role="dialog"
          >
            <div className="max-h-[90vh] w-full max-w-4xl overflow-auto rounded-lg border border-slate-200 bg-white shadow-xl">
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-[#006d5b]">
                    Tournament Assignment Contract
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-slate-950">Send Contract</h2>
                  <p className="mt-1 text-sm font-bold text-slate-500">
                    {contractRegistration.horseName} is approved for {contractRegistration.tournamentName}. Choose a jockey
                    from the approved pool for this championship.
                  </p>
                </div>
                <button
                  aria-label="Close contract form"
                  className="grid h-10 w-10 place-items-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006d5b]"
                  onClick={closeContractModal}
                  type="button"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              <div className="grid gap-5 p-5 lg:grid-cols-[1.1fr_0.9fr]">
                <section aria-labelledby="approved-pool-title" className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <h3 id="approved-pool-title" className="text-lg font-black text-slate-950">
                    Approved Jockey Pool
                  </h3>
                  <p className="mt-1 text-sm font-bold text-slate-500">
                    Only jockeys approved for this championship pool can receive contracts.
                  </p>

                  {contractLoading ? (
                    <div className="mt-4 space-y-3">
                      {[1, 2, 3].map((item) => (
                        <div className="h-20 animate-pulse rounded-md border border-slate-200 bg-white" key={item} />
                      ))}
                    </div>
                  ) : availableJockeys.length === 0 ? (
                    <div className="mt-4 rounded-md border border-dashed border-slate-300 bg-white p-6 text-center">
                      <Users className="mx-auto h-8 w-8 text-slate-400" aria-hidden="true" />
                      <p className="mt-3 text-sm font-black text-slate-800">No approved jockeys in this pool yet</p>
                      <p className="mt-1 text-sm font-bold text-slate-500">
                        Admin must approve jockey pool applications before owners can send contracts.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-4 space-y-3">
                      {availableJockeys.map((jockey) => {
                        const selected = selectedJockeyApplicationId === jockey.id;
                        return (
                          <button
                            aria-pressed={selected}
                            className={[
                              "w-full rounded-lg border p-4 text-left transition hover:border-[#006d5b]/40 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006d5b]",
                              selected ? "border-[#006d5b] bg-white shadow-sm" : "border-slate-200 bg-white/80",
                            ].join(" ")}
                            key={jockey.id}
                            onClick={() => setSelectedJockeyApplicationId(jockey.id)}
                            type="button"
                          >
                            <span className="flex items-start justify-between gap-3">
                              <span>
                                <span className="block text-base font-black text-slate-950">{jockey.jockeyName}</span>
                                <span className="mt-1 block text-sm font-bold text-slate-500">
                                  {jockey.jockeyEmail || "Approved pool rider"}
                                </span>
                              </span>
                              <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-black uppercase tracking-[0.12em] text-[#006d5b]">
                                Approved
                              </span>
                            </span>
                            {jockey.message && (
                              <span className="mt-3 block text-sm font-semibold leading-6 text-slate-600">
                                {jockey.message}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </section>

                <section aria-labelledby="contract-terms-title" className="rounded-lg border border-slate-200 bg-white p-4">
                  <h3 id="contract-terms-title" className="text-lg font-black text-slate-950">
                    Contract Details
                  </h3>
                  <div className="mt-4 grid gap-4">
                    <label className="block">
                      <span className="text-sm font-black text-slate-800">Owner message</span>
                      <textarea
                        className="mt-2 min-h-28 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-bold text-slate-900 outline-none focus:border-[#006d5b] focus:ring-2 focus:ring-emerald-100"
                        onChange={(event) => setContractMessage(event.target.value)}
                        value={contractMessage}
                      />
                    </label>

                    <label className="block">
                      <span className="text-sm font-black text-slate-800">Agreement URL</span>
                      <input
                        className="mt-2 min-h-11 w-full rounded-md border border-slate-300 px-3 text-sm font-bold text-slate-900 outline-none focus:border-[#006d5b] focus:ring-2 focus:ring-emerald-100"
                        onChange={(event) => setAgreementUrl(event.target.value)}
                        placeholder="https://..."
                        type="url"
                        value={agreementUrl}
                      />
                    </label>

                    <label className="block">
                      <span className="text-sm font-black text-slate-800">Agreement file name</span>
                      <input
                        className="mt-2 min-h-11 w-full rounded-md border border-slate-300 px-3 text-sm font-bold text-slate-900 outline-none focus:border-[#006d5b] focus:ring-2 focus:ring-emerald-100"
                        onChange={(event) => setAgreementFileName(event.target.value)}
                        placeholder="assignment-agreement.pdf"
                        value={agreementFileName}
                      />
                    </label>

                    <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4">
                      <div className="flex gap-3">
                        <FileText className="mt-0.5 h-5 w-5 shrink-0 text-[#006d5b]" aria-hidden="true" />
                        <div>
                          <p className="text-sm font-black text-slate-950">Agreement is optional in v1</p>
                          <p className="mt-1 text-sm font-bold leading-6 text-slate-600">
                            Use this field when the stable wants the jockey to review assignment terms before accepting.
                          </p>
                        </div>
                      </div>
                    </div>

                    {contractError && (
                      <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm font-bold text-rose-700" role="alert">
                        {contractError}
                      </div>
                    )}
                  </div>
                </section>
              </div>

              <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 bg-slate-50 p-5">
                <button
                  className="inline-flex min-h-11 items-center rounded-md border border-slate-300 bg-white px-4 text-sm font-black text-slate-700 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006d5b]"
                  onClick={closeContractModal}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="inline-flex min-h-11 items-center gap-2 rounded-md bg-[#006d5b] px-5 text-sm font-black text-white hover:bg-[#004d3d] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006d5b]"
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
        )}
      </section>
    </OwnerLayout>
  );
}
