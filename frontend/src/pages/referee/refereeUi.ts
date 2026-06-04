import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  CircleDot,
  ClipboardCheck,
  Flag,
  ListChecks,
  Play,
  Trophy,
} from "lucide-react";
import { AssignedRace } from "./race-day/refereeRaceDayModels";

export type RaceStatusTone = "blue" | "amber" | "emerald" | "rose" | "slate" | "green";

export const raceStatusMeta: Record<
  string,
  {
    label: string;
    description: string;
    tone: RaceStatusTone;
    icon: typeof CalendarClock;
  }
> = {
  SCHEDULED: {
    label: "Scheduled",
    description: "Race card is published and waiting for checks.",
    tone: "blue",
    icon: CalendarClock,
  },
  CHECKING: {
    label: "Checking",
    description: "Pre-race verification is in progress.",
    tone: "amber",
    icon: ClipboardCheck,
  },
  READY: {
    label: "Ready",
    description: "Field is cleared for race start.",
    tone: "emerald",
    icon: CheckCircle2,
  },
  ONGOING: {
    label: "Live",
    description: "Race is currently under officiating control.",
    tone: "rose",
    icon: Play,
  },
  FINISHED: {
    label: "Finished",
    description: "Race has ended and needs result entry.",
    tone: "slate",
    icon: Flag,
  },
  RESULT_SUBMITTED: {
    label: "Review Needed",
    description: "Result package was escalated for admin review.",
    tone: "amber",
    icon: AlertTriangle,
  },
  RESULT_CONFIRMED: {
    label: "Confirmed",
    description: "Result package has been confirmed.",
    tone: "green",
    icon: Trophy,
  },
  PUBLISHED: {
    label: "Confirmed",
    description: "Result package has been confirmed.",
    tone: "green",
    icon: Trophy,
  },
};

export function getRaceStatusMeta(status: string) {
  return (
    raceStatusMeta[status] ?? {
      label: status.replaceAll("_", " ").toLowerCase(),
      description: "Race state is available for review.",
      tone: "slate" as const,
      icon: CircleDot,
    }
  );
}

export function statusChipClasses(status: string) {
  const tone = getRaceStatusMeta(status).tone;

  if (tone === "blue") return "border-sky-200 bg-sky-50 text-sky-800";
  if (tone === "amber") return "border-amber-200 bg-amber-50 text-amber-800";
  if (tone === "emerald") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (tone === "rose") return "border-rose-200 bg-rose-50 text-rose-800";
  if (tone === "green") return "border-green-200 bg-green-50 text-green-800";
  return "border-slate-200 bg-slate-100 text-slate-700";
}

export function statusDotClasses(status: string) {
  const tone = getRaceStatusMeta(status).tone;

  if (tone === "blue") return "bg-sky-500 shadow-[0_0_0_4px_rgba(14,165,233,0.16)]";
  if (tone === "amber") return "bg-amber-500 shadow-[0_0_0_4px_rgba(245,158,11,0.18)]";
  if (tone === "emerald") return "bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.16)]";
  if (tone === "rose") return "bg-rose-500 shadow-[0_0_0_4px_rgba(244,63,94,0.18)]";
  if (tone === "green") return "bg-green-600 shadow-[0_0_0_4px_rgba(22,163,74,0.16)]";
  return "bg-slate-400 shadow-[0_0_0_4px_rgba(100,116,139,0.14)]";
}

export function getRaceAction(race: Pick<AssignedRace, "id" | "status">) {
  if (race.status === "SCHEDULED") {
    return {
      label: "Start checks",
      helper: "Open the pre-race verification workspace.",
      to: `/referee/races/${race.id}/officiate`,
    };
  }

  if (race.status === "CHECKING") {
    return {
      label: "Continue checks",
      helper: "Finish the remaining race-day checks.",
      to: `/referee/races/${race.id}/officiate`,
    };
  }

  if (race.status === "READY") {
    return {
      label: "Open race control",
      helper: "Field is ready. Start the race when cleared.",
      to: `/referee/races/${race.id}/officiate`,
    };
  }

  if (race.status === "ONGOING") {
    return {
      label: "Control live race",
      helper: "Monitor race state and incidents.",
      to: `/referee/races/${race.id}/officiate`,
    };
  }

  if (race.status === "FINISHED") {
    return {
      label: "Submit results",
      helper: "Record finish order and race notes.",
      to: `/referee/races/${race.id}/results`,
    };
  }

  if (race.status === "RESULT_SUBMITTED") {
    return {
      label: "View package",
      helper: "This result is waiting for admin review.",
      to: `/referee/races/${race.id}/report`,
    };
  }

  return {
    label: "View details",
    helper: "Review confirmed race data.",
    to: `/referee/races/${race.id}/report`,
  };
}

export function formatRaceTime(value: string) {
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function formatRaceDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

export function getNextRace(races: AssignedRace[], now = new Date()) {
  const activeStatuses = ["SCHEDULED", "CHECKING", "READY", "ONGOING", "FINISHED", "RESULT_SUBMITTED"];
  const timestamp = now.getTime();

  return [...races]
    .filter((race) => activeStatuses.includes(race.status))
    .sort((left, right) => {
      const leftTime = new Date(left.scheduledAt).getTime();
      const rightTime = new Date(right.scheduledAt).getTime();
      const leftDistance = leftTime >= timestamp ? leftTime - timestamp : Math.abs(leftTime - timestamp) + 1_000_000_000;
      const rightDistance = rightTime >= timestamp ? rightTime - timestamp : Math.abs(rightTime - timestamp) + 1_000_000_000;
      return leftDistance - rightDistance;
    })[0];
}

export function countRaceStatuses(races: AssignedRace[]) {
  return {
    checks: races.filter((race) => race.status === "SCHEDULED" || race.status === "CHECKING").length,
    ready: races.filter((race) => race.status === "READY").length,
    live: races.filter((race) => race.status === "ONGOING").length,
    results: races.filter((race) => race.status === "FINISHED").length,
    review: races.filter((race) => race.status === "RESULT_SUBMITTED").length,
    confirmed: races.filter((race) => race.status === "RESULT_CONFIRMED" || race.status === "PUBLISHED").length,
  };
}
