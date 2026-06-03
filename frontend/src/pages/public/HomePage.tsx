import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { blogApi } from "../../api/blogApi";
import { ClientHeader } from "../../components/client/ClientHeader";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import type { Blog } from "../../types/blog";
import heroImage from "../../assets/slide.jpg";

const newsImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuD3saKgDU0-ot9kioPQkTnU-C4T2VptX_iWNLBeQbVxehn21O8bD1RE9UShnD3qRvwvY14_AsQL3YyApeN3SrSP0Ebvm6nIbIv0A_fv-p2O_UWKt7PhZKQb_yY0fP_9eodHg13F0jBkZQ26xuS3PPbase_pms-XnBF-bAvTr1cxfSZtCyP1SRLXB94ddDXR3sDXxdieralZiuHP3f04FygdlJhKiub8gd3okHWLbSCfUJl56P5njmpz3WshFQU5618TcctmqF3yxNs";

const videoImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuA1uA5XCVz6vD3bPkwBy0EiwEB5XaETcul5cq540z5pCw9CkUhe5UDwzoFcT2oicJspYlTTeWI3lZ06KNlWlR_mEsz_7mmR41HgY7zqzmFXKhy7q2CCUKrt2oDIhzFHVXIfe7e5DK6jvv6oi5u_62-u4opFe3HxURO-2QFHbPP4NAqsxusVgwZqBT9P48OYk4M-LmTT1UtLMeThbn1nCYQMGYGTBfrjUP1Fu6IwobliT7FEhpivt8DQTy7d5NIs5E02OyxXP9jgIVA";

const insidePostImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuD8bCTr7YiuK6EBwGTOVrhTbXbj9E7cFX7PYNSue4cPgyWOHp4mhmHrpv2aYw_tSHoYUOz4ORTDuXvzvPphjUHR1h73iI24mxS5a2UylIrt0g96_62RjCNHqNp5cTy1u4amwjLqAMjfbaNH9XDF86N2lqyLJd0bn_1jLmu2ciCpI6N8fORVxTXKZS10RouOFM6vGh7ZW6Z0DJHiCd5eXyE2tEyfBO3fRlz5ZgFnmIiMpev4HfHJVj2nmxl60Jz_bqzrrvNlABMSl9M";

const footerImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAKO4HUqt-wNu80aMfn_39_uxO4Z9QMRKPOlu5KQo5hBo3yVIWqBUwr99T_DYuO5W794bbR0yUO_01qEyCWWP-rdR_dhf5rofMG94a3CdyXGv10K8-7aKEK6rCr1xuMW_bjjNF167qzRpHjc5N6cMP5jS0HUNz8K12uTRFNqzOovCzuKKoWi37IsxHotlUED9tHj0pzblGXhiGKH_EzUYl5f0Uk5573c80PYqgyCqDjhE6Hh-zcVfcbFUBl3JtTgA1CCVwyB7HcTrU";

const quickLinks = [
  {
    label: "Tournaments",
    href: "#tournaments",
    path: "M12 2L1 21h22L12 2zm0 3.99L19.53 19H4.47L12 5.99z",
  },
  {
    label: "Results",
    href: "#results",
    path: "M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10H7v-2h10v2z",
  },
  {
    label: "Blog Posts",
    href: "/blogs",
    path: "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z",
  },
  {
    label: "My Profile",
    href: "/profile",
    path: "M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h5v2h8v-2h5c1.1 0 1.99-.9 1.99-2L23 5c0-1.1-.9-2-2-2zm0 14H3V5h18v12z",
  },
  {
    label: "Join Us",
    href: "/join-us",
    path: "M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z",
  },
  {
    label: "Spectator Dashboard",
    href: "/spectator",
    path: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z",
  },
];

const socialLinks = ["Instagram", "X", "Facebook", "TikTok", "YouTube"];

const socialIcons: Record<string, React.ReactNode> = {
  Instagram: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
      <path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2Zm0 1.5A4.25 4.25 0 0 0 3.5 7.75v8.5A4.25 4.25 0 0 0 7.75 20.5h8.5A4.25 4.25 0 0 0 20.5 16.25v-8.5A4.25 4.25 0 0 0 16.25 3.5h-8.5ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 1.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Zm5.25-2.5a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z" />
    </svg>
  ),
  X: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
    </svg>
  ),
  Facebook: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
      <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12Z" />
    </svg>
  ),
  TikTok: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
      <path d="M16.6 5.82s.51.5 0 0A4.278 4.278 0 0 1 15.54 3h-3.09v12.4a2.592 2.592 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.24-1.48Z" />
    </svg>
  ),
  YouTube: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814ZM9.545 15.568V8.432L15.818 12l-6.273 3.568Z" />
    </svg>
  ),
};

function SocialIcon({ label }: { label: string }) {
  return (
    <a
      aria-label={label}
      className="flex h-8 min-w-8 items-center justify-center text-white transition hover:opacity-70"
      href="#"
    >
      {socialIcons[label]}
    </a>
  );
}

function formatBlogDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function HomePage() {
  useDocumentTitle("Aqueduct Racetrack | Thoroughbred Horse Racing in NYC");
  const [latestBlogs, setLatestBlogs] = useState<Blog[]>([]);
  const [blogsLoading, setBlogsLoading] = useState(true);
  const [blogsError, setBlogsError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadLatestBlogs() {
      setBlogsLoading(true);
      setBlogsError(null);

      try {
        const data = await blogApi.getPublishedBlogs(undefined, 0, 3);
        if (isMounted) {
          setLatestBlogs(Array.isArray(data.content) ? data.content : []);
        }
      } catch (err) {
        console.error("Public blog preview unavailable.", err);
        if (isMounted) {
          setLatestBlogs([]);
          setBlogsError("Could not load published blog posts.");
        }
      } finally {
        if (isMounted) {
          setBlogsLoading(false);
        }
      }
    }

    loadLatestBlogs();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="bg-white font-sans text-gray-900">
      <ClientHeader />

      <section className="relative h-[600px] overflow-hidden" data-purpose="hero-carousel">
        <img alt="Horses racing at Aqueduct" className="absolute inset-0 h-full w-full object-cover" src={heroImage} />
        <div className="hero-gradient absolute inset-0" />
        <div className="container relative mx-auto flex h-full items-center px-4">
          <div className="max-w-2xl text-white">
            <h1 className="text-shadow mb-4 text-6xl font-black uppercase tracking-tighter">Aqueduct Racetrack</h1>
            <p className="text-shadow mb-8 text-xl font-light">
              Live racing weekly at Aqueduct through June 2026.
            </p>
            <div className="flex space-x-4">
              <a
                className="rounded-sm bg-nyraLightGreen px-8 py-4 text-sm font-bold uppercase tracking-widest transition hover:bg-nyraGreen"
                href="#tournaments"
              >
                View Tournaments
              </a>
              <a
                className="flex items-center border-b-2 border-transparent px-4 py-4 text-sm font-bold uppercase tracking-widest transition hover:border-white"
                href="/join-us"
              >
                Join Us <span className="ml-2">&rarr;</span>
              </a>
            </div>
          </div>

          <div className="absolute bottom-24 right-4 hidden w-1/3 border-l-4 border-nyraLightGreen bg-black/40 p-4 backdrop-blur-sm lg:block">
            <img alt="Farewell Aqueduct" className="mb-4 h-auto w-full" src={heroImage} />
            <div className="text-white">
              <h3 className="text-2xl font-black uppercase italic tracking-tight">It was a good run</h3>
              <p className="mt-1 text-xs uppercase tracking-widest">Giveaways, Souvenirs, Live Entertainment and more</p>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 w-full border-t border-white/10 bg-nyraDark/90 py-6 text-white">
          <div className="container mx-auto grid grid-cols-3 divide-x divide-white/20 px-4 text-center">
            <div>
              <h4 className="text-xl font-bold uppercase">Live Racing in NYC</h4>
              <p className="mt-1 text-xs uppercase tracking-widest text-gray-400">Through June 2026</p>
            </div>
            <div>
              <h4 className="text-xl font-bold uppercase">Visit Aqueduct</h4>
              <p className="mt-1 text-xs uppercase tracking-widest text-gray-400">Free Admission</p>
            </div>
            <div>
              <h4 className="text-xl font-bold uppercase">Watch on FOX Sports</h4>
              <p className="mt-1 text-xs uppercase tracking-widest text-gray-400">America's Day at the Races</p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-nyraGreen py-8" data-purpose="quick-links">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-3 gap-4 text-center text-white md:grid-cols-6">
            {quickLinks.map((item) => (
              <a className="group" href={item.href} key={item.label}>
                <div className="mb-2 flex justify-center">
                  <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d={item.path} />
                  </svg>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest">{item.label}</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="sr-only" id="tournaments" aria-labelledby="tournaments-title">
        <h2 id="tournaments-title">Tournaments</h2>
      </section>

      <section className="sr-only" id="results" aria-labelledby="results-title">
        <h2 id="results-title">Results</h2>
      </section>

      <section className="bg-white py-16" data-purpose="latest-news" id="blog">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex items-end justify-between">
            <h2 className="text-4xl font-black uppercase tracking-tight text-nyraDark">Latest Tournament Blog</h2>
            <Link className="flex items-center text-sm font-bold uppercase tracking-widest text-nyraGreen hover:underline" to="/blogs">
              More Blog Posts <span className="ml-2">&rarr;</span>
            </Link>
          </div>
          {blogsLoading ? (
            <div className="grid gap-8 md:grid-cols-3" aria-label="Loading latest blog posts">
              {[0, 1, 2].map((item) => (
                <div className="animate-pulse" key={item}>
                  <div className="mb-4 aspect-video bg-gray-200" />
                  <div className="h-3 w-28 bg-gray-200" />
                  <div className="mt-3 h-7 w-11/12 bg-gray-200" />
                  <div className="mt-2 h-7 w-8/12 bg-gray-200" />
                </div>
              ))}
            </div>
          ) : blogsError ? (
            <div className="border-l-4 border-red-500 bg-red-50 p-5 text-sm font-bold text-red-700">
              {blogsError}
            </div>
          ) : latestBlogs.length === 0 ? (
            <div className="border-l-4 border-nyraGreen bg-gray-50 p-5 text-sm font-bold text-gray-700">
              No published blog posts are available yet.
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-3">
              {latestBlogs.map((article) => (
                <article className="group" key={article.id}>
                  <Link aria-label={`Read ${article.title}`} to={`/blogs/${article.slug}`}>
                    <div className="mb-4 aspect-video overflow-hidden bg-gray-100">
                      <img
                        alt={article.title}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        src={article.thumbnail || newsImage}
                      />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest text-nyraGreen">Tournament Blog</span>
                    <h3 className="mt-2 text-2xl font-bold leading-tight transition group-hover:text-nyraGreen">
                      {article.title}
                    </h3>
                  </Link>
                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-gray-600">{article.summary}</p>
                  <div className="mt-4 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                    <span>{article.authorName}</span> <span className="mx-2">&bull;</span>{" "}
                    <span>{formatBlogDate(article.createdAt)}</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="bg-nyraDark py-20 text-white" data-purpose="preakness-preview">
        <div className="container mx-auto flex flex-col items-center px-4 md:flex-row">
          <div className="mb-12 md:mb-0 md:w-1/2 md:pr-12">
            <h2 className="mb-6 text-5xl font-black uppercase tracking-tight">2026 Preakness Preview</h2>
            <p className="mb-8 max-w-lg text-xl leading-relaxed text-gray-300">
              Explore how to join owner, jockey, or referee workflows before submitting your specialist role
              application.
            </p>
            <a className="flex items-center font-bold uppercase tracking-widest text-lime-400 hover:underline" href="/join-us">
              Join With Us <span className="ml-2">&rarr;</span>
            </a>
          </div>
          <div className="group relative cursor-pointer md:w-1/2">
            <img alt="Preakness Video Preview" className="w-full rounded shadow-2xl" src={videoImage} />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-600 transition group-hover:scale-110">
                <svg className="h-10 w-10 fill-current text-white" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#222] py-16 text-white" data-purpose="newsletter-signup">
        <div className="container mx-auto px-4">
          <div className="grid gap-16 md:grid-cols-2">
            <div className="space-y-8">
              <img alt="The Inside Post" className="h-24" src={insidePostImage} />
              <p className="text-xl text-gray-400">
                Create an account to receive tournament updates, role request status changes, and future point reward
                notifications.
              </p>
              <a
                className="inline-block rounded-sm bg-white px-10 py-4 font-bold uppercase tracking-widest text-nyraGreen transition hover:bg-gray-100"
                href="/register"
              >
                Sign Up Now
              </a>
            </div>
            <div>
              <h2 className="mb-12 text-4xl font-black uppercase">Follow Us</h2>
              <div className="flex space-x-8">
                {socialLinks.map((label) => (
                  <SocialIcon label={label} key={label} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-black py-20 text-white" data-purpose="nyra-bets-promo">
        <div className="container mx-auto grid items-center gap-12 px-4 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <p className="mb-12 text-5xl font-black uppercase tracking-tight">
              Free<span className="ml-2 text-2xl">Points</span>
            </p>
            <h2 className="max-w-xl text-5xl font-black uppercase leading-tight tracking-tight">
              Sign up for free points.
            </h2>
            <p className="mt-8 max-w-md text-xl leading-relaxed text-gray-300">
              Create an account, complete your profile, and start earning virtual tournament points from approved
              activities like reading blogs and joining race prediction features.
            </p>
          </div>
          <div>
            <div className="mb-8 flex justify-end gap-5">
              <a className="rounded-md border-2 border-lime-400 px-8 py-4 font-bold text-lime-400" href="/blogs">
                Read Blog
              </a>
              <a className="rounded-md bg-lime-400 px-8 py-4 font-bold text-black" href="/register">
                Create Account
              </a>
            </div>
            <div className="bg-nyraDark p-12">
              <h3 className="text-4xl font-black uppercase">Starter Points</h3>
              <p className="mt-2 text-xl font-bold text-lime-400">Free virtual points for new members</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-nyraDark py-16 text-white" data-purpose="main-footer">
        <div className="container mx-auto px-4">
          <div className="mb-16 grid gap-12 md:grid-cols-4">
            <div>
              <img alt="NYRA Logo" className="mb-8 h-24" src={footerImage} />
              <div className="space-y-4 text-sm font-bold uppercase tracking-widest">
                {["Contact NYRA", "Live Chat", "Sponsor with NYRA", "About NYRA", "Careers"].map((item) => (
                  <a className="block transition hover:text-nyraGreen" href={item === "Careers" ? "/join-us" : "#"} key={item}>
                    {item}
                  </a>
                ))}
              </div>
            </div>
            <div className="col-span-2 flex items-center justify-center" />
            <div className="flex flex-col items-end justify-start">
              <img alt="Fox Sports" className="mb-8 h-16" src={footerImage} />
            </div>
          </div>

          <div className="flex flex-col items-center justify-between space-y-6 border-t border-white/10 pt-12 text-center text-[10px] font-bold uppercase tracking-widest text-gray-500 md:flex-row md:space-y-0">
            <div className="max-w-xl text-left normal-case">
              Tournament points are virtual in-system rewards only. They cannot be deposited, withdrawn, sold, or
              converted into money.
            </div>
            <div className="flex flex-wrap justify-center gap-6">
              {["Accessibility", "Point Rules", "Privacy", "Ethics", "Terms & Conditions"].map(
                (item) => (
                  <a className="hover:text-white" href="#" key={item}>
                    {item}
                  </a>
                ),
              )}
            </div>
          </div>
          <div className="mt-8 text-center text-[10px] text-gray-600">
            &copy; 2026 The New York Racing Association, Inc. All Rights Reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
