import { describe, expect, it } from "vitest";
import { sortStreaksNewestFirst } from "./streakHistoryUtils";
import type { StreakPredictionResponse } from "./types/prediction.types";

function streak(id: number, createdAt: string): StreakPredictionResponse {
  return {
    id,
    tournamentId: 1,
    wagerAmount: 10_000,
    totalOdds: 3.5,
    status: "PENDING",
    rewardPoints: 0,
    createdAt,
    legs: [],
  };
}

describe("sortStreaksNewestFirst", () => {
  it("sorts by createdAt descending without mutating API state", () => {
    const source = [
      streak(1, "2026-06-01T10:00:00Z"),
      streak(3, "2026-06-03T10:00:00Z"),
      streak(2, "2026-06-02T10:00:00Z"),
    ];

    expect(sortStreaksNewestFirst(source).map((item) => item.id)).toEqual([3, 2, 1]);
    expect(source.map((item) => item.id)).toEqual([1, 3, 2]);
  });

  it("uses descending id when timestamps are equal or invalid", () => {
    expect(sortStreaksNewestFirst([
      streak(7, "invalid"),
      streak(9, "invalid"),
      streak(8, "invalid"),
    ]).map((item) => item.id)).toEqual([9, 8, 7]);

    expect(sortStreaksNewestFirst([
      streak(4, "2026-06-01T10:00:00Z"),
      streak(5, "2026-06-01T10:00:00Z"),
    ]).map((item) => item.id)).toEqual([5, 4]);
  });
});
