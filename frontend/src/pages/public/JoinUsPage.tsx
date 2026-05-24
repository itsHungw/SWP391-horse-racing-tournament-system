import { ClientHeader } from "../../components/client/ClientHeader";
import { useClientSession } from "../../hooks/useClientSession";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import heroImage from "../../assets/slide.jpg";

const roles = [
  {
    title: "Jockey",
    eyebrow: "Race participation",
    description:
      "Apply as a verified jockey profile for race-day participation, tournament lineups, and future performance tracking.",
    requirements: ["Complete personal profile", "Submit riding background", "Wait for admin review"],
  },
  {
    title: "Owner",
    eyebrow: "Stable operations",
    description:
      "Join as an owner to manage tournament participation requests and prepare future horse ownership workflows.",
    requirements: ["Verified account email", "Owner intent statement", "Profile contact details"],
  },
  {
    title: "Referee",
    eyebrow: "Tournament integrity",
    description:
      "Support fair tournament operations through referee access, race oversight, and structured review workflows.",
    requirements: ["Operational experience", "Clear review reason", "Admin approval required"],
  },
];

const applicationSteps = [
  "Create an account",
  "Complete your profile",
  "Choose a role",
  "Admin review",
];

export function JoinUsPage() {
  useDocumentTitle("We Are Hiring | Horse Racing Tournament");

  const { isAuthenticated } = useClientSession();
  const primaryCtaHref = isAuthenticated ? "/my-role-requests" : "/register";
  const primaryCtaLabel = isAuthenticated ? "Start Application" : "Create Account";

  return (
    <div className="bg-white font-sans text-[#171717]">
      <ClientHeader />

      <section className="relative min-h-[560px] overflow-hidden bg-nyraDark text-white">
        <img
          alt="Thoroughbred horses racing on the turf"
          className="absolute inset-0 h-full w-full object-cover"
          src={heroImage}
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.88)_0%,rgba(0,0,0,0.68)_42%,rgba(0,0,0,0.18)_100%)]" />
        <div className="relative mx-auto flex min-h-[560px] max-w-[1536px] items-center px-6 py-20 md:px-11">
          <div className="max-w-3xl">
            <p className="mb-5 inline-flex border-b-2 border-nyraGold pb-2 text-xs font-black uppercase tracking-[0.22em] text-nyraGold">
              Tournament operations
            </p>
            <h1 className="text-5xl font-black uppercase leading-[0.95] tracking-tight text-white sm:text-6xl lg:text-7xl">
              We Are Hiring
            </h1>
            <p className="mt-6 max-w-2xl text-xl font-bold leading-8 text-white/88">
              Join the racing tournament ecosystem as a jockey, owner, or referee. Build your profile, apply for a
              specialist role, and let the operations team review your application.
            </p>
            <div className="mt-9 flex flex-col gap-4 sm:flex-row">
              <a
                className="inline-flex min-h-12 items-center justify-center rounded-sm bg-lime-400 px-8 py-4 text-sm font-black uppercase tracking-widest text-black shadow-[0_18px_40px_rgba(163,255,28,0.24)] transition hover:bg-[#b7ff4a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                href={primaryCtaHref}
              >
                {primaryCtaLabel}
              </a>
              <a
                className="inline-flex min-h-12 items-center justify-center border-b-2 border-white px-4 py-4 text-sm font-black uppercase tracking-widest text-white transition hover:border-lime-400 hover:text-lime-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                href="#application-flow"
              >
                View Application Flow
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white py-14">
        <div className="mx-auto grid max-w-[1536px] gap-5 px-6 md:px-11 lg:grid-cols-3">
          {[
            ["3", "Specialist roles"],
            ["4", "Application steps"],
            ["24h", "Email verification support"],
          ].map(([value, label]) => (
            <div className="border-l-4 border-nyraGreen bg-slate-50 px-6 py-5" key={label}>
              <p className="text-4xl font-black uppercase tracking-tight text-nyraGreen">{value}</p>
              <p className="mt-1 text-xs font-black uppercase tracking-[0.18em] text-slate-500">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white py-20" aria-labelledby="open-roles-title">
        <div className="mx-auto max-w-[1536px] px-6 md:px-11">
          <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-nyraGreen">Open applications</p>
              <h2 id="open-roles-title" className="mt-3 text-4xl font-black uppercase tracking-tight text-nyraDark">
                Choose Your Track
              </h2>
            </div>
            <p className="max-w-xl text-lg font-bold leading-7 text-slate-600">
              Each role starts with the same clean application path, so frontend and backend can keep one review queue.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {roles.map((role) => (
              <article
                className="group flex min-h-[360px] flex-col justify-between border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:border-nyraGreen hover:shadow-xl"
                key={role.title}
              >
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-nyraGreen">{role.eyebrow}</p>
                  <h3 className="mt-4 text-4xl font-black uppercase tracking-tight text-[#171717]">{role.title}</h3>
                  <p className="mt-5 text-base font-bold leading-7 text-slate-600">{role.description}</p>
                  <ul className="mt-6 space-y-3">
                    {role.requirements.map((item) => (
                      <li className="flex gap-3 text-sm font-bold text-slate-700" key={item}>
                        <span
                          aria-hidden="true"
                          className="mt-1 h-4 w-4 shrink-0 rounded-full border-4 border-nyraGreen"
                        />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <a
                  className="mt-8 inline-flex min-h-12 items-center justify-center rounded-sm bg-nyraDark px-5 py-3 text-sm font-black uppercase tracking-widest text-white transition group-hover:bg-nyraGreen focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-nyraGreen"
                  href={primaryCtaHref}
                >
                  Apply for {role.title}
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="application-flow" className="bg-nyraDark py-20 text-white" aria-labelledby="application-flow-title">
        <div className="mx-auto grid max-w-[1536px] gap-10 px-6 md:px-11 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-lime-400">Application flow</p>
            <h2 id="application-flow-title" className="mt-3 text-4xl font-black uppercase tracking-tight">
              From Account To Review
            </h2>
            <p className="mt-5 text-lg font-bold leading-8 text-white/70">
              This page is the commercial front door. The actual submission still happens in the existing role request
              workflow, so the backend scope stays focused.
            </p>
          </div>

          <ol className="grid gap-4 md:grid-cols-4">
            {applicationSteps.map((step, index) => (
              <li className="border-t-4 border-lime-400 bg-white p-5 text-nyraDark" key={step}>
                <p className="text-4xl font-black">{String(index + 1).padStart(2, "0")}</p>
                <p className="mt-10 text-sm font-black uppercase tracking-widest">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-black py-20 text-white">
        <div className="mx-auto flex max-w-[1536px] flex-col justify-between gap-8 px-6 md:px-11 lg:flex-row lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-lime-400">Ready for the paddock?</p>
            <h2 className="mt-3 max-w-3xl text-4xl font-black uppercase leading-tight tracking-tight">
              Put your profile in front of the operations team.
            </h2>
          </div>
          <a
            className="inline-flex min-h-12 items-center justify-center rounded-sm bg-lime-400 px-8 py-4 text-sm font-black uppercase tracking-widest text-black transition hover:bg-[#b7ff4a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            href={primaryCtaHref}
          >
            {primaryCtaLabel}
          </a>
        </div>
      </section>
    </div>
  );
}
