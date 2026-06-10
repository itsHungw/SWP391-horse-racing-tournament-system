package com.example.horseracingtournamentsystem.common.upload;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.example.horseracingtournamentsystem.filestorage.FileStorageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;

@ExtendWith(MockitoExtension.class)
class HorseFileStorageServiceTest {

    @Mock
    private FileStorageService fileStorageService;

    private HorseFileStorageService service;

    @BeforeEach
    void setUp() {
        UploadProperties properties = new UploadProperties();
        properties.setHorseImageMaxBytes(5L * 1024L * 1024L);
        properties.setHorseEvidenceMaxBytes(10L * 1024L * 1024L);
        service = new HorseFileStorageService(properties, fileStorageService);
    }

    @Test
    void storesHorseImageThroughSharedS3FileService() {
        MockMultipartFile image = new MockMultipartFile(
                "imageFile",
                "nova.png",
                MediaType.IMAGE_PNG_VALUE,
                "image".getBytes()
        );
        when(fileStorageService.storeFileForUserId(image, "HORSE_IMAGE", 7L))
                .thenReturn(new FileStorageService.StoredFile(
                        "stored.png",
                        "/api/v1/files/download/stored.png",
                        MediaType.IMAGE_PNG_VALUE,
                        false
                ));

        String url = service.storeHorseImage(7L, image);

        assertThat(url).isEqualTo("/api/v1/files/download/stored.png");
        verify(fileStorageService).storeFileForUserId(image, "HORSE_IMAGE", 7L);
    }

    @Test
    void storesHorseEvidenceAsPrivateFile() {
        MockMultipartFile evidence = new MockMultipartFile(
                "evidenceFile",
                "nova.pdf",
                MediaType.APPLICATION_PDF_VALUE,
                "pdf".getBytes()
        );
        when(fileStorageService.storeFileForUserId(evidence, "HORSE_EVIDENCE", 7L))
                .thenReturn(new FileStorageService.StoredFile(
                        "stored.pdf",
                        "/api/v1/files/private/stored.pdf",
                        MediaType.APPLICATION_PDF_VALUE,
                        true
                ));

        String url = service.storeHorseEvidence(7L, evidence);

        assertThat(url).isEqualTo("/api/v1/files/private/stored.pdf");
        verify(fileStorageService).storeFileForUserId(evidence, "HORSE_EVIDENCE", 7L);
    }
}
