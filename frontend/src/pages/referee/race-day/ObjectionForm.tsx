import { useState } from "react";
import {
  OBJECTION_DECISION_LABELS,
  ObjectionDecision,
  ObjectionKind,
  ParticipantVerification,
  RaceObjectionDraft,
} from "../../../api/refereeApi";

const FOUL_TYPES = ["interference", "crossing", "contact", "improper whip use", "other"];
const SUBJECTS = ["referee decision", "track condition", "equipment", "other"];
const DECISIONS = Object.entries(OBJECTION_DECISION_LABELS) as [ObjectionDecision, string][];

const FIELD_CLASS =
  "mt-1 min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm font-black text-slate-900 outline-none focus:border-[#007a68] focus:ring-2 focus:ring-[#007a68]/20";
const LABEL_CLASS = "text-xs font-black uppercase tracking-[0.16em] text-slate-500";

function nameOf(participants: ParticipantVerification[], id: number | "") {
  const found = participants.find((participant) => participant.participantId === Number(id));
  return found ? `${found.jockeyName} (${found.horseName})` : "";
}

/**
 * Trọng tài ghi nhận khiếu nại nài trình bày tại chỗ (nài nói miệng lúc cân lại, không tự nộp form).
 *
 * Hai biến thể:
 * - có bên liên quan  -> chèn ép / cản trở, cần chọn bên bị khiếu nại
 * - không bên liên quan -> khiếu nại quyết định của chính trọng tài, mặt sân, thiết bị
 *
 * Cả hai đều lưu vào bảng `violations` sẵn có; dropdown chỉ để dựng text cho nhất quán.
 */
export function ObjectionForm({
  participants,
  onRecord,
}: {
  participants: ParticipantVerification[];
  onRecord: (draft: RaceObjectionDraft) => void;
}) {
  const [kind, setKind] = useState<ObjectionKind>("OBJECTION_INTERFERENCE");
  const [raisedBy, setRaisedBy] = useState<number | "">(participants[0]?.participantId ?? "");
  const [against, setAgainst] = useState<number | "">("");
  const [foulType, setFoulType] = useState(FOUL_TYPES[0]);
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [videoMarkSeconds, setVideoMarkSeconds] = useState<number | "">("");
  const [detail, setDetail] = useState("");
  const [severity, setSeverity] = useState<"LOW" | "MEDIUM" | "HIGH">("LOW");
  const [decision, setDecision] = useState<ObjectionDecision>("NO_CHANGE");
  const [error, setError] = useState<string | null>(null);

  const record = () => {
    if (raisedBy === "") {
      setError("Select the runner raising the objection.");
      return;
    }
    if (kind === "OBJECTION_INTERFERENCE" && against === "") {
      setError("Select the runner being objected against.");
      return;
    }
    if (!detail.trim()) {
      setError("Describe what happened.");
      return;
    }

    setError(null);
    onRecord({
      kind,
      raisedByParticipantId: Number(raisedBy),
      raisedByName: nameOf(participants, raisedBy),
      againstParticipantId: kind === "OBJECTION_INTERFERENCE" ? Number(against) : undefined,
      againstName: kind === "OBJECTION_INTERFERENCE" ? nameOf(participants, against) : undefined,
      foulType: kind === "OBJECTION_INTERFERENCE" ? foulType : undefined,
      subject: kind === "OBJECTION_GENERAL" ? subject : undefined,
      videoMarkSeconds: kind === "OBJECTION_INTERFERENCE" ? videoMarkSeconds : undefined,
      detail: detail.trim(),
      severity,
      decision,
    });
    setDetail("");
    setVideoMarkSeconds("");
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <fieldset className="flex flex-wrap gap-4">
        <legend className={LABEL_CLASS}>Objection type</legend>
        <label className="mt-2 flex items-center gap-2 text-sm font-black text-slate-800">
          <input
            checked={kind === "OBJECTION_INTERFERENCE"}
            className="h-4 w-4 accent-[#007a68]"
            name="objection-kind"
            onChange={() => setKind("OBJECTION_INTERFERENCE")}
            type="radio"
          />
          Against another runner
        </label>
        <label className="mt-2 flex items-center gap-2 text-sm font-black text-slate-800">
          <input
            checked={kind === "OBJECTION_GENERAL"}
            className="h-4 w-4 accent-[#007a68]"
            name="objection-kind"
            onChange={() => setKind("OBJECTION_GENERAL")}
            type="radio"
          />
          No opposing runner
        </label>
      </fieldset>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className={LABEL_CLASS} htmlFor="objection-raised-by">
            Raised by
          </label>
          <select
            className={FIELD_CLASS}
            id="objection-raised-by"
            onChange={(event) => setRaisedBy(Number(event.target.value))}
            value={raisedBy}
          >
            {participants.map((participant) => (
              <option key={participant.participantId} value={participant.participantId}>
                {participant.jockeyName} ({participant.horseName})
              </option>
            ))}
          </select>
        </div>

        {kind === "OBJECTION_INTERFERENCE" ? (
          <div>
            <label className={LABEL_CLASS} htmlFor="objection-against">
              Against
            </label>
            <select
              className={FIELD_CLASS}
              id="objection-against"
              onChange={(event) => setAgainst(Number(event.target.value))}
              value={against}
            >
              <option value="">Select a runner</option>
              {participants.map((participant) => (
                <option key={participant.participantId} value={participant.participantId}>
                  {participant.jockeyName} ({participant.horseName})
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div>
            <label className={LABEL_CLASS} htmlFor="objection-subject">
              Subject
            </label>
            <select
              className={FIELD_CLASS}
              id="objection-subject"
              onChange={(event) => setSubject(event.target.value)}
              value={subject}
            >
              {SUBJECTS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        )}

        {kind === "OBJECTION_INTERFERENCE" ? (
          <>
            <div>
              <label className={LABEL_CLASS} htmlFor="objection-foul-type">
                Foul type
              </label>
              <select
                className={FIELD_CLASS}
                id="objection-foul-type"
                onChange={(event) => setFoulType(event.target.value)}
                value={foulType}
              >
                {FOUL_TYPES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL_CLASS} htmlFor="objection-video-mark">
                Video mark
              </label>
              <input
                className={FIELD_CLASS}
                id="objection-video-mark"
                inputMode="decimal"
                onChange={(event) =>
                  setVideoMarkSeconds(event.target.value === "" ? "" : Number(event.target.value))
                }
                placeholder="Seconds into the replay"
                type="number"
                value={videoMarkSeconds}
              />
            </div>
          </>
        ) : null}

        <div>
          <label className={LABEL_CLASS} htmlFor="objection-severity">
            Severity
          </label>
          <select
            className={FIELD_CLASS}
            id="objection-severity"
            onChange={(event) => setSeverity(event.target.value as "LOW" | "MEDIUM" | "HIGH")}
            value={severity}
          >
            <option value="LOW">Low severity</option>
            <option value="MEDIUM">Medium severity</option>
            <option value="HIGH">High severity</option>
          </select>
        </div>

        <div>
          <label className={LABEL_CLASS} htmlFor="objection-decision">
            Decision
          </label>
          <select
            className={FIELD_CLASS}
            id="objection-decision"
            onChange={(event) => setDecision(event.target.value as ObjectionDecision)}
            value={decision}
          >
            {DECISIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4">
        <label className={LABEL_CLASS} htmlFor="objection-detail">
          Detail
        </label>
        <textarea
          className="mt-1 w-full resize-y rounded-md border border-slate-300 bg-white p-3 text-sm font-semibold text-slate-900 outline-none focus:border-[#007a68] focus:ring-2 focus:ring-[#007a68]/20"
          id="objection-detail"
          onChange={(event) => setDetail(event.target.value)}
          placeholder="What the rider reported, and what the replay showed."
          rows={4}
          value={detail}
        />
      </div>

      {error ? (
        <p className="mt-3 text-sm font-black text-rose-700" role="alert">
          {error}
        </p>
      ) : null}

      <button
        className="mt-4 min-h-11 rounded-md bg-[#007a68] px-4 text-sm font-black text-white transition hover:bg-[#006f5f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007a68]"
        onClick={record}
        type="button"
      >
        Record objection
      </button>
    </div>
  );
}
