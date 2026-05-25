package com.example.horseracingtournamentsystem.user.dto.request;

import jakarta.validation.constraints.Size;

public record PassCvReviewRequest(
        @Size(max = 500, message = "CV review note must not exceed 500 characters")
        String cvReviewNote
) {
}
