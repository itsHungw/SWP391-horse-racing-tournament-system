import type { StreakPredictionResponse } from "./types/prediction.types";

export function sortStreaksNewestFirst(
  streaks: readonly StreakPredictionResponse[],
): StreakPredictionResponse[] {
  return [...streaks].sort((left, right) => {
    const leftTime = Date.parse(left.createdAt);
    const rightTime = Date.parse(right.createdAt);

    if (Number.isFinite(leftTime) && Number.isFinite(rightTime) && leftTime !== rightTime) {
      return rightTime - leftTime;
    }

    return right.id - left.id;
  });
}
