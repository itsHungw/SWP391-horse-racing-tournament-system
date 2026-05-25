package com.example.horseracingtournamentsystem.race.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RaceRequest {
    @NotNull(message = "Tournament ID is required")
    private Long tournamentId;

    @NotBlank(message = "Race name is required")
    @Size(max = 200)
    private String name;

    @NotBlank(message = "Race code is required")
    @Size(max = 100)
    private String code;

    @NotNull(message = "Race date and time is required")
    private LocalDateTime raceDateTime;

    @NotNull(message = "Distance is required")
    @Min(value = 1, message = "Distance must be greater than 0")
    private Integer distanceMeters;

    @NotNull(message = "Max participants is required")
    @Min(value = 2, message = "Max participants must be at least 2")
    private Integer maxParticipants;
}
