# Dynamic Betting System: Phase 3 (Frontend UI & Variable Wagers)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update the frontend Prediction UI to allow custom wager amounts, quick-select presets (10k, 20k, 50k, 100k, 500k), and display the locked odds on the user's betting slip.

**Architecture:**
- `SpectatorPredictionsPage` state will track `wagerAmount`.
- `SubmitPredictionRequest` payload will include `wagerAmount`.
- `MyPrediction` type will include `lockedOdds` to display on the Ticket.

**Tech Stack:** React, TypeScript, TailwindCSS

---

### Task 1: Update API Interfaces

**Files:**
- Modify: `frontend/src/pages/spectator/predictions/services/spectatorPredictionApi.ts`
- Modify: `frontend/src/pages/spectator/predictions/types/prediction.types.ts`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/prediction/dto/response/RacePredictionResponse.java` (Ensure lockedOdds is returned)

- [ ] **Step 1: Update Backend DTO**
Ensure `RacePredictionResponse` includes `lockedOdds` (BigDecimal).

- [ ] **Step 2: Update Frontend Types**
Add `wagerAmount` to the submit payload type, and `lockedOdds` to `UserPrediction`.

- [ ] **Step 3: Commit**

### Task 2: Update SpectatorPredictions UI for Wagers

**Files:**
- Modify: `frontend/src/pages/spectator/predictions/SpectatorPredictionsPage.tsx`
- Modify: `frontend/src/pages/spectator/predictions/components/PredictionSlip.tsx`

- [ ] **Step 1: Update State**
Add `wagerAmount` state (default 10000).

- [ ] **Step 2: Update Presets**
Change the Entry Point Options to show: 10k, 20k, 50k, 100k, 200k, 500k.
Add a numeric input field when "Other" is selected.

- [ ] **Step 3: Update Submission**
Pass `wagerAmount` into `submitPrediction(payload)`.

- [ ] **Step 4: Update Prediction Slip**
Modify `PredictionSlip.tsx` to display `Wager: [amount]` and `Odds: [lockedOdds]` (if available) instead of the generic entry cost.

- [ ] **Step 5: Commit**
