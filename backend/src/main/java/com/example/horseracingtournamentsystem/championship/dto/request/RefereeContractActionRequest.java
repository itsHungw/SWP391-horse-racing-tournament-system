package com.example.horseracingtournamentsystem.championship.dto.request;

import jakarta.validation.constraints.Size;

/** Lý do (tùy chọn) cho hành động decline / terminate hợp đồng referee. */
public record RefereeContractActionRequest(
        @Size(max = 500) String reason
) {
}
