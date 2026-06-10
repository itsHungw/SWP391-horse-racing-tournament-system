package com.example.horseracingtournamentsystem.filestorage;

import com.example.horseracingtournamentsystem.user.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "stored_files")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class StoredFileMetadata {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "filename", nullable = false, unique = true, length = 120)
    private String filename;

    @Column(name = "object_key", nullable = false, unique = true, length = 500)
    private String objectKey;

    @Column(name = "original_filename", nullable = false, length = 255)
    private String originalFilename;

    @Column(name = "category", nullable = false, length = 50)
    private String category;

    @Column(name = "content_type", nullable = false, length = 100)
    private String contentType;

    @Column(name = "private_file", nullable = false)
    private boolean privateFile;

    @Column(name = "file_size", nullable = false)
    private long fileSize;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "uploaded_by", nullable = false)
    private User uploadedBy;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    static StoredFileMetadata create(
            String filename,
            String objectKey,
            String originalFilename,
            String category,
            String contentType,
            boolean privateFile,
            long fileSize,
            User uploadedBy
    ) {
        StoredFileMetadata metadata = new StoredFileMetadata();
        metadata.filename = filename;
        metadata.objectKey = objectKey;
        metadata.originalFilename = originalFilename;
        metadata.category = category;
        metadata.contentType = contentType;
        metadata.privateFile = privateFile;
        metadata.fileSize = fileSize;
        metadata.uploadedBy = uploadedBy;
        metadata.createdAt = LocalDateTime.now();
        return metadata;
    }
}
