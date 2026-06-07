# Backend Architecture

## 1. Package strategy

The backend uses a **domain-first package structure**. Business modules live at the top level, and each module keeps its own internal layers.

```text
com.example.horseracingtournamentsystem
├─ auth/
├─ user/
├─ horse/
├─ tournament/
├─ race/
├─ referee/
├─ result/
├─ prediction/
├─ blog/
├─ notification/
├─ filestorage/
├─ aiinsight/
├─ security/
└─ common/
```

## 2. Internal layering

Inside a domain module, the dependency direction remains:

```text
Controller -> Service -> Repository -> Database
```

## 3. Rules

- Controllers validate requests and return DTOs.
- Services own business rules and transactions.
- Repositories own persistence only.
- Entities are not exposed directly to clients.
- Multi-table workflows are transactional.
- Global exception handling converts failures into stable API responses.
- Shared technical infrastructure belongs in `security` or `common`, not inside business modules.

## 4. Core modules

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

## 5. Response envelope

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {},
  "timestamp": "2026-05-17T00:00:00"
}
```
