package com.example.horseracingtournamentsystem.filestorage;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StoredFileMetadataRepository extends JpaRepository<StoredFileMetadata, Long> {

    Optional<StoredFileMetadata> findByFilename(String filename);
}
