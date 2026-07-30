import { describe, expect, it } from "vitest";

import { compareReceipt, extractReceiptFields, requiresAcknowledgement } from "./receiptFieldExtractor";

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

  // Phần lớn biên lai ngân hàng VN không in chữ "VND" — chúng in "đ", "₫", hoặc không gì cả.
  it.each([
    ["d with stroke", "Ma giao dich: FT-001234 So tien: -1.500.000 đ Noi dung: WD000123"],
    ["dong sign", "Ma giao dich: FT-001234 So tien: 1.500.000₫ Noi dung: WD000123"],
    ["spelled out", "Ma giao dich: FT-001234 So tien: 1.500.000 đồng Noi dung: WD000123"],
    ["no unit at all", "Ma giao dich: FT-001234 So tien: 1.500.000 Noi dung: WD000123"],
  ])("reads the amount when the receipt writes it as %s", (_label, text) => {
    expect(extractReceiptFields(text, 90).amount).toBe(1_500_000);
  });

  it("leaves d-with-stroke alone when it is an ordinary letter, not a currency mark", () => {
    const result = extractReceiptFields(
      "Đã giao dịch thành công Ma giao dich: FT-001234 So tien: 250,000 VND Noi dung: WD000123",
      90,
    );

    expect(result.amount).toBe(250_000);
    expect(result.rawText).toContain("Đã");
  });

  it("withholds high confidence when a money field was never read", () => {
    const result = extractReceiptFields("Ma giao dich: FT-20260723-001 Noi dung: WD000123", 95);

    expect(result.amount).toBeNull();
    expect(result.confidence).not.toBe("HIGH");
  });

  // Regression: an unreadable amount used to sail through with no acknowledgement at all,
  // which is exactly the case the OCR check exists to catch.
  it("demands acknowledgement when a field is unreadable, not just when it contradicts", () => {
    const unreadableAmount = extractReceiptFields("Ma giao dich: FT-001234 Noi dung: WD000123", 90);
    const expected = { amount: 1_500_000, transferContent: "WD000123" };

    expect(compareReceipt(unreadableAmount, expected)).toEqual({ amount: null, transferContent: true });
    expect(requiresAcknowledgement(compareReceipt(unreadableAmount, expected))).toBe(true);
    expect(requiresAcknowledgement({ amount: true, transferContent: true })).toBe(false);
    expect(requiresAcknowledgement({ amount: false, transferContent: true })).toBe(true);
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
