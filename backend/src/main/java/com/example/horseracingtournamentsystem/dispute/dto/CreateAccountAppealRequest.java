package com.example.horseracingtournamentsystem.dispute.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;

public record CreateAccountAppealRequest(
        @NotBlank @Size(max = 3000) String description,
        @Size(max = 5) List<@NotBlank @Size(max = 512) String> evidenceUrls) {
}
