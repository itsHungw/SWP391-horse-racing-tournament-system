package com.example.horseracingtournamentsystem.filestorage;

import static org.hamcrest.Matchers.startsWith;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

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
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class FileStorageSecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRoleRepository userRoleRepository;

    @MockitoBean
    private ObjectStorage objectStorage;

    private String spectatorToken;
    private String otherSpectatorToken;
    private String adminToken;

    @BeforeEach
    void setUp() {
        when(objectStorage.createPresignedGetUrl(anyString(), anyString(), anyString()))
                .thenReturn(URI.create("https://example-bucket.s3.amazonaws.com/presigned-file"));

        userRoleRepository.deleteAll();
        roleRepository.deleteAll();
        userRepository.deleteAll();

        Role spectatorRole = roleRepository.save(Role.of("SPECTATOR", "Spectator"));
        Role adminRole = roleRepository.save(Role.of("ADMIN", "Admin"));
        User user = User.pending("Upload User", "upload-user@example.com", "hash");
        user.verifyEmail();
        user = userRepository.save(user);
        userRoleRepository.save(UserRole.active(user, spectatorRole, user));

        User otherUser = User.pending("Other User", "other-upload-user@example.com", "hash");
        otherUser.verifyEmail();
        otherUser = userRepository.save(otherUser);
        userRoleRepository.save(UserRole.active(otherUser, spectatorRole, user));

        User adminUser = User.pending("Admin User", "admin-upload-user@example.com", "hash");
        adminUser.verifyEmail();
        adminUser = userRepository.save(adminUser);
        userRoleRepository.save(UserRole.active(adminUser, adminRole, adminUser));

        spectatorToken = jwtService.generateToken(user.getEmail(), Set.of("SPECTATOR"));
        otherSpectatorToken = jwtService.generateToken(otherUser.getEmail(), Set.of("SPECTATOR"));
        adminToken = jwtService.generateToken(adminUser.getEmail(), Set.of("ADMIN"));
    }

    @Test
    void avatarUploadRejectsActiveHtmlContent() throws Exception {
        MockMultipartFile htmlFile = new MockMultipartFile(
                "file",
                "avatar.html",
                MediaType.TEXT_HTML_VALUE,
                "<script>alert('xss')</script>".getBytes()
        );

        mockMvc.perform(multipart("/api/v1/files/upload")
                        .file(htmlFile)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + spectatorToken)
                        .param("category", "AVATAR"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Unsupported file type for AVATAR"));
    }

    @Test
    void ownerEvidenceUploadReturnsAuthenticatedPrivateFileUrl() throws Exception {
        MockMultipartFile evidenceFile = new MockMultipartFile(
                "file",
                "evidence.pdf",
                MediaType.APPLICATION_PDF_VALUE,
                "fake-pdf".getBytes()
        );

        String privateUrl = com.jayway.jsonpath.JsonPath.read(
                mockMvc.perform(multipart("/api/v1/files/upload")
                                .file(evidenceFile)
                                .header(HttpHeaders.AUTHORIZATION, "Bearer " + spectatorToken)
                                .param("category", "OWNER_EVIDENCE"))
                        .andExpect(status().isOk())
                        .andExpect(jsonPath("$.url").value(startsWith("/api/v1/files/private/")))
                        .andReturn()
                        .getResponse()
                        .getContentAsString(),
                "$.url"
        );

        mockMvc.perform(get(privateUrl))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get(privateUrl)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + spectatorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.url").value("https://example-bucket.s3.amazonaws.com/presigned-file"));
    }

    @Test
    void privateUploadsCanOnlyBeDownloadedByUploaderOrAdmin() throws Exception {
        MockMultipartFile evidenceFile = new MockMultipartFile(
                "file",
                "owner-evidence.pdf",
                MediaType.APPLICATION_PDF_VALUE,
                "fake-pdf".getBytes()
        );

        String privateUrl = com.jayway.jsonpath.JsonPath.read(
                mockMvc.perform(multipart("/api/v1/files/upload")
                                .file(evidenceFile)
                                .header(HttpHeaders.AUTHORIZATION, "Bearer " + spectatorToken)
                                .param("category", "OWNER_EVIDENCE"))
                        .andExpect(status().isOk())
                        .andReturn()
                        .getResponse()
                        .getContentAsString(),
                "$.url"
        );

        mockMvc.perform(get(privateUrl)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + otherSpectatorToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(get(privateUrl)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.url").value("https://example-bucket.s3.amazonaws.com/presigned-file"));
    }

    @Test
    void publicAvatarDownloadRedirectsToPresignedUrl() throws Exception {
        MockMultipartFile avatarFile = new MockMultipartFile(
                "file",
                "avatar.png",
                MediaType.IMAGE_PNG_VALUE,
                "fake-image".getBytes()
        );

        String publicUrl = com.jayway.jsonpath.JsonPath.read(
                mockMvc.perform(multipart("/api/v1/files/upload")
                                .file(avatarFile)
                                .header(HttpHeaders.AUTHORIZATION, "Bearer " + spectatorToken)
                                .param("category", "AVATAR"))
                        .andExpect(status().isOk())
                        .andExpect(jsonPath("$.url").value(startsWith("/api/v1/files/download/")))
                        .andReturn()
                        .getResponse()
                        .getContentAsString(),
                "$.url"
        );

        mockMvc.perform(get(publicUrl))
                .andExpect(status().isFound())
                .andExpect(header().string(
                        HttpHeaders.LOCATION,
                        "https://example-bucket.s3.amazonaws.com/presigned-file"
                ));
    }

    @Test
    void jockeyAgreementUploadReturnsPrivateDownloadUrl() throws Exception {
        MockMultipartFile agreementFile = new MockMultipartFile(
                "file",
                "agreement.pdf",
                MediaType.APPLICATION_PDF_VALUE,
                "fake-pdf".getBytes()
        );

        String privateUrl = com.jayway.jsonpath.JsonPath.read(
                mockMvc.perform(multipart("/api/v1/files/upload")
                                .file(agreementFile)
                                .header(HttpHeaders.AUTHORIZATION, "Bearer " + spectatorToken)
                                .param("category", "JOCKEY_AGREEMENT"))
                        .andExpect(status().isOk())
                        .andExpect(jsonPath("$.url").value(startsWith("/api/v1/files/private/")))
                        .andReturn()
                        .getResponse()
                        .getContentAsString(),
                "$.url"
        );

        mockMvc.perform(get(privateUrl))
                .andExpect(status().isUnauthorized());
    }
}
