import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  History,
  Landmark,
  Lock,
  Plus,
  ReceiptText,
  RefreshCw,
  Wallet as WalletIcon,
  X,
} from "lucide-react";

import { walletApi } from "../../api/walletApi";
import raceHero from "../../assets/slide.jpg";
import { ClientFooter } from "../../components/client/ClientFooter";
import { ClientHeader } from "../../components/client/ClientHeader";
import { CountUp } from "../../components/client/CountUp";
import { useClientSession } from "../../hooks/useClientSession";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import type {
  WalletSummary,
  WalletTransaction,
  WalletTransactionType,
  Withdrawal,
  WithdrawalStatus,
} from "../../types/wallet";
import { BankLogo } from "./BankLogo";
import { maskAccount, parseBankInfo } from "./banks";
import { PerformanceChart } from "./PerformanceChart";
import { SavedAccounts } from "./SavedAccounts";
import { TopUpSheet } from "./TopUpSheet";
import { WithdrawSheet } from "./WithdrawSheet";

const vnd = new Intl.NumberFormat("en-US");

const TX_LABEL: Record<WalletTransactionType, string> = {
  TOPUP: "Top-up",
  BET_PLACED: "Prediction entry",
  BET_PAYOUT: "Race payout",
  BET_REFUND: "Prediction refund",
  WITHDRAWAL_HOLD: "Withdrawal hold",
  WITHDRAWAL_REFUND: "Withdrawal refund",
  ADMIN_ADJUSTMENT: "Adjustment",
};

const WITHDRAWAL_BADGE: Record<WithdrawalStatus, { label: string; className: string }> = {
  REQUESTED: { label: "Requested", className: "border-amber-300/25 bg-amber-300/10 text-amber-200" },
  APPROVED: { label: "Approved", className: "border-sky-300/25 bg-sky-300/10 text-sky-200" },
  REJECTED: { label: "Rejected", className: "border-rose-300/30 bg-rose-500/10 text-rose-300" },
  PAID: { label: "Paid", className: "border-emerald-soft/25 bg-emerald-soft/10 text-emerald-soft" },
  CANCELLED: { label: "Cancelled", className: "border-white/15 bg-white/5 text-ivory-dim" },
};

type LedgerFilterKey = "all" | "topup" | "predictions" | "payouts" | "withdrawals";

const LEDGER_FILTERS: { key: LedgerFilterKey; label: string; types: WalletTransactionType[] | null }[] = [
  { key: "all", label: "All", types: null },
  { key: "topup", label: "Top-ups", types: ["TOPUP"] },
  { key: "predictions", label: "Predictions", types: ["BET_PLACED"] },
  { key: "payouts", label: "Payouts", types: ["BET_PAYOUT", "BET_REFUND"] },
  { key: "withdrawals", label: "Withdrawals", types: ["WITHDRAWAL_HOLD", "WITHDRAWAL_REFUND"] },
];

function formatVnd(amount: number) {
  const sign = amount > 0 ? "+" : amount < 0 ? "-" : "";
  return `${sign}${vnd.format(Math.abs(amount))} VND`;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function dateGroupLabel(value: string) {
  const date = new Date(value);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (sameDay(date, now)) return "Today";
  if (sameDay(date, yesterday)) return "Yesterday";
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function transactionIcon(type: WalletTransactionType) {
  if (type === "TOPUP" || type === "WITHDRAWAL_REFUND" || type === "BET_PAYOUT") return ArrowUpRight;
  if (type === "BET_PLACED" || type === "WITHDRAWAL_HOLD") return ArrowDownRight;
  return RefreshCw;
}

type TimelineState = "done" | "pending";

function withdrawalSteps(item: Withdrawal): { label: string; state: TimelineState }[] {
  const approved = item.status === "APPROVED" || item.status === "PAID";
  const paid = item.status === "PAID";
  return [
    { label: "Requested", state: "done" },
    { label: "Approved", state: approved ? "done" : "pending" },
    { label: "Paid", state: paid ? "done" : "pending" },
  ];
}

function LoadingLine({ className = "" }: { className?: string }) {
  return <span className={`block animate-pulse rounded bg-white/10 ${className}`} />;
}

function Panel({
  children,
  className = "",
  id,
  labelledBy,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
  labelledBy?: string;
}) {
  return (
    <section id={id} aria-labelledby={labelledBy} className={`min-w-0 rounded-lg border border-white/10 bg-[#061a15] ${className}`}>
      {children}
    </section>
  );
}

function MoneyState({
  label,
  value,
  caption,
  tone,
  loading,
}: {
  label: string;
  value: number;
  caption: string;
  tone: string;
  loading: boolean;
}) {
  return (
    <div className="min-w-0 px-5 py-5 first:pl-6 last:pr-6">
      <p className="font-data text-[11px] uppercase tracking-[0.16em] text-ivory-faint">{label}</p>
      {loading ? (
        <LoadingLine className="mt-3 h-7 w-28" />
      ) : (
        <p className={`mt-2 font-data text-xl font-black sm:text-2xl ${tone}`}>{vnd.format(value)} VND</p>
      )}
      <p className="mt-1.5 text-xs leading-5 text-ivory-dim">{caption}</p>
    </div>
  );
}

function WithdrawalTimeline({ steps }: { steps: ReturnType<typeof withdrawalSteps> }) {
  return (
    <ol className="mt-3 flex items-center gap-1.5" aria-label="Request progress">
      {steps.map((step, index) => {
        const done = step.state === "done";
        return (
          <li key={step.label} className="flex min-w-0 flex-1 items-center gap-1.5">
            <span className="flex items-center gap-1.5">
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${done ? "bg-emerald-soft" : "border border-white/25 bg-transparent"}`}
                aria-hidden="true"
              />
              <span className={`truncate font-data text-[10px] uppercase tracking-[0.12em] ${done ? "text-ivory" : "text-ivory-faint"}`}>
                {step.label}
              </span>
            </span>
            {index < steps.length - 1 ? <span className="h-px flex-1 bg-white/10" aria-hidden="true" /> : null}
          </li>
        );
      })}
    </ol>
  );
}

function WithdrawalCard({
  item,
  onCancel,
  canceling,
}: {
  item: Withdrawal;
  onCancel: (id: number) => void;
  canceling: boolean;
}) {
  const badge = WITHDRAWAL_BADGE[item.status];
  const parsed = parseBankInfo(item.bankInfo);
  const isActive = item.status === "REQUESTED" || item.status === "APPROVED";

  return (
    <li className="rounded-xl border border-white/10 bg-[#030f0c] p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="font-data text-base font-black text-ivory">{vnd.format(item.amount)} VND</p>
        <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-bold ${badge.className}`}>{badge.label}</span>
      </div>

      <div className="mt-3 flex items-center gap-2.5">
        {parsed.code ? <BankLogo code={parsed.code} size={34} /> : null}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ivory">{parsed.bankName ?? item.bankInfo}</p>
          {parsed.account ? (
            <p className="truncate font-data text-xs text-ivory-faint">
              {maskAccount(parsed.account)} · {parsed.holder}
            </p>
          ) : null}
        </div>
      </div>

      {isActive ? <WithdrawalTimeline steps={withdrawalSteps(item)} /> : null}

      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="font-data text-[11px] text-ivory-faint">Requested {formatDateTime(item.requestedAt)}</span>
        {item.status === "REQUESTED" ? (
          <button
            type="button"
            onClick={() => onCancel(item.id)}
            disabled={canceling}
            aria-label={`Cancel withdrawal ${item.id}`}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-sm border border-rose-400/40 px-3 text-[11px] font-bold uppercase tracking-[0.1em] text-rose-300 transition-colors hover:bg-rose-500/10 hover:text-rose-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
            {canceling ? "Cancelling..." : "Cancel"}
          </button>
        ) : null}
      </div>

      {item.reviewNote ? <p className="mt-2 text-xs text-ivory-dim">{item.reviewNote}</p> : null}
    </li>
  );
}

export function WalletPage() {
  useDocumentTitle("My Wallet | Night at the Races");
  const { session } = useClientSession();
  const [summary, setSummary] = useState<WalletSummary | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [ledgerFilter, setLedgerFilter] = useState<LedgerFilterKey>("all");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [cancelingId, setCancelingId] = useState<number | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const topupStatus = searchParams.get("topup");

  const refresh = useCallback(async () => {
    const [summaryData, txData, wdData] = await Promise.all([
      walletApi.getSummary(),
      walletApi.getMyTransactions(),
      walletApi.getMyWithdrawals(),
    ]);
    setSummary(summaryData);
    setTransactions(txData);
    setWithdrawals(wdData);
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        await refresh();
      } catch (err) {
        console.error("Failed to load wallet.", err);
        if (mounted) setError("Could not load your wallet. Please try again.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [refresh]);

  const walletLocked = summary?.status === "LOCKED";
  const balance = summary?.balance ?? 0;
  const inPlay = summary?.inPlay ?? 0;
  const pendingWithdrawal = summary?.pendingWithdrawal ?? 0;
  const availableToWithdraw = Math.max(0, balance - inPlay - pendingWithdrawal);

  const filteredTransactions = useMemo(() => {
    const config = LEDGER_FILTERS.find((item) => item.key === ledgerFilter);
    if (!config || !config.types) return transactions;
    const allowed = new Set(config.types);
    return transactions.filter((tx) => allowed.has(tx.type));
  }, [transactions, ledgerFilter]);

  const ledgerGroups = useMemo(() => {
    const groups: { label: string; items: WalletTransaction[] }[] = [];
    for (const tx of filteredTransactions) {
      const label = dateGroupLabel(tx.createdAt);
      const last = groups[groups.length - 1];
      if (last && last.label === label) last.items.push(tx);
      else groups.push({ label, items: [tx] });
    }
    return groups;
  }, [filteredTransactions]);

  const activeWithdrawals = withdrawals.filter((w) => w.status === "REQUESTED" || w.status === "APPROVED");
  const historyWithdrawals = withdrawals.filter(
    (w) => w.status === "PAID" || w.status === "REJECTED" || w.status === "CANCELLED",
  );

  async function handleCancel(id: number) {
    setCancelingId(id);
    setCancelError(null);
    try {
      await walletApi.cancelWithdrawal(id);
      await refresh();
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Could not cancel that request.";
      setCancelError(message);
    } finally {
      setCancelingId(null);
    }
  }

  return (
    <div className="client-theme min-h-screen bg-[#030f0c] text-ivory">
      <ClientHeader />

      <main className="relative isolate mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[560px] bg-[radial-gradient(circle_at_20%_0%,rgba(212,175,55,0.18),transparent_32%),linear-gradient(180deg,rgba(31,157,118,0.13),rgba(3,15,12,0))]" />

        {topupStatus === "success" ? (
          <p
            className="mb-4 flex items-start gap-3 rounded-lg border border-emerald-soft/25 bg-emerald-soft/10 p-4 text-sm font-semibold text-emerald-soft"
            role="status"
          >
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            Top-up successful - your balance has been updated.
          </p>
        ) : topupStatus === "failed" ? (
          <p
            className="mb-4 flex items-start gap-3 rounded-lg border border-rose-300/25 bg-rose-400/10 p-4 text-sm font-semibold text-rose-200"
            role="alert"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            The top-up did not complete or was cancelled.
          </p>
        ) : null}

        <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_390px]">
          <div className="min-w-0 space-y-4">
            {/* ── Balance hero + money states ─────────────────────────── */}
            <section
              aria-labelledby="balance-hero-title"
              className="grain relative overflow-hidden rounded-lg border border-white/10 bg-[#061a15] shadow-[0_20px_60px_-44px_rgba(0,0,0,0.95)]"
            >
              <img src={raceHero} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover opacity-[0.10]" />
              <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(3,15,12,0.97),rgba(3,15,12,0.9)_55%,rgba(3,15,12,0.7))]" />

              <div className="relative">
                <div className="flex flex-col gap-8 p-6 sm:p-8 lg:flex-row lg:items-end lg:justify-between">
                  <div className="min-w-0">
                    <h1 className="sr-only">My wallet</h1>
                    <h2 id="balance-hero-title" className="eyebrow text-gold-300">
                      Available balance
                    </h2>
                    {loading ? (
                      <LoadingLine className="mt-5 h-14 w-72 max-w-full" />
                    ) : (
                      <p className="mt-4 flex items-baseline gap-2 whitespace-nowrap">
                        <CountUp
                          value={balance}
                          format={(n) => vnd.format(n)}
                          className="text-foil font-data font-black leading-none text-[clamp(2rem,7vw,3.75rem)]"
                        />
                        <span className="font-data text-sm font-bold text-gold-300">VND</span>
                      </p>
                    )}
                    {session?.fullName ? (
                      <p className="mt-4 text-sm text-ivory-dim">
                        Holder <span className="font-bold text-ivory">{session.fullName}</span>
                      </p>
                    ) : null}
                  </div>

                  <div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:flex-col">
                    <button
                      type="button"
                      onClick={() => setTopUpOpen(true)}
                      disabled={walletLocked}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-sm bg-gold-400 px-5 text-[13px] font-black uppercase tracking-[0.12em] text-turf-950 transition-colors hover:bg-gold-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
                    >
                      <Plus className="h-4 w-4" aria-hidden="true" />
                      Add money
                    </button>
                    <button
                      type="button"
                      onClick={() => setWithdrawOpen(true)}
                      disabled={walletLocked || loading}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-sm border border-gold-400/70 px-5 text-[13px] font-black uppercase tracking-[0.12em] text-gold-200 transition-colors hover:bg-gold-400 hover:text-turf-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
                    >
                      <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                      Withdraw
                    </button>
                  </div>
                </div>

                {walletLocked ? (
                  <p className="mx-6 mb-4 inline-flex items-center gap-2 rounded-full border border-rose-300/25 bg-rose-400/10 px-3 py-1.5 text-xs font-semibold text-rose-200 sm:mx-8">
                    <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                    Wallet is locked. Please contact support.
                  </p>
                ) : null}

                <div className="grid grid-cols-1 divide-y divide-white/10 border-t border-white/10 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                  <MoneyState label="Available" value={availableToWithdraw} caption="Ready to withdraw" tone="text-emerald-soft" loading={loading} />
                  <MoneyState label="In play" value={inPlay} caption="Locked in open predictions" tone="text-gold-300" loading={loading} />
                  <MoneyState label="Pending withdrawal" value={pendingWithdrawal} caption="Awaiting payout" tone="text-sky-200" loading={loading} />
                </div>
              </div>
            </section>

            {/* ── Performance equity curve ────────────────────────────── */}
            <PerformanceChart transactions={transactions} loading={loading} />

            {/* ── Wallet ledger ───────────────────────────────────────── */}
            <Panel className="overflow-hidden" labelledBy="wallet-ledger-title">
              <div className="flex flex-col gap-4 border-b border-white/10 p-5">
                <div>
                  <h2 id="wallet-ledger-title" className="text-xl font-black text-ivory">
                    Wallet ledger
                  </h2>
                  <p className="mt-1 text-sm text-ivory-dim">A finance-style audit trail for top-ups, entries, and payouts.</p>
                </div>
                <div className="flex flex-wrap gap-2" role="group" aria-label="Filter ledger">
                  {LEDGER_FILTERS.map((item) => {
                    const active = item.key === ledgerFilter;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setLedgerFilter(item.key)}
                        className={`min-h-9 rounded-full border px-3.5 font-data text-[11px] font-bold uppercase tracking-[0.12em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400 motion-reduce:transition-none ${
                          active
                            ? "border-gold-400 bg-gold-400 text-turf-950"
                            : "border-white/12 text-ivory-dim hover:border-gold-400/40 hover:text-gold-200"
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {error ? (
                <p className="m-5 flex items-start gap-3 rounded-lg border border-rose-300/25 bg-rose-400/10 p-4 text-sm font-semibold text-rose-200" role="alert">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  {error}
                </p>
              ) : loading ? (
                <div className="space-y-3 p-5" aria-label="Loading transactions">
                  {[0, 1, 2, 3].map((item) => (
                    <LoadingLine key={item} className="h-14 w-full" />
                  ))}
                </div>
              ) : transactions.length === 0 ? (
                <div className="p-8 text-center">
                  <WalletIcon className="mx-auto h-10 w-10 text-gold-300" aria-hidden="true" />
                  <p className="mt-4 text-sm font-semibold text-ivory">No transactions yet.</p>
                  <p className="mt-1 text-sm text-ivory-dim">Top up your wallet to start playing.</p>
                </div>
              ) : filteredTransactions.length === 0 ? (
                <div className="p-8 text-center">
                  <ReceiptText className="mx-auto h-10 w-10 text-gold-300" aria-hidden="true" />
                  <p className="mt-4 text-sm font-semibold text-ivory">No matching transactions.</p>
                  <p className="mt-1 text-sm text-ivory-dim">Try a different filter.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left text-sm" aria-label="Wallet ledger">
                    <thead className="bg-[#04120f] text-[11px] uppercase tracking-[0.14em] text-ivory-faint">
                      <tr>
                        <th scope="col" className="px-5 py-3 font-semibold">Type</th>
                        <th scope="col" className="px-5 py-3 font-semibold">Description</th>
                        <th scope="col" className="px-5 py-3 font-semibold">Date</th>
                        <th scope="col" className="px-5 py-3 text-right font-semibold">Amount</th>
                        <th scope="col" className="px-5 py-3 text-right font-semibold">Balance</th>
                      </tr>
                    </thead>
                    {ledgerGroups.map((group) => (
                      <tbody key={group.label} className="divide-y divide-white/5">
                        <tr>
                          <td colSpan={5} className="bg-[#04120f]/70 px-5 py-2 font-data text-[10px] uppercase tracking-[0.18em] text-ivory-faint">
                            {group.label}
                          </td>
                        </tr>
                        {group.items.map((tx) => {
                          const Icon = transactionIcon(tx.type);
                          const amountPositive = tx.amount >= 0;
                          return (
                            <tr key={tx.id} className="transition-colors hover:bg-white/[0.03] motion-reduce:transition-none">
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-3">
                                  <span className={`grid h-9 w-9 place-items-center rounded-lg bg-white/[0.04] ${amountPositive ? "text-emerald-soft" : "text-rose-400"}`}>
                                    <Icon className="h-4 w-4" aria-hidden="true" />
                                  </span>
                                  <span className="font-bold text-ivory">{TX_LABEL[tx.type] ?? tx.type}</span>
                                </div>
                              </td>
                              <td className="max-w-[260px] px-5 py-4 text-ivory-dim">
                                <span className="line-clamp-2">{tx.description || "Wallet transaction"}</span>
                              </td>
                              <td className="px-5 py-4 font-data text-xs text-ivory-faint">{formatDateTime(tx.createdAt)}</td>
                              <td className={`px-5 py-4 text-right font-data font-black ${amountPositive ? "text-emerald-soft" : "text-rose-400"}`}>
                                {formatVnd(tx.amount)}
                              </td>
                              <td className="px-5 py-4 text-right font-data text-xs text-ivory-dim">
                                {tx.balanceAfter != null ? `${vnd.format(tx.balanceAfter)} VND` : "Pending"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    ))}
                  </table>
                </div>
              )}
            </Panel>
          </div>

          {/* ── Right rail ─────────────────────────────────────────────── */}
          <aside className="space-y-4">
            <Panel labelledBy="withdrawal-requests-title" className="p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-sm border border-gold-400/30 bg-gold-400/10 text-gold-300">
                    <Landmark className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h2 id="withdrawal-requests-title" className="text-lg font-black text-ivory">
                      Payout queue
                    </h2>
                    <p className="text-sm text-ivory-dim">Your withdrawal requests.</p>
                  </div>
                </div>
                <span className="font-data text-xs font-bold text-ivory-faint">{withdrawals.length}</span>
              </div>

              {cancelError ? (
                <p className="mt-4 rounded-lg border border-rose-300/25 bg-rose-400/10 p-3 text-sm font-semibold text-rose-200" role="alert">
                  {cancelError}
                </p>
              ) : null}

              {loading ? (
                <div className="mt-5 space-y-3">
                  {[0, 1].map((item) => (
                    <LoadingLine key={item} className="h-24 w-full" />
                  ))}
                </div>
              ) : withdrawals.length === 0 ? (
                <div className="mt-5 rounded-lg border border-dashed border-white/15 p-5 text-center">
                  <ArrowUpRight className="mx-auto h-8 w-8 text-gold-300" aria-hidden="true" />
                  <p className="mt-3 text-sm font-semibold text-ivory">No requests yet.</p>
                  <p className="mt-1 text-xs leading-5 text-ivory-dim">Withdrawals you submit will appear here.</p>
                </div>
              ) : (
                <>
                  {activeWithdrawals.length > 0 ? (
                    <ul className="mt-5 space-y-3">
                      {activeWithdrawals.map((item) => (
                        <WithdrawalCard key={item.id} item={item} onCancel={handleCancel} canceling={cancelingId === item.id} />
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-5 rounded-lg border border-dashed border-white/15 p-4 text-center text-sm text-ivory-dim">
                      No active requests.
                    </p>
                  )}

                  {historyWithdrawals.length > 0 ? (
                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={() => setHistoryOpen((v) => !v)}
                        aria-expanded={historyOpen}
                        className="flex w-full items-center justify-between gap-3 rounded-lg border border-white/8 bg-white/[0.02] px-4 py-3 text-sm text-ivory-dim transition-colors hover:border-white/15 hover:text-ivory"
                      >
                        <span className="inline-flex items-center gap-2">
                          <History className="h-4 w-4 text-ivory-faint" aria-hidden="true" />
                          Past requests <span className="text-ivory-faint">({historyWithdrawals.length})</span>
                        </span>
                        <ChevronDown className={`h-4 w-4 transition-transform ${historyOpen ? "rotate-180" : ""}`} aria-hidden="true" />
                      </button>
                      {historyOpen ? (
                        <ul className="mt-3 space-y-3">
                          {historyWithdrawals.map((item) => (
                            <WithdrawalCard key={item.id} item={item} onCancel={handleCancel} canceling={cancelingId === item.id} />
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  ) : null}
                </>
              )}
            </Panel>

            <SavedAccounts />
          </aside>
        </div>
      </main>

      <TopUpSheet open={topUpOpen} onClose={() => setTopUpOpen(false)} />

      <WithdrawSheet
        open={withdrawOpen}
        available={availableToWithdraw}
        onClose={() => setWithdrawOpen(false)}
        onSubmitted={() => {
          void refresh();
        }}
      />

      <ClientFooter />
    </div>
  );
}
