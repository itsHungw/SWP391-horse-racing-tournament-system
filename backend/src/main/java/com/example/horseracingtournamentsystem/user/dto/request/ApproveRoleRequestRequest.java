package com.example.horseracingtournamentsystem.user.dto.request;

import jakarta.validation.constraints.Size;

public record ApproveRoleRequestRequest(
        @Size(max = 1000)
        String adminNote
) {
}
