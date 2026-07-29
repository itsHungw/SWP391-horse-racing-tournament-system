import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import * as racingApi from "../../api/racingApi";
import { RaceReviewPackagePanel } from "./RaceReviewPackagePanel";

vi.mock("../../api/racingApi");

describe("RaceReviewPackagePanel", () => {
  it("shows an objection count and the referee's decision before ratification", async () => {
    vi.spyOn(racingApi, "getOrganizerReviewPackage").mockResolvedValue({
      reportTitle: "Race Report: R-3",
      reportSummary: "Track clear.",
      returnedReason: null,
      incidents: [
        {
          id: 1,
          violationType: "OBJECTION_INTERFERENCE",
          participantId: 4,
          horseName: "Midnight Sovereign",
          jockeyName: "Liam Carter",
          description: "[Objection] Emma Collins (Aurora Belle) vs Liam Carter (Midnight Sovereign)",
          penalty: "RIDER_PENALTY",
          severity: "HIGH",
          occurredAt: "2026-07-29T02:10:00",
        },
      ],
    });

    render(<RaceReviewPackagePanel raceId={3} />);

    expect(await screen.findByText("1 objection")).toBeInTheDocument();
    expect(screen.getByText("Rider penalty, result stands")).toBeInTheDocument();
    expect(screen.getByText("Track clear.")).toBeInTheDocument();
  });

  it("surfaces an objection aimed at the referee so the organizer can send the package back", async () => {
    vi.spyOn(racingApi, "getOrganizerReviewPackage").mockResolvedValue({
      reportTitle: null,
      reportSummary: null,
      returnedReason: null,
      incidents: [
        {
          id: 2,
          violationType: "OBJECTION_GENERAL",
          participantId: 7,
          horseName: "Aurora Belle",
          jockeyName: "Emma Collins",
          description: "[Objection] Emma Collins (Aurora Belle) — target: referee decision",
          penalty: "NO_CHANGE",
          severity: "MEDIUM",
          occurredAt: "2026-07-29T02:12:00",
        },
      ],
    });

    render(<RaceReviewPackagePanel raceId={3} />);

    expect(await screen.findByText("1 objection")).toBeInTheDocument();
    expect(screen.getByText(/target: referee decision/)).toBeInTheDocument();
  });

  it("renders nothing when the race has no incidents and no report", async () => {
    vi.spyOn(racingApi, "getOrganizerReviewPackage").mockResolvedValue({
      reportTitle: null,
      reportSummary: null,
      returnedReason: null,
      incidents: [],
    });

    const { container } = render(<RaceReviewPackagePanel raceId={3} />);

    await vi.waitFor(() => expect(racingApi.getOrganizerReviewPackage).toHaveBeenCalled());
    expect(container.querySelectorAll("section")).toHaveLength(0);
  });
});
