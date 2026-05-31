import { FormEvent, useCallback, useEffect, useState } from "react";
import { FileText, Image as ImageIcon, Plus, Search, X } from "lucide-react";
import { Link } from "react-router-dom";

import { createOwnerHorse, getOwnerHorsesPage, getOwnerTournamentRegistrations } from "../../api/racingApi";
import { PaginationControls } from "../../components/common/PaginationControls";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { OwnerLayout } from "../../layouts/OwnerLayout";
import type { Horse, HorseMultipartPayload, HorseStatus, TournamentRegistration } from "../../types/racing";
import { getApiErrorMessage } from "../../utils/apiError";

type HorseFormState = Omit<HorseMultipartPayload, "imageFile" | "evidenceFile"> & {
  imageFile: File | null;
  evidenceFile: File | null;
};

const emptyForm: HorseFormState = {
  name: "",
  gender: "",
  breed: "",
  dateOfBirth: "",
  color: "",
  heightCm: undefined,
  weightKg: undefined,
  healthStatus: "",
  medicalNote: "",
  description: "",
  imageFile: null,
  evidenceFile: null,
};

const statusOptions: Array<"ALL" | HorseStatus> = ["ALL", "PENDING", "APPROVED", "REJECTED", "INACTIVE"];
const genderOptions = ["ALL", "MALE", "FEMALE"] as const;
const HORSE_ROSTER_PAGE_SIZE = 8;

export function OwnerHorsesPage() {
  useDocumentTitle("Horse roster");

  const [horses, setHorses] = useState<Horse[]>([]);
  const [registrations, setRegistrations] = useState<TournamentRegistration[]>([]);
  const [horsePage, setHorsePage] = useState({
    number: 0,
    size: HORSE_ROSTER_PAGE_SIZE,
    totalElements: 0,
    totalPages: 1,
  });
  const [form, setForm] = useState<HorseFormState>(emptyForm);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<(typeof statusOptions)[number]>("ALL");
  const [genderFilter, setGenderFilter] = useState<(typeof genderOptions)[number]>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [panelOpen, setPanelOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadWorkspace = useCallback(async () => {
    setLoading(true);
    try {
      const [horseData, registrationData] = await Promise.all([
        getOwnerHorsesPage({
          page: currentPage - 1,
          size: HORSE_ROSTER_PAGE_SIZE,
          query: query.trim() || undefined,
          status: statusFilter === "ALL" ? undefined : statusFilter,
          gender: genderFilter === "ALL" ? undefined : genderFilter,
        }),
        getOwnerTournamentRegistrations(),
      ]);
      setHorses(Array.isArray(horseData.content) ? horseData.content : []);
      setHorsePage({
        number: horseData.number,
        size: horseData.size,
        totalElements: horseData.totalElements,
        totalPages: horseData.totalPages,
      });
      setRegistrations(Array.isArray(registrationData) ? registrationData : []);
      setMessage(null);
    } catch (error) {
      setMessage(getApiErrorMessage(error, "Could not load your horse roster."));
    } finally {
      setLoading(false);
    }
  }, [currentPage, genderFilter, query, statusFilter]);

  useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const totalHorses = horsePage.totalElements;
  const rosterPage = horsePage.number + 1;

  const updateField = (field: keyof HorseFormState, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: field === "heightCm" || field === "weightKg" ? (value.trim() ? Number(value) : undefined) : value,
    }));
  };

  const updateFile = (field: "imageFile" | "evidenceFile", file: File | null) => {
    setForm((current) => ({ ...current, [field]: file }));
    if (field === "imageFile") {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
      setImagePreview(file && typeof URL.createObjectURL === "function" ? URL.createObjectURL(file) : null);
    }
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);

    if (!form.imageFile || !form.evidenceFile) {
      setMessage("Horse image and evidence document are required.");
      return;
    }

    setSaving(true);
    try {
      await createOwnerHorse({
        ...form,
        imageFile: form.imageFile,
        evidenceFile: form.evidenceFile,
      });
      setForm(emptyForm);
      setImagePreview(null);
      setPanelOpen(false);
      setCurrentPage(1);
      setMessage("Horse submitted for admin review.");
      await loadWorkspace();
    } catch (error) {
      setMessage(getApiErrorMessage(error, "Could not submit this horse."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <OwnerLayout>
      <section aria-labelledby="owner-horses-title" className="space-y-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.14em] text-[#b91c1c]">Stable management</p>
            <h1 id="owner-horses-title" className="mt-2 text-4xl font-black tracking-tight">
              Horse Roster
            </h1>
            <p className="mt-2 max-w-3xl text-base leading-7 text-slate-600">
              Manage your stable of {totalHorses} {totalHorses === 1 ? "horse" : "horses"} and track admin review
              readiness.
            </p>
          </div>
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#dc2626] px-5 text-sm font-black text-white shadow-sm hover:bg-[#b91c1c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#070f4f]"
            onClick={() => setPanelOpen(true)}
            type="button"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add Horse
          </button>
        </div>

        {message && (
          <p className="rounded-md border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700" role="status">
            {message}
          </p>
        )}

        <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-3 xl:grid-cols-[1.3fr_1fr_1fr]">
          <label className="relative text-sm font-bold text-slate-700">
            <span className="sr-only">Search horses</span>
            <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" aria-hidden="true" />
            <input
              className="min-h-11 w-full rounded-md border border-slate-300 pl-10 pr-3 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#b91c1c]"
              onChange={(event) => {
                setCurrentPage(1);
                setQuery(event.target.value);
              }}
              placeholder="Search horses, breed, code..."
              value={query}
            />
          </label>

          <label className="text-sm font-bold text-slate-700">
            <span className="sr-only">Filter by status</span>
            <select
              className="min-h-11 w-full rounded-md border border-slate-300 px-3 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#b91c1c]"
              onChange={(event) => {
                setCurrentPage(1);
                setStatusFilter(event.target.value as (typeof statusOptions)[number]);
              }}
              value={statusFilter}
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status === "ALL" ? "All Status" : titleCase(status)}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-bold text-slate-700">
            <span className="sr-only">Filter by gender</span>
            <select
              className="min-h-11 w-full rounded-md border border-slate-300 px-3 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#b91c1c]"
              onChange={(event) => {
                setCurrentPage(1);
                setGenderFilter(event.target.value as (typeof genderOptions)[number]);
              }}
              value={genderFilter}
            >
              {genderOptions.map((gender) => (
                <option key={gender} value={gender}>
                  {gender === "ALL" ? "All Gender" : titleCase(gender)}
                </option>
              ))}
            </select>
          </label>
        </div>

        {loading ? (
          <div className="rounded-lg border border-slate-200 bg-white py-16 text-center text-sm font-bold text-slate-500">
            Loading horse roster...
          </div>
        ) : horses.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white py-16 text-center text-sm font-bold text-slate-500">
            No horses match this roster view.
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50 text-xs font-black uppercase tracking-[0.08em] text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Horse</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Documents</th>
                    <th className="px-6 py-4">Recent Activity</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {horses.map((horse) => (
                    <tr className="hover:bg-slate-50" key={horse.id}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <HorseThumbnail horse={horse} />
                          <div>
                            <p className="font-black text-slate-950">{horse.name}</p>
                            <p className="mt-1 text-sm text-slate-600">
                              {[horse.breed, horse.color, horse.registrationCode].filter(Boolean).join(" - ") ||
                                "Profile details pending"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={horse.status} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          <DocumentPill available={Boolean(horse.imageUrl)} icon="image" label="Image" />
                          <DocumentPill available={Boolean(horse.evidenceUrl)} icon="file" label="Evidence" />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-700">{activityForHorse(horse, registrations)}</td>
                      <td className="px-6 py-4 text-right">
                        <Link className="font-black text-[#dc2626] hover:text-[#991b1b]" to={`/owner/horses/${horse.id}`}>
                          View Profile
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {horsePage.totalElements > HORSE_ROSTER_PAGE_SIZE && (
              <PaginationControls
                currentPage={rosterPage}
                onPageChange={setCurrentPage}
                pageSize={HORSE_ROSTER_PAGE_SIZE}
                totalItems={horsePage.totalElements}
              />
            )}
          </div>
        )}

        {panelOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/40" role="presentation">
            <aside
              aria-labelledby="add-horse-title"
              className="ml-auto flex h-full w-full max-w-2xl flex-col overflow-y-auto bg-white shadow-2xl"
              role="dialog"
              aria-modal="true"
            >
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-[#b91c1c]">New profile</p>
                  <h2 id="add-horse-title" className="text-2xl font-black">
                    Add Horse
                  </h2>
                </div>
                <button
                  aria-label="Close add horse panel"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b91c1c]"
                  onClick={() => setPanelOpen(false)}
                  type="button"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>

              <form className="grid gap-5 p-6" onSubmit={handleCreate}>
                <div className="grid gap-4 md:grid-cols-2">
                  <TextField label="Horse name" onChange={(value) => updateField("name", value)} required value={form.name} />
                  <label className="space-y-1 text-sm font-bold text-slate-700">
                    <span>Gender</span>
                    <select
                      className="min-h-11 w-full rounded-md border border-slate-300 px-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#b91c1c]"
                      onChange={(event) => updateField("gender", event.target.value)}
                      required
                      value={form.gender}
                    >
                      <option value="">Select gender</option>
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                    </select>
                  </label>
                  <TextField label="Breed" onChange={(value) => updateField("breed", value)} value={form.breed} />
                  <TextField label="Color" onChange={(value) => updateField("color", value)} value={form.color} />
                  <TextField label="Date of birth" onChange={(value) => updateField("dateOfBirth", value)} type="date" value={form.dateOfBirth} />
                  <TextField label="Height cm" onChange={(value) => updateField("heightCm", value)} type="number" value={form.heightCm ?? ""} />
                  <TextField label="Weight kg" onChange={(value) => updateField("weightKg", value)} type="number" value={form.weightKg ?? ""} />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2 rounded-lg border border-dashed border-slate-300 p-4 text-sm font-bold text-slate-700">
                    <span>Horse image</span>
                    <input
                      accept="image/jpeg,image/png,image/webp"
                      className="block w-full text-sm file:mr-3 file:min-h-10 file:rounded-md file:border-0 file:bg-[#dc2626] file:px-4 file:text-sm file:font-black file:text-white"
                      onChange={(event) => updateFile("imageFile", event.target.files?.[0] ?? null)}
                      required
                      type="file"
                    />
                    {imagePreview ? (
                      <img alt="Selected horse preview" className="h-36 w-full rounded-md object-cover" src={imagePreview} />
                    ) : (
                      <p className="text-xs text-slate-500">JPG, PNG, or WebP under 5MB.</p>
                    )}
                  </label>

                  <label className="space-y-2 rounded-lg border border-dashed border-slate-300 p-4 text-sm font-bold text-slate-700">
                    <span>Evidence document</span>
                    <input
                      accept="application/pdf,image/jpeg,image/png,image/webp"
                      className="block w-full text-sm file:mr-3 file:min-h-10 file:rounded-md file:border-0 file:bg-[#070f4f] file:px-4 file:text-sm file:font-black file:text-white"
                      onChange={(event) => updateFile("evidenceFile", event.target.files?.[0] ?? null)}
                      required
                      type="file"
                    />
                    <p className="text-xs text-slate-500">
                      {form.evidenceFile ? `${form.evidenceFile.name} selected` : "PDF, JPG, PNG, or WebP under 10MB."}
                    </p>
                  </label>
                </div>

                <TextArea label="Health status" onChange={(value) => updateField("healthStatus", value)} value={form.healthStatus} />
                <TextArea label="Medical note" onChange={(value) => updateField("medicalNote", value)} value={form.medicalNote} />
                <TextArea label="Description" onChange={(value) => updateField("description", value)} value={form.description} />

                <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
                  <button
                    className="min-h-11 rounded-md border border-slate-300 px-5 text-sm font-black text-slate-700 hover:bg-slate-50"
                    onClick={() => setPanelOpen(false)}
                    type="button"
                  >
                    Cancel
                  </button>
                  <button
                    className="min-h-11 rounded-md bg-[#dc2626] px-5 text-sm font-black text-white hover:bg-[#b91c1c] disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={saving}
                    type="submit"
                  >
                    {saving ? "Submitting..." : "Submit for Review"}
                  </button>
                </div>
              </form>
            </aside>
          </div>
        )}
      </section>
    </OwnerLayout>
  );
}

function HorseThumbnail({ horse }: { horse: Horse }) {
  if (horse.imageUrl) {
    return <img alt="" className="h-12 w-12 rounded-md object-cover" src={horse.imageUrl} />;
  }
  return (
    <span className="inline-flex h-12 w-12 items-center justify-center rounded-md bg-slate-100 text-slate-500">
      <ImageIcon className="h-5 w-5" aria-hidden="true" />
    </span>
  );
}

function StatusBadge({ status }: { status: HorseStatus }) {
  const classes: Record<string, string> = {
    APPROVED: "bg-emerald-50 text-emerald-700",
    PENDING: "bg-amber-50 text-amber-800",
    REJECTED: "bg-rose-50 text-rose-700",
    INACTIVE: "bg-slate-100 text-slate-600",
    SUSPENDED: "bg-slate-900 text-white",
  };
  return (
    <span className={`rounded-md px-2.5 py-1 text-xs font-black ${classes[status] || "bg-slate-100 text-slate-700"}`}>
      {titleCase(status)}
    </span>
  );
}

function DocumentPill({ available, icon, label }: { available: boolean; icon: "image" | "file"; label: string }) {
  const Icon = icon === "image" ? ImageIcon : FileText;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-black ${
        available ? "bg-slate-100 text-slate-700" : "bg-rose-50 text-rose-700"
      }`}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {available ? label : `Missing ${label}`}
    </span>
  );
}

function activityForHorse(horse: Horse, registrations: TournamentRegistration[]) {
  if (horse.status === "REJECTED") {
    return `Rejected: ${horse.rejectionReason || "Admin requested more information"}`;
  }
  if (horse.status === "PENDING") {
    return "Waiting for admin review";
  }

  const horseRegistrations = registrations.filter((registration) => registration.horseId === horse.id);
  const pendingRegistration = horseRegistrations.find((registration) => registration.status === "PENDING");
  if (pendingRegistration) {
    return "Tournament registration under review";
  }

  const approvedRegistration = horseRegistrations.find((registration) => registration.status === "APPROVED");
  if (approvedRegistration) {
    return `Registered for ${approvedRegistration.tournamentName}`;
  }

  if (horse.status === "APPROVED") {
    return "Approved for tournament registration";
  }

  return "No recent activity";
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
        className="min-h-11 w-full rounded-md border border-slate-300 px-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#b91c1c]"
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
        className="min-h-24 w-full rounded-md border border-slate-300 px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#b91c1c]"
        onChange={(event) => onChange(event.target.value)}
        value={value ?? ""}
      />
    </label>
  );
}

function titleCase(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
