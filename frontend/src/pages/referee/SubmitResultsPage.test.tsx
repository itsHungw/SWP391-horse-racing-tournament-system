import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as refereeApi from "../../api/refereeApi";
import { SubmitResultsPage } from "./SubmitResultsPage";

vi.mock("../../api/refereeApi");

beforeEach(() => {
  vi.restoreAllMocks();
});

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

    fireEvent.change(screen.getByPlaceholderText("1"), { target: { value: "1" } });
    fireEvent.change(screen.getByPlaceholderText("94.25"), { target: { value: "94.5" } });
    fireEvent.click(screen.getAllByRole("button", { name: /submit package to organizer/i })[0]);

    expect(submitSpy).toHaveBeenCalledWith(1, {
      results: [
        {
          ...mockEntries[0],
          position: 1,
          finishTimeSeconds: 94.5,
        },
      ],
      requiresAdminReview: false,
      reviewReason: null,
      reportTitle: "Race Report: R-1",
      reportSummary: "",
    });
  });

  it("allows decimal elapsed time and parses to number on save", async () => {
    vi.spyOn(refereeApi, "getRaceResultEntries").mockResolvedValue(mockEntries);
    const submitSpy = vi.spyOn(refereeApi, "submitRaceResultPackage").mockResolvedValue();

    renderPage();

    expect(await screen.findByText("Submit race results")).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("1"), { target: { value: "1" } });
    const timeInput = screen.getByPlaceholderText("94.25");

    fireEvent.change(timeInput, { target: { value: "94" } });
    expect(timeInput).toHaveValue("94");

    fireEvent.change(timeInput, { target: { value: "94." } });
    expect(timeInput).toHaveValue("94.");

    fireEvent.change(timeInput, { target: { value: "94.25" } });
    expect(timeInput).toHaveValue("94.25");

    fireEvent.click(screen.getAllByRole("button", { name: /submit package to organizer/i })[0]);

    expect(submitSpy).toHaveBeenCalledWith(1, {
      results: [
        {
          participantId: 1,
          horseName: "Thunderstrike",
          jockeyName: "Julian Sterling",
          position: 1,
          finishTimeSeconds: 94.25,
          status: "FINISHED",
        },
      ],
      requiresAdminReview: false,
      reviewReason: null,
      reportTitle: "Race Report: R-1",
      reportSummary: "",
    });
  });

  it("renders read-only once results are already submitted", async () => {
    vi.spyOn(refereeApi, "getRaceResultEntries").mockResolvedValue([
      {
        participantId: 1,
        horseName: "Thunderstrike",
        jockeyName: "Julian Sterling",
        position: 1,
        finishTimeSeconds: 94.5,
        status: "FINISHED" as const,
      },
    ]);
    vi.spyOn(refereeApi, "getAssignedRace").mockResolvedValue({
      id: 1,
      name: "Grand Derby",
      code: "R-1",
      distanceMeters: 1600,
      status: "RESULT_SUBMITTED",
    });

    renderPage();

    expect(await screen.findByText("Submit race results")).toBeInTheDocument();
    expect(
      screen.getByText("Results submitted — awaiting organizer confirmation.")
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText("1")).toBeDisabled();
    expect(screen.getByPlaceholderText("94.25")).toBeDisabled();
    expect(screen.getByRole("combobox")).toBeDisabled();
    expect(screen.queryByRole("button", { name: /submit package to organizer/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /submit for review/i })).not.toBeInTheDocument();
  });

  it("disables position and time inputs for entries that are not finished", async () => {
    vi.spyOn(refereeApi, "getRaceResultEntries").mockResolvedValue([
      {
        participantId: 1,
        horseName: "Thunderstrike",
        jockeyName: "Julian Sterling",
        position: "",
        finishTimeSeconds: "",
        status: "DID_NOT_FINISH",
      },
    ]);
    vi.spyOn(refereeApi, "getAssignedRace").mockResolvedValue({
      id: 1,
      name: "Grand Derby",
      code: "R-1",
      distanceMeters: 1600,
      status: "FINISHED",
    });

    renderPage();

    expect(await screen.findByText("Submit race results")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("1")).toBeDisabled();
    expect(screen.getByPlaceholderText("94.25")).toBeDisabled();
  });

  it("shows a remaining finish order section for more than 3 finished entries", async () => {
    vi.spyOn(refereeApi, "getRaceResultEntries").mockResolvedValue([
      {
        participantId: 1,
        horseName: "Golden Arrow",
        jockeyName: "Mina Park",
        position: 1,
        finishTimeSeconds: 62.345,
        status: "FINISHED",
      },
      {
        participantId: 2,
        horseName: "Night Bloom",
        jockeyName: "Ana Lee",
        position: 2,
        finishTimeSeconds: 63,
        status: "FINISHED",
      },
      {
        participantId: 3,
        horseName: "Silver Comet",
        jockeyName: "Tom Ruiz",
        position: 3,
        finishTimeSeconds: 64,
        status: "FINISHED",
      },
      {
        participantId: 4,
        horseName: "Blue Ridge",
        jockeyName: "Sam Cole",
        position: 4,
        finishTimeSeconds: 65,
        status: "FINISHED",
      },
    ]);
    vi.spyOn(refereeApi, "getAssignedRace").mockResolvedValue({
      id: 1,
      name: "Grand Derby",
      code: "R-1",
      distanceMeters: 1600,
      status: "FINISHED",
    });

    renderPage();

    expect(await screen.findByText("Submit race results")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Remaining finish order" })).toBeInTheDocument();
    expect(screen.getByText("Blue Ridge")).toBeInTheDocument();
    expect(screen.getByText("P4")).toBeInTheDocument();
  });

  it("shows did-not-finish entries in their own section with an editable status dropdown", async () => {
    vi.spyOn(refereeApi, "getRaceResultEntries").mockResolvedValue([
      {
        participantId: 1,
        horseName: "Golden Arrow",
        jockeyName: "Mina Park",
        position: 1,
        finishTimeSeconds: 62.345,
        status: "FINISHED",
      },
      {
        participantId: 5,
        horseName: "Thunderstrike",
        jockeyName: "Julian Sterling",
        position: "",
        finishTimeSeconds: "",
        status: "DID_NOT_FINISH",
      },
    ]);
    vi.spyOn(refereeApi, "getAssignedRace").mockResolvedValue({
      id: 1,
      name: "Grand Derby",
      code: "R-1",
      distanceMeters: 1600,
      status: "FINISHED",
    });

    renderPage();

    expect(await screen.findByText("Submit race results")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Did not finish / disqualified" })).toBeInTheDocument();

    const thunderstrikeRow = screen.getByText("Thunderstrike").closest("article") as HTMLElement;
    expect(within(thunderstrikeRow).getByRole("combobox")).toBeEnabled();
    expect(within(thunderstrikeRow).queryByText(/^P\d+$/)).not.toBeInTheDocument();
  });

  it("orders finished entries by their typed position, not array order", async () => {
    vi.spyOn(refereeApi, "getRaceResultEntries").mockResolvedValue([
      {
        participantId: 1,
        horseName: "Night Bloom",
        jockeyName: "Ana Lee",
        position: 2,
        finishTimeSeconds: 63,
        status: "FINISHED",
      },
      {
        participantId: 2,
        horseName: "Golden Arrow",
        jockeyName: "Mina Park",
        position: 1,
        finishTimeSeconds: 62.345,
        status: "FINISHED",
      },
    ]);
    vi.spyOn(refereeApi, "getAssignedRace").mockResolvedValue({
      id: 1,
      name: "Grand Derby",
      code: "R-1",
      distanceMeters: 1600,
      status: "FINISHED",
    });

    renderPage();

    expect(await screen.findByText("Submit race results")).toBeInTheDocument();
    const horseNames = screen.getAllByText(/^(Night Bloom|Golden Arrow)$/).map((node) => node.textContent);
    expect(horseNames).toEqual(["Golden Arrow", "Night Bloom"]);
  });

  it("locks the form immediately after a successful submit instead of staying editable", async () => {
    vi.spyOn(refereeApi, "getRaceResultEntries").mockResolvedValue(mockEntries);
    vi.spyOn(refereeApi, "getAssignedRace").mockResolvedValue({
      id: 1,
      name: "Grand Derby",
      code: "R-1",
      distanceMeters: 1600,
      status: "FINISHED",
    });
    vi.spyOn(refereeApi, "submitRaceResultPackage").mockResolvedValue();

    renderPage();

    expect(await screen.findByText("Submit race results")).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("1"), { target: { value: "1" } });
    fireEvent.change(screen.getByPlaceholderText("94.25"), { target: { value: "94.5" } });
    fireEvent.click(screen.getAllByRole("button", { name: /submit package to organizer/i })[0]);

    expect(await screen.findByText("Results submitted — awaiting organizer confirmation.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /submit package to organizer/i })).not.toBeInTheDocument();
  });

  function mockFinishedRace() {
    vi.spyOn(refereeApi, "getRaceResultEntries").mockResolvedValue(mockEntries);
    vi.spyOn(refereeApi, "getAssignedRace").mockResolvedValue({
      id: 1,
      name: "Grand Derby",
      code: "R-1",
      distanceMeters: 1600,
      status: "FINISHED",
    });
    vi.spyOn(refereeApi, "getRaceParticipants").mockResolvedValue([
      {
        participantId: 1,
        horseName: "Thunderstrike",
        jockeyName: "Julian Sterling",
        jockeyWeight: 55,
        gearOk: true,
        healthOk: true,
        status: "PASSED",
      },
    ]);
  }

  it("submits recorded objections as violations before submitting the package", async () => {
    mockFinishedRace();
    const violationSpy = vi.spyOn(refereeApi, "submitViolation").mockResolvedValue();
    const submitSpy = vi.spyOn(refereeApi, "submitRaceResultPackage").mockResolvedValue();

    renderPage();

    expect(await screen.findByText("Submit race results")).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText("1"), { target: { value: "1" } });
    fireEvent.change(screen.getByPlaceholderText("94.25"), { target: { value: "94.5" } });

    fireEvent.click(screen.getByRole("radio", { name: /no opposing runner/i }));
    fireEvent.change(screen.getByLabelText("Detail"), { target: { value: "penalty was not justified" } });
    fireEvent.click(screen.getByRole("button", { name: /record objection/i }));

    fireEvent.click(screen.getAllByRole("button", { name: /submit package to organizer/i })[0]);

    await waitFor(() => expect(submitSpy).toHaveBeenCalled());
    expect(violationSpy).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        offenderId: 1,
        violationType: "OBJECTION_GENERAL",
        penalty: "NO_CHANGE",
        severity: "LOW",
      })
    );
  });

  it("sends the official report together with the result package", async () => {
    mockFinishedRace();
    const submitSpy = vi.spyOn(refereeApi, "submitRaceResultPackage").mockResolvedValue();

    renderPage();

    expect(await screen.findByText("Submit race results")).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText("1"), { target: { value: "1" } });
    fireEvent.change(screen.getByPlaceholderText("94.25"), { target: { value: "94.5" } });
    fireEvent.change(screen.getByLabelText("Race summary and observations"), {
      target: { value: "Track clear, one objection dismissed." },
    });
    fireEvent.click(screen.getAllByRole("button", { name: /submit package to organizer/i })[0]);

    await waitFor(() => expect(submitSpy).toHaveBeenCalled());
    expect(submitSpy.mock.calls[0][1].reportSummary).toBe("Track clear, one objection dismissed.");
  });

  it("keeps a recorded objection visible with no way to delete it", async () => {
    mockFinishedRace();

    renderPage();

    expect(await screen.findByText("Submit race results")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("radio", { name: /no opposing runner/i }));
    fireEvent.change(screen.getByLabelText("Detail"), { target: { value: "penalty was not justified" } });
    fireEvent.click(screen.getByRole("button", { name: /record objection/i }));

    expect(screen.getByText(/1 objection recorded/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /remove objection/i })).not.toBeInTheDocument();
  });

  it("pre-fills from the live draft handed over by the race control screen", async () => {
    vi.spyOn(refereeApi, "getRaceResultEntries").mockResolvedValue(mockEntries);
    vi.spyOn(refereeApi, "getRaceParticipants").mockResolvedValue([]);
    vi.spyOn(refereeApi, "getAssignedRace").mockResolvedValue({
      id: 1,
      name: "Grand Derby",
      code: "R-1",
      distanceMeters: 1600,
      status: "FINISHED",
    });

    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: "/referee/races/1/results",
            state: {
              draftEntries: [
                {
                  participantId: 1,
                  horseName: "Thunderstrike",
                  jockeyName: "Julian Sterling",
                  position: 1,
                  rawFinishTimeSeconds: 62.345,
                  penaltySeconds: 0,
                  finishTimeSeconds: 62.345,
                  status: "FINISHED",
                  note: null,
                },
              ],
            },
          },
        ]}
      >
        <Routes>
          <Route path="/referee/races/:id/results" element={<SubmitResultsPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText("Submit race results")).toBeInTheDocument();
    // Live-measured time survives the handoff instead of forcing the referee to retype it.
    expect(screen.getByPlaceholderText("94.25")).toHaveValue("62.345");
    expect(screen.getByPlaceholderText("1")).toHaveValue(1);
  });

  it("explains that the race has not finished instead of claiming results were submitted", async () => {
    vi.spyOn(refereeApi, "getRaceResultEntries").mockResolvedValue(mockEntries);
    vi.spyOn(refereeApi, "getRaceParticipants").mockResolvedValue([]);
    vi.spyOn(refereeApi, "getAssignedRace").mockResolvedValue({
      id: 1,
      name: "Grand Derby",
      code: "R-1",
      distanceMeters: 1600,
      status: "ONGOING",
    });

    renderPage();

    expect(await screen.findByText("This race has not finished yet — results cannot be submitted.")).toBeInTheDocument();
    expect(screen.queryByText("Results already submitted.")).not.toBeInTheDocument();
  });
});
