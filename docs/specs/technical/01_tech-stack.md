# Tech Stack

| Layer | Technology |
| --- | --- |
| Backend | Java 17+, Spring Boot 3.x |
| Security | Spring Security, JWT |
| Persistence | Spring Data JPA / Hibernate |
| Validation | Jakarta Bean Validation |
| Build | Maven |
| Frontend | React, Vite, Tailwind CSS |
| Routing | React Router |
| HTTP client | Axios |
| Database | SQL Server target; portable design for PostgreSQL/MySQL where practical |
| Migration | Flyway |
| API docs | Swagger / springdoc-openapi |

## Repository shape

```text
backend/
database/
docs/
frontend/
```

Development runs backend and frontend separately; production can package the frontend build into backend static assets.

