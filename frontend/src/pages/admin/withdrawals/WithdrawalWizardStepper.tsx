import { Check } from "lucide-react";

import type { WithdrawalStatus } from "../../../types/wallet";

const STEPS = ["Review", "Transfer & receipt", "Completed"] as const;

function activeIndex(status: WithdrawalStatus) {
  if (status === "REQUESTED") return 0;
  if (status === "APPROVED") return 1;
  return 2;
}

export function WithdrawalWizardStepper({ status }: { status: WithdrawalStatus }) {
  const current = activeIndex(status);

  return (
    <nav aria-label="Withdrawal progress" className="border-b border-slate-200 bg-white px-4 sm:px-7">
      <ol className="mx-auto grid max-w-3xl grid-cols-3">
        {STEPS.map((label, index) => {
          const complete = index < current;
          const active = index === current;
          return (
            <li
              key={label}
              aria-current={active ? "step" : undefined}
              className="relative flex min-h-16 items-center justify-center gap-2 px-1 text-center sm:px-4"
            >
              {complete ? (
                <span aria-label={`${label} complete`} className="inline-flex text-[#070f4f]">
                  <Check className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
                </span>
              ) : (
                <span aria-hidden="true" className={`font-mono text-xs font-bold ${active ? "text-[#070f4f]" : "text-slate-400"}`}>
                  {index + 1}
                </span>
              )}
              <span className={`text-[11px] font-bold leading-4 sm:text-sm ${active ? "text-[#070f4f]" : complete ? "text-slate-700" : "text-slate-400"}`}>
                {label}
              </span>
              {active ? <span aria-hidden="true" className="absolute inset-x-2 bottom-0 h-0.5 bg-[#070f4f] sm:inset-x-4" /> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
