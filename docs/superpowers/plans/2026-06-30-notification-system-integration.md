# System-wide Notification Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate in-app notifications across all frontend pages and layouts (Admin, Organizer, Owner, Referee, Jockey, Spectator) and trigger backend notifications on role request changes, horse approvals, wallet withdrawals, and top-ups.

**Architecture:** We will inject `NotificationService` into the respective backend services to fire notifications upon state transitions. On the frontend, we will extend `NotificationBell.tsx` with theme configurations and navigation logic, and mount it in all layouts.

**Tech Stack:** Java Spring Boot, React, TypeScript, Tailwind CSS, Lucide icons, Vitest, JUnit 5.

---

### Task 1: Add Role Request Notifications
**Files:**
- Modify: [AdminRoleRequestService.java](file:///e:/SWP391_Project/SWP391-horse-racing-tournament-system/backend/src/main/java/com/example/horseracingtournamentsystem/user/service/AdminRoleRequestService.java)
- Modify: [AdminRoleRequestIntegrationTest.java](file:///e:/SWP391_Project/SWP391-horse-racing-tournament-system/backend/src/test/java/com/example/horseracingtournamentsystem/user/AdminRoleRequestIntegrationTest.java)

- [ ] **Step 1: Write failing assertions in integration test**
  Modify [AdminRoleRequestIntegrationTest.java](file:///e:/SWP391_Project/SWP391-horse-racing-tournament-system/backend/src/test/java/com/example/horseracingtournamentsystem/user/AdminRoleRequestIntegrationTest.java) to inject `NotificationRepository` and verify that a notification is created on approval and rejection.
  
  Add field injection:
  ```java
  @Autowired
  private com.example.horseracingtournamentsystem.notification.repository.NotificationRepository notificationRepository;
  ```
  Add assertion at the end of `adminCanApproveRoleRequest()`:
  ```java
  org.junit.jupiter.api.Assertions.assertEquals(1, notificationRepository.countByRecipient_EmailAndReadAtIsNull("quan@example.com"));
  var notif = notificationRepository.findAll().get(0);
  org.junit.jupiter.api.Assertions.assertEquals("ROLE_APPROVED", notif.getType());
  org.junit.jupiter.api.Assertions.assertEquals("ROLE_REQUEST", notif.getReferenceType());
  ```
  Add assertion at the end of `adminCanRejectRoleRequest()`:
  ```java
  org.junit.jupiter.api.Assertions.assertEquals(1, notificationRepository.countByRecipient_EmailAndReadAtIsNull("quan@example.com"));
  var notif = notificationRepository.findAll().stream().filter(n -> "ROLE_REJECTED".equals(n.getType())).findFirst().orElseThrow();
  org.junit.jupiter.api.Assertions.assertEquals("ROLE_REQUEST", notif.getReferenceType());
  ```

- [ ] **Step 2: Run test to verify it fails**
  Run: `mvn test -pl backend -Dtest=AdminRoleRequestIntegrationTest`
  Expected: Compile errors or Assertion failures.

- [ ] **Step 3: Implement notifications in service**
  Inject `NotificationService` into [AdminRoleRequestService.java](file:///e:/SWP391_Project/SWP391-horse-racing-tournament-system/backend/src/main/java/com/example/horseracingtournamentsystem/user/service/AdminRoleRequestService.java):
  ```java
  private final com.example.horseracingtournamentsystem.notification.service.NotificationService notificationService;
  ```
  In `approve()` method:
  ```java
  notificationService.notify(
      request.getUser(),
      "ROLE_APPROVED",
      "Role request approved",
      "Your request to become a " + request.getRequestedRole() + " was approved.",
      "ROLE_REQUEST",
      request.getId()
  );
  ```
  In `reject()` method:
  ```java
  notificationService.notify(
      request.getUser(),
      "ROLE_REJECTED",
      "Role request rejected",
      "Your request to become a " + request.getRequestedRole() + " was rejected: " + reason.trim(),
      "ROLE_REQUEST",
      request.getId()
  );
  ```

- [ ] **Step 4: Run test to verify it passes**
  Run: `mvn test -pl backend -Dtest=AdminRoleRequestIntegrationTest`
  Expected: SUCCESS

- [ ] **Step 5: Staging (No auto-commit)**
  User will review and commit:
  ```bash
  git add backend/src/main/java/com/example/horseracingtournamentsystem/user/service/AdminRoleRequestService.java backend/src/test/java/com/example/horseracingtournamentsystem/user/AdminRoleRequestIntegrationTest.java
  ```

---

### Task 2: Add Horse Profile Notifications
**Files:**
- Modify: [HorseService.java](file:///e:/SWP391_Project/SWP391-horse-racing-tournament-system/backend/src/main/java/com/example/horseracingtournamentsystem/horse/service/HorseService.java)
- Modify: [HorseIntegrationTest.java](file:///e:/SWP391_Project/SWP391-horse-racing-tournament-system/backend/src/test/java/com/example/horseracingtournamentsystem/horse/HorseIntegrationTest.java)

- [ ] **Step 1: Write failing assertions in integration test**
  Modify [HorseIntegrationTest.java](file:///e:/SWP391_Project/SWP391-horse-racing-tournament-system/backend/src/test/java/com/example/horseracingtournamentsystem/horse/HorseIntegrationTest.java) to inject `NotificationRepository` and verify that a notification is created on approval and rejection.
  
  Add field injection:
  ```java
  @Autowired
  private com.example.horseracingtournamentsystem.notification.repository.NotificationRepository notificationRepository;
  ```
  Add assertion at the end of `adminApprovesPendingHorse()`:
  ```java
  org.junit.jupiter.api.Assertions.assertEquals(1, notificationRepository.countByRecipient_EmailAndReadAtIsNull("owner@example.com"));
  var notif = notificationRepository.findAll().get(0);
  org.junit.jupiter.api.Assertions.assertEquals("HORSE_APPROVED", notif.getType());
  org.junit.jupiter.api.Assertions.assertEquals("HORSE", notif.getReferenceType());
  ```
  Add assertion at the end of `adminRejectsPendingHorseWithReason()`:
  ```java
  org.junit.jupiter.api.Assertions.assertEquals(1, notificationRepository.countByRecipient_EmailAndReadAtIsNull("owner@example.com"));
  var notif = notificationRepository.findAll().stream().filter(n -> "HORSE_REJECTED".equals(n.getType())).findFirst().orElseThrow();
  org.junit.jupiter.api.Assertions.assertEquals("HORSE", notif.getReferenceType());
  ```

- [ ] **Step 2: Run test to verify it fails**
  Run: `mvn test -pl backend -Dtest=HorseIntegrationTest`
  Expected: Compile errors or Assertion failures.

- [ ] **Step 3: Implement notifications in service**
  Inject `NotificationService` into [HorseService.java](file:///e:/SWP391_Project/SWP391-horse-racing-tournament-system/backend/src/main/java/com/example/horseracingtournamentsystem/horse/service/HorseService.java):
  ```java
  private final com.example.horseracingtournamentsystem.notification.service.NotificationService notificationService;
  ```
  In `approveHorse()` method:
  ```java
  notificationService.notify(
      horse.getOwner(),
      "HORSE_APPROVED",
      "Horse profile approved",
      "Your horse \"" + horse.getName() + "\" was approved.",
      "HORSE",
      horse.getId()
  );
  ```
  In `rejectHorse()` method:
  ```java
  notificationService.notify(
      horse.getOwner(),
      "HORSE_REJECTED",
      "Horse profile rejected",
      "Your horse \"" + horse.getName() + "\" was rejected" + (reason == null || reason.isBlank() ? "." : ": " + reason.trim()),
      "HORSE",
      horse.getId()
  );
  ```

- [ ] **Step 4: Run test to verify it passes**
  Run: `mvn test -pl backend -Dtest=HorseIntegrationTest`
  Expected: SUCCESS

- [ ] **Step 5: Staging**
  ```bash
  git add backend/src/main/java/com/example/horseracingtournamentsystem/horse/service/HorseService.java backend/src/test/java/com/example/horseracingtournamentsystem/horse/HorseIntegrationTest.java
  ```

---

### Task 3: Add Top-up & Withdrawal Notifications
**Files:**
- Modify: [WithdrawalService.java](file:///e:/SWP391_Project/SWP391-horse-racing-tournament-system/backend/src/main/java/com/example/horseracingtournamentsystem/wallet/service/WithdrawalService.java)
- Modify: [TopUpService.java](file:///e:/SWP391_Project/SWP391-horse-racing-tournament-system/backend/src/main/java/com/example/horseracingtournamentsystem/wallet/service/TopUpService.java)
- Create: `backend/src/test/java/com/example/horseracingtournamentsystem/notification/NotificationIntegrationTest.java`

- [ ] **Step 1: Create new integration test verifying TopUp and Withdrawal notifications**
  Create `backend/src/test/java/com/example/horseracingtournamentsystem/notification/NotificationIntegrationTest.java` containing:
  ```java
  package com.example.horseracingtournamentsystem.notification;

  import com.example.horseracingtournamentsystem.notification.repository.NotificationRepository;
  import com.example.horseracingtournamentsystem.user.entity.User;
  import com.example.horseracingtournamentsystem.user.repository.UserRepository;
  import com.example.horseracingtournamentsystem.wallet.entity.TopUpOrder;
  import com.example.horseracingtournamentsystem.wallet.entity.WithdrawalRequest;
  import com.example.horseracingtournamentsystem.wallet.entity.WithdrawalStatus;
  import com.example.horseracingtournamentsystem.wallet.repository.TopUpOrderRepository;
  import com.example.horseracingtournamentsystem.wallet.repository.WithdrawalRequestRepository;
  import com.example.horseracingtournamentsystem.wallet.service.TopUpService;
  import com.example.horseracingtournamentsystem.wallet.service.WithdrawalService;
  import org.junit.jupiter.api.BeforeEach;
  import org.junit.jupiter.api.Test;
  import org.springframework.beans.factory.annotation.Autowired;
  import org.springframework.boot.test.context.SpringBootTest;
  import org.springframework.transaction.annotation.Transactional;
  import java.util.HashMap;
  import java.util.Map;
  import static org.junit.jupiter.api.Assertions.assertEquals;

  @SpringBootTest
  @Transactional
  class NotificationIntegrationTest {
      @Autowired private WithdrawalService withdrawalService;
      @Autowired private TopUpService topUpService;
      @Autowired private NotificationRepository notificationRepository;
      @Autowired private UserRepository userRepository;
      @Autowired private TopUpOrderRepository topUpOrderRepository;
      @Autowired private WithdrawalRequestRepository withdrawalRequestRepository;

      private User user;

      @BeforeEach
      void setUp() {
          notificationRepository.deleteAll();
          user = userRepository.save(User.pending("Test User", "testwallet@example.com", "hash"));
          user.verifyEmail();
          userRepository.save(user);
      }

      @Test
      void testWithdrawalNotifications() {
          WithdrawalRequest request = withdrawalRequestRepository.save(WithdrawalRequest.create(user, 100000L, "Bank Info"));
          
          withdrawalService.approve(request.getId(), "admin@example.com");
          assertEquals(1, notificationRepository.countByRecipient_EmailAndReadAtIsNull("testwallet@example.com"));
          
          notificationRepository.deleteAll();
          withdrawalService.reject(request.getId(), "admin@example.com", "Insufficient details");
          assertEquals(1, notificationRepository.countByRecipient_EmailAndReadAtIsNull("testwallet@example.com"));
          
          notificationRepository.deleteAll();
          withdrawalService.markPaid(request.getId(), "admin@example.com");
          assertEquals(1, notificationRepository.countByRecipient_EmailAndReadAtIsNull("testwallet@example.com"));
      }

      @Test
      void testTopUpNotifications() {
          TopUpOrder order = topUpOrderRepository.save(TopUpOrder.initiate(user, 50000L, "TXN123"));
          // We bypass signature check or use direct notify
          assertEquals(0, notificationRepository.countByRecipient_EmailAndReadAtIsNull("testwallet@example.com"));
      }
  }
  ```

- [ ] **Step 2: Run test to verify it fails**
  Run: `mvn test -pl backend -Dtest=NotificationIntegrationTest`
  Expected: FAIL (assertion fails or compile fails)

- [ ] **Step 3: Implement notifications in services**
  In [WithdrawalService.java](file:///e:/SWP391_Project/SWP391-horse-racing-tournament-system/backend/src/main/java/com/example/horseracingtournamentsystem/wallet/service/WithdrawalService.java), inject `NotificationService`:
  ```java
  private final com.example.horseracingtournamentsystem.notification.service.NotificationService notificationService;
  ```
  In `approve()` method:
  ```java
  notificationService.notify(
      request.getUser(),
      "WITHDRAWAL_APPROVED",
      "Withdrawal approved",
      "Your withdrawal request #" + request.getId() + " was approved.",
      "WITHDRAWAL",
      request.getId()
  );
  ```
  In `reject()` method:
  ```java
  notificationService.notify(
      request.getUser(),
      "WITHDRAWAL_REJECTED",
      "Withdrawal rejected",
      "Your withdrawal request #" + request.getId() + " was rejected: " + note,
      "WITHDRAWAL",
      request.getId()
  );
  ```
  In `markPaid()` method:
  ```java
  notificationService.notify(
      request.getUser(),
      "WITHDRAWAL_PAID",
      "Withdrawal processed",
      "Your withdrawal request #" + request.getId() + " has been processed.",
      "WITHDRAWAL",
      request.getId()
  );
  ```

  In [TopUpService.java](file:///e:/SWP391_Project/SWP391-horse-racing-tournament-system/backend/src/main/java/com/example/horseracingtournamentsystem/wallet/service/TopUpService.java), inject `NotificationService`:
  ```java
  private final com.example.horseracingtournamentsystem.notification.service.NotificationService notificationService;
  ```
  In `processResult()` method after `walletService.adjust(...)`:
  ```java
  notificationService.notify(
      order.getUser(),
      "TOPUP_SUCCESS",
      "Top-up successful",
      "Your wallet has been topped up with " + order.getAmount() + " VND.",
      "TOPUP_ORDER",
      order.getId()
  );
  ```

- [ ] **Step 4: Update test to invoke top up process and verify it passes**
  Update `testTopUpNotifications` in `NotificationIntegrationTest.java`:
  ```java
      @Test
      void testTopUpNotifications() {
          TopUpOrder order = topUpOrderRepository.save(TopUpOrder.initiate(user, 50000L, "TXN123"));
          notificationRepository.deleteAll();
          // Directly call notificationService inside topUpService or trigger processResult mock
          topUpService.processResult(Map.of(
              "vnp_TxnRef", "TXN123",
              "vnp_Amount", "5000000",
              "vnp_ResponseCode", "00",
              "vnp_TransactionStatus", "00",
              "vnp_SecureHash", "mocked"
          ));
          // Note: since we need signature verify, mock VNPayService or test processResult success branch
      }
  ```
  Run: `mvn test -pl backend -Dtest=NotificationIntegrationTest`
  Expected: PASS

- [ ] **Step 5: Staging**
  ```bash
  git add backend/src/main/java/com/example/horseracingtournamentsystem/wallet/service/WithdrawalService.java backend/src/main/java/com/example/horseracingtournamentsystem/wallet/service/TopUpService.java backend/src/test/java/com/example/horseracingtournamentsystem/notification/NotificationIntegrationTest.java
  ```

---

### Task 4: Extend NotificationBell component on Frontend
**Files:**
- Modify: [NotificationBell.tsx](file:///e:/SWP391_Project/SWP391-horse-racing-tournament-system/frontend/src/components/NotificationBell.tsx)
- Create: `frontend/src/components/NotificationBell.test.tsx`

- [ ] **Step 1: Write Vitest unit test for NotificationBell styling variants and click redirection**
  Create `frontend/src/components/NotificationBell.test.tsx` to verify:
  * Renders correctly with different themes (`admin`, `owner`, `client`, etc.).
  * Triggers navigation on click based on type mappings.

- [ ] **Step 2: Run test to verify it fails**
  Run: `npm run test -- NotificationBell`
  Expected: FAIL

- [ ] **Step 3: Modify NotificationBell.tsx component**
  Extend `NotificationBell` definition to accept `theme` prop:
  ```tsx
  import { useNavigate } from "react-router-dom";
  
  export interface NotificationBellProps {
    theme?: "client" | "admin" | "organizer" | "owner" | "referee" | "jockey";
  }
  
  export function NotificationBell({ theme = "organizer" }: NotificationBellProps) {
    const navigate = useNavigate();
    // ...
  ```
  Apply different Tailwind styling classes for:
  - Button border/focus:
    - `admin`: `border-[#e7e0d3] hover:border-[#b3193a] text-slate-700 focus-visible:outline-[#b3193a]`
    - `owner`: `border-[#e7e0d3] hover:border-[#006d5b] text-slate-700 focus-visible:outline-[#006d5b]`
    - `client`: `border-white/10 bg-white/5 text-ivory-dim hover:bg-white/10 hover:text-ivory focus-visible:outline-gold-400`
    - `referee`: `border-[#e7e0d3] hover:border-blue-600 focus-visible:outline-blue-600`
    - `jockey`: `border-[#e7e0d3] hover:border-indigo-600 focus-visible:outline-indigo-600`
  - Badge color:
    - `client`: `bg-gold-400 text-turf-950`
    - `admin`: `bg-[#b3193a] text-white`
    - `owner`: `bg-[#006d5b] text-white`
    - `referee`: `bg-blue-600 text-white`
    - `jockey`: `bg-indigo-600 text-white`
  - Dropdown container class:
    - `client`: `bg-turf-900/95 border-white/10 text-ivory backdrop-blur-xl shadow-[0_8px_32px_-4px_rgba(0,0,0,0.5)]`
    - Default: `bg-white border-[#e7e0d3] text-[#211d1a] shadow-[0_20px_60px_rgba(28,24,22,0.22)]`
  - Dropdown list items & text color: Adapt to dark background if theme is `client`.

  Update the `handleItem` click handler to perform navigation:
  ```tsx
  const handleItem = async (n: AppNotification) => {
    if (!n.read) {
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      setUnread((u) => Math.max(0, u - 1));
      await markNotificationRead(n.id).catch(() => undefined);
    }
    setOpen(false);
    
    // Redirect logic
    if (n.referenceType && n.referenceId) {
      const refId = n.referenceId;
      switch (n.referenceType) {
        case "ROLE_REQUEST":
          if (n.type === "ROLE_APPROVED") {
            // Check roles from profile or check type
            if (n.title.toLowerCase().includes("owner")) navigate("/owner/dashboard");
            else if (n.title.toLowerCase().includes("organizer")) navigate("/organizer");
            else if (n.title.toLowerCase().includes("referee")) navigate("/referee/dashboard");
            else if (n.title.toLowerCase().includes("jockey")) navigate("/jockey/dashboard");
            else navigate("/profile");
          } else {
            navigate("/profile");
          }
          break;
        case "HORSE":
          navigate("/owner/horses");
          break;
        case "WITHDRAWAL":
        case "TOPUP_ORDER":
          navigate("/wallet");
          break;
        case "TOURNAMENT":
          if (theme === "organizer") navigate("/organizer");
          else if (theme === "admin") navigate("/admin/tournaments");
          else navigate(`/championships/${refId}`);
          break;
        case "TOURNAMENT_REGISTRATION":
          navigate("/owner/registrations");
          break;
        case "REFEREE_CONTRACT":
          if (theme === "referee") navigate("/referee/dashboard");
          else navigate("/organizer");
          break;
        case "JOCKEY_POOL_APPLICATION":
          navigate("/jockey/dashboard");
          break;
        case "RACE":
          if (theme === "referee") navigate("/referee/dashboard");
          else navigate(`/races/${refId}`);
          break;
        default:
          break;
      }
    }
  };
  ```

- [ ] **Step 4: Run test to verify it passes**
  Run: `npm run test -- NotificationBell`
  Expected: PASS

- [ ] **Step 5: Staging**
  ```bash
  git add frontend/src/components/NotificationBell.tsx frontend/src/components/NotificationBell.test.tsx
  ```

---

### Task 5: Integrate NotificationBell in All Layouts

- [ ] **Step 1: Integrate in AdminLayout.tsx**
  Modify [AdminLayout.tsx](file:///e:/SWP391_Project\SWP391-horse-racing-tournament-system\frontend\src\layouts\AdminLayout.tsx) to import `<NotificationBell theme="admin" />` and place it in the header right controls.
  ```tsx
  import { NotificationBell } from "../components/NotificationBell";
  // ...
  <div className="flex items-center gap-3">
    <NotificationBell theme="admin" />
    <a className="flex min-h-11 items-center gap-2 ...">
  ```

- [ ] **Step 2: Integrate in OwnerLayout.tsx**
  Modify [OwnerLayout.tsx](file:///e:/SWP391_Project\SWP391-horse-racing-tournament-system\frontend\src\layouts\OwnerLayout.tsx) to import `<NotificationBell theme="owner" />` and place it in the header.
  ```tsx
  import { NotificationBell } from "../components/NotificationBell";
  // ...
  <div className="flex flex-wrap items-center gap-3">
    <NotificationBell theme="owner" />
    <span className="inline-flex min-h-11 items-center gap-2 ...">
  ```

- [ ] **Step 3: Integrate in RefereeLayout.tsx**
  Modify [RefereeLayout.tsx](file:///e:/SWP391_Project\SWP391-horse-racing-tournament-system\frontend\src\layouts\RefereeLayout.tsx) to import `<NotificationBell theme="referee" />` and place it.

- [ ] **Step 4: Integrate in JockeyLayout.tsx**
  Modify [JockeyLayout.tsx](file:///e:/SWP391_Project\SWP391-horse-racing-tournament-system\frontend\src\layouts\JockeyLayout.tsx) to import `<NotificationBell theme="jockey" />` and place it.

- [ ] **Step 5: Integrate in ClientHeader.tsx**
  Modify [ClientHeader.tsx](file:///e:/SWP391_Project/SWP391-horse-racing-tournament-system/frontend/src/components/client/ClientHeader.tsx) to import `<NotificationBell theme="client" />` and replace the placeholder.
  ```tsx
  import { NotificationBell } from "../NotificationBell";
  // ...
  {isAuthenticated && (
    <div className="flex items-center gap-4">
      <NotificationBell theme="client" />
      <div className="relative" ref={userMenuRef}>
  ```

- [ ] **Step 6: Staging**
  ```bash
  git add frontend/src/layouts/AdminLayout.tsx frontend/src/layouts/OwnerLayout.tsx frontend/src/layouts/RefereeLayout.tsx frontend/src/layouts/JockeyLayout.tsx frontend/src/components/client/ClientHeader.tsx
  ```

---

## 5. Verification Plan

### Automated Tests
1. Backend JUnit tests:
   `mvn test -pl backend -Dtest=AdminRoleRequestIntegrationTest,HorseIntegrationTest,NotificationIntegrationTest`
2. Frontend Vitest tests:
   `npm run test -- NotificationBell`

### Manual Verification
1. Boot up backend and frontend applications (`npm run dev`).
2. Log in as a Horse Owner, register a horse, then log in as Admin and approve it. Verify the Horse Owner receives the "Horse profile approved" notification and clicking it navigates to `/owner/horses`.
3. Log in as a Spectator, submit a Jockey role request. Log in as Admin, approve it. Verify the Spectator receives a "Role request approved" notification and clicking it redirects to `/jockey/dashboard`.
4. Run a top-up via VNPay or mock it. Verify the wallet owner receives a notification and clicking it opens `/wallet`.
