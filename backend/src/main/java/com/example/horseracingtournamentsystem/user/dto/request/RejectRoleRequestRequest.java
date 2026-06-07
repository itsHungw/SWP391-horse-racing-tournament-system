package com.example.horseracingtournamentsystem.user.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RejectRoleRequestRequest(
        @NotBlank
        @Size(max = 1000)
        String reason
) {
}
