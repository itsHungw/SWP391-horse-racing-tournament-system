import { ChevronDown } from "lucide-react";
import { useId, useState } from "react";

import type { AdminWithdrawalReview } from "../../../types/wallet";
import { WithdrawalRiskPanel } from "./WithdrawalRiskPanel";
import { WithdrawalTimeline } from "./WithdrawalTimeline";
import { formatVnd } from "./withdrawalViewModel";

const compactRiskLabel = {
  LOW: "Low",
  MEDIUM: "Moderate",
  HIGH: "Elevated",
} as const;

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-32">
      <dt className="text-xs font-semibold text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm font-black text-slate-900">{value}</dd>
    </div>
  );
}

export function WithdrawalCompactSummary({ review }: { review: AdminWithdrawalReview }) {
  const [expanded, setExpanded] = useState(false);
  const detailsId = useId();

  return (
    <section aria-labelledby="payout-summary-heading" className="border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center gap-x-8 gap-y-4 px-5 py-4">
        <div className="min-w-44 flex-1">
          <h3 id="payout-summary-heading" className="font-black text-[#070f4f]">
            {review.user.name}
          </h3>
          <p className="mt-1 font-mono text-xs font-semibold text-slate-500">
            WD-{String(review.id).padStart(6, "0")}
          </p>
        </div>

        <dl className="contents">
          <Fact label="Amount" value={formatVnd(review.amount)} />
          <Fact
            label="Destination"
            value={`${review.destination.bankName} · ${review.destination.accountNumber}`}
          />
          <Fact label="Risk" value={compactRiskLabel[review.risk.level]} />
        </dl>

        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={detailsId}
          onClick={() => setExpanded((value) => !value)}
          className="inline-flex min-h-11 items-center gap-2 text-sm font-black text-[#070f4f] underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#070f4f]"
        >
          {expanded ? "Hide review details" : "View review details"}
          <ChevronDown
            aria-hidden="true"
            className={`h-4 w-4 transition-transform motion-reduce:transition-none ${expanded ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {expanded ? (
        <div
          id={detailsId}
          className="grid gap-5 border-t border-slate-200 bg-[#fafaf8] p-5 lg:grid-cols-[minmax(0,1fr)_320px]"
        >
          <WithdrawalRiskPanel risk={review.risk} />
          <WithdrawalTimeline actions={review.actions} />
        </div>
      ) : null}
    </section>
  );
}
