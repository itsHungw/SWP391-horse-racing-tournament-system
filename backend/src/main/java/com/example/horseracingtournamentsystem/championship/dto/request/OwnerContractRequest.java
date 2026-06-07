package com.example.horseracingtournamentsystem.championship.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record OwnerContractRequest(
        @NotNull Long horseRegistrationId,
        @NotNull Long jockeyApplicationId,
        @Size(max = 500) String message,
        @Size(max = 500) String agreementUrl,
        @Size(max = 255) String agreementFileName
) {
}
