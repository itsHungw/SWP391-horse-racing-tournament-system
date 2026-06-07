package com.example.horseracingtournamentsystem.horse.dto.response;

import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@AllArgsConstructor
public class HorseResponse {
    private Long id;
    private Long ownerId;
    private String ownerName;
    private String name;
    private String registrationCode;
    private String breed;
    private String gender;
    private LocalDate dateOfBirth;
    private String color;
    private Integer heightCm;
    private Integer weightKg;
    private String healthStatus;
    private String imageUrl;
    private String evidenceUrl;
    private String medicalNote;
    private String description;
    private String status;
    private String rejectionReason;
    private Long approvedBy;
    private LocalDateTime approvedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
