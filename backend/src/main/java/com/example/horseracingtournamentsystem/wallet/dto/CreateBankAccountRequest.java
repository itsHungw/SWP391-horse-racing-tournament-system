package com.example.horseracingtournamentsystem.wallet.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateBankAccountRequest(
        @NotBlank @Size(max = 20) String bankCode,
        @NotBlank @Size(max = 40) String accountNumber,
        @NotBlank @Size(max = 150) String accountHolder,
        @Size(max = 80) String label
) {
}
