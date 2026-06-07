package com.example.horseracingtournamentsystem.horse.dto.response;

import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class HorseDocumentResponse {
    private Long id;
    private Long horseId;
    private String horseName;
    private String documentType;
    private String referenceNumber;
    private LocalDate issueDate;
    private LocalDate expiryDate;
    private String issuer;
    private String fileUrl;
    private String notes;
    private LocalDateTime createdAt;
}
