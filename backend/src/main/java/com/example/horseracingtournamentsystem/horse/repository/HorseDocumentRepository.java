package com.example.horseracingtournamentsystem.horse.repository;

import com.example.horseracingtournamentsystem.horse.entity.HorseDocument;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HorseDocumentRepository extends JpaRepository<HorseDocument, Long> {
    List<HorseDocument> findAllByHorseIdAndHorseOwnerEmailOrderByCreatedAtDesc(Long horseId, String ownerEmail);
    List<HorseDocument> findAllByHorseIdAndDocumentTypeIn(Long horseId, List<String> documentTypes);
}
