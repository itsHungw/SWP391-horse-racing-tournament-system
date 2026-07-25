import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Plus, ShieldCheck, Trash2, X } from "lucide-react";

import { walletApi } from "../../api/walletApi";
import type { BankAccount } from "../../types/wallet";
import { BankLogo } from "./BankLogo";
import { BankSelect } from "./BankSelect";
import { toBankOptions, type Bank } from "./banks";

const vnd = new Intl.NumberFormat("en-US");

function mask(account: string) {
  return account.length >= 4 ? `\u2022\u2022\u2022\u2022 ${account.slice(-4)}` : account;
}

export function WithdrawSheet({
  open,
  available,
  onClose,
  onSubmitted,
}: {
  open: boolean;
  available: number;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const reduce = useReducedMotion();
  const [amount, setAmount] = useState("");
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [directoryLoading, setDirectoryLoading] = useState(false);
  const [directoryError, setDirectoryError] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [newBankCode, setNewBankCode] = useState<string | null>(null);
  const [newAccount, setNewAccount] = useState("");
  const [newHolder, setNewHolder] = useState("");
  const [savingBank, setSavingBank] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setAmount("");
    setError(null);
    setDirectoryLoading(true);
    setDirectoryError(false);
    walletApi
      .getBankDirectory()
      .then((directory) => setBanks(toBankOptions(directory)))
      .catch(() => {
        setBanks([]);
        setDirectoryError(true);
      })
      .finally(() => setDirectoryLoading(false));
    walletApi
      .getBankAccounts()
      .then((list) => {
        setAccounts(list);
        setSelectedId(list[0]?.id ?? null);
        setAdding(list.length === 0);
      })
      .catch(() => {
        setAccounts([]);
        setSelectedId(null);
        setAdding(true);
      });
  }, [open]);

  async function retryDirectory() {
    setDirectoryLoading(true);
    setDirectoryError(false);
    try {
      setBanks(toBankOptions(await walletApi.getBankDirectory()));
    } catch {
      setDirectoryError(true);
    } finally {
      setDirectoryLoading(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const amountValue = Number(amount);
  const amountValid = Number.isFinite(amountValue) && amountValue > 0 && amountValue <= available;
  const validAmount = amountValid ? amountValue : 0;
  const balanceAfter = Math.max(available - validAmount, 0);
  const selectedAccount = accounts.find((a) => a.id === selectedId) ?? null;
  const canSubmit = amountValid && Boolean(selectedAccount) && !submitting;

  function setCappedAmount(raw: string) {
    const digits = raw.replace(/[^\d]/g, "");
    if (!digits) {
      setAmount("");
      return;
    }
    setAmount(String(Math.min(Number(digits), Math.max(available, 0))));
  }

  function setPercentAmount(percent: number) {
    setAmount(String(Math.floor(Math.max(available, 0) * percent)));
  }

  async function handleSaveBank() {
    const bank = banks.find((b) => b.code === newBankCode);
    if (!bank) return setError("Please select a bank.");
    if (newAccount.trim().length < 6) return setError("Enter a valid account number.");
    if (newHolder.trim().length < 2) return setError("Enter the account holder name.");
    setSavingBank(true);
    setError(null);
    try {
      const saved = await walletApi.addBankAccount({
        bankCode: bank.code,
        accountNumber: newAccount.trim(),
        accountHolder: newHolder.trim(),
        label: null,
      });
      setAccounts((prev) => [saved, ...prev]);
      setSelectedId(saved.id);
      setAdding(false);
      setNewBankCode(null);
      setNewAccount("");
      setNewHolder("");
    } catch {
      setError("Could not save the bank account.");
    } finally {
      setSavingBank(false);
    }
  }

  async function handleRemove(id: number) {
    try {
      await walletApi.deleteBankAccount(id);
      setAccounts((prev) => {
        const next = prev.filter((a) => a.id !== id);
        if (selectedId === id) {
          setSelectedId(next[0]?.id ?? null);
          setAdding(next.length === 0);
        }
        return next;
      });
    } catch {
      setError("Could not remove that account.");
    }
  }

  async function handleSubmit() {
    if (!selectedAccount || !amountValid) return;
    setSubmitting(true);
    setError(null);
    try {
      await walletApi.createWithdrawal(amountValue, selectedAccount.id);
      onSubmitted();
      onClose();
    } catch (err) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          "Could not submit the withdrawal request.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50">
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.aside
            className="client-theme absolute right-0 top-0 flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-white/10 bg-turf-900 text-ivory shadow-[-30px_0_80px_-20px_rgba(0,0,0,0.6)]"
            initial={reduce ? { opacity: 0 } : { x: "100%" }}
            animate={reduce ? { opacity: 1 } : { x: 0 }}
            exit={reduce ? { opacity: 0 } : { x: "100%" }}
            transition={{ type: "tween", duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            role="dialog"
            aria-modal="true"
            aria-label="Withdraw funds"
          >
            <div className="sticky top-0 z-10 border-b border-white/8 bg-turf-900/95 px-6 pb-4 pt-5 backdrop-blur">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-data text-[10px] font-bold uppercase tracking-[0.22em] text-gold-300">
                    Manual payout review
                  </p>
                  <h2 className="mt-1 font-display text-2xl font-medium text-ivory">Withdraw</h2>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ivory-dim transition-colors hover:bg-white/5 hover:text-ivory focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 space-y-6 px-6 py-6 pb-56">
              <section aria-labelledby="withdraw-amount-heading">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3
                      id="withdraw-amount-heading"
                      className="font-data text-[11px] uppercase tracking-[0.2em] text-ivory-faint"
                    >
                      Amount
                    </h3>
                    <p className="mt-1 font-data text-xs text-ivory-faint">
                      Available: {vnd.format(available)} VND
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAmount(String(Math.max(available, 0)))}
                    disabled={available <= 0}
                    className="min-h-10 rounded-full border border-gold-400/30 px-4 font-data text-[11px] font-bold uppercase tracking-[0.14em] text-gold-300 transition-colors hover:border-gold-300 hover:text-gold-200 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Max
                  </button>
                </div>

                <div className="relative mt-3">
                  <input
                    autoFocus
                    aria-label="Amount to withdraw"
                    type="text"
                    inputMode="numeric"
                    value={amount}
                    onChange={(e) => setCappedAmount(e.target.value)}
                    placeholder="0"
                    className="min-h-20 w-full rounded-2xl border border-white/10 bg-turf-950 pl-4 pr-20 font-data text-4xl font-bold text-ivory placeholder:text-ivory-faint/50 focus:border-gold-400 focus:outline-none"
                  />
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 font-data text-xs uppercase tracking-[0.16em] text-ivory-faint">
                    VND
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2">
                  {[
                    { label: "25%", value: 0.25 },
                    { label: "50%", value: 0.5 },
                    { label: "100%", value: 1 },
                  ].map((chip) => (
                    <button
                      key={chip.label}
                      type="button"
                      onClick={() => setPercentAmount(chip.value)}
                      disabled={available <= 0}
                      className="min-h-10 rounded-full border border-white/10 bg-white/[0.03] font-data text-xs font-bold uppercase tracking-[0.12em] text-ivory-dim transition-colors hover:border-gold-400/40 hover:text-gold-200 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>

                {amount && !amountValid ? (
                  <p role="alert" className="mt-3 text-sm font-semibold text-rose-300">
                    {amountValue > available ? "Amount is capped at your available balance." : "Enter a valid amount."}
                  </p>
                ) : null}
              </section>

              <section aria-labelledby="withdraw-destination-heading">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3
                      id="withdraw-destination-heading"
                      className="font-data text-[11px] uppercase tracking-[0.2em] text-ivory-faint"
                    >
                      Destination
                    </h3>
                    <p className="mt-1 text-xs text-ivory-faint">Choose a saved account or add a new one.</p>
                  </div>
                  {accounts.length > 0 && !adding ? (
                    <button
                      type="button"
                      onClick={() => setAdding(true)}
                      className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/10 px-3 text-xs font-semibold text-ivory-dim transition-colors hover:border-gold-400/40 hover:text-gold-200"
                    >
                      <Plus size={14} /> Add
                    </button>
                  ) : null}
                </div>

                <div className="mt-3 space-y-3">
                  {accounts.map((acc) => {
                    const active = acc.id === selectedId;
                    return (
                      <div
                        key={acc.id}
                        className={`group flex items-center gap-3 rounded-2xl border p-3.5 transition-colors ${
                          active
                            ? "border-gold-400/70 bg-gold-400/10 shadow-[0_0_0_1px_rgba(232,189,87,0.12)]"
                            : "border-white/10 bg-turf-950 hover:border-white/20"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedId(acc.id)}
                          aria-pressed={active}
                          className="flex min-h-12 min-w-0 flex-1 items-center gap-3 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400"
                        >
                          <BankLogo code={acc.bankCode} size={40} />
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold text-ivory">{acc.bankName}</span>
                            <span className="block truncate font-data text-xs text-ivory-faint">
                              {mask(acc.accountNumber)} - {acc.accountHolder}
                            </span>
                          </span>
                        </button>
                        {active ? (
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gold-400 text-turf-950">
                            <Check size={15} strokeWidth={3} />
                          </span>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => handleRemove(acc.id)}
                          aria-label="Remove account"
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ivory-faint opacity-100 transition-colors hover:bg-rose-400/10 hover:text-rose-300 sm:opacity-0 sm:group-hover:opacity-100"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    );
                  })}

                  {adding ? (
                    <div className="space-y-3 rounded-2xl border border-white/10 bg-turf-950 p-4">
                      {directoryLoading ? (
                        <p role="status" className="text-sm text-ivory-dim">Loading supported banks...</p>
                      ) : directoryError ? (
                        <div className="rounded-lg border border-rose-400/20 bg-rose-400/5 p-3">
                          <p role="alert" className="text-sm text-rose-200">Could not load supported banks.</p>
                          <button
                            type="button"
                            onClick={retryDirectory}
                            className="mt-2 min-h-11 rounded-sm border border-white/15 px-4 text-xs font-bold uppercase tracking-[0.12em] text-ivory"
                          >
                            Retry bank list
                          </button>
                        </div>
                      ) : (
                        <BankSelect banks={banks} value={newBankCode} onChange={setNewBankCode} />
                      )}
                      <input
                        type="text"
                        inputMode="numeric"
                        value={newAccount}
                        onChange={(e) => setNewAccount(e.target.value.replace(/[^0-9]/g, ""))}
                        placeholder="Account number"
                        aria-label="Account number"
                        className="min-h-12 w-full rounded-lg border border-white/10 bg-turf-900 px-4 font-data text-sm tracking-[0.08em] text-ivory placeholder:text-ivory-faint/70 focus:border-gold-400 focus:outline-none"
                      />
                      <input
                        type="text"
                        value={newHolder}
                        onChange={(e) => setNewHolder(e.target.value.toUpperCase())}
                        placeholder="ACCOUNT HOLDER"
                        aria-label="Account holder"
                        className="min-h-12 w-full rounded-lg border border-white/10 bg-turf-900 px-4 text-sm uppercase text-ivory placeholder:text-ivory-faint/70 focus:border-gold-400 focus:outline-none"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleSaveBank}
                          disabled={savingBank}
                          className="inline-flex min-h-11 flex-1 items-center justify-center rounded-sm bg-gold-400 px-4 text-[12px] font-bold uppercase tracking-[0.12em] text-turf-950 transition-colors hover:bg-gold-300 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {savingBank ? "Saving..." : "Save account"}
                        </button>
                        {accounts.length > 0 ? (
                          <button
                            type="button"
                            onClick={() => setAdding(false)}
                            className="inline-flex min-h-11 items-center justify-center rounded-sm border border-white/15 px-4 text-[12px] font-bold uppercase tracking-[0.12em] text-ivory-dim transition-colors hover:border-white/30 hover:text-ivory"
                          >
                            Cancel
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </div>
              </section>

              {error ? (
                <p role="alert" className="text-sm font-semibold text-rose-300">
                  {error}
                </p>
              ) : null}
            </div>

            <div className="sticky bottom-0 border-t border-white/8 bg-turf-900/95 px-6 py-4 backdrop-blur">
              <dl className="space-y-2 text-sm">
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-ivory-dim">Amount</dt>
                  <dd className="font-data font-semibold text-ivory">{vnd.format(validAmount)} VND</dd>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-ivory-dim">Fee</dt>
                  <dd className="font-semibold text-emerald-soft">Free</dd>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-ivory-dim">You receive</dt>
                  <dd className="font-data font-bold text-gold-300">{vnd.format(validAmount)} VND</dd>
                </div>
                <div className="flex items-baseline justify-between gap-3 border-t border-white/8 pt-2">
                  <dt className="text-ivory-dim">Balance after</dt>
                  <dd className="font-data font-semibold text-ivory">{vnd.format(balanceAfter)} VND</dd>
                </div>
              </dl>

              <p className="mt-3 flex items-start gap-2 text-[12px] leading-relaxed text-ivory-faint">
                <ShieldCheck size={15} className="mt-px shrink-0 text-emerald-soft" />
                Reviewed manually before payout. Funds are held until paid or returned.
              </p>

              <button
                type="button"
                disabled={!canSubmit}
                onClick={handleSubmit}
                className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-sm bg-gold-400 px-5 text-[13px] font-bold uppercase tracking-[0.14em] text-turf-950 transition-colors hover:bg-gold-300 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-ivory-faint"
              >
                {submitting ? "Submitting..." : validAmount > 0 ? `Withdraw ${vnd.format(validAmount)} VND` : "Withdraw"}
              </button>
            </div>
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
