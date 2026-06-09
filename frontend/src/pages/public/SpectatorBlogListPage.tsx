import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Search } from "lucide-react";

import { blogApi } from "../../api/blogApi";
import heroImage from "../../assets/slide.jpg";
import { ClientHeader } from "../../components/client/ClientHeader";
import { ClientFooter } from "../../components/client/ClientFooter";
import {
  Eyebrow,
  GoldRule,
  MotionReveal,
  MotionStagger,
  MotionStaggerItem,
} from "../../components/client/primitives";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import type { Blog } from "../../types/blog";

const fallbackImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuD3saKgDU0-ot9kioPQkTnU-C4T2VptX_iWNLBeQbVxehn21O8bD1RE9UShnD3qRvwvY14_AsQL3YyApeN3SrSP0Ebvm6nIbIv0A_fv-p2O_UWKt7PhZKQb_yY0fP_9eodHg13F0jBkZQ26xuS3PPbase_pms-XnBF-bAvTr1cxfSZtCyP1SRLXB94ddDXR3sDXxdieralZiuHP3f04FygdlJhKiub8gd3okHWLbSCfUJl56P5njmpz3WshFQU5618TcctmqF3yxNs";

function formatBlogDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(
    new Date(value),
  );
}

export function SpectatorBlogListPage() {
  useDocumentTitle("Newsroom | Night at the Races");
  const reduce = useReducedMotion();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.25], ["0%", "20%"]);

  useEffect(() => {
    let isMounted = true;
    async function loadBlogs() {
      setLoading(true);
      setError(null);
      try {
        const data = await blogApi.getPublishedBlogs(search);
        if (isMounted) setBlogs(Array.isArray(data.content) ? data.content : []);
      } catch (err) {
        console.error("Public blog list unavailable.", err);
        if (isMounted) {
          setBlogs([]);
          setError("Could not load published stories right now.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadBlogs();
    return () => {
      isMounted = false;
    };
  }, [search]);

  const [featured, ...rest] = blogs;
  const hasFeatured = useMemo(() => !search && Boolean(featured), [search, featured]);

  return (
    <div className="client-theme bg-turf-950 text-ivory">
      <ClientHeader />

      {/* Hero */}
      <section className="grain relative isolate overflow-hidden">
        <motion.div style={reduce ? undefined : { y: heroY }} className="absolute inset-0 -z-10">
          <img src={heroImage} alt="" className="h-full w-full object-cover object-center opacity-40" />
        </motion.div>
        <div className="turf-vignette absolute inset-0 -z-10" />
        <div className="mx-auto max-w-[1400px] px-6 pb-14 pt-24 md:px-12 md:pb-16 md:pt-32">
          <MotionStagger className="max-w-3xl" gap={0.12}>
            <MotionStaggerItem>
              <Eyebrow tone="gold">The Newsroom</Eyebrow>
            </MotionStaggerItem>
            <MotionStaggerItem>
              <h1 className="mt-6 font-display text-[clamp(2.8rem,7vw,6rem)] font-light leading-[0.9] tracking-[-0.02em]">
                From the championship <span className="italic text-foil">desk.</span>
              </h1>
            </MotionStaggerItem>
            <MotionStaggerItem>
              <p className="mt-6 max-w-xl text-lg font-light leading-relaxed text-ivory-dim">
                Race previews, spectator guides, and operations updates — published by the tournament team.
              </p>
            </MotionStaggerItem>
          </MotionStagger>

          {/* Search command strip */}
          <MotionReveal className="mt-10 max-w-xl" y={0}>
            <div className="flex items-center gap-3 rounded-full border border-white/15 bg-turf-950/70 px-5 py-3 backdrop-blur-md transition-colors focus-within:border-gold-400/60">
              <Search size={18} className="shrink-0 text-gold-400/80" />
              <label className="sr-only" htmlFor="blog-search">
                Search stories
              </label>
              <input
                id="blog-search"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search the newsroom…"
                className="w-full bg-transparent text-base text-ivory placeholder:text-ivory-faint focus:outline-none"
              />
            </div>
          </MotionReveal>
        </div>
      </section>

      {/* Stories */}
      <section className="bg-turf-900 py-20 md:py-28">
        <div className="mx-auto max-w-[1400px] px-6 md:px-12">
          {error ? (
            <div
              className="rounded-2xl border-l-4 border-nyraRed bg-turf-950 px-7 py-8 text-sm font-semibold text-rose-300"
              role="alert"
            >
              {error}
            </div>
          ) : loading ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3" aria-label="Loading stories">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="animate-pulse overflow-hidden rounded-2xl border border-white/8 bg-turf-950">
                  <div className="aspect-[16/10] bg-white/5" />
                  <div className="space-y-3 p-6">
                    <div className="h-3 w-28 bg-white/5" />
                    <div className="h-6 w-full bg-white/5" />
                    <div className="h-4 w-3/4 bg-white/5" />
                  </div>
                </div>
              ))}
            </div>
          ) : blogs.length === 0 ? (
            <div className="rounded-2xl border-l-4 border-gold-400 bg-turf-950 px-7 py-10">
              <Eyebrow tone="gold">Nothing found</Eyebrow>
              <p className="mt-4 max-w-lg font-display text-2xl font-light text-ivory">
                {search ? "No stories match this search." : "The newsroom opens with the season."}
              </p>
            </div>
          ) : (
            <>
              {hasFeatured ? (
                <MotionReveal className="mb-14">
                  <Link
                    to={`/blogs/${featured.slug}`}
                    aria-label={`Read ${featured.title}`}
                    className="group grid overflow-hidden rounded-3xl border border-white/8 bg-turf-950 transition-all duration-500 hover:border-gold-400/40 hover:shadow-[0_40px_100px_-40px_rgba(212,175,55,0.3)] lg:grid-cols-2"
                  >
                    <div className="relative aspect-[16/11] overflow-hidden lg:aspect-auto">
                      <img
                        src={featured.thumbnail || fallbackImage}
                        alt={featured.title}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-turf-950/80 to-transparent lg:bg-gradient-to-r" />
                      <span className="absolute left-5 top-5 rounded-full border border-gold-400/50 bg-turf-950/70 px-3 py-1 backdrop-blur-sm">
                        <span className="eyebrow text-gold-300">Featured</span>
                      </span>
                    </div>
                    <div className="flex flex-col justify-center p-8 md:p-12">
                      <p className="eyebrow text-gold-300">
                        {featured.authorName} · {formatBlogDate(featured.createdAt)}
                      </p>
                      <h2 className="mt-4 font-display text-3xl font-medium leading-tight tracking-tight text-ivory transition-colors group-hover:text-gold-200 md:text-5xl">
                        {featured.title}
                      </h2>
                      <p className="mt-5 line-clamp-3 text-base leading-relaxed text-ivory-dim">{featured.summary}</p>
                      <span className="mt-8 inline-flex items-center gap-2.5 text-[13px] font-bold uppercase tracking-[0.16em] text-gold-300">
                        Read the story
                        <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                      </span>
                    </div>
                  </Link>
                </MotionReveal>
              ) : null}

              <MotionReveal className="mb-10 flex items-end justify-between border-b border-white/10 pb-6" y={0}>
                <div>
                  <Eyebrow tone="emerald">{search ? "Search results" : "Latest reports"}</Eyebrow>
                  <h2 className="mt-3 font-display text-2xl font-light tracking-tight md:text-3xl">
                    {search ? `Results for “${search}”` : "The archive"}
                  </h2>
                </div>
                <span className="font-data text-xs uppercase tracking-[0.2em] text-ivory-faint">
                  {String(blogs.length).padStart(2, "0")} Posts
                </span>
              </MotionReveal>

              <MotionStagger className="grid gap-6 md:grid-cols-2 xl:grid-cols-3" gap={0.1}>
                {(hasFeatured ? rest : blogs).map((blog) => (
                  <MotionStaggerItem key={blog.id}>
                    <Link
                      to={`/blogs/${blog.slug}`}
                      aria-label={`Read ${blog.title}`}
                      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/8 bg-turf-950 transition-all duration-500 hover:border-gold-400/40 hover:shadow-[0_30px_80px_-30px_rgba(0,0,0,0.8)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-400"
                    >
                      <div className="aspect-[16/10] overflow-hidden">
                        <img
                          src={blog.thumbnail || fallbackImage}
                          alt={blog.title}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      </div>
                      <div className="flex flex-1 flex-col p-6">
                        <p className="eyebrow text-gold-300">
                          {blog.authorName} · {formatBlogDate(blog.createdAt)}
                        </p>
                        <h3 className="mt-3 font-display text-2xl font-medium leading-snug text-ivory transition-colors group-hover:text-gold-200">
                          {blog.title}
                        </h3>
                        <p className="mt-3 line-clamp-2 flex-1 text-sm leading-relaxed text-ivory-dim">{blog.summary}</p>
                        <span className="mt-6 inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.16em] text-gold-300">
                          Read More
                          <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                        </span>
                      </div>
                    </Link>
                  </MotionStaggerItem>
                ))}
              </MotionStagger>

              <GoldRule className="mx-auto mt-20 w-24 opacity-30" />
            </>
          )}
        </div>
      </section>

      <ClientFooter />
    </div>
  );
}
