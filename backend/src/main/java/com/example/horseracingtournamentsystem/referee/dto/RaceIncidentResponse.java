package com.example.horseracingtournamentsystem.referee.dto;

import java.time.LocalDateTime;

/**
 * Một dòng trong sổ sự cố của race, phẳng hoá cho Ban tổ chức đọc khi duyệt kết quả.
 *
 * <p>{@code violationType} quyết định ý nghĩa của {@code participantId}:
 * <ul>
 *   <li>{@code OBJECTION_INTERFERENCE} — participant là bên BỊ khiếu nại</li>
 *   <li>{@code OBJECTION_GENERAL} — participant là bên ĐỨNG ĐƠN khiếu nại</li>
 *   <li>{@code INCIDENT} — participant là đối tượng trọng tài tự ghi nhận</li>
 * </ul>
 */
public record RaceIncidentResponse(
        Long id,
        String violationType,
        Long participantId,
        String horseName,
        String jockeyName,
        String description,
        String penalty,
        String severity,
        LocalDateTime occurredAt
) {
}
