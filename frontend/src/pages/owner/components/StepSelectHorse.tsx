import { useEffect, useState, useCallback } from "react";
import { getOwnerHorseDocuments } from "../../../api/racingApi";
import type { Horse, Tournament, HorseDocument } from "../../../types/racing";

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

export function StepSelectHorse({ selectedTournament, horses, onPrev, onNext }: Props) {
  const [selectedHorseId, setSelectedHorseId] = useState<number | "">("");
  const [docs, setDocs] = useState<HorseDocument[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [errorDocs, setErrorDocs] = useState<string | null>(null);
  const [checkStatus, setCheckStatus] = useState<DocumentCheckStatus | null>(null);

  const approvedHorses = horses.filter((h) => h.status === "APPROVED");

  const fetchDocuments = useCallback(async (horseId: number) => {
    setLoadingDocs(true);
    setErrorDocs(null);
    try {
      const documents = await getOwnerHorseDocuments(horseId);
      setDocs(documents);
      
      const tourEndDate = selectedTournament.endDate ? new Date(selectedTournament.endDate) : null;
      const horse = horses.find(h => h.id === horseId);
      
      const coggins = documents.find(d => d.documentType === "COGGINS");
      const healthCert = documents.find(d => d.documentType === "HEALTH_CERTIFICATE");

      const hasCoggins = !!coggins;
      const cogginsValid = hasCoggins && tourEndDate && coggins.expiryDate ? new Date(coggins.expiryDate) >= tourEndDate : false;

      const hasHealthCert = !!healthCert;
      const healthCertValid = hasHealthCert && tourEndDate && healthCert.expiryDate ? new Date(healthCert.expiryDate) >= tourEndDate : false;

      const horseApproved = horse?.status === "APPROVED";
      const isEligible = horseApproved && cogginsValid && healthCertValid;

      setCheckStatus({
        hasCoggins,
        cogginsValid,
        cogginsExpiry: coggins?.expiryDate,
        hasHealthCert,
        healthCertValid,
        healthCertExpiry: healthCert?.expiryDate,
        horseApproved,
        isEligible
      });
    } catch (err) {
      setErrorDocs("Failed to load medical documents for this horse.");
      setCheckStatus(null);
    } finally {
      setLoadingDocs(false);
    }
  }, [selectedTournament, horses]);

  useEffect(() => {
    if (selectedHorseId) {
      void fetchDocuments(Number(selectedHorseId));
    } else {
      setDocs([]);
      setCheckStatus(null);
    }
  }, [selectedHorseId, fetchDocuments]);

  const handleRefresh = () => {
    if (selectedHorseId) {
      void fetchDocuments(Number(selectedHorseId));
    }
  };

  const handleNext = () => {
    if (selectedHorseId && checkStatus?.isEligible) {
      const horse = horses.find(h => h.id === Number(selectedHorseId));
      if (horse) onNext(horse);
    }
  };

  if (approvedHorses.length === 0) {
    return (
      <div className="space-y-4">
        <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
          <p className="text-slate-500 font-bold mb-2">You need at least one approved horse before registering for a tournament.</p>
          <p className="text-xs text-slate-400 mb-4">
            Horses with PENDING or REJECTED status are not eligible for tournament registration.
          </p>
          <a
            href="/owner/horses"
            className="inline-block bg-[#006d5b] text-white px-5 py-2 rounded-lg text-xs font-black hover:bg-[#004d3d]"
          >
            Manage My Horses ↗
          </a>
        </div>
        <button
          type="button"
          onClick={onPrev}
          className="text-xs font-black text-slate-500 hover:text-slate-700 flex items-center gap-1 cursor-pointer"
        >
          ← Back to Select Tournament
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-black text-slate-800">Step 2: Select Horse & Verify Medical Eligibility</h2>
        <p className="text-xs text-slate-500 mt-1">
          Registration requires valid COGGINS and HEALTH CERTIFICATE documents through the tournament end date (
          <span className="font-bold text-slate-700">{selectedTournament.endDate}</span>).
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-[1.2fr_1.8fr]">
        {/* Horse selection */}
        <div className="space-y-4">
          <label className="block space-y-1 text-sm font-bold text-slate-700">
            <span>Select a horse</span>
            <select
              className="min-h-11 w-full rounded-md border border-slate-300 px-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#006d5b]"
              value={selectedHorseId}
              onChange={(e) => setSelectedHorseId(e.target.value ? Number(e.target.value) : "")}
            >
              <option value="">-- Select a horse --</option>
              {approvedHorses.map((horse) => (
                <option key={horse.id} value={horse.id}>
                  {horse.name} (ID: {horse.id})
                </option>
              ))}
            </select>
          </label>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onPrev}
              className="w-1/2 border border-slate-300 text-slate-700 py-2.5 rounded-lg text-xs font-black hover:bg-slate-50 cursor-pointer"
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={!selectedHorseId || !checkStatus?.isEligible || loadingDocs}
              className="w-1/2 bg-[#006d5b] text-white py-2.5 rounded-lg text-xs font-black hover:bg-[#004d3d] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              Continue →
            </button>
          </div>
        </div>

        {/* Eligibility Check Panel */}
        <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-black text-slate-800 text-sm">Medical Eligibility Checklist</h3>
            {selectedHorseId && (
              <button
                type="button"
                onClick={handleRefresh}
                disabled={loadingDocs}
                className="text-xs font-black text-[#006d5b] hover:text-[#004d3d] flex items-center gap-1 cursor-pointer"
              >
                Refresh 🔄
              </button>
            )}
          </div>

          {loadingDocs ? (
            <div className="py-8 text-center text-xs text-slate-500 font-semibold animate-pulse">
              Checking medical documents...
            </div>
          ) : errorDocs ? (
            <div className="py-4 text-center text-xs text-rose-600 font-bold bg-rose-50 border border-rose-100 rounded-lg">
              {errorDocs}
            </div>
          ) : checkStatus ? (
            <div className="space-y-4">
              <div className="divide-y divide-slate-100 bg-white border border-slate-150 rounded-xl overflow-hidden shadow-sm">
                {/* Approved status */}
                <div className="flex items-center justify-between p-3.5">
                  <span className="text-xs font-bold text-slate-600">Horse approval status:</span>
                  <span className={`text-xs font-black px-2.5 py-1 rounded-full ${
                    checkStatus.horseApproved ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                  }`}>
                    {checkStatus.horseApproved ? "✓ Approved" : "✗ Not approved"}
                  </span>
                </div>

                {/* COGGINS check */}
                <div className="p-3.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600">Coggins test certificate:</span>
                    <span className={`text-xs font-black px-2.5 py-1 rounded-full ${
                      checkStatus.cogginsValid ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                    }`}>
                      {checkStatus.cogginsValid ? "✓ Valid" : !checkStatus.hasCoggins ? "✗ Missing" : "✗ Expired"}
                    </span>
                  </div>
                  {checkStatus.cogginsExpiry && (
                    <span className="block text-[10px] text-slate-400 font-medium">
                      Expires: {new Date(checkStatus.cogginsExpiry).toLocaleDateString("en-US")}
                    </span>
                  )}
                </div>

                {/* HEALTH CERTIFICATE check */}
                <div className="p-3.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600">Health certificate:</span>
                    <span className={`text-xs font-black px-2.5 py-1 rounded-full ${
                      checkStatus.healthCertValid ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                    }`}>
                      {checkStatus.healthCertValid ? "✓ Valid" : !checkStatus.hasHealthCert ? "✗ Missing" : "✗ Expired"}
                    </span>
                  </div>
                  {checkStatus.healthCertExpiry && (
                    <span className="block text-[10px] text-slate-400 font-medium">
                      Expires: {new Date(checkStatus.healthCertExpiry).toLocaleDateString("en-US")}
                    </span>
                  )}
                </div>
              </div>

              {/* Ineligible alert */}
              {!checkStatus.isEligible && (
                <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-lg space-y-2">
                  <p className="text-xs text-rose-700 font-bold leading-relaxed">
                    ⚠️ This horse is not eligible for this tournament due to missing or expired COGGINS / HEALTH_CERTIFICATE documents before the tournament end date.
                  </p>
                  <a
                    href={`/owner/horses`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-xs font-black text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    Update horse documents (opens new tab) ↗
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400 font-bold">
              Please select a horse to check eligibility.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
