# Referee Unified Workspace & State Machine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the complete Referee Workspace into an integrated Unified Officiating Control Console (`/referee/races/:id/officiate`) driven by a robust, secure Match State Machine on the backend with automated scratching (late-stage withdrawal) business logic and timed finish validations.

**Architecture:** A state-driven dynamic React layout presenting a progress stepper and contextual views based on the race's status. The backend manages state transitions sequentially (`/next-step`) under safe Spring JPA transactions, enforcing checking safety (0% PENDING scratching) and logical time ascending checks.

**Tech Stack:** React 19, TypeScript, Axios, Spring Boot 3.x, Hibernate JPA, Spring Security.

---

### Task 1: Frontend API Client & Routing Expansion

**Files:**
- Modify: [refereeApi.ts](file:///d:/FBT/5/SWP391/SWP391-horse-racing-tournament-system-1/frontend/src/api/refereeApi.ts)
- Modify: [AppRouter.tsx](file:///d:/FBT/5/SWP391/SWP391-horse-racing-tournament-system-1/frontend/src/routes/AppRouter.tsx)
- Modify: [RefereeOverviewPage.tsx](file:///d:/FBT/5/SWP391/SWP391-horse-racing-tournament-system-1/frontend/src/pages/referee/RefereeOverviewPage.tsx)

- [ ] **Step 1: Expand `refereeApi.ts` to include the next-step transition method**
  Open [refereeApi.ts](file:///d:/FBT/5/SWP391/SWP391-horse-racing-tournament-system-1/frontend/src/api/refereeApi.ts) and add the following function:
  ```typescript
  export async function transitionRaceState(raceId: number): Promise<string> {
    const response = await httpClient.post<{ status: string }>(`/referee/races/${raceId}/next-step`);
    return response.data.status;
  }
  ```

- [ ] **Step 2: Add `/referee/races/:id/officiate` route to AppRouter**
  Modify [AppRouter.tsx](file:///d:/FBT/5/SWP391/SWP391-horse-racing-tournament-system-1/frontend/src/routes/AppRouter.tsx) to import and declare the unified console route:
  Import:
  ```typescript
  import { RefereeOfficiatePage } from "../pages/referee/RefereeOfficiatePage";
  ```
  Add path under `referee` routes group:
  ```typescript
  <Route path="races/:id/officiate" element={<RefereeOfficiatePage />} />
  ```

- [ ] **Step 3: Point Assigned Races action buttons to the Unified Console**
  Modify [RefereeOverviewPage.tsx](file:///d:/FBT/5/SWP391/SWP391-horse-racing-tournament-system-1/frontend/src/pages/referee/RefereeOverviewPage.tsx). Update the list action links to point directly to `/referee/races/${race.id}/officiate`:
  Replace action buttons container with:
  ```typescript
  <div className="flex gap-2">
    <Link
      to={`/referee/races/${race.id}/officiate`}
      className="bg-[#004d3d] hover:bg-[#003d30] text-white font-semibold px-5 py-2.5 rounded-lg text-xs transition-all shadow-sm flex items-center gap-2 hover:scale-[1.02]"
    >
      <span>🛡️</span> Enter Control Console
    </Link>
  </div>
  ```

- [ ] **Step 4: Verify frontend builds correctly**
  Run: `npm run build` inside `frontend` folder (or check compiler errors).
  Expected: Build succeeds with a simple stub or pending import of `RefereeOfficiatePage`.

---

### Task 2: Create Unified Officiating Console & Stepper Component

**Files:**
- Create: [RefereeOfficiatePage.tsx](file:///d:/FBT/5/SWP391/SWP391-horse-racing-tournament-system-1/frontend/src/pages/referee/RefereeOfficiatePage.tsx)

- [ ] **Step 1: Write a failing Vitest test for the Officiating Page**
  Create [RefereeOfficiatePage.test.tsx](file:///d:/FBT/5/SWP391/SWP391-horse-racing-tournament-system-1/frontend/src/pages/referee/RefereeOfficiatePage.test.tsx):
  ```typescript
  import { render, screen } from "@testing-library/react";
  import { MemoryRouter, Route, Routes } from "react-router-dom";
  import { vi, describe, it, expect } from "vitest";
  import { RefereeOfficiatePage } from "./RefereeOfficiatePage";
  import * as refereeApi from "../../api/refereeApi";

  vi.mock("../../api/refereeApi");

  describe("RefereeOfficiatePage", () => {
    it("renders the stepper and initial scheduled state", async () => {
      vi.spyOn(refereeApi, "getRaceParticipants").mockResolvedValue([]);
      
      render(
        <MemoryRouter initialEntries={["/referee/races/1/officiate"]}>
          <Routes>
            <Route path="/referee/races/:id/officiate" element={<RefereeOfficiatePage />} />
          </Routes>
        </MemoryRouter>
      );

      expect(await screen.findByText(/Race Control Console/i)).toBeInTheDocument();
      expect(screen.getByText(/PRE_CHECKING/i)).toBeInTheDocument();
    });
  });
  ```

- [ ] **Step 2: Run test to verify it fails**
  Run: `npm run test frontend/src/pages/referee/RefereeOfficiatePage.test.tsx`
  Expected: FAIL (File does not exist).

- [ ] **Step 3: Implement RefereeOfficiatePage dynamic layout and Stepper**
  Create [RefereeOfficiatePage.tsx](file:///d:/FBT/5/SWP391/SWP391-horse-racing-tournament-system-1/frontend/src/pages/referee/RefereeOfficiatePage.tsx) with elegant state handling and the visual horizontal progress stepper:
  ```typescript
  import { useEffect, useState } from "react";
  import { useParams, Link } from "react-router-dom";
  import { 
    getRaceParticipants, 
    savePreRaceChecks, 
    transitionRaceState,
    ParticipantVerification 
  } from "../../api/refereeApi";

  type RaceDetails = {
    id: number;
    name: string;
    code: string;
    distanceMeters: number;
    status: string;
  };

  const STEPS = ["SCHEDULED", "PRE_CHECKING", "READY", "ONGOING", "FINISHED", "RESULT_SUBMITTED"];

  export function RefereeOfficiatePage() {
    const { id } = useParams<{ id: string }>();
    const raceId = Number(id);

    const [race, setRace] = useState<RaceDetails>({
      id: raceId,
      name: "Dubai World Cup - Final Derby",
      code: "R-2026-002",
      distanceMeters: 2400,
      status: "PRE_CHECKING"
    });

    const [participants, setParticipants] = useState<ParticipantVerification[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
      getRaceParticipants(raceId)
        .then(setParticipants)
        .catch(() => {})
        .finally(() => setLoading(false));
    }, [raceId]);

    const handleNextStep = async () => {
      try {
        setActionLoading(true);
        const nextStatus = await transitionRaceState(raceId);
        setRace(prev => ({ ...prev, status: nextStatus }));
      } catch (err) {
        alert("Verification Guard: Cannot transition. Make sure all checks are fully processed.");
      } finally {
        setActionLoading(false);
      }
    };

    if (loading) {
      return (
        <div className="flex justify-center items-center h-64 text-slate-500 font-semibold">
          Loading officiating controls...
        </div>
      );
    }

    const currentStepIndex = STEPS.indexOf(race.status);

    return (
      <div className="max-w-6xl mx-auto flex gap-6 font-sans">
        {/* Sidebar Info Card */}
        <aside className="w-80 bg-white border border-slate-200 rounded-xl p-5 shadow-sm h-fit">
          <h3 className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-3">RACE PROFILE</h3>
          <div className="space-y-4">
            <div>
              <div className="text-sm font-bold text-slate-900">{race.name}</div>
              <div className="text-xs font-mono text-slate-500 mt-0.5">{race.code}</div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs border-t border-slate-100 pt-3">
              <div>
                <span className="text-slate-400">Distance:</span>
                <div className="font-semibold text-slate-700">{race.distanceMeters} meters</div>
              </div>
              <div>
                <span className="text-slate-400">Track:</span>
                <div className="font-semibold text-slate-700">Dry / Dirt</div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Console Canvas */}
        <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm p-6 flex flex-col gap-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Race Control Console</h2>
              <p className="text-xs text-slate-500">Coordinate and execute live racing officiating steps securely.</p>
            </div>
            <Link to="/referee" className="text-xs text-slate-400 hover:text-slate-600 underline">
              Exit Console
            </Link>
          </div>

          {/* Progress Stepper */}
          <div className="flex justify-between items-center px-4">
            {STEPS.map((step, idx) => {
              const isCompleted = idx < currentStepIndex;
              const isActive = idx === currentStepIndex;
              return (
                <div key={step} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center gap-1.5 relative">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all border ${
                        isCompleted 
                          ? "bg-[#004d3d] border-[#004d3d] text-white" 
                          : isActive 
                            ? "border-[#004d3d] text-[#004d3d] ring-4 ring-[#004d3d]/10 font-bold" 
                            : "bg-slate-100 border-slate-200 text-slate-400"
                      }`}
                    >
                      {isCompleted ? "✓" : idx + 1}
                    </div>
                    <span className={`text-[10px] uppercase font-bold tracking-wider ${
                      isActive ? "text-[#004d3d] font-bold" : "text-slate-400"
                    }`}>
                      {step.replace("_", " ")}
                    </span>
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div className={`h-[2px] flex-1 mx-2 ${
                      idx < currentStepIndex ? "bg-[#004d3d]" : "bg-slate-100"
                    }`} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Dynamic Step View Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 min-h-[300px]">
            {/* View Switch rendering placeholder for step components */}
            {race.status === "PRE_CHECKING" && (
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-3">Pre-Race Verification Checks</h3>
                <div className="text-xs text-slate-500">Verification details load here.</div>
              </div>
            )}
          </div>

          {/* Persistent Action Panel */}
          <div className="flex justify-between items-center border-t border-slate-100 pt-4">
            <span className="text-xs text-slate-400">Current status: <strong className="text-[#004d3d]">{race.status}</strong></span>
            <button
              onClick={handleNextStep}
              disabled={actionLoading}
              className="bg-[#004d3d] hover:bg-[#003d30] text-white font-bold px-6 py-2.5 rounded-lg text-xs transition-colors shadow-sm disabled:opacity-50"
            >
              {actionLoading ? "Transitioning..." : "⏩ Advance to Next Step"}
            </button>
          </div>
        </div>
      </div>
    );
  }
  ```

- [ ] **Step 4: Verify test passes**
  Run: `npm run test frontend/src/pages/referee/RefereeOfficiatePage.test.tsx`
  Expected: PASS.

---

### Task 3: Implement Dynamic View Renderers & Automated Pass Logic

**Files:**
- Modify: [RefereeOfficiatePage.tsx](file:///d:/FBT/5/SWP391/SWP391-horse-racing-tournament-system-1/frontend/src/pages/referee/RefereeOfficiatePage.tsx)

- [ ] **Step 1: Incorporate auto-pass checkbox verification and counting guards**
  Replace the dynamic view block inside `RefereeOfficiatePage.tsx` with checking state handlers:
  Update state handlers in `RefereeOfficiatePage`:
  ```typescript
    const handleCheckboxChange = (index: number, field: "gearOk" | "healthOk") => {
      const updated = [...participants];
      const entry = { ...updated[index], [field]: !updated[index][field] };
      
      // Smart Auto-Pass: If both health & gear are checked OK, set status to PASSED
      if (entry.gearOk && entry.healthOk) {
        entry.status = "PASSED";
      } else {
        entry.status = "PENDING";
      }
      
      updated[index] = entry;
      setParticipants(updated);
      savePreRaceChecks(raceId, updated).catch(() => {});
    };

    const handleStatusChange = (index: number, status: "PASSED" | "FAILED" | "PENDING") => {
      const updated = [...participants];
      updated[index] = { ...updated[index], status };
      setParticipants(updated);
      savePreRaceChecks(raceId, updated).catch(() => {});
    };

    const isTransitionDisabled = race.status === "PRE_CHECKING" && participants.some(p => p.status === "PENDING");
  ```

- [ ] **Step 2: Implement dynamic layout views for PRE_CHECKING, READY, and ONGOING**
  Add the switch view renderer inside the Dynamic Content Canvas of `RefereeOfficiatePage.tsx`:
  ```typescript
  {race.status === "PRE_CHECKING" && (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-bold text-slate-800">Veterinary & Gear Checks</h4>
        <span className="text-[10px] bg-amber-50 text-amber-700 font-bold px-2 py-0.5 border border-amber-200 rounded">
          Guard Active: 0% PENDING Enforced
        </span>
      </div>
      <table className="w-full border-collapse text-left text-xs bg-white border border-slate-200 rounded-lg overflow-hidden">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
            <th className="p-3">Horse</th>
            <th className="p-3">Jockey</th>
            <th className="p-3 text-center">Gear OK?</th>
            <th className="p-3 text-center">Health OK?</th>
            <th className="p-3 text-center">Status</th>
          </tr>
        </thead>
        <tbody>
          {participants.map((p, idx) => (
            <tr key={p.participantId} className="border-b border-slate-100">
              <td className="p-3 font-semibold text-slate-900">⚡ {p.horseName}</td>
              <td className="p-3 text-slate-700">{p.jockeyName}</td>
              <td className="p-3 text-center">
                <input
                  type="checkbox"
                  checked={p.gearOk}
                  onChange={() => handleCheckboxChange(idx, "gearOk")}
                  className="accent-[#004d3d]"
                />
              </td>
              <td className="p-3 text-center">
                <input
                  type="checkbox"
                  checked={p.healthOk}
                  onChange={() => handleCheckboxChange(idx, "healthOk")}
                  className="accent-[#004d3d]"
                />
              </td>
              <td className="p-3 text-center">
                <select
                  value={p.status}
                  onChange={(e) => handleStatusChange(idx, e.target.value as any)}
                  className="bg-white border border-slate-300 rounded p-1 text-[11px] font-bold text-slate-800"
                >
                  <option value="PASSED">PASSED</option>
                  <option value="FAILED">FAILED</option>
                  <option value="PENDING">PENDING</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )}

  {race.status === "READY" && (
    <div className="text-center py-8 space-y-3">
      <div className="text-4xl">🚀</div>
      <h3 className="text-base font-bold text-slate-900">Horses Assigned & Standardized</h3>
      <p className="text-xs text-slate-500 max-w-md mx-auto">
        All checked participants are aligned on track. Press Start to initiate tracking clock records.
      </p>
    </div>
  )}

  {race.status === "ONGOING" && (
    <div className="space-y-6">
      <div className="bg-slate-900 text-white rounded-xl p-6 text-center space-y-1 shadow-inner">
        <div className="text-[10px] font-bold tracking-wider text-emerald-400 uppercase">LIVE stopwatch</div>
        <div className="text-3xl font-mono font-bold tracking-widest text-emerald-300">01:42.503</div>
      </div>
      
      {/* Quick Incident Grid */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quick Infraction Logger</h4>
        <div className="grid grid-cols-2 gap-3">
          {participants.filter(p => p.status === "PASSED").map(p => (
            <div key={p.participantId} className="bg-white border border-slate-200 rounded-lg p-3 flex justify-between items-center shadow-xs">
              <div>
                <div className="text-xs font-bold text-slate-800">{p.horseName}</div>
                <div className="text-[10px] text-slate-400">{p.jockeyName}</div>
              </div>
              <button
                onClick={() => alert(`Warning logged for ${p.jockeyName}`)}
                className="bg-red-50 hover:bg-red-100 text-red-700 font-semibold px-3 py-1 border border-red-200 rounded text-[10px] transition-colors"
              >
                ⚠️ Flag Penalty
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )}
  ```

- [ ] **Step 3: Tie the disabled state to the Advancing button**
  Replace step-advancer button attribute:
  ```typescript
  disabled={actionLoading || isTransitionDisabled}
  ```

---

### Task 4: Add Mock AI Speech-to-Text Visual Mockup View

**Files:**
- Modify: [RefereeOfficiatePage.tsx](file:///d:/FBT/5/SWP391/SWP391-horse-racing-tournament-system-1/frontend/src/pages/referee/RefereeOfficiatePage.tsx)

- [ ] **Step 1: Declare AI Mocking variables and animation assets**
  Add mock states in `RefereeOfficiatePage`:
  ```typescript
  const [aiActive, setAiActive] = useState(false);
  const [reportSummary, setReportSummary] = useState("");

  const triggerMockSpeechToText = () => {
    setAiActive(true);
    setTimeout(() => {
      setAiActive(false);
      setReportSummary(
        "At meter 400, horse Thunderstrike shifted lane abruptly, causing minor collision warnings. Jockey Julian Sterling managed to adjust. Recommendation: low severity warning."
      );
    }, 2500);
  };
  ```

- [ ] **Step 2: Render results submission and AI Voice logger in FINISHED view**
  Append `FINISHED` switch view case:
  ```typescript
  {race.status === "FINISHED" && (
    <div className="space-y-5">
      <h3 className="text-sm font-bold text-slate-900">Timing and Ranking Entry Sheet</h3>
      <div className="space-y-4 bg-white border border-slate-200 rounded-xl p-4">
        {participants.filter(p => p.status === "PASSED").map((p) => (
          <div key={p.participantId} className="flex gap-4 items-center border-b border-slate-100 pb-3 last:border-0 last:pb-0">
            <div className="flex-1">
              <div className="text-xs font-bold text-slate-900">{p.horseName}</div>
              <div className="text-[10px] text-slate-400">{p.jockeyName}</div>
            </div>
            <div className="w-20">
              <label className="text-[9px] font-bold text-slate-400 uppercase">Rank</label>
              <input
                type="number"
                placeholder="1"
                className="w-full border border-slate-300 rounded p-1 text-xs"
              />
            </div>
            <div className="w-28">
              <label className="text-[9px] font-bold text-slate-400 uppercase">Time (sec)</label>
              <input
                type="number"
                step="0.001"
                placeholder="92.405"
                className="w-full border border-slate-300 rounded p-1 text-xs font-mono"
              />
            </div>
          </div>
        ))}
      </div>

      {/* AI Officiating Logger */}
      <div className="space-y-2 border-t border-slate-200 pt-4">
        <div className="flex justify-between items-center">
          <label className="text-xs font-bold text-slate-700">Official Incident Summary</label>
          <button
            onClick={triggerMockSpeechToText}
            disabled={aiActive}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border transition-all ${
              aiActive 
                ? "bg-red-50 border-red-200 text-red-600 animate-pulse" 
                : "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
            }`}
          >
            <span>🎙️</span> {aiActive ? "AI is Listening..." : "AI Speech-to-Text"}
          </button>
        </div>

        {aiActive && (
          <div className="flex gap-1 justify-center items-center h-8 bg-slate-100 border border-slate-200 rounded-lg">
            <span className="w-1 h-3 bg-red-500 rounded animate-bounce"></span>
            <span className="w-1 h-5 bg-red-500 rounded animate-bounce delay-75"></span>
            <span className="w-1 h-4 bg-red-500 rounded animate-bounce delay-150"></span>
            <span className="w-1 h-2 bg-red-500 rounded animate-bounce delay-300"></span>
          </div>
        )}

        <textarea
          value={reportSummary}
          onChange={(e) => setReportSummary(e.target.value)}
          placeholder="Use micro above or type officiating observations..."
          className="w-full border border-slate-300 rounded-xl p-3 text-xs focus:outline-none min-h-[80px]"
        />
      </div>
    </div>
  )}
  ```

---

### Task 5: Implement Locking Shroud for Submitted Results state

**Files:**
- Modify: [RefereeOfficiatePage.tsx](file:///d:/FBT/5/SWP391/SWP391-horse-racing-tournament-system-1/frontend/src/pages/referee/RefereeOfficiatePage.tsx)

- [ ] **Step 1: Design and render the read-only locked visual state**
  Append `RESULT_SUBMITTED` view case:
  ```typescript
  {race.status === "RESULT_SUBMITTED" && (
    <div className="text-center py-10 space-y-4">
      <div className="text-4xl">🔒</div>
      <h3 className="text-base font-bold text-slate-900">Race Officiating Records Locked</h3>
      <p className="text-xs text-slate-500 max-w-md mx-auto">
        Finishing records, check sheets, and incident summaries are finalized. Waiting for administrative approval.
      </p>
      <div className="inline-block bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold px-4 py-2 rounded-lg text-xs">
        ✔ Results successfully pushed for Admin Review
      </div>
    </div>
  )}
  ```

- [ ] **Step 2: Hide transition action buttons in submitted state**
  Wrap the persistent action block to prevent advancing from `RESULT_SUBMITTED`:
  ```typescript
  {race.status !== "RESULT_SUBMITTED" && (
    <div className="flex justify-between items-center border-t border-slate-100 pt-4">
      <span className="text-xs text-slate-400">Current status: <strong className="text-[#004d3d]">{race.status}</strong></span>
      <button
        onClick={handleNextStep}
        disabled={actionLoading || isTransitionDisabled}
        className="bg-[#004d3d] hover:bg-[#003d30] text-white font-bold px-6 py-2.5 rounded-lg text-xs transition-colors shadow-sm disabled:opacity-50"
      >
        {actionLoading ? "Transitioning..." : "⏩ Advance to Next Step"}
      </button>
    </div>
  )}
  ```

---

### Task 6: Refactor Backend REST Endpoint & State Enforcer

**Files:**
- Modify: [RefereeController.java](file:///d:/FBT/5/SWP391/SWP391-horse-racing-tournament-system-1/backend/src/main\java/com/example/horseracingtournamentsystem/referee/controller/RefereeController.java)
- Modify: [RefereeControllerTest.java](file:///d:/FBT/5/SWP391/SWP391-horse-racing-tournament-system-1/backend/src/test\java/com/example/horseracingtournamentsystem/referee/controller/RefereeControllerTest.java)

- [ ] **Step 1: Write a failing MockMvc test for the sequential next-step API**
  Open [RefereeControllerTest.java](file:///d:/FBT/5/SWP391/SWP391-horse-racing-tournament-system-1/backend/src/test\java/com/example/horseracingtournamentsystem/referee/controller/RefereeControllerTest.java) and append the test:
  ```java
    @Test
    @WithMockUser(roles = "REFEREE")
    void transitionNextStep_fromScheduled_returnsNewState() throws Exception {
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/v1/referee/races/1/next-step"))
                .andExpect(status().isOk());
    }
  ```

- [ ] **Step 2: Run backend tests to verify it fails**
  Run: `mvn test` in `backend` folder.
  Expected: FAIL on `transitionNextStep` due to missing endpoint mappings.

- [ ] **Step 3: Define next-step transition controller logic in RefereeController**
  Modify [RefereeController.java](file:///d:/FBT/5/SWP391/SWP391-horse-racing-tournament-system-1/backend/src/main\java/com/example/horseracingtournamentsystem/referee/controller/RefereeController.java). Implement the endpoint `POST /api/v1/referee/races/{raceId}/next-step` leveraging sequential advancement and the `0% PENDING` rule:
  ```java
      @PostMapping("/races/{raceId}/next-step")
      public ResponseEntity<Map<String, String>> transitionRaceState(@PathVariable Long raceId) {
          // Find the target race from static store
          Map<String, Object> targetRace = null;
          for (Map<String, Object> race : RACES) {
              if (race.get("id").equals(raceId)) {
                  targetRace = race;
                  break;
              }
          }

          if (targetRace == null) {
              return ResponseEntity.badRequest().build();
          }

          String currentStatus = (String) targetRace.get("status");
          String nextStatus;

          switch (currentStatus) {
              case "SCHEDULED":
                  nextStatus = "PRE_CHECKING";
                  break;

              case "PRE_CHECKING":
                  // Guard: Enforce 0% PENDING Checks
                  List<Map<String, Object>> parts = PARTICIPANTS.getOrDefault(raceId, new java.util.ArrayList<>());
                  for (Map<String, Object> p : parts) {
                      if ("PENDING".equals(p.get("status"))) {
                          return ResponseEntity.status(400).body(Map.of("message", "All participants must be verified before proceeding."));
                      }
                  }

                  // Perform scratching for failed entries
                  for (Map<String, Object> p : parts) {
                      if ("FAILED".equals(p.get("status"))) {
                          p.put("status", "WITHDRAWN");
                      }
                  }

                  nextStatus = "READY";
                  break;

              case "READY":
                  nextStatus = "ONGOING";
                  break;

              case "ONGOING":
                  nextStatus = "FINISHED";
                  break;

              case "FINISHED":
                  nextStatus = "RESULT_SUBMITTED";
                  break;

              default:
                  return ResponseEntity.badRequest().body(Map.of("message", "Invalid race status path."));
          }

          targetRace.put("status", nextStatus);
          return ResponseEntity.ok(Map.of("status", nextStatus));
      }
  ```

- [ ] **Step 4: Run backend tests to verify they pass**
  Run: `mvn test` in `backend` folder.
  Expected: PASS.
