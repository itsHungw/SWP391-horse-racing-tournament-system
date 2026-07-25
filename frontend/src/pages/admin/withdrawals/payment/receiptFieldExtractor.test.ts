import { describe, expect, it } from "vitest";

import { compareReceipt, extractReceiptFields } from "./receiptFieldExtractor";

describe("receiptFieldExtractor", () => {
  it("extracts reference, amount, time and withdrawal content", () => {
    const result = extractReceiptFields(`
      GIAO DICH THANH CONG
      Mã giao dịch: FT-20260723-001
      Số tiền: 250,000 VND
      Nội dung: WD000123
      Thời gian: 23/07/2026 14:31
    `, 92);

    expect(result.referenceCandidates[0].value).toBe("FT-20260723-001");
    expect(result.amount).toBe(250_000);
    expect(result.transferContent).toBe("WD000123");
    expect(result.transactionTime).toBe("23/07/2026 14:31");
    expect(result.confidence).toBe("HIGH");
  });

  it("returns no candidates instead of inventing a reference", () => {
    const result = extractReceiptFields("GIAO DICH THANH CONG 250,000 VND", 55);

    expect(result.referenceCandidates).toEqual([]);
    expect(result.confidence).toBe("LOW");
  });

  it("compares detected amount and content with the approved instruction", () => {
    const matched = extractReceiptFields(
      "Ma giao dich: FT-001234 So tien: 250,000 VND Noi dung: WD000123",
      90,
    );
    const mismatched = extractReceiptFields(
      "Ma giao dich: FT-001234 So tien: 200,000 VND Noi dung: WD000999",
      90,
    );

    expect(compareReceipt(matched, { amount: 250_000, transferContent: "WD000123" }))
      .toEqual({ amount: true, transferContent: true });
    expect(compareReceipt(mismatched, { amount: 250_000, transferContent: "WD000123" }))
      .toEqual({ amount: false, transferContent: false });
  });
});
