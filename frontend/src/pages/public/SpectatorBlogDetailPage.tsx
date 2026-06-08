import { useEffect, useState } from "react";
import { Gift } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { blogApi } from "../../api/blogApi";
import { ClientHeader } from "../../components/client/ClientHeader";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import type { Blog } from "../../types/blog";

const fallbackImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuD3saKgDU0-ot9kioPQkTnU-C4T2VptX_iWNLBeQbVxehn21O8bD1RE9UShnD3qRvwvY14_AsQL3YyApeN3SrSP0Ebvm6nIbIv0A_fv-p2O_UWKt7PhZKQb_yY0fP_9eodHg13F0jBkZQ26xuS3PPbase_pms-XnBF-bAvTr1cxfSZtCyP1SRLXB94ddDXR3sDXxdieralZiuHP3f04FygdlJhKiub8gd3okHWLbSCfUJl56P5njmpz3WshFQU5618TcctmqF3yxNs";

function formatBlogDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function calculateScrollPercent() {
  const scrollTop = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
  const scrollHeight = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);

  if (scrollHeight <= viewportHeight) {
    return 100;
  }

  return Math.min(100, Math.floor(((scrollTop + viewportHeight) / scrollHeight) * 100));
}

export function SpectatorBlogDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [readingSeconds, setReadingSeconds] = useState(0);
  const [scrollPercent, setScrollPercent] = useState(0);
  const [claiming, setClaiming] = useState(false);
  const [claimMessage, setClaimMessage] = useState<string | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);

  useDocumentTitle(blog?.title || "Tournament blog");

  useEffect(() => {
    let isMounted = true;

    async function loadBlog() {
      if (!slug) {
        setLoading(false);
        setError("Post not found.");
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
          setError("Post not found.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadBlog();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  useEffect(() => {
    if (!blog) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setReadingSeconds(30);
    }, 30_000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [blog]);

  useEffect(() => {
    if (!blog) {
      return;
    }

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
    if (!blog || claiming) {
      return;
    }

    setClaiming(true);
    setClaimError(null);
    setClaimMessage(null);

    try {
      const response = await blogApi.claimBlogReward(blog.slug, {
        readingSeconds: Math.floor(readingSeconds),
        scrollPercent: Math.floor(Math.min(100, scrollPercent)),
      });

      if (response.outcome === "CLAIMED") {
        setClaimMessage(`You earned ${response.pointsAwarded} points.`);
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
      <div className="min-h-screen bg-white font-sans text-nyraDark">
        <ClientHeader />
        <main className="bg-[#f6f7f6]">
          <div className="container mx-auto px-4 py-12 md:py-16">
            <div className="animate-pulse border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-8 h-4 w-36 bg-slate-200" />
              <div className="mb-8 aspect-[16/7] bg-slate-200" />
              <div className="mb-4 h-12 w-4/5 bg-slate-200" />
              <div className="h-4 w-56 bg-slate-200" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!blog || error) {
    return (
      <div className="min-h-screen bg-white font-sans text-nyraDark">
        <ClientHeader />
        <main className="bg-[#f6f7f6]">
          <div className="container mx-auto px-4 py-12 md:py-16">
            <Link
              className="mb-8 inline-flex min-h-11 items-center text-sm font-black uppercase tracking-widest text-nyraGreen hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-nyraGreen"
              to="/blogs"
            >
              &larr; Back to Blogs
            </Link>
            <div className="border-l-4 border-nyraRed bg-white p-8 text-sm font-bold text-red-700 shadow-sm" role="alert">
              {error || "Post not found."}
            </div>
          </div>
        </main>
      </div>
    );
  }

  const rewardUnlocked = readingSeconds >= 30 && scrollPercent >= 80;
  const rewardButtonClass = rewardUnlocked
    ? "bg-nyraGreen text-white hover:bg-nyraDark focus-visible:outline-nyraGreen"
    : "cursor-not-allowed border border-slate-300 bg-slate-200 text-slate-500";

  return (
    <div className="min-h-screen bg-white font-sans text-nyraDark">
      <ClientHeader />

      <main>
        <article>
          <header className="relative min-h-[520px] overflow-hidden bg-nyraDark text-white">
            <img
              alt={blog.title}
              className="absolute inset-0 h-full w-full object-cover opacity-65"
              src={blog.thumbnail || fallbackImage}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-black/20" />
            <div className="container relative mx-auto flex min-h-[520px] items-end px-4 py-12 md:py-16">
              <div className="max-w-4xl">
                <Link
                  className="mb-8 inline-flex min-h-11 items-center text-sm font-black uppercase tracking-widest text-nyraGold hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                  to="/blogs"
                >
                  &larr; Back to Blogs
                </Link>
                <p className="border-l-4 border-nyraGold pl-4 text-xs font-black uppercase tracking-[0.24em] text-nyraGold">
                  Tournament Blog
                </p>
                <h1 className="mt-5 text-5xl font-black uppercase leading-none tracking-tight md:text-7xl">
                  {blog.title}
                </h1>
                <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-xs font-black uppercase tracking-[0.18em] text-white/75">
                  <span>By {blog.authorName}</span>
                  <span aria-hidden="true">&bull;</span>
                  <time dateTime={blog.createdAt}>{formatBlogDate(blog.createdAt)}</time>
                </div>
              </div>
            </div>
          </header>

          <section className="bg-white py-12 md:py-16">
            <div className="container mx-auto grid gap-10 px-4 lg:grid-cols-[260px_minmax(0,780px)] lg:items-start lg:justify-center">
              <aside className="border-t-4 border-nyraGreen bg-[#f6f7f6] p-6">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-nyraGreen">Article details</p>
                <dl className="mt-5 space-y-5">
                  <div>
                    <dt className="text-[10px] font-black uppercase tracking-widest text-slate-500">Author</dt>
                    <dd className="mt-1 text-base font-black text-nyraDark">{blog.authorName}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-black uppercase tracking-widest text-slate-500">Published</dt>
                    <dd className="mt-1 text-base font-black text-nyraDark">{formatBlogDate(blog.createdAt)}</dd>
                  </div>
                </dl>

                <section aria-labelledby="blog-reward-heading" className="mt-8 border-t border-slate-200 pt-6">
                  <h2 id="blog-reward-heading" className="text-xs font-black uppercase tracking-[0.2em] text-nyraGreen">
                    Blog reward
                  </h2>
                  {!rewardUnlocked ? (
                    <p className="mt-4 text-sm font-bold leading-6 text-slate-600">
                      Read the article and scroll to unlock reward.
                    </p>
                  ) : null}

                  <button
                    className={`mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 px-4 text-sm font-black uppercase tracking-widest transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 disabled:cursor-not-allowed ${rewardButtonClass}`}
                    disabled={!rewardUnlocked || claiming}
                    onClick={handleClaimReward}
                    type="button"
                  >
                    <Gift aria-hidden="true" size={18} strokeWidth={2.5} />
                    {claiming ? "Claiming..." : "Claim Reward"}
                  </button>

                  {claimMessage ? (
                    <p className="mt-4 text-sm font-bold text-nyraGreen" role="status" aria-live="polite">
                      {claimMessage}
                    </p>
                  ) : null}
                  {claimError ? (
                    <p className="mt-4 text-sm font-bold text-red-700" role="alert">
                      {claimError}
                    </p>
                  ) : null}
                </section>
              </aside>

              <div>
                {blog.summary ? (
                  <p className="border-l-4 border-nyraGold pl-5 text-2xl font-bold leading-9 text-nyraDark">
                    {blog.summary}
                  </p>
                ) : null}
                <div
                  className="mt-10 max-w-none text-lg leading-8 text-slate-800 [&_a]:font-bold [&_a]:text-nyraGreen [&_a]:underline [&_h2]:mb-4 [&_h2]:mt-10 [&_h2]:text-3xl [&_h2]:font-black [&_h2]:uppercase [&_h2]:tracking-tight [&_h2]:text-nyraDark [&_h3]:mb-3 [&_h3]:mt-8 [&_h3]:text-2xl [&_h3]:font-black [&_h3]:text-nyraDark [&_li]:mb-2 [&_ol]:mb-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mb-6 [&_strong]:font-black [&_ul]:mb-6 [&_ul]:list-disc [&_ul]:pl-6"
                  dangerouslySetInnerHTML={{ __html: blog.content }}
                />
              </div>
            </div>
          </section>
        </article>
      </main>

      <footer className="border-t border-white/10 bg-nyraDark py-10 text-white">
        <div className="container mx-auto flex flex-col gap-3 px-4 md:flex-row md:items-center md:justify-between">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-nyraGold">Horse Racing Tournament</p>
          <Link
            className="inline-flex min-h-11 items-center text-sm font-black uppercase tracking-widest text-white hover:text-nyraGold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            to="/blogs"
          >
            More Blog Posts <span className="ml-2">&rarr;</span>
          </Link>
        </div>
      </footer>
    </div>
  );
}
