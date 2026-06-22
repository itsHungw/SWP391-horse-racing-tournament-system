package com.example.horseracingtournamentsystem.filestorage;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;
import org.junit.jupiter.api.Test;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;

class S3ConfigurationTest {

    @Test
    void minioPresignerUsesPathStyleUrlsForBrowserDownloads() {
        S3Properties properties = new S3Properties(
                "horseracing-dev",
                "ap-southeast-1",
                Duration.ofMinutes(5),
                "http://localhost:9000",
                "minioadmin",
                "minioadmin"
        );

        try (S3Presigner presigner = new S3Configuration().s3Presigner(properties)) {
            String url = presigner.presignGetObject(GetObjectPresignRequest.builder()
                            .signatureDuration(properties.presignedUrlTtl())
                            .getObjectRequest(GetObjectRequest.builder()
                                    .bucket(properties.bucketName())
                                    .key("public/horses/images/nova.png")
                                    .build())
                            .build())
                    .url()
                    .toString();

            assertThat(url).startsWith("http://localhost:9000/horseracing-dev/public/horses/images/nova.png");
            assertThat(url).doesNotContain("horseracing-dev.localhost");
        }
    }
}
