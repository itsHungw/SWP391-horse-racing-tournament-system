import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import {
  createOwnerTournamentRegistration,
  getOwnerHorses,
  getOwnerTournamentRegistrations,
  getPublicTournaments,
  withdrawOwnerTournamentRegistration,
} from "../../api/racingApi";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { OwnerLayout } from "../../layouts/OwnerLayout";
import type { Horse, Tournament, TournamentRegistration } from "../../types/racing";
import { getApiErrorMessage } from "../../utils/apiError";

type RegistrationForm = {
  tournamentId: string;
  horseId: string;
  note: string;
};

const emptyForm: RegistrationForm = {
  tournamentId: "",
  horseId: "",
  note: "",
};

export function OwnerTournamentRegistrationsPage() {
  useDocumentTitle("Owner tournament registrations");

  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [horses, setHorses] = useState<Horse[]>([]);
  const [registrations, setRegistrations] = useState<TournamentRegistration[]>([]);
  const [form, setForm] = useState<RegistrationForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const openTournaments = useMemo(
    () => tournaments.filter((tournament) => tournament.status === "OPEN_REGISTRATION"),
    [tournaments],
  );
  const approvedHorses = useMemo(() => horses.filter((horse) => horse.status === "APPROVED"), [horses]);

  const loadWorkspace = useCallback(async () => {
    setLoading(true);
    try {
      const [tournamentData, horseData, registrationData] = await Promise.all([
        getPublicTournaments(),
        getOwnerHorses(),
        getOwnerTournamentRegistrations(),
      ]);
      setTournaments(Array.isArray(tournamentData) ? tournamentData : []);
      setHorses(Array.isArray(horseData) ? horseData : []);
      setRegistrations(Array.isArray(registrationData) ? registrationData : []);
      setMessage(null);
    } catch (error) {
      setMessage(getApiErrorMessage(error, "Could not load tournament registrations."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

  const updateField = (field: keyof RegistrationForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await createOwnerTournamentRegistration({
        tournamentId: Number(form.tournamentId),
        horseId: Number(form.horseId),
        note: form.note.trim() || undefined,
      });
      setForm(emptyForm);
      setMessage("Tournament registration submitted for admin review.");
      await loadWorkspace();
    } catch (error) {
      setMessage(getApiErrorMessage(error, "Could not submit this registration."));
    } finally {
      setSaving(false);
    }
  };

  const handleWithdraw = async (registration: TournamentRegistration) => {
    setSaving(true);
    setMessage(null);
    try {
      await withdrawOwnerTournamentRegistration(registration.id);
      setMessage(`${registration.horseName} withdrawn from ${registration.tournamentName}.`);
      await loadWorkspace();
    } catch (error) {
      setMessage(getApiErrorMessage(error, "Could not withdraw this registration."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <OwnerLayout>
      <section aria-labelledby="owner-registrations-title" className="space-y-6">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.14em] text-[#006d5b]">Tournament desk</p>
          <h1 id="owner-registrations-title" className="mt-2 text-4xl font-black tracking-tight">
            Tournament Registrations
          </h1>
          <p className="mt-2 max-w-3xl text-base leading-7 text-slate-600">
            Submit approved horses into open registration windows and track admin review status.
          </p>
        </div>

        {message && (
          <p className="rounded-md border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700" role="status">
            {message}
          </p>
        )}

        <form
          className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1.5fr_auto]"
          onSubmit={handleSubmit}
        >
          <label className="space-y-1 text-sm font-bold text-slate-700">
            <span>Tournament</span>
            <select
              className="min-h-11 w-full rounded-md border border-slate-300 px-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#006d5b]"
              onChange={(event) => updateField("tournamentId", event.target.value)}
              required
              value={form.tournamentId}
            >
              <option value="">Select tournament</option>
              {openTournaments.map((tournament) => (
                <option key={tournament.id} value={tournament.id}>
                  {tournament.name}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm font-bold text-slate-700">
            <span>Horse</span>
            <select
              className="min-h-11 w-full rounded-md border border-slate-300 px-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#006d5b]"
              onChange={(event) => updateField("horseId", event.target.value)}
              required
              value={form.horseId}
            >
              <option value="">Select horse</option>
              {approvedHorses.map((horse) => (
                <option key={horse.id} value={horse.id}>
                  {horse.name}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm font-bold text-slate-700">
            <span>Note</span>
            <input
              className="min-h-11 w-full rounded-md border border-slate-300 px-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#006d5b]"
              onChange={(event) => updateField("note", event.target.value)}
              value={form.note}
            />
          </label>
          <div className="flex items-end">
            <button
              className="min-h-11 w-full rounded-md bg-[#006d5b] px-5 text-sm font-black text-white hover:bg-[#004d3d] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#070f4f]"
              disabled={saving || loading}
              type="submit"
            >
              Submit Registration
            </button>
          </div>
        </form>

        {loading ? (
          <div className="rounded-lg border border-slate-200 bg-white py-16 text-center text-sm font-bold text-slate-500">
            Loading registrations...
          </div>
        ) : registrations.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white py-16 text-center text-sm font-bold text-slate-500">
            No tournament registrations yet.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-xs font-black uppercase text-slate-500">
                <tr>
                  <th className="px-6 py-3">Tournament</th>
                  <th className="px-6 py-3">Horse</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Note</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {registrations.map((registration) => (
                  <tr key={registration.id}>
                    <td className="px-6 py-4 font-black">{registration.tournamentName}</td>
                    <td className="px-6 py-4">{registration.horseName}</td>
                    <td className="px-6 py-4">
                      <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-black">{registration.status}</span>
                      {registration.rejectionReason && (
                        <p className="mt-2 text-xs font-bold text-rose-700">{registration.rejectionReason}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">{registration.note || "No note"}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        className="min-h-11 rounded-md border border-[#070f4f] px-4 text-xs font-black text-[#070f4f] hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={registration.status !== "PENDING" || saving}
                        onClick={() => handleWithdraw(registration)}
                        type="button"
                      >
                        Withdraw
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </OwnerLayout>
  );
}
