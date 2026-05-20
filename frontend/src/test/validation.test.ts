import { describe, it, expect } from "vitest";
import { validateVietnamesePhone, sanitizePhoneNumber, validateEmail, validatePasswordStrength } from "../utils/validation";

describe("Sanitize Phone Number", () => {
  it("should clean space, dots and hyphens", () => {
    expect(sanitizePhoneNumber("090.123.4567")).toBe("0901234567");
    expect(sanitizePhoneNumber("090 123 4567")).toBe("0901234567");
    expect(sanitizePhoneNumber("+84 901 234 567")).toBe("0901234567");
  });
});

describe("Validate Vietnamese Phone", () => {
  it("should return true for valid phone numbers", () => {
    expect(validateVietnamesePhone("0987654321")).toBe(true);
    expect(validateVietnamesePhone("+84 987 654 321")).toBe(true);
  });

  it("should return false for invalid numbers", () => {
    expect(validateVietnamesePhone("123456789")).toBe(false);
    expect(validateVietnamesePhone("0412345678")).toBe(false);
  });
});

describe("Validate Email", () => {
  it("should return true for valid emails", () => {
    expect(validateEmail("example@gmail.com")).toBe(true);
    expect(validateEmail("a.b@domain.vn")).toBe(true);
  });

  it("should return false for invalid emails", () => {
    expect(validateEmail("example")).toBe(false);
    expect(validateEmail("example@")).toBe(false);
    expect(validateEmail("@domain.com")).toBe(false);
  });
});

describe("Validate Password Strength", () => {
  it("should return true for strong passwords", () => {
    expect(validatePasswordStrength("strongPass123")).toBe(true);
  });

  it("should return false for passwords that are too short", () => {
    expect(validatePasswordStrength("short1")).toBe(false);
  });

  it("should return false for passwords without numbers or letters", () => {
    expect(validatePasswordStrength("123456789!")).toBe(false);
    expect(validatePasswordStrength("nonumbers")).toBe(false);
  });
});
