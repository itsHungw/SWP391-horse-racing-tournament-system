import { describe, expect, it } from "vitest";
import { buildObjectionDescription } from "./refereeApi";

describe("buildObjectionDescription", () => {
  it("composes an interference objection with both parties and the video mark", () => {
    expect(
      buildObjectionDescription({
        kind: "OBJECTION_INTERFERENCE",
        raisedByName: "Emma Collins (Aurora Belle)",
        againstName: "Liam Carter (Midnight Sovereign)",
        foulType: "interference",
        videoMarkSeconds: 47,
        detail: "crowded at the turn",
        decision: "RIDER_PENALTY",
      })
    ).toBe(
      "[Objection] Emma Collins (Aurora Belle) vs Liam Carter (Midnight Sovereign)\n" +
        "Foul: interference — video mark 47s\n" +
        "Detail: crowded at the turn\n" +
        "Decision: RIDER_PENALTY"
    );
  });

  it("omits the video mark when the referee did not record one", () => {
    expect(
      buildObjectionDescription({
        kind: "OBJECTION_INTERFERENCE",
        raisedByName: "Emma Collins (Aurora Belle)",
        againstName: "Liam Carter (Midnight Sovereign)",
        foulType: "contact",
        videoMarkSeconds: "",
        detail: "bumped on the straight",
        decision: "NO_CHANGE",
      })
    ).toContain("Foul: contact\n");
  });

  it("composes a general objection without an accused runner", () => {
    expect(
      buildObjectionDescription({
        kind: "OBJECTION_GENERAL",
        raisedByName: "Emma Collins (Aurora Belle)",
        subject: "referee decision",
        detail: "5s penalty was not justified",
        decision: "NO_CHANGE",
      })
    ).toBe(
      "[Objection] Emma Collins (Aurora Belle) — target: referee decision\n" +
        "Detail: 5s penalty was not justified\n" +
        "Decision: NO_CHANGE"
    );
  });
});
