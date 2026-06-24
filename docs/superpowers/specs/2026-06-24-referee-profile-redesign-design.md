# Referee Profile Page Redesign Specification

This specification documents the redesign of the Referee Profile page (`RefereeProfileDashboardPage`) to improve layout, aesthetics, and user experience.

## Background & Problem

Currently, the Referee Profile page displays all information vertically, resulting in a cluttered page with a very long scroll distance. Key metrics and read-only statistics are mixed with a massive form edit section at the bottom. This makes it inconvenient to check statistics and status at a glance without being overwhelmed by input fields.

## Proposed Changes

We will reorganize the layout to use a Tabbed interface on desktop and mobile viewports, separating the **Overview Dashboard** from the **Edit Settings**.

---

### Component Modifications

#### 1. [MODIFY] [RefereeProfileDashboardPage.tsx](file:///e:/SWP391_Project/SWP391-horse-racing-tournament-system/frontend/src/pages/referee/RefereeProfileDashboardPage.tsx)
- Reorganize the page structure using a tab switcher:
  - Tab 1: `Dashboard` (Overview) - Displays basic profile info, certification status, readiness checklist, activity summary, and professional biography.
  - Tab 2: `Edit Profile` (Settings) - Houses the edit form (Basic Identity and Professional Credentials).
- Make the "Edit referee profile" header button switch active tab to `Edit Profile` and scroll down to the edit container smoothly.
- **Aesthetics Upgrade**:
  - Restructure the metrics cards to look like a premium admin dashboard (add top colored border, soft circular background for icons).
  - Clean up card spacings, margins, and borders to look polished and aligned.
  - Limit the entire content container to `max-w-6xl mx-auto` to balance the page layout and prevent wider stretching on larger screens.

#### 2. [MODIFY] [RefereeProfileDashboardPage.test.tsx](file:///e:/SWP391_Project/SWP391-horse-racing-tournament-system/frontend/src/pages/referee/RefereeProfileDashboardPage.test.tsx)
- Update test cases to handle tab switching.
- Assert that fields like "Full name" input fields are visible on the edit tab, and profile summary info is visible on the dashboard tab.

---

## Verification Plan

### Automated Tests
- Run the profile page test suite:
  `npx vitest run src/pages/referee/RefereeProfileDashboardPage.test.tsx`
- Run all referee tests:
  `npx vitest run src/pages/referee/`

### Manual Verification
- Navigate to the Referee Profile page and test switching between "Steward Dashboard" and "Edit Profile & Credentials" tabs.
- Verify that clicking the header "Edit referee profile" button automatically switches to the edit tab.
- Test form validation and saving under the edit tab.
