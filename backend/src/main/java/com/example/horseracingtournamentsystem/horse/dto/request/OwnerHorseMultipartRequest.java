package com.example.horseracingtournamentsystem.horse.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import lombok.Getter;
import lombok.Setter;
import org.springframework.web.multipart.MultipartFile;

@Getter
@Setter
public class OwnerHorseMultipartRequest {
    @NotBlank(message = "Horse name is required")
    @Size(max = 150)
    private String name;

    @Size(max = 100)
    private String registrationCode;

    @Size(max = 100)
    private String breed;

    @NotBlank(message = "Gender is required")
    @Pattern(regexp = "MALE|FEMALE", message = "Gender must be MALE or FEMALE")
    private String gender;

    @PastOrPresent(message = "Date of birth cannot be in the future")
    private LocalDate dateOfBirth;

    @Size(max = 50)
    private String color;

    @Positive(message = "Height must be greater than 0")
    @jakarta.validation.constraints.Max(value = 9999, message = "Height cannot exceed 9999 cm")
    private Integer heightCm;

    @Positive(message = "Weight must be greater than 0")
    @jakarta.validation.constraints.Max(value = 9999, message = "Weight cannot exceed 9999 kg")
    private Integer weightKg;

    @Size(max = 50)
    private String healthStatus;

    private String medicalNote;
    private String description;
    private MultipartFile imageFile;
    private MultipartFile evidenceFile;

    public OwnerHorseRequest toOwnerHorseRequest(String imageUrl, String evidenceUrl) {
        return new OwnerHorseRequest(
                name,
                registrationCode,
                breed,
                gender,
                dateOfBirth,
                color,
                heightCm,
                weightKg,
                healthStatus,
                imageUrl,
                evidenceUrl,
                medicalNote,
                description
        );
    }
}
