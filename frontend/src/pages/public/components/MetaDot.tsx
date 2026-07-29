/**
 * Dấu chấm ngăn cách giữa các mẩu meta chạy chữ (giải · cự ly · số ngựa).
 * Thuần trang trí nên `aria-hidden` — screen reader đọc liền mạch các mẩu text
 * thay vì chấm giữa từng cái.
 */
export function MetaDot() {
  return <span aria-hidden="true" className="text-ivory-faint/60">·</span>;
}
