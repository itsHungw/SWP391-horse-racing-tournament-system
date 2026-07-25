package com.example.horseracingtournamentsystem.wallet.dto;

import com.example.horseracingtournamentsystem.wallet.entity.WithdrawalRiskLevel;
import com.example.horseracingtournamentsystem.wallet.entity.WithdrawalStatus;
import java.time.LocalDate;

public record WithdrawalExportFilter(
        String query,
        WithdrawalStatus status,
        WithdrawalRiskLevel risk,
        LocalDate from,
        LocalDate to,
        String sort
) {
    public static WithdrawalExportFilter empty() {
        return new WithdrawalExportFilter(null, null, null, null, null, "newest");
    }

    public String normalized() {
        return "queryPresent=" + (query != null && !query.isBlank())
                + ";status=" + normalize(status)
                + ";risk=" + normalize(risk)
                + ";from=" + normalize(from)
                + ";to=" + normalize(to)
                + ";sort=" + normalize(sort == null || sort.isBlank() ? "newest" : sort);
    }

    private String normalize(Object value) {
        return value == null ? "" : value.toString().trim();
    }
}
