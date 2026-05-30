import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { blogApi } from "../../api/blogApi";
import heroImage from "../../assets/slide.jpg";
import { ClientHeader } from "../../components/client/ClientHeader";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import type { Blog } from "../../types/blog";

const fallbackImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuD3saKgDU0-ot9kioPQkTnU-C4T2VptX_iWNLBeQbVxehn21O8bD1RE9UShnD3qRvwvY14_AsQL3YyApeN3SrSP0Ebvm6nIbIv0A_fv-p2O_UWKt7PhZKQb_yY0fP_9eodHg13F0jBkZQ26xuS3PPbase_pms-XnBF-bAvTr1cxfSZtCyP1SRLXB94ddDXR3sDXxdieralZiuHP3f04FygdlJhKiub8gd3okHWLbSCfUJl56P5njmpz3WshFQU5618TcctmqF3yxNs";

function formatBlogDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function SpectatorBlogListPage() {
  useDocumentTitle("Tournament blog");
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadBlogs() {
      setLoading(true);
      setError(null);

      try {
        const data = await blogApi.getPublishedBlogs(search);
        if (isMounted) {
          setBlogs(Array.isArray(data.content) ? data.content : []);
        }
      } catch (err) {
        console.error("Public blog list unavailable.", err);
        if (isMounted) {
          setBlogs([]);
          setError("Could not load published blog posts.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadBlogs();

    return () => {
      isMounted = false;
    };
  }, [search]);

  return (
    <div className="min-h-screen bg-white font-sans text-nyraDark">
      <ClientHeader />

      <section className="relative overflow-hidden bg-nyraDark text-white" aria-labelledby="public-blog-title">
        <img alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover opacity-35" src={heroImage} />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-nyraGreen/50" />
        <div className="container relative mx-auto px-4 py-16 md:py-24">
          <p className="border-l-4 border-nyraGold pl-4 text-xs font-black uppercase tracking-[0.24em] text-nyraGold">
            Tournament newsroom
          </p>
          <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_360px] lg:items-end">
            <div>
              <h1 id="public-blog-title" className="max-w-4xl text-5xl font-black uppercase leading-none tracking-tight md:text-7xl">
                Latest Tournament Updates & Blogs
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-white/80">
                Read published race previews, spectator guides, and operations updates from the tournament team.
              </p>
            </div>
            <div className="border-t-4 border-nyraGold bg-white p-6 text-nyraDark shadow-2xl">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-nyraGreen">Public archive</p>
              <p className="mt-3 text-4xl font-black tracking-tight">{blogs.length}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-widest text-slate-500">Published posts shown</p>
            </div>
          </div>
        </div>
      </section>

      <main>
        <section className="border-b border-slate-200 bg-white" aria-label="Blog search">
          <div className="container mx-auto flex flex-col gap-4 px-4 py-8 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-nyraGreen">Find a story</p>
              <p className="mt-1 text-sm font-bold text-slate-500">Search by blog title.</p>
            </div>
            <div className="w-full md:w-[420px]">
              <label className="sr-only" htmlFor="public-blog-search">
                Search blog posts
              </label>
              <input
                className="min-h-12 w-full border-2 border-slate-300 bg-white px-4 text-base font-bold text-nyraDark outline-none transition focus:border-nyraGreen focus:ring-2 focus:ring-nyraGreen/20"
                id="public-blog-search"
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search blog posts..."
                type="search"
                value={search}
              />
            </div>
          </div>
        </section>

        <section className="bg-[#f6f7f6] py-12 md:py-16" aria-labelledby="blog-results-title">
          <div className="container mx-auto px-4">
            <div className="mb-8 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-nyraGreen">Latest reports</p>
                <h2 id="blog-results-title" className="mt-2 text-4xl font-black uppercase tracking-tight text-nyraDark">
                  Blog archive
                </h2>
              </div>
              <Link
                className="inline-flex min-h-11 items-center text-sm font-black uppercase tracking-widest text-nyraGreen hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-nyraGreen"
                to="/"
              >
                Back to home <span className="ml-2">&rarr;</span>
              </Link>
            </div>

            {error ? (
              <div className="border-l-4 border-nyraRed bg-red-50 p-5 text-sm font-bold text-red-700" role="alert">
                {error}
              </div>
            ) : loading ? (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3" aria-label="Loading blog posts">
                {[0, 1, 2].map((item) => (
                  <div className="animate-pulse border border-slate-200 bg-white shadow-sm" key={item}>
                    <div className="aspect-[16/10] bg-slate-200" />
                    <div className="space-y-4 p-6">
                      <div className="h-3 w-32 bg-slate-200" />
                      <div className="h-8 w-full bg-slate-200" />
                      <div className="h-8 w-3/4 bg-slate-200" />
                      <div className="h-4 w-full bg-slate-200" />
                    </div>
                  </div>
                ))}
              </div>
            ) : blogs.length === 0 ? (
              <div className="border-l-4 border-nyraGreen bg-white p-8 shadow-sm">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-nyraGreen">No posts found</p>
                <p className="mt-3 max-w-2xl text-3xl font-black uppercase tracking-tight text-nyraDark">
                  No published blog posts match this search.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {blogs.map((blog) => (
                  <article
                    className="group flex min-h-[460px] flex-col overflow-hidden border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-nyraGreen hover:shadow-xl motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                    key={blog.id}
                  >
                    <Link
                      className="block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-nyraGreen"
                      to={`/blogs/${blog.slug}`}
                    >
                      <div className="aspect-[16/10] overflow-hidden bg-slate-200">
                        <img
                          alt={blog.title}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                          loading="lazy"
                          src={blog.thumbnail || fallbackImage}
                        />
                      </div>
                    </Link>
                    <div className="flex flex-1 flex-col p-6">
                      <div className="text-[10px] font-black uppercase tracking-widest text-nyraGreen">
                        {blog.authorName} <span className="mx-2">&bull;</span> {formatBlogDate(blog.createdAt)}
                      </div>
                      <h3 className="mt-3 text-3xl font-black leading-tight tracking-tight text-nyraDark transition group-hover:text-nyraGreen">
                        {blog.title}
                      </h3>
                      <p className="mt-4 line-clamp-3 flex-1 text-base leading-7 text-slate-600">{blog.summary}</p>
                      <Link
                        aria-label={`Read ${blog.title}`}
                        className="mt-7 inline-flex min-h-11 items-center text-sm font-black uppercase tracking-widest text-nyraGreen hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-nyraGreen"
                        to={`/blogs/${blog.slug}`}
                      >
                        Read More <span className="ml-2">&rarr;</span>
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-nyraDark py-10 text-white">
        <div className="container mx-auto flex flex-col gap-3 px-4 md:flex-row md:items-center md:justify-between">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-nyraGold">Horse Racing Tournament</p>
          <p className="max-w-xl text-sm text-white/65">
            Published posts are curated by tournament administrators for spectators and members.
          </p>
        </div>
      </footer>
    </div>
  );
}
