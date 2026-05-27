import { FormEvent, useCallback, useEffect, useState } from "react";

import { createOwnerHorse, getOwnerHorses } from "../../api/racingApi";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { OwnerLayout } from "../../layouts/OwnerLayout";
import type { Horse, HorsePayload } from "../../types/racing";
import { getApiErrorMessage } from "../../utils/apiError";

const emptyForm: HorsePayload = {
  name: "",
  gender: "",
  imageUrl: "",
  evidenceUrl: "",
  registrationCode: "",
  breed: "",
  dateOfBirth: "",
  color: "",
  heightCm: undefined,
  weightKg: undefined,
  healthStatus: "",
  medicalNote: "",
  description: "",
};

export function OwnerHorsesPage() {
  useDocumentTitle("Owner horses");

  const [horses, setHorses] = useState<Horse[]>([]);
  const [form, setForm] = useState<HorsePayload>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadHorses = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getOwnerHorses();
      setHorses(Array.isArray(data) ? data : []);
      setMessage(null);
    } catch (error) {
      setMessage(getApiErrorMessage(error, "Could not load your horses."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadHorses();
  }, [loadHorses]);

  const updateField = (field: keyof HorsePayload, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: field === "heightCm" || field === "weightKg" ? (value.trim() ? Number(value) : undefined) : value,
    }));
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await createOwnerHorse(form);
      setForm(emptyForm);
      setMessage("Horse submitted for admin review.");
      await loadHorses();
    } catch (error) {
      setMessage(getApiErrorMessage(error, "Could not submit this horse."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <OwnerLayout>
      <section aria-labelledby="owner-horses-title" className="space-y-6">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.14em] text-[#006d5b]">Stable management</p>
          <h1 id="owner-horses-title" className="mt-2 text-4xl font-black tracking-tight">
            My Horses
          </h1>
          <p className="mt-2 max-w-3xl text-base leading-7 text-slate-600">
            Submit horse profiles with image and ownership evidence for admin approval.
          </p>
        </div>

        {message && (
          <p className="rounded-md border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700" role="status">
            {message}
          </p>
        )}

        <form
          className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 md:grid-cols-2 xl:grid-cols-4"
          onSubmit={handleCreate}
        >
          <label className="space-y-1 text-sm font-bold text-slate-700">
            <span>Horse name</span>
            <input
              className="min-h-11 w-full rounded-md border border-slate-300 px-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#006d5b]"
              onChange={(event) => updateField("name", event.target.value)}
              required
              value={form.name}
            />
          </label>
          <label className="space-y-1 text-sm font-bold text-slate-700">
            <span>Gender</span>
            <select
              className="min-h-11 w-full rounded-md border border-slate-300 px-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#006d5b]"
              onChange={(event) => updateField("gender", event.target.value)}
              required
              value={form.gender}
            >
              <option value="">Select gender</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
            </select>
          </label>
          <label className="space-y-1 text-sm font-bold text-slate-700 md:col-span-2">
            <span>Horse image URL</span>
            <input
              className="min-h-11 w-full rounded-md border border-slate-300 px-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#006d5b]"
              onChange={(event) => updateField("imageUrl", event.target.value)}
              required
              type="url"
              value={form.imageUrl}
            />
          </label>
          <label className="space-y-1 text-sm font-bold text-slate-700 md:col-span-2">
            <span>Evidence URL</span>
            <input
              className="min-h-11 w-full rounded-md border border-slate-300 px-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#006d5b]"
              onChange={(event) => updateField("evidenceUrl", event.target.value)}
              required
              type="url"
              value={form.evidenceUrl}
            />
          </label>
          <label className="space-y-1 text-sm font-bold text-slate-700">
            <span>Breed</span>
            <input
              className="min-h-11 w-full rounded-md border border-slate-300 px-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#006d5b]"
              onChange={(event) => updateField("breed", event.target.value)}
              value={form.breed}
            />
          </label>
          <label className="space-y-1 text-sm font-bold text-slate-700">
            <span>Color</span>
            <input
              className="min-h-11 w-full rounded-md border border-slate-300 px-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#006d5b]"
              onChange={(event) => updateField("color", event.target.value)}
              value={form.color}
            />
          </label>
          <div className="flex items-end xl:col-span-4">
            <button
              className="min-h-11 rounded-md bg-[#006d5b] px-5 text-sm font-black text-white hover:bg-[#004d3d] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#070f4f]"
              disabled={saving}
              type="submit"
            >
              {saving ? "Saving..." : "Add Horse"}
            </button>
          </div>
        </form>

        {loading ? (
          <div className="rounded-lg border border-slate-200 bg-white py-16 text-center text-sm font-bold text-slate-500">
            Loading horses...
          </div>
        ) : horses.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white py-16 text-center text-sm font-bold text-slate-500">
            No horses submitted yet.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-xs font-black uppercase text-slate-500">
                <tr>
                  <th className="px-6 py-3">Horse</th>
                  <th className="px-6 py-3">Gender</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {horses.map((horse) => (
                  <tr key={horse.id}>
                    <td className="px-6 py-4">
                      <p className="font-black">{horse.name}</p>
                      <div className="mt-2 flex gap-3 text-xs font-black">
                        {horse.imageUrl && (
                          <a className="text-[#006d5b] underline" href={horse.imageUrl}>
                            Open image
                          </a>
                        )}
                        {horse.evidenceUrl && (
                          <a className="text-[#070f4f] underline" href={horse.evidenceUrl}>
                            Open evidence
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">{horse.gender}</td>
                    <td className="px-6 py-4">
                      <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-black">{horse.status}</span>
                      {horse.rejectionReason && <p className="mt-2 text-xs font-bold text-rose-700">{horse.rejectionReason}</p>}
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
