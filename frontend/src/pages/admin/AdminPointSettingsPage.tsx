import { useEffect, useState } from "react";

import { getPointSettings, updatePointSettings } from "../../api/pointSettingsApi";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { AdminLayout } from "../../layouts/AdminLayout";
import type { PointSettings } from "../../types/pointSettings";

type PointSettingField = {
  key: keyof PointSettings;
  label: string;
  helper: string;
};

const fields: PointSettingField[] = [
  {
    key: "FIRST_LOGIN_BONUS",
    label: "First login bonus",
    helper: "Reserved for a future first-login reward flow.",
  },
  {
    key: "BLOG_REWARD_POINTS",
    label: "Blog reward points",
    helper: "Points used later when blog read rewards are implemented.",
  },
  {
    key: "DAILY_BLOG_REWARD_LIMIT",
    label: "Daily blog reward limit",
    helper: "Maximum blog rewards a spectator can earn per day later.",
  },
  {
    key: "PREDICTION_WINNER_ENTRY_COST",
    label: "Prediction winner entry cost",
    helper: "Points spent to submit one Winner pick prediction.",
  },
  {
    key: "PREDICTION_TOP3_ENTRY_COST",
    label: "Prediction top 3 entry cost",
    helper: "Points spent to submit one Top 3 prediction.",
  },
  {
    key: "PREDICTION_WINNER_REWARD",
    label: "Prediction winner reward",
    helper: "Points awarded for a correct Winner pick prediction.",
  },
  {
    key: "PREDICTION_TOP3_EXACT_REWARD",
    label: "Prediction top 3 exact reward",
    helper: "Points awarded for matching the exact Top 3 order.",
  },
  {
    key: "PREDICTION_TOP3_ANY_ORDER_REWARD",
    label: "Prediction top 3 any order reward",
    helper: "Points awarded for predicting the Top 3 in any order.",
  },
];

function hasInvalidValue(settings: PointSettings) {
  return Object.values(settings).some((value) => !Number.isInteger(value) || value < 0);
}

export function AdminPointSettingsPage() {
  useDocumentTitle("Point settings admin");

  const [settings, setSettings] = useState<PointSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;

    async function loadSettings() {
      try {
        setLoading(true);
        setError("");
        const loadedSettings = await getPointSettings();
        if (active) {
          setSettings(loadedSettings);
        }
      } catch {
        if (active) {
          setError("Could not load point settings. Please try again.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadSettings();

    return () => {
      active = false;
    };
  }, []);

  const handleValueChange = (key: keyof PointSettings, value: string) => {
    if (!settings) {
      return;
    }

    setError("");
    setSuccess("");
    setSettings({
      ...settings,
      [key]: value === "" ? 0 : Number(value),
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!settings) {
      return;
    }

    if (hasInvalidValue(settings)) {
      setSuccess("");
      setError("Point values must be whole numbers greater than or equal to 0.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      const savedSettings = await updatePointSettings(settings);
      setSettings(savedSettings);
      setSuccess("Point settings saved.");
    } catch {
      setSuccess("");
      setError("Could not save point settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <section aria-labelledby="admin-point-settings-title" className="space-y-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-[#b3193a]">
              Point economy
            </p>
            <h1 id="admin-point-settings-title" className="mt-2 text-4xl font-black tracking-tight">
              Point Settings
            </h1>
            <p className="mt-2 max-w-3xl text-base text-slate-600">
              Configure reward and prediction point rules without changing application code.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="rounded-lg border border-[#d8d8d8] bg-white py-16 text-center" role="status">
            <p className="text-sm font-bold text-slate-500">Loading point settings...</p>
          </div>
        ) : (
          <form
            className="rounded-lg border border-[#d8d8d8] bg-white"
            noValidate
            onSubmit={handleSubmit}
          >
            <div className="grid gap-0 divide-y divide-[#ececec]">
              {fields.map((field) => (
                <div className="grid gap-4 p-5 lg:grid-cols-[1fr_220px]" key={field.key}>
                  <div>
                    <label
                      className="text-sm font-black text-[#171717]"
                      htmlFor={`point-setting-${field.key}`}
                    >
                      {field.label}
                    </label>
                    <p className="mt-1 text-sm leading-6 text-slate-500">{field.helper}</p>
                  </div>
                  <input
                    className="h-11 w-full rounded-md border border-[#bdbdbd] bg-white px-3 text-right text-sm font-black text-[#171717] shadow-sm focus:border-[#b3193a] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#b3193a]"
                    id={`point-setting-${field.key}`}
                    min={0}
                    onChange={(event) => handleValueChange(field.key, event.target.value)}
                    step={1}
                    type="number"
                    value={settings?.[field.key] ?? 0}
                  />
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-4 border-t border-[#d8d8d8] bg-[#fafafa] p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-h-6">
                {error ? (
                  <p className="text-sm font-bold text-[#b3193a]" role="alert">
                    {error}
                  </p>
                ) : success ? (
                  <p className="text-sm font-bold text-[#006d5b]" role="status">
                    {success}
                  </p>
                ) : (
                  <p className="text-sm font-medium text-slate-500">
                    All values must be whole numbers greater than or equal to 0.
                  </p>
                )}
              </div>
              <button
                className="min-h-11 rounded-md bg-[#070f4f] px-5 text-sm font-black text-white hover:bg-[#101a70] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b3193a]"
                disabled={saving || !settings}
                type="submit"
              >
                {saving ? "Saving..." : "Save Settings"}
              </button>
            </div>
          </form>
        )}
      </section>
    </AdminLayout>
  );
}
