package com.example.horseracingtournamentsystem.dispute.dto;

import com.example.horseracingtournamentsystem.dispute.enums.DisputePriority;
import com.example.horseracingtournamentsystem.dispute.enums.DisputeStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateDisputeStatusRequest {
    @NotNull
    private DisputeStatus status;
    private DisputePriority priority;
    private String resolutionNote;
}
