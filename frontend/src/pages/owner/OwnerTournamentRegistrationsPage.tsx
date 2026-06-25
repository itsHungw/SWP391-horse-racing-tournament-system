import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FileText, Send, Users, X } from "lucide-react";
import {
  createOwnerTournamentRegistration,
  getOwnerHorses,
  getOwnerTournamentRegistrationsPage,
  getPublicTournaments,
  withdrawOwnerTournamentRegistration,
} from "../../api/racingApi";
import { PaginationControls } from "../../components/common/PaginationControls";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { OwnerLayout } from "../../layouts/OwnerLayout";
import type { Horse, Tournament, TournamentRegistration } from "../../types/racing";
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



  return (
    <OwnerLayout>
      <section aria-labelledby="owner-registrations-title" className="space-y-6">
        <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="absolute top-0 left-0 h-1.5 w-full bg-gradient-to-r from-[#008670] to-[#006d5b]"></div>
          <p className="text-sm font-black uppercase tracking-[0.14em] text-[#006d5b]">Tournament desk</p>
          <h1 id="owner-registrations-title" className="mt-2 text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
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
                            <a
                              className="inline-flex items-center gap-1 rounded-md border border-[#006d5b]/20 bg-emerald-50 px-2.5 py-1.5 text-xs font-black text-[#006d5b] hover:bg-emerald-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006d5b]"
                              href="/owner/invitations"
                            >
                              <Users className="h-3.5 w-3.5" aria-hidden="true" />
                              Jockey Pool
                            </a>
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


      </section>
    </OwnerLayout>
  );
}
