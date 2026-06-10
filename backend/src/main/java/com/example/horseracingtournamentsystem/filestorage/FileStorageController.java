package com.example.horseracingtournamentsystem.filestorage;

import java.net.URI;
import java.util.Map;
import lombok.RequiredArgsConstructor;
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
    public ResponseEntity<Void> downloadFile(@PathVariable String filename) {
        URI presignedUrl = fileStorageService.createPublicDownloadUrl(filename);
        return ResponseEntity.status(302).location(presignedUrl).build();
    }

    @GetMapping("/private/{filename:.+}")
    public Map<String, String> downloadPrivateFile(
            @PathVariable String filename,
            Authentication authentication
    ) {
        URI presignedUrl = fileStorageService.createPrivateDownloadUrl(filename, authentication);
        return Map.of("url", presignedUrl.toString());
    }
}
