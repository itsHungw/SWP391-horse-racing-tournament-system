import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import * as refereeApi from "../../api/refereeApi";
import { SubmitResultsPage } from "./SubmitResultsPage";

vi.mock("../../api/refereeApi");

const mockEntries = [
  {
    participantId: 1,
    horseName: "Thunderstrike",
    jockeyName: "Julian Sterling",
    position: "" as const,
    finishTimeSeconds: "" as const,
    status: "FINISHED" as const,
  },
];

function renderPage() {
  render(
    <MemoryRouter initialEntries={["/referee/races/1/results"]}>
      <Routes>
        <Route path="/referee/races/:id/results" element={<SubmitResultsPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("SubmitResultsPage", () => {
  it("renders result package form and confirms the normal path", async () => {
    vi.spyOn(refereeApi, "getRaceResultEntries").mockResolvedValue(mockEntries);
    const submitSpy = vi.spyOn(refereeApi, "submitRaceResultPackage").mockResolvedValue();

    renderPage();

    expect(await screen.findByText("Submit race results")).toBeInTheDocument();
    expect(screen.getByText("Thunderstrike")).toBeInTheDocument();
    expect(screen.getByText("Julian Sterling")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /confirm result package/i }));

    expect(submitSpy).toHaveBeenCalledWith(1, {
      results: mockEntries,
      requiresAdminReview: false,
      reviewReason: null,
    });
  });

  it("allows decimal elapsed time and parses to number on save", async () => {
    vi.spyOn(refereeApi, "getRaceResultEntries").mockResolvedValue(mockEntries);
    const submitSpy = vi.spyOn(refereeApi, "submitRaceResultPackage").mockResolvedValue();

    renderPage();

    expect(await screen.findByText("Submit race results")).toBeInTheDocument();

    const timeInput = screen.getByPlaceholderText("94.25");

    fireEvent.change(timeInput, { target: { value: "94" } });
    expect(timeInput).toHaveValue("94");

    fireEvent.change(timeInput, { target: { value: "94." } });
    expect(timeInput).toHaveValue("94.");

    fireEvent.change(timeInput, { target: { value: "94.25" } });
    expect(timeInput).toHaveValue("94.25");

    fireEvent.click(screen.getByRole("button", { name: /confirm result package/i }));

    expect(submitSpy).toHaveBeenCalledWith(1, {
      results: [
        {
          participantId: 1,
          horseName: "Thunderstrike",
          jockeyName: "Julian Sterling",
          position: "",
          finishTimeSeconds: 94.25,
          status: "FINISHED",
        },
      ],
      requiresAdminReview: false,
      reviewReason: null,
    });
  });
});
