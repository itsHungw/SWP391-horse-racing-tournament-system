package com.example.horseracingtournamentsystem.race.dto.request;

import jakarta.validation.constraints.NotBlank;

/** Lý do bắt buộc khi organizer trả kết quả về cho referee sửa (RESULT_SUBMITTED -> FINISHED). */
public record ReopenResultsRequest(
        @NotBlank(message = "A reason is required when sending results back for correction")
        String reason
) {
}
