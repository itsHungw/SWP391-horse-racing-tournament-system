import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ParticipantVerification } from "../../../api/refereeApi";
import { ObjectionForm } from "./ObjectionForm";

const participants: ParticipantVerification[] = [
  {
    participantId: 7,
    horseName: "Aurora Belle",
    jockeyName: "Emma Collins",
    jockeyWeight: 55,
    gearOk: true,
    healthOk: true,
    status: "PASSED",
  },
  {
    participantId: 4,
    horseName: "Midnight Sovereign",
    jockeyName: "Liam Carter",
    jockeyWeight: 56,
    gearOk: true,
    healthOk: true,
    status: "PASSED",
  },
];

describe("ObjectionForm", () => {
  it("requires an accused runner for an interference objection", () => {
    const onRecord = vi.fn();
    render(<ObjectionForm onRecord={onRecord} participants={participants} />);

    fireEvent.change(screen.getByLabelText("Detail"), { target: { value: "crowded at the turn" } });
    fireEvent.click(screen.getByRole("button", { name: /record objection/i }));

    expect(onRecord).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("Select the runner being objected against.");
  });

  it("requires a detail before recording", () => {
    const onRecord = vi.fn();
    render(<ObjectionForm onRecord={onRecord} participants={participants} />);

    fireEvent.change(screen.getByLabelText("Against"), { target: { value: "4" } });
    fireEvent.click(screen.getByRole("button", { name: /record objection/i }));

    expect(onRecord).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("Describe what happened.");
  });

  it("records an interference objection with both parties", () => {
    const onRecord = vi.fn();
    render(<ObjectionForm onRecord={onRecord} participants={participants} />);

    fireEvent.change(screen.getByLabelText("Raised by"), { target: { value: "7" } });
    fireEvent.change(screen.getByLabelText("Against"), { target: { value: "4" } });
    fireEvent.change(screen.getByLabelText("Detail"), { target: { value: "crowded at the turn" } });
    fireEvent.change(screen.getByLabelText("Decision"), { target: { value: "RIDER_PENALTY" } });
    fireEvent.click(screen.getByRole("button", { name: /record objection/i }));

    expect(onRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "OBJECTION_INTERFERENCE",
        raisedByParticipantId: 7,
        raisedByName: "Emma Collins (Aurora Belle)",
        againstParticipantId: 4,
        againstName: "Liam Carter (Midnight Sovereign)",
        detail: "crowded at the turn",
        decision: "RIDER_PENALTY",
      })
    );
  });

  it("switches to the no-opposing-party form and drops the Against field", () => {
    const onRecord = vi.fn();
    render(<ObjectionForm onRecord={onRecord} participants={participants} />);

    fireEvent.click(screen.getByRole("radio", { name: /no opposing runner/i }));

    expect(screen.queryByLabelText("Against")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Foul type")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Subject")).toBeInTheDocument();
  });

  it("records a general objection against the referee's own decision", () => {
    const onRecord = vi.fn();
    render(<ObjectionForm onRecord={onRecord} participants={participants} />);

    fireEvent.click(screen.getByRole("radio", { name: /no opposing runner/i }));
    fireEvent.change(screen.getByLabelText("Subject"), { target: { value: "referee decision" } });
    fireEvent.change(screen.getByLabelText("Detail"), { target: { value: "5s penalty was not justified" } });
    fireEvent.click(screen.getByRole("button", { name: /record objection/i }));

    expect(onRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "OBJECTION_GENERAL",
        raisedByParticipantId: 7,
        subject: "referee decision",
        againstParticipantId: undefined,
      })
    );
  });

  it("clears the detail after recording so the next objection starts empty", () => {
    render(<ObjectionForm onRecord={vi.fn()} participants={participants} />);

    fireEvent.change(screen.getByLabelText("Against"), { target: { value: "4" } });
    fireEvent.change(screen.getByLabelText("Detail"), { target: { value: "crowded at the turn" } });
    fireEvent.click(screen.getByRole("button", { name: /record objection/i }));

    expect(screen.getByLabelText("Detail")).toHaveValue("");
  });
});
