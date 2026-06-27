package com.example.horseracingtournamentsystem.horse.repository;

import com.example.horseracingtournamentsystem.horse.entity.Horse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface HorseRepository extends JpaRepository<Horse, Long> {
    Optional<Horse> findByIdAndDeletedAtIsNull(Long id);
    List<Horse> findAllByDeletedAtIsNull();
    List<Horse> findAllByStatusAndDeletedAtIsNull(String status);
    List<Horse> findAllByOwnerEmailAndDeletedAtIsNullOrderByCreatedAtDesc(String ownerEmail);
    Page<Horse> findAllByOwnerEmailAndDeletedAtIsNull(String ownerEmail, Pageable pageable);
    @Query("""
            select horse
            from Horse horse
            where horse.owner.email = :ownerEmail
              and horse.deletedAt is null
              and (CAST(:status AS String) is null or horse.status = :status)
              and (CAST(:gender AS String) is null or horse.gender = :gender)
              and (
                CAST(:query AS String) is null
                or lower(horse.name) like lower(concat('%', :query, '%'))
                or lower(coalesce(horse.breed, '')) like lower(concat('%', :query, '%'))
                or lower(coalesce(horse.registrationCode, '')) like lower(concat('%', :query, '%'))
                or lower(coalesce(horse.color, '')) like lower(concat('%', :query, '%'))
              )
            """)
    Page<Horse> searchOwnerHorses(
            @Param("ownerEmail") String ownerEmail,
            @Param("query") String query,
            @Param("status") String status,
            @Param("gender") String gender,
            Pageable pageable
    );
    Optional<Horse> findByIdAndOwnerEmailAndDeletedAtIsNull(Long id, String ownerEmail);
    Optional<Horse> findByIdAndStatusAndDeletedAtIsNull(Long id, String status);
}
