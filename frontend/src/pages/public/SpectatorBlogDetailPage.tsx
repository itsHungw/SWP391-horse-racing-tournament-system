import { useEffect, useState } from "react";
import { Gift } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

import { blogApi } from "../../api/blogApi";
import { ClientHeader } from "../../components/client/ClientHeader";
import { ClientFooter } from "../../components/client/ClientFooter";
import { Eyebrow } from "../../components/client/primitives";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import type { Blog } from "../../types/blog";

const fallbackImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuD3saKgDU0-ot9kioPQkTnU-C4T2VptX_iWNLBeQbVxehn21O8bD1RE9UShnD3qRvwvY14_AsQL3YyApeN3SrSP0Ebvm6nIbIv0A_fv-p2O_UWKt7PhZKQb_yY0fP_9eodHg13F0jBkZQ26xuS3PPbase_pms-XnBF-bAvTr1cxfSZtCyP1SRLXB94ddDXR3sDXxdieralZiuHP3f04FygdlJhKiub8gd3okHWLbSCfUJl56P5njmpz3WshFQU5618TcctmqF3yxNs";

function formatBlogDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "long", day: "numeric", year: "numeric" }).format(
    new Date(value),
  );
}

function calculateScrollPercent() {
  const scrollTop = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
  const scrollHeight = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
  if (scrollHeight <= viewportHeight) return 100;
  return Math.min(100, Math.floor(((scrollTop + viewportHeight) / scrollHeight) * 100));
}

export function SpectatorBlogDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const reduce = useReducedMotion();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [readingSeconds, setReadingSeconds] = useState(0);
  const [scrollPercent, setScrollPercent] = useState(0);
  const [claiming, setClaiming] = useState(false);
  const [claimMessage, setClaimMessage] = useState<string | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);

  useDocumentTitle(blog?.title || "Newsroom | Night at the Races");

  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.3], ["0%", "24%"]);

  useEffect(() => {
    let isMounted = true;
    async function loadBlog() {
      if (!slug) {
        setLoading(false);
        setError("Story not found.");
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const data = await blogApi.getPublishedBlogBySlug(slug);
        if (isMounted) {
          setBlog(data);
          setReadingSeconds(0);
          setScrollPercent(0);
          setClaimMessage(null);
          setClaimError(null);
        }
      } catch (err) {
        console.error("Public blog article unavailable.", err);
        if (isMounted) {
          setBlog(null);
          setError("Story not found.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadBlog();
    return () => {
      isMounted = false;
    };
  }, [slug]);

  useEffect(() => {
    if (!blog) return;
    const timeoutId = window.setTimeout(() => setReadingSeconds(30), 30_000);
    return () => window.clearTimeout(timeoutId);
  }, [blog]);

  useEffect(() => {
    if (!blog) return;
    function updateScrollProgress() {
      setScrollPercent((current) => Math.max(current, calculateScrollPercent()));
    }
    window.addEventListener("scroll", updateScrollProgress, { passive: true });
    window.addEventListener("resize", updateScrollProgress);
    updateScrollProgress();
    return () => {
      window.removeEventListener("scroll", updateScrollProgress);
      window.removeEventListener("resize", updateScrollProgress);
    };
  }, [blog]);

  async function handleClaimReward() {
    if (!blog || claiming) return;
    setClaiming(true);
    setClaimError(null);
    setClaimMessage(null);
    try {
      const response = await blogApi.claimBlogReward(blog.slug, {
        readingSeconds: Math.floor(readingSeconds),
        scrollPercent: Math.floor(Math.min(100, scrollPercent)),
      });
      if (response.outcome === "CLAIMED") {
        setClaimMessage(`You earned ${response.pointsAwarded} virtual points.`);
      } else if (response.outcome === "ALREADY_CLAIMED") {
        setClaimMessage("Reward already claimed.");
      } else {
        setClaimMessage("Daily reward limit reached.");
      }
    } catch (err) {
      console.error("Blog reward claim failed.", err);
      setClaimError("Could not claim reward. Please sign in and try again.");
    } finally {
      setClaiming(false);
    }
  }

  if (loading) {
    return (
      <div className="client-theme min-h-screen bg-turf-950 text-ivory">
        <ClientHeader />
        <div className="mx-auto max-w-[1100px] px-6 py-16 md:px-12">
          <div className="animate-pulse">
            <div className="h-4 w-36 bg-white/5" />
            <div className="mt-8 aspect-[16/7] rounded-2xl bg-white/5" />
            <div className="mt-8 h-12 w-4/5 bg-white/5" />
            <div className="mt-4 h-4 w-56 bg-white/5" />
          </div>
        </div>
      </div>
    );
  }

  if (!blog || error) {
    return (
      <div className="client-theme min-h-screen bg-turf-950 text-ivory">
        <ClientHeader />
        <div className="mx-auto max-w-[1100px] px-6 py-20 md:px-12">
          <Link
            to="/blogs"
            className="inline-flex items-center text-[13px] font-bold uppercase tracking-[0.16em] text-gold-300 hover:text-gold-200"
          >
            &larr; Back to Newsroom
          </Link>
          <div
            className="mt-8 rounded-2xl border-l-4 border-nyraRed bg-turf-900 px-7 py-8 text-sm font-semibold text-rose-300"
            role="alert"
          >
            {error || "Story not found."}
          </div>
        </div>
        <ClientFooter />
      </div>
    );
  }

  const rewardUnlocked = readingSeconds >= 30 && scrollPercent >= 80;

  return (
    <div className="client-theme bg-turf-950 text-ivory">
      <ClientHeader />

      <article>
        {/* Hero */}
        <header className="grain relative isolate min-h-[60vh] overflow-hidden">
          <motion.div style={reduce ? undefined : { y: heroY }} className="absolute inset-0 -z-10">
            <img
              src={blog.thumbnail || fallbackImage}
              alt=""
              className="h-full w-full object-cover object-center opacity-55"
            />
          </motion.div>
          <div className="turf-vignette absolute inset-0 -z-10" />
          <div className="mx-auto flex min-h-[60vh] max-w-[1100px] flex-col justify-end px-6 pb-14 pt-28 md:px-12">
            <motion.div
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] as const }}
            >
              <Link
                to="/blogs"
                className="group inline-flex items-center text-[12px] font-bold uppercase tracking-[0.16em] text-gold-300 transition-colors hover:text-ivory"
              >
                <span className="mr-2 transition-transform group-hover:-translate-x-1">&larr;</span> Back to Newsroom
              </Link>
              <h1 className="mt-6 max-w-4xl font-display text-[clamp(2.4rem,6vw,5rem)] font-light leading-[0.95] tracking-[-0.02em]">
                {blog.title}
              </h1>
              <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 font-data text-xs uppercase tracking-[0.18em] text-ivory-dim">
                <span>By {blog.authorName}</span>
                <span aria-hidden="true" className="text-gold-400">
                  ◆
                </span>
                <time dateTime={blog.createdAt}>{formatBlogDate(blog.createdAt)}</time>
              </div>
            </motion.div>
          </div>
        </header>

        {/* Body */}
        <section className="bg-turf-900 py-16 md:py-24">
          <div className="mx-auto grid max-w-[1100px] gap-12 px-6 md:px-12 lg:grid-cols-[300px_minmax(0,1fr)] lg:items-start">
            {/* Reward aside */}
            <motion.aside
              initial={reduce ? { opacity: 0 } : { opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] as const }}
              className="lg:sticky lg:top-28 lg:self-start"
            >
              <div className="rounded-2xl border border-gold-600/25 bg-turf-950 p-7">
                <Eyebrow tone="gold">Article</Eyebrow>
                <dl className="mt-5 space-y-5">
                  <div>
                    <dt className="font-data text-[10px] uppercase tracking-[0.2em] text-ivory-faint">Author</dt>
                    <dd className="mt-1 font-display text-lg text-ivory">{blog.authorName}</dd>
                  </div>
                  <div>
                    <dt className="font-data text-[10px] uppercase tracking-[0.2em] text-ivory-faint">Published</dt>
                    <dd className="mt-1 font-display text-lg text-ivory">{formatBlogDate(blog.createdAt)}</dd>
                  </div>
                </dl>

                <section aria-labelledby="reward-heading" className="mt-8 border-t border-white/10 pt-7">
                  <h2 id="reward-heading" className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-soft live-pulse" />
                    <Eyebrow tone="emerald">Reading Reward</Eyebrow>
                  </h2>

                  <div className="mt-5 space-y-4">
                    <div>
                      <div className="flex justify-between text-xs font-semibold text-ivory-dim">
                        <span>Reading time</span>
                        <span className={readingSeconds >= 30 ? "text-emerald-soft" : ""}>
                          {Math.min(30, readingSeconds)}s / 30s
                        </span>
                      </div>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                        <motion.div
                          className="h-full bg-emerald-glow"
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, (readingSeconds / 30) * 100)}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs font-semibold text-ivory-dim">
                        <span>Scroll progress</span>
                        <span className={scrollPercent >= 80 ? "text-emerald-soft" : ""}>{scrollPercent}% / 80%</span>
                      </div>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                        <motion.div
                          className="h-full bg-emerald-glow"
                          animate={{ width: `${scrollPercent}%` }}
                          transition={{ ease: "easeOut" }}
                        />
                      </div>
                    </div>
                  </div>

                  <motion.button
                    whileHover={rewardUnlocked && !claiming ? { scale: 1.02 } : undefined}
                    whileTap={rewardUnlocked && !claiming ? { scale: 0.98 } : undefined}
                    type="button"
                    disabled={!rewardUnlocked || claiming}
                    onClick={handleClaimReward}
                    className={`mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-sm px-4 text-[13px] font-bold uppercase tracking-[0.16em] transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed ${
                      rewardUnlocked
                        ? "bg-gold-400 text-turf-950 shadow-[0_14px_36px_-12px_rgba(212,175,55,0.6)] hover:bg-gold-300 focus-visible:outline-ivory"
                        : "border border-white/10 bg-white/5 text-ivory-faint"
                    }`}
                  >
                    <Gift aria-hidden="true" size={17} strokeWidth={2.2} />
                    {claiming ? "Claiming…" : "Claim Reward"}
                  </motion.button>

                  {claimMessage ? (
                    <p
                      className="mt-4 border-l-2 border-emerald-glow bg-emerald-glow/10 p-3 text-sm font-semibold text-emerald-soft"
                      role="status"
                      aria-live="polite"
                    >
                      {claimMessage}
                    </p>
                  ) : null}
                  {claimError ? (
                    <p
                      className="mt-4 border-l-2 border-nyraRed bg-rose-500/10 p-3 text-sm font-semibold text-rose-300"
                      role="alert"
                    >
                      {claimError}
                    </p>
                  ) : null}
                </section>
              </div>
            </motion.aside>

            {/* Content */}
            <motion.div
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] as const }}
            >
              {blog.summary ? (
                <p className="border-l-2 border-gold-400 pl-6 font-display text-2xl font-light italic leading-relaxed text-ivory">
                  {blog.summary}
                </p>
              ) : null}
              <div
                className="mt-12 max-w-none text-lg leading-8 text-ivory-dim [&_a]:font-semibold [&_a]:text-gold-300 [&_a]:underline [&_h2]:mb-6 [&_h2]:mt-12 [&_h2]:font-display [&_h2]:text-3xl [&_h2]:font-medium [&_h2]:tracking-tight [&_h2]:text-ivory [&_h3]:mb-4 [&_h3]:mt-10 [&_h3]:font-display [&_h3]:text-2xl [&_h3]:font-medium [&_h3]:text-ivory [&_li]:mb-3 [&_ol]:mb-8 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mb-8 [&_strong]:font-bold [&_strong]:text-ivory [&_ul]:mb-8 [&_ul]:list-disc [&_ul]:pl-6"
                dangerouslySetInnerHTML={{ __html: blog.content }}
              />
            </motion.div>
          </div>
        </section>
      </article>

      <ClientFooter />
    </div>
  );
}
