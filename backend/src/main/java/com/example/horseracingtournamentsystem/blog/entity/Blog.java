package com.example.horseracingtournamentsystem.blog.entity;

import com.example.horseracingtournamentsystem.user.entity.User;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

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

    @JdbcTypeCode(SqlTypes.LONGVARCHAR)
    @Column(name = "content", nullable = false)
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
