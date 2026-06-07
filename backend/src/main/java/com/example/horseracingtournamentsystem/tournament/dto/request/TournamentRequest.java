package com.example.horseracingtournamentsystem.tournament.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TournamentRequest {
    @NotBlank(message = "Name is required")
    @Size(max = 200, message = "Name must not exceed 200 characters")
    private String name;

    @NotBlank(message = "Code is required")
    @Size(max = 100, message = "Code must not exceed 100 characters")
    private String code;

    private String description;

    @NotBlank(message = "Location is required")
    @Size(max = 255, message = "Location must not exceed 255 characters")
    private String location;

    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    @NotNull(message = "End date is required")
    private LocalDate endDate;

    @NotNull(message = "Registration start time is required")
    private LocalDateTime registrationStartAt;

    @NotNull(message = "Registration end time is required")
    private LocalDateTime registrationEndAt;

    @Positive(message = "Max horses must be greater than 0")
    private Integer maxHorses;

    @Positive(message = "Max horses per owner must be greater than 0")
    private Integer maxHorsesPerOwner;
}
