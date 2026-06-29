import { type FormEvent, useEffect, useState } from "react";
import { ArrowLeft, FileText, HeartPulse, Image as ImageIcon, ListChecks, Plus, Trophy, Upload, X } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import {
  createOwnerHorseDocument,
  getOwnerHorse,
  getOwnerHorseDocuments,
  getOwnerTournamentRegistrationsPage,
  updateOwnerHorse,
  withdrawOwnerTournamentRegistration,
} from "../../api/racingApi";
import { AuthenticatedFileLink } from "../../components/AuthenticatedFileLink";
import { PaginationControls } from "../../components/common/PaginationControls";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { OwnerLayout } from "../../layouts/OwnerLayout";
import type { Horse, HorseDocument, HorseDocumentPayload, HorseDocumentType, OwnerHorseUpdateRequest, TournamentRegistration } from "../../types/racing";
import { getApiErrorMessage } from "../../utils/apiError";

type ProfileTab = "overview" | "registrations" | "health";

const tabs: Array<{ id: ProfileTab; label: string; icon: typeof ListChecks }> = [
  { id: "overview", label: "Overview", icon: ListChecks },
  { id: "registrations", label: "Tournament Registrations", icon: Trophy },
  { id: "health", label: "Health Notes", icon: HeartPulse },
];
const HORSE_PROFILE_REGISTRATIONS_PAGE_SIZE = 5;

type DocumentFormState = Omit<HorseDocumentPayload, "documentFile"> & {
  documentFile: File | null;
};
type DocumentFormTextField = Exclude<keyof DocumentFormState, "documentFile">;

const emptyDocumentForm: DocumentFormState = {
  documentType: "HEALTH_CERTIFICATE",
  referenceNumber: "",
  issueDate: "",
  expiryDate: "",
  issuer: "",
  notes: "",
  documentFile: null,
};

export function OwnerHorseProfilePage() {
  const { horseId } = useParams();
  const [horse, setHorse] = useState<Horse | null>(null);
  const [documents, setDocuments] = useState<HorseDocument[]>([]);
  const [registrations, setRegistrations] = useState<TournamentRegistration[]>([]);
  const [registrationPage, setRegistrationPage] = useState(1);
  const [registrationPageMeta, setRegistrationPageMeta] = useState({
    number: 0,
    size: HORSE_PROFILE_REGISTRATIONS_PAGE_SIZE,
    totalElements: 0,
    totalPages: 1,
  });
  const [activeTab, setActiveTab] = useState<ProfileTab>("overview");
  const [documentPanelOpen, setDocumentPanelOpen] = useState(false);
  const [documentForm, setDocumentForm] = useState<DocumentFormState>(emptyDocumentForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [editPanelOpen, setEditPanelOpen] = useState(false);
  const [editForm, setEditForm] = useState<OwnerHorseUpdateRequest>({
    name: "",
    breed: "",
    gender: "",
    dateOfBirth: "",
    color: "",
    heightCm: undefined,
    weightKg: undefined,
    healthStatus: "",
    medicalNote: "",
    description: "",
  });

  useDocumentTitle(horse ? `${horse.name} profile` : "Horse profile");

  const numericHorseId = Number(horseId);

  useEffect(() => {
    setRegistrationPage(1);
  }, [numericHorseId]);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      try {
        const [horseData, registrationData, documentData] = await Promise.all([
          getOwnerHorse(numericHorseId),
          getOwnerTournamentRegistrationsPage({
            page: registrationPage - 1,
            size: HORSE_PROFILE_REGISTRATIONS_PAGE_SIZE,
            horseId: numericHorseId,
          }),
          getOwnerHorseDocuments(numericHorseId),
        ]);
        if (active) {
          setHorse(horseData);
          setRegistrations(Array.isArray(registrationData.content) ? registrationData.content : []);
          setRegistrationPageMeta({
            number: registrationData.number,
            size: registrationData.size,
            totalElements: registrationData.totalElements,
            totalPages: registrationData.totalPages,
          });
          setDocuments(Array.isArray(documentData) ? documentData : []);
          setMessage(null);
        }
      } catch (error) {
        if (active) {
          setMessage(getApiErrorMessage(error, "Could not load this horse profile."));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    if (Number.isFinite(numericHorseId)) {
      void load();
    } else {
      setLoading(false);
      setMessage("Horse profile not found.");
    }

    return () => {
      active = false;
    };
  }, [numericHorseId, registrationPage]);

  const reloadRegistrations = async () => {
    const registrationData = await getOwnerTournamentRegistrationsPage({
      page: registrationPage - 1,
      size: HORSE_PROFILE_REGISTRATIONS_PAGE_SIZE,
      horseId: numericHorseId,
    });
    setRegistrations(Array.isArray(registrationData.content) ? registrationData.content : []);
    setRegistrationPageMeta({
      number: registrationData.number,
      size: registrationData.size,
      totalElements: registrationData.totalElements,
      totalPages: registrationData.totalPages,
    });
  };

  const reloadDocuments = async () => {
    const documentData = await getOwnerHorseDocuments(numericHorseId);
    setDocuments(Array.isArray(documentData) ? documentData : []);
  };

  const handleWithdraw = async (registration: TournamentRegistration) => {
    setSaving(true);
    setMessage(null);
    try {
      await withdrawOwnerTournamentRegistration(registration.id);
      setMessage(`${registration.horseName} withdrawn from ${registration.tournamentName}.`);
      await reloadRegistrations();
    } catch (error) {
      setMessage(getApiErrorMessage(error, "Could not withdraw this registration."));
    } finally {
      setSaving(false);
    }
  };

  const updateDocumentField = (field: DocumentFormTextField, value: string) => {
    setDocumentForm((current) => ({ ...current, [field]: value }));
  };

  const updateDocumentFile = (file: File | null) => {
    setDocumentForm((current) => ({ ...current, documentFile: file }));
  };

  const openDocumentPanel = (documentType: HorseDocumentType = "HEALTH_CERTIFICATE") => {
    setDocumentForm({ ...emptyDocumentForm, documentType });
    setDocumentPanelOpen(true);
  };

  const handleDocumentCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);

    if (!horse || !documentForm.documentFile) {
      setMessage("Document attachment is required.");
      return;
    }

    setSaving(true);
    try {
      await createOwnerHorseDocument(horse.id, {
        ...documentForm,
        documentFile: documentForm.documentFile,
      });
      setDocumentForm(emptyDocumentForm);
      setDocumentPanelOpen(false);
      setMessage("Horse document uploaded.");
      await reloadDocuments();
    } catch (error) {
      setMessage(getApiErrorMessage(error, "Could not upload this document."));
    } finally {
      setSaving(false);
    }
  };

  const updateEditField = (field: keyof OwnerHorseUpdateRequest, value: string) => {
    setEditForm((current) => ({
      ...current,
      [field]: field === "heightCm" || field === "weightKg" ? (value.trim() ? Number(value) : undefined) : value,
    }));
  };

  const handleEditSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!horse) return;
    setMessage(null);
    setSaving(true);
    try {
      const updatedHorse = await updateOwnerHorse(horse.id, editForm);
      setHorse(updatedHorse);
      setEditPanelOpen(false);
      setMessage("Horse profile updated successfully.");
    } catch (error) {
      setMessage(getApiErrorMessage(error, "Could not update horse details."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <OwnerLayout>
      <section aria-labelledby="horse-profile-title" className="space-y-6">
        <Link
          className="inline-flex min-h-11 items-center gap-2 rounded-md px-2 text-sm font-black text-slate-700 hover:text-[#006d5b]"
          to="/owner/horses"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Roster
        </Link>

        {message && (
          <p className="rounded-md border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700" role="status">
            {message}
          </p>
        )}

        {loading ? (
          <div className="rounded-lg border border-slate-200 bg-white py-16 text-center text-sm font-bold text-slate-500">
            Loading horse profile...
          </div>
        ) : horse ? (
          <>
            <header className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:p-8 mb-6">
              <div className="absolute top-0 left-0 h-1.5 w-full bg-gradient-to-r from-[#008670] to-[#006d5b]"></div>
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <h1 id="horse-profile-title" className="text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
                  {horse.name}
                </h1>
                <p className="mt-2 text-base leading-7 text-slate-600">
                  {[horse.breed, titleCase(horse.gender), horse.color, horse.registrationCode && `Code ${horse.registrationCode}`]
                    .filter(Boolean)
                    .join(" - ") || "Profile details pending"}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge status={horse.status} />
                <button
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-black text-slate-700 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006d5b] cursor-pointer"
                  onClick={() => {
                    if (horse) {
                      setEditForm({
                        name: horse.name,
                        breed: horse.breed || "",
                        gender: horse.gender,
                        dateOfBirth: horse.dateOfBirth || "",
                        color: horse.color || "",
                        heightCm: horse.heightCm,
                        weightKg: horse.weightKg,
                        healthStatus: horse.healthStatus || "",
                        medicalNote: horse.medicalNote || "",
                        description: horse.description || "",
                      });
                      setEditPanelOpen(true);
                    }
                  }}
                  type="button"
                >
                  Edit Profile
                </button>
                {horse.status === "APPROVED" ? (
                  <Link
                    className="inline-flex min-h-11 items-center rounded-md bg-[#006d5b] px-5 text-sm font-black text-white hover:bg-[#004d3d]"
                    to="/owner/registrations"
                  >
                    Register Tournament
                  </Link>
                ) : (
                  <span className="rounded-md border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600">
                    {horse.status === "PENDING"
                      ? "Admin review is still pending."
                      : "Resolve the rejection before registering."}
                  </span>
                )}
              </div>
              </div>
            </header>

            <nav aria-label="Horse profile sections" className="flex gap-2 overflow-x-auto border-b border-slate-200">
              {tabs.map((tab) => (
                <button
                  className={`inline-flex min-h-12 min-w-max items-center gap-2 border-b-2 px-3 text-sm font-black ${
                    activeTab === tab.id
                      ? "border-[#006d5b] text-[#006d5b]"
                      : "border-transparent text-slate-600 hover:text-slate-950"
                  }`}
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  type="button"
                >
                  <tab.icon className="h-4 w-4" aria-hidden="true" />
                  {tab.label}
                </button>
              ))}
            </nav>

            {activeTab === "overview" && <OverviewTab documents={documents} horse={horse} onAddDocument={openDocumentPanel} />}
            {activeTab === "registrations" && (
              <RegistrationsTab
                disabled={saving}
                horse={horse}
                onWithdraw={handleWithdraw}
                onPageChange={setRegistrationPage}
                page={registrationPageMeta.number + 1}
                pageSize={HORSE_PROFILE_REGISTRATIONS_PAGE_SIZE}
                registrations={registrations}
                totalRegistrations={registrationPageMeta.totalElements}
              />
            )}
            {activeTab === "health" && <HealthTab horse={horse} />}

            {documentPanelOpen && (
              <DocumentModal
                disabled={saving}
                form={documentForm}
                horse={horse}
                onChange={updateDocumentField}
                onClose={() => setDocumentPanelOpen(false)}
                onFileChange={updateDocumentFile}
                onSubmit={handleDocumentCreate}
              />
            )}

            {editPanelOpen && (
              <div
                aria-label="Edit horse details"
                aria-modal="true"
                className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 sm:p-6"
                role="dialog"
              >
                <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
                  {/* HEADER - Fixed */}
                  <div className="shrink-0 flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-[#006d5b]">Modify profile</p>
                      <h2 id="edit-horse-title" className="text-2xl font-black text-slate-950">
                        Edit Horse Details
                      </h2>
                    </div>
                    <button
                      aria-label="Close edit horse panel"
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006d5b]"
                      onClick={() => setEditPanelOpen(false)}
                      type="button"
                    >
                      <X className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </div>

                  {/* BODY - Split Pane */}
                  <form className="flex-1 flex flex-col min-h-0" onSubmit={handleEditSubmit}>
                    <div className="flex-1 flex flex-col min-h-0 lg:flex-row">
                      {/* LEFT PANE - Basic Info */}
                      <div className="w-full lg:w-1/2 p-6 lg:overflow-y-auto modal-scrollbar min-h-0 flex flex-col gap-4 border-b border-slate-100 lg:border-b-0">
                        <h3 className="text-lg font-black text-slate-950 mb-2">1. Basic Details</h3>
                        
                        <div className="grid gap-4 md:grid-cols-2">
                          <TextField
                            label="Horse name"
                            onChange={(value) => updateEditField("name", value)}
                            required
                            value={editForm.name}
                          />
                          <label className="space-y-1 text-sm font-bold text-slate-700">
                            <span>Gender</span>
                            <select
                              className="min-h-11 w-full rounded-md border border-slate-300 px-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#006d5b]"
                              onChange={(event) => updateEditField("gender", event.target.value)}
                              required
                              value={editForm.gender}
                            >
                              <option value="">Select gender</option>
                              <option value="MALE">Male</option>
                              <option value="FEMALE">Female</option>
                            </select>
                          </label>
                          <TextField
                            label="Breed"
                            onChange={(value) => updateEditField("breed", value)}
                            value={editForm.breed}
                          />
                          <TextField
                            label="Color"
                            onChange={(value) => updateEditField("color", value)}
                            value={editForm.color}
                          />
                          <TextField
                            label="Date of birth"
                            onChange={(value) => updateEditField("dateOfBirth", value)}
                            type="date"
                            value={editForm.dateOfBirth}
                          />
                          <TextField
                            label="Height cm"
                            onChange={(value) => updateEditField("heightCm", value)}
                            type="number"
                            value={editForm.heightCm ?? ""}
                          />
                          <TextField
                            label="Weight kg"
                            onChange={(value) => updateEditField("weightKg", value)}
                            type="number"
                            value={editForm.weightKg ?? ""}
                          />
                        </div>
                      </div>

                      {/* RIGHT PANE - Detailed Notes */}
                      <div className="w-full lg:w-1/2 border-t border-slate-200 bg-gradient-to-b from-slate-50/80 to-slate-100/50 p-6 lg:border-l lg:border-t-0 lg:overflow-y-auto modal-scrollbar flex flex-col gap-4 min-h-0">
                        <h3 className="text-lg font-black text-slate-950 mb-2">2. Health Status & Notes</h3>
                        <TextField
                          label="Health status"
                          onChange={(value) => updateEditField("healthStatus", value)}
                          value={editForm.healthStatus}
                        />
                        <TextArea
                          label="Medical note"
                          onChange={(value) => updateEditField("medicalNote", value)}
                          value={editForm.medicalNote}
                        />
                        <TextArea
                          label="Description"
                          onChange={(value) => updateEditField("description", value)}
                          value={editForm.description}
                        />
                      </div>
                    </div>

                    {/* FOOTER - Fixed */}
                    <div className="shrink-0 flex items-center justify-end gap-3 border-t border-slate-200 bg-white px-6 py-4">
                      <button
                        className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-black text-slate-700 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006d5b]"
                        onClick={() => setEditPanelOpen(false)}
                        type="button"
                      >
                        Cancel
                      </button>
                      <button
                        className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#006d5b] px-6 text-sm font-black text-white hover:bg-[#004d3d] disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={saving}
                        type="submit"
                      >
                        {saving ? "Saving..." : "Save Changes"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white py-16 text-center text-sm font-bold text-slate-500">
            Horse profile not found.
          </div>
        )}
      </section>
    </OwnerLayout>
  );
}

function OverviewTab({
  documents,
  horse,
  onAddDocument,
}: {
  documents: HorseDocument[];
  horse: Horse;
  onAddDocument: (documentType?: HorseDocumentType) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <section className="rounded-lg border border-slate-200 bg-white p-6" aria-labelledby="basic-info-title">
          <h2 id="basic-info-title" className="text-xl font-black">
            Basic Information
          </h2>
          <dl className="mt-6 grid gap-5 md:grid-cols-2">
            <InfoItem label="Registration code" value={horse.registrationCode || "Pending"} />
            <InfoItem label="Breed" value={horse.breed || "Not provided"} />
            <InfoItem label="Gender" value={titleCase(horse.gender)} />
            <InfoItem label="Color" value={horse.color || "Not provided"} />
            <InfoItem label="Date of birth" value={horse.dateOfBirth || "Not provided"} />
            <InfoItem label="Height" value={horse.heightCm ? `${horse.heightCm} cm` : "Not provided"} />
            <InfoItem label="Weight" value={horse.weightKg ? `${horse.weightKg} kg` : "Not provided"} />
            <InfoItem label="Review status" value={titleCase(horse.status)} />
          </dl>

          {horse.description && (
            <p className="mt-6 rounded-md bg-slate-50 p-4 text-sm leading-6 text-slate-700">{horse.description}</p>
          )}
          {horse.rejectionReason && (
            <p className="mt-6 rounded-md border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-800">
              {horse.rejectionReason}
            </p>
          )}
        </section>

        <aside className="rounded-lg border border-slate-200 bg-white p-6" aria-labelledby="horse-photo-title">
          <h2 id="horse-photo-title" className="text-xl font-black">
            Photo
          </h2>
          {horse.imageUrl ? (
            <img alt={horse.name} className="mt-6 aspect-square w-full rounded-lg object-cover" src={horse.imageUrl} />
          ) : (
            <div className="mt-6 flex aspect-square w-full items-center justify-center rounded-lg bg-slate-100 text-slate-500">
              <ImageIcon className="h-10 w-10" aria-hidden="true" />
            </div>
          )}
        </aside>
      </div>

      <MedicalDocumentsSection documents={documents} horse={horse} onAddDocument={onAddDocument} />
    </div>
  );
}

function RegistrationsTab({
  disabled,
  horse,
  onPageChange,
  onWithdraw,
  page,
  pageSize,
  registrations,
  totalRegistrations,
}: {
  disabled: boolean;
  horse: Horse;
  onPageChange: (page: number) => void;
  onWithdraw: (registration: TournamentRegistration) => void;
  page: number;
  pageSize: number;
  registrations: TournamentRegistration[];
  totalRegistrations: number;
}) {
  return (
    <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-6" aria-labelledby="registrations-title">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 id="registrations-title" className="text-xl font-black">
          Tournament Registrations
        </h2>
        {horse.status === "APPROVED" ? (
          <Link className="rounded-md bg-[#006d5b] px-4 py-3 text-sm font-black text-white hover:bg-[#004d3d]" to="/owner/registrations">
            Register this horse in a tournament
          </Link>
        ) : (
          <span className="text-sm font-bold text-slate-500">
            {horse.status === "PENDING" ? "Admin review is still pending." : "Resolve the rejection before registering."}
          </span>
        )}
      </div>

      {registrations.length === 0 ? (
        <p className="rounded-md border border-dashed border-slate-300 py-10 text-center text-sm font-bold text-slate-500">
          No tournament registrations for this horse yet.
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-xs font-black uppercase tracking-[0.08em] text-slate-500">
                <tr>
                  <th className="px-5 py-3">Tournament</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Note</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {registrations.map((registration) => (
                  <tr key={registration.id}>
                    <td className="px-5 py-4 font-black">{registration.tournamentName}</td>
                    <td className="px-5 py-4">{titleCase(registration.status)}</td>
                    <td className="px-5 py-4">
                      {registration.rejectionReason || registration.note || "No note"}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        className="min-h-11 rounded-md border border-slate-300 px-4 text-xs font-black text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={disabled || registration.status !== "PENDING"}
                        onClick={() => onWithdraw(registration)}
                        type="button"
                      >
                        Withdraw
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalRegistrations > pageSize && (
            <PaginationControls
              currentPage={page}
              onPageChange={onPageChange}
              pageSize={pageSize}
              totalItems={totalRegistrations}
            />
          )}
        </div>
      )}
    </section>
  );
}

const documentSlots: Array<{ type: HorseDocumentType; title: string; fallback?: "evidence" }> = [
  { type: "COGGINS", title: "Coggins" },
  { type: "HEALTH_CERTIFICATE", title: "Health Certificate" },
  { type: "OWNERSHIP_CERTIFICATE", title: "Ownership Certificate", fallback: "evidence" },
];

function MedicalDocumentsSection({
  documents,
  horse,
  onAddDocument,
}: {
  documents: HorseDocument[];
  horse: Horse;
  onAddDocument: (documentType?: HorseDocumentType) => void;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6" aria-labelledby="medical-documents-title">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 id="medical-documents-title" className="text-xl font-black">
          Medical Documents Status
        </h2>
        <button
          className="inline-flex min-h-11 items-center gap-2 rounded-md px-3 text-sm font-black text-[#006d5b] hover:bg-emerald-50"
          onClick={() => onAddDocument()}
          type="button"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add Document
        </button>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {documentSlots.map((slot) => {
          const document = documents.find((item) => item.documentType === slot.type);
          return (
            <DocumentStatusCard
              document={document}
              documentType={slot.type}
              fallbackUrl={slot.fallback === "evidence" ? horse.evidenceUrl : undefined}
              key={slot.type}
              onAddDocument={onAddDocument}
              title={slot.title}
            />
          );
        })}
      </div>
    </section>
  );
}

function DocumentStatusCard({
  document,
  documentType,
  fallbackUrl,
  onAddDocument,
  title,
}: {
  document?: HorseDocument;
  documentType: HorseDocumentType;
  fallbackUrl?: string;
  onAddDocument: (documentType: HorseDocumentType) => void;
  title: string;
}) {
  return (
    <article className="min-h-36 rounded-lg border border-slate-200 bg-slate-50 p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-black text-slate-950">{title}</h3>
        <FileText className="h-5 w-5 text-slate-400" aria-hidden="true" />
      </div>

      {document ? (
        <div className="mt-4 space-y-2 text-sm text-slate-600">
          <p className="font-bold text-slate-900">{document.referenceNumber}</p>
          <p>Issued by {document.issuer}</p>
          <p>Expires {document.expiryDate}</p>
          <AuthenticatedFileLink
            aria-label={`Open ${title}`}
            className="inline-flex min-h-11 items-center font-black text-[#006d5b] hover:text-[#004d3d]"
            href={document.fileUrl}
          >
            Open document
          </AuthenticatedFileLink>
        </div>
      ) : fallbackUrl ? (
        <div className="mt-4 space-y-2 text-sm text-slate-600">
          <p>No structured document yet.</p>
          <AuthenticatedFileLink
            aria-label={`Open ${title}`}
            className="inline-flex min-h-11 items-center font-black text-[#006d5b] hover:text-[#004d3d]"
            href={fallbackUrl}
          >
            Open initial evidence
          </AuthenticatedFileLink>
        </div>
      ) : (
        <div className="mt-4 space-y-2 text-sm text-slate-600">
          <p>No document on file</p>
          <button
            className="inline-flex min-h-11 items-center rounded-md pr-3 text-sm font-black text-[#006d5b] hover:text-[#004d3d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006d5b]"
            onClick={() => onAddDocument(documentType)}
            type="button"
          >
            Add {title}
          </button>
        </div>
      )}
    </article>
  );
}

function DocumentModal({
  disabled,
  form,
  horse,
  onChange,
  onClose,
  onFileChange,
  onSubmit,
}: {
  disabled: boolean;
  form: DocumentFormState;
  horse: Horse;
  onChange: (field: DocumentFormTextField, value: string) => void;
  onClose: () => void;
  onFileChange: (file: File | null) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/50 px-4 py-10" role="presentation">
      <section
        aria-labelledby="medical-document-title"
        aria-modal="true"
        className="w-full max-w-3xl rounded-lg bg-white shadow-2xl"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div>
            <h2 id="medical-document-title" className="text-2xl font-black">
              Medical Document
            </h2>
            <p className="mt-1 text-sm font-bold text-slate-600">{horse.name}</p>
          </div>
          <button
            aria-label="Close medical document modal"
            className="inline-flex h-11 w-11 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100"
            onClick={onClose}
            type="button"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <form className="grid gap-5 px-6 py-6" onSubmit={onSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1 text-sm font-bold text-slate-700">
              <span>Document Type *</span>
              <select
                className="min-h-11 w-full rounded-md border border-slate-300 px-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#006d5b]"
                onChange={(event) => onChange("documentType", event.target.value)}
                required
                value={form.documentType}
              >
                <option value="HEALTH_CERTIFICATE">Health Certificate</option>
                <option value="COGGINS">Coggins</option>
                <option value="OWNERSHIP_CERTIFICATE">Ownership Certificate</option>
                <option value="REGISTRATION_CERTIFICATE">Registration Certificate</option>
                <option value="OTHER">Other</option>
              </select>
            </label>
            <DocumentTextField
              label="ID/Reference Number *"
              onChange={(value) => onChange("referenceNumber", value)}
              placeholder="e.g., COG-2026-001"
              required
              value={form.referenceNumber}
            />
            <DocumentTextField
              label="Issue Date *"
              onChange={(value) => onChange("issueDate", value)}
              required
              type="date"
              value={form.issueDate}
            />
            <DocumentTextField
              label="Expiry Date *"
              onChange={(value) => onChange("expiryDate", value)}
              required
              type="date"
              value={form.expiryDate}
            />
          </div>

          <DocumentTextField
            label="Issuer *"
            onChange={(value) => onChange("issuer", value)}
            placeholder="e.g., Saigon Equine Clinic"
            required
            value={form.issuer}
          />

          <label className="space-y-2 text-sm font-bold text-slate-700">
            <span>Document Attachment</span>
            <span className="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 text-center text-slate-600 hover:border-[#006d5b] hover:bg-emerald-50/50">
              <Upload className="h-9 w-9 text-slate-400" aria-hidden="true" />
              <span className="mt-3 font-black">
                {form.documentFile ? form.documentFile.name : "Click to upload or drag and drop"}
              </span>
              <span className="mt-1 text-xs font-bold text-slate-500">PDF, JPG, PNG, WebP up to 10MB</span>
              <input
                accept="application/pdf,image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
                required
                type="file"
              />
            </span>
          </label>

          <label className="space-y-1 text-sm font-bold text-slate-700">
            <span>Notes</span>
            <textarea
              className="min-h-28 w-full rounded-md border border-slate-300 px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#006d5b]"
              onChange={(event) => onChange("notes", event.target.value)}
              placeholder="Additional notes about the document"
              value={form.notes ?? ""}
            />
          </label>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
            <button
              className="min-h-11 rounded-md border border-slate-300 px-5 text-sm font-black text-slate-700 hover:bg-slate-50"
              onClick={onClose}
              type="button"
            >
              Cancel
            </button>
            <button
              className="min-h-11 rounded-md bg-[#006d5b] px-5 text-sm font-black text-white hover:bg-[#004d3d] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={disabled}
              type="submit"
            >
              {disabled ? "Saving..." : "Save Document"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function DocumentTextField({
  label,
  onChange,
  placeholder,
  required,
  type = "text",
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
  value: string;
}) {
  return (
    <label className="space-y-1 text-sm font-bold text-slate-700">
      <span>{label}</span>
      <input
        className="min-h-11 w-full rounded-md border border-slate-300 px-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#006d5b]"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        type={type}
        value={value}
      />
    </label>
  );
}

function HealthTab({ horse }: { horse: Horse }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6" aria-labelledby="health-title">
      <h2 id="health-title" className="text-xl font-black">
        Health Notes
      </h2>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <InfoCard label="Health status" value={horse.healthStatus || "Not provided"} />
        <InfoCard label="Medical note" value={horse.medicalNote || "No medical note submitted"} />
      </div>
    </section>
  );
}

function StatusBadge({ status }: { status: Horse["status"] }) {
  const classes: Record<string, string> = {
    APPROVED: "bg-emerald-50 text-emerald-700",
    PENDING: "bg-amber-50 text-amber-800",
    REJECTED: "bg-rose-50 text-rose-700",
    INACTIVE: "bg-slate-100 text-slate-600",
    SUSPENDED: "bg-slate-900 text-white",
  };
  return (
    <span className={`rounded-md px-3 py-1.5 text-sm font-black ${classes[status] || "bg-slate-100 text-slate-700"}`}>
      {titleCase(status)}
    </span>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-sm font-bold text-slate-500">{label}</dt>
      <dd className="mt-1 text-base font-black text-slate-950">{value}</dd>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-slate-50 p-4">
      <p className="text-sm font-bold text-slate-500">{label}</p>
      <p className="mt-1 font-black text-slate-950">{value}</p>
    </div>
  );
}

function DocumentLink({ label, url }: { label: string; url?: string }) {
  return (
    <div className="rounded-md bg-slate-50 p-4">
      <p className="text-sm font-bold text-slate-500">{label}</p>
      {url ? (
        <a className="mt-1 inline-flex font-black text-[#006d5b] hover:text-[#004d3d]" href={url}>
          Open document
        </a>
      ) : (
        <p className="mt-1 font-black text-rose-700">Missing</p>
      )}
    </div>
  );
}

function titleCase(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function TextField({
  label,
  onChange,
  required,
  type = "text",
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
  value: string | number | undefined;
}) {
  return (
    <label className="space-y-1 text-sm font-bold text-slate-700">
      <span>{label}</span>
      <input
        className="min-h-11 w-full rounded-md border border-slate-300 px-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#006d5b]"
        onChange={(event) => onChange(event.target.value)}
        required={required}
        type={type}
        value={value ?? ""}
      />
    </label>
  );
}

function TextArea({ label, onChange, value }: { label: string; onChange: (value: string) => void; value?: string }) {
  return (
    <label className="space-y-1 text-sm font-bold text-slate-700">
      <span>{label}</span>
      <textarea
        className="min-h-24 w-full rounded-md border border-slate-300 px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#006d5b]"
        onChange={(event) => onChange(event.target.value)}
        value={value ?? ""}
      />
    </label>
  );
}
