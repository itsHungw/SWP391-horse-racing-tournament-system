package com.example.horseracingtournamentsystem.prediction.dto.response;

import lombok.Getter;
import lombok.Setter;
import lombok.Builder;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

import com.example.horseracingtournamentsystem.prediction.enums.PredictionStatus;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AdminAuditPredictionResponse {
    private Long predictionId;
    private String spectatorName;
    private String spectatorEmail;
    private String predictionType;
    private List<String> selections; // List of selected horse names
    private Integer entryCostPoints;
    private PredictionStatus status;
    private String displayStatus; // Submitted, Locked, Won, Lost, Refunded
    private String resultCategory; // Winner Correct, Exact Top 3, Top 3 Any Order, Incorrect, Refunded, Pending, Locked
    private Integer rewardPoints;
    private LocalDateTime submittedAt;
    private LocalDateTime evaluatedAt;
}
