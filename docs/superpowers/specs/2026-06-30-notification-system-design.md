# Design Spec: System-wide Notification Integration

This specification describes the integration of in-app notifications across all frontend pages and layouts, along with the required backend event triggers for user role requests, horse profiles, top-up orders, and withdrawals.

## 1. Goal & Product Context
Users currently perform actions in various roles (Admin, Organizer, Horse Owner, Referee, Jockey, and Spectator). When a cross-role event occurs (e.g., an Admin approves a horse owner's role request, or an Organizer approves a tournament registration), the target user must be notified without needing to manually poll.
Currently, the backend has a general notification system, but it is only partially integrated. We will:
1. Trigger notifications on key backend events that are currently silent.
2. Render a themed `NotificationBell` in all frontend layouts (Admin, Organizer, Owner, Referee, Jockey, and Spectator).
3. Enable automatic navigation when clicking on a notification item based on its entity type and ID.

---

## 2. Backend Notification Triggers

We will add notifications for the following events:

### A. Role Request Status Changes
* **File**: [AdminRoleRequestService.java](file:///e:/SWP391_Project/SWP391-horse-racing-tournament-system/backend/src/main/java/com/example/horseracingtournamentsystem/user/service/AdminRoleRequestService.java)
* **Triggers**:
  * **On Approval (`approve`)**:
    * Recipient: `request.getUser()`
    * Type: `"ROLE_APPROVED"`
    * Title: `"Role request approved"`
    * Body: `"Your request to become a " + request.getRequestedRole() + " was approved."`
    * Reference Type: `"ROLE_REQUEST"`
    * Reference ID: `request.getId()`
  * **On Rejection (`reject`)**:
    * Recipient: `request.getUser()`
    * Type: `"ROLE_REJECTED"`
    * Title: `"Role request rejected"`
    * Body: `"Your request to become a " + request.getRequestedRole() + " was rejected: " + reason.trim()`
    * Reference Type: `"ROLE_REQUEST"`
    * Reference ID: `request.getId()`

### B. Horse Profile Approval Changes
* **File**: [HorseService.java](file:///e:/SWP391_Project/SWP391-horse-racing-tournament-system/backend/src/main/java/com/example/horseracingtournamentsystem/horse/service/HorseService.java)
* **Triggers**:
  * **On Approval (`approveHorse`)**:
    * Recipient: `horse.getOwner()`
    * Type: `"HORSE_APPROVED"`
    * Title: `"Horse profile approved"`
    * Body: `"Your horse \"" + horse.getName() + "\" was approved."`
    * Reference Type: `"HORSE"`
    * Reference ID: `horse.getId()`
  * **On Rejection (`rejectHorse`)**:
    * Recipient: `horse.getOwner()`
    * Type: `"HORSE_REJECTED"`
    * Title: `"Horse profile rejected"`
    * Body: `"Your horse \"" + horse.getName() + "\" was rejected" + (reason == null || reason.isBlank() ? "." : ": " + reason.trim())`
    * Reference Type: `"HORSE"`
    * Reference ID: `horse.getId()`

### C. Withdrawal Request Status Changes
* **File**: [WithdrawalService.java](file:///e:/SWP391_Project/SWP391-horse-racing-tournament-system/backend/src/main/java/com/example/horseracingtournamentsystem/wallet/service/WithdrawalService.java)
* **Triggers**:
  * **On Approval (`approve`)**:
    * Recipient: `request.getUser()`
    * Type: `"WITHDRAWAL_APPROVED"`
    * Title: `"Withdrawal approved"`
    * Body: `"Your withdrawal request #" + request.getId() + " was approved."`
    * Reference Type: `"WITHDRAWAL"`
    * Reference ID: `request.getId()`
  * **On Rejection (`reject`)**:
    * Recipient: `request.getUser()`
    * Type: `"WITHDRAWAL_REJECTED"`
    * Title: `"Withdrawal rejected"`
    * Body: `"Your withdrawal request #" + request.getId() + " was rejected: " + note`
    * Reference Type: `"WITHDRAWAL"`
    * Reference ID: `request.getId()`
  * **On Paid (`markPaid`)**:
    * Recipient: `request.getUser()`
    * Type: `"WITHDRAWAL_PAID"`
    * Title: `"Withdrawal processed"`
    * Body: `"Your withdrawal request #" + request.getId() + " has been processed."`
    * Reference Type: `"WITHDRAWAL"`
    * Reference ID: `request.getId()`

### D. Top-up Success
* **File**: [TopUpService.java](file:///e:/SWP391_Project/SWP391-horse-racing-tournament-system/backend/src/main/java/com/example/horseracingtournamentsystem/wallet/service/TopUpService.java)
* **Trigger**:
  * **On Success (`processResult` when payment status is verified and successful)**:
    * Recipient: `order.getUser()`
    * Type: `"TOPUP_SUCCESS"`
    * Title: `"Top-up successful"`
    * Body: `"Your wallet has been topped up with " + order.getAmount() + " VND."`
    * Reference Type: `"TOPUP_ORDER"`
    * Reference ID: `order.getId()`

---

## 3. Frontend Layout Integration

We will display [NotificationBell.tsx](file:///e:/SWP391_Project/SWP391-horse-racing-tournament-system/frontend/src/components/NotificationBell.tsx) in all layouts.

### A. Theme Customization Props
We will enhance [NotificationBell.tsx](file:///e:/SWP391_Project/SWP391-horse-racing-tournament-system/frontend/src/components/NotificationBell.tsx) to support color customization props or a `theme` prop:
```tsx
export interface NotificationBellProps {
  theme?: "client" | "admin" | "organizer" | "owner" | "referee" | "jockey";
}
```
Depending on the `theme` value, classes for the icon button, badge background, border, and dropdown bg/text will adapt:
* **`client`**: Icon/bell is `text-ivory-dim hover:text-ivory`, badge background is `bg-gold-400 text-turf-950`, dropdown container matches the dark translucent glass style of [ClientHeader.tsx](file:///e:/SWP391_Project/SWP391-horse-racing-tournament-system/frontend/src/components/client/ClientHeader.tsx).
* **`admin`**: Badge background is `bg-[#b3193a] text-white`, button border/focus outline is `focus-visible:outline-[#b3193a]`.
* **`owner`**: Badge background is `bg-[#006d5b] text-white`, focus outline is `focus-visible:outline-[#006d5b]`.
* **`organizer`**: Keeps current wood/brown palette.
* **`referee`**: Badge background is `bg-blue-600 text-white`.
* **`jockey`**: Badge background is `bg-indigo-600 text-white`.

### B. Navigation Map
In the dropdown, when a user clicks on an unread or read notification item, they will be navigated using `useNavigate()` based on the notification type and `referenceType`/`referenceId`:

| `referenceType` | Role context / Condition | Target Path | Fallback Path |
| :--- | :--- | :--- | :--- |
| `ROLE_REQUEST` | If role approved is `HORSE_OWNER` | `/owner/dashboard` | `/profile` |
| `ROLE_REQUEST` | If role approved is `ORGANIZER` | `/organizer` | `/profile` |
| `ROLE_REQUEST` | If role approved is `REFEREE` | `/referee/dashboard` | `/profile` |
| `ROLE_REQUEST` | If role approved is `JOCKEY` | `/jockey/dashboard` | `/profile` |
| `ROLE_REQUEST` | If rejected | `/profile` | `/profile` |
| `HORSE` | Any | `/owner/horses` | `/owner/horses` |
| `WITHDRAWAL` | Any | `/wallet` | `/wallet` |
| `TOPUP_ORDER` | Any | `/wallet` | `/wallet` |
| `TOURNAMENT` | If current layout is Organizer | `/organizer` | `/championships/${referenceId}` |
| `TOURNAMENT` | If current layout is Admin | `/admin/tournaments` | `/championships/${referenceId}` |
| `TOURNAMENT` | Other | `/championships/${referenceId}` | `/championships/${referenceId}` |
| `TOURNAMENT_REGISTRATION` | Any | `/owner/registrations` | `/owner/registrations` |
| `REFEREE_CONTRACT` | If Referee | `/referee/dashboard` | `/referee/dashboard` |
| `REFEREE_CONTRACT` | If Organizer | `/organizer` | `/organizer` |
| `JOCKEY_POOL_APPLICATION` | If Jockey | `/jockey/dashboard` | `/jockey/dashboard` |
| `RACE` | If Referee | `/referee/dashboard` | `/races/${referenceId}` |

### C. Layout Injection Points
We will place `<NotificationBell theme="..." />` in:
1. [AdminLayout.tsx](file:///e:/SWP391_Project/SWP391-horse-racing-tournament-system/frontend/src/layouts/AdminLayout.tsx): Inside the header controls section, next to the admin profile button.
2. [OwnerLayout.tsx](file:///e:/SWP391_Project/SWP391-horse-racing-tournament-system/frontend/src/layouts/OwnerLayout.tsx): Inside the header controls section, next to the logout button.
3. [RefereeLayout.tsx](file:///e:/SWP391_Project/SWP391-horse-racing-tournament-system/frontend/src/layouts/RefereeLayout.tsx): Inside the header controls section.
4. [JockeyLayout.tsx](file:///e:/SWP391_Project/SWP391-horse-racing-tournament-system/frontend/src/layouts/JockeyLayout.tsx): Inside the header controls section.
5. [ClientHeader.tsx](file:///e:/SWP391_Project/SWP391-horse-racing-tournament-system/frontend/src/components/client/ClientHeader.tsx): Replacing the static placeholder with the real `<NotificationBell theme="client" />`.

---

## 4. Testing & Verification

### Backend Unit Tests
* **Role Request Notifications**: Verify mock interactions in `AdminRoleRequestServiceTest` or equivalent.
* **Horse Notifications**: Verify that `HorseService.approveHorse` and `rejectHorse` trigger `notificationService.notify(...)` properly.
* **Wallet Notifications**: Verify `TopUpService` and `WithdrawalService` methods.

### Frontend Integration Tests
* Open each layout as a signed-in user and verify the `NotificationBell` renders and matches the theme color scheme.
* Click on a mock notification item and verify it triggers `markNotificationRead` API call and navigates to the correct route.
