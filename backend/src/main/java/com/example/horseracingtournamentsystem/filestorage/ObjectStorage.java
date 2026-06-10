package com.example.horseracingtournamentsystem.filestorage;

import java.io.InputStream;
import java.net.URI;

public interface ObjectStorage {

    void upload(String objectKey, InputStream inputStream, long contentLength, String contentType);

    void delete(String objectKey);

    URI createPresignedGetUrl(String objectKey, String contentType, String downloadFilename);
}
