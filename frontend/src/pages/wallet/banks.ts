export interface Bank {
  /** Short code used as the monogram fallback and the logo filename. */
  code: string;
  /** Common display name (used in lists). */
  name: string;
  /** Full legal name (Vietnamese). */
  fullName: string;
  /** napas/VietQR BIN, handy for QR / logo lookups. */
  bin?: string;
  /** Brand-ish colour for the monogram fallback avatar. */
  color: string;
}

/**
 * Vietnamese banks (napas / VietQR members). `code` doubles as the logo file
 * name: drop an SVG at `frontend/public/banks/<code>.svg` (e.g. `VCB.svg`) and
 * it renders automatically; otherwise the coloured monogram is used.
 */
export const BANKS: Bank[] = [
  { code: "VCB", name: "Vietcombank", fullName: "NH TMCP Ngoại thương Việt Nam", bin: "970436", color: "#0a7a3b" },
  { code: "TCB", name: "Techcombank", fullName: "NH TMCP Kỹ thương Việt Nam", bin: "970407", color: "#d8232a" },
  { code: "BIDV", name: "BIDV", fullName: "NH TMCP Đầu tư và Phát triển Việt Nam", bin: "970418", color: "#007a4d" },
  { code: "CTG", name: "VietinBank", fullName: "NH TMCP Công thương Việt Nam", bin: "970415", color: "#0a72bb" },
  { code: "AGR", name: "Agribank", fullName: "NH NN&PTNT Việt Nam", bin: "970405", color: "#9d1c24" },
  { code: "ACB", name: "ACB", fullName: "NH TMCP Á Châu", bin: "970416", color: "#1763a6" },
  { code: "MB", name: "MB Bank", fullName: "NH TMCP Quân đội", bin: "970422", color: "#1b3a6b" },
  { code: "VPB", name: "VPBank", fullName: "NH TMCP Việt Nam Thịnh Vượng", bin: "970432", color: "#00a651" },
  { code: "STB", name: "Sacombank", fullName: "NH TMCP Sài Gòn Thương Tín", bin: "970403", color: "#0046a8" },
  { code: "TPB", name: "TPBank", fullName: "NH TMCP Tiên Phong", bin: "970423", color: "#6a2c91" },
  { code: "HDB", name: "HDBank", fullName: "NH TMCP Phát triển TP.HCM", bin: "970437", color: "#c8102e" },
  { code: "VIB", name: "VIB", fullName: "NH TMCP Quốc tế Việt Nam", bin: "970441", color: "#0a3b7c" },
  { code: "SHB", name: "SHB", fullName: "NH TMCP Sài Gòn - Hà Nội", bin: "970443", color: "#e07a16" },
  { code: "OCB", name: "OCB", fullName: "NH TMCP Phương Đông", bin: "970448", color: "#0a6e3a" },
  { code: "MSB", name: "MSB", fullName: "NH TMCP Hàng Hải", bin: "970426", color: "#b51d2a" },
  { code: "SEAB", name: "SeABank", fullName: "NH TMCP Đông Nam Á", bin: "970440", color: "#b8102e" },
  { code: "EIB", name: "Eximbank", fullName: "NH TMCP Xuất Nhập khẩu Việt Nam", bin: "970431", color: "#1a4f9c" },
  { code: "NAB", name: "Nam A Bank", fullName: "NH TMCP Nam Á", bin: "970428", color: "#0a558c" },
  { code: "LPB", name: "LPBank", fullName: "NH TMCP Lộc Phát Việt Nam", bin: "970449", color: "#6a1b9a" },
  { code: "SCB", name: "SCB", fullName: "NH TMCP Sài Gòn", bin: "970429", color: "#1d4f9c" },
  { code: "BAB", name: "Bac A Bank", fullName: "NH TMCP Bắc Á", bin: "970409", color: "#b8860b" },
  { code: "ABB", name: "ABBANK", fullName: "NH TMCP An Bình", bin: "970425", color: "#00529b" },
  { code: "PVCB", name: "PVcomBank", fullName: "NH TMCP Đại chúng Việt Nam", bin: "970412", color: "#e30613" },
  { code: "VAB", name: "VietABank", fullName: "NH TMCP Việt Á", bin: "970427", color: "#9d1c24" },
  { code: "BVB", name: "BaoViet Bank", fullName: "NH TMCP Bảo Việt", bin: "970438", color: "#0a6e3a" },
  { code: "NCB", name: "NCB", fullName: "NH TMCP Quốc Dân", bin: "970419", color: "#e30613" },
  { code: "KLB", name: "KienlongBank", fullName: "NH TMCP Kiên Long", bin: "970452", color: "#00529b" },
  { code: "VBB", name: "VietBank", fullName: "NH TMCP Việt Nam Thương Tín", bin: "970433", color: "#c8102e" },
  { code: "SGICB", name: "SaigonBank", fullName: "NH TMCP Sài Gòn Công Thương", bin: "970400", color: "#0046a8" },
  { code: "GPB", name: "GPBank", fullName: "NH TM TNHH MTV Dầu khí Toàn cầu", bin: "970408", color: "#0a3b7c" },
  { code: "DOB", name: "DongA Bank", fullName: "NH TMCP Đông Á", bin: "970406", color: "#c8102e" },
  { code: "OCEANBANK", name: "OceanBank", fullName: "NH TM TNHH MTV Đại Dương", bin: "970414", color: "#0a72bb" },
  { code: "VRB", name: "VRB", fullName: "NH Liên doanh Việt - Nga", bin: "970421", color: "#b51d2a" },
  { code: "WVN", name: "Woori", fullName: "NH Woori Việt Nam", bin: "970457", color: "#0a3b7c" },
  { code: "SVB", name: "Shinhan Bank", fullName: "NH Shinhan Việt Nam", bin: "970424", color: "#0a558c" },
  { code: "HLB", name: "Hong Leong", fullName: "NH Hong Leong Việt Nam", bin: "970442", color: "#0a6e3a" },
  { code: "SCVN", name: "Standard Chartered", fullName: "NH Standard Chartered Việt Nam", bin: "970410", color: "#0a7a3b" },
  { code: "PBVN", name: "Public Bank", fullName: "NH Public Bank Việt Nam", bin: "970439", color: "#e30613" },
  { code: "IVB", name: "Indovina", fullName: "NH TNHH Indovina", bin: "970434", color: "#0a72bb" },
  { code: "UOB", name: "UOB", fullName: "NH UOB Việt Nam", bin: "970458", color: "#0a3b7c" },
  { code: "CIMB", name: "CIMB", fullName: "NH TNHH MTV CIMB Việt Nam", bin: "422589", color: "#b8102e" },
  { code: "VCCB", name: "BVBank", fullName: "NH TMCP Bản Việt", bin: "970454", color: "#0a558c" },
  { code: "CAKE", name: "CAKE", fullName: "CAKE by VPBank", bin: "546034", color: "#ff2e63" },
  { code: "TIMO", name: "Timo", fullName: "Timo by Bản Việt Bank", bin: "963388", color: "#00b3a4" },
];

/** Mask an account number to its last 4 digits, e.g. "•••• 6789". */
export function maskAccount(account: string): string {
  const trimmed = account.trim();
  return trimmed.length >= 4 ? `•••• ${trimmed.slice(-4)}` : trimmed;
}

/**
 * Parse a stored `bankInfo` string back into parts. The withdraw sheet composes
 * it as `"{holder} · {accountNumber} · {bankName} ({code})"`; older / free-text
 * records simply return `{}` so callers fall back to the raw string.
 */
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
