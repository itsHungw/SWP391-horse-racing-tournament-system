import { useCallback, useEffect, useState } from "react";
import { getOwnerHorseDocuments } from "../../../api/racingApi";
import type { Horse, HorseDocument, Tournament } from "../../../types/racing";

interface Props {
  selectedTournament: Tournament;
  horses: Horse[];
  onPrev: () => void;
  onNext: (horse: Horse) => void;
}

type DocumentCheckStatus = {
  hasCoggins: boolean;
  cogginsValid: boolean;
  cogginsExpiry?: string;
  hasHealthCert: boolean;
  healthCertValid: boolean;
  healthCertExpiry?: string;
  horseApproved: boolean;
  isEligible: boolean;
};

function RequirementRow({
  label,
  state,
  helper,
}: {
  label: string;
  state: "valid" | "missing" | "expired" | "blocked";
  helper?: string;
}) {
  const positive = state === "valid";
  return (
    <div className="flex items-center justify-between gap-3 p-3.5">
      <div>
        <p className="text-xs font-bold text-slate-700">{label}</p>
        {helper ? <p className="mt-1 text-[11px] font-semibold text-slate-500">{helper}</p> : null}
      </div>
      <span
        className={`shrink-0 rounded-md px-2.5 py-1 text-xs font-black uppercase ${
          positive ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
        }`}
      >
        {positive ? "Ready" : state}
      </span>
    </div>
  );
}

export function StepSelectHorse({ selectedTournament, horses, onPrev, onNext }: Props) {
  const [selectedHorseId, setSelectedHorseId] = useState<number | "">("");
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [errorDocs, setErrorDocs] = useState<string | null>(null);
  const [checkStatus, setCheckStatus] = useState<DocumentCheckStatus | null>(null);

  const approvedHorses = horses.filter((horse) => horse.status === "APPROVED");

  const fetchDocuments = useCallback(
    async (horseId: number) => {
      setLoadingDocs(true);
      setErrorDocs(null);
      try {
        const documents: HorseDocument[] = await getOwnerHorseDocuments(horseId);
        const tournamentEndDate = selectedTournament.endDate ? new Date(selectedTournament.endDate) : null;
        const horse = horses.find((item) => item.id === horseId);
        const coggins = documents.find((document) => document.documentType === "COGGINS");
        const healthCert = documents.find((document) => document.documentType === "HEALTH_CERTIFICATE");

        const hasCoggins = Boolean(coggins);
        const cogginsValid = Boolean(
          hasCoggins && tournamentEndDate && coggins?.expiryDate && new Date(coggins.expiryDate) >= tournamentEndDate,
        );
        const hasHealthCert = Boolean(healthCert);
        const healthCertValid = Boolean(
          hasHealthCert && tournamentEndDate && healthCert?.expiryDate && new Date(healthCert.expiryDate) >= tournamentEndDate,
        );
        const horseApproved = horse?.status === "APPROVED";

        setCheckStatus({
          hasCoggins,
          cogginsValid,
          cogginsExpiry: coggins?.expiryDate,
          hasHealthCert,
          healthCertValid,
          healthCertExpiry: healthCert?.expiryDate,
          horseApproved,
          isEligible: horseApproved && cogginsValid && healthCertValid,
        });
      } catch {
        setErrorDocs("Failed to load medical documents for this horse.");
        setCheckStatus(null);
      } finally {
        setLoadingDocs(false);
      }
    },
    [horses, selectedTournament.endDate],
  );

  useEffect(() => {
    if (selectedHorseId) {
      void fetchDocuments(Number(selectedHorseId));
    } else {
      setCheckStatus(null);
    }
  }, [fetchDocuments, selectedHorseId]);

  const handleNext = () => {
    if (!selectedHorseId || !checkStatus?.isEligible) return;
    const horse = horses.find((item) => item.id === Number(selectedHorseId));
    if (horse) onNext(horse);
  };

  if (approvedHorses.length === 0) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 py-12 text-center">
          <p className="mb-2 font-bold text-slate-600">At least one approved horse is required before registration.</p>
          <p className="mb-4 text-xs text-slate-500">Pending or rejected horses stay blocked from tournament entry.</p>
          <a
            className="inline-block rounded-md bg-[#006d5b] px-5 py-2 text-xs font-black text-white hover:bg-[#004d3d]"
            href="/owner/horses"
          >
            Manage My Horses
          </a>
        </div>
        <button
          className="flex items-center gap-1 text-xs font-black text-slate-500 hover:text-slate-700"
          onClick={onPrev}
          type="button"
        >
          Back to Select Tournament
        </button>
      </div>
    );
  }

  const cogginsState: "valid" | "missing" | "expired" = !checkStatus?.hasCoggins
    ? "missing"
    : checkStatus.cogginsValid
      ? "valid"
      : "expired";
  const healthState: "valid" | "missing" | "expired" = !checkStatus?.hasHealthCert
    ? "missing"
    : checkStatus.healthCertValid
      ? "valid"
      : "expired";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-black text-slate-800">Step 2: Select Horse And Verify Eligibility</h2>
        <p className="mt-1 text-xs text-slate-500">
          Required documents must stay valid through{" "}
          <span className="font-bold text-slate-700">{selectedTournament.endDate}</span>.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-[1.2fr_1.8fr]">
        <div className="space-y-4">
          <label className="block space-y-1 text-sm font-bold text-slate-700">
            <span>Select a horse</span>
            <select
              className="min-h-11 w-full rounded-md border border-slate-300 px-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#006d5b]"
              onChange={(event) => setSelectedHorseId(event.target.value ? Number(event.target.value) : "")}
              value={selectedHorseId}
            >
              <option value="">Select a horse</option>
              {approvedHorses.map((horse) => (
                <option key={horse.id} value={horse.id}>
                  {horse.name} (ID: {horse.id})
                </option>
              ))}
            </select>
          </label>

          <div className="flex gap-3">
            <button
              className="w-1/2 rounded-md border border-slate-300 py-2.5 text-xs font-black text-slate-700 hover:bg-slate-50"
              onClick={onPrev}
              type="button"
            >
              Back
            </button>
            <button
              className="w-1/2 rounded-md bg-[#006d5b] py-2.5 text-xs font-black text-white hover:bg-[#004d3d] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!selectedHorseId || !checkStatus?.isEligible || loadingDocs}
              onClick={handleNext}
              type="button"
            >
              Continue
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-sm font-black text-slate-800">Eligibility Blockers</h3>
            {selectedHorseId ? (
              <button
                className="text-xs font-black text-[#006d5b] hover:text-[#004d3d]"
                disabled={loadingDocs}
                onClick={() => void fetchDocuments(Number(selectedHorseId))}
                type="button"
              >
                Refresh
              </button>
            ) : null}
          </div>

          {loadingDocs ? (
            <div className="py-8 text-center text-xs font-semibold text-slate-500">Checking documents...</div>
          ) : errorDocs ? (
            <div className="rounded-md border border-rose-100 bg-rose-50 py-4 text-center text-xs font-bold text-rose-600">
              {errorDocs}
            </div>
          ) : checkStatus ? (
            <div className="space-y-4">
              <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                <RequirementRow
                  label="Horse approval status"
                  state={checkStatus.horseApproved ? "valid" : "blocked"}
                />
                <RequirementRow
                  helper={checkStatus.cogginsExpiry ? `Expires ${new Date(checkStatus.cogginsExpiry).toLocaleDateString("en-US")}` : undefined}
                  label="Coggins test certificate"
                  state={cogginsState}
                />
                <RequirementRow
                  helper={checkStatus.healthCertExpiry ? `Expires ${new Date(checkStatus.healthCertExpiry).toLocaleDateString("en-US")}` : undefined}
                  label="Health certificate"
                  state={healthState}
                />
              </div>

              {!checkStatus.isEligible ? (
                <div className="space-y-2 rounded-r-md border-l-4 border-rose-500 bg-rose-50 p-4">
                  <p className="text-xs font-bold leading-relaxed text-rose-700">
                    This horse is blocked because required COGGINS or HEALTH_CERTIFICATE documents are missing or expire before the tournament end date.
                  </p>
                  <a
                    className="inline-block text-xs font-black text-blue-700 hover:text-blue-900 hover:underline"
                    href="/owner/horses"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    Update horse documents
                  </a>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="py-8 text-center text-xs font-bold text-slate-400">Select a horse to check eligibility.</div>
          )}
        </div>
      </div>
    </div>
  );
}
