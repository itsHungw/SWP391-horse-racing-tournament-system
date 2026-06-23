import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { walletApi } from "../../api/walletApi";
import { ClientHeader } from "../../components/client/ClientHeader";
import { ClientFooter } from "../../components/client/ClientFooter";
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

function formatVnd(amount: number) {
  const sign = amount > 0 ? "+" : amount < 0 ? "−" : "";
  return `${sign}${vnd.format(Math.abs(amount))} VND`;
}

const TX_LABEL: Record<WalletTransactionType, string> = {
  TOPUP: "Top-up",
  BET_PLACED: "Bet placed",
  BET_PAYOUT: "Bet payout",
  BET_REFUND: "Bet refund",
  WITHDRAWAL_HOLD: "Withdrawal hold",
  WITHDRAWAL_REFUND: "Withdrawal refund",
  ADMIN_ADJUSTMENT: "Adjustment",
};

const WITHDRAWAL_BADGE: Record<WithdrawalStatus, string> = {
  REQUESTED: "bg-amber-400/15 text-amber-300",
  APPROVED: "bg-sky-400/15 text-sky-300",
  REJECTED: "bg-rose-500/15 text-rose-300",
  PAID: "bg-emerald-glow/15 text-emerald-soft",
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
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

  async function handleWithdraw() {
    const amount = Number(withdrawAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setWithdrawError("Enter a valid amount.");
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
      setTopupError("Could not start the top-up. VNPay may not be configured (check .env).");
      setToppingUp(null);
    }
  }

  return (
    <div className="client-theme min-h-screen bg-turf-950 text-ivory">
      <ClientHeader />

      <main className="mx-auto max-w-[1000px] px-6 py-16 md:px-12 md:py-24">
        <Eyebrow tone="gold">Account</Eyebrow>
        <h1 className="mt-4 font-display text-[clamp(2.2rem,5vw,3.6rem)] font-light leading-[1.02] tracking-[-0.02em]">
          My Wallet
        </h1>

        {topupStatus === "success" ? (
          <p className="mt-6 rounded-lg bg-emerald-glow/10 p-4 text-sm font-semibold text-emerald-soft" role="status">
            Top-up successful — your balance has been updated.
          </p>
        ) : topupStatus === "failed" ? (
          <p className="mt-6 rounded-lg bg-rose-500/10 p-4 text-sm font-semibold text-rose-300" role="alert">
            The top-up did not complete or was cancelled.
          </p>
        ) : null}

        {/* Balance card */}
        <section className="mt-10 rounded-2xl border border-gold-600/25 bg-turf-900 p-8 md:p-10">
          <p className="font-data text-[11px] uppercase tracking-[0.2em] text-ivory-faint">Available balance</p>
          {loading ? (
            <div className="mt-3 h-12 w-56 animate-pulse rounded bg-white/5" />
          ) : (
            <p className="mt-2 font-display text-[clamp(2.4rem,7vw,4rem)] font-semibold tracking-tight text-gold-300">
              {vnd.format(wallet?.balance ?? 0)}
              <span className="ml-2 text-2xl text-ivory-dim">VND</span>
            </p>
          )}
          {wallet?.status === "LOCKED" ? (
            <p className="mt-3 inline-block rounded-full bg-rose-500/15 px-3 py-1 text-xs font-semibold text-rose-300">
              Wallet is locked — please contact support
            </p>
          ) : null}
          <div className="mt-8">
            <p className="font-data text-[11px] uppercase tracking-[0.2em] text-ivory-faint">Top up with VNPay</p>
            <div className="mt-3 flex flex-wrap gap-2.5">
              {TOPUP_PRESETS.map((amount) => (
                <button
                  key={amount}
                  type="button"
                  disabled={wallet?.status === "LOCKED" || toppingUp !== null}
                  onClick={() => handleTopUp(amount)}
                  className="inline-flex min-h-11 items-center justify-center rounded-sm bg-gold-400 px-5 text-[13px] font-bold uppercase tracking-[0.12em] text-turf-950 transition-colors hover:bg-gold-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {toppingUp === amount ? "Redirecting…" : `${vnd.format(amount)} VND`}
                </button>
              ))}
            </div>
            {topupError ? (
              <p className="mt-3 text-sm font-semibold text-rose-300" role="alert">
                {topupError}
              </p>
            ) : null}
          </div>

          <div className="mt-8 border-t border-white/10 pt-6">
            <p className="font-data text-[11px] uppercase tracking-[0.2em] text-ivory-faint">Withdraw to bank</p>
            <div className="mt-3 flex flex-col gap-2.5 sm:flex-row">
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="Amount (VND)"
                className="min-h-11 w-full rounded-sm border border-white/15 bg-turf-950 px-4 text-sm text-ivory placeholder:text-ivory-faint focus:border-gold-400 focus:outline-none sm:w-44"
              />
              <input
                type="text"
                value={withdrawBank}
                onChange={(e) => setWithdrawBank(e.target.value)}
                placeholder="Bank account (name · number · bank)"
                className="min-h-11 w-full flex-1 rounded-sm border border-white/15 bg-turf-950 px-4 text-sm text-ivory placeholder:text-ivory-faint focus:border-gold-400 focus:outline-none"
              />
              <button
                type="button"
                disabled={wallet?.status === "LOCKED" || withdrawing}
                onClick={handleWithdraw}
                className="inline-flex min-h-11 items-center justify-center rounded-sm border border-gold-400 px-5 text-[13px] font-bold uppercase tracking-[0.12em] text-gold-300 transition-colors hover:bg-gold-400 hover:text-turf-950 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {withdrawing ? "Submitting…" : "Request"}
              </button>
            </div>
            {withdrawError ? (
              <p className="mt-2 text-sm font-semibold text-rose-300" role="alert">
                {withdrawError}
              </p>
            ) : null}
            <p className="mt-2 text-xs text-ivory-faint">
              Requests are reviewed manually. The amount is held from your balance until paid or rejected.
            </p>
          </div>
        </section>

        {/* Withdrawal requests */}
        {withdrawals.length > 0 ? (
          <section className="mt-12">
            <h2 className="font-display text-xl font-medium text-ivory">Withdrawal requests</h2>
            <ul className="mt-6 divide-y divide-white/5 overflow-hidden rounded-xl border border-white/10 bg-turf-900">
              {withdrawals.map((w) => (
                <li key={w.id} className="flex items-center justify-between gap-4 px-5 py-4">
                  <div className="min-w-0">
                    <p className="font-semibold text-ivory">{vnd.format(w.amount)} VND</p>
                    <p className="mt-0.5 truncate text-xs text-ivory-faint">
                      {w.bankInfo}
                      {w.reviewNote ? ` · ${w.reviewNote}` : ""}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.1em] ${WITHDRAWAL_BADGE[w.status]}`}
                  >
                    {w.status}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* History */}
        <section className="mt-12">
          <h2 className="font-display text-xl font-medium text-ivory">Transaction history</h2>

          {error ? (
            <p className="mt-6 rounded-lg bg-rose-500/10 p-4 text-sm font-semibold text-rose-300" role="alert">
              {error}
            </p>
          ) : loading ? (
            <div className="mt-6 space-y-3">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-lg bg-white/5" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <p className="mt-6 rounded-lg border border-white/10 bg-turf-900 p-8 text-center text-sm text-ivory-dim">
              No transactions yet. Top up to start playing.
            </p>
          ) : (
            <ul className="mt-6 divide-y divide-white/5 overflow-hidden rounded-xl border border-white/10 bg-turf-900">
              {transactions.map((tx) => (
                <li key={tx.id} className="flex items-center justify-between gap-4 px-5 py-4">
                  <div className="min-w-0">
                    <p className="font-semibold text-ivory">{TX_LABEL[tx.type] ?? tx.type}</p>
                    <p className="mt-0.5 truncate text-xs text-ivory-faint">
                      {tx.description || formatDateTime(tx.createdAt)}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p
                      className={`font-data text-sm font-bold ${
                        tx.amount >= 0 ? "text-emerald-soft" : "text-rose-300"
                      }`}
                    >
                      {formatVnd(tx.amount)}
                    </p>
                    {tx.balanceAfter != null ? (
                      <p className="mt-0.5 text-[11px] text-ivory-faint">Balance: {vnd.format(tx.balanceAfter)} VND</p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      <ClientFooter />
    </div>
  );
}
