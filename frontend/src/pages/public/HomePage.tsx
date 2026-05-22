import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import heroImage from "../../assets/slide.jpg";

const newsImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuD3saKgDU0-ot9kioPQkTnU-C4T2VptX_iWNLBeQbVxehn21O8bD1RE9UShnD3qRvwvY14_AsQL3YyApeN3SrSP0Ebvm6nIbIv0A_fv-p2O_UWKt7PhZKQb_yY0fP_9eodHg13F0jBkZQ26xuS3PPbase_pms-XnBF-bAvTr1cxfSZtCyP1SRLXB94ddDXR3sDXxdieralZiuHP3f04FygdlJhKiub8gd3okHWLbSCfUJl56P5njmpz3WshFQU5618TcctmqF3yxNs";

const videoImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuA1uA5XCVz6vD3bPkwBy0EiwEB5XaETcul5cq540z5pCw9CkUhe5UDwzoFcT2oicJspYlTTeWI3lZ06KNlWlR_mEsz_7mmR41HgY7zqzmFXKhy7q2CCUKrt2oDIhzFHVXIfe7e5DK6jvv6oi5u_62-u4opFe3HxURO-2QFHbPP4NAqsxusVgwZqBT9P48OYk4M-LmTT1UtLMeThbn1nCYQMGYGTBfrjUP1Fu6IwobliT7FEhpivt8DQTy7d5NIs5E02OyxXP9jgIVA";

const insidePostImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuD8bCTr7YiuK6EBwGTOVrhTbXbj9E7cFX7PYNSue4cPgyWOHp4mhmHrpv2aYw_tSHoYUOz4ORTDuXvzvPphjUHR1h73iI24mxS5a2UylIrt0g96_62RjCNHqNp5cTy1u4amwjLqAMjfbaNH9XDF86N2lqyLJd0bn_1jLmu2ciCpI6N8fORVxTXKZS10RouOFM6vGh7ZW6Z0DJHiCd5eXyE2tEyfBO3fRlz5ZgFnmIiMpev4HfHJVj2nmxl60Jz_bqzrrvNlABMSl9M";

const footerImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAKO4HUqt-wNu80aMfn_39_uxO4Z9QMRKPOlu5KQo5hBo3yVIWqBUwr99T_DYuO5W794bbR0yUO_01qEyCWWP-rdR_dhf5rofMG94a3CdyXGv10K8-7aKEK6rCr1xuMW_bjjNF167qzRpHjc5N6cMP5jS0HUNz8K12uTRFNqzOovCzuKKoWi37IsxHotlUED9tHj0pzblGXhiGKH_EzUYl5f0Uk5573c80PYqgyCqDjhE6Hh-zcVfcbFUBl3JtTgA1CCVwyB7HcTrU";
 
const primaryNav = ["Racing", "Wagering", "Expert Picks", "News", "Visit", "Official Store"];

const quickLinks = [
  {
    label: "Entries",
    path: "M12 2L1 21h22L12 2zm0 3.99L19.53 19H4.47L12 5.99z",
  },
  {
    label: "Results",
    path: "M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10H7v-2h10v2z",
  },
  {
    label: "Scratches & Changes",
    path: "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z",
  },
  {
    label: "Stream Live",
    path: "M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h5v2h8v-2h5c1.1 0 1.99-.9 1.99-2L23 5c0-1.1-.9-2-2-2zm0 14H3V5h18v12z",
  },
  {
    label: "Expert Picks",
    path: "M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z",
  },
  {
    label: "Horsemen",
    path: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z",
  },
];

const news = [
  {
    category: "Stakes Advance",
    title: "Intricate Spirit returns to familiar site in $150K Paradise Creek",
    author: "Christian Abdo",
    date: "May 19 2026",
  },
  {
    category: "Notes",
    title: "HOTY Sovereignty leads busy Saturday work tab at Saratoga",
    author: "NYRA Communications",
    date: "May 16 2026",
  },
  {
    category: "Headlines",
    title: "Pick 6 carryover of $14K on Saturday at Belmont at the Big A",
    author: "Robert Hines",
    date: "May 15 2026",
  },
];

const socialLinks = ["Instagram", "X", "Facebook", "TikTok", "YouTube"];

function SocialIcon({ label }: { label: string }) {
  const iconText = label === "Instagram" ? "◎" : label === "YouTube" ? "▶" : label[0];

  return (
    <a
      aria-label={label}
      className="flex h-8 min-w-8 items-center justify-center text-xl font-black text-white transition hover:opacity-70"
      href="#"
    >
      {iconText}
    </a>
  );
}

export function HomePage() {
  useDocumentTitle("Aqueduct Racetrack | Thoroughbred Horse Racing in NYC");

  return (
    <div className="bg-white font-sans text-gray-900">
      <header
        aria-label="Aqueduct site header"
        className="bg-black text-xs uppercase tracking-widest text-white"
        role="banner"
      >
        <div className="container mx-auto flex h-12 items-center justify-between px-4">
          <nav className="flex items-center space-x-6" data-purpose="site-navigation" aria-label="Track sites">
            <a className="flex items-center space-x-2" href="#" aria-label="Belmont at the Big A">
              <img alt="" className="h-6 invert" src="../../assets/logo.png" />
            </a>
            <div className="flex space-x-4">
              <a className="bg-nyraLightGreen px-4 py-3 font-bold" href="#">
                Aqueduct
              </a>
              <a className="py-3 opacity-70 hover:opacity-100" href="#">
                Belmont Park
              </a>
              <a className="py-3 opacity-70 hover:opacity-100" href="#">
                Saratoga
              </a>
              <a className="py-3 opacity-70 hover:opacity-100" href="#">
                Belmont Stakes
              </a>
            </div>
          </nav>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold italic tracking-normal">
                NYRA <span className="text-nyraGold">BETS</span>
              </span>
              <a className="font-bold text-lime-400" href="#">
                BET NOW
              </a>
            </div>
            <a className="opacity-80 hover:opacity-100" href="#">
              Log In
            </a>
          </div>
        </div>
      </header>

      <nav className="sticky top-0 z-50 bg-nyraGreen text-white shadow-md" data-purpose="main-nav" aria-label="Primary">
        <div className="container mx-auto px-4">
          <div className="flex h-14 items-center justify-between">
            <div className="flex items-center space-x-8 text-sm font-bold">
              <span className="text-white">Racing returns May 22</span>
              <div className="hidden space-x-6 uppercase tracking-wider md:flex">
                {primaryNav.map((item) => (
                  <a className="hover:text-gray-300" href="#" key={item}>
                    {item}
                  </a>
                ))}
              </div>
            </div>
            <div className="flex space-x-4">
              {socialLinks.map((label) => (
                <SocialIcon label={label} key={label} />
              ))}
            </div>
          </div>
        </div>
      </nav>

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
                href="#"
              >
                View Calendar
              </a>
              <a
                className="flex items-center border-b-2 border-transparent px-4 py-4 text-sm font-bold uppercase tracking-widest transition hover:border-white"
                href="#"
              >
                View Stakes <span className="ml-2">&rarr;</span>
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
              <a className="group" href="#" key={item.label}>
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

      <section className="bg-white py-16" data-purpose="latest-news">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex items-end justify-between">
            <h2 className="text-4xl font-black uppercase tracking-tight text-nyraDark">Latest Aqueduct News</h2>
            <a className="flex items-center text-sm font-bold uppercase tracking-widest text-nyraGreen hover:underline" href="#">
              More NYRA News <span className="ml-2">&rarr;</span>
            </a>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {news.map((article) => (
              <article className="group" key={article.title}>
                <div className="mb-4 aspect-video overflow-hidden">
                  <img
                    alt={article.title}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    src={newsImage}
                  />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-nyraGreen">{article.category}</span>
                <h3 className="mt-2 text-2xl font-bold leading-tight transition group-hover:text-nyraGreen">
                  {article.title}
                </h3>
                <div className="mt-4 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                  <span>{article.author}</span> <span className="mx-2">&bull;</span> <span>{article.date}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-nyraDark py-20 text-white" data-purpose="preakness-preview">
        <div className="container mx-auto flex flex-col items-center px-4 md:flex-row">
          <div className="mb-12 md:mb-0 md:w-1/2 md:pr-12">
            <h2 className="mb-6 text-5xl font-black uppercase tracking-tight">2026 Preakness Preview</h2>
            <p className="mb-8 max-w-lg text-xl leading-relaxed text-gray-300">
              Expert handicappers from NYRA Bets provide analysis and picks for the Saturday's Preakness Stakes.
            </p>
            <a className="flex items-center font-bold uppercase tracking-widest text-lime-400 hover:underline" href="#">
              Get Preakness Bonus <span className="ml-2">&rarr;</span>
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
                Subscribe to The Inside Post for the latest ticket alerts, racing updates, and event info sent directly
                to your inbox.
              </p>
              <a
                className="inline-block rounded-sm bg-white px-10 py-4 font-bold uppercase tracking-widest text-nyraGreen transition hover:bg-gray-100"
                href="#"
              >
                Subscribe Now
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
              NYRA<span className="ml-2 text-2xl">BETS</span>
            </p>
            <h2 className="max-w-xl text-5xl font-black uppercase leading-tight tracking-tight">
              Bet any track. Anywhere. Any time.
            </h2>
            <p className="mt-8 max-w-md text-xl leading-relaxed text-gray-300">
              The best of horse racing from around the world. Make deposits quickly, watch your horses live in the
              paddock, and easily place your bet before watching your race in HD.
            </p>
          </div>
          <div>
            <div className="mb-8 flex justify-end gap-5">
              <a className="rounded-md border-2 border-lime-400 px-8 py-4 font-bold text-lime-400" href="#">
                Expert Picks
              </a>
              <a className="rounded-md bg-lime-400 px-8 py-4 font-bold text-black" href="#">
                Bet Now
              </a>
            </div>
            <div className="bg-nyraDark p-12">
              <h3 className="text-4xl font-black uppercase">Sign Up Bonus</h3>
              <p className="mt-2 text-xl font-bold text-lime-400">$25 Free Bet</p>
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
                  <a className="block transition hover:text-nyraGreen" href="#" key={item}>
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
              Gambling Problems? The New York Racing Association encourages responsible wagering. If gambling is a
              problem for you or someone you care about, help is available 24 hours a day. Call toll-free 1-877-8-HOPE-NY.
            </div>
            <div className="flex flex-wrap justify-center gap-6">
              {["Accessibility", "Do Not Sell My Information", "Responsible Gambling", "Privacy", "Ethics", "Terms & Conditions"].map(
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
