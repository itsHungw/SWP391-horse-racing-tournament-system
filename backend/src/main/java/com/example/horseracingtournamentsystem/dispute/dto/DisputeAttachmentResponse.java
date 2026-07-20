package com.example.horseracingtournamentsystem.dispute.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class DisputeAttachmentResponse {
    private Long id;
    private String fileUrl;
    private LocalDateTime createdAt;
}
