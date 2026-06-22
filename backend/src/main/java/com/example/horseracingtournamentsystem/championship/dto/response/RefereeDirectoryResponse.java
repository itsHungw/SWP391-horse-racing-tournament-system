package com.example.horseracingtournamentsystem.championship.dto.response;

/** Một referee đã được nền tảng cấp phép (role REFEREE active) để organizer chọn mời. */
public record RefereeDirectoryResponse(
        Long refereeId,
        String fullName,
        String email,
        String licenseNumber,
        Integer experienceYears,
        String certification
) {
}
