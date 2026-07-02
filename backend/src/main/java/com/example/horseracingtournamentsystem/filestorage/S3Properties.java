package com.example.horseracingtournamentsystem.filestorage;

import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("storage.s3")
public record S3Properties(
        String bucketName,
        String region,
        Duration presignedUrlTtl,
        String endpoint,
        String accessKey,
        String secretKey
) {
    public boolean hasCustomEndpoint() {
        return endpoint != null && !endpoint.isBlank();
    }

    public boolean hasStaticCredentials() {
        return accessKey != null && !accessKey.isBlank()
                && secretKey != null && !secretKey.isBlank();
    }
}
