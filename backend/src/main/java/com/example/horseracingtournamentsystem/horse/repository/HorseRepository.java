package com.example.horseracingtournamentsystem.horse.repository;

import com.example.horseracingtournamentsystem.horse.entity.Horse;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface HorseRepository extends JpaRepository<Horse, Long> {
    Optional<Horse> findByIdAndDeletedAtIsNull(Long id);
    List<Horse> findAllByDeletedAtIsNull();
    List<Horse> findAllByStatusAndDeletedAtIsNull(String status);
    List<Horse> findAllByOwnerEmailAndDeletedAtIsNullOrderByCreatedAtDesc(String ownerEmail);
    Optional<Horse> findByIdAndStatusAndDeletedAtIsNull(Long id, String status);
}
