package com.example.horseracingtournamentsystem.organization.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Hồ sơ KYB của Ban tổ chức (Cổng 1). Ràng buộc server-side (không tin client):
 * tên + giấy phép + email liên hệ bắt buộc; capability statement >= 50 ký tự.
 * evidenceUrl/logoUrl là URL thu được sau khi upload qua /files/upload.
 */
public record RegisterOrganizationRequest(
        @NotBlank @Size(max = 200) String name,
        @NotBlank @Size(max = 100) String licenseNumber,
        @NotBlank @Email @Size(max = 150) String contactEmail,
        @Size(max = 30) String contactPhone,
        @Size(max = 500) String description,
        @Size(max = 500) String evidenceUrl,
        @Size(max = 500) String logoUrl,
        @NotBlank @Size(min = 50, max = 2000) String applicationNote
) {
}
