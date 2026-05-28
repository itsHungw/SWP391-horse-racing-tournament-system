import { Tournament, Horse } from "../../../types/racing";

interface Props {
  selectedTournament: Tournament;
  selectedHorse: Horse;
  note: string;
  onChangeNote: (note: string) => void;
  saving: boolean;
  submitError: string | null;
  onPrev: () => void;
  onSubmit: () => void;
}

export function StepConfirmRegistration({
  selectedTournament,
  selectedHorse,
  note,
  onChangeNote,
  saving,
  submitError,
  onPrev,
  onSubmit,
}: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-black text-slate-800">Step 3: Confirm Registration Details</h2>
        <p className="text-xs text-slate-500 mt-1">
          Please review the information below carefully before submitting your registration to the organizer.
        </p>
      </div>

      {submitError && (
        <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-lg text-xs font-bold text-rose-700">
          Registration failed: {submitError}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {/* Tournament summary */}
        <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm">
          <span className="text-[10px] uppercase font-black tracking-widest text-[#006d5b]">Tournament</span>
          <h3 className="font-black text-slate-800 text-base mt-1">{selectedTournament.name}</h3>
          <div className="mt-3 space-y-1.5 text-xs text-slate-500 font-semibold border-t border-slate-50 pt-2.5">
            <p>📍 Location: {selectedTournament.location}</p>
            <p>📅 Duration: {selectedTournament.startDate} - {selectedTournament.endDate}</p>
          </div>
        </div>

        {/* Horse summary */}
        <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm">
          <span className="text-[10px] uppercase font-black tracking-widest text-[#006d5b]">Horse</span>
          <h3 className="font-black text-slate-800 text-base mt-1">{selectedHorse.name}</h3>
          <div className="mt-3 space-y-1.5 text-xs text-slate-500 font-semibold border-t border-slate-50 pt-2.5">
            <p>🐴 Registration Code: {selectedHorse.registrationCode || "Not assigned"}</p>
            <p>🧬 Gender / Breed: {selectedHorse.gender} / {selectedHorse.breed || "Unknown"}</p>
          </div>
        </div>
      </div>

      {/* Note field */}
      <label className="block space-y-1 text-sm font-bold text-slate-700">
        <span>Registration note (optional)</span>
        <textarea
          className="w-full min-h-24 rounded-md border border-slate-300 p-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#006d5b]"
          placeholder="e.g. Special transportation requirements, dietary needs..."
          value={note}
          onChange={(e) => onChangeNote(e.target.value)}
          disabled={saving}
        />
      </label>

      <div className="flex gap-4">
        <button
          type="button"
          onClick={onPrev}
          disabled={saving}
          className="w-1/2 border border-slate-300 text-slate-700 py-3 rounded-lg text-xs font-black hover:bg-slate-50 cursor-pointer disabled:opacity-50"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={saving}
          className="w-1/2 bg-[#006d5b] text-white py-3 rounded-lg text-xs font-black hover:bg-[#004d3d] shadow-sm flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1.5 inline-block"></div>
              Submitting...
            </>
          ) : (
            "Confirm Registration ✓"
          )}
        </button>
      </div>
    </div>
  );
}
