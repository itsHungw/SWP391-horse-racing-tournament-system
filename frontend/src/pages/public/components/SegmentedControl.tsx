import { useId, useRef, type KeyboardEvent, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

type SegmentedOption<Value extends string> = {
  value: Value;
  label: string;
  icon?: ReactNode;
};

/**
 * Bộ chọn một-trong-nhiều (scope, view, status filter).
 *
 * Dùng `radiogroup`/`radio` chứ không phải `group` + `aria-pressed`: các lựa chọn
 * loại trừ lẫn nhau, nên screen reader cần đọc "2 of 5" thay vì "pressed button".
 * Kèm roving tabindex — cả bộ chỉ chiếm MỘT điểm dừng Tab, mũi tên di chuyển bên
 * trong. Trước đây 5 filter là 5 nhịp Tab, mỗi trang có hai bộ.
 */
export function SegmentedControl<Value extends string>({
  label,
  value,
  options,
  onChange,
  accent = "gold",
  className = "",
}: {
  label: string;
  value: Value;
  options: readonly SegmentedOption<Value>[];
  onChange: (value: Value) => void;
  accent?: "gold" | "emerald";
  className?: string;
}) {
  const reduce = useReducedMotion();
  const layoutId = useId();
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const activeSurface = accent === "emerald" ? "bg-emerald-glow" : "bg-gold-400";

  const selectedIndex = options.findIndex((option) => option.value === value);
  // Giá trị lạ (deep link hỏng) vẫn phải còn một nút vào được bằng Tab.
  const tabbableIndex = selectedIndex >= 0 ? selectedIndex : 0;

  function select(index: number) {
    const wrapped = (index + options.length) % options.length;
    onChange(options[wrapped].value);
    buttonRefs.current[wrapped]?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        event.preventDefault();
        select(index + 1);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        event.preventDefault();
        select(index - 1);
        break;
      case "Home":
        event.preventDefault();
        select(0);
        break;
      case "End":
        event.preventDefault();
        select(options.length - 1);
        break;
      default:
        break;
    }
  }

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={`grid rounded-xl border border-white/10 bg-turf-900/80 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)] ${className}`}
    >
      {options.map((option, index) => {
        const active = option.value === value;
        return (
          <button
            key={option.value || "all"}
            ref={(node) => {
              buttonRefs.current[index] = node;
            }}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={index === tabbableIndex ? 0 : -1}
            onClick={() => onChange(option.value)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={`relative isolate inline-flex min-h-11 min-w-0 items-center justify-center gap-2 rounded-lg px-3 text-[11px] font-bold uppercase tracking-[0.13em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-300 ${active ? "text-turf-950" : "text-ivory-dim hover:bg-white/[0.035] hover:text-ivory"}`}
          >
            {active ? (
              <motion.span
                layoutId={`segmented-control-${layoutId}`}
                aria-hidden="true"
                className={`absolute inset-0 -z-10 rounded-lg shadow-[0_10px_30px_-16px_rgba(212,175,55,0.9)] ${activeSurface}`}
                transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 460, damping: 38 }}
              />
            ) : null}
            <span
              aria-hidden="true"
              className={`h-1.5 w-1.5 shrink-0 rotate-45 border ${active ? "border-turf-950 bg-turf-950" : "border-current bg-transparent"}`}
            />
            {option.icon}
            <span className="truncate">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
