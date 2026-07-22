import { useEffect, useMemo, useRef, useState } from "react";

import { adminWalletApi } from "../../../../api/adminWalletApi";
import type { AdminWithdrawalReview } from "../../../../types/wallet";
import { compareReceipt, type ReceiptExtraction } from "./receiptFieldExtractor";
import { createReceiptOcr, type ReceiptOcr } from "./receiptOcr";

type PaymentBusyState = "IDLE" | "OCR" | "CONFIRMING" | "REJECTING";

export interface PaymentStepState {
  dirty: boolean;
  busy: boolean;
}

export function useWithdrawalPayment(
  review: AdminWithdrawalReview,
  onUpdated: (review: AdminWithdrawalReview) => void,
  onStateChange: (state: PaymentStepState) => void,
  onConflict?: () => Promise<void>,
) {
  const instruction = review.paymentInstruction;
  const [busy, setBusy] = useState<PaymentBusyState>("IDLE");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [extraction, setExtraction] = useState<ReceiptExtraction | null>(null);
  const [progress, setProgress] = useState(0);
  const [transferReference, setTransferReference] = useState("");
  const [mismatchAcknowledged, setMismatchAcknowledged] = useState(false);
  const [internalNote, setInternalNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [publicReason, setPublicReason] = useState("");
  const [noTransferConfirmed, setNoTransferConfirmed] = useState(false);
  const workerRef = useRef<ReceiptOcr | null>(null);
  const workerPromiseRef = useRef<Promise<ReceiptOcr> | null>(null);
  const idempotencyKey = useRef(crypto.randomUUID());

  const comparison = useMemo(() => {
    if (!extraction || !instruction) return { amount: null, transferContent: null };
    return compareReceipt(extraction, {
      amount: instruction.amount,
      transferContent: instruction.transferContent,
    });
  }, [extraction, instruction]);
  const mismatch = comparison.amount === false || comparison.transferContent === false;
  const dirty = Boolean(
    receipt || transferReference || internalNote || publicReason || noTransferConfirmed,
  );

  useEffect(() => {
    onStateChange({ dirty, busy: busy !== "IDLE" });
  }, [busy, dirty, onStateChange]);

  useEffect(() => () => {
    if (workerRef.current) {
      void workerRef.current.terminate();
    } else if (workerPromiseRef.current) {
      void workerPromiseRef.current.then((worker) => worker.terminate());
    }
  }, []);

  async function selectReceipt(file: File | null) {
    setReceipt(file);
    setExtraction(null);
    setTransferReference("");
    setMismatchAcknowledged(false);
    setInternalNote("");
    setError(null);
    if (!file) return;

    setBusy("OCR");
    setProgress(0);
    try {
      if (!workerPromiseRef.current) {
        workerPromiseRef.current = createReceiptOcr(setProgress);
      }
      const worker = await workerPromiseRef.current;
      workerRef.current = worker;
      const result = await worker.recognize(file);
      setExtraction(result);
      setTransferReference(result.referenceCandidates[0]?.value ?? "");
    } catch {
      if (!workerRef.current) {
        workerPromiseRef.current = null;
      }
      setError("OCR could not read this image. Enter the transaction reference manually.");
      setExtraction({
        rawText: "",
        referenceCandidates: [],
        amount: null,
        transferContent: null,
        transactionTime: null,
        confidence: "LOW",
      });
    } finally {
      setBusy("IDLE");
    }
  }

  async function confirmPaid() {
    if (!receipt || !transferReference.trim()) return;
    if (mismatch && (!mismatchAcknowledged || !internalNote.trim())) return;
    setBusy("CONFIRMING");
    setError(null);
    try {
      const updated = await adminWalletApi.markPaid(review.id, {
        transferReference: transferReference.trim(),
        internalNote: internalNote.trim(),
        mismatchAcknowledged: mismatch,
        idempotencyKey: idempotencyKey.current,
        receipt,
      });
      idempotencyKey.current = crypto.randomUUID();
      onUpdated(updated);
    } catch (caught) {
      const status = (caught as { response?: { status?: number } }).response?.status;
      if (status === 409 && onConflict) {
        setError("This withdrawal changed while payment was being confirmed. The latest state has been loaded.");
        await onConflict();
      } else {
        setError("Payment could not be confirmed. Review the latest status and try again.");
      }
    } finally {
      setBusy("IDLE");
    }
  }

  async function rejectAndRefund() {
    if (!publicReason.trim() || !noTransferConfirmed) return;
    setBusy("REJECTING");
    setError(null);
    try {
      const updated = await adminWalletApi.reject(review.id, {
        publicReason: publicReason.trim(),
        internalNote: "No transfer was made; payout rejected from the payment step.",
      });
      onUpdated(updated);
    } catch (caught) {
      const status = (caught as { response?: { status?: number } }).response?.status;
      if (status === 409 && onConflict) {
        setError("This withdrawal changed. The latest state has been loaded.");
        await onConflict();
      } else {
        setError("The withdrawal could not be rejected. Try again.");
      }
    } finally {
      setBusy("IDLE");
    }
  }

  return {
    busy,
    receipt,
    extraction,
    progress,
    transferReference,
    mismatchAcknowledged,
    internalNote,
    error,
    comparison,
    mismatch,
    rejectOpen,
    publicReason,
    noTransferConfirmed,
    setTransferReference,
    setMismatchAcknowledged,
    setInternalNote,
    setRejectOpen,
    setPublicReason,
    setNoTransferConfirmed,
    selectReceipt,
    confirmPaid,
    rejectAndRefund,
  };
}
