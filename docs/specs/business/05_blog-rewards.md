# Blog Publishing

## 1. Purpose

Blogs provide public racing content and newsroom-style updates. In the current source they are content only; blog reward claims and point rewards have been removed from the active product.

## 2. Blog Management

Admins manage blogs through:

- `GET /api/v1/admin/blogs`
- `POST /api/v1/admin/blogs`
- `PUT /api/v1/admin/blogs/{id}`
- `PATCH /api/v1/admin/blogs/{id}/status`
- `DELETE /api/v1/admin/blogs/{id}`

Frontend pages:

- `/admin/blog`
- `/admin/blog/new`
- `/admin/blog/edit/:id`

Blog status in the current backend enum is `DRAFT` or `PUBLISHED`.

## 3. Public Blog Reading

Public users read:

- `GET /api/v1/blogs`
- `GET /api/v1/blogs/{slug}`

Frontend pages:

- `/blogs`
- `/blogs/:slug`

## 4. Removed Reward Workflow

Current source does not expose:

- `POST /api/v1/blogs/{slug}/claim-reward`
- reading seconds or scroll-percent reward evidence;
- daily blog reward limits;
- blog reward tables or services;
- point settings or point-account reward transactions.

The relevant removal is represented by migration `V11__remove_gamification.sql`.

## 5. Content Safety Note

Admin blog content is stored as submitted content and rendered by the public detail page. Keep blog editing restricted to trusted admin accounts until a sanitizer/editor pipeline is added.
