# Spec: Admin User CRUD & Role Management (Option 2)

## Overview
This design specification defines the implementation of a comprehensive User Administration system inside the Horse Racing Tournament System.
It permits Admins to manage user accounts, perform soft deletes, modify user profile fields, directly manage roles with audit tracing, and create new users. The design follows **Option 2 (Tabbed Details Page)** for the frontend, ensuring scalability and a premium user experience.

---

## User Review Required

> [!WARNING]
> **Admin Self-Deletion Protection**: The backend and frontend will enforce that administrators cannot soft-delete themselves to prevent total system lockout.
> 
> **Last Admin Protection**: The API will reject requests to remove the `ADMIN` role from the last remaining admin in the database.

---

## Proposed Changes

### Backend Components

#### [NEW] [AdminUserController.java](file:///e:/SWP391_Project/SWP391-horse-racing-tournament-system/backend/src/main/java/com/example/horseracingtournamentsystem/user/controller/AdminUserController.java)
- Mapping: `/api/v1/admin/users`
- Restrictions: Secured via Spring Security to require the `ADMIN` role.
- Endpoints:
  1. `GET /` - List all active users with pagination (`page`, `size`), search query (`query` -> email, name, phone), and filter (`status`, `role`).
  2. `GET /{id}` - Return detailed user profile, active roles, and recent role history (up to 20 records, ordered newest first).
  3. `POST /` - Create a new user with admin-defined credentials (full name, email, password, phone, dob, gender, address). Status defaults to `ACTIVE` (with email verified).
  4. `PUT /{id}/profile` - Update profile fields (full name, phone, dob, gender, address, status).
  5. `PUT /{id}/roles` - Direct role assignment. Accepts a list of role IDs (or names) and an optional `reason` string. It records the changes in `UserRoleHistory` (defaults to `"Updated by admin"` if reason is blank).
  6. `DELETE /{id}` - Soft delete user by setting `deletedAt` to current time. Rejects request if target ID matches the currently authenticated administrator.

#### [MODIFY] [UserService.java](file:///e:/SWP391_Project/SWP391-horse-racing-tournament-system/backend/src/main/java/com/example/horseracingtournamentsystem/user/service/UserService.java)
- Add admin-related service methods:
  - `findAdminUsersWithFilters(Pageable, String query, String status, String role)`
  - `getUserDetailsForAdmin(Long id)`
  - `createUserByAdmin(CreateUserAdminRequest)`
  - `updateUserProfileByAdmin(Long id, UpdateUserProfileAdminRequest)`
  - `updateUserRolesByAdmin(Long id, UpdateUserRolesAdminRequest, Long currentAdminId)`
  - `softDeleteUser(Long id, Long currentAdminId)`

#### [MODIFY] [UserRepository.java](file:///e:/SWP391_Project/SWP391-horse-racing-tournament-system/backend/src/main/java/com/example/horseracingtournamentsystem/user/repository/UserRepository.java)
- Add query specifications or native methods for filters (filtering out records where `deletedAt` is not null).
- Method to count users with the `ADMIN` role to validate the "last admin" constraint.

---

### Frontend Components

#### [MODIFY] [AppRouter.tsx](file:///e:/SWP391_Project/SWP391-horse-racing-tournament-system/frontend/src/routes/AppRouter.tsx)
- Map `/admin/users` to `<AdminUserListPage />`.
- Map `/admin/users/:id` to `<AdminUserDetailPage />`.

#### [NEW] [AdminUserListPage.tsx](file:///e:/SWP391_Project/SWP391-horse-racing-tournament-system/frontend/src/pages/admin/AdminUserListPage.tsx)
- Search & Filter bar: Query (name, email, phone), Status filter, Role filter.
- User Table: Paginated list showing Avatar, Name, Email, Status Badge, Role Badges.
- "Create User" Button: Opens a modal form prompting for new user details, including password fields.
- Actions: Clickable table rows or a "View Detail" button to navigate to `/admin/users/:id`.
- States: Loading spinner, empty state illustration, error alert.

#### [NEW] [AdminUserDetailPage.tsx](file:///e:/SWP391_Project/SWP391-horse-racing-tournament-system/frontend/src/pages/admin/AdminUserDetailPage.tsx)
- Header displaying user avatar, name, and general status.
- Tabbed Navigation:
  1. **Profile Info Tab**: Form to update fields. Includes a "Save Changes" button, and a "Delete Account" button (opens confirm modal, disabled for self).
  2. **Role Management Tab**:
     - Checkbox/multi-select control of available roles.
     - Text field for "Reason for change" (placeholder: `Updated by admin`).
     - "Update Roles" button (disabled unless role selection changes).
  3. **Role History Tab**: Audit log table showing the 10-20 most recent changes. Columns: Date, Changed By, Old Status, New Status, Reason.

---

## Verification Plan

### Automated Tests
- **Backend Tests**: Create integration tests using MockMvc (`AdminUserControllerTest.java`) to verify:
  - Unauthorized access to `/api/v1/admin/users/**` is blocked.
  - CRUD operations succeed for ADMIN.
  - Deleting oneself yields a bad request (400).
  - Removing the last admin fails validation (400).
  - Soft-deleted users are excluded from standard lists.

- **Frontend Tests**: Verify page transitions, tab switches, and disabled state behaviors.

### Manual Verification
- Log in as Admin:
  - Navigate to `/admin/users` and perform paging, search, and filtering.
  - Create a new user, log out, and log in with new user credentials.
  - Go to `/admin/users/{self_id}` and attempt to delete oneself (verify button is blocked or API error is displayed).
  - Modify a user's role, providing a custom reason, and verify the entry appears in the Role History tab.
