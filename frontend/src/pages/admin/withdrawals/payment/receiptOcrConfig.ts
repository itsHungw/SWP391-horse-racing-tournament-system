function probability(name: string, fallback: number) {
  const parsed = Number(import.meta.env[name] ?? fallback);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) {
    throw new Error(`${name} must be between 0 and 1`);
  }
  return parsed;
}

export const receiptOcrConfig = {
  highConfidence: probability("VITE_RECEIPT_OCR_HIGH_CONFIDENCE", 0.85),
  mediumConfidence: probability("VITE_RECEIPT_OCR_MEDIUM_CONFIDENCE", 0.6),
};

if (receiptOcrConfig.highConfidence <= receiptOcrConfig.mediumConfidence) {
  throw new Error("OCR high confidence must exceed medium confidence");
}
