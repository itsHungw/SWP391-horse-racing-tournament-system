package com.example.horseracingtournamentsystem.user.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record SubmitRoleRequestRequest(
        @NotBlank(message = "Requested role is required")
        @Pattern(regexp = "HORSE_OWNER|JOCKEY|REFEREE", message = "Requested role is not supported")
        String requestedRole,

        @NotBlank(message = "Reason is required")
        @Size(min = 20, max = 500, message = "Reason must be between 20 and 500 characters")
        String reason,

        @NotBlank(message = "Resume URL is required")
        @Size(max = 500, message = "Resume URL must not exceed 500 characters")
        @Pattern(regexp = "https?://.+", message = "Resume URL must be a valid HTTP(S) link")
        String resumeUrl
) {
}
