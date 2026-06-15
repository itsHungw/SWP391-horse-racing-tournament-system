package com.example.horseracingtournamentsystem.organization.dto.request;

import jakarta.validation.constraints.NotBlank;

public record RejectOrganizationRequest(
        @NotBlank String reason
) {
}
