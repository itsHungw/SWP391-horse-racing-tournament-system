# Backend Architecture

## 1. Layering

```text
Controller -> Service -> Repository -> Database
```

## 2. Rules

- Controllers validate requests and return DTOs.
- Services own business rules and transactions.
- Repositories own persistence only.
- Entities are not exposed directly to clients.
- Multi-table workflows are transactional.
- Global exception handling converts failures into stable API responses.

## 3. Core modules

- auth and security,
- user and role request,
- horse,
- tournament and registration,
- race and invitation,
- referee operations,
- result and ranking,
- prediction game,
- blog reward,
- notification,
- file storage,
- AI race insight.

## 4. Response envelope

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {},
  "timestamp": "2026-05-17T00:00:00"
}
```

