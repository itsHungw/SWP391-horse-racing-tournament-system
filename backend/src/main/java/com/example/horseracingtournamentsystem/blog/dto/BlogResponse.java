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
