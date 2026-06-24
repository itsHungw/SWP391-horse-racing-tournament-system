# Referee Profile Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Referee Profile dashboard to use a modern, clean, tabbed layout that separates the dashboard view from the edit form, upgrades card styling for high design aesthetics, and aligns spacing within a balanced max-width container.

**Architecture:** We will introduce a React state variable `activeTab` ('dashboard' | 'edit') in `RefereeProfileDashboardPage.tsx`. When 'dashboard' is active, we render the read-only overview cards, checklist, activity summary, and biography. When 'edit' is active, we render the profile and credentials edit form. We'll also update the header buttons to toggle this state and focus/scroll cleanly.

**Tech Stack:** React, TailwindCSS, Vitest, Lucide React

---

### Task 1: Update test suite to expect tab navigation

**Files:**
- Modify: [RefereeProfileDashboardPage.test.tsx](file:///e:/SWP391_Project/SWP391-horse-racing-tournament-system/frontend/src/pages/referee/RefereeProfileDashboardPage.test.tsx)

- [ ] **Step 1: Update the edit/save test cases to switch tabs before searching for input elements**

Change the tests that fill in forms to click the "Edit referee profile" tab/button first, ensuring they can locate the form controls.

- [ ] **Step 2: Add specific tests verifying tab switcher behavior**

Add tests that assert clicking the Dashboard/Edit Profile buttons toggles element visibility correctly.

- [ ] **Step 3: Run the test suite and verify failure**

Run: `npx vitest run src/pages/referee/RefereeProfileDashboardPage.test.tsx`
Expected: FAIL (because tab switching is not yet implemented in the component)

---

### Task 2: Implement tabbed layout and styling upgrades

**Files:**
- Modify: [RefereeProfileDashboardPage.tsx](file:///e:/SWP391_Project/SWP391-horse-racing-tournament-system/frontend/src/pages/referee/RefereeProfileDashboardPage.tsx)

- [ ] **Step 1: Add activeTab state**

Introduce `const [activeTab, setActiveTab] = useState<"dashboard" | "edit">("dashboard");` at the top of `RefereeProfileDashboardPage`.

- [ ] **Step 2: Wrap page container in max-w-6xl mx-auto**

Change outer container class from `max-w-[1486px] space-y-6` to `max-w-6xl mx-auto px-4 py-8 space-y-8`. Do the same for the loading and error states.

- [ ] **Step 3: Render Tab Switcher component**

Create a clean tab header component below the page header:
```tsx
<div className="flex border-b border-slate-200">
  <button
    onClick={() => setActiveTab("dashboard")}
    className={`pb-4 px-6 text-sm font-bold border-b-2 transition-colors ${
      activeTab === "dashboard"
        ? "border-[#007a68] text-[#007a68]"
        : "border-transparent text-slate-500 hover:text-slate-800"
    }`}
  >
    Steward Dashboard
  </button>
  <button
    onClick={() => setActiveTab("edit")}
    className={`pb-4 px-6 text-sm font-bold border-b-2 transition-colors ${
      activeTab === "edit"
        ? "border-[#007a68] text-[#007a68]"
        : "border-transparent text-slate-500 hover:text-slate-800"
    }`}
  >
    Edit Profile & Credentials
  </button>
</div>
```

- [ ] **Step 4: Update header "Edit referee profile" and readiness checklist "Complete referee profile" buttons**

Instead of hardcoded anchor tags targeting `#edit-referee-profile`, change them to buttons (or prevent default on click) that switch the tab:
```tsx
const handleSwitchToEdit = (e: React.MouseEvent) => {
  e.preventDefault();
  setActiveTab("edit");
  window.scrollTo({ top: 0, behavior: "smooth" });
};
```

- [ ] **Step 5: Conditional rendering based on activeTab**

- When `activeTab === "dashboard"`:
  - Render the grid containing Profile details, Certification status.
  - Render the grid containing Assignment readiness, Referee activity summary, and Referee biography.
- When `activeTab === "edit"`:
  - Render the edit form section.

- [ ] **Step 6: Upgrade card styling (aesthetics)**

Update the metrics/activity cards and status boxes:
- Add a top accent line: `border-t-4 border-t-[#007a68]` to main overview cards.
- Add soft circular icon wrappers:
  ```tsx
  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-[#007a68] mb-3">
    <Icon className="h-5 w-5" />
  </div>
  ```
- Harmonize margins and borders for a premium, clean card aesthetic.

---

### Task 3: Verification & Walkthrough

- [ ] **Step 1: Compile the frontend code**

Run: `npx tsc -b` inside `frontend` directory.
Expected: Build success with no typescript compiler errors.

- [ ] **Step 2: Run all tests**

Run: `npx vitest run src/pages/referee/`
Expected: PASS for all tests including the newly updated RefereeProfileDashboardPage tests.

- [ ] **Step 3: Document changes in walkthrough.md**

Update the walkthrough artifact with descriptions of the new tabbed layout and upgraded visual aesthetics.
