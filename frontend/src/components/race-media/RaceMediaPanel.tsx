import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  ExternalLink,
  EyeOff,
  Film,
  Link2,
  PlayCircle,
  RefreshCw,
  Save,
  Trash2,
} from "lucide-react";

import {
  deleteRaceMedia,
  getRaceMedia,
  publishRaceMedia,
  reverifyRaceMedia,
  saveRaceMedia,
  unpublishRaceMedia,
  validateRaceMedia,
  type RaceMediaManageScope,
} from "../../api/raceMediaApi";
import type { Race, RaceMediaResponse, RaceMediaValidateResponse, RaceMediaVerificationStatus } from "../../types/racing";
import { getApiErrorMessage } from "../../utils/apiError";

type RaceMediaPanelProps = {
  race: Race;
  scope: RaceMediaManageScope;
  accent?: "gold" | "red";
};

const blockedReasonLabel: Record<string, string> = {
  RESULT_NOT_OFFICIAL: "Publish unlocks once the official result is confirmed.",
  VIDEO_NOT_VERIFIED: "Re-verify the video before publishing.",
  ALREADY_PUBLISHED: "Highlight is already public.",
};

function statusTone(media: RaceMediaResponse | null) {
  if (!media) return "border-slate-200 bg-slate-50 text-slate-700";
  if (media.status === "PUBLISHED") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (media.verificationStatus === "FAILED") return "border-amber-200 bg-amber-50 text-amber-800";
  if (media.verificationStatus === "VERIFIED") return "border-cyan-200 bg-cyan-50 text-cyan-800";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

function verificationTone(status: RaceMediaVerificationStatus | null | undefined) {
  if (status === "VERIFIED") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (status === "FAILED") return "border-amber-200 bg-amber-50 text-amber-800";
  if (status === "UNVERIFIED") return "border-slate-200 bg-slate-50 text-slate-700";
  return "border-slate-200 bg-white text-slate-500";
}

function mediaStateLabel(media: RaceMediaResponse | null) {
  if (!media) return "No highlight";
  if (media.status === "PUBLISHED") return "Published";
  if (media.verificationStatus === "VERIFIED") return "Verified draft";
  if (media.verificationStatus === "FAILED") return "Needs re-check";
  return "Draft";
}

function verificationLabel(status: RaceMediaVerificationStatus | null | undefined) {
  if (status === "VERIFIED") return "Embeddable";
  if (status === "FAILED") return "Needs attention";
  if (status === "UNVERIFIED") return "Not verified";
  return "Waiting for link";
}

function verificationIcon(status: RaceMediaVerificationStatus | null | undefined) {
  if (status === "VERIFIED") return CheckCircle2;
  if (status === "FAILED") return AlertTriangle;
  return Clock3;
}

export function RaceMediaPanel({ race, scope, accent = "gold" }: RaceMediaPanelProps) {
  const [media, setMedia] = useState<RaceMediaResponse | null>(null);
  const [validation, setValidation] = useState<RaceMediaValidateResponse | null>(null);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const accentClass = accent === "red" ? "text-[#b3193a]" : "text-[#bb8a3c]";
  const accentBorderClass = accent === "red" ? "border-[#b3193a]/25" : "border-[#bb8a3c]/30";
  const accentSurfaceClass = accent === "red" ? "bg-[#b3193a]/5" : "bg-[#bb8a3c]/10";
  const primaryClass =
    accent === "red"
      ? "bg-[#b3193a] text-white hover:bg-[#92122d] focus-visible:ring-[#b3193a]"
      : "bg-[#bb8a3c] text-[#1c1816] hover:bg-[#cfa24f] focus-visible:ring-[#bb8a3c]";

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    setMessage(null);
    getRaceMedia(scope, race.id)
      .then((next) => {
        if (!active) return;
        setMedia(next);
        setUrl(next?.sourceUrl ?? "");
        setTitle(next?.title ?? "");
        setValidation(null);
      })
      .catch((err) => active && setError(getApiErrorMessage(err, "Could not load race highlight.")))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [race.id, scope]);

  const publishBlocked = useMemo(() => {
    if (!media?.publishBlockedReason) return null;
    return blockedReasonLabel[media.publishBlockedReason] ?? media.publishBlockedReason.replace(/_/g, " ").toLowerCase();
  }, [media?.publishBlockedReason]);

  const hasUrl = url.trim().length > 0;
  const previewStatus = validation?.verificationStatus ?? media?.verificationStatus;
  const VerificationIcon = verificationIcon(previewStatus);
  const previewThumbnail = validation?.thumbnailUrl ?? media?.thumbnailUrl ?? null;
  const previewVideoId = validation?.providerVideoId ?? media?.providerVideoId ?? null;
  const previewTitle = title.trim() || validation?.providerTitle || media?.title || media?.providerTitle || "Official race replay";
  const showTitleField = hasUrl || Boolean(media) || Boolean(validation);
  const savedWatchUrl = media ? `https://www.youtube.com/watch?v=${media.providerVideoId}` : null;
  const publishPrimary = Boolean(media && media.status !== "PUBLISHED" && media.canPublish);
  const savePrimary = !publishPrimary && media?.status !== "PUBLISHED";

  async function runAction<T>(key: string, action: () => Promise<T>, onSuccess: (result: T) => void, fallback: string) {
    setBusy(key);
    setError(null);
    setMessage(null);
    try {
      const result = await action();
      onSuccess(result);
    } catch (err) {
      setError(getApiErrorMessage(err, fallback));
    } finally {
      setBusy(null);
    }
  }

  const handleUrlChange = (value: string) => {
    setUrl(value);
    setValidation(null);
    setMessage(null);
    setError(null);
  };

  const handleValidate = () => {
    if (!url.trim()) {
      setError("Paste a YouTube URL before validating.");
      return;
    }
    void runAction(
      "validate",
      () => validateRaceMedia(scope, race.id, { url, title }),
      (result) => {
        setValidation(result);
        setMessage(result.message ?? (result.verificationStatus === "VERIFIED" ? "Video is embeddable." : "Video needs attention."));
      },
      "Could not validate this video.",
    );
  };

  const handleSave = () => {
    if (!url.trim()) {
      setError("Paste a YouTube URL before saving.");
      return;
    }
    void runAction(
      "save",
      () => saveRaceMedia(scope, race.id, { url, title }),
      (result) => {
        setMedia(result);
        setValidation(null);
        setUrl(result.sourceUrl);
        setTitle(result.title ?? "");
        setMessage(result.message ?? "Highlight draft saved.");
      },
      "Could not save this highlight.",
    );
  };

  const handlePublish = () => {
    void runAction(
      "publish",
      () => publishRaceMedia(scope, race.id),
      (result) => {
        setMedia(result);
        setMessage(result.message ?? "Highlight is now public.");
      },
      "Could not publish this highlight.",
    );
  };

  const handleUnpublish = () => {
    void runAction(
      "unpublish",
      () => unpublishRaceMedia(scope, race.id),
      (result) => {
        setMedia(result);
        setMessage(result.message ?? "Highlight hidden from public pages.");
      },
      "Could not unpublish this highlight.",
    );
  };

  const handleReverify = () => {
    void runAction(
      "reverify",
      () => reverifyRaceMedia(scope, race.id),
      (result) => {
        setMedia(result);
        setValidation(null);
        setMessage(result.message ?? "Verification updated.");
      },
      "Could not re-verify this highlight.",
    );
  };

  const handleDelete = () => {
    if (!window.confirm("Remove this race highlight draft?")) return;
    void runAction(
      "delete",
      () => deleteRaceMedia(scope, race.id),
      () => {
        setMedia(null);
        setValidation(null);
        setUrl("");
        setTitle("");
        setMessage("Highlight removed.");
      },
      "Could not remove this highlight.",
    );
  };

  return (
    <section className={`overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm ${accentBorderClass}`} aria-labelledby={`race-media-title-${scope}-${race.id}`}>
      <div className="flex flex-col gap-4 border-b border-slate-100 bg-slate-50/70 p-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border ${accentBorderClass} ${accentSurfaceClass}`}>
            <Film className={`h-5 w-5 ${accentClass}`} aria-hidden="true" />
          </span>
          <div>
            <p className={`text-xs font-black uppercase tracking-wider ${accentClass}`}>Media workspace</p>
            <h3 id={`race-media-title-${scope}-${race.id}`} className="mt-1 text-lg font-black text-slate-950">
              Race highlight
            </h3>
            <p className="mt-1 max-w-xl text-sm font-medium leading-6 text-slate-500">
              Paste one YouTube replay, verify it, then publish after the result is official.
            </p>
          </div>
        </div>
        <span className={`w-fit rounded-full border px-3 py-1.5 text-[11px] font-black uppercase tracking-wide ${statusTone(media)}`}>
          {loading ? "Loading" : mediaStateLabel(media)}
        </span>
      </div>

      {loading ? (
        <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]" aria-label="Loading race highlight media">
          <div className="aspect-video animate-pulse rounded-lg bg-slate-100" />
          <div className="space-y-3">
            <div className="h-11 animate-pulse rounded-md bg-slate-100" />
            <div className="h-11 animate-pulse rounded-md bg-slate-100" />
            <div className="h-24 animate-pulse rounded-md bg-slate-100" />
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
            <div className="space-y-3">
              <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-950">
                <div className="relative aspect-video">
                  {previewThumbnail ? (
                    <img src={previewThumbnail} alt="" className="h-full w-full object-cover opacity-90" />
                  ) : (
                    <div className="flex h-full min-h-44 items-center justify-center bg-[radial-gradient(circle_at_center,rgba(187,138,60,0.18),rgba(15,23,42,0.98))] p-6 text-center">
                      <div>
                        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white">
                          <Film className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <p className="mt-4 text-sm font-black text-white">No preview yet</p>
                        <p className="mt-1 text-xs font-semibold leading-5 text-white/60">
                          Paste a YouTube replay link and validate it to preview the public card.
                        </p>
                      </div>
                    </div>
                  )}
                  <span className="absolute left-3 top-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-slate-950/80 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-white backdrop-blur">
                    <PlayCircle className="h-3.5 w-3.5" aria-hidden="true" />
                    YouTube
                  </span>
                  {media?.status === "PUBLISHED" ? (
                    <span className="absolute bottom-3 left-3 inline-flex items-center gap-2 rounded-full border border-emerald-300/40 bg-emerald-950/80 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-100 backdrop-blur">
                      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                      Public
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="line-clamp-2 text-sm font-black text-slate-950">{previewTitle}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-bold text-slate-500">
                  {previewVideoId ? <span className="font-data">Video {previewVideoId}</span> : <span>Waiting for a video id</span>}
                  {savedWatchUrl ? (
                    <a
                      href={savedWatchUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-8 items-center gap-1 rounded-md border border-slate-200 bg-white px-2 text-slate-600 transition-colors hover:border-slate-400 hover:text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500"
                    >
                      Open
                      <ExternalLink size={12} aria-hidden="true" />
                    </a>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className={`flex items-start gap-3 rounded-lg border p-3 ${verificationTone(previewStatus)}`}>
                <VerificationIcon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                <div>
                  <p className="text-sm font-black">{verificationLabel(previewStatus)}</p>
                  <p className="mt-1 text-xs font-semibold leading-5 opacity-80">
                    {previewStatus === "VERIFIED"
                      ? "This replay can be embedded and published when the race state allows it."
                      : previewStatus === "FAILED"
                        ? "The draft is saved, but YouTube verification must pass before publish."
                        : "Save the replay as a draft, then verify before making it public."}
                  </p>
                </div>
              </div>

              <div>
                <label htmlFor={`race-media-url-${scope}-${race.id}`} className="block text-xs font-black uppercase tracking-wider text-slate-600">
                  YouTube replay link
                </label>
                <div className="relative mt-2">
                  <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                  <input
                    id={`race-media-url-${scope}-${race.id}`}
                    type="url"
                    value={url}
                    onChange={(event) => handleUrlChange(event.target.value)}
                    placeholder="https://youtu.be/..."
                    className="min-h-11 w-full rounded-md border border-slate-300 py-2 pl-9 pr-3 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:border-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300"
                    autoComplete="url"
                  />
                </div>
                <p className="mt-1.5 text-xs font-medium text-slate-500">
                  Supported sources are YouTube watch, short, live, embed, and youtu.be links.
                </p>
              </div>

              {showTitleField ? (
                <div>
                  <label htmlFor={`race-media-title-input-${scope}-${race.id}`} className="block text-xs font-black uppercase tracking-wider text-slate-600">
                    Display title
                  </label>
                  <input
                    id={`race-media-title-input-${scope}-${race.id}`}
                    type="text"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    maxLength={160}
                    placeholder={media?.providerTitle ?? validation?.providerTitle ?? "Official race replay"}
                    className="mt-2 min-h-11 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:border-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300"
                  />
                  <p className="mt-1.5 text-xs font-medium text-slate-500">
                    Optional. Leave blank to use the provider title.
                  </p>
                </div>
              ) : null}

              {validation ? (
                <div className={`rounded-md border p-3 text-sm font-bold ${verificationTone(validation.verificationStatus)}`}>
                  {validation.message ?? verificationLabel(validation.verificationStatus)}
                </div>
              ) : null}

              {publishBlocked && media?.status !== "PUBLISHED" ? (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs font-bold leading-5 text-amber-800">
                  {publishBlocked}
                </div>
              ) : null}

              {message ? (
                <div role="status" aria-live="polite" className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold text-emerald-800">
                  {message}
                </div>
              ) : null}

              {error ? (
                <div role="alert" className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm font-bold text-rose-700">
                  {error}
                </div>
              ) : null}
            </div>
          </div>

          <div className="border-t border-slate-100 bg-slate-50/70 p-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div className="text-xs font-semibold leading-5 text-slate-500">
                {media?.status === "PUBLISHED"
                  ? "This highlight is visible on Race Detail and Championship Detail public pages."
                  : "Drafts stay private until they are verified and published."}
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={handleValidate}
                  disabled={busy !== null || !hasUrl}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-xs font-black uppercase tracking-wide text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <PlayCircle className="h-4 w-4" aria-hidden="true" />
                  {busy === "validate" ? "Checking..." : "Validate"}
                </button>

                {savePrimary ? (
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={busy !== null || !hasUrl}
                    className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 text-xs font-black uppercase tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${primaryClass}`}
                  >
                    <Save className="h-4 w-4" aria-hidden="true" />
                    {busy === "save" ? "Saving..." : "Save draft"}
                  </button>
                ) : null}

                {publishPrimary ? (
                  <button
                    type="button"
                    onClick={handlePublish}
                    disabled={busy !== null}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 text-xs font-black uppercase tracking-wide text-white transition-colors hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    {busy === "publish" ? "Publishing..." : "Publish"}
                  </button>
                ) : null}

                {media && media.status !== "PUBLISHED" ? (
                  <button
                    type="button"
                    onClick={handleReverify}
                    disabled={busy !== null}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-xs font-black uppercase tracking-wide text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <RefreshCw className="h-4 w-4" aria-hidden="true" />
                    {busy === "reverify" ? "Checking..." : "Re-verify"}
                  </button>
                ) : null}

                {media?.status === "PUBLISHED" ? (
                  <button
                    type="button"
                    onClick={handleUnpublish}
                    disabled={busy !== null}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-xs font-black uppercase tracking-wide text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                    {busy === "unpublish" ? "Hiding..." : "Unpublish"}
                  </button>
                ) : null}

                {media ? (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={busy !== null}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-rose-200 bg-white px-4 text-xs font-black uppercase tracking-wide text-rose-700 transition-colors hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    {busy === "delete" ? "Removing..." : "Remove"}
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
