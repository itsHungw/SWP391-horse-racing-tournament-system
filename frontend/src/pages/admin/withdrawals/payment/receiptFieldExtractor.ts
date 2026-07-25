import { receiptOcrConfig } from "./receiptOcrConfig";

const REFERENCE = /(?:MA\s*GIAO\s*DICH|TRANSACTION\s*ID|REFERENCE|REF\s*NO)\s*[:#-]?\s*([A-Z0-9-]{6,40})/g;
const AMOUNT = /([0-9][0-9.,\s]{3,})\s*(?:VND|DONG)/i;
const CONTENT = /\bWD\s*0*([0-9]{1,12})\b/i;
const TIME = /\b([0-3]?\d[\/-][01]?\d[\/-]20\d{2}\s+[0-2]?\d:[0-5]\d(?::[0-5]\d)?)\b/;

export interface ReceiptExtraction {
  rawText: string;
  referenceCandidates: Array<{ value: string; confidence: number }>;
  amount: number | null;
  transferContent: string | null;
  transactionTime: string | null;
  confidence: "HIGH" | "MEDIUM" | "LOW";
}

function normalizedText(text: string) {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replaceAll("Đ", "D")
    .replaceAll("đ", "d")
    .toUpperCase();
}

export function extractReceiptFields(text: string, ocrConfidence: number): ReceiptExtraction {
  const normalized = normalizedText(text);
  const references = [...normalized.matchAll(REFERENCE)]
    .map((match) => match[1])
    .filter((value, index, values) => values.indexOf(value) === index)
    .slice(0, 3)
    .map((value, index) => ({
      value,
      confidence: Math.max(0, ocrConfidence / 100 - index * 0.1),
    }));
  const amountMatch = normalized.match(AMOUNT);
  const digits = amountMatch?.[1].replace(/[^0-9]/g, "") ?? "";
  const contentMatch = normalized.match(CONTENT);
  const normalizedConfidence = ocrConfidence / 100;
  const confidence = references.length > 0 && normalizedConfidence >= receiptOcrConfig.highConfidence
    ? "HIGH"
    : references.length > 0 && normalizedConfidence >= receiptOcrConfig.mediumConfidence
      ? "MEDIUM"
      : "LOW";

  return {
    rawText: text,
    referenceCandidates: references,
    amount: digits ? Number(digits) : null,
    transferContent: contentMatch ? `WD${contentMatch[1].padStart(6, "0")}` : null,
    transactionTime: normalized.match(TIME)?.[1] ?? null,
    confidence,
  };
}

export function compareReceipt(
  extraction: ReceiptExtraction,
  expected: { amount: number; transferContent: string },
) {
  return {
    amount: extraction.amount == null ? null : extraction.amount === expected.amount,
    transferContent: extraction.transferContent == null
      ? null
      : extraction.transferContent === expected.transferContent,
  };
}
