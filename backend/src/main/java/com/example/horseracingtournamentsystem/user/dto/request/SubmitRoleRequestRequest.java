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

        @NotBlank(message = "Resume file is required")
        @Size(max = 500, message = "Resume file link must not exceed 500 characters")
        @Pattern(regexp = "^(https?://.+|/api/v1/files/private/.+)$", message = "Resume file link must be an uploaded file or valid HTTP(S) link")
        String resumeUrl
) {
}
