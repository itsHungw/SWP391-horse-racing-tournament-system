# Admin Point Settings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an admin-only Point Settings module where all point economy values are stored in the database, default to `0`, validate as non-negative, and are editable from `/admin/points`.

**Architecture:** Add a small backend `point` package around a `point_settings` table, expose admin-only GET/PUT endpoints, and add a focused React admin page that edits the five supported settings. Blog rewards, point transactions, and race predictions remain out of scope for this implementation.

**Tech Stack:** Spring Boot, Spring Data JPA, Bean Validation, Spring Security test utilities, React, TypeScript, Vite, Vitest, Testing Library.

---

## File Map

Backend files to create:

- `backend/src/main/java/com/example/horseracingtournamentsystem/point/PointSettingKey.java`
- `backend/src/main/java/com/example/horseracingtournamentsystem/point/PointSetting.java`
- `backend/src/main/java/com/example/horseracingtournamentsystem/point/PointSettingRepository.java`
- `backend/src/main/java/com/example/horseracingtournamentsystem/point/PointSettingResponse.java`
- `backend/src/main/java/com/example/horseracingtournamentsystem/point/UpdatePointSettingsRequest.java`
- `backend/src/main/java/com/example/horseracingtournamentsystem/point/PointSettingsService.java`
- `backend/src/main/java/com/example/horseracingtournamentsystem/point/AdminPointSettingsController.java`
- `backend/src/test/java/com/example/horseracingtournamentsystem/point/AdminPointSettingsIntegrationTest.java`

Backend files to modify:

- `backend/src/main/resources/schema.sql`

Frontend files to create:

- `frontend/src/types/pointSettings.ts`
- `frontend/src/api/pointSettingsApi.ts`
- `frontend/src/api/pointSettingsApi.test.ts`
- `frontend/src/pages/admin/AdminPointSettingsPage.tsx`
- `frontend/src/pages/admin/AdminPointSettingsPage.test.tsx`

Frontend files to modify:

- `frontend/src/AppRouter.tsx`
- `frontend/src/App.test.tsx`

## Settings Contract

Use exactly these setting keys:

```text
FIRST_LOGIN_BONUS
BLOG_REWARD_POINTS
DAILY_BLOG_REWARD_LIMIT
PREDICTION_ENTRY_COST
PREDICTION_CORRECT_REWARD
```

All default values are `0`. All submitted values must be integers greater than or equal to `0`.

---

### Task 1: Database Table And Seeds

**Files:**

- Modify: `backend/src/main/resources/schema.sql`

- [ ] **Step 1: Add `point_settings` table**

Add this schema block near other table creation statements:

```sql
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='point_settings' AND xtype='U')
BEGIN
    CREATE TABLE point_settings (
        setting_key VARCHAR(80) PRIMARY KEY,
        setting_value INT NOT NULL DEFAULT 0 CHECK (setting_value >= 0),
        description VARCHAR(255),
        updated_at DATETIME2 DEFAULT SYSUTCDATETIME(),
        updated_by BIGINT NULL,
        CONSTRAINT fk_point_settings_updated_by FOREIGN KEY (updated_by) REFERENCES users(id)
    );
END
```

- [ ] **Step 2: Seed the required defaults**

Add this seed block after the table exists:

```sql
IF NOT EXISTS (SELECT 1 FROM point_settings WHERE setting_key = 'FIRST_LOGIN_BONUS')
    INSERT INTO point_settings (setting_key, setting_value, description)
    VALUES ('FIRST_LOGIN_BONUS', 0, 'Points awarded by a future first-login bonus flow');

IF NOT EXISTS (SELECT 1 FROM point_settings WHERE setting_key = 'BLOG_REWARD_POINTS')
    INSERT INTO point_settings (setting_key, setting_value, description)
    VALUES ('BLOG_REWARD_POINTS', 0, 'Points awarded by a future blog-read reward flow');

IF NOT EXISTS (SELECT 1 FROM point_settings WHERE setting_key = 'DAILY_BLOG_REWARD_LIMIT')
    INSERT INTO point_settings (setting_key, setting_value, description)
    VALUES ('DAILY_BLOG_REWARD_LIMIT', 0, 'Maximum blog-read rewards per user per day in a future flow');

IF NOT EXISTS (SELECT 1 FROM point_settings WHERE setting_key = 'PREDICTION_ENTRY_COST')
    INSERT INTO point_settings (setting_key, setting_value, description)
    VALUES ('PREDICTION_ENTRY_COST', 0, 'Points required to enter a future race prediction');

IF NOT EXISTS (SELECT 1 FROM point_settings WHERE setting_key = 'PREDICTION_CORRECT_REWARD')
    INSERT INTO point_settings (setting_key, setting_value, description)
    VALUES ('PREDICTION_CORRECT_REWARD', 0, 'Points awarded for a future correct race prediction');
```

- [ ] **Step 3: Verify schema mentions all keys**

Run:

```powershell
rg -n "point_settings|FIRST_LOGIN_BONUS|BLOG_REWARD_POINTS|DAILY_BLOG_REWARD_LIMIT|PREDICTION_ENTRY_COST|PREDICTION_CORRECT_REWARD" backend/src/main/resources/schema.sql
```

Expected: output includes the table and all five setting keys.

---

### Task 2: Backend Integration Tests

**Files:**

- Create: `backend/src/test/java/com/example/horseracingtournamentsystem/point/AdminPointSettingsIntegrationTest.java`

- [ ] **Step 1: Write failing integration tests**

Create tests for these behaviors:

```java
package com.example.horseracingtournamentsystem.point;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class AdminPointSettingsIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void adminCanReadDefaultPointSettings() throws Exception {
        mockMvc.perform(get("/api/v1/admin/point-settings")
                        .with(user("admin").roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.FIRST_LOGIN_BONUS").value(0))
                .andExpect(jsonPath("$.BLOG_REWARD_POINTS").value(0))
                .andExpect(jsonPath("$.DAILY_BLOG_REWARD_LIMIT").value(0))
                .andExpect(jsonPath("$.PREDICTION_ENTRY_COST").value(0))
                .andExpect(jsonPath("$.PREDICTION_CORRECT_REWARD").value(0));
    }

    @Test
    void adminCanUpdatePointSettings() throws Exception {
        Map<String, Integer> request = Map.of(
                "FIRST_LOGIN_BONUS", 0,
                "BLOG_REWARD_POINTS", 10,
                "DAILY_BLOG_REWARD_LIMIT", 3,
                "PREDICTION_ENTRY_COST", 5,
                "PREDICTION_CORRECT_REWARD", 25
        );

        mockMvc.perform(put("/api/v1/admin/point-settings")
                        .with(user("admin").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.BLOG_REWARD_POINTS").value(10))
                .andExpect(jsonPath("$.DAILY_BLOG_REWARD_LIMIT").value(3))
                .andExpect(jsonPath("$.PREDICTION_ENTRY_COST").value(5))
                .andExpect(jsonPath("$.PREDICTION_CORRECT_REWARD").value(25));

        mockMvc.perform(get("/api/v1/admin/point-settings")
                        .with(user("admin").roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.BLOG_REWARD_POINTS").value(10));
    }

    @Test
    void negativeValuesAreRejected() throws Exception {
        Map<String, Integer> request = Map.of(
                "FIRST_LOGIN_BONUS", 0,
                "BLOG_REWARD_POINTS", -1,
                "DAILY_BLOG_REWARD_LIMIT", 0,
                "PREDICTION_ENTRY_COST", 0,
                "PREDICTION_CORRECT_REWARD", 0
        );

        mockMvc.perform(put("/api/v1/admin/point-settings")
                        .with(user("admin").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void spectatorCannotAccessAdminPointSettings() throws Exception {
        mockMvc.perform(get("/api/v1/admin/point-settings")
                        .with(user("spectator").roles("SPECTATOR")))
                .andExpect(status().isForbidden());
    }
}
```

- [ ] **Step 2: Run the backend test and confirm it fails before implementation**

Run:

```powershell
cd backend
mvn -Dtest=AdminPointSettingsIntegrationTest test
```

Expected before implementation: fails because `/api/v1/admin/point-settings` does not exist or point classes do not compile.

---

### Task 3: Backend Point Settings Module

**Files:**

- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/point/PointSettingKey.java`
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/point/PointSetting.java`
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/point/PointSettingRepository.java`
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/point/PointSettingResponse.java`
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/point/UpdatePointSettingsRequest.java`
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/point/PointSettingsService.java`
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/point/AdminPointSettingsController.java`

- [ ] **Step 1: Add setting key enum**

```java
package com.example.horseracingtournamentsystem.point;

public enum PointSettingKey {
    FIRST_LOGIN_BONUS,
    BLOG_REWARD_POINTS,
    DAILY_BLOG_REWARD_LIMIT,
    PREDICTION_ENTRY_COST,
    PREDICTION_CORRECT_REWARD
}
```

- [ ] **Step 2: Add JPA entity**

```java
package com.example.horseracingtournamentsystem.point;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "point_settings")
public class PointSetting {

    @Id
    @Enumerated(EnumType.STRING)
    @Column(name = "setting_key", length = 80, nullable = false)
    private PointSettingKey key;

    @Column(name = "setting_value", nullable = false)
    private Integer value = 0;

    @Column(name = "description")
    private String description;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    protected PointSetting() {
    }

    public PointSetting(PointSettingKey key, Integer value, String description) {
        this.key = key;
        this.value = value;
        this.description = description;
    }

    public PointSettingKey getKey() {
        return key;
    }

    public Integer getValue() {
        return value;
    }

    public void setValue(Integer value) {
        this.value = value;
    }

    public String getDescription() {
        return description;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void markUpdated() {
        this.updatedAt = LocalDateTime.now();
    }
}
```

- [ ] **Step 3: Add repository**

```java
package com.example.horseracingtournamentsystem.point;

import org.springframework.data.jpa.repository.JpaRepository;

public interface PointSettingRepository extends JpaRepository<PointSetting, PointSettingKey> {
}
```

- [ ] **Step 4: Add response DTO**

```java
package com.example.horseracingtournamentsystem.point;

public record PointSettingResponse(
        int FIRST_LOGIN_BONUS,
        int BLOG_REWARD_POINTS,
        int DAILY_BLOG_REWARD_LIMIT,
        int PREDICTION_ENTRY_COST,
        int PREDICTION_CORRECT_REWARD
) {
}
```

- [ ] **Step 5: Add update request DTO**

```java
package com.example.horseracingtournamentsystem.point;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record UpdatePointSettingsRequest(
        @NotNull @Min(0) Integer FIRST_LOGIN_BONUS,
        @NotNull @Min(0) Integer BLOG_REWARD_POINTS,
        @NotNull @Min(0) Integer DAILY_BLOG_REWARD_LIMIT,
        @NotNull @Min(0) Integer PREDICTION_ENTRY_COST,
        @NotNull @Min(0) Integer PREDICTION_CORRECT_REWARD
) {
}
```

- [ ] **Step 6: Add service**

```java
package com.example.horseracingtournamentsystem.point;

import java.util.EnumMap;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PointSettingsService {

    private final PointSettingRepository repository;

    public PointSettingsService(PointSettingRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public PointSettingResponse getSettings() {
        Map<PointSettingKey, Integer> values = readAllValues();
        return toResponse(values);
    }

    @Transactional
    public PointSettingResponse updateSettings(UpdatePointSettingsRequest request) {
        save(PointSettingKey.FIRST_LOGIN_BONUS, request.FIRST_LOGIN_BONUS());
        save(PointSettingKey.BLOG_REWARD_POINTS, request.BLOG_REWARD_POINTS());
        save(PointSettingKey.DAILY_BLOG_REWARD_LIMIT, request.DAILY_BLOG_REWARD_LIMIT());
        save(PointSettingKey.PREDICTION_ENTRY_COST, request.PREDICTION_ENTRY_COST());
        save(PointSettingKey.PREDICTION_CORRECT_REWARD, request.PREDICTION_CORRECT_REWARD());
        return getSettings();
    }

    @Transactional(readOnly = true)
    public int getInt(PointSettingKey key) {
        return repository.findById(key)
                .map(PointSetting::getValue)
                .orElse(0);
    }

    private Map<PointSettingKey, Integer> readAllValues() {
        Map<PointSettingKey, Integer> values = new EnumMap<>(PointSettingKey.class);
        for (PointSettingKey key : PointSettingKey.values()) {
            values.put(key, getInt(key));
        }
        return values;
    }

    private void save(PointSettingKey key, int value) {
        PointSetting setting = repository.findById(key)
                .orElseGet(() -> new PointSetting(key, 0, defaultDescription(key)));
        setting.setValue(value);
        setting.markUpdated();
        repository.save(setting);
    }

    private PointSettingResponse toResponse(Map<PointSettingKey, Integer> values) {
        return new PointSettingResponse(
                values.get(PointSettingKey.FIRST_LOGIN_BONUS),
                values.get(PointSettingKey.BLOG_REWARD_POINTS),
                values.get(PointSettingKey.DAILY_BLOG_REWARD_LIMIT),
                values.get(PointSettingKey.PREDICTION_ENTRY_COST),
                values.get(PointSettingKey.PREDICTION_CORRECT_REWARD)
        );
    }

    private String defaultDescription(PointSettingKey key) {
        return switch (key) {
            case FIRST_LOGIN_BONUS -> "Points awarded by a future first-login bonus flow";
            case BLOG_REWARD_POINTS -> "Points awarded by a future blog-read reward flow";
            case DAILY_BLOG_REWARD_LIMIT -> "Maximum blog-read rewards per user per day in a future flow";
            case PREDICTION_ENTRY_COST -> "Points required to enter a future race prediction";
            case PREDICTION_CORRECT_REWARD -> "Points awarded for a future correct race prediction";
        };
    }
}
```

- [ ] **Step 7: Add admin controller**

```java
package com.example.horseracingtournamentsystem.point;

import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/point-settings")
@PreAuthorize("hasRole('ADMIN')")
public class AdminPointSettingsController {

    private final PointSettingsService service;

    public AdminPointSettingsController(PointSettingsService service) {
        this.service = service;
    }

    @GetMapping
    public PointSettingResponse getSettings() {
        return service.getSettings();
    }

    @PutMapping
    public PointSettingResponse updateSettings(@Valid @RequestBody UpdatePointSettingsRequest request) {
        return service.updateSettings(request);
    }
}
```

- [ ] **Step 8: Run backend tests**

Run:

```powershell
cd backend
mvn -Dtest=AdminPointSettingsIntegrationTest test
```

Expected: tests pass.

---

### Task 4: Frontend API Client

**Files:**

- Create: `frontend/src/types/pointSettings.ts`
- Create: `frontend/src/api/pointSettingsApi.ts`
- Create: `frontend/src/api/pointSettingsApi.test.ts`

- [ ] **Step 1: Add shared type**

```ts
export type PointSettings = {
  FIRST_LOGIN_BONUS: number;
  BLOG_REWARD_POINTS: number;
  DAILY_BLOG_REWARD_LIMIT: number;
  PREDICTION_ENTRY_COST: number;
  PREDICTION_CORRECT_REWARD: number;
};
```

- [ ] **Step 2: Add API module**

```ts
import { API_BASE_URL } from "./config";
import type { PointSettings } from "../types/pointSettings";

const endpoint = `${API_BASE_URL}/admin/point-settings`;

async function parseResponse(response: Response): Promise<PointSettings> {
  if (!response.ok) {
    throw new Error(`Point settings request failed with status ${response.status}`);
  }
  return response.json();
}

export async function getPointSettings(): Promise<PointSettings> {
  const response = await fetch(endpoint, {
    credentials: "include",
  });
  return parseResponse(response);
}

export async function updatePointSettings(settings: PointSettings): Promise<PointSettings> {
  const response = await fetch(endpoint, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(settings),
  });
  return parseResponse(response);
}
```

- [ ] **Step 3: Add API tests**

```ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { getPointSettings, updatePointSettings } from "./pointSettingsApi";
import type { PointSettings } from "../types/pointSettings";

const settings: PointSettings = {
  FIRST_LOGIN_BONUS: 0,
  BLOG_REWARD_POINTS: 10,
  DAILY_BLOG_REWARD_LIMIT: 3,
  PREDICTION_ENTRY_COST: 5,
  PREDICTION_CORRECT_REWARD: 25,
};

describe("pointSettingsApi", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches admin point settings", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(settings), { status: 200 })
    );

    await expect(getPointSettings()).resolves.toEqual(settings);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/admin/point-settings"),
      expect.objectContaining({ credentials: "include" })
    );
  });

  it("updates admin point settings", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(settings), { status: 200 })
    );

    await expect(updatePointSettings(settings)).resolves.toEqual(settings);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/admin/point-settings"),
      expect.objectContaining({
        method: "PUT",
        credentials: "include",
        body: JSON.stringify(settings),
      })
    );
  });
});
```

- [ ] **Step 4: Run API tests**

Run:

```powershell
cd frontend
npm.cmd test -- --run src/api/pointSettingsApi.test.ts
```

Expected: tests pass.

---

### Task 5: Admin Point Settings Page

**Files:**

- Create: `frontend/src/pages/admin/AdminPointSettingsPage.tsx`
- Create: `frontend/src/pages/admin/AdminPointSettingsPage.test.tsx`

- [ ] **Step 1: Add page component**

Use existing admin page visual conventions. The component must:

- Call `getPointSettings()` on mount.
- Render five labeled numeric inputs.
- Keep values controlled.
- Reject negative values before calling the API.
- Call `updatePointSettings()` on submit.
- Render `role="alert"` for errors.
- Render `role="status"` for save success.

Field metadata:

```ts
const fields = [
  { key: "FIRST_LOGIN_BONUS", label: "First login bonus" },
  { key: "BLOG_REWARD_POINTS", label: "Blog reward points" },
  { key: "DAILY_BLOG_REWARD_LIMIT", label: "Daily blog reward limit" },
  { key: "PREDICTION_ENTRY_COST", label: "Prediction entry cost" },
  { key: "PREDICTION_CORRECT_REWARD", label: "Prediction correct reward" },
] as const;
```

- [ ] **Step 2: Add page tests**

Create tests that prove:

- The page renders loaded values.
- Editing `Blog reward points` and saving calls `updatePointSettings`.
- Entering `-1` shows a validation alert and does not save.
- A rejected load shows an error alert.

Use Testing Library selectors based on accessible labels:

```ts
screen.getByLabelText(/blog reward points/i)
screen.getByRole("button", { name: /save/i })
screen.getByRole("alert")
screen.getByRole("status")
```

- [ ] **Step 3: Run page tests**

Run:

```powershell
cd frontend
npm.cmd test -- --run src/pages/admin/AdminPointSettingsPage.test.tsx
```

Expected: tests pass.

---

### Task 6: Frontend Route Integration

**Files:**

- Modify: `frontend/src/AppRouter.tsx`
- Modify: `frontend/src/App.test.tsx`

- [ ] **Step 1: Replace `/admin/points` placeholder route**

Import the page:

```ts
import { AdminPointSettingsPage } from "./pages/admin/AdminPointSettingsPage";
```

Route `/admin/points` should render:

```tsx
<AdminPointSettingsPage />
```

- [ ] **Step 2: Add route coverage**

In `frontend/src/App.test.tsx`, ensure `/admin/points` renders the point settings page for an admin user. Mock the API if the existing router tests mock page dependencies.

Expected assertion:

```ts
expect(await screen.findByRole("heading", { name: /point settings/i })).toBeInTheDocument();
```

- [ ] **Step 3: Run route tests**

Run:

```powershell
cd frontend
npm.cmd test -- --run src/App.test.tsx
```

Expected: tests pass.

---

### Task 7: Full Verification

**Files:**

- No source changes unless verification reveals a defect.

- [ ] **Step 1: Run focused backend tests**

Run:

```powershell
cd backend
mvn -Dtest=AdminPointSettingsIntegrationTest test
```

Expected: build success and all `AdminPointSettingsIntegrationTest` tests pass.

- [ ] **Step 2: Run related backend smoke tests**

Run:

```powershell
cd backend
mvn -Dtest=AdminBlogIntegrationTest,RoleAuthorizationIntegrationTest test
```

Expected: build success and selected existing admin/security tests pass.

- [ ] **Step 3: Run focused frontend tests**

Run:

```powershell
cd frontend
npm.cmd test -- --run src/api/pointSettingsApi.test.ts src/pages/admin/AdminPointSettingsPage.test.tsx src/App.test.tsx
```

Expected: all selected frontend tests pass.

- [ ] **Step 4: Run frontend build**

Run:

```powershell
cd frontend
npm.cmd run build
```

Expected: Vite build completes successfully.

- [ ] **Step 5: Inspect diff**

Run:

```powershell
git diff -- backend/src/main/resources/schema.sql backend/src/main/java/com/example/horseracingtournamentsystem/point backend/src/test/java/com/example/horseracingtournamentsystem/point frontend/src/types/pointSettings.ts frontend/src/api/pointSettingsApi.ts frontend/src/pages/admin/AdminPointSettingsPage.tsx frontend/src/AppRouter.tsx frontend/src/App.test.tsx
```

Expected: diff contains only Admin Point Settings changes.

---

## Out Of Scope

Do not implement these in this plan:

- Blog reward claiming.
- Daily blog reward history.
- Point transaction ledger.
- Race prediction entry submission.
- Correct prediction payout.
- First-login bonus award flow.

The only reusable hook for future work is `PointSettingsService.getInt(PointSettingKey key)`.

## Self-Review

Spec coverage:

- Database table and seeds: Task 1.
- Backend entity, repository, service, controller: Task 3.
- Admin GET/PUT API: Tasks 2 and 3.
- Frontend `/admin/points` page: Tasks 5 and 6.
- Non-negative validation: Tasks 2, 3, and 5.
- Tests and build verification: Tasks 2, 4, 5, 6, and 7.
- Blog reward and prediction integration rules: documented as future work and explicitly out of scope.

Placeholder scan:

- The plan contains concrete file paths, commands, expected outcomes, and code skeletons for implementation.

Type consistency:

- Backend keys match the API response fields and frontend `PointSettings` type exactly.
