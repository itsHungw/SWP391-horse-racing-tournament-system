import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  deleteRaceMedia,
  getRaceMedia,
  reverifyRaceMedia,
} from "../../api/raceMediaApi";
import type { Race, RaceMediaResponse } from "../../types/racing";
import { RaceMediaPanel } from "./RaceMediaPanel";

vi.mock("../../api/raceMediaApi", () => ({
  deleteRaceMedia: vi.fn(),
  getRaceMedia: vi.fn(),
  publishRaceMedia: vi.fn(),
  reverifyRaceMedia: vi.fn(),
  saveRaceMedia: vi.fn(),
  unpublishRaceMedia: vi.fn(),
  validateRaceMedia: vi.fn(),
}));

const race: Race = {
  id: 21,
  tournamentId: 5,
  tournamentName: "Summer Gold Cup",
  name: "Round 4",
  code: "R-4",
  raceDateTime: "2026-07-01T10:20:00",
  distanceMeters: 1200,
  maxParticipants: 8,
  status: "SCHEDULED",
};

const draftLive: RaceMediaResponse = {
  id: 3,
  raceId: 21,
  provider: "YOUTUBE",
  providerVideoId: "M7lc1UVf-VE",
  sourceUrl: "https://www.youtube.com/watch?v=M7lc1UVf-VE",
  embedUrl: "https://www.youtube-nocookie.com/embed/M7lc1UVf-VE",
  title: "Round 4 live",
  providerTitle: "Round 4 live provider",
  thumbnailUrl: null,
  status: "DRAFT",
  verificationStatus: "VERIFIED",
  providerErrorCode: null,
  message: null,
  canPublish: true,
  publishBlockedReason: null,
  lastVerifiedAt: "2026-07-01T09:00:00",
  publishedAt: null,
  publishedByName: null,
  createdAt: "2026-07-01T08:00:00",
  updatedAt: "2026-07-01T09:00:00",
};

describe("RaceMediaPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getRaceMedia).mockResolvedValue(draftLive);
    vi.mocked(reverifyRaceMedia).mockResolvedValue(draftLive);
    vi.mocked(deleteRaceMedia).mockResolvedValue(undefined);
    vi.spyOn(window, "confirm").mockReturnValue(true);
  });

  it("loads and labels the live-stream workspace when kind is live", async () => {
    render(<RaceMediaPanel race={race} scope="organizer" kind="live" defaultOpen />);

    expect(await screen.findByRole("heading", { name: /youtube live/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/youtube live link/i)).toHaveValue(draftLive.sourceUrl);
    expect(screen.getByText(/publish it before the race/i)).toBeInTheDocument();
    expect(getRaceMedia).toHaveBeenCalledWith("organizer", 21, "live");
  });

  it("collapses the media workspace body by default and opens it from the toggle", async () => {
    render(<RaceMediaPanel race={race} scope="organizer" kind="live" />);

    expect(await screen.findByRole("heading", { name: /youtube live/i })).toBeInTheDocument();
    const toggle = screen.getByRole("button", { name: /expand youtube live/i });

    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByLabelText(/youtube live link/i)).not.toBeInTheDocument();

    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByLabelText(/youtube live link/i)).toHaveValue(draftLive.sourceUrl);
  });

  it("uses live-stream actions for reverify and delete", async () => {
    render(<RaceMediaPanel race={race} scope="organizer" kind="live" defaultOpen />);

    await screen.findByRole("heading", { name: /youtube live/i });

    fireEvent.click(screen.getByRole("button", { name: /re-verify/i }));
    await waitFor(() => expect(reverifyRaceMedia).toHaveBeenCalledWith("organizer", 21, "live"));

    fireEvent.click(screen.getByRole("button", { name: /remove/i }));
    await waitFor(() => expect(deleteRaceMedia).toHaveBeenCalledWith("organizer", 21, "live"));
  });
});
