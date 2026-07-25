import type { BankDirectoryItem } from "../../types/wallet";

export interface Bank {
  code: string;
  name: string;
  bin: string;
  color: string;
}

const BRAND_COLORS = [
  "#0a7a3b",
  "#d8232a",
  "#007a4d",
  "#0a72bb",
  "#6a2c91",
  "#b8860b",
] as const;

/** Branding is local; bank identity, name, BIN and QR support always come from the server. */
export function bankColor(code: string): string {
  const index = [...code].reduce((hash, character) => hash + character.charCodeAt(0), 0);
  return BRAND_COLORS[index % BRAND_COLORS.length];
}

export function toBankOptions(directory: BankDirectoryItem[]): Bank[] {
  return directory.map((bank) => ({
    code: bank.code,
    name: bank.name,
    bin: bank.bin,
    color: bankColor(bank.code),
  }));
}

export function maskAccount(account: string): string {
  const trimmed = account.trim();
  return trimmed.length >= 4 ? `•••• ${trimmed.slice(-4)}` : trimmed;
}

export function parseBankInfo(info: string): {
  holder?: string;
  account?: string;
  bankName?: string;
  code?: string;
} {
  const match = info.match(/^(.*?) · (.+?) · (.+?) \(([A-Za-z0-9]+)\)$/);
  if (!match) return {};
  return { holder: match[1], account: match[2], bankName: match[3], code: match[4] };
}
