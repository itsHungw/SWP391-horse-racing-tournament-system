import { ArrowRight, ChevronDown, Info, TrendingUp, Wallet } from "lucide-react";
import { computePayout, formatVnd, HOUSE_TAKEOUT_PCT } from "../predictionCockpitUtils";
import type { PredictionQuote } from "../types/prediction.types";

interface PayoutReceiptProps {
  stake: number;
  odds: number | null;
  balance: number;
  quote?: PredictionQuote | null;
  quoteLoading?: boolean;
  quoteError?: string | null;
  isUpdate?: boolean;
  oddsLabel?: string;
  feePercent?: number;
  lockLabel?: string;
  oddsNote?: string;
  footerCopy?: string;
  onOpenRules?: () => void;
  variant?: "pool" | "streak";
}

export function PayoutReceipt({
  stake,
  odds,
  balance,
  quote,
  quoteLoading = false,
  quoteError,
  isUpdate = false,
  oddsLabel = "Current pool estimate",
  feePercent = HOUSE_TAKEOUT_PCT,
  lockLabel = "Race start",
  oddsNote,
  footerCopy,
  onOpenRules,
  variant = "pool",
}: PayoutReceiptProps) {
  const isStreak = variant === "streak";
  const quotedOdds = quote?.oddsAfterStake ?? (quoteLoading || quoteError ? null : odds);
  const hasOdds = typeof quotedOdds === "number" && Number.isFinite(quotedOdds) && quotedOdds > 0;
  const fallbackMath = computePayout(stake, hasOdds ? quotedOdds : 0);
  const payout = quote?.estimatedReturn ?? fallbackMath.payout;
  const profit = quote?.estimatedProfit ?? fallbackMath.profit;
  const returnPct = stake > 0 ? (profit / stake) * 100 : 0;
  const charged = isUpdate ? 0 : stake;
  const balanceAfter = balance - charged;
  const profitTone = profit >= 0 ? "text-emerald-soft" : "text-rose-300";
  const profitPrefix = profit >= 0 ? "+" : "";
  const impact = quote?.priceImpactPercent ?? null;
  const impactTone = impact == null || impact >= 0 ? "text-emerald-soft" : "text-amber-200";
  const impactPrefix = impact != null && impact > 0 ? "+" : "";
  const receiptBadge = isStreak ? (hasOdds ? "Parlay" : "Build legs") : quote ? "After stake" : quoteLoading ? "Quoting" : "Live";
  const outcomeLabel = isStreak ? "If every leg wins" : "If locked now";
  const returnLabel = isStreak ? "Projected return" : "Estimated return";
  const compareLabel = quote ? "After your stake" : isStreak ? "Total multiplier" : "Quote odds";
  const marketMetricLabel = isStreak ? "Locks" : "Pool impact";
  const marketMetricValue = isStreak
    ? lockLabel
    : impact == null
      ? "At confirm"
      : `${impactPrefix}${impact.toFixed(1)}%`;

  return (
    <section
      className="overflow-hidden rounded-xl border border-turf-800 bg-turf-850"
      aria-label="Payout estimate"
    >
      <div className="flex items-center justify-between gap-2 border-b border-turf-800 px-3.5 py-2.5">
        <h3 className="font-data text-[10px] font-bold uppercase tracking-[0.16em] text-gold-300">
          {isStreak ? "Streak quote" : "Payout quote"}
        </h3>
        <span className="inline-flex items-center gap-1 rounded-full bg-turf-800 px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-ivory-faint">
          {receiptBadge}
        </span>
      </div>

      <div className="space-y-3 px-3.5 py-3">
        <div className="rounded-lg border border-gold-500/25 bg-gold-400/[0.08] p-3">
          <p className="font-data text-[10px] font-bold uppercase tracking-[0.16em] text-gold-300">
            Your stake
          </p>
          <p className="mt-1 font-data text-[22px] font-black leading-none text-ivory">
            {formatVnd(stake)}
            <span className="ml-1.5 text-[12px] font-bold text-ivory-faint">VND</span>
          </p>
          <p className="mt-1.5 text-[11px] font-semibold text-ivory-faint">
            This is the amount deducted when you confirm.
          </p>
        </div>

        <div className="rounded-lg border border-emerald-glow/25 bg-emerald-glow/[0.07] p-3">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-soft" />
            <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-soft">{outcomeLabel}</p>
          </div>
          {hasOdds ? (
            <div className="mt-2 space-y-3">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold text-ivory-dim">{returnLabel}</p>
                  <p className="font-data text-2xl font-black leading-none text-emerald-soft">
                    {formatVnd(payout)}
                    <span className="ml-1 text-[12px] font-bold text-emerald-soft/80">VND</span>
                  </p>
                </div>
                <span className={`rounded-md bg-emerald-glow/15 px-2 py-1 font-data text-[12px] font-bold ${profitTone}`}>
                  {profitPrefix}{Math.round(returnPct)}%
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold">
                <div className="rounded-md bg-turf-950/45 px-2.5 py-2">
                  <p className="text-ivory-faint">Estimated profit</p>
                  <p className={`mt-0.5 font-data font-bold ${profitTone}`}>{profitPrefix}{formatVnd(profit)} VND</p>
                </div>
                <div className="rounded-md bg-turf-950/45 px-2.5 py-2">
                  <p className="text-ivory-faint">If it loses</p>
                  <p className="mt-0.5 font-data font-bold text-rose-300/90">-{formatVnd(stake)} VND</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="mt-1.5 text-[12px] font-semibold text-ivory-faint">
              {quoteLoading ? "Building your quote..." : quoteError ?? "Pick a runner to see your payout."}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold">
          <div className="rounded-lg border border-turf-800 bg-turf-900/60 px-3 py-2">
            <p className="text-ivory-faint">{quote ? "Current line" : oddsLabel}</p>
            <p className="mt-0.5 font-data font-bold text-gold-300">
              {quote ? quote.currentOdds.toFixed(2) : hasOdds ? quotedOdds!.toFixed(2) : oddsNote ?? "-"}
            </p>
          </div>
          <div className="rounded-lg border border-turf-800 bg-turf-900/60 px-3 py-2">
            <p className="text-ivory-faint">{compareLabel}</p>
            <p className="mt-0.5 font-data font-bold text-ivory">
              {hasOdds ? quotedOdds!.toFixed(2) : "-"}
            </p>
          </div>
          <div className="rounded-lg border border-turf-800 bg-turf-900/60 px-3 py-2">
            <p className="text-ivory-faint">House fee</p>
            <p className="mt-0.5 font-data font-bold text-ivory">{quote?.houseFeePercent ?? feePercent}% included</p>
          </div>
          <div className="rounded-lg border border-turf-800 bg-turf-900/60 px-3 py-2">
            <p className="text-ivory-faint">{marketMetricLabel}</p>
            <p className={`mt-0.5 font-data font-bold ${isStreak ? "text-ivory" : impactTone}`}>
              {marketMetricValue}
            </p>
          </div>
        </div>

        {quote ? (
          <details className="group rounded-lg border border-turf-800 bg-turf-900/60">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-300">
              <span>
                <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-gold-300">
                  Pool breakdown
                </span>
                <span className="mt-0.5 block text-[10px] font-semibold text-ivory-faint">
                  Real player VND, fee, and net pool
                </span>
              </span>
              <span className="inline-flex items-center gap-1 rounded-md border border-turf-700 px-2 py-1 text-[10px] font-bold text-ivory-dim transition-colors group-open:border-gold-500/40 group-open:text-gold-200">
                Details
                <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
              </span>
            </summary>
            <div className="border-t border-turf-800 px-3 pb-3 pt-2">
              <dl className="space-y-1.5 text-[11px] font-semibold">
                <div className="flex justify-between gap-3">
                  <dt className="text-ivory-faint">Player pool before</dt>
                  <dd className="font-data text-ivory">{formatVnd(quote.playerPoolBefore)} VND</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-ivory-faint">Your stake</dt>
                  <dd className="font-data text-gold-300">+{formatVnd(quote.wagerAmount)} VND</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-ivory-faint">Player pool after</dt>
                  <dd className="font-data text-ivory">{formatVnd(quote.playerPoolAfter)} VND</dd>
                </div>
                <div className="flex justify-between gap-3 border-t border-turf-800 pt-1.5">
                  <dt className="text-ivory-faint">House fee</dt>
                  <dd className="font-data text-rose-200">-{formatVnd(quote.houseFeeAmount)} VND</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-ivory-faint">Net player pool</dt>
                  <dd className="font-data text-emerald-soft">{formatVnd(quote.netPlayerPoolAfter)} VND</dd>
                </div>
              </dl>
              <p className="mt-2 text-[10.5px] font-medium leading-relaxed text-ivory-faint">
                Pricing liquidity smooths the odds display and is not shown as real player pool.
              </p>
            </div>
          </details>
        ) : null}

        <div className="flex items-center justify-between gap-2 border-t border-turf-800 pt-2.5 text-[12px] font-semibold">
          <span className="inline-flex items-center gap-1.5 text-ivory-dim">
            <Wallet className="h-3.5 w-3.5" /> Wallet
          </span>
          <span className="inline-flex items-center gap-1.5 font-data text-ivory">
            <span className="text-ivory-faint">{formatVnd(balance)}</span>
            <ArrowRight className="h-3 w-3 text-ivory-faint" />
            <span className={balanceAfter < 0 ? "text-rose-300" : "text-ivory"}>{formatVnd(balanceAfter)}</span>
            <span className="text-ivory-faint">VND</span>
          </span>
        </div>

        <p className="flex items-start gap-1.5 text-[10.5px] font-medium leading-relaxed text-ivory-faint">
          <Info className="mt-0.5 h-3 w-3 shrink-0" />
          <span>
            {footerCopy ?? `Quote is calculated after your stake impact. Final odds can still move until ${lockLabel.toLowerCase()}.`}{" "}
            {onOpenRules ? (
              <button
                type="button"
                onClick={onOpenRules}
                className="font-bold text-gold-300 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold-300"
              >
                How it works
              </button>
            ) : null}
          </span>
        </p>
      </div>
    </section>
  );
}
