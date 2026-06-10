package com.example.horseracingtournamentsystem.filestorage;

import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("aws.s3")
public record S3Properties(
        String bucketName,
        String region,
        Duration presignedUrlTtl
) {
}
