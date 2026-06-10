package com.example.horseracingtournamentsystem.horse;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.horseracingtournamentsystem.filestorage.ObjectStorage;
import com.example.horseracingtournamentsystem.horse.entity.Horse;
import com.example.horseracingtournamentsystem.horse.repository.HorseRepository;
import com.example.horseracingtournamentsystem.security.JwtService;
import com.example.horseracingtournamentsystem.user.entity.Role;
import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.user.entity.UserRole;
import com.example.horseracingtournamentsystem.user.repository.RoleRepository;
import com.example.horseracingtournamentsystem.user.repository.UserRepository;
import com.example.horseracingtournamentsystem.user.repository.UserRoleRepository;
import java.net.URI;
import java.util.Set;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class OwnerHorseIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private HorseRepository horseRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRoleRepository userRoleRepository;

    @MockitoBean
    private ObjectStorage objectStorage;

    private String ownerToken;
    private String spectatorToken;
    private User ownerUser;
    private User anotherOwnerUser;

    @BeforeEach
    void setUp() {
        when(objectStorage.createPresignedGetUrl(anyString(), anyString(), anyString()))
                .thenReturn(URI.create("https://example-bucket.s3.amazonaws.com/presigned-horse-image"));

        horseRepository.deleteAll();
        userRoleRepository.deleteAll();
        roleRepository.deleteAll();
        userRepository.deleteAll();

        Role ownerRole = roleRepository.save(Role.of("HORSE_OWNER", "Horse Owner"));
        Role spectatorRole = roleRepository.save(Role.of("SPECTATOR", "Spectator"));

        ownerUser = User.pending("Owner User", "owner@example.com", "hash");
        ownerUser.verifyEmail();
        ownerUser = userRepository.save(ownerUser);
        userRoleRepository.save(UserRole.active(ownerUser, ownerRole, ownerUser));

        User spectatorUser = User.pending("Spectator User", "spectator@example.com", "hash");
        spectatorUser.verifyEmail();
        spectatorUser = userRepository.save(spectatorUser);
        userRoleRepository.save(UserRole.active(spectatorUser, spectatorRole, ownerUser));

        anotherOwnerUser = User.pending("Another Owner", "another-owner@example.com", "hash");
        anotherOwnerUser.verifyEmail();
        anotherOwnerUser = userRepository.save(anotherOwnerUser);
        userRoleRepository.save(UserRole.active(anotherOwnerUser, ownerRole, ownerUser));

        ownerToken = jwtService.generateToken(ownerUser.getEmail(), Set.of("HORSE_OWNER"));
        spectatorToken = jwtService.generateToken(spectatorUser.getEmail(), Set.of("SPECTATOR"));
    }

    @Test
    void ownerCreatesPendingHorseWithS3UploadsWithoutOwnerId() throws Exception {
        MvcResult result = mockMvc.perform(multipart("/api/v1/owner/horses")
                        .file(imageFile())
                        .file(evidenceFile())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + ownerToken)
                        .param("name", "Nova")
                        .param("gender", "FEMALE")
                        .param("breed", "Thoroughbred")
                        .param("color", "Bay"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Nova"))
                .andExpect(jsonPath("$.ownerId").value(ownerUser.getId()))
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.imageUrl").value(org.hamcrest.Matchers.startsWith("/api/v1/files/download/")))
                .andExpect(jsonPath("$.evidenceUrl").value(org.hamcrest.Matchers.startsWith("/api/v1/files/private/")))
                .andReturn();

        String imageUrl = com.jayway.jsonpath.JsonPath.read(result.getResponse().getContentAsString(), "$.imageUrl");
        mockMvc.perform(get(imageUrl))
                .andExpect(status().isFound());
    }

    @Test
    void missingEvidenceFileReturnsValidationError() throws Exception {
        mockMvc.perform(multipart("/api/v1/owner/horses")
                        .file(imageFile())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + ownerToken)
                        .param("name", "Nova")
                        .param("gender", "FEMALE"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Evidence document must be PDF, JPG, PNG, or WebP and under 10MB."));
    }

    @Test
    void invalidImageTypeReturnsValidationError() throws Exception {
        MockMultipartFile textImage = new MockMultipartFile(
                "imageFile",
                "nova.txt",
                MediaType.TEXT_PLAIN_VALUE,
                "not an image".getBytes()
        );

        mockMvc.perform(multipart("/api/v1/owner/horses")
                        .file(textImage)
                        .file(evidenceFile())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + ownerToken)
                        .param("name", "Nova")
                        .param("gender", "FEMALE"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Horse image must be JPG, PNG, or WebP and under 5MB."));
    }

    @Test
    void ownerGetsOwnHorseDetail() throws Exception {
        Horse horse = horseRepository.save(Horse.create(
                ownerUser,
                "Nova",
                "NOVA_001",
                "Thoroughbred",
                "FEMALE",
                null,
                "Bay"
        ));

        mockMvc.perform(get("/api/v1/owner/horses/{id}", horse.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(horse.getId()))
                .andExpect(jsonPath("$.name").value("Nova"));
    }

    @Test
    void ownerGetsPaginatedHorseRoster() throws Exception {
        for (int index = 1; index <= 9; index++) {
            horseRepository.save(Horse.create(
                    ownerUser,
                    "Horse " + index,
                    "OWNER_HORSE_" + index,
                    "Thoroughbred",
                    "FEMALE",
                    null,
                    "Bay"
            ));
        }
        horseRepository.save(Horse.create(
                anotherOwnerUser,
                "Other Owner Horse",
                "OTHER_OWNER_HORSE",
                "Thoroughbred",
                "MALE",
                null,
                "Black"
        ));

        mockMvc.perform(get("/api/v1/owner/horses")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + ownerToken)
                        .param("page", "1")
                        .param("size", "4"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(4))
                .andExpect(jsonPath("$.totalElements").value(9))
                .andExpect(jsonPath("$.size").value(4))
                .andExpect(jsonPath("$.number").value(1));
    }

    @Test
    void ownerUploadsHorseDocumentWithMetadata() throws Exception {
        Horse horse = horseRepository.save(Horse.create(
                ownerUser,
                "Nova",
                "NOVA_001",
                "Thoroughbred",
                "FEMALE",
                null,
                "Bay"
        ));

        mockMvc.perform(multipart("/api/v1/owner/horses/{id}/documents", horse.getId())
                        .file(documentFile())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + ownerToken)
                        .param("documentType", "HEALTH_CERTIFICATE")
                        .param("referenceNumber", "HC-2026-001")
                        .param("issueDate", "2026-05-01")
                        .param("expiryDate", "2027-05-01")
                        .param("issuer", "Saigon Equine Clinic")
                        .param("notes", "Annual health certificate."))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.horseId").value(horse.getId()))
                .andExpect(jsonPath("$.documentType").value("HEALTH_CERTIFICATE"))
                .andExpect(jsonPath("$.referenceNumber").value("HC-2026-001"))
                .andExpect(jsonPath("$.issuer").value("Saigon Equine Clinic"))
                .andExpect(jsonPath("$.fileUrl").value(org.hamcrest.Matchers.startsWith("/api/v1/files/private/")));

        mockMvc.perform(get("/api/v1/owner/horses/{id}/documents", horse.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].documentType").value("HEALTH_CERTIFICATE"))
                .andExpect(jsonPath("$[0].referenceNumber").value("HC-2026-001"));
    }

    @Test
    void ownerCannotUploadDocumentForAnotherOwnersHorse() throws Exception {
        Horse horse = horseRepository.save(Horse.create(
                anotherOwnerUser,
                "Other Nova",
                "OTHER_NOVA_001",
                "Thoroughbred",
                "FEMALE",
                null,
                "Bay"
        ));

        mockMvc.perform(multipart("/api/v1/owner/horses/{id}/documents", horse.getId())
                        .file(documentFile())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + ownerToken)
                        .param("documentType", "HEALTH_CERTIFICATE")
                        .param("referenceNumber", "HC-2026-001")
                        .param("issueDate", "2026-05-01")
                        .param("expiryDate", "2027-05-01")
                        .param("issuer", "Saigon Equine Clinic"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Horse not found"));
    }

    @Test
    void documentExpiryBeforeIssueDateReturnsValidationError() throws Exception {
        Horse horse = horseRepository.save(Horse.create(
                ownerUser,
                "Nova",
                "NOVA_001",
                "Thoroughbred",
                "FEMALE",
                null,
                "Bay"
        ));

        mockMvc.perform(multipart("/api/v1/owner/horses/{id}/documents", horse.getId())
                        .file(documentFile())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + ownerToken)
                        .param("documentType", "HEALTH_CERTIFICATE")
                        .param("referenceNumber", "HC-2026-001")
                        .param("issueDate", "2027-05-01")
                        .param("expiryDate", "2026-05-01")
                        .param("issuer", "Saigon Equine Clinic"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Expiry date must be on or after issue date."));
    }

    @Test
    void ownerCannotGetAnotherOwnersHorseDetail() throws Exception {
        Horse horse = horseRepository.save(Horse.create(
                anotherOwnerUser,
                "Other Nova",
                "OTHER_NOVA_001",
                "Thoroughbred",
                "FEMALE",
                null,
                "Bay"
        ));

        mockMvc.perform(get("/api/v1/owner/horses/{id}", horse.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + ownerToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Horse not found"));
    }

    @Test
    void spectatorCannotCreateOwnerHorse() throws Exception {
        mockMvc.perform(multipart("/api/v1/owner/horses")
                        .file(imageFile())
                        .file(evidenceFile())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + spectatorToken)
                        .param("name", "Nova")
                        .param("gender", "FEMALE"))
                .andExpect(status().isForbidden());
    }

    private MockMultipartFile imageFile() {
        return new MockMultipartFile(
                "imageFile",
                "nova.png",
                MediaType.IMAGE_PNG_VALUE,
                "fake-png".getBytes()
        );
    }

    private MockMultipartFile evidenceFile() {
        return new MockMultipartFile(
                "evidenceFile",
                "nova.pdf",
                MediaType.APPLICATION_PDF_VALUE,
                "fake-pdf".getBytes()
        );
    }

    private MockMultipartFile documentFile() {
        return new MockMultipartFile(
                "documentFile",
                "health-certificate.pdf",
                MediaType.APPLICATION_PDF_VALUE,
                "fake-document".getBytes()
        );
    }
}
