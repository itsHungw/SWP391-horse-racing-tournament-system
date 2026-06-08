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
