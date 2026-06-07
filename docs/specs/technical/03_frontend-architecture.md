# Frontend Architecture

## 1. Layering

```text
Pages -> Components -> Hooks -> API services
```

## 2. Rules

- Pages compose flows.
- Components render reusable UI.
- Hooks manage state and business interaction.
- API services perform HTTP calls only.
- Protected and role-based routes are enforced centrally.

## 3. Main page groups

- public,
- spectator,
- owner,
- jockey,
- referee,
- admin.

## 4. Shared components

- navbar,
- sidebar,
- status badge,
- data table,
- pagination,
- modal,
- toast,
- file upload,
- loading and empty states.

