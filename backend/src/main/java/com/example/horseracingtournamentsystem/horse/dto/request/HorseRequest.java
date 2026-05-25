package com.example.horseracingtournamentsystem.horse.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class HorseRequest {
    @NotNull(message = "Owner ID is required")
    private Long ownerId;

    @NotBlank(message = "Horse name is required")
    @Size(max = 150)
    private String name;

    @Size(max = 100)
    private String breed;

    @NotBlank(message = "Gender is required")
    private String gender; // MALE / FEMALE

    private LocalDate dateOfBirth;

    @Size(max = 50)
    private String color;
}
