package com.example.horseracingtournamentsystem.dispute.dto;

import com.example.horseracingtournamentsystem.dispute.enums.*;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class DisputeResponse {
    private Long id;
    private Long requesterId;
    private String requesterName;
    private String requesterEmail;
    private DisputeRole requesterRole;
    private DisputeRole handlerRole;
    private Long tournamentId;
    private Long organizationId;
    private DisputeReferenceType referenceType;
    private Long referenceId;
    private DisputeCategory category;
    private String title;
    private String description;
    private DisputeStatus status;
    private DisputePriority priority;
    private String resolutionNote;
    private LocalDateTime resolvedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<DisputeAttachmentResponse> attachments;
}
