package com.example.horseracingtournamentsystem.dispute.dto;

import com.example.horseracingtournamentsystem.dispute.enums.DisputeCategory;
import com.example.horseracingtournamentsystem.dispute.enums.DisputeReferenceType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.List;

@Data
public class CreateDisputeRequest {
    @NotNull
    private DisputeReferenceType referenceType;

    @NotNull
    private Long referenceId;

    @NotNull
    private DisputeCategory category;

    @NotBlank
    private String title;

    @NotBlank
    private String description;
    
    private Long tournamentId;
    
    private Long organizationId;

    private List<String> evidenceUrls;
}
