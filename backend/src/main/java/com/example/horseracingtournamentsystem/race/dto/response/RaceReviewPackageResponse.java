package com.example.horseracingtournamentsystem.race.dto.response;

import com.example.horseracingtournamentsystem.referee.dto.RaceIncidentResponse;
import java.util.List;

/**
 * Hồ sơ kết quả mà trọng tài nộp lên, gom lại cho Ban tổ chức đọc trước khi chốt (BR-16):
 * tường trình + toàn bộ sự cố và khiếu nại đã được trọng tài xử lý tại chỗ.
 *
 * <p>{@code returnedReason} khác null nghĩa là gói này từng bị BTC trả về cho trọng tài sửa.
 */
public record RaceReviewPackageResponse(
        String reportTitle,
        String reportSummary,
        String returnedReason,
        List<RaceIncidentResponse> incidents
) {
}
