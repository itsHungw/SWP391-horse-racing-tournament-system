package com.example.horseracingtournamentsystem.filestorage;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/files")
@RequiredArgsConstructor
public class FileStorageController {

    private final FileStorageService fileStorageService;

    @PostMapping("/upload")
    public Map<String, String> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "category", defaultValue = "AVATAR") String category,
            Authentication authentication
    ) {
        FileStorageService.StoredFile storedFile = fileStorageService.storeFile(file, category, authentication == null ? null : authentication.getName());
        return Map.of("url", storedFile.url());
    }

    @GetMapping("/download/{filename:.+}")
    public ResponseEntity<Resource> downloadFile(@PathVariable String filename) throws IOException {
        Path filePath = fileStorageService.loadPublicFile(filename);
        return buildFileResponse(filePath, "inline");
    }

    @GetMapping("/private/{filename:.+}")
    public ResponseEntity<Resource> downloadPrivateFile(@PathVariable String filename, Authentication authentication) throws IOException {
        fileStorageService.assertCanReadPrivateFile(filename, authentication);
        Path filePath = fileStorageService.loadPrivateFile(filename);
        return buildFileResponse(filePath, "attachment");
    }

    private ResponseEntity<Resource> buildFileResponse(Path filePath, String disposition) throws IOException {
        Resource resource = new UrlResource(filePath.toUri());

        String contentType = Files.probeContentType(filePath);
        if (contentType == null) {
            contentType = "application/octet-stream";
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition + "; filename=\"" + resource.getFilename() + "\"")
                .body(resource);
    }
}
