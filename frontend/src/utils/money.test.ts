import { describe, expect, it } from "vitest";
import { formatVnd, formatVndCompact } from "./money";

describe("formatVnd", () => {
  it("nhóm hàng nghìn và gắn ký hiệu", () => {
    expect(formatVnd(1245875)).toBe("1,245,875 ₫");
  });

  it("làm tròn phần lẻ vì VND không có đơn vị nhỏ hơn đồng", () => {
    expect(formatVnd(1000.6)).toBe("1,001 ₫");
  });
});

describe("formatVndCompact", () => {
  it("giữ nguyên số nhỏ", () => {
    expect(formatVndCompact(850)).toBe("850 ₫");
  });

  it("rút gọn hàng nghìn / triệu / tỷ", () => {
    expect(formatVndCompact(12000)).toBe("12K ₫");
    expect(formatVndCompact(500000000)).toBe("500M ₫");
    expect(formatVndCompact(1200000000)).toBe("1.2B ₫");
  });

  it("bỏ phần thập phân thừa thay vì hiện 500.0M", () => {
    expect(formatVndCompact(500000000)).not.toContain(".0");
  });

  it("giữ dấu âm cho khoản trừ", () => {
    expect(formatVndCompact(-2500000)).toBe("-2.5M ₫");
  });

  it("ngắn hơn hẳn dạng đầy đủ — đây là lý do nó tồn tại", () => {
    // 500,000,000 ₫ = 13 ký tự, tràn cột lưới hẹp trong danh sách giải.
    expect(formatVndCompact(500000000).length).toBeLessThan(formatVnd(500000000).length);
  });
});
