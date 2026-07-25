import type { FinanceRange } from "../types/adminFinance";

const vietnamDate = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Ho_Chi_Minh",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function financeDate(offsetDays = 0) {
  const date = new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000);
  const parts = Object.fromEntries(
    vietnamDate.formatToParts(date).map((part) => [part.type, part.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function defaultFinanceRange(days = 30): FinanceRange {
  return { from: financeDate(-(days - 1)), to: financeDate() };
}
