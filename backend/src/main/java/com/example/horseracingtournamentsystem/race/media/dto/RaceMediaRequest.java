package com.example.horseracingtournamentsystem.race.media.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RaceMediaRequest(
        @NotBlank(message = "YouTube URL is required")
        @Size(max = 1000, message = "YouTube URL is too long")
        String url,

        @Size(max = 160, message = "Title must be 160 characters or less")
        String title
) {
}
