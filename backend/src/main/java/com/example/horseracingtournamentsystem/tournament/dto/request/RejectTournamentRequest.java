package com.example.horseracingtournamentsystem.tournament.dto.request;

import jakarta.validation.constraints.NotBlank;

/** Lý do admin từ chối giải ở Cổng 2 (BR-17). Giải bị trả về DRAFT. */
public record RejectTournamentRequest(
        @NotBlank String reason
) {
}
