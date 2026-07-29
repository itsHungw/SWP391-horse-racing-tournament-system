import { toneClasses, type StatusTone } from "../publicRacingData";

/**
 * Nhãn trạng thái dùng chung cho mọi trang công khai.
 *
 * Trạng thái hành động được (đang chạy / đang mở đăng ký) tô nền đặc để nổi hẳn
 * khỏi các trạng thái chỉ-để-đọc vốn chỉ có viền. Khác biệt về cấu trúc, không
 * riêng sắc độ — người dùng phải phân loại được cả danh sách chỉ bằng liếc mắt.
 */
export function StatusPill({ tone, label }: { tone: StatusTone; label: string }) {
  const c = toneClasses[tone];
  const isLive = tone === "live" || tone === "open";
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 ${c.ring} ${
        c.solid ? "" : "bg-turf-950/60"
      }`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${c.dot} ${isLive ? "live-pulse" : ""}`} />
      <span className={`eyebrow ${c.text} ${c.solid ? "font-bold" : ""}`}>{label}</span>
    </span>
  );
}
