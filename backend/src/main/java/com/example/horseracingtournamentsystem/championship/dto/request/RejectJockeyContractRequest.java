package com.example.horseracingtournamentsystem.championship.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RejectJockeyContractRequest(
        @NotBlank @Size(max = 500) String reason
) {
}
