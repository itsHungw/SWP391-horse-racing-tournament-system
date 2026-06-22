package com.example.horseracingtournamentsystem.championship.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record InviteRefereeRequest(
        @NotNull Long refereeId,
        @Size(max = 500) String message,
        @Size(max = 500) String agreementUrl
) {
}
