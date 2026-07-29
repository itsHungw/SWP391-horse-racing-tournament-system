import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { searchPublicTournaments } from "../../api/racingApi";
import type { TournamentSummary } from "../../types/racing";
import { ChampionshipsPage } from "./ChampionshipsPage";

vi.mock("../../api/racingApi", () => ({ searchPublicTournaments: vi.fn() }));

const liveChampionship: TournamentSummary = {
  id: 2,
  name: "Belmont Summer Championship",
  code: "BEL-26",
  description: "The season's premier summer programme.",
  location: "Belmont Park",
  startDate: "2026-06-10",
  endDate: "2026-07-20",
  status: "ONGOING",
  raceCount: 8,
  participantCount: 32,
  nextRace: { id: 22, name: "Round 3", raceDateTime: "2099-06-15T14:00:00", status: "SCHEDULED" },
};

describe("ChampionshipsPage", () => {
  beforeEach(() => {
    vi.mocked(searchPublicTournaments).mockResolvedValue({
      content: [liveChampionship],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 12,
    });
  });

  it("shows one season priority and status-first discovery controls", async () => {
    render(
      <MemoryRouter>
        <ChampionshipsPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText("Season Priority")).toBeInTheDocument();
    expect(screen.getAllByText(liveChampionship.name).length).toBeGreaterThan(0);
    expect(screen.getByRole("searchbox", { name: /search championships/i })).toBeInTheDocument();
    // Bộ lọc là radiogroup (chọn một-trong-nhiều), không phải nhóm toggle button.
    expect(screen.getByRole("radio", { name: "Running now" })).toHaveAttribute("aria-checked", "false");
    expect(screen.getByRole("radio", { name: "All" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("radiogroup", { name: "Championship status filters" })).not.toHaveClass("overflow-x-auto");
    fireEvent.click(screen.getByRole("radio", { name: "Running now" }));
    expect(screen.getByRole("radio", { name: "Running now" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("radio", { name: "All" })).toHaveAttribute("aria-checked", "false");
    // Roving tabindex: cả bộ chỉ có đúng một điểm dừng Tab.
    expect(
      screen.getAllByRole("radio").filter((radio) => radio.getAttribute("tabindex") === "0"),
    ).toHaveLength(1);
    expect(screen.queryByRole("region", { name: /championships in focus/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/championship calendar/i)).not.toBeInTheDocument();
  });

  it("moves between status filters with the arrow keys and wraps at the ends", async () => {
    render(
      <MemoryRouter>
        <ChampionshipsPage />
      </MemoryRouter>,
    );

    const group = await screen.findByRole("radiogroup", { name: "Championship status filters" });
    const radios = () => screen.getAllByRole("radio");
    const checked = () => radios().find((radio) => radio.getAttribute("aria-checked") === "true");

    expect(checked()).toHaveAccessibleName("All");

    fireEvent.keyDown(checked()!, { key: "ArrowRight" });
    expect(checked()).toHaveAccessibleName("Running now");
    // Focus phải đi theo lựa chọn, nếu không người dùng bàn phím mất dấu con trỏ.
    expect(checked()).toHaveFocus();

    fireEvent.keyDown(checked()!, { key: "ArrowLeft" });
    expect(checked()).toHaveAccessibleName("All");

    // Từ phần tử đầu, ArrowLeft phải quay vòng về cuối.
    fireEvent.keyDown(checked()!, { key: "ArrowLeft" });
    expect(checked()).toHaveAccessibleName("Completed");

    fireEvent.keyDown(checked()!, { key: "Home" });
    expect(checked()).toHaveAccessibleName("All");

    fireEvent.keyDown(checked()!, { key: "End" });
    expect(checked()).toHaveAccessibleName("Completed");

    // Roving tabindex: dù chọn cái nào, cả bộ vẫn chỉ chiếm một điểm dừng Tab.
    expect(group.querySelectorAll('[role="radio"][tabindex="0"]')).toHaveLength(1);
  });
});
