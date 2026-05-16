# Tech Stack & Project Structure

---

## 1. Tech Stack Overview

| Layer | Technology | Version |
|-------|-----------|---------|
| **Backend** | Java + Spring Boot | Java 17+, Spring Boot 3.x |
| **API Style** | RESTful API (JSON) | - |
| **Security** | Spring Security + JWT | - |
| **ORM** | Spring Data JPA / Hibernate | - |
| **Validation** | Jakarta Bean Validation | `@Valid`, `@NotNull`, etc. |
| **Build Tool** | Maven (mono-repo) | - |
| **Frontend** | React 18+ | Vite build |
| **CSS** | Tailwind CSS | v3.x |
| **HTTP Client** | Axios | - |
| **Routing** | React Router v6 | - |
| **State** | React Context + useReducer | - |
| **Database** | SQL Server / PostgreSQL / MySQL | - |
| **DB Migration** | Flyway | - |
| **File Storage** | Local (dev) → S3/MinIO (prod) | - |
| **API Docs** | Swagger / springdoc-openapi | - |
| **DevOps** | Deferred to Sprint 2 | - |

---

## 2. Maven Mono-Repo Structure

```
horse-racing/                          # Root Maven project
├── pom.xml                            # Parent POM (modules declaration)
├── docs/
│   └── specs/                         # Specification files
│       ├── 01_executive_summary.md
│       ├── 02_database_design.md
│       ├── 03_logic_flowcharts.md
│       ├── 04_api_and_ui.md
│       ├── 05_tech_stack.md
│       ├── 06_backend_architecture.md
│       ├── 07_frontend_architecture.md
│       ├── 08_file_storage.md
│       ├── 09_build_checklist.md
│       └── 10_business_rules.md
├── database/
│   ├── 001_create_tables.sql          # DDL script
│   ├── 002_seed_data.sql              # Seed data
│   └── 003_indexes.sql                # Performance indexes
├── backend/                           # Spring Boot module
│   ├── pom.xml
│   └── src/
└── frontend/                          # React module
    ├── pom.xml                        # frontend-maven-plugin
    ├── package.json
    └── src/
```

### Parent POM Strategy
```xml
<modules>
    <module>backend</module>
    <module>frontend</module>
</modules>
```

- `mvn clean install` → build cả backend + frontend
- Frontend build bằng `frontend-maven-plugin` (gọi npm build)
- Production: React build output copy vào Spring Boot static resources
- Dev: chạy tách riêng (Spring 8080, React 5173)

---

## 3. Database Choice

| Môi trường | Database | Lý do |
|-----------|----------|-------|
| **Local Dev** | MySQL 8 hoặc PostgreSQL 15 | Dễ setup, free |
| **Testing** | H2 in-memory | Fast unit test |
| **Production** | SQL Server / PostgreSQL | Theo yêu cầu đề bài |

---

## 4. DevOps (Deferred - Sprint 2)

> Không triển khai trong sprint hiện tại. Ghi nhận để plan sau:
> - Docker + Docker Compose
> - CI/CD (GitHub Actions)
> - Cloud deployment
> - SSL/HTTPS
> - Monitoring & Logging
