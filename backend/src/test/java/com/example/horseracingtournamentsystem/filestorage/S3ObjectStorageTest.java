package com.example.horseracingtournamentsystem.filestorage;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.io.ByteArrayInputStream;
import java.net.URI;
import java.time.Duration;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;

@ExtendWith(MockitoExtension.class)
class S3ObjectStorageTest {

    @Mock
    private S3Client s3Client;

    @Mock
    private S3Presigner s3Presigner;

    @Mock
    private PresignedGetObjectRequest presignedGetObjectRequest;

    @Test
    void uploadsObjectToConfiguredBucket() {
        S3ObjectStorage storage = storage();
        byte[] content = "image-content".getBytes();

        storage.upload(
                "public/avatars/avatar.png",
                new ByteArrayInputStream(content),
                content.length,
                "image/png"
        );

        ArgumentCaptor<PutObjectRequest> requestCaptor = ArgumentCaptor.forClass(PutObjectRequest.class);
        verify(s3Client).putObject(requestCaptor.capture(), any(RequestBody.class));
        PutObjectRequest request = requestCaptor.getValue();
        assertThat(request.bucket()).isEqualTo("test-private-bucket");
        assertThat(request.key()).isEqualTo("public/avatars/avatar.png");
        assertThat(request.contentType()).isEqualTo("image/png");
    }

    @Test
    void deletesObjectFromConfiguredBucket() {
        S3ObjectStorage storage = storage();

        storage.delete("private/resumes/resume.pdf");

        verify(s3Client).deleteObject(DeleteObjectRequest.builder()
                .bucket("test-private-bucket")
                .key("private/resumes/resume.pdf")
                .build());
    }

    @Test
    void createsShortLivedPresignedDownloadUrl() throws Exception {
        S3ObjectStorage storage = storage();
        when(presignedGetObjectRequest.url()).thenReturn(URI.create("https://signed.example/file").toURL());
        when(s3Presigner.presignGetObject(any(GetObjectPresignRequest.class)))
                .thenReturn(presignedGetObjectRequest);

        URI url = storage.createPresignedGetUrl(
                "private/resumes/resume.pdf",
                "application/pdf",
                "resume.pdf"
        );

        assertThat(url).isEqualTo(URI.create("https://signed.example/file"));
        ArgumentCaptor<GetObjectPresignRequest> requestCaptor =
                ArgumentCaptor.forClass(GetObjectPresignRequest.class);
        verify(s3Presigner).presignGetObject(requestCaptor.capture());
        GetObjectPresignRequest request = requestCaptor.getValue();
        assertThat(request.signatureDuration()).isEqualTo(Duration.ofMinutes(5));
        assertThat(request.getObjectRequest().bucket()).isEqualTo("test-private-bucket");
        assertThat(request.getObjectRequest().key()).isEqualTo("private/resumes/resume.pdf");
        assertThat(request.getObjectRequest().responseContentType()).isEqualTo("application/pdf");
        assertThat(request.getObjectRequest().responseContentDisposition())
                .isEqualTo("inline; filename=\"resume.pdf\"");
    }

    private S3ObjectStorage storage() {
        return new S3ObjectStorage(
                s3Client,
                s3Presigner,
                new S3Properties("test-private-bucket", "ap-southeast-1", Duration.ofMinutes(5), null, null, null)
        );
    }
}
