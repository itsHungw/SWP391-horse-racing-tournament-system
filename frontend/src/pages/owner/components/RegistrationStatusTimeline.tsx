import { TournamentRegistration } from "../../../types/racing";

interface Props {
  registration: TournamentRegistration;
  onClose: () => void;
}

export function RegistrationStatusTimeline({ registration, onClose }: Props) {
  const isPending = registration.status === "PENDING";
  const isApproved = registration.status === "APPROVED";
  const isRejected = registration.status === "REJECTED";
  const isWithdrawn = registration.status === "WITHDRAWN";

  const statusBadges: Record<string, string> = {
    PENDING: "bg-amber-50 text-amber-700 border-amber-200",
    APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
    REJECTED: "bg-rose-50 text-rose-700 border-rose-200",
    WITHDRAWN: "bg-slate-50 text-slate-600 border-slate-200",
  };

  return (
    <div className="border border-slate-200 rounded-xl p-5 bg-white shadow-sm space-y-5">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <span className="text-[10px] uppercase font-black tracking-widest text-[#006d5b]">Tournament Registration</span>
          <h3 className="font-black text-slate-800 text-lg">{registration.tournamentName}</h3>
          <p className="text-xs text-slate-400 mt-0.5">Horse: <span className="font-bold text-slate-600">{registration.horseName}</span></p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-xs font-black text-slate-400 hover:text-slate-600 border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded-lg cursor-pointer"
        >
          Close ✕
        </button>
      </div>

      {/* Overall status */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-bold text-slate-500">Current status:</span>
        <span className={`text-xs font-black px-3 py-1 rounded-full border ${statusBadges[registration.status] || "bg-slate-100"}`}>
          {registration.status}
        </span>
      </div>

      {/* Timeline */}
      <div className="relative border-l border-slate-200 ml-3 pl-6 space-y-6">
        {/* Milestone 1: Submitted */}
        <div className="relative">
          <span className="absolute -left-[31px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] text-white font-black">
            ✓
          </span>
          <h4 className="text-xs font-black text-slate-800">Registration submitted</h4>
          <p className="text-[10px] text-slate-400 font-semibold">
            By: {registration.ownerName || "Horse Owner"} • {registration.createdAt ? new Date(registration.createdAt).toLocaleString("en-US") : "N/A"}
          </p>
          {registration.note && (
            <p className="text-xs text-slate-500 italic mt-1 bg-slate-50 p-2 rounded border border-slate-100">
              Note: "{registration.note}"
            </p>
          )}
        </div>

        {/* Milestone 2: Under review */}
        <div className="relative">
          <span className={`absolute -left-[31px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-black text-white ${
            isPending ? "bg-amber-500 animate-pulse" : "bg-[#006d5b]"
          }`}>
            {isPending ? "⏰" : "✓"}
          </span>
          <h4 className="text-xs font-black text-slate-800">Under admin review</h4>
          <p className="text-[10px] text-slate-400 font-semibold">
            {isPending ? "Medical documents are being verified by the organizer." : "Document review completed."}
          </p>
        </div>

        {/* Milestone 3: Final result */}
        {(isApproved || isRejected || isWithdrawn) && (
          <div className="relative">
            <span className={`absolute -left-[31px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-black text-white ${
              isApproved ? "bg-emerald-500" : isRejected ? "bg-rose-500" : "bg-slate-400"
            }`}>
              {isApproved ? "✓" : isRejected ? "✗" : "!"}
            </span>
            <h4 className="text-xs font-black text-slate-800">
              {isApproved ? "Approved — Registration Successful" : isRejected ? "Registration Rejected" : "Registration Withdrawn"}
            </h4>
            <p className="text-[10px] text-slate-400 font-semibold">
              Updated: {registration.reviewedAt ? new Date(registration.reviewedAt).toLocaleString("en-US") : new Date().toLocaleString("en-US")}
            </p>
            {isRejected && registration.rejectionReason && (
              <div className="bg-rose-50 border-l-4 border-rose-500 text-rose-700 text-xs p-3 rounded-r-lg font-bold mt-2 leading-relaxed">
                Reason: "{registration.rejectionReason}"
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
