import { useEffect, useState } from "react";
import { Landmark, Plus, Trash2 } from "lucide-react";

import { walletApi } from "../../api/walletApi";
import type { BankAccount } from "../../types/wallet";
import { BankLogo } from "./BankLogo";
import { BankSelect } from "./BankSelect";
import { BANKS, maskAccount } from "./banks";

export function SavedAccounts() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [bankCode, setBankCode] = useState<string | null>(null);
  const [accountNumber, setAccountNumber] = useState("");
  const [holder, setHolder] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    walletApi
      .getBankAccounts()
      .then((list) => mounted && setAccounts(list))
      .catch(() => undefined)
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  async function handleSave() {
    const bank = BANKS.find((item) => item.code === bankCode);
    if (!bank) return setError("Please select a bank.");
    if (accountNumber.trim().length < 6) return setError("Enter a valid account number.");
    if (holder.trim().length < 2) return setError("Enter the account holder name.");
    setSaving(true);
    setError(null);
    try {
      const saved = await walletApi.addBankAccount({
        bankCode: bank.code,
        bankName: bank.name,
        accountNumber: accountNumber.trim(),
        accountHolder: holder.trim(),
      });
      setAccounts((prev) => [saved, ...prev]);
      setAdding(false);
      setBankCode(null);
      setAccountNumber("");
      setHolder("");
    } catch {
      setError("Could not save the bank account.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(id: number) {
    try {
      await walletApi.deleteBankAccount(id);
      setAccounts((prev) => prev.filter((item) => item.id !== id));
    } catch {
      setError("Could not remove that account.");
    }
  }

  return (
    <section aria-labelledby="saved-accounts-title" className="min-w-0 rounded-lg border border-white/10 bg-[#061a15] p-5">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-sm border border-gold-400/30 bg-gold-400/10 text-gold-300">
          <Landmark className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h2 id="saved-accounts-title" className="text-lg font-black text-ivory">
            Saved accounts
          </h2>
          <p className="text-sm text-ivory-dim">Bank destinations for payouts.</p>
        </div>
      </div>

      {loading ? (
        <div className="mt-5 space-y-3">
          {[0, 1].map((item) => (
            <span key={item} className="block h-14 w-full animate-pulse rounded-lg bg-white/10" />
          ))}
        </div>
      ) : (
        <ul className="mt-5 space-y-2.5">
          {accounts.map((account) => (
            <li
              key={account.id}
              className="group flex items-center gap-3 rounded-xl border border-white/10 bg-[#030f0c] p-3"
            >
              <BankLogo code={account.bankCode} size={36} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ivory">{account.bankName}</p>
                <p className="truncate font-data text-xs text-ivory-faint">
                  {maskAccount(account.accountNumber)} · {account.accountHolder}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(account.id)}
                aria-label={`Remove ${account.bankName} account`}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ivory-faint transition-colors hover:bg-rose-400/10 hover:text-rose-300 sm:opacity-0 sm:group-hover:opacity-100"
              >
                <Trash2 size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {adding ? (
        <div className="mt-3 space-y-3 rounded-xl border border-white/10 bg-[#030f0c] p-4">
          <BankSelect banks={BANKS} value={bankCode} onChange={setBankCode} />
          <input
            type="text"
            inputMode="numeric"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value.replace(/[^0-9]/g, ""))}
            placeholder="Account number"
            aria-label="Account number"
            className="min-h-11 w-full rounded-lg border border-white/10 bg-turf-900 px-4 font-data text-sm tracking-[0.08em] text-ivory placeholder:text-ivory-faint/70 focus:border-gold-400 focus:outline-none"
          />
          <input
            type="text"
            value={holder}
            onChange={(e) => setHolder(e.target.value.toUpperCase())}
            placeholder="ACCOUNT HOLDER"
            aria-label="Account holder"
            className="min-h-11 w-full rounded-lg border border-white/10 bg-turf-900 px-4 text-sm uppercase text-ivory placeholder:text-ivory-faint/70 focus:border-gold-400 focus:outline-none"
          />
          {error ? <p className="text-sm font-semibold text-rose-300">{error}</p> : null}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-sm bg-gold-400 px-4 text-[12px] font-bold uppercase tracking-[0.12em] text-turf-950 transition-colors hover:bg-gold-300 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save account"}
            </button>
            <button
              type="button"
              onClick={() => {
                setAdding(false);
                setError(null);
              }}
              className="inline-flex min-h-11 items-center justify-center rounded-sm border border-white/15 px-4 text-[12px] font-bold uppercase tracking-[0.12em] text-ivory-dim transition-colors hover:border-white/30 hover:text-ivory"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 text-sm font-semibold text-ivory-dim transition-colors hover:border-gold-400/40 hover:text-gold-200"
        >
          <Plus size={16} /> Add bank account
        </button>
      )}
    </section>
  );
}
