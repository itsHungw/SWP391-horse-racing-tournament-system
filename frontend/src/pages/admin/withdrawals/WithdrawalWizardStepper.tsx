import { Check } from "lucide-react";

import type { WithdrawalStatus } from "../../../types/wallet";

const STEPS = ["Review", "Transfer & receipt", "Completed"] as const;

type WithdrawalWizardStepperProps = {
  status: WithdrawalStatus;
  inspectingReview?: boolean;
  inspectionDisabled?: boolean;
  onInspectReview?: () => void;
};

function activeIndex(status: WithdrawalStatus) {
  if (status === "REQUESTED") return 0;
  if (status === "APPROVED") return 1;
  return 2;
}

function stageNote(index: number, current: number, status: WithdrawalStatus) {
  if (index === current) {
    if (status === "PAID") return "Paid";
    if (status === "REJECTED") return "Rejected";
    if (status === "CANCELLED") return "Cancelled";
    return "Current";
  }
  if (index > current) return "Pending";
  if (index === 0) return status === "REJECTED" || status === "CANCELLED" ? "Reviewed" : "Approved";
  return status === "PAID" ? "Paid" : "Closed";
}

export function WithdrawalWizardStepper({
  status,
  inspectingReview = false,
  inspectionDisabled = false,
  onInspectReview,
}: WithdrawalWizardStepperProps) {
  const current = activeIndex(status);

  return (
    <nav aria-label="Withdrawal progress" className="border-b border-slate-200 bg-white px-4 sm:px-7">
      <ol className="mx-auto grid max-w-3xl grid-cols-3">
        {STEPS.map((label, index) => {
          const complete = index < current;
          const active = index === current;
          const inspectableReview = index === 0 && complete && Boolean(onInspectReview);
          const node = complete ? (
            <span
              aria-hidden="true"
              className="grid h-9 w-9 place-items-center rounded-full border-2 border-[#070f4f] bg-white text-[#070f4f]"
            >
              <Check className="h-4 w-4" strokeWidth={2.5} />
            </span>
          ) : (
            <span
              aria-hidden="true"
              className={`grid h-9 w-9 place-items-center rounded-full border-2 font-mono text-xs font-black ${
                active
                  ? "border-[#070f4f] bg-[#070f4f] text-white"
                  : "border-slate-300 bg-white text-slate-500"
              }`}
            >
              {index + 1}
            </span>
          );

          const content = inspectableReview ? (
            <button
              type="button"
              aria-label={status === "REJECTED" || status === "CANCELLED" ? "View recorded review" : "View approved review"}
              aria-pressed={inspectingReview}
              disabled={inspectionDisabled}
              onClick={onInspectReview}
              className="group flex min-h-16 flex-col items-center justify-center rounded-md px-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#070f4f] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {node}
              <span className="mt-2 text-[11px] font-black leading-4 text-[#070f4f] group-hover:underline sm:text-sm">
                {label}
              </span>
              <span className="mt-0.5 hidden text-[11px] font-semibold text-slate-500 sm:block">
                {stageNote(index, current, status)}
              </span>
            </button>
          ) : (
            <div className="flex min-h-16 flex-col items-center justify-center px-1 sm:px-2">
              {node}
              <span className={`mt-2 text-[11px] font-black leading-4 sm:text-sm ${
                active ? "text-[#070f4f]" : complete ? "text-slate-700" : "text-slate-400"
              }`}>
                {label}
              </span>
              <span className={`mt-0.5 hidden text-[11px] font-semibold sm:block ${
                active ? "text-[#070f4f]" : "text-slate-500"
              }`}>
                {stageNote(index, current, status)}
              </span>
            </div>
          );

          return (
            <li
              key={label}
              aria-current={active ? "step" : undefined}
              className="relative flex min-h-24 items-start justify-center py-3 text-center"
            >
              {index < STEPS.length - 1 ? (
                <span
                  aria-hidden="true"
                  className={`absolute left-[calc(50%+18px)] right-[calc(-50%+18px)] top-[30px] h-0.5 ${
                    index < current ? "bg-[#070f4f]" : "bg-slate-200"
                  }`}
                />
              ) : null}
              <div className="relative z-10 w-full">{content}</div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
