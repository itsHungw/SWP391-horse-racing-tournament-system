import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Coins,
  HelpCircle,
  Layers,
  Lock,
  ReceiptText,
  Scale,
  Swords,
  Trophy,
  X,
  type LucideIcon,
} from "lucide-react";
import { HOUSE_TAKEOUT_PCT } from "../predictionCockpitUtils";

interface GuideItem {
  icon: LucideIcon;
  title: string;
  text: string;
}

interface GuideSlide {
  eyebrow: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  items: GuideItem[];
  note?: string;
}

const GUIDE_SLIDES: GuideSlide[] = [
  {
    eyebrow: "Step 1",
    title: "Stake is the money you risk.",
    subtitle: "Start by checking the VND amount first. Your stake stays fixed after you confirm.",
    icon: Coins,
    items: [
      {
        icon: Coins,
        title: "Your stake",
        text: "The amount deducted from your wallet when the ticket is confirmed.",
      },
      {
        icon: ReceiptText,
        title: "If it loses",
        text: "The stake is the maximum loss for that ticket.",
      },
    ],
  },
  {
    eyebrow: "Step 2",
    title: "Read the slip, not only the board.",
    subtitle: "Board odds are a preview. The slip quotes the result after your stake moves the market.",
    icon: Scale,
    items: [
      {
        icon: Scale,
        title: "Current line",
        text: "The market before your stake is added.",
      },
      {
        icon: ReceiptText,
        title: "After your stake",
        text: "The quote you are about to confirm.",
      },
      {
        icon: Coins,
        title: "Player pool",
        text: "Real VND from players only. Virtual pricing liquidity is not shown as pool money.",
      },
    ],
  },
  {
    eyebrow: "Step 3",
    title: "Know when odds lock.",
    subtitle: "The lock rule is different for single-race predictions and streak tickets.",
    icon: Lock,
    items: [
      {
        icon: Trophy,
        title: "Exact Position / H2H",
        text: "Odds remain provisional until prediction lock.",
      },
      {
        icon: Layers,
        title: "Winning Streak",
        text: "The multiplier is confirmed when the streak ticket is placed.",
      },
      {
        icon: Lock,
        title: "House fee",
        text: `${HOUSE_TAKEOUT_PCT}% is already included in single-race quotes.`,
      },
    ],
  },
  {
    eyebrow: "Pick type",
    title: "Choose the market that matches your confidence.",
    subtitle: "Each mode has a different way of reading risk and return.",
    icon: Layers,
    items: [
      {
        icon: Trophy,
        title: "Exact Position",
        text: "Pick one runner and the exact finishing position.",
      },
      {
        icon: Swords,
        title: "Head-to-Head",
        text: "Pick which runner finishes ahead inside a paired matchup.",
      },
      {
        icon: Layers,
        title: "Winning Streak",
        text: "Pick winners across 2+ races. Every leg must win.",
      },
    ],
    note: "For money clarity, always confirm from the slip quote before placing.",
  },
];

export function RulesDialog({ open, onClose, feePercent = HOUSE_TAKEOUT_PCT }: { open: boolean; onClose: () => void; feePercent?: number }) {
  const [slideIndex, setSlideIndex] = useState(0);
  const closeRef = useRef<HTMLButtonElement>(null);

  const slides = useMemo(() => {
    return GUIDE_SLIDES.map((slide, sIdx) => {
      if (sIdx !== 2) return slide;
      return {
        ...slide,
        items: slide.items.map((item, iIdx) => {
          if (iIdx !== 2) return item;
          return {
            ...item,
            text: `${feePercent}% is already included in single-race quotes.`,
          };
        }),
      };
    });
  }, [feePercent]);

  const slide = slides[slideIndex];
  const Icon = slide.icon;
  const isFirst = slideIndex === 0;
  const isLast = slideIndex === slides.length - 1;

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (open) {
      setSlideIndex(0);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
      if (e.key === "ArrowRight") setSlideIndex((current) => Math.min(current + 1, slides.length - 1));
      if (e.key === "ArrowLeft") setSlideIndex((current) => Math.max(current - 1, 0));
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    
    const timer = setTimeout(() => closeRef.current?.focus(), 10);
    
    return () => {
      clearTimeout(timer);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, slides.length]);

  const progress = useMemo(() => `${slideIndex + 1} / ${slides.length}`, [slideIndex, slides.length]);

  const EASE = [0.16, 1, 0.3, 1];

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6" aria-hidden={false}>
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            type="button"
            aria-label="Close guide"
            onClick={onClose}
            className="absolute inset-0 cursor-default bg-turf-950/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.6, delay: 0.05, ease: EASE }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="rules-title"
            className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-turf-700 bg-turf-900 shadow-[0_40px_120px_-40px_rgba(0,0,0,0.92)] sm:rounded-2xl"
          >
        <div className="flex items-start justify-between gap-4 border-b border-turf-800 bg-turf-850 px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold-400/12 text-gold-300 ring-1 ring-gold-500/25">
              <HelpCircle className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h2 id="rules-title" className="truncate font-display text-lg font-bold text-ivory">
                How predictions work
              </h2>
              <p className="text-[12px] font-semibold text-ivory-dim">Money-first guide</p>
            </div>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-turf-700 text-ivory-dim transition-colors hover:bg-white/5 hover:text-ivory focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex gap-1.5" aria-label={progress}>
              {slides.map((item, index) => (
                <button
                  key={item.eyebrow}
                  type="button"
                  onClick={() => setSlideIndex(index)}
                  className={`h-1.5 rounded-full transition-all ${
                    index === slideIndex ? "w-8 bg-gold-300" : "w-3 bg-turf-700 hover:bg-turf-600"
                  }`}
                  aria-label={`Open guide slide ${index + 1}`}
                />
              ))}
            </div>
            <span className="font-data text-[10px] font-bold uppercase tracking-[0.14em] text-ivory-faint">
              {progress}
            </span>
          </div>

          <section className="rounded-2xl border border-gold-500/20 bg-[linear-gradient(135deg,rgba(212,175,55,0.13),rgba(12,44,35,0.62))] p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-turf-900/70 text-gold-300 ring-1 ring-gold-500/25">
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="font-data text-[10px] font-bold uppercase tracking-[0.16em] text-gold-200">
                  {slide.eyebrow}
                </p>
                <h3 className="mt-2 text-[22px] font-black leading-tight tracking-tight text-ivory">
                  {slide.title}
                </h3>
                <p className="mt-2 text-[13px] font-semibold leading-relaxed text-ivory-dim">
                  {slide.subtitle}
                </p>
              </div>
            </div>
          </section>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {slide.items.map((item) => {
              const ItemIcon = item.icon;
              return (
                <article key={item.title} className="rounded-xl border border-turf-800 bg-turf-850 p-3.5">
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-turf-900 text-gold-300">
                      <ItemIcon className="h-4 w-4" />
                    </span>
                    <h4 className="text-[13px] font-extrabold text-ivory">{item.title}</h4>
                  </div>
                  <p className="mt-2 text-[12px] font-medium leading-relaxed text-ivory-dim">{item.text}</p>
                </article>
              );
            })}
          </div>

          {slide.note ? (
            <p className="mt-3 rounded-xl border border-emerald-glow/25 bg-emerald-glow/[0.07] px-3 py-2 text-[12px] font-semibold leading-relaxed text-emerald-soft">
              {slide.note}
            </p>
          ) : null}
        </div>

        <div className="grid grid-cols-[44px_1fr] gap-2 border-t border-turf-800 bg-turf-850 px-5 py-3.5 sm:grid-cols-[44px_1fr_44px]">
          <button
            type="button"
            onClick={() => setSlideIndex((current) => Math.max(current - 1, 0))}
            disabled={isFirst}
            aria-label="Previous guide slide"
            className="grid h-11 place-items-center rounded-lg border border-turf-700 text-ivory-dim transition-colors hover:bg-white/5 hover:text-ivory focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              if (isLast) {
                onClose();
                return;
              }
              setSlideIndex((current) => Math.min(current + 1, slides.length - 1));
            }}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-gold-400 px-4 text-[13px] font-extrabold text-turf-950 transition-colors hover:bg-gold-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-turf-850"
          >
            {isLast ? "Got it" : "Next"}
            {!isLast ? <ChevronRight className="h-4 w-4" /> : null}
          </button>
          <button
            type="button"
            onClick={() => setSlideIndex((current) => Math.min(current + 1, slides.length - 1))}
            disabled={isLast}
            aria-label="Next guide slide"
            className="hidden h-11 place-items-center rounded-lg border border-turf-700 text-ivory-dim transition-colors hover:bg-white/5 hover:text-ivory focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-300 disabled:cursor-not-allowed disabled:opacity-40 sm:grid"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

export function HowToPlayButton({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-1.5 rounded-md border border-turf-700 px-2.5 py-1.5 text-[11px] font-bold text-ivory-dim transition-colors hover:border-gold-500/50 hover:text-gold-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-300 ${className}`}
      >
        <HelpCircle className="h-3.5 w-3.5" />
        How to play
      </button>
      <RulesDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
