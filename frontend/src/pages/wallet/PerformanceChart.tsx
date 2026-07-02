import { useEffect, useMemo, useRef, useState } from "react";
import {
  AreaSeries,
  ColorType,
  CrosshairMode,
  createChart,
  LineStyle,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";
import { Activity } from "lucide-react";

import type { WalletTransaction } from "../../types/wallet";

type RangeKey = "1D" | "1W" | "1M" | "3M" | "All";
type SeriesPoint = { time: UTCTimestamp; value: number; amount: number; createdAt: string };

const RANGES: RangeKey[] = ["1D", "1W", "1M", "3M", "All"];
const RESULT_TYPES = new Set<WalletTransaction["type"]>(["BET_PLACED", "BET_PAYOUT", "BET_REFUND"]);
const vnd = new Intl.NumberFormat("en-US");

const ACCENT_UP = { line: "#2bbd8f", fill: "rgba(43,189,143,0.28)", text: "text-emerald-soft" };
const ACCENT_DOWN = { line: "#fda4af", fill: "rgba(253,164,175,0.26)", text: "text-rose-200" };

function formatSigned(amount: number) {
  const sign = amount > 0 ? "+" : amount < 0 ? "-" : "";
  return `${sign}${vnd.format(Math.abs(amount))} VND`;
}

function cutoffFor(range: RangeKey, now: number) {
  if (range === "All") return null;
  if (range === "1D") return now - 24 * 60 * 60 * 1000;
  const date = new Date(now);
  if (range === "1W") date.setDate(date.getDate() - 7);
  if (range === "1M") date.setMonth(date.getMonth() - 1);
  if (range === "3M") date.setMonth(date.getMonth() - 3);
  return date.getTime();
}

/** Cumulative net result (payouts − entries) from the wallet ledger, ascending by time. */
function buildSeries(transactions: WalletTransaction[]): SeriesPoint[] {
  let cumulative = 0;
  let lastTime = 0;
  return transactions
    .filter((tx) => RESULT_TYPES.has(tx.type))
    .slice()
    .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt))
    .map((tx) => {
      cumulative += tx.amount;
      // lightweight-charts requires strictly ascending, unique timestamps.
      const raw = Math.floor(Date.parse(tx.createdAt) / 1000);
      const time = Math.max(raw, lastTime + 1) as UTCTimestamp;
      lastTime = time;
      return { time, value: cumulative, amount: tx.amount, createdAt: tx.createdAt };
    });
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

function LoadingLine({ className = "" }: { className?: string }) {
  return <span className={`block animate-pulse rounded bg-white/10 ${className}`} />;
}

function ChartHeader({
  endingValue,
  delta,
  accentText,
  range,
  onRange,
}: {
  endingValue: number;
  delta: number;
  accentText: string;
  range: RangeKey;
  onRange: (r: RangeKey) => void;
}) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0">
        <p className="font-data text-[11px] uppercase tracking-[0.18em] text-gold-300">Net results over time</p>
        <h2 className="mt-2 text-xl font-black text-ivory">Performance</h2>
        <div className="mt-5 flex flex-wrap items-end gap-x-4 gap-y-2">
          <p className={`font-data text-3xl font-black leading-none sm:text-4xl ${accentText}`}>{formatSigned(endingValue)}</p>
          <p className="pb-1 font-data text-xs font-bold uppercase tracking-[0.14em] text-ivory-faint">
            Range <span className={delta >= 0 ? "text-emerald-soft" : "text-rose-200"}>{formatSigned(delta)}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-1 rounded-lg border border-white/10 bg-[#04120f] p-1" role="group" aria-label="Performance range">
        {RANGES.map((item) => {
          const active = item === range;
          return (
            <button
              key={item}
              type="button"
              aria-pressed={active}
              onClick={() => onRange(item)}
              className={`min-h-11 rounded-md px-3 font-data text-xs font-black transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400 motion-reduce:transition-none ${
                active ? "bg-gold-400 text-turf-950" : "text-ivory-faint hover:bg-white/8 hover:text-ivory"
              }`}
            >
              {item}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function PerformanceChart({ transactions, loading }: { transactions: WalletTransaction[]; loading: boolean }) {
  const [range, setRange] = useState<RangeKey>("All");
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null);

  const series = useMemo(() => buildSeries(transactions), [transactions]);
  const rangeData = useMemo(() => {
    const cutoff = cutoffFor(range, Date.now());
    return cutoff == null ? series : series.filter((point) => (point.time as number) * 1000 >= cutoff);
  }, [series, range]);

  const endingValue = series.at(-1)?.value ?? 0;
  const delta = rangeData.reduce((sum, point) => sum + point.amount, 0);
  const isPositive = endingValue >= 0;
  const accent = isPositive ? ACCENT_UP : ACCENT_DOWN;
  const ariaRange = range === "All" ? "all" : range.toLowerCase();
  const hasChart = series.length >= 2;

  // Create / recreate the chart when data, range, or accent changes.
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !hasChart) return;

    // The canvas chart only renders in a real browser; jsdom has no 2D context,
    // so lightweight-charts would throw on async draws. The header + a11y summary
    // still render, which is what the unit tests assert.
    if (import.meta.env.MODE === "test") return;

    let chart: IChartApi | null = null;
    try {
      chart = createChart(el, {
        autoSize: true,
        layout: {
          background: { type: ColorType.Solid, color: "transparent" },
          textColor: "#8f8c7e",
          fontFamily: "Geist Mono, ui-monospace, monospace",
          attributionLogo: false,
        },
        grid: { vertLines: { visible: false }, horzLines: { color: "rgba(255,255,255,0.06)" } },
        rightPriceScale: { borderVisible: false, scaleMargins: { top: 0.18, bottom: 0.12 } },
        timeScale: { borderVisible: false, fixLeftEdge: true, fixRightEdge: true, timeVisible: range === "1D" || range === "1W" },
        handleScroll: false,
        handleScale: false,
        crosshair: {
          mode: CrosshairMode.Magnet,
          vertLine: { color: "rgba(232,205,126,0.4)", width: 1, style: LineStyle.Dashed, labelVisible: false },
          horzLine: { color: "rgba(232,205,126,0.4)", width: 1, style: LineStyle.Dashed, labelVisible: false },
        },
        localization: { priceFormatter: (value: number) => `${vnd.format(Math.round(value))} ₫` },
      });

      const areaSeries = chart.addSeries(AreaSeries, {
        lineColor: accent.line,
        topColor: accent.fill,
        bottomColor: "rgba(4,18,15,0)",
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerRadius: 4,
        crosshairMarkerBorderColor: accent.line,
        crosshairMarkerBackgroundColor: "#04140f",
      });
      areaSeries.setData(rangeData.map((point) => ({ time: point.time, value: point.value })));
      chart.timeScale().fitContent();

      const tooltip = tooltipRef.current;
      chart.subscribeCrosshairMove((param) => {
        if (!tooltip) return;
        const point = param.seriesData.get(areaSeries) as { value: number } | undefined;
        if (!param.time || !param.point || !point) {
          tooltip.style.opacity = "0";
          return;
        }
        const date = new Date((param.time as number) * 1000);
        tooltip.innerHTML = `<span class="block text-ivory">${formatSigned(point.value)}</span><span class="block text-ivory-faint">${new Intl.DateTimeFormat(
          "en-GB",
          { day: "2-digit", month: "short", year: "numeric" },
        ).format(date)}</span>`;
        tooltip.style.opacity = "1";
        const x = Math.min(Math.max(param.point.x + 14, 8), el.clientWidth - 130);
        tooltip.style.transform = `translate(${x}px, 12px)`;
      });

      chartRef.current = chart;
      seriesRef.current = areaSeries;
    } catch {
      // Non-DOM environments (jsdom) can't host a canvas chart; the header + a11y
      // summary still render so the component degrades gracefully.
      chart = null;
    }

    return () => {
      chartRef.current = null;
      seriesRef.current = null;
      chart?.remove();
    };
  }, [rangeData, accent.line, accent.fill, hasChart, range]);

  if (loading) {
    return (
      <section className="rounded-lg border border-white/10 bg-[#061a15] p-5" aria-busy="true" aria-label="Loading performance">
        <div className="flex items-start justify-between gap-4">
          <div>
            <LoadingLine className="h-3 w-36" />
            <LoadingLine className="mt-4 h-7 w-40" />
            <LoadingLine className="mt-3 h-4 w-28" />
          </div>
          <LoadingLine className="h-10 w-10 rounded-sm" />
        </div>
        <LoadingLine className="mt-8 h-[220px] w-full" />
      </section>
    );
  }

  if (!hasChart) {
    return (
      <section className="rounded-lg border border-white/10 bg-[#061a15] p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-data text-[11px] uppercase tracking-[0.18em] text-gold-300">Net results over time</p>
            <h2 className="mt-2 text-xl font-black text-ivory">Performance</h2>
          </div>
          <span className="grid h-10 w-10 place-items-center rounded-sm border border-gold-400/25 bg-gold-400/10 text-gold-300">
            <Activity className="h-5 w-5" aria-hidden="true" />
          </span>
        </div>
        <div className="mt-8 rounded-lg border border-white/10 bg-[#04120f] px-5 py-10 text-center">
          <Activity className="mx-auto h-8 w-8 text-gold-300" aria-hidden="true" />
          <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-ivory-dim">
            Your performance curve appears after your first settled prediction.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-white/10 bg-[#061a15] p-5 shadow-[0_20px_60px_-48px_rgba(0,0,0,0.95)]">
      <ChartHeader endingValue={endingValue} delta={delta} accentText={accent.text} range={range} onRange={setRange} />

      <div
        className="relative mt-6 overflow-hidden rounded-lg border border-white/10 bg-[#04120f]"
        role="img"
        aria-label={`Performance: net result ${formatSigned(endingValue)} over ${ariaRange}`}
      >
        <div ref={containerRef} className="h-[260px] w-full" />
        <div
          ref={tooltipRef}
          className="pointer-events-none absolute left-0 top-0 z-10 rounded-md border border-white/10 bg-turf-950/95 px-2.5 py-1.5 font-data text-[11px] opacity-0 shadow-lg transition-opacity"
          aria-hidden="true"
        />
        {rangeData.length === 0 ? (
          <p className="pointer-events-none absolute inset-0 grid place-items-center font-data text-xs uppercase tracking-[0.16em] text-ivory-faint">
            No results in this range
          </p>
        ) : null}
      </div>

      <div className="mt-3 flex items-center justify-between gap-4 font-data text-[11px] uppercase tracking-[0.14em] text-ivory-faint">
        <span>{rangeData[0] ? formatShortDate(rangeData[0].createdAt) : "—"}</span>
        <span className={accent.text}>Now {formatSigned(endingValue)}</span>
        <span>{rangeData.at(-1) ? formatShortDate(rangeData.at(-1)!.createdAt) : "—"}</span>
      </div>
    </section>
  );
}
