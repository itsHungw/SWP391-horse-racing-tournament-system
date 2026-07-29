import { useEffect, useState } from "react";
import { getOrganizerReviewPackage, RaceReviewPackage } from "../../api/racingApi";
import { OBJECTION_DECISION_LABELS, ObjectionDecision } from "../../api/refereeApi";

/**
 * BR-16: Ban tổ chức duyệt cả hồ sơ, không chỉ thứ hạng.
 *
 * Khiếu nại đã được trọng tài xử lý xong tại chỗ nên panel này KHÔNG khoá nút Confirm —
 * nó chỉ đảm bảo BTC nhìn thấy trước khi chốt, kể cả khiếu nại nhắm vào chính trọng tài.
 */
export function RaceReviewPackagePanel({ raceId }: { raceId: number }) {
  const [pkg, setPkg] = useState<RaceReviewPackage | null>(null);

  useEffect(() => {
    let active = true;
    getOrganizerReviewPackage(raceId)
      .then((data) => active && setPkg(data))
      .catch(() => active && setPkg(null));
    return () => {
      active = false;
    };
  }, [raceId]);

  if (!pkg) return null;

  const objections = pkg.incidents.filter((incident) => incident.violationType?.startsWith("OBJECTION"));
  const otherIncidents = pkg.incidents.filter((incident) => !incident.violationType?.startsWith("OBJECTION"));

  return (
    <div className="space-y-3">
      {objections.length > 0 ? (
        <section className="rounded-lg border border-amber-300 bg-amber-50 p-4">
          <p className="text-sm font-black text-amber-900">
            {objections.length} objection{objections.length === 1 ? "" : "s"}
          </p>
          <ul className="mt-3 space-y-2">
            {objections.map((objection) => (
              <li className="rounded-md bg-white px-3 py-2" key={objection.id}>
                <p className="text-xs font-black text-slate-950">
                  {objection.horseName ?? "Unknown horse"}
                  {objection.jockeyName ? ` — ${objection.jockeyName}` : ""}
                </p>
                <p className="mt-1 whitespace-pre-line text-xs font-semibold text-slate-600">
                  {objection.description}
                </p>
                <p className="mt-1 text-[10px] font-black uppercase tracking-wider text-amber-800">
                  {OBJECTION_DECISION_LABELS[objection.penalty as ObjectionDecision] ??
                    objection.penalty ??
                    "No decision recorded"}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {otherIncidents.length > 0 ? (
        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-sm font-black text-slate-950">
            {otherIncidents.length} race incident{otherIncidents.length === 1 ? "" : "s"}
          </p>
          <ul className="mt-2 space-y-1">
            {otherIncidents.map((incident) => (
              <li className="text-xs font-semibold text-slate-600" key={incident.id}>
                {incident.horseName ? `${incident.horseName}: ` : ""}
                {incident.description}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {pkg.reportSummary ? (
        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-sm font-black text-slate-950">Referee report</p>
          <p className="mt-2 whitespace-pre-line text-xs font-semibold text-slate-600">{pkg.reportSummary}</p>
        </section>
      ) : null}
    </div>
  );
}
