package com.example.horseracingtournamentsystem.horse.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import lombok.Getter;
import lombok.Setter;
import org.springframework.web.multipart.MultipartFile;

@Getter
@Setter
public class OwnerHorseDocumentMultipartRequest {
    @NotBlank(message = "Document type is required")
    @Pattern(
            regexp = "OWNERSHIP_CERTIFICATE|HEALTH_CERTIFICATE|COGGINS|REGISTRATION_CERTIFICATE|OTHER",
            message = "Document type is not supported"
    )
    private String documentType;

    @NotBlank(message = "Reference number is required")
    @Size(max = 100, message = "Reference number must be at most 100 characters")
    private String referenceNumber;

    @NotNull(message = "Issue date is required")
    private LocalDate issueDate;

    @NotNull(message = "Expiry date is required")
    private LocalDate expiryDate;

    @NotBlank(message = "Issuer is required")
    @Size(max = 150, message = "Issuer must be at most 150 characters")
    private String issuer;

    private MultipartFile documentFile;
    private String notes;
}
