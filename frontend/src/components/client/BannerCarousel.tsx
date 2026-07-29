import { useEffect, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type CarouselSlide = { key: string | number; node: ReactNode };

/**
 * Băng banner lật tay cho các khối "in focus" ở trang công khai.
 *
 * KHÔNG tự động chạy: banner tự lật khiến người đọc mất chỗ đang đọc, và với trình
 * đọc màn hình thì nội dung đổi dưới chân con trỏ. Người dùng tự bấm.
 *
 * Slide không hiển thị được đánh `inert` để link bên trong không nhận focus khi tab
 * — nếu chỉ dùng `aria-hidden` thì bàn phím vẫn lọt vào slide đang ẩn.
 */
export function BannerCarousel({ label, slides }: { label: string; slides: CarouselSlide[] }) {
  const [index, setIndex] = useState(0);
  const total = slides.length;

  // Danh sách co lại (đổi bộ lọc, dữ liệu mới về) thì kẹp lại cho khỏi trỏ ra ngoài.
  useEffect(() => {
    setIndex((current) => (current > total - 1 ? Math.max(total - 1, 0) : current));
  }, [total]);

  if (total === 0) return null;
  if (total === 1) return <>{slides[0].node}</>;

  return (
    <section aria-roledescription="carousel" aria-label={label} className="relative">
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {slides.map((slide, position) => (
            <div
              key={slide.key}
              className="w-full shrink-0"
              role="group"
              aria-roledescription="slide"
              aria-label={`${position + 1} of ${total}`}
              aria-hidden={position !== index}
              inert={position !== index}
            >
              {slide.node}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-4">
        <p aria-live="polite" className="font-data text-[10px] uppercase tracking-[0.22em] text-ivory-faint">
          {index + 1} / {total}
        </p>

        <div className="flex items-center gap-3">
          {/* Chấm chỉ vị trí, bấm nhảy thẳng tới slide đó. */}
          <div className="flex items-center gap-2">
            {slides.map((slide, position) => (
              <button
                key={slide.key}
                type="button"
                onClick={() => setIndex(position)}
                aria-label={`Go to slide ${position + 1} of ${total}`}
                aria-current={position === index}
                className={`h-2 rounded-full transition-all ${
                  position === index ? "w-6 bg-gold-400" : "w-2 bg-white/25 hover:bg-white/50"
                }`}
              />
            ))}
          </div>

          <div className="flex">
            <button
              type="button"
              onClick={() => setIndex((current) => Math.max(current - 1, 0))}
              disabled={index === 0}
              aria-label="Previous"
              className="inline-flex h-11 w-11 items-center justify-center border border-white/15 text-ivory transition-colors hover:border-gold-400/60 hover:text-gold-200 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-white/15 disabled:hover:text-ivory"
            >
              <ChevronLeft size={17} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setIndex((current) => Math.min(current + 1, total - 1))}
              disabled={index === total - 1}
              aria-label="Next"
              className="-ml-px inline-flex h-11 w-11 items-center justify-center border border-white/15 text-ivory transition-colors hover:border-gold-400/60 hover:text-gold-200 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-white/15 disabled:hover:text-ivory"
            >
              <ChevronRight size={17} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
