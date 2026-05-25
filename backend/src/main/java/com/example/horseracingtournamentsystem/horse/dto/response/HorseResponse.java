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
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
