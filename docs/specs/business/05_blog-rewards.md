# Blog Rewards

## 1. Purpose

Blog rewards encourage spectators to read racing content. They are part of the internal point economy and do not affect official tournament results.

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

Blog status in the current backend enum is `DRAFT` or `PUBLISHED`. Legacy schema scripts also contain `HIDDEN`; use the backend enum as the source of truth for current code behavior.

## 3. Public Blog Reading

Public users read:

- `GET /api/v1/blogs`
- `GET /api/v1/blogs/{slug}`

Frontend pages:

- `/blogs`
- `/blogs/:slug`

## 4. Reward Claim

Authenticated users claim rewards with:

- `POST /api/v1/blogs/{slug}/claim-reward`

The claim request includes reading evidence such as reading seconds and scroll percent. The backend validates:

- blog exists and is eligible;
- user has not already claimed the same blog;
- daily blog point limit is not exceeded;
- reward setting is configured;
- point transaction can be recorded idempotently.

## 5. Reward Data

Relevant tables:

- `blogs`
- `user_blog_rewards`
- `user_daily_point_limits`
- `user_point_accounts`
- `point_transactions`
- `point_settings`

Relevant services:

- `BlogService`
- `BlogRewardService`
- `PointAccountService`
- `PointSettingsService`
