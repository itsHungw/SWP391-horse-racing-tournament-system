# Design Specification: Spectator Predictions Flow (Đấu trường Dự đoán)

## 1. Goal & Product Context

The prediction game is an engagement layer designed to increase spectator interest and interaction with upcoming horse races. Spectators use virtual, in-system points (earned by reading published blog posts) to submit race predictions.

This design covers:
1. The backend endpoint updates (listing open races, including community choices and visibility logic).
2. The Frontend structure for the **Đấu trường Dự đoán** workspace, separating components by feature boundaries and keeping styles synchronized with the existing credentials/profile UI.

### Vocabulary Guard
To prevent gambling associations and maintain system compliance, the following terms **MUST NOT** appear in new UI copy, API DTO naming, feature component naming, or new business-facing comments:
*   *Betting*, *Bet*, *Wager*, *Gambling*, *Odds*, *Pool*, *Winner Bet*, *Loser Bet*.
Instead, use:
*   *Prediction*, *Predict*, *Entry Cost*, *Reward*, *Correct*, *Incorrect*, *Points*.

---

## 2. API Endpoints Contract

### 2.1 GET `/api/v1/races/open-for-prediction` [NEW]
Retrieves the list of active races that are open for predictions.

*   **Logic**: Returns all races that are open for prediction. A race is open if:
    *   `status = 'SCHEDULED'`
    *   `deletedAt IS NULL`
    *   `raceAt > current_timestamp`
    *   Sufficient participants: it has at least 2 active `race_participants`
    *   Prediction feature is enabled for the tournament/race.
*   **Response**: `List<OpenRacePredictionResponse>`
    ```json
    [
      {
        "raceId": 101,
        "raceName": "Belmont Stakes",
        "roundName": "Round 4",
        "tournamentId": 1,
        "tournamentName": "Summer Championship 2026",
        "raceAt": "2026-06-06T11:00:00",
        "status": "SCHEDULED",
        "totalPredictions": 128,
        "predictedByUser": {
          "hasPredicted": true,
          "types": ["WINNER"] // Types submitted by user: "WINNER", "TOP3"
        }
      }
    ]
    ```

### 2.2 GET `/api/v1/races/{raceId}/prediction-options` [MODIFY]
Returns participant options and community selection rates.

*   **Logic**:
    *   `winnerDistributionVisible` is `true` if and only if the current user has already submitted a prediction of type `WINNER` for this race.
    *   `top3DistributionVisible` is `true` if and only if the current user has already submitted a prediction of type `TOP3` for this race.
    *   Community Choices Rate Logic:
        *   `communityWinnerRate`: Number of predictions of type `WINNER` for this participant as Winner / Total predictions of type `WINNER` for this race. (Only returned if `winnerDistributionVisible = true`, otherwise `null`).
        *   `communityTop3Rate`: Number of predictions of type `TOP3` containing this participant (in any position) / Total predictions of type `TOP3` for this race. (Only returned if `top3DistributionVisible = true`, otherwise `null`).
*   **Response**:
    ```json
    {
      "raceId": 101,
      "raceName": "Belmont Stakes",
      "raceStatus": "SCHEDULED",
      "predictionOpen": true,
      "entryCost": {
        "winner": 5,
        "top3": 10
      },
      "myPredictions": [
        {
          "id": 15,
          "predictionType": "WINNER",
          "predictedWinnerId": 3,
          "status": "PENDING",
          "entryCostPoints": 5
        }
      ],
      "winnerDistributionVisible": true,
      "top3DistributionVisible": false,
      "options": [
        {
          "raceParticipantId": 3,
          "startNumber": 1,
          "laneNumber": 1,
          "horseName": "Thunder Bolt",
          "jockeyName": "Nguyen Van A",
          "communityWinnerRate": 0.42,
          "communityTop3Rate": null
        }
      ]
    }
    ```

---

## 3. Frontend Architecture & Directory Layout

To maintain code separation and enforce clear boundary responsibilities, the code will be placed under a dedicated feature folder:

```text
frontend/src/pages/spectator/predictions/
├─ SpectatorPredictionsPage.tsx
├─ components/
│  ├─ PredictionArenaHeader.tsx
│  ├─ ActiveRacesList.tsx
│  ├─ PredictionFormPanel.tsx
│  ├─ CommunityChoices.tsx
│  ├─ MyPredictionsList.tsx
│  └─ PredictionResultCard.tsx
├─ hooks/
│  └─ useSpectatorPredictions.ts
├─ services/
│  └─ spectatorPredictionApi.ts
└─ types/
   └─ prediction.types.ts
```

### 3.1 Components Responsibility

#### `SpectatorPredictionsPage.tsx`
Orchestrates the page-level tabs and coordinates layout.
*   Manages current active tab (`"open"` vs `"my"`).
*   Manages `selectedRaceId` state.
*   Passes variables retrieved from the custom hook down to child components (exactly 1 level deep).
*   Renders a grid layout on desktop: Left panel (ActiveRacesList) and Right panel (PredictionFormPanel).

#### `PredictionArenaHeader.tsx`
Renders spectator's header summary.
*   Displays the title "Đấu trường Dự đoán".
*   Shows current Virtual Point Balance: `"Prediction Points: X điểm khả dụng"`.
*   Offers action button: `"Đọc bài viết để nhận điểm"`, redirecting to `/blog`.

#### `ActiveRacesList.tsx`
Renders the list of races open for prediction.
*   Lists active races in cards.
*   Displays Round, Tournament Name, Race time, and live Countdown remaining (`"Đóng trong 2 giờ 14 phút"`).
*   Displays indicator if the user has already predicted the race.
*   Highlights the selected card with an active border state.

#### `PredictionFormPanel.tsx`
Processes prediction submissions and updates.
*   Winner vs Top 3 Tab Selectors showing cost (5 pts / 10 pts).
*   Validates that selected participants in Top 3 are distinct.
*   Displays cost preview and balance after submit: `"Số dư sau khi gửi: X điểm"`.
*   Shows confirmation dialog containing choices summary, fee, and final balance before submit.
*   Renders warning message if points are insufficient: `"Bạn cần thêm X điểm để gửi dự đoán này. [Đọc bài viết để nhận điểm]"`.
*   Loads and embeds `CommunityChoices.tsx` at the bottom if the respective distribution visibility flag (`winnerDistributionVisible` or `top3DistributionVisible`) is `true`.

#### `CommunityChoices.tsx`
Displays community choices distribution in bar charts.
*   Lists horses with progress bars showing the selection percentage.
*   Adapts rate display according to user's prediction: shows Winner Selection Rate for Winner predictions, and Top 3 Selection Rate for Top 3 predictions.

#### `MyPredictionsList.tsx`
Lists user's historical predictions.
*   Offers status filters: *Tất cả, Đang chờ, Đã khóa, Đã có kết quả, Đã hoàn điểm*.
*   Displays the details of the submitted predictions.
*   Includes `resultCategory` field (derived dynamically: `WINNER_CORRECT`, `TOP3_EXACT`, `TOP3_ANY_ORDER`, `INCORRECT`, `REFUNDED`) for evaluated predictions.
*   Renders "Chỉnh sửa" button if `prediction.status = 'PENDING'` and `race.status = 'SCHEDULED'`.
*   Renders `PredictionResultCard.tsx` if evaluated.

#### `PredictionResultCard.tsx`
Renders the results badges:
*   Correct Winner: `+10 điểm` (Green, CheckCircle)
*   Exact Top 3: `+30 điểm` (Green, CheckCircle)
*   Top 3 Any Order: `+15 điểm` (Green, CheckCircle)
*   Incorrect (Chưa chính xác): `0 điểm` (Gray, XCircle)
*   Refunded (Đã hoàn điểm): `+5/10 điểm` (Orange)

---

## 4. Business Rules

### 4.1 Update & Edit Rules
A spectator can modify their selections for a prediction under the following conditions:
*   The prediction's status is `PENDING`.
*   The race's status is `SCHEDULED`.
*   The modification only changes horse selections. **Changing prediction type (e.g. Winner to Top 3) is forbidden**.
*   No additional points are deducted, and no points are refunded during updates.

### 4.2 Locked Predictions
Once a race status transitions to `CHECKING` or later, predictions are locked.
*   The form panel displays: `"Dự đoán đã khóa. Cuộc đua đã bắt đầu kiểm tra trước giờ thi đấu."`
*   No edit or submission actions are allowed.

### 4.3 Status Mapping
All prediction statuses are mapped centrally:
*   `PENDING`: `"Đang chờ"`
*   `LOCKED`: `"Đã khóa"`
*   `CORRECT`: `"Dự đoán đúng"`
*   `INCORRECT`: `"Chưa chính xác"`
*   `CANCELLED`: `"Đã hủy"`
*   `REFUNDED`: `"Đã hoàn điểm"`

---

## 5. UI/UX Style Guide (Synchronized with Project)

To match the existing credentials/profile screens, components will adopt:
*   **Colors**:
    *   Nền trang: `bg-[#f3f6f4]` (Xám xanh lá cây nhạt).
    *   Card Container: `bg-white border border-slate-200 rounded-lg shadow-sm`.
    *   Accent chính: `#006d5b` (Brand green). Hover state: `#004d3d`.
    *   Accents phụ: Cảnh báo đếm ngược màu vàng cát `#d4af37` hoặc màu đỏ `#e31837`.
*   **Typography**:
    *   Page Title: `font-black text-slate-950 tracking-tight text-4xl md:text-5xl`.
    *   Section Label: `text-xs font-black uppercase tracking-[0.16em] text-[#006d5b]`.
*   **Inputs**:
    *   `min-h-12 w-full rounded-md border border-slate-300 bg-white px-4 py-3 text-base font-bold text-slate-950 outline-none transition focus:border-[#006d5b] focus:ring-2 focus:ring-[#006d5b]/20`
*   **Buttons**:
    *   `inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[#006d5b] px-8 py-4 text-sm font-black text-white hover:bg-[#004d3d] transition disabled:opacity-60 shadow-md`

---

## 6. Verification Plan

### 6.1 Automated Tests
*   **Backend unit tests**: Verify logic in `PredictionService.java` for updating predictions, checking balance constraints, and generating correct exception codes when trying to change prediction types.
*   **Frontend type checks**: Compile frontend using `npx tsc -b` to make sure type definitions are error-free.

### 6.2 Manual Verification
*   Verify point balances before and after placing predictions.
*   Verify that community choices are hidden before prediction submission, and visible immediately after.
*   Verify that editing predictions is disabled when a race is no longer in `SCHEDULED` status.
