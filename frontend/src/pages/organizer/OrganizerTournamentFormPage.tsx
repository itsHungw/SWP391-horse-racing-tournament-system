import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import { createOrganizerTournament } from "../../api/racingApi";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { getApiErrorMessage } from "../../utils/apiError";
import { getTournamentDateValidationError } from "../../utils/tournamentDateValidation";

const inputClass =
  "mt-2 w-full rounded-lg border border-[#e2d9c8] bg-white px-4 py-3 text-sm font-semibold text-[#211d1a] outline-none transition placeholder:text-[#b3a892] focus:border-[#bb8a3c] focus:ring-2 focus:ring-[#bb8a3c]/20 disabled:cursor-not-allowed disabled:opacity-50";

const labelClass = "text-[11px] font-black uppercase tracking-[0.14em] text-[#8a6a1c]";

export function OrganizerTournamentFormPage() {
  useDocumentTitle("Create Championship | Organizer");
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
      setError(getApiErrorMessage(err, "Could not create the championship."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/organizer/tournaments" className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.14em] text-[#8a8276] transition hover:text-[#bb8a3c]">
        <ArrowLeft className="h-4 w-4" /> Back to my championships
      </Link>
      <h1 className="mt-4 font-display text-3xl font-light tracking-tight text-[#211d1a] md:text-4xl">Create Championship</h1>
      <p className="mt-2 text-sm leading-relaxed text-[#6f665b]">
        Configure your championship. It starts as a draft — submit it for admin approval before opening registration.
      </p>

      <form className="mt-8 rounded-2xl border border-[#e7e0d3] bg-white p-7 md:p-9" onSubmit={handleSubmit}>
        {error && (
          <div className="mb-7 rounded-lg border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-bold text-rose-700" role="alert">
            {error}
          </div>
        )}

        <fieldset className="space-y-6" disabled={submitting}>
          <div className="grid gap-6 md:grid-cols-[1fr_180px]">
            <div>
              <label className={labelClass} htmlFor="t-name">Championship name *</label>
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
            <textarea id="t-desc" className={`${inputClass} min-h-[96px] resize-y`} value={form.description} onChange={(e) => set("description")(e.target.value)} placeholder="Brief description of the championship" />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
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
            className="inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-[#bb8a3c] px-5 text-xs font-black uppercase tracking-[0.14em] text-[#1c1816] transition hover:bg-[#cfa24f] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Creating..." : "Create Championship (Draft)"}
          </button>
        </fieldset>
      </form>
    </div>
  );
}
