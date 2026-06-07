package com.example.horseracingtournamentsystem.blog.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateBlogStatusRequest(
    @NotBlank(message = "Status is required")
    String status
) {}
