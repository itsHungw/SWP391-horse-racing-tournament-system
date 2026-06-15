import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { createOrganizerTournament } from "../../api/racingApi";
import { ClientFooter } from "../../components/client/ClientFooter";
import { ClientHeader } from "../../components/client/ClientHeader";
import { Eyebrow, GoldRule } from "../../components/client/primitives";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { getApiErrorMessage } from "../../utils/apiError";
import { getTournamentDateValidationError } from "../../utils/tournamentDateValidation";

const inputClass =
  "mt-2 w-full border border-white/15 bg-turf-950 px-4 py-3 text-sm text-ivory outline-none transition-colors placeholder:text-ivory-faint focus:border-gold-400/70 disabled:cursor-not-allowed disabled:opacity-50";

const labelClass = "eyebrow block text-gold-300";

export function OrganizerTournamentFormPage() {
  useDocumentTitle("Create Tournament | Organizer");
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    code: "",
    location: "",
    description: "",
    startDate: "",
    endDate: "",
    registrationStartAt: "",
    registrationEndAt: "",
    maxHorses: "",
    maxHorsesPerOwner: "2",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof typeof form) => (value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.name || !form.code || !form.location || !form.startDate || !form.endDate || !form.registrationStartAt || !form.registrationEndAt) {
      setError("Please fill in all required fields.");
      return;
    }
    const dateError = getTournamentDateValidationError(form);
    if (dateError) {
      setError(dateError);
      return;
    }
    try {
      setError(null);
      setSubmitting(true);
      await createOrganizerTournament({
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        location: form.location.trim(),
        description: form.description.trim() || undefined,
        startDate: form.startDate,
        endDate: form.endDate,
        registrationStartAt: form.registrationStartAt,
        registrationEndAt: form.registrationEndAt,
        maxHorses: form.maxHorses ? Number(form.maxHorses) : undefined,
        maxHorsesPerOwner: form.maxHorsesPerOwner ? Number(form.maxHorsesPerOwner) : 2,
      });
      navigate("/organizer/tournaments");
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not create the tournament."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="client-theme min-h-screen bg-turf-950 text-ivory">
      <ClientHeader />
      <main className="mx-auto max-w-3xl px-6 py-16 md:px-12">
        <Link to="/organizer/tournaments" className="eyebrow text-ivory-faint transition-colors hover:text-gold-300">
          ← Back to my tournaments
        </Link>
        <h1 className="mt-5 font-display text-5xl font-light tracking-tight">
          Create Tournament<span className="text-foil">.</span>
        </h1>
        <GoldRule className="mt-5 w-20" />
        <p className="mt-6 max-w-xl text-base leading-relaxed text-ivory-dim">
          Configure your championship. It starts as a draft — submit it for admin approval before opening registration.
        </p>

        <form className="mt-12 border border-white/10 bg-turf-900 p-7 md:p-10" onSubmit={handleSubmit}>
          {error && (
            <div className="mb-7 border-l-2 border-nyraRed bg-turf-950 px-5 py-4 text-sm text-rose-300" role="alert">
              {error}
            </div>
          )}

          <fieldset className="space-y-7" disabled={submitting}>
            <div className="grid gap-7 md:grid-cols-[1fr_180px]">
              <div>
                <label className={labelClass} htmlFor="t-name">Tournament name *</label>
                <input id="t-name" className={inputClass} value={form.name} onChange={(e) => set("name")(e.target.value)} placeholder="e.g. Summer Derby 2026" required />
              </div>
              <div>
                <label className={labelClass} htmlFor="t-code">Code *</label>
                <input id="t-code" className={`${inputClass} uppercase`} value={form.code} onChange={(e) => set("code")(e.target.value.toUpperCase())} placeholder="SD26" required />
              </div>
            </div>

            <div>
              <label className={labelClass} htmlFor="t-location">Location *</label>
              <input id="t-location" className={inputClass} value={form.location} onChange={(e) => set("location")(e.target.value)} placeholder="e.g. Grand Arena" required />
            </div>

            <div>
              <label className={labelClass} htmlFor="t-desc">Description</label>
              <textarea id="t-desc" className={`${inputClass} min-h-[100px] resize-y`} value={form.description} onChange={(e) => set("description")(e.target.value)} placeholder="Brief description of the championship" />
            </div>

            <div className="grid gap-7 md:grid-cols-2">
              <div>
                <label className={labelClass} htmlFor="t-start">Season start *</label>
                <input id="t-start" type="date" className={inputClass} value={form.startDate} onChange={(e) => set("startDate")(e.target.value)} required />
              </div>
              <div>
                <label className={labelClass} htmlFor="t-end">Season end *</label>
                <input id="t-end" type="date" className={inputClass} value={form.endDate} onChange={(e) => set("endDate")(e.target.value)} required />
              </div>
              <div>
                <label className={labelClass} htmlFor="t-regstart">Registration opens *</label>
                <input id="t-regstart" type="datetime-local" className={inputClass} value={form.registrationStartAt} onChange={(e) => set("registrationStartAt")(e.target.value)} required />
              </div>
              <div>
                <label className={labelClass} htmlFor="t-regend">Registration closes *</label>
                <input id="t-regend" type="datetime-local" className={inputClass} value={form.registrationEndAt} onChange={(e) => set("registrationEndAt")(e.target.value)} required />
              </div>
              <div>
                <label className={labelClass} htmlFor="t-max">Global horse cap</label>
                <input id="t-max" type="number" min={1} className={inputClass} value={form.maxHorses} onChange={(e) => set("maxHorses")(e.target.value)} placeholder="Unlimited" />
              </div>
              <div>
                <label className={labelClass} htmlFor="t-maxowner">Max horses / owner</label>
                <input id="t-maxowner" type="number" min={1} className={inputClass} value={form.maxHorsesPerOwner} onChange={(e) => set("maxHorsesPerOwner")(e.target.value)} />
              </div>
            </div>

            <button
              type="submit"
              className="inline-flex min-h-12 w-full items-center justify-center bg-gold-400 px-5 text-xs font-bold uppercase tracking-[0.14em] text-turf-950 transition-colors hover:bg-gold-300 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-ivory-faint"
            >
              {submitting ? "Creating..." : "Create Tournament (Draft)"}
            </button>
          </fieldset>
        </form>
      </main>
      <ClientFooter />
    </div>
  );
}
