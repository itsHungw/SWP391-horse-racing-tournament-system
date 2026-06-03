# Admin Blog Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a fullstack Admin Blog Module enabling admins to create and moderate articles using a Rich Text Editor, with dynamically resolved SEO-friendly slugs, and spectator views for listing and reading articles.

**Architecture:** Standard Spring Boot layers (Entity, Repository, DTOs, Service, and Controllers) mapped to a new SQL Server `blogs` table. The frontend comprises dedicated React views integrated under React Router v7 and styled using Tailwind CSS, supporting draft/published states and image uploads via existing backend services.

**Tech Stack:** Java 17, Spring Boot 3, Hibernate JPA, SQL Server, React 19, React Router v7, Tailwind CSS, Axios, ReactQuill.

---

### Task 1: Database Migration & Schema

**Files:**
- Create: `database/004_create_blogs_table.sql`

- [ ] **Step 1: Write migration SQL**
  Write SQL to create the `blogs` table in SQL Server with indexes on `slug` and `status`, plus a foreign key linking to `users`.

  ```sql
  CREATE TABLE blogs (
      id BIGINT IDENTITY(1,1) PRIMARY KEY,
      title NVARCHAR(255) NOT NULL,
      slug VARCHAR(255) NOT NULL UNIQUE,
      summary NVARCHAR(500) NULL,
      content NVARCHAR(MAX) NOT NULL,
      thumbnail VARCHAR(255) NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
      created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
      updated_at DATETIME2 NULL,
      author_id BIGINT NOT NULL,
      CONSTRAINT FK_blogs_users FOREIGN KEY (author_id) REFERENCES users(id)
  );

  CREATE INDEX IX_blogs_slug ON blogs(slug);
  CREATE INDEX IX_blogs_status ON blogs(status);
  ```

- [ ] **Step 2: Commit database SQL**
  ```bash
  git add database/004_create_blogs_table.sql
  git commit -m "db: add database schema for blogs module"
  ```

---

### Task 2: Backend Entities, Enums & Utilities

**Files:**
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/blog/entity/BlogStatus.java`
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/blog/entity/Blog.java`
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/blog/utils/SlugUtils.java`

- [ ] **Step 1: Implement BlogStatus Enum**
  Create standard draft/published blog status enum:

  ```java
  package com.example.horseracingtournamentsystem.blog.entity;

  public enum BlogStatus {
      DRAFT,
      PUBLISHED
  }
  ```

- [ ] **Step 2: Implement Blog Entity**
  Create JPA Entity `Blog.java` with encapsulation, getter methods, and builders:

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
      @Enumerated(EnumType.STRING)
      private BlogStatus status;

      @ManyToOne(fetch = FetchType.LAZY)
      @JoinColumn(name = "author_id", nullable = false)
      private User author;

      @Column(name = "created_at", nullable = false)
      private LocalDateTime createdAt;

      @Column(name = "updated_at")
      private LocalDateTime updatedAt;

      public static Blog create(String title, String slug, String summary, String content, String thumbnail, BlogStatus status, User author) {
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

      public void update(String title, String slug, String summary, String content, String thumbnail, BlogStatus status) {
          this.title = title;
          this.slug = slug;
          this.summary = summary;
          this.content = content;
          this.thumbnail = thumbnail;
          this.status = status;
          this.updatedAt = LocalDateTime.now();
      }

      public void updateStatus(BlogStatus status) {
          this.status = status;
          this.updatedAt = LocalDateTime.now();
      }
  }
  ```

- [ ] **Step 3: Implement Slug Generator Utility**
  Create `SlugUtils.java` to transform text into readable slugs:

  ```java
  package com.example.horseracingtournamentsystem.blog.utils;

  import java.text.Normalizer;
  import java.util.Locale;
  import java.util.regex.Pattern;

  public class SlugUtils {
      private static final Pattern NONLATIN = Pattern.compile("[^\\w-]");
      private static final Pattern WHITESPACE = Pattern.compile("[\\s]");

      public static String toSlug(String input) {
          if (input == null) return "";
          String noWhitespace = WHITESPACE.matcher(input).replaceAll("-");
          String normalized = Normalizer.normalize(noWhitespace, Normalizer.Form.NFD);
          String slug = NONLATIN.matcher(normalized).replaceAll("");
          return slug.toLowerCase(Locale.ENGLISH)
                     .replaceAll("-{2,}", "-")
                     .replaceAll("^-|-$", "");
      }
  }
  ```

- [ ] **Step 4: Commit utility and entity code**
  ```bash
  git add backend/src/main/java/com/example/horseracingtournamentsystem/blog/entity/BlogStatus.java backend/src/main/java/com/example/horseracingtournamentsystem/blog/entity/Blog.java backend/src/main/java/com/example/horseracingtournamentsystem/blog/utils/SlugUtils.java
  git commit -m "feat: add Blog entity, status enum, and SlugUtils"
  ```

---

### Task 3: Repository & DTO Layers

**Files:**
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/blog/repository/BlogRepository.java`
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/blog/dto/BlogResponse.java`
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/blog/dto/CreateBlogRequest.java`
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/blog/dto/UpdateBlogRequest.java`
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/blog/dto/UpdateBlogStatusRequest.java`

- [ ] **Step 1: Create BlogRepository**
  Establish data query layers:

  ```java
  package com.example.horseracingtournamentsystem.blog.repository;

  import com.example.horseracingtournamentsystem.blog.entity.Blog;
  import com.example.horseracingtournamentsystem.blog.entity.BlogStatus;
  import org.springframework.data.domain.Page;
  import org.springframework.data.domain.Pageable;
  import org.springframework.data.jpa.repository.JpaRepository;
  import org.springframework.stereotype.Repository;

  import java.util.Optional;

  @Repository
  public interface BlogRepository extends JpaRepository<Blog, Long> {
      Optional<Blog> findBySlug(String slug);
      boolean existsBySlug(String slug);
      Page<Blog> findByStatus(BlogStatus status, Pageable pageable);
      Page<Blog> findByStatusAndTitleContainingIgnoreCase(BlogStatus status, String title, Pageable pageable);
      Page<Blog> findByTitleContainingIgnoreCase(String title, Pageable pageable);
  }
  ```

- [ ] **Step 2: Define Blog DTO Requests and Responses**
  Create request/response structures:

  ```java
  // BlogResponse.java
  package com.example.horseracingtournamentsystem.blog.dto;

  import com.example.horseracingtournamentsystem.blog.entity.Blog;
  import java.time.LocalDateTime;

  public record BlogResponse(
      Long id,
      String title,
      String slug,
      String summary,
      String content,
      String thumbnail,
      String status,
      Long authorId,
      String authorName,
      LocalDateTime createdAt,
      LocalDateTime updatedAt
  ) {
      public static BlogResponse from(Blog blog) {
          return new BlogResponse(
              blog.getId(),
              blog.getTitle(),
              blog.getSlug(),
              blog.getSummary(),
              blog.getContent(),
              blog.getThumbnail(),
              blog.getStatus().name(),
              blog.getAuthor().getId(),
              blog.getAuthor().getFullName(),
              blog.getCreatedAt(),
              blog.getUpdatedAt()
          );
      }
  }
  ```

  Create request record objects:

  ```java
  // CreateBlogRequest.java
  package com.example.horseracingtournamentsystem.blog.dto;

  import jakarta.validation.constraints.NotBlank;
  import jakarta.validation.constraints.Size;

  public record CreateBlogRequest(
      @NotBlank(message = "Title is required")
      @Size(max = 255, message = "Title cannot exceed 255 characters")
      String title,

      @Size(max = 500, message = "Summary cannot exceed 500 characters")
      String summary,

      @NotBlank(message = "Content is required")
      String content,

      String thumbnail,

      @NotBlank(message = "Status is required")
      String status
  ) {}
  ```

  ```java
  // UpdateBlogRequest.java
  package com.example.horseracingtournamentsystem.blog.dto;

  import jakarta.validation.constraints.NotBlank;
  import jakarta.validation.constraints.Size;

  public record UpdateBlogRequest(
      @NotBlank(message = "Title is required")
      @Size(max = 255, message = "Title cannot exceed 255 characters")
      String title,

      @Size(max = 500, message = "Summary cannot exceed 500 characters")
      String summary,

      @NotBlank(message = "Content is required")
      String content,

      String thumbnail,

      @NotBlank(message = "Status is required")
      String status
  ) {}
  ```

  ```java
  // UpdateBlogStatusRequest.java
  package com.example.horseracingtournamentsystem.blog.dto;

  import jakarta.validation.constraints.NotBlank;

  public record UpdateBlogStatusRequest(
      @NotBlank(message = "Status is required")
      String status
  ) {}
  ```

- [ ] **Step 3: Commit Repository and DTO layers**
  ```bash
  git add backend/src/main/java/com/example/horseracingtournamentsystem/blog/repository/BlogRepository.java backend/src/main/java/com/example/horseracingtournamentsystem/blog/dto/*
  git commit -m "feat: add Blog Repository and Request/Response DTO records"
  ```

---

### Task 4: Service Layer Implementation

**Files:**
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/blog/service/BlogService.java`

- [ ] **Step 1: Write BlogService Implementation**
  Add blog business logic handling slug generation uniqueness check, retrieval, updates, and creation:

  ```java
  package com.example.horseracingtournamentsystem.blog.service;

  import com.example.horseracingtournamentsystem.blog.dto.BlogResponse;
  import com.example.horseracingtournamentsystem.blog.dto.CreateBlogRequest;
  import com.example.horseracingtournamentsystem.blog.dto.UpdateBlogRequest;
  import com.example.horseracingtournamentsystem.blog.entity.Blog;
  import com.example.horseracingtournamentsystem.blog.entity.BlogStatus;
  import com.example.horseracingtournamentsystem.blog.repository.BlogRepository;
  import com.example.horseracingtournamentsystem.blog.utils.SlugUtils;
  import com.example.horseracingtournamentsystem.user.entity.User;
  import lombok.RequiredArgsConstructor;
  import org.springframework.data.domain.Page;
  import org.springframework.data.domain.Pageable;
  import org.springframework.stereotype.Service;
  import org.springframework.transaction.annotation.Transactional;

  import java.util.UUID;

  @Service
  @RequiredArgsConstructor
  public class BlogService {
      private final BlogRepository blogRepository;

      public Page<BlogResponse> getPublishedBlogs(String search, Pageable pageable) {
          Page<Blog> blogs;
          if (search != null && !search.isBlank()) {
              blogs = blogRepository.findByStatusAndTitleContainingIgnoreCase(BlogStatus.PUBLISHED, search, pageable);
          } else {
              blogs = blogRepository.findByStatus(BlogStatus.PUBLISHED, pageable);
          }
          return blogs.map(BlogResponse::from);
      }

      public BlogResponse getPublishedBlogBySlug(String slug) {
          Blog blog = blogRepository.findBySlug(slug)
                  .orElseThrow(() -> new IllegalArgumentException("Blog post not found with slug: " + slug));
          if (blog.getStatus() != BlogStatus.PUBLISHED) {
              throw new IllegalArgumentException("Requested blog post is not published.");
          }
          return BlogResponse::from(blog);
      }

      public Page<BlogResponse> getAllBlogsForAdmin(String search, Pageable pageable) {
          Page<Blog> blogs;
          if (search != null && !search.isBlank()) {
              blogs = blogRepository.findByTitleContainingIgnoreCase(search, pageable);
          } else {
              blogs = blogRepository.findAll(pageable);
          }
          return blogs.map(BlogResponse::from);
      }

      @Transactional
      public BlogResponse createBlog(CreateBlogRequest request, User author) {
          String slug = generateUniqueSlug(request.title());
          BlogStatus status = BlogStatus.valueOf(request.status().toUpperCase());
          Blog blog = Blog.create(
              request.title(),
              slug,
              request.summary(),
              request.content(),
              request.thumbnail(),
              status,
              author
          );
          return BlogResponse.from(blogRepository.save(blog));
      }

      @Transactional
      public BlogResponse updateBlog(Long id, UpdateBlogRequest request) {
          Blog blog = blogRepository.findById(id)
                  .orElseThrow(() -> new IllegalArgumentException("Blog post not found with id: " + id));
          
          String slug = blog.getSlug();
          if (!blog.getTitle().equalsIgnoreCase(request.title())) {
              slug = generateUniqueSlug(request.title());
          }

          BlogStatus status = BlogStatus.valueOf(request.status().toUpperCase());
          blog.update(
              request.title(),
              slug,
              request.summary(),
              request.content(),
              request.thumbnail(),
              status
          );
          return BlogResponse.from(blogRepository.save(blog));
      }

      @Transactional
      public BlogResponse updateStatus(Long id, String statusStr) {
          Blog blog = blogRepository.findById(id)
                  .orElseThrow(() -> new IllegalArgumentException("Blog post not found with id: " + id));
          BlogStatus status = BlogStatus.valueOf(statusStr.toUpperCase());
          blog.updateStatus(status);
          return BlogResponse.from(blogRepository.save(blog));
      }

      @Transactional
      public void deleteBlog(Long id) {
          Blog blog = blogRepository.findById(id)
                  .orElseThrow(() -> new IllegalArgumentException("Blog post not found with id: " + id));
          blogRepository.delete(blog);
      }

      private String generateUniqueSlug(String title) {
          String baseSlug = SlugUtils.toSlug(title);
          String slug = baseSlug;
          int count = 1;
          while (blogRepository.existsBySlug(slug)) {
              slug = baseSlug + "-" + UUID.randomUUID().toString().substring(0, 6);
          }
          return slug;
      }
  }
  ```

- [ ] **Step 2: Commit service layer**
  ```bash
  git add backend/src/main/java/com/example/horseracingtournamentsystem/blog/service/BlogService.java
  git commit -m "feat: implement BlogService with business constraints and slug uniqueness validation"
  ```

---

### Task 5: Controller & Spring Security Mapping

**Files:**
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/blog/controller/BlogController.java`
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/blog/controller/AdminBlogController.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/security/SecurityConfig.java`

- [ ] **Step 1: Create Public BlogController**
  Create public endpoints for Spectators:

  ```java
  package com.example.horseracingtournamentsystem.blog.controller;

  import com.example.horseracingtournamentsystem.blog.dto.BlogResponse;
  import com.example.horseracingtournamentsystem.blog.service.BlogService;
  import lombok.RequiredArgsConstructor;
  import org.springframework.data.domain.Page;
  import org.springframework.data.domain.PageRequest;
  import org.springframework.data.domain.Pageable;
  import org.springframework.data.domain.Sort;
  import org.springframework.http.ResponseEntity;
  import org.springframework.web.bind.annotation.*;

  @RestController
  @RequestMapping("/api/v1/blogs")
  @RequiredArgsConstructor
  public class BlogController {
      private final BlogService blogService;

      @GetMapping
      public ResponseEntity<Page<BlogResponse>> getPublishedBlogs(
              @RequestParam(value = "search", required = false) String search,
              @RequestParam(value = "page", defaultValue = "0") int page,
              @RequestParam(value = "size", defaultValue = "9") int size
      ) {
          Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
          return ResponseEntity.ok(blogService.getPublishedBlogs(search, pageable));
      }

      @GetMapping("/{slug}")
      public ResponseEntity<BlogResponse> getPublishedBlogBySlug(@PathVariable String slug) {
          return ResponseEntity.ok(blogService.getPublishedBlogBySlug(slug));
      }
  }
  ```

- [ ] **Step 2: Create AdminBlogController**
  Create admin endpoints requiring authentication. Get authenticated User details from security contexts:

  ```java
  package com.example.horseracingtournamentsystem.blog.controller;

  import com.example.horseracingtournamentsystem.blog.dto.BlogResponse;
  import com.example.horseracingtournamentsystem.blog.dto.CreateBlogRequest;
  import com.example.horseracingtournamentsystem.blog.dto.UpdateBlogRequest;
  import com.example.horseracingtournamentsystem.blog.dto.UpdateBlogStatusRequest;
  import com.example.horseracingtournamentsystem.blog.service.BlogService;
  import com.example.horseracingtournamentsystem.user.entity.User;
  import jakarta.validation.Valid;
  import lombok.RequiredArgsConstructor;
  import org.springframework.data.domain.Page;
  import org.springframework.data.domain.PageRequest;
  import org.springframework.data.domain.Pageable;
  import org.springframework.data.domain.Sort;
  import org.springframework.http.HttpStatus;
  import org.springframework.http.ResponseEntity;
  import org.springframework.security.core.annotation.AuthenticationPrincipal;
  import org.springframework.web.bind.annotation.*;

  @RestController
  @RequestMapping("/api/v1/admin/blogs")
  @RequiredArgsConstructor
  public class AdminBlogController {
      private final BlogService blogService;

      @GetMapping
      public ResponseEntity<Page<BlogResponse>> getAllBlogsForAdmin(
              @RequestParam(value = "search", required = false) String search,
              @RequestParam(value = "page", defaultValue = "0") int page,
              @RequestParam(value = "size", defaultValue = "10") int size
      ) {
          Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
          return ResponseEntity.ok(blogService.getAllBlogsForAdmin(search, pageable));
      }

      @PostMapping
      public ResponseEntity<BlogResponse> createBlog(
              @Valid @RequestBody CreateBlogRequest request,
              @AuthenticationPrincipal User author
      ) {
          return ResponseEntity.status(HttpStatus.CREATED).body(blogService.createBlog(request, author));
      }

      @PutMapping("/{id}")
      public ResponseEntity<BlogResponse> updateBlog(
              @PathVariable Long id,
              @Valid @RequestBody UpdateBlogRequest request
      ) {
          return ResponseEntity.ok(blogService.updateBlog(id, request));
      }

      @PATCH("/{id}/status")
      public ResponseEntity<BlogResponse> updateBlogStatus(
              @PathVariable Long id,
              @Valid @RequestBody UpdateBlogStatusRequest request
      ) {
          return ResponseEntity.ok(blogService.updateStatus(id, request.status()));
      }

      @DeleteMapping("/{id}")
      public ResponseEntity<Void> deleteBlog(@PathVariable Long id) {
          blogService.deleteBlog(id);
          return ResponseEntity.noContent().build();
      }
  }
  ```

- [ ] **Step 3: Update Security Config**
  Permit anonymous GET on `/api/v1/blogs/**` and secure `/api/v1/admin/blogs/**` under `ROLE_ADMIN` within `SecurityConfig.java`. Locate `requestMatchers` configurations and add:

  ```java
  .requestMatchers(HttpMethod.GET, "/api/v1/blogs/**").permitAll()
  .requestMatchers("/api/v1/admin/blogs/**").hasRole("ADMIN")
  ```

- [ ] **Step 4: Commit Controllers and Security Config**
  ```bash
  git add backend/src/main/java/com/example/horseracingtournamentsystem/blog/controller/* backend/src/main/java/com/example/horseracingtournamentsystem/security/SecurityConfig.java
  git commit -m "feat: add controllers and update spring security permissions"
  ```

---

### Task 6: Frontend API & Type Definitions

**Files:**
- Create: `frontend/src/types/blog.ts`
- Create: `frontend/src/api/blogApi.ts`

- [ ] **Step 1: Create Blog TS Type Definitions**
  Create schema interface mappings matching backend:

  ```typescript
  export interface Blog {
    id: number;
    title: string;
    slug: string;
    summary: string;
    content: string;
    thumbnail: string | null;
    status: 'DRAFT' | 'PUBLISHED';
    authorId: number;
    authorName: string;
    createdAt: string;
    updatedAt: string | null;
  }

  export interface CreateBlogRequest {
    title: string;
    summary: string;
    content: string;
    thumbnail: string | null;
    status: 'DRAFT' | 'PUBLISHED';
  }

  export interface UpdateBlogRequest {
    title: string;
    summary: string;
    content: string;
    thumbnail: string | null;
    status: 'DRAFT' | 'PUBLISHED';
  }

  export interface PageResponse<T> {
    content: T[];
    totalPages: number;
    totalElements: number;
    size: number;
    number: number;
  }
  ```

- [ ] **Step 2: Create Axios Blog API Hooks/Utility File**
  Implement calls to fetch data for spectators and admins:

  ```typescript
  import axios from 'axios';
  import { Blog, CreateBlogRequest, UpdateBlogRequest, PageResponse } from '../types/blog';

  const API_URL = '/api/v1';

  export const blogApi = {
    // Public APIs
    getPublishedBlogs: async (search?: string, page = 0, size = 9) => {
      const response = await axios.get<PageResponse<Blog>>(`${API_URL}/blogs`, {
        params: { search, page, size }
      });
      return response.data;
    },

    getPublishedBlogBySlug: async (slug: string) => {
      const response = await axios.get<Blog>(`${API_URL}/blogs/${slug}`);
      return response.data;
    },

    // Admin APIs
    getAllBlogsForAdmin: async (search?: string, page = 0, size = 10) => {
      const response = await axios.get<PageResponse<Blog>>(`${API_URL}/admin/blogs`, {
        params: { search, page, size }
      });
      return response.data;
    },

    createBlog: async (data: CreateBlogRequest) => {
      const response = await axios.post<Blog>(`${API_URL}/admin/blogs`, data);
      return response.data;
    },

    updateBlog: async (id: number, data: UpdateBlogRequest) => {
      const response = await axios.put<Blog>(`${API_URL}/admin/blogs/${id}`, data);
      return response.data;
    },

    updateBlogStatus: async (id: number, status: 'DRAFT' | 'PUBLISHED') => {
      const response = await axios.patch<Blog>(`${API_URL}/admin/blogs/${id}/status`, { status });
      return response.data;
    },

    deleteBlog: async (id: number) => {
      await axios.delete(`${API_URL}/admin/blogs/${id}`);
    }
  };
  ```

- [ ] **Step 3: Commit Frontend API integration**
  ```bash
  git add frontend/src/types/blog.ts frontend/src/api/blogApi.ts
  git commit -m "feat: add frontend TypeScript types and Axios APIs for Blog integration"
  ```

---

### Task 7: Spectator Frontend Blog Views

**Files:**
- Create: `frontend/src/pages/public/SpectatorBlogListPage.tsx`
- Create: `frontend/src/pages/public/SpectatorBlogDetailPage.tsx`
- Modify: `frontend/src/routes/AppRouter.tsx`

- [ ] **Step 1: Implement SpectatorBlogListPage**
  Build card view featuring searches and list layouts using Tailwind:

  ```typescript
  import React, { useEffect, useState } from 'react';
  import { Link } from 'react-router-dom';
  import { blogApi } from '../../api/blogApi';
  import { Blog } from '../../types/blog';

  export function SpectatorBlogListPage() {
    const [blogs, setBlogs] = useState<Blog[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      loadBlogs();
    }, [search]);

    const loadBlogs = async () => {
      try {
        setLoading(true);
        const data = await blogApi.getPublishedBlogs(search);
        setBlogs(data.content);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Latest Tournament Updates & Blogs</h1>
        <div className="mb-8">
          <input
            type="text"
            placeholder="Search blog posts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-1/3 px-4 py-2 border rounded-lg dark:bg-gray-800 dark:text-white"
          />
        </div>
        {loading ? (
          <div>Loading blogs...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {blogs.map((blog) => (
              <div key={blog.id} className="border rounded-lg overflow-hidden flex flex-col bg-white dark:bg-gray-800 shadow">
                {blog.thumbnail && (
                  <img src={blog.thumbnail} alt={blog.title} className="h-48 w-full object-cover" />
                )}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{blog.title}</h2>
                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">{blog.summary}</p>
                  </div>
                  <Link to={`/blogs/${blog.slug}`} className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
                    Read More &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
  ```

- [ ] **Step 2: Implement SpectatorBlogDetailPage**
  Safely render rich contents with Tailwind typography:

  ```typescript
  import React, { useEffect, useState } from 'react';
  import { useParams, Link } from 'react-router-dom';
  import { blogApi } from '../../api/blogApi';
  import { Blog } from '../../types/blog';

  export function SpectatorBlogDetailPage() {
    const { slug } = useParams<{ slug: string }>();
    const [blog, setBlog] = useState<Blog | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      if (slug) {
        blogApi.getPublishedBlogBySlug(slug)
          .then(setBlog)
          .catch(console.error)
          .finally(() => setLoading(false));
      }
    }, [slug]);

    if (loading) return <div className="p-8">Loading post...</div>;
    if (!blog) return <div className="p-8">Post not found.</div>;

    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link to="/blogs" className="text-indigo-600 dark:text-indigo-400 hover:underline mb-6 block">&larr; Back to Blogs</Link>
        {blog.thumbnail && (
          <img src={blog.thumbnail} alt={blog.title} className="w-full h-80 object-cover rounded-lg mb-6 shadow" />
        )}
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-2">{blog.title}</h1>
        <div className="text-gray-500 text-sm mb-6">
          By {blog.authorName} &bull; {new Date(blog.createdAt).toLocaleDateString()}
        </div>
        <div 
          className="prose dark:prose-invert max-w-none text-gray-800 dark:text-gray-200"
          dangerouslySetInnerHTML={{ __html: blog.content }} 
        />
      </div>
    );
  }
  ```

- [ ] **Step 3: Map Public Router Elements**
  Modify `frontend/src/routes/AppRouter.tsx` to include the spectator routes:

  ```typescript
  // Import Spectator components at the top:
  import { SpectatorBlogListPage } from "../pages/public/SpectatorBlogListPage";
  import { SpectatorBlogDetailPage } from "../pages/public/SpectatorBlogDetailPage";

  // Inside Routes configuration block under AppLayout routes:
  <Route path="blogs" element={<SpectatorBlogListPage />} />
  <Route path="blogs/:slug" element={<SpectatorBlogDetailPage />} />
  ```

- [ ] **Step 4: Commit Spectator layouts**
  ```bash
  git add frontend/src/pages/public/SpectatorBlogListPage.tsx frontend/src/pages/public/SpectatorBlogDetailPage.tsx frontend/src/routes/AppRouter.tsx
  git commit -m "feat: integrate Spectator Blog layouts and routes"
  ```

---

### Task 8: Admin Workspace Frontend Blog Views

**Files:**
- Create: `frontend/src/pages/admin/AdminBlogListPage.tsx`
- Create: `frontend/src/pages/admin/AdminBlogFormPage.tsx`
- Modify: `frontend/src/routes/AppRouter.tsx`

- [ ] **Step 1: Create AdminBlogListPage**
  Build rich tabular dashboards for monitoring, status updates, toggles and post creation links:

  ```typescript
  import React, { useEffect, useState } from 'react';
  import { Link } from 'react-router-dom';
  import { blogApi } from '../../api/blogApi';
  import { Blog } from '../../types/blog';

  export function AdminBlogListPage() {
    const [blogs, setBlogs] = useState<Blog[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      loadBlogs();
    }, [search]);

    const loadBlogs = async () => {
      try {
        setLoading(true);
        const data = await blogApi.getAllBlogsForAdmin(search);
        setBlogs(data.content);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const handleToggleStatus = async (blog: Blog) => {
      const targetStatus = blog.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
      try {
        await blogApi.updateBlogStatus(blog.id, targetStatus);
        loadBlogs();
      } catch (err) {
        console.error(err);
      }
    };

    const handleDelete = async (id: number) => {
      if (window.confirm("Are you sure you want to delete this blog post?")) {
        try {
          await blogApi.deleteBlog(id);
          loadBlogs();
        } catch (err) {
          console.error(err);
        }
      }
    };

    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Blogs Workspace</h1>
          <Link to="/admin/blog/new" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg">
            Create Blog Post
          </Link>
        </div>
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search article titles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-1/3 px-4 py-2 border rounded-lg dark:bg-gray-800 dark:text-white"
          />
        </div>
        {loading ? (
          <div>Loading articles...</div>
        ) : (
          <div className="bg-white dark:bg-gray-800 border rounded-lg overflow-hidden shadow">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">Thumbnail</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">Title</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">Author</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">Status</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">Created At</th>
                  <th className="px-6 py-3 text-right font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                {blogs.map((blog) => (
                  <tr key={blog.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {blog.thumbnail ? (
                        <img src={blog.thumbnail} className="h-10 w-16 object-cover rounded" alt="" />
                      ) : (
                        <span className="text-gray-400">No Image</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{blog.title}</td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-300">{blog.authorName}</td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => handleToggleStatus(blog)}
                        className={`px-2 py-1 text-xs font-semibold rounded ${
                          blog.status === 'PUBLISHED' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        }`}
                      >
                        {blog.status}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-300">
                      {new Date(blog.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <Link to={`/admin/blog/edit/${blog.id}`} className="text-indigo-600 hover:text-indigo-900">Edit</Link>
                      <button onClick={() => handleDelete(blog.id)} className="text-red-600 hover:text-red-950">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }
  ```

- [ ] **Step 2: Create AdminBlogFormPage**
  Build the comprehensive editor form supporting title, summaries, image upload handlers, and rich text fields:

  ```typescript
  import React, { useEffect, useState } from 'react';
  import { useNavigate, useParams, Link } from 'react-router-dom';
  import axios from 'axios';
  import { blogApi } from '../../api/blogApi';

  export function AdminBlogFormPage() {
    const { id } = useParams<{ id: string }>();
    const isEditMode = !!id;
    const navigate = useNavigate();

    const [title, setTitle] = useState('');
    const [summary, setSummary] = useState('');
    const [content, setContent] = useState('');
    const [thumbnail, setThumbnail] = useState<string | null>(null);
    const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED'>('DRAFT');
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
      if (isEditMode) {
        blogApi.getAllBlogsForAdmin()
          .then((page) => {
            const current = page.content.find((b) => b.id === Number(id));
            if (current) {
              setTitle(current.title);
              setSummary(current.summary);
              setContent(current.content);
              setThumbnail(current.thumbnail);
              setStatus(current.status);
            }
          })
          .catch(console.error);
      }
    }, [id, isEditMode]);

    const handleUploadThumbnail = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', 'BLOG');

      try {
        setUploading(true);
        const response = await axios.post<{ url: string }>('/api/v1/files/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setThumbnail(response.data.url);
      } catch (err) {
        console.error(err);
        alert("Failed to upload image.");
      } finally {
        setUploading(false);
      }
    };

    const handleSave = async (e: React.FormEvent) => {
      e.preventDefault();
      const payload = { title, summary, content, thumbnail, status };
      try {
        if (isEditMode) {
          await blogApi.updateBlog(Number(id), payload);
        } else {
          await blogApi.createBlog(payload);
        }
        navigate('/admin/blog');
      } catch (err) {
        console.error(err);
        alert("Failed to save post.");
      }
    };

    return (
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
          {isEditMode ? "Edit Blog Post" : "Create New Blog Post"}
        </h1>
        <form onSubmit={handleSave} className="space-y-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div>
            <label className="block text-sm font-medium mb-2">Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Summary</label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-900 dark:text-white"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Thumbnail</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleUploadThumbnail}
              className="w-full"
            />
            {uploading && <p className="text-sm text-gray-400">Uploading...</p>}
            {thumbnail && (
              <img src={thumbnail} className="mt-4 h-32 w-48 object-cover rounded shadow" alt="Preview" />
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Content</label>
            <textarea
              required
              placeholder="Write your content here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-900 dark:text-white font-mono"
              rows={12}
            />
            <p className="text-xs text-gray-400 mt-1">Rich Content Text Block support. HTML characters accepted.</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'DRAFT' | 'PUBLISHED')}
              className="px-4 py-2 border rounded-lg dark:bg-gray-900 dark:text-white"
            >
              <option value="DRAFT">DRAFT</option>
              <option value="PUBLISHED">PUBLISHED</option>
            </select>
          </div>
          <div className="flex space-x-4 pt-4 border-t">
            <button type="submit" className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium">
              Save Post
            </button>
            <Link to="/admin/blog" className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg font-medium">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    );
  }
  ```

- [ ] **Step 3: Modify Admin Route Paths**
  Replace the admin blog placeholder inside `frontend/src/routes/AppRouter.tsx`:

  ```typescript
  // Import Admin components:
  import { AdminBlogListPage } from "../pages/admin/AdminBlogListPage";
  import { AdminBlogFormPage } from "../pages/admin/AdminBlogFormPage";

  // Replace placeholder in Routes configurations:
  <Route path="admin/blog" element={adminRoute(<AdminBlogListPage />)} />
  <Route path="admin/blog/new" element={adminRoute(<AdminBlogFormPage />)} />
  <Route path="admin/blog/edit/:id" element={adminRoute(<AdminBlogFormPage />)} />
  ```

- [ ] **Step 4: Commit Admin views**
  ```bash
  git add frontend/src/pages/admin/AdminBlogListPage.tsx frontend/src/pages/admin/AdminBlogFormPage.tsx frontend/src/routes/AppRouter.tsx
  git commit -m "feat: integrate Admin Blog workspaces and routes"
  ```
