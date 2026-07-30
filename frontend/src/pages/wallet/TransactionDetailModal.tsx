import { useEffect, useState } from "react";
import { AlertTriangle, Flag, Loader2, X } from "lucide-react";

import { walletApi } from "../../api/walletApi";
import type { WalletTransactionDetail, Withdrawal } from "../../types/wallet";
import { BankLogo } from "./BankLogo";
import { maskAccount, parseBankInfo } from "./banks";
import { Modal } from "./Modal";
import { TX_LABEL, cardTypeLabel } from "./transactionLabels";

const vnd = new Intl.NumberFormat("en-US");

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

/** Bỏ hẳn dòng khi không có giá trị, thay vì hiện dấu gạch ngang cho một hàng rỗng. */
function Row({ label, value, mono }: { label: string; value: string | null | undefined; mono?: boolean }) {
  if (!value) return null;
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <dt className="shrink-0 font-data text-[11px] uppercase tracking-[0.12em] text-ivory-faint">{label}</dt>
      <dd className={`min-w-0 break-all text-right text-sm text-ivory ${mono ? "font-data" : ""}`}>{value}</dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-white/8 px-6 py-4">
      <h3 className="font-data text-[10px] font-black uppercase tracking-[0.22em] text-gold-300">{title}</h3>
      <dl className="mt-1 divide-y divide-white/5">{children}</dl>
    </section>
  );
}

export function TransactionDetailModal({
  transactionId,
  withdrawals,
  onClose,
  onReport,
}: {
  transactionId: number | null;
  withdrawals: Withdrawal[];
  onClose: () => void;
  onReport: (id: number) => void;
}) {
  const [detail, setDetail] = useState<WalletTransactionDetail | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (transactionId == null) return;
    let active = true;
    setDetail(null);
    setError(false);
    walletApi
      .getTransactionDetail(transactionId)
      .then((data) => {
        if (active) setDetail(data);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, [transactionId]);

  if (transactionId == null) return null;

  const positive = (detail?.amount ?? 0) >= 0;
  // Withdrawal rows resolve client-side: WalletPage already holds the full list, so the
  // bank and status come for free rather than costing another round trip.
  const withdrawal =
    detail?.referenceType === "WITHDRAWAL" && detail.referenceId != null
      ? withdrawals.find((item) => item.id === detail.referenceId)
      : undefined;
  const bank = withdrawal ? parseBankInfo(withdrawal.bankInfo) : undefined;

  return (
    <Modal open onClose={onClose} label="Transaction detail" panelClassName="max-w-lg">
      <div className="flex items-start justify-between gap-4 border-b border-white/10 px-6 pb-5 pt-6">
        <div className="min-w-0">
          <p className="font-data text-[10px] font-black uppercase tracking-[0.22em] text-gold-300">
            Transaction detail
          </p>
          {detail ? (
            <>
              <h2 className="mt-1.5 font-display text-2xl text-ivory">{TX_LABEL[detail.type] ?? detail.type}</h2>
              <p
                className={`mt-1 font-data text-xl font-black ${positive ? "text-emerald-soft" : "text-rose-400"}`}
              >
                {positive ? "+" : "-"}
                {vnd.format(Math.abs(detail.amount))} VND
              </p>
            </>
          ) : (
            <h2 className="mt-1.5 font-display text-2xl text-ivory">
              {error ? "Detail unavailable" : "Loading…"}
            </h2>
          )}
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

      <div className="flex-1 overflow-y-auto">
        {error ? (
          <p
            role="alert"
            className="m-6 flex items-start gap-3 rounded-lg border border-rose-300/25 bg-rose-400/10 p-4 text-sm font-semibold text-rose-200"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            We could not load this transaction. Please try again.
          </p>
        ) : !detail ? (
          <div className="flex items-center gap-3 px-6 py-10 text-sm text-ivory-dim">
            <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
            Loading transaction…
          </div>
        ) : (
          <>
            <Section title="Summary">
              <Row label="Date" value={formatDateTime(detail.createdAt)} />
              <Row
                label="Balance after"
                value={detail.balanceAfter == null ? null : `${vnd.format(detail.balanceAfter)} VND`}
                mono
              />
              <Row label="Description" value={detail.description} />
              <Row label="Transaction ID" value={String(detail.id)} mono />
            </Section>

            {detail.topUp ? (
              <Section title="VNPay payment">
                {detail.topUp.bankCode ? (
                  <div className="flex items-center gap-3 py-3">
                    <BankLogo code={detail.topUp.bankCode} size={36} />
                    <span className="text-sm font-semibold text-ivory">{detail.topUp.bankCode}</span>
                  </div>
                ) : null}
                <Row label="VNPay transaction no." value={detail.topUp.transactionNo} mono />
                <Row label="Bank transaction no." value={detail.topUp.bankTranNo} mono />
                <Row
                  label="Method"
                  value={detail.topUp.cardType ? cardTypeLabel(detail.topUp.cardType) : null}
                />
                <Row
                  label="Paid at"
                  value={detail.topUp.paidAt ? formatDateTime(detail.topUp.paidAt) : null}
                />
                <Row label="Merchant reference" value={detail.topUp.txnRef} mono />
              </Section>
            ) : null}

            {withdrawal ? (
              <Section title="Payout destination">
                {bank?.code ? (
                  <div className="flex items-center gap-3 py-3">
                    <BankLogo code={bank.code} size={36} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ivory">{bank.bankName}</p>
                      {bank.account ? (
                        <p className="truncate font-data text-xs text-ivory-faint">
                          {maskAccount(bank.account)} · {bank.holder}
                        </p>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <Row label="Destination" value={withdrawal.bankInfo} />
                )}
                <Row label="Status" value={withdrawal.status} />
                <Row label="Requested" value={formatDateTime(withdrawal.requestedAt)} />
                <Row label="Note" value={withdrawal.reviewNote} />
              </Section>
            ) : null}
          </>
        )}
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-white/10 px-6 py-4 sm:flex-row sm:justify-between">
        <button
          type="button"
          onClick={() => onReport(transactionId)}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/15 px-4 text-xs font-bold uppercase tracking-[0.1em] text-ivory-dim transition-colors hover:border-rose-400/40 hover:text-rose-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400"
        >
          <Flag size={14} aria-hidden="true" />
          Report an issue
        </button>
        <button
          type="button"
          onClick={onClose}
          className="min-h-11 rounded-full border border-white/15 px-5 text-sm font-bold text-ivory transition-colors hover:bg-white/5"
        >
          Done
        </button>
      </div>
    </Modal>
  );
}
