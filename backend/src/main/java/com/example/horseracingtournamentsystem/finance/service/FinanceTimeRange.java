package com.example.horseracingtournamentsystem.finance.service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;

record FinanceTimeRange(LocalDateTime start, LocalDateTime endExclusive) {

    private static final ZoneId VIETNAM_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    static FinanceTimeRange between(LocalDate from, LocalDate to) {
        ZoneId storageZone = ZoneId.systemDefault();
        return new FinanceTimeRange(
                from.atStartOfDay(VIETNAM_ZONE).withZoneSameInstant(storageZone).toLocalDateTime(),
                to.plusDays(1).atStartOfDay(VIETNAM_ZONE).withZoneSameInstant(storageZone).toLocalDateTime());
    }

    static Instant toInstant(LocalDateTime value) {
        return value == null ? null : value.atZone(ZoneId.systemDefault()).toInstant();
    }
}
