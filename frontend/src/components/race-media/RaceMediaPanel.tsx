import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ChevronDown,
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
  type RaceMediaKind,
  type RaceMediaManageScope,
} from "../../api/raceMediaApi";
import type { Race, RaceMediaResponse, RaceMediaValidateResponse, RaceMediaVerificationStatus } from "../../types/racing";
import { getApiErrorMessage } from "../../utils/apiError";

type RaceMediaPanelProps = {
  race: Race;
  scope: RaceMediaManageScope;
  accent?: "gold" | "red";
  kind?: RaceMediaKind;
  defaultOpen?: boolean;
};

const blockedReasonLabel: Record<string, string> = {
  RESULT_NOT_OFFICIAL: "Publish unlocks once the official result is confirmed.",
  VIDEO_NOT_VERIFIED: "Re-verify the video before publishing.",
  ALREADY_PUBLISHED: "This media is already public.",
};

const panelCopy = {
  live: {
    emptyLabel: "No live stream",
    eyebrow: "Media workspace",
    heading: "YouTube live",
    blurb:
      "Paste the YouTube live link, verify it, then publish it before the race. Published live streams appear on the public race page until the race is finished.",
    previewEmpty: "No live preview yet",
    previewHelp: "Paste a YouTube live link and validate it to preview the broadcast card.",
    defaultTitle: "Official race live stream",
    urlLabel: "YouTube live link",
    titlePlaceholder: "Official race live stream",
    verifiedHelp: "This stream can be embedded and published before the race.",
    failedHelp: "The draft is saved, but YouTube verification must pass before publish.",
    waitingHelp: "Save the live stream as a draft, then verify before making it public.",
    savedMessage: "Live stream draft saved.",
    publicMessage: "Live stream is now public.",
    hiddenMessage: "Live stream hidden from public pages.",
    removedMessage: "Live stream removed.",
    loadError: "Could not load race live stream.",
    saveError: "Could not save this live stream.",
    publishError: "Could not publish this live stream.",
    unpublishError: "Could not unpublish this live stream.",
    reverifyError: "Could not re-verify this live stream.",
    deleteError: "Could not remove this live stream.",
    removeConfirm: "Remove this race live stream draft?",
    footerPublished: "This live stream is visible on the public Race Detail page until the race is finished.",
    footerDraft: "Drafts stay private until they are verified and published.",
  },
  highlight: {
    emptyLabel: "No highlight",
    eyebrow: "Media workspace",
    heading: "Race highlight",
    blurb: "Paste one YouTube replay, verify it, then publish after the result is official.",
    previewEmpty: "No preview yet",
    previewHelp: "Paste a YouTube replay link and validate it to preview the public card.",
    defaultTitle: "Official race replay",
    urlLabel: "YouTube replay link",
    titlePlaceholder: "Official race replay",
    verifiedHelp: "This replay can be embedded and published when the race state allows it.",
    failedHelp: "The draft is saved, but YouTube verification must pass before publish.",
    waitingHelp: "Save the replay as a draft, then verify before making it public.",
    savedMessage: "Highlight draft saved.",
    publicMessage: "Highlight is now public.",
    hiddenMessage: "Highlight hidden from public pages.",
    removedMessage: "Highlight removed.",
    loadError: "Could not load race highlight.",
    saveError: "Could not save this highlight.",
    publishError: "Could not publish this highlight.",
    unpublishError: "Could not unpublish this highlight.",
    reverifyError: "Could not re-verify this highlight.",
    deleteError: "Could not remove this highlight.",
    removeConfirm: "Remove this race highlight draft?",
    footerPublished: "This highlight is visible on Race Detail and Championship Detail public pages.",
    footerDraft: "Drafts stay private until they are verified and published.",
  },
} satisfies Record<RaceMediaKind, Record<string, string>>;

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

function mediaStateLabel(media: RaceMediaResponse | null, emptyLabel: string) {
  if (!media) return emptyLabel;
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

export function RaceMediaPanel({ race, scope, accent = "gold", kind = "highlight", defaultOpen = false }: RaceMediaPanelProps) {
  const [media, setMedia] = useState<RaceMediaResponse | null>(null);
  const [validation, setValidation] = useState<RaceMediaValidateResponse | null>(null);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(defaultOpen);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const copy = panelCopy[kind];
  const panelId = `${scope}-${kind}-${race.id}`;
  const bodyId = `race-media-body-${panelId}`;
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
    getRaceMedia(scope, race.id, kind)
      .then((next) => {
        if (!active) return;
        setMedia(next);
        setUrl(next?.sourceUrl ?? "");
        setTitle(next?.title ?? "");
        setValidation(null);
      })
      .catch((err) => active && setError(getApiErrorMessage(err, copy.loadError)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [race.id, scope, kind, copy.loadError]);

  useEffect(() => {
    setOpen(defaultOpen);
  }, [defaultOpen, race.id, scope, kind]);

  useEffect(() => {
    if (error) setOpen(true);
  }, [error]);

  const publishBlocked = useMemo(() => {
    if (!media?.publishBlockedReason) return null;
    return blockedReasonLabel[media.publishBlockedReason] ?? media.publishBlockedReason.replace(/_/g, " ").toLowerCase();
  }, [media?.publishBlockedReason]);

  const hasUrl = url.trim().length > 0;
  const previewStatus = validation?.verificationStatus ?? media?.verificationStatus;
  const VerificationIcon = verificationIcon(previewStatus);
  const previewThumbnail = validation?.thumbnailUrl ?? media?.thumbnailUrl ?? null;
  const previewVideoId = validation?.providerVideoId ?? media?.providerVideoId ?? null;
  const previewTitle = title.trim() || validation?.providerTitle || media?.title || media?.providerTitle || copy.defaultTitle;
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
      () => validateRaceMedia(scope, race.id, { url, title }, kind),
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
      () => saveRaceMedia(scope, race.id, { url, title }, kind),
      (result) => {
        setMedia(result);
        setValidation(null);
        setUrl(result.sourceUrl);
        setTitle(result.title ?? "");
        setMessage(result.message ?? copy.savedMessage);
      },
      copy.saveError,
    );
  };

  const handlePublish = () => {
    void runAction(
      "publish",
      () => publishRaceMedia(scope, race.id, kind),
      (result) => {
        setMedia(result);
        setMessage(result.message ?? copy.publicMessage);
      },
      copy.publishError,
    );
  };

  const handleUnpublish = () => {
    void runAction(
      "unpublish",
      () => unpublishRaceMedia(scope, race.id, kind),
      (result) => {
        setMedia(result);
        setMessage(result.message ?? copy.hiddenMessage);
      },
      copy.unpublishError,
    );
  };

  const handleReverify = () => {
    void runAction(
      "reverify",
      () => reverifyRaceMedia(scope, race.id, kind),
      (result) => {
        setMedia(result);
        setValidation(null);
        setMessage(result.message ?? "Verification updated.");
      },
      copy.reverifyError,
    );
  };

  const handleDelete = () => {
    if (!window.confirm(copy.removeConfirm)) return;
    void runAction(
      "delete",
      () => deleteRaceMedia(scope, race.id, kind),
      () => {
        setMedia(null);
        setValidation(null);
        setUrl("");
        setTitle("");
        setMessage(copy.removedMessage);
      },
      copy.deleteError,
    );
  };

  return (
    <section
      className={`overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm ${accentBorderClass}`}
      aria-labelledby={`race-media-title-${panelId}`}
    >
      <div className="flex flex-col gap-4 border-b border-slate-100 bg-slate-50/70 p-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border ${accentBorderClass} ${accentSurfaceClass}`}>
            <Film className={`h-5 w-5 ${accentClass}`} aria-hidden="true" />
          </span>
          <div>
            <p className={`text-xs font-black uppercase tracking-wider ${accentClass}`}>{copy.eyebrow}</p>
            <h3 id={`race-media-title-${panelId}`} className="mt-1 text-lg font-black text-slate-950">
              {copy.heading}
            </h3>
            <p className="mt-1 max-w-xl text-sm font-medium leading-6 text-slate-500">
              {copy.blurb}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
          aria-controls={bodyId}
          className="inline-flex min-h-11 w-fit items-center gap-2 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-left transition-colors hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
        >
          <span className={`rounded-full border px-3 py-1.5 text-[11px] font-black uppercase tracking-wide ${statusTone(media)}`}>
            {loading ? "Loading" : mediaStateLabel(media, copy.emptyLabel)}
          </span>
          <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
          <span className="sr-only">
            {open ? "Collapse" : "Expand"} {copy.heading}
          </span>
        </button>
      </div>

      {open ? (
        <div id={bodyId}>
          {loading ? (
            <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]" aria-label={`Loading ${copy.heading.toLowerCase()} media`}>
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
                        <p className="mt-4 text-sm font-black text-white">{copy.previewEmpty}</p>
                        <p className="mt-1 text-xs font-semibold leading-5 text-white/60">
                          {copy.previewHelp}
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
                    {previewStatus === "VERIFIED" ? copy.verifiedHelp : previewStatus === "FAILED" ? copy.failedHelp : copy.waitingHelp}
                  </p>
                </div>
              </div>

              <div>
                <label htmlFor={`race-media-url-${panelId}`} className="block text-xs font-black uppercase tracking-wider text-slate-600">
                  {copy.urlLabel}
                </label>
                <div className="relative mt-2">
                  <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                  <input
                    id={`race-media-url-${panelId}`}
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
                  <label htmlFor={`race-media-title-input-${panelId}`} className="block text-xs font-black uppercase tracking-wider text-slate-600">
                    Display title
                  </label>
                  <input
                    id={`race-media-title-input-${panelId}`}
                    type="text"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    maxLength={160}
                    placeholder={media?.providerTitle ?? validation?.providerTitle ?? copy.titlePlaceholder}
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
                {media?.status === "PUBLISHED" ? copy.footerPublished : copy.footerDraft}
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
        </div>
      ) : null}
    </section>
  );
}
