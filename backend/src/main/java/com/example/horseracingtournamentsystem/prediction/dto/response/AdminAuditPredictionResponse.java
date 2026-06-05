package com.example.horseracingtournamentsystem.prediction.dto.response;

import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
public class AdminAuditPredictionResponse {
    private Long predictionId;
    private String spectatorName;
    private String spectatorEmail;
    private String predictionType;
    private List<String> selections; // List of selected horse names
    private Integer entryCostPoints;
    private String status; // PENDING, LOCKED, CORRECT, INCORRECT, CANCELLED, REFUNDED
    private String displayStatus; // Submitted, Locked, Won, Lost, Refunded
    private String resultCategory; // Winner Correct, Exact Top 3, Top 3 Any Order, Incorrect, Refunded, Pending, Locked
    private Integer rewardPoints;
    private LocalDateTime submittedAt;
    private LocalDateTime evaluatedAt;
}
