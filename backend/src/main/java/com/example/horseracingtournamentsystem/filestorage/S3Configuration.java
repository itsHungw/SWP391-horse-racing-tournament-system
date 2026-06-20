package com.example.horseracingtournamentsystem.filestorage;

import java.net.URI;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.AwsCredentialsProvider;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3ClientBuilder;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

@Configuration
@EnableConfigurationProperties(S3Properties.class)
public class S3Configuration {

    @Bean
    S3Client s3Client(S3Properties properties) {
        S3ClientBuilder builder = S3Client.builder()
                .region(Region.of(properties.region()))
                .credentialsProvider(credentialsProvider(properties));
        if (properties.hasCustomEndpoint()) {
            builder.endpointOverride(URI.create(properties.endpoint()))
                    .serviceConfiguration(pathStyleConfiguration());
        }
        return builder.build();
    }

    @Bean
    S3Presigner s3Presigner(S3Properties properties) {
        S3Presigner.Builder builder = S3Presigner.builder()
                .region(Region.of(properties.region()))
                .credentialsProvider(credentialsProvider(properties));
        if (properties.hasCustomEndpoint()) {
            builder.endpointOverride(URI.create(properties.endpoint()))
                    .serviceConfiguration(pathStyleConfiguration());
        }
        return builder.build();
    }

    private software.amazon.awssdk.services.s3.S3Configuration pathStyleConfiguration() {
        return software.amazon.awssdk.services.s3.S3Configuration.builder()
                .pathStyleAccessEnabled(true)
                .build();
    }

    private AwsCredentialsProvider credentialsProvider(S3Properties properties) {
        if (properties.hasStaticCredentials()) {
            return StaticCredentialsProvider.create(
                    AwsBasicCredentials.create(properties.accessKey(), properties.secretKey()));
        }
        return DefaultCredentialsProvider.create();
    }
}
