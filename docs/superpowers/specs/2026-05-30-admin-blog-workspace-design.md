# Admin Blog Workspace Design

## Goal

Bring the admin blog screens into the same operations workspace pattern as the rest of the admin area and fix authenticated blog creation.

## Scope

- Wrap admin blog list and form pages in `AdminLayout`.
- Restyle list and form screens to match existing admin pages: compact header, muted workspace background, bordered white panels, red/green/navy action palette, clear table states.
- Add loading, empty, and error states for the blog list and edit loading path.
- Replace raw `axios` calls in `blogApi` and thumbnail upload with shared `httpClient` so JWT and refresh handling are applied.
- Fix backend author resolution if needed by resolving the authenticated email through `UserRepository` instead of relying on `@AuthenticationPrincipal User`.

## UI Design

The list page follows `AdminRoleRequestsPage`: eyebrow text, large heading, short supporting copy, right-side primary action, search field, refresh button, and a bordered table. Blog status is shown as a badge plus a status action. Empty and error states stay inside the admin content area.

The form page follows a two-column admin workspace: main article fields on the left and publishing/thumbnail controls on the right. Save/cancel actions are grouped at the bottom, with accessible labels, visible focus states, and no browser `alert()` feedback.

## Data Flow

All admin blog API calls go through `httpClient`. FormData upload relies on the existing interceptor that removes JSON `Content-Type` for `FormData`.

Backend create-blog receives `Authentication`, looks up the current admin by email, and passes the managed `User` entity to `BlogService.createBlog`.

## Testing

- Add frontend API tests proving `blogApi` uses `httpClient` for admin list/create/update/status/delete.
- Add frontend UI tests for blog list loading/empty/error and form save/upload behavior.
- Add backend integration test proving authenticated admin can create a blog and author fields are returned.
