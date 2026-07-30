/**
 * Định dạng tiền VND dùng chung cho toàn client.
 *
 * Có hai chế độ vì hai ngữ cảnh khác nhau:
 * - {@link formatVnd} — con số đầy đủ, dùng nơi độ chính xác là bắt buộc (ví, phiếu
 *   cược, xác nhận rút tiền). Người dùng phải đọc được từng đồng.
 * - {@link formatVndCompact} — rút gọn, dùng trong ô hẹp (thẻ trong list, badge, chip
 *   trên header). Giải thưởng 500.000.000 viết đủ là 15 ký tự, nhét vào một cột lưới
 *   sẽ tràn — đó là lý do trước đây cột prize ở ChampionshipsPage phải hạ cỡ chữ
 *   xuống text-sm trong khi hai cột bên cạnh vẫn text-xl.
 *
 * Locale được ghi cố định "en-US": trước đây code gọi `.toLocaleString()` không tham
 * số nên định dạng đổi theo máy người dùng (máy VN ra 500.000.000, máy US ra
 * 500,000,000). Giao diện đang dùng tiếng Anh nên chốt en-US cho nhất quán.
 */

const VND = new Intl.NumberFormat("en-US");

/** Bỏ ".0" thừa: 1.0 -> "1", 1.25 -> "1.3" (một chữ số thập phân là đủ cho ô hẹp). */
function trimUnit(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

/** Số tiền đầy đủ kèm ký hiệu: `1,245,875 ₫`. */
export function formatVnd(amount: number): string {
  return `${VND.format(Math.round(amount))} ₫`;
}

/**
 * Số tiền rút gọn cho ô hẹp: `850 ₫` · `12K ₫` · `500M ₫` · `1.2B ₫`.
 * Giữ dấu âm cho các giá trị lỗ/trừ.
 */
export function formatVndCompact(amount: number): string {
  const sign = amount < 0 ? "-" : "";
  const size = Math.abs(amount);

  if (size >= 1_000_000_000) return `${sign}${trimUnit(size / 1_000_000_000)}B ₫`;
  if (size >= 1_000_000) return `${sign}${trimUnit(size / 1_000_000)}M ₫`;
  if (size >= 1_000) return `${sign}${trimUnit(size / 1_000)}K ₫`;
  return `${sign}${Math.round(size)} ₫`;
}
