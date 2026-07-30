import { receiptOcrConfig } from "./receiptOcrConfig";

const REFERENCE = /(?:MA\s*GIAO\s*DICH|TRANSACTION\s*ID|REFERENCE|REF\s*NO)\s*[:#-]?\s*([A-Z0-9-]{6,40})/g;
/** Số tiền có hậu tố đơn vị. `₫`/`đ` đã được quy về VND trong {@link normalizedText}. */
const AMOUNT_WITH_UNIT = /([0-9][0-9.,\s]{3,})\s*(?:VND|DONG)\b/i;
/** Dự phòng cho biên lai in số tiền trần, không kèm đơn vị nào sau nhãn. */
const AMOUNT_WITH_LABEL = /(?:SO\s*TIEN|AMOUNT)\s*[:\-]?\s*([0-9][0-9.,]{2,})/i;
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
    // Quy ký hiệu tiền tệ về "VND" TRƯỚC khi bóc dấu: `đ` vừa là ký hiệu đồng vừa là một chữ
    // cái tiếng Việt bình thường, nên chỉ đổi khi nó đứng ngay sau số và không nằm trong từ —
    // "1.500.000 đ" thành tiền, còn "Đã thành công" hay "đồng" giữ nguyên.
    .replace(/(\d)\s*[₫đĐ](?!\p{L})/gu, "$1 VND")
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
  const amountMatch = normalized.match(AMOUNT_WITH_UNIT) ?? normalized.match(AMOUNT_WITH_LABEL);
  const digits = amountMatch?.[1].replace(/[^0-9]/g, "") ?? "";
  const amount = digits ? Number(digits) : null;
  const contentMatch = normalized.match(CONTENT);
  const transferContent = contentMatch ? `WD${contentMatch[1].padStart(6, "0")}` : null;

  // Confidence phải phản ánh cả ba field kiểm tiền, không riêng reference: trước đây một biên
  // lai đọc được reference nhưng mất số tiền vẫn gắn nhãn HIGH, khiến admin tin rằng số tiền
  // đã được đối chiếu trong khi thực tế chưa.
  const readEveryField = references.length > 0 && amount != null && transferContent != null;
  const normalizedConfidence = ocrConfidence / 100;
  const confidence = readEveryField && normalizedConfidence >= receiptOcrConfig.highConfidence
    ? "HIGH"
    : references.length > 0 && normalizedConfidence >= receiptOcrConfig.mediumConfidence
      ? "MEDIUM"
      : "LOW";

  return {
    rawText: text,
    referenceCandidates: references,
    amount,
    transferContent,
    transactionTime: normalized.match(TIME)?.[1] ?? null,
    confidence,
  };
}

/** `null` = OCR không đọc được field đó, khác hẳn `false` = đọc được nhưng lệch. */
export interface ReceiptComparison {
  amount: boolean | null;
  transferContent: boolean | null;
}

export function compareReceipt(
  extraction: ReceiptExtraction,
  expected: { amount: number; transferContent: string },
): ReceiptComparison {
  return {
    amount: extraction.amount == null ? null : extraction.amount === expected.amount,
    transferContent: extraction.transferContent == null
      ? null
      : extraction.transferContent === expected.transferContent,
  };
}

/**
 * Chỉ khi cả hai field đều khớp rõ ràng thì mới cho xác nhận thẳng.
 *
 * <p>Một field không đọc được KHÔNG phải là đạt. Trước đây `null` được đối xử như an toàn, nên
 * biên lai chuyển sai số tiền vẫn qua thẳng không một chút ma sát nào mỗi khi số tiền không đọc
 * được — đúng tình huống mà OCR sinh ra để chặn.
 */
export function requiresAcknowledgement(comparison: ReceiptComparison) {
  return comparison.amount !== true || comparison.transferContent !== true;
}
