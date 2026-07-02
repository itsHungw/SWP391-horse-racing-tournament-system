# Referee Contracts Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Referee Contracts page to use a modern, clean, split-column layout (Inbox style) that separates the scrollable contract list from the detail panel, adds search capability, and upgrades aesthetics with premium styling and summary metrics.

**Architecture:** We will update `RefereeContractsPage.tsx` to:
- Render a header with statistics cards showing counts of pending and active contracts.
- Use a split-pane grid layout (`xl:grid-cols-[430px_1fr]`).
- Left Column: A tabbed status switcher, search input, and list of compact contract buttons.
- Right Column: A detailed panel showing all information for the selected contract, including officiating terms and buttons to Accept/Decline (with reasoning modal).
- Create a new test suite `RefereeContractsPage.test.tsx` to test filters, selection, search, acceptance, and decline workflows.

**Tech Stack:** React, TailwindCSS, Vitest, Lucide React

---

### Task 1: Create Test Suite for Referee Contracts Page

**Files:**
- Create: [RefereeContractsPage.test.tsx](file:///e:/SWP391_Project/SWP391-horse-racing-tournament-system/frontend/src/pages/referee/RefereeContractsPage.test.tsx)

- [ ] **Step 1: Write the test suite**

Define mock data and write tests verifying:
- Inbox list rendering and selection of a contract updates the detail view.
- Search input filters the contract list.
- Tab filters toggle display of pending/active/declined contracts.
- Accept contract action triggers API call.
- Decline contract action opens modal and handles decline reason.

```typescript
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { acceptRefereeContract, declineRefereeContract, getMyRefereeContracts } from "../../api/racingApi";
import { RefereeContractsPage } from "./RefereeContractsPage";

vi.mock("../../api/racingApi", () => ({
  acceptRefereeContract: vi.fn(),
  declineRefereeContract: vi.fn(),
  getMyRefereeContracts: vi.fn(),
}));

// Mock data and tests...
```

- [ ] **Step 2: Run the test suite and verify failure**

Run: `npx vitest run src/pages/referee/RefereeContractsPage.test.tsx`
Expected: FAIL (since the component does not yet implement the new search/tabs/split-pane layout)

---

### Task 2: Implement Redesigned Referee Contracts Component

**Files:**
- Modify: [RefereeContractsPage.tsx](file:///e:/SWP391_Project/SWP391-horse-racing-tournament-system/frontend/src/pages/referee/RefereeContractsPage.tsx)

- [ ] **Step 1: Add Search and Selected Contract state**

Introduce `searchQuery` and `selectedContractId` state hooks at the top of the component.

- [ ] **Step 2: Add contract search matcher logic**

Add helper function to match tournament name against search query.

- [ ] **Step 3: Update page container layout**

Wrap page container in `max-w-6xl mx-auto px-4 py-8 space-y-8`. Add card elements for statistics (Pending and Active contract count) in the header section.

- [ ] **Step 4: Implement Split Pane Layout**

Render the contract inbox (left pane) and details panel (right pane) side-by-side using CSS grid.
- Left Pane:
  - Add search input field with magnifying glass icon.
  - Render tab filters with hover and active states.
  - Render list of contract items styled as cards with tournament initials avatar.
- Right Pane:
  - Render selected contract details, description, and terms checkmarks.
  - Render Accept and Decline buttons with loading state indicators.

- [ ] **Step 5: Modernize the Decline Modal**

Style the decline reason modal to be centered with a backdrop blur and smooth animations.

---

### Task 3: Verification & Walkthrough

- [ ] **Step 1: Compile the frontend code**

Run: `npx tsc -b` inside `frontend` directory.
Expected: Build success with no compiler errors.

- [ ] **Step 2: Run Referee page tests**

Run: `npx vitest run src/pages/referee/`
Expected: All tests pass including the new `RefereeContractsPage.test.tsx`.

- [ ] **Step 3: Update walkthrough.md**

Update the walkthrough artifact with descriptions of the new split contracts layout and aesthetics upgrades.
