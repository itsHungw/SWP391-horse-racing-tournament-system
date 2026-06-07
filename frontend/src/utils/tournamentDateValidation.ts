export interface TournamentDateFields {
  startDate: string;
  endDate: string;
  registrationStartAt: string;
  registrationEndAt: string;
}

export function getTournamentDateValidationError(
  dates: TournamentDateFields,
  now = new Date(),
): string | null {
  const tournamentStart = new Date(`${dates.startDate}T00:00`);
  const tournamentEnd = new Date(`${dates.endDate}T00:00`);
  const registrationStart = new Date(dates.registrationStartAt);
  const registrationEnd = new Date(dates.registrationEndAt);

  if (tournamentEnd < tournamentStart) {
    return "Championship end date cannot be before start date.";
  }

  if (registrationStart < now) {
    return "Registration start time cannot be in the past.";
  }

  if (registrationEnd < registrationStart) {
    return "Registration end time cannot be before start time.";
  }

  if (registrationEnd >= tournamentStart) {
    return "Registration end time must be before championship start date.";
  }

  return null;
}
