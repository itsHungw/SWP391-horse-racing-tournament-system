package com.example.horseracingtournamentsystem.filestorage;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.user.repository.UserRepository;
import java.io.InputStream;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;

@ExtendWith(MockitoExtension.class)
class FileStorageServiceS3Test {

    @Mock
    private ObjectStorage objectStorage;

    @Mock
    private StoredFileMetadataRepository metadataRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private FileAccessAuthorizationService accessAuthorizationService;

    private FileStorageService service;
    private User uploader;

    @BeforeEach
    void setUp() {
        service = new FileStorageService(
                objectStorage,
                metadataRepository,
                userRepository,
                accessAuthorizationService
        );
        uploader = User.pending("Uploader", "uploader@example.com", "hash");
        when(userRepository.findByEmail("uploader@example.com")).thenReturn(Optional.of(uploader));
    }

    @Test
    void uploadsAvatarToS3AndPersistsMetadata() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "profile.png",
                MediaType.IMAGE_PNG_VALUE,
                "png-content".getBytes()
        );
        when(metadataRepository.save(any(StoredFileMetadata.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        FileStorageService.StoredFile storedFile =
                service.storeFile(file, "AVATAR", "uploader@example.com");

        ArgumentCaptor<String> keyCaptor = ArgumentCaptor.forClass(String.class);
        verify(objectStorage).upload(
                keyCaptor.capture(),
                any(InputStream.class),
                eq(file.getSize()),
                eq(MediaType.IMAGE_PNG_VALUE)
        );
        assertThat(keyCaptor.getValue()).startsWith("public/avatars/").endsWith(".png");

        ArgumentCaptor<StoredFileMetadata> metadataCaptor =
                ArgumentCaptor.forClass(StoredFileMetadata.class);
        verify(metadataRepository).save(metadataCaptor.capture());
        StoredFileMetadata metadata = metadataCaptor.getValue();
        assertThat(metadata.getObjectKey()).isEqualTo(keyCaptor.getValue());
        assertThat(metadata.getOriginalFilename()).isEqualTo("profile.png");
        assertThat(metadata.getFileSize()).isEqualTo(file.getSize());
        assertThat(metadata.isPrivateFile()).isFalse();
        assertThat(storedFile.url()).startsWith("/api/v1/files/download/");
    }

    @Test
    void deletesUploadedObjectWhenMetadataInsertFails() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "resume.pdf",
                MediaType.APPLICATION_PDF_VALUE,
                "pdf-content".getBytes()
        );
        when(metadataRepository.save(any(StoredFileMetadata.class)))
                .thenThrow(new IllegalStateException("database unavailable"));

        assertThatThrownBy(() -> service.storeFile(
                file,
                "ROLE_REQUEST_RESUME",
                "uploader@example.com"
        )).isInstanceOf(IllegalStateException.class)
                .hasMessage("database unavailable");

        ArgumentCaptor<String> keyCaptor = ArgumentCaptor.forClass(String.class);
        verify(objectStorage).upload(
                keyCaptor.capture(),
                any(InputStream.class),
                eq(file.getSize()),
                eq(MediaType.APPLICATION_PDF_VALUE)
        );
        assertThat(keyCaptor.getValue()).startsWith("private/role-resumes/").endsWith(".pdf");
        verify(objectStorage).delete(keyCaptor.getValue());
    }
}
