# Design Spec: Horse Roster Split-Pane Centered Modals Redesign

**Date:** 2026-06-25  
**Feature:** Owner Stable Operations - Redesign Add Horse and Edit Horse Profile Modals

---

## 1. Goal & Context
The goal is to redesign the "Add Horse" modal (on the Horse Roster page) and the "Edit Profile" modal (on the Horse Profile page) to look like the "Browse Jockey Pool" modal on the Jockey Invitations page. 
Currently, both of these forms are displayed in single-column right-aligned sliding panels (slide-overs). We will change them into centered dialogs with a split-pane layout to make them look more premium, consistent, and easier to use on desktop displays.

---

## 2. Proposed Design

### A. Modal Structure (Centered Dialog)
Instead of sliding from the right, the panels will open as centered overlay modals:
- **Backdrop Overlay:** `fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 sm:p-6`
- **Dialog Box Container:** `flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl`
- **Fixed Header:** `shrink-0 flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5`
- **Fixed Footer:** `shrink-0 flex items-center justify-end gap-3 border-t border-slate-200 bg-white px-6 py-4`
- **Body Content (Split Pane):** `flex-1 flex flex-col min-h-0 lg:flex-row lg:overflow-hidden`

### B. Form Field Distribution (Split Pane Layout)

#### 1. Add Horse Modal (in `OwnerHorsesPage.tsx`)
- **Left Column** (`w-full lg:w-1/2 p-6 lg:overflow-y-auto modal-scrollbar min-h-0 flex flex-col border-b border-slate-100 lg:border-b-0 gap-4`):
  - **Inputs:** Horse Name, Gender (select), Breed, Color, Date of Birth, Height cm, Weight kg.
  - **File Uploads:** 
    - **Horse Image** (dashed container with drag/drop text and live preview underneath).
    - **Evidence Document** (dashed container with file name selected).
- **Right Column** (`w-full lg:w-1/2 border-t border-slate-200 bg-gradient-to-b from-slate-50/80 to-slate-100/50 p-5 lg:border-l lg:border-t-0 lg:overflow-y-auto modal-scrollbar flex flex-col gap-4 min-h-0`):
  - **Textareas:** 
    - **Health Status** (textarea)
    - **Medical Note** (textarea)
    - **Description** (textarea)

#### 2. Edit Profile Modal (in `OwnerHorseProfilePage.tsx`)
- **Left Column** (`w-full lg:w-1/2 p-6 lg:overflow-y-auto modal-scrollbar min-h-0 flex flex-col border-b border-slate-100 lg:border-b-0 gap-4`):
  - **Inputs:** Horse Name, Gender (select), Breed, Color, Date of Birth, Height cm, Weight kg.
- **Right Column** (`w-full lg:w-1/2 border-t border-slate-200 bg-gradient-to-b from-slate-50/80 to-slate-100/50 p-5 lg:border-l lg:border-t-0 lg:overflow-y-auto modal-scrollbar flex flex-col gap-4 min-h-0`):
  - **Textareas:**
    - **Health Status** (textarea)
    - **Medical Note** (textarea)
    - **Description** (textarea)

---

## 3. Accessibility & Test Alignment
To ensure that existing unit tests (`OwnerHorsesPage.test.tsx` and `OwnerHorseProfilePage.test.tsx`) pass without modification:
1. The wrapper element representing the modal MUST have `role="dialog"` and `aria-modal="true"`.
2. The modal headings MUST contain appropriate text (e.g. `Add Horse` or `Edit Horse Details`) matching the query parameters in the tests.
3. Form labels (`<label>`) must wrap the input fields or use `htmlFor` with matching `id`s so that `getByLabelText` continues to find input fields.
