# Owner Edit Horse Profile Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow horse owners to edit their horse's basic information from the horse's profile view, resetting its status back to PENDING for admin review if it was previously approved or rejected.

**Architecture:** 
- **Backend:** 
  1. Add `OwnerHorseUpdateRequest` DTO to receive textual updates.
  2. Implement `updateOwnerHorse` service method in `HorseService` that verifies ownership, updates fields, resets status to `PENDING` if it was `APPROVED`/`REJECTED`, and saves.
  3. Expose a `PUT /api/v1/owner/horses/{id}` endpoint in `OwnerHorseController`.
  4. Write integration tests to cover valid updates, security constraints, and automatic status transitions.
- **Frontend:**
  1. Update TypeScript definitions (`racing.ts`) to include the request payload type.
  2. Implement the API caller `updateOwnerHorse` in `racingApi.ts`.
  3. Create an "Edit Profile" button and a sliding panel in `OwnerHorseProfilePage.tsx` with validation, prefilled forms, loading/saving states, and layout consistency with existing owner components.

**Tech Stack:** Java, Spring Boot, React, TypeScript, TailwindCSS, Vitest

---

### Task 1: Backend DTO & Entity Update

**Files:**
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/horse/dto/request/OwnerHorseUpdateRequest.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/horse/entity/Horse.java:124-131`

- [ ] **Step 1: Create the update request DTO record**
Create `OwnerHorseUpdateRequest.java` to validate the textual fields during update:
```java
package com.example.horseracingtournamentsystem.horse.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record OwnerHorseUpdateRequest(
        @NotBlank(message = "Horse name is required")
        @Size(max = 150)
        String name,

        @Size(max = 100)
        String breed,

        @NotBlank(message = "Gender is required")
        @Pattern(regexp = "MALE|FEMALE", message = "Gender must be MALE or FEMALE")
        String gender,

        @PastOrPresent(message = "Date of birth cannot be in the future")
        LocalDate dateOfBirth,

        @Size(max = 50)
        String color,

        @Positive(message = "Height must be greater than 0")
        @jakarta.validation.constraints.Max(value = 9999, message = "Height cannot exceed 9999 cm")
        Integer heightCm,

        @Positive(message = "Weight must be greater than 0")
        @jakarta.validation.constraints.Max(value = 9999, message = "Weight cannot exceed 9999 kg")
        Integer weightKg,

        @Size(max = 50)
        String healthStatus,

        String medicalNote,

        String description
) {
}
```

- [ ] **Step 2: Add methods to `Horse.java`**
Modify `Horse.java` to support updating owner-editable details and resetting review status:
```java
    public void updateOwnerDetails(String name, String breed, String gender, LocalDate dateOfBirth, String color, Integer heightCm, Integer weightKg, String healthStatus, String medicalNote, String description) {
        this.name = name;
        this.breed = breed;
        this.gender = gender;
        this.dateOfBirth = dateOfBirth;
        this.color = color;
        this.heightCm = heightCm;
        this.weightKg = weightKg;
        this.healthStatus = healthStatus;
        this.medicalNote = medicalNote;
        this.description = description;
        this.updatedAt = LocalDateTime.now();
    }

    public void setStatusPending() {
        this.status = "PENDING";
        this.rejectionReason = null;
        this.approvedBy = null;
        this.approvedAt = null;
        this.updatedAt = LocalDateTime.now();
    }
```

---

### Task 2: Backend Service & Controller Endpoint

**Files:**
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/horse/service/HorseService.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/horse/controller/OwnerHorseController.java`

- [ ] **Step 1: Add service method in `HorseService`**
Implement the transactional update method:
```java
    @Transactional
    public HorseResponse updateOwnerHorse(String email, Long id, OwnerHorseUpdateRequest req) {
        Horse horse = requireOwnedHorse(email, id);

        horse.updateOwnerDetails(
                req.name(),
                req.breed(),
                req.gender().toUpperCase(),
                req.dateOfBirth(),
                req.color(),
                req.heightCm(),
                req.weightKg(),
                req.healthStatus(),
                req.medicalNote(),
                req.description()
        );

        if ("APPROVED".equals(horse.getStatus()) || "REJECTED".equals(horse.getStatus())) {
            horse.setStatusPending();
        }

        horseRepository.save(horse);
        return mapToResponse(horse);
    }
```

- [ ] **Step 2: Add endpoint mapping in `OwnerHorseController`**
Expose the mapping under `/api/v1/owner/horses/{id}`:
```java
    @org.springframework.web.bind.annotation.PutMapping("/{id}")
    public HorseResponse update(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @org.springframework.web.bind.annotation.RequestBody OwnerHorseUpdateRequest request
    ) {
        return horseService.updateOwnerHorse(authentication.getName(), id, request);
    }
```

---

### Task 3: Backend Integration Tests

**Files:**
- Modify: `backend/src/test/java/com/example/horseracingtournamentsystem/horse/HorseIntegrationTest.java`

- [ ] **Step 1: Add integration tests for updating owner horse**
Open `HorseIntegrationTest.java` and add tests verifying:
1. Owner can update their own horse, resetting status from APPROVED to PENDING.
2. Users cannot update horses belonging to other owners.
3. Validation constraints (e.g. future date of birth, invalid gender) are enforced.

```java
    @Test
    void ownerCanUpdateOwnHorse() throws Exception {
        Horse horse = Horse.create(ownerUser, "Old Name", "H_CODE_UPD_1", "Thoroughbred", "MALE", LocalDate.of(2018, 5, 10), "Brown");
        horse = horseRepository.save(horse);

        String updateBody = """
                {
                    "name": "New Name",
                    "breed": "Quarter Horse",
                    "gender": "FEMALE",
                    "dateOfBirth": "2019-06-12",
                    "color": "Grey",
                    "heightCm": 160,
                    "weightKg": 500,
                    "healthStatus": "Healthy",
                    "medicalNote": "Updated Note",
                    "description": "Updated Description"
                }
                """;

        mockMvc.perform(put("/api/v1/owner/horses/{id}", horse.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + spectatorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("New Name"))
                .andExpect(jsonPath("$.breed").value("Quarter Horse"))
                .andExpect(jsonPath("$.gender").value("FEMALE"))
                .andExpect(jsonPath("$.color").value("Grey"))
                .andExpect(jsonPath("$.status").value("PENDING"));
    }

    @Test
    void cannotUpdateOtherOwnerHorse() throws Exception {
        User otherOwner = User.pending("Other Owner", "other@example.com", "hash");
        otherOwner.verifyEmail();
        otherOwner = userRepository.save(otherOwner);

        Horse horse = Horse.create(otherOwner, "Other Horse", "H_CODE_UPD_2", "Thoroughbred", "MALE", LocalDate.now(), "Brown");
        horse = horseRepository.save(horse);

        String updateBody = """
                {
                    "name": "Hacked Name",
                    "gender": "MALE"
                }
                """;

        mockMvc.perform(put("/api/v1/owner/horses/{id}", horse.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + spectatorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateBody))
                .andExpect(status().isNotFound()); // requireOwnedHorse throws NOT_FOUND
    }
```

- [ ] **Step 2: Run maven tests to verify they pass**
Run: `mvn test -Dtest=HorseIntegrationTest` in the `backend` directory.

---

### Task 4: Frontend API Interface & Types

**Files:**
- Modify: `frontend/src/types/racing.ts`
- Modify: `frontend/src/api/racingApi.ts`

- [ ] **Step 1: Expose payload type in `racing.ts`**
Add the `OwnerHorseUpdateRequest` payload type:
```typescript
export type OwnerHorseUpdateRequest = {
  name: string;
  breed?: string;
  gender: "MALE" | "FEMALE" | string;
  dateOfBirth?: string;
  color?: string;
  heightCm?: number;
  weightKg?: number;
  healthStatus?: string;
  medicalNote?: string;
  description?: string;
};
```

- [ ] **Step 2: Add API caller in `racingApi.ts`**
Expose `updateOwnerHorse`:
```typescript
export async function updateOwnerHorse(id: number, payload: OwnerHorseUpdateRequest): Promise<Horse> {
  const response = await httpClient.put<Horse>(`/owner/horses/${id}`, payload);
  return response.data;
}
```

---

### Task 5: Frontend UI - Edit Horse Panel & Profile Page Integrate

**Files:**
- Modify: `frontend/src/pages/owner/OwnerHorseProfilePage.tsx`

- [ ] **Step 1: Implement form state and submit handler**
In `OwnerHorseProfilePage.tsx`:
- Import `updateOwnerHorse` and `OwnerHorseUpdateRequest`.
- Define an `editPanelOpen` state.
- Prefill form values with horse data when opening.
- Add handler `handleEditSubmit` that calls `updateOwnerHorse`, updates local horse state, closes the panel, and sets a success message.

- [ ] **Step 2: Add "Edit Profile" trigger button**
Place the "Edit Profile" button next to the `StatusBadge` in the profile header card:
```tsx
                <button
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-black text-slate-700 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006d5b] cursor-pointer"
                  onClick={() => {
                    if (horse) {
                      setEditForm({
                        name: horse.name,
                        breed: horse.breed || "",
                        gender: horse.gender,
                        dateOfBirth: horse.dateOfBirth || "",
                        color: horse.color || "",
                        heightCm: horse.heightCm,
                        weightKg: horse.weightKg,
                        healthStatus: horse.healthStatus || "",
                        medicalNote: horse.medicalNote || "",
                        description: horse.description || "",
                      });
                      setEditPanelOpen(true);
                    }
                  }}
                  type="button"
                >
                  Edit Profile
                </button>
```

- [ ] **Step 3: Render the Edit Panel sliding pane**
Add the sliding panel markup right above the closing tag of the section:
```tsx
        {editPanelOpen && horse && (
          <div className="fixed inset-0 z-50 bg-slate-950/40" role="presentation">
            <aside
              aria-labelledby="edit-horse-title"
              className="ml-auto flex h-full w-full max-w-2xl flex-col overflow-y-auto bg-white shadow-2xl"
              role="dialog"
              aria-modal="true"
            >
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-[#006d5b]">Modify profile</p>
                  <h2 id="edit-horse-title" className="text-2xl font-black">
                    Edit Horse Details
                  </h2>
                </div>
                <button
                  aria-label="Close edit horse panel"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006d5b]"
                  onClick={() => setEditPanelOpen(false)}
                  type="button"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>

              <form className="grid gap-5 p-6" onSubmit={handleEditSubmit}>
                <div className="grid gap-4 md:grid-cols-2">
                  <TextField
                    label="Horse name"
                    onChange={(value) => updateEditField("name", value)}
                    required
                    value={editForm.name}
                  />
                  <label className="space-y-1 text-sm font-bold text-slate-700">
                    <span>Gender</span>
                    <select
                      className="min-h-11 w-full rounded-md border border-slate-300 px-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#006d5b]"
                      onChange={(event) => updateEditField("gender", event.target.value)}
                      required
                      value={editForm.gender}
                    >
                      <option value="">Select gender</option>
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                    </select>
                  </label>
                  <TextField
                    label="Breed"
                    onChange={(value) => updateEditField("breed", value)}
                    value={editForm.breed}
                  />
                  <TextField
                    label="Color"
                    onChange={(value) => updateEditField("color", value)}
                    value={editForm.color}
                  />
                  <TextField
                    label="Date of birth"
                    onChange={(value) => updateEditField("dateOfBirth", value)}
                    type="date"
                    value={editForm.dateOfBirth}
                  />
                  <TextField
                    label="Height cm"
                    onChange={(value) => updateEditField("heightCm", value)}
                    type="number"
                    value={editForm.heightCm ?? ""}
                  />
                  <TextField
                    label="Weight kg"
                    onChange={(value) => updateEditField("weightKg", value)}
                    type="number"
                    value={editForm.weightKg ?? ""}
                  />
                  <TextField
                    label="Health status"
                    onChange={(value) => updateEditField("healthStatus", value)}
                    value={editForm.healthStatus}
                  />
                </div>

                <TextArea
                  label="Medical note"
                  onChange={(value) => updateEditField("medicalNote", value)}
                  value={editForm.medicalNote}
                />
                <TextArea
                  label="Description"
                  onChange={(value) => updateEditField("description", value)}
                  value={editForm.description}
                />

                <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
                  <button
                    className="min-h-11 rounded-md border border-slate-300 px-5 text-sm font-black text-slate-700 hover:bg-slate-55"
                    onClick={() => setEditPanelOpen(false)}
                    type="button"
                  >
                    Cancel
                  </button>
                  <button
                    className="min-h-11 rounded-md bg-[#006d5b] px-5 text-sm font-black text-white hover:bg-[#004d3d] disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={saving}
                    type="submit"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </aside>
          </div>
        )}
```

---

### Task 6: Frontend Verification & Tests

**Files:**
- Create: `frontend/src/pages/owner/OwnerHorseProfilePage.test.tsx` (Add test case for edit functionality)

- [ ] **Step 1: Write UI unit test for editing**
Verify that clicking "Edit Profile" opens the modal, updating fields and clicking "Save Changes" invokes the API correctly.

- [ ] **Step 2: Build the project**
Run: `npm run build` in `frontend` directory.
Verify successful compilation.
