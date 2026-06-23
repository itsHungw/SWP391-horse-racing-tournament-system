import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Landmark,
  Lock,
  Plus,
  ReceiptText,
  RefreshCw,
  ShieldCheck,
  Trophy,
  Wallet as WalletIcon,
} from "lucide-react";

import { walletApi } from "../../api/walletApi";
import raceHero from "../../assets/slide.jpg";
import { ClientFooter } from "../../components/client/ClientFooter";
import { ClientHeader } from "../../components/client/ClientHeader";
import { Eyebrow } from "../../components/client/primitives";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import type {
  Wallet,
  WalletTransaction,
  WalletTransactionType,
  Withdrawal,
  WithdrawalStatus,
} from "../../types/wallet";

const vnd = new Intl.NumberFormat("en-US");
const TOPUP_PRESETS = [50000, 100000, 200000, 500000];

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
  REQUESTED: {
    label: "Requested",
    className: "border-amber-300/25 bg-amber-300/10 text-amber-200",
  },
  APPROVED: {
    label: "Approved",
    className: "border-sky-300/25 bg-sky-300/10 text-sky-200",
  },
  REJECTED: {
    label: "Rejected",
    className: "border-rose-300/25 bg-rose-400/10 text-rose-200",
  },
  PAID: {
    label: "Paid",
    className: "border-emerald-soft/25 bg-emerald-soft/10 text-emerald-soft",
  },
};

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

function transactionIcon(type: WalletTransactionType) {
  if (type === "TOPUP" || type === "WITHDRAWAL_REFUND" || type === "BET_PAYOUT") return ArrowUpRight;
  if (type === "BET_PLACED" || type === "WITHDRAWAL_HOLD") return ArrowDownRight;
  return RefreshCw;
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
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={`min-w-0 rounded-lg border border-white/10 bg-[#061a15]/95 ${className}`}
    >
      {children}
    </section>
  );
}

export function WalletPage() {
  useDocumentTitle("My Wallet | Night at the Races");
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toppingUp, setToppingUp] = useState<number | null>(null);
  const [topupError, setTopupError] = useState<string | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawBank, setWithdrawBank] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const topupStatus = searchParams.get("topup");

  const refresh = useCallback(async () => {
    const [walletData, txData, wdData] = await Promise.all([
      walletApi.getMyWallet(),
      walletApi.getMyTransactions(),
      walletApi.getMyWithdrawals(),
    ]);
    setWallet(walletData);
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

  const walletLocked = wallet?.status === "LOCKED";
  const latestTransaction = transactions[0];
  const walletSummary = useMemo(() => {
    const incoming = transactions.filter((tx) => tx.amount > 0).reduce((sum, tx) => sum + tx.amount, 0);
    const outgoing = transactions.filter((tx) => tx.amount < 0).reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
    const pendingWithdrawals = withdrawals
      .filter((item) => item.status === "REQUESTED" || item.status === "APPROVED")
      .reduce((sum, item) => sum + item.amount, 0);

    return { incoming, outgoing, pendingWithdrawals };
  }, [transactions, withdrawals]);

  async function handleWithdraw(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amount = Number(withdrawAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setWithdrawError("Enter a valid withdrawal amount.");
      return;
    }
    if (!withdrawBank.trim()) {
      setWithdrawError("Enter bank account details.");
      return;
    }

    setWithdrawing(true);
    setWithdrawError(null);
    try {
      await walletApi.createWithdrawal(amount, withdrawBank.trim());
      setWithdrawAmount("");
      setWithdrawBank("");
      await refresh();
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Could not submit the withdrawal request.";
      setWithdrawError(message);
    } finally {
      setWithdrawing(false);
    }
  }

  async function handleTopUp(amount: number) {
    setToppingUp(amount);
    setTopupError(null);
    try {
      const { paymentUrl } = await walletApi.createTopUp(amount);
      window.location.href = paymentUrl;
    } catch (err) {
      console.error("Top-up request failed.", err);
      setTopupError("Could not start the top-up. VNPay may not be configured. Check .env.");
      setToppingUp(null);
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
            <section
              aria-labelledby="wallet-pass-title"
              className="relative overflow-hidden rounded-lg border border-white/10 bg-[#061a15] shadow-[0_20px_60px_-44px_rgba(0,0,0,0.95)]"
            >
              <div className="grid min-w-0 gap-0 lg:grid-cols-[minmax(0,1fr)_420px]">
                <div className="relative min-h-[370px] p-6 sm:p-8 lg:p-10">
                  <img
                    src={raceHero}
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 h-full w-full object-cover opacity-16"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,15,12,0.96),rgba(3,15,12,0.86)_58%,rgba(3,15,12,0.58))]" />

                  <div className="relative flex min-h-[310px] flex-col justify-between gap-10">
                    <div>
                      <Eyebrow tone="gold">Wallet OS</Eyebrow>
                      <h1
                        id="wallet-pass-title"
                        className="mt-4 max-w-xl font-display text-4xl font-light leading-[1.06] tracking-[-0.02em] text-ivory sm:text-5xl lg:text-6xl"
                      >
                        Racing pass
                      </h1>
                      <p className="mt-4 max-w-2xl text-base leading-7 text-ivory-dim">
                        A finance-grade wallet for race entries, winnings, top-ups, and withdrawal requests.
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      <div>
                        <p className="text-sm font-semibold text-ivory-dim">Account state</p>
                        <p className="mt-1 inline-flex items-center gap-2 rounded-full border border-emerald-soft/25 bg-emerald-soft/10 px-3 py-1 text-xs font-bold text-emerald-soft">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-soft" aria-hidden="true" />
                          {walletLocked ? "Locked" : "Active"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-ivory-dim">Latest activity</p>
                        <p className="mt-1 font-data text-sm font-black text-ivory">
                          {latestTransaction ? TX_LABEL[latestTransaction.type] : "No activity"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-ivory-dim">Pending payout</p>
                        <p className="mt-1 font-data text-sm font-black text-gold-300">
                          {vnd.format(walletSummary.pendingWithdrawals)} VND
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <aside className="relative border-t border-white/10 bg-[#04120f] p-5 sm:p-6 lg:border-l lg:border-t-0">
                  <div className="rounded-lg border border-gold-400/30 bg-[linear-gradient(135deg,rgba(212,175,55,0.22),rgba(6,26,21,0.96)_42%,rgba(3,15,12,0.98))] p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-data text-[11px] uppercase tracking-[0.18em] text-gold-200">
                          Available balance
                        </p>
                        {loading ? (
                          <LoadingLine className="mt-4 h-12 w-56" />
                        ) : (
                          <p className="mt-3 font-data text-4xl font-black leading-none text-ivory sm:text-5xl">
                            {vnd.format(wallet?.balance ?? 0)}
                          </p>
                        )}
                        <p className="mt-2 font-data text-sm font-bold text-gold-300">VND wallet</p>
                      </div>
                      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-sm bg-gold-400 text-turf-950">
                        <WalletIcon className="h-6 w-6" aria-hidden="true" />
                      </span>
                    </div>

                    <div className="mt-12 grid grid-cols-2 gap-3 border-t border-white/10 pt-4">
                      <div>
                        <p className="text-xs text-ivory-faint">Holder</p>
                        <p className="mt-1 text-sm font-bold text-ivory">Racing member</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-ivory-faint">Pass tier</p>
                        <p className="mt-1 text-sm font-bold text-gold-200">Champion</p>
                      </div>
                    </div>
                  </div>

                  {walletLocked ? (
                    <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-rose-300/25 bg-rose-400/10 px-3 py-1.5 text-xs font-semibold text-rose-200">
                      <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                      Wallet is locked. Please contact support.
                    </p>
                  ) : null}
                </aside>
              </div>
            </section>

            <section
              aria-labelledby="money-movement-title"
              className="rounded-lg border border-white/10 bg-[#061a15] p-4 sm:p-5"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <h2 id="money-movement-title" className="text-lg font-black text-ivory">
                    Money movement
                  </h2>
                  <p className="mt-1 text-sm text-ivory-dim">Fast VNPay presets with one clear withdrawal path.</p>
                </div>
                <a
                  href="#withdraw-panel"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-sm border border-gold-400/70 px-5 text-[13px] font-black uppercase tracking-[0.12em] text-gold-200 transition-colors hover:bg-gold-400 hover:text-turf-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400 motion-reduce:transition-none"
                >
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                  Withdraw
                </a>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {TOPUP_PRESETS.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    aria-label={`Top up ${vnd.format(amount)} VND`}
                    disabled={walletLocked || toppingUp !== null}
                    onClick={() => handleTopUp(amount)}
                    className="group min-h-[92px] rounded-lg border border-white/10 bg-[#04120f] p-4 text-left transition-colors hover:border-gold-400 hover:bg-gold-400 hover:text-turf-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
                  >
                    <span className="flex items-center justify-between gap-3">
                      <span className="grid h-9 w-9 place-items-center rounded-sm bg-white/5 text-gold-300 group-hover:bg-turf-950 group-hover:text-gold-200">
                        <Plus className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <span className="font-data text-[11px] uppercase tracking-[0.14em] text-ivory-faint group-hover:text-turf-800">
                        VNPay
                      </span>
                    </span>
                    <span className="mt-4 block font-data text-lg font-black text-ivory group-hover:text-turf-950">
                      {toppingUp === amount ? "Redirecting..." : `${vnd.format(amount)} VND`}
                    </span>
                  </button>
                ))}
              </div>

              {topupError ? (
                <p className="mt-4 flex items-start gap-2 rounded-lg border border-rose-300/25 bg-rose-400/10 p-3 text-sm font-semibold text-rose-200" role="alert">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  {topupError}
                </p>
              ) : null}
            </section>

            <section aria-label="Wallet overview" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  label: "Total received",
                  value: formatVnd(walletSummary.incoming),
                  icon: ArrowUpRight,
                  tone: "text-emerald-soft",
                },
                {
                  label: "Total used",
                  value: formatVnd(-walletSummary.outgoing),
                  icon: ArrowDownRight,
                  tone: "text-rose-200",
                },
                {
                  label: "Pending payout",
                  value: `${vnd.format(walletSummary.pendingWithdrawals)} VND`,
                  icon: Clock,
                  tone: "text-gold-300",
                },
                {
                  label: "Ledger rows",
                  value: vnd.format(transactions.length),
                  icon: ReceiptText,
                  tone: "text-sky-200",
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="rounded-lg border border-white/10 bg-[#061a15] p-5">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-sm font-semibold text-ivory-dim">{item.label}</p>
                      <span className={`grid h-9 w-9 place-items-center rounded-sm bg-white/5 ${item.tone}`}>
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                    </div>
                    {loading ? (
                      <LoadingLine className="mt-4 h-7 w-32" />
                    ) : (
                      <p className={`mt-4 font-data text-xl font-black ${item.tone}`}>{item.value}</p>
                    )}
                  </div>
                );
              })}
            </section>

            <Panel className="overflow-hidden" labelledBy="cashflow-ledger-title">
              <div className="flex flex-col gap-3 border-b border-white/10 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 id="cashflow-ledger-title" className="text-xl font-black text-ivory">
                    Cashflow ledger
                  </h2>
                  <p className="mt-1 text-sm text-ivory-dim">A finance-style audit trail for top-ups, entries, and payouts.</p>
                </div>
                <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-ivory-dim">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-soft" aria-hidden="true" />
                  Live ledger
                </span>
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
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left text-sm" aria-label="Cashflow ledger">
                    <thead className="bg-[#04120f] text-[11px] uppercase tracking-[0.14em] text-ivory-faint">
                      <tr>
                        <th scope="col" className="px-5 py-3 font-semibold">Type</th>
                        <th scope="col" className="px-5 py-3 font-semibold">Description</th>
                        <th scope="col" className="px-5 py-3 font-semibold">Date</th>
                        <th scope="col" className="px-5 py-3 text-right font-semibold">Amount</th>
                        <th scope="col" className="px-5 py-3 text-right font-semibold">Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {transactions.map((tx) => {
                        const Icon = transactionIcon(tx.type);
                        const amountPositive = tx.amount >= 0;
                        return (
                          <tr key={tx.id} className="transition-colors hover:bg-white/[0.03] motion-reduce:transition-none">
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <span
                                  className={`grid h-9 w-9 place-items-center rounded-sm ${
                                    amountPositive ? "bg-emerald-soft/10 text-emerald-soft" : "bg-rose-400/10 text-rose-200"
                                  }`}
                                >
                                  <Icon className="h-4 w-4" aria-hidden="true" />
                                </span>
                                <span className="font-bold text-ivory">{TX_LABEL[tx.type] ?? tx.type}</span>
                              </div>
                            </td>
                            <td className="max-w-[260px] px-5 py-4 text-ivory-dim">
                              <span className="line-clamp-2">{tx.description || "Wallet transaction"}</span>
                            </td>
                            <td className="px-5 py-4 font-data text-xs text-ivory-faint">{formatDateTime(tx.createdAt)}</td>
                            <td className={`px-5 py-4 text-right font-data font-black ${amountPositive ? "text-emerald-soft" : "text-rose-200"}`}>
                              {formatVnd(tx.amount)}
                            </td>
                            <td className="px-5 py-4 text-right font-data text-xs text-ivory-dim">
                              {tx.balanceAfter != null ? `${vnd.format(tx.balanceAfter)} VND` : "Pending"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Panel>
          </div>

          <aside className="space-y-4">
            <Panel id="withdraw-panel" labelledBy="withdraw-title" className="p-5">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-sm border border-gold-400/30 bg-gold-400/10 text-gold-300">
                  <Landmark className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h2 id="withdraw-title" className="text-lg font-black text-ivory">
                    Withdrawal desk
                  </h2>
                  <p className="text-sm text-ivory-dim">Submit bank payout requests for review.</p>
                </div>
              </div>

              <form className="mt-5 space-y-4" onSubmit={handleWithdraw}>
                <div>
                  <label htmlFor="withdraw-amount" className="text-sm font-bold text-ivory">
                    Withdraw amount
                  </label>
                  <div className="mt-2 flex min-h-11 items-center rounded-sm border border-white/15 bg-[#030f0c] focus-within:border-gold-400 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-gold-400">
                    <input
                      id="withdraw-amount"
                      type="number"
                      inputMode="numeric"
                      min={0}
                      value={withdrawAmount}
                      onChange={(event) => setWithdrawAmount(event.target.value)}
                      placeholder="150000"
                      className="min-h-11 w-full bg-transparent px-4 text-sm font-semibold text-ivory outline-none placeholder:text-ivory-faint"
                      disabled={walletLocked || withdrawing}
                      aria-describedby="withdraw-help withdraw-error"
                    />
                    <span className="px-4 font-data text-xs font-bold text-gold-300">VND</span>
                  </div>
                </div>

                <div>
                  <label htmlFor="withdraw-bank" className="text-sm font-bold text-ivory">
                    Bank account details
                  </label>
                  <input
                    id="withdraw-bank"
                    type="text"
                    value={withdrawBank}
                    onChange={(event) => setWithdrawBank(event.target.value)}
                    placeholder="Name - account number - bank"
                    className="mt-2 min-h-11 w-full rounded-sm border border-white/15 bg-[#030f0c] px-4 text-sm font-semibold text-ivory outline-none placeholder:text-ivory-faint focus:border-gold-400 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-gold-400"
                    disabled={walletLocked || withdrawing}
                    aria-describedby="withdraw-help withdraw-error"
                  />
                </div>

                {withdrawError ? (
                  <p id="withdraw-error" className="rounded-lg border border-rose-300/25 bg-rose-400/10 p-3 text-sm font-semibold text-rose-200" role="alert">
                    {withdrawError}
                  </p>
                ) : null}

                <p id="withdraw-help" className="text-xs leading-5 text-ivory-faint">
                  Approved requests hold the amount until the bank transfer is paid or rejected.
                </p>

                <button
                  type="submit"
                  disabled={walletLocked || withdrawing}
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-sm border border-gold-400 bg-transparent px-5 text-[13px] font-black uppercase tracking-[0.12em] text-gold-200 transition-colors hover:bg-gold-400 hover:text-turf-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
                >
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                  {withdrawing ? "Submitting..." : "Request withdrawal"}
                </button>
              </form>
            </Panel>

            <Panel labelledBy="guardrails-title" className="p-5">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-sm border border-emerald-soft/25 bg-emerald-soft/10 text-emerald-soft">
                  <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h2 id="guardrails-title" className="text-lg font-black text-ivory">
                    Platform guardrails
                  </h2>
                  <p className="text-sm text-ivory-dim">Built for trust, not betting ambiguity.</p>
                </div>
              </div>

              <dl className="mt-5 space-y-4">
                <div className="flex items-center justify-between gap-4 border-t border-white/10 pt-4">
                  <dt className="text-sm text-ivory-dim">Currency model</dt>
                  <dd className="text-right text-sm font-bold text-ivory">Virtual points</dd>
                </div>
                <div className="flex items-center justify-between gap-4 border-t border-white/10 pt-4">
                  <dt className="text-sm text-ivory-dim">Withdrawal review</dt>
                  <dd className="text-right text-sm font-bold text-gold-300">Manual approval</dd>
                </div>
                <div className="flex items-center justify-between gap-4 border-t border-white/10 pt-4">
                  <dt className="text-sm text-ivory-dim">Ledger status</dt>
                  <dd className="text-right text-sm font-bold text-emerald-soft">Auditable</dd>
                </div>
              </dl>

              <Link
                to="/spectator/predictions"
                className="mt-5 inline-flex min-h-10 w-full items-center justify-center rounded-sm border border-white/10 bg-white/5 px-4 text-xs font-black uppercase tracking-[0.12em] text-ivory transition-colors hover:border-gold-400/60 hover:text-gold-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400 motion-reduce:transition-none"
              >
                Go to predictions
              </Link>
            </Panel>

            <Panel labelledBy="withdrawal-requests-title" className="p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 id="withdrawal-requests-title" className="text-lg font-black text-ivory">Payout queue</h2>
                <span className="font-data text-xs font-bold text-ivory-faint">{withdrawals.length}</span>
              </div>

              {loading ? (
                <div className="mt-5 space-y-3">
                  {[0, 1].map((item) => (
                    <LoadingLine key={item} className="h-16 w-full" />
                  ))}
                </div>
              ) : withdrawals.length === 0 ? (
                <div className="mt-5 rounded-lg border border-dashed border-white/15 p-5 text-center">
                  <Trophy className="mx-auto h-8 w-8 text-gold-300" aria-hidden="true" />
                  <p className="mt-3 text-sm font-semibold text-ivory">No requests yet.</p>
                  <p className="mt-1 text-xs leading-5 text-ivory-dim">Withdrawals you submit will appear here.</p>
                </div>
              ) : (
                <ul className="mt-5 space-y-3">
                  {withdrawals.map((item) => {
                    const badge = WITHDRAWAL_BADGE[item.status];
                    return (
                      <li key={item.id} className="rounded-lg border border-white/10 bg-[#030f0c] p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-data text-base font-black text-ivory">{vnd.format(item.amount)} VND</p>
                            <p className="mt-1 break-words text-sm text-ivory-dim">{item.bankInfo}</p>
                          </div>
                          <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-bold ${badge.className}`}>
                            {badge.label}
                          </span>
                        </div>
                        <p className="mt-3 font-data text-[11px] text-ivory-faint">
                          Requested {formatDateTime(item.requestedAt)}
                        </p>
                        {item.reviewNote ? <p className="mt-2 text-xs text-ivory-dim">{item.reviewNote}</p> : null}
                      </li>
                    );
                  })}
                </ul>
              )}
            </Panel>
          </aside>
        </div>
      </main>

      <ClientFooter />
    </div>
  );
}
