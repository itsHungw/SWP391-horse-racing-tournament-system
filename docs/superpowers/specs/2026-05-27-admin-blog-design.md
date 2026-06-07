# Design Specification: Fullstack Admin Blog Module

This document outlines the architectural, database, and user interface designs for the fullstack Admin Blog module in the Horse Racing Tournament System.

---

## 1. Overview & Goal

The **Admin Blog Module** enables administrators to create, edit, delete, and publish articles, news, tournament announcements, rules, and jockey spotlights. Spectators and other users can view these blog posts, search them, and read their formatted contents.

This module features a modern CMS workflow:
- **Admin Side**: Rich Text Editor (ReactQuill), thumbnail image uploads, status management (Draft vs. Published), and an overview dashboard.
- **Spectator Side**: A beautiful grid list of published blogs with title search, and a customized reading mode with high-quality styling.
- **SEO-friendly URLs**: Blog URLs resolve via human-readable slugs generated dynamically from the blog title.

---

## 2. Database Schema Design (SQL Server)

To persist blogs, we will add a new table named `blogs` linking to the existing `users` table as the author.

```sql
-- Migration Script: Create blogs table
CREATE TABLE blogs (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    title NVARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    summary NVARCHAR(500) NULL,
    content NVARCHAR(MAX) NOT NULL, -- Stores raw HTML strings from ReactQuill
    thumbnail VARCHAR(255) NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT', -- 'DRAFT' or 'PUBLISHED'
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NULL,
    author_id BIGINT NOT NULL,
    CONSTRAINT FK_blogs_users FOREIGN KEY (author_id) REFERENCES users(id)
);

-- Index for searching and resolving slugs quickly
CREATE INDEX IX_blogs_slug ON blogs(slug);
CREATE INDEX IX_blogs_status ON blogs(status);
```

---

## 3. Backend Architecture

### 3.1 Entity definition (`Blog.java`)
Location: `com.example.horseracingtournamentsystem.blog.entity.Blog`

```java
package com.example.horseracingtournamentsystem.blog.entity;

import com.example.horseracingtournamentsystem.user.entity.User;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "blogs")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Blog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @Column(name = "slug", nullable = false, unique = true, length = 255)
    private String slug;

    @Column(name = "summary", length = 500)
    private String summary;

    @Column(name = "content", nullable = false, columnDefinition = "NVARCHAR(MAX)")
    private String content;

    @Column(name = "thumbnail", length = 255)
    private String thumbnail;

    @Column(name = "status", nullable = false, length = 50)
    private String status; // "DRAFT" or "PUBLISHED"

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public static Blog create(String title, String slug, String summary, String content, String thumbnail, String status, User author) {
        Blog blog = new Blog();
        blog.title = title;
        blog.slug = slug;
        blog.summary = summary;
        blog.content = content;
        blog.thumbnail = thumbnail;
        blog.status = status;
        blog.author = author;
        blog.createdAt = LocalDateTime.now();
        return blog;
    }

    public void update(String title, String slug, String summary, String content, String thumbnail, String status) {
        this.title = title;
        this.slug = slug;
        this.summary = summary;
        this.content = content;
        this.thumbnail = thumbnail;
        this.status = status;
        this.updatedAt = LocalDateTime.now();
    }

    public void updateStatus(String status) {
        this.status = status;
        this.updatedAt = LocalDateTime.now();
    }
}
```

### 3.2 Data Transfer Objects (DTOs)
- `BlogResponse`: Transports detailed blog and author attributes to clients.
- `CreateBlogRequest`: Fields: `title`, `summary`, `content`, `thumbnail`, `status`.
- `UpdateBlogRequest`: Fields: `title`, `summary`, `content`, `thumbnail`, `status`.

### 3.3 Dynamic Slug Generation Utility
To automatically generate clean slugs (e.g. "my-first-post"), a utility class `SlugUtils.java` will perform normalization:
1. Strip accents and convert characters to standard Latin base.
2. Convert characters to lower case.
3. Replace all non-alphanumeric characters with hyphens `-`.
4. Collapse contiguous hyphens and remove leading/trailing hyphens.
5. In case of collisions, append a short unique alphanumeric suffix (e.g. `title-slug-a8f2`).

---

## 4. REST API Endpoints

### 4.1 Spectator/Public API
All routes under `/api/v1/blogs` are fully public (Anonymous access allowed).

*   `GET /api/v1/blogs`
    *   **Parameters**: `page` (int, default 0), `size` (int, default 9), `search` (String, optional)
    *   **Response**: Paginated list of `BlogResponse` containing posts with `PUBLISHED` status.
*   `GET /api/v1/blogs/{slug}`
    *   **Response**: `BlogResponse` details of the published blog. Throws 404 if not found or if the status is DRAFT.

### 4.2 Administrator API
All routes under `/api/v1/admin/blogs` require `ROLE_ADMIN` authority.

*   `GET /api/v1/admin/blogs`
    *   **Parameters**: `page` (int, default 0), `size` (int, default 10), `search` (String, optional)
    *   **Response**: Paginated list of all blog posts (Draft and Published).
*   `POST /api/v1/admin/blogs`
    *   **Request**: `CreateBlogRequest`
    *   **Response**: `BlogResponse` containing the created post. Automatically links current authenticated user as author.
*   `PUT /api/v1/admin/blogs/{id}`
    *   **Request**: `UpdateBlogRequest`
    *   **Response**: `BlogResponse` containing the updated post.
*   `DELETE /api/v1/admin/blogs/{id}`
    *   **Response**: HTTP 204 No Content.
*   `PATCH /api/v1/admin/blogs/{id}/status`
    *   **Request**: JSON containing `{ "status": "DRAFT" | "PUBLISHED" }`
    *   **Response**: `BlogResponse` containing the updated post.

---

## 5. Frontend Architecture & User Interfaces

### 5.1 Technology Integration
- Use **Tailwind CSS** for ultra-responsive styling matching the current dark/premium workspace design.
- Use **ReactQuill** (or standard HTML5 editor) in a clean wrapper to type formatted content.
- Use the existing `/api/v1/files/upload` endpoint to handle thumbnail image uploads dynamically.

### 5.2 Core Components & Routes
1.  **Admin Blog Management Layout**:
    - Route: `/admin/blog`
    - View: Displays a clean interactive list of articles. Includes full Search filters, status changes via Quick Toggle, and action buttons to Edit or Delete.
    - View: `/admin/blog/new` and `/admin/blog/edit/:id` - Full-form page with title input, summary, thumbnail uploader, and ReactQuill HTML writer.
2.  **Spectator View Layout**:
    - Route: `/blogs`
    - View: Accessible grid showing active blogs. Prompts title searches and card details (thumbnail, title, published date, brief description).
    - Route: `/blogs/:slug`
    - View: Rich content viewer. Render HTML content safely using `dangerouslySetInnerHTML` with `prose` (Typography styling support) to guarantee top-tier aesthetic presentation.

---

## 6. Security & Exception Handling

- **Security**: The backend Spring Security configurations are updated to ensure `/api/v1/admin/**` endpoints are guarded. Any request missing a valid Admin JWT will be rejected.
- **Exceptions**: Resource-not-found issues (e.g. invalid blog slug, deleted post, nonexistent file reference) yield standardized API errors with clear error messages.
