package com.example.horseracingtournamentsystem.filestorage;

import java.io.InputStream;
import java.net.URI;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;

@Component
public class S3ObjectStorage implements ObjectStorage {

    private final S3Client s3Client;
    private final S3Presigner s3Presigner;
    private final S3Properties properties;

    public S3ObjectStorage(S3Client s3Client, S3Presigner s3Presigner, S3Properties properties) {
        this.s3Client = s3Client;
        this.s3Presigner = s3Presigner;
        this.properties = properties;
    }

    @Override
    public void upload(String objectKey, InputStream inputStream, long contentLength, String contentType) {
        PutObjectRequest request = PutObjectRequest.builder()
                .bucket(properties.bucketName())
                .key(objectKey)
                .contentType(contentType)
                .build();
        s3Client.putObject(request, RequestBody.fromInputStream(inputStream, contentLength));
    }

    @Override
    public void delete(String objectKey) {
        s3Client.deleteObject(DeleteObjectRequest.builder()
                .bucket(properties.bucketName())
                .key(objectKey)
                .build());
    }

    @Override
    public URI createPresignedGetUrl(String objectKey, String contentType, String downloadFilename) {
        GetObjectRequest objectRequest = GetObjectRequest.builder()
                .bucket(properties.bucketName())
                .key(objectKey)
                .responseContentType(contentType)
                .responseContentDisposition("inline; filename=\"" + sanitizeFilename(downloadFilename) + "\"")
                .build();
        GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                .signatureDuration(properties.presignedUrlTtl())
                .getObjectRequest(objectRequest)
                .build();
        return URI.create(s3Presigner.presignGetObject(presignRequest).url().toString());
    }

    private String sanitizeFilename(String filename) {
        return filename.replace("\\", "_").replace("\"", "_").replace("\r", "").replace("\n", "");
    }
}
