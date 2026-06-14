package com.example.horseracingtournamentsystem.tournament.repository;

import com.example.horseracingtournamentsystem.tournament.entity.Tournament;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;
import java.time.LocalDate;

public interface TournamentRepository extends JpaRepository<Tournament, Long> {
    Optional<Tournament> findByIdAndDeletedAtIsNull(Long id);
    List<Tournament> findAllByDeletedAtIsNull();
    List<Tournament> findAllByStatusInAndDeletedAtIsNull(List<String> statuses);
    long countByStatusInAndDeletedAtIsNull(List<String> statuses);
    boolean existsByCodeAndDeletedAtIsNull(String code);
    boolean existsByCodeAndIdNotAndDeletedAtIsNull(String code, Long id);

    @Query(
            value = """
                    SELECT t FROM Tournament t
                    WHERE t.deletedAt IS NULL
                      AND t.status IN :publicStatuses
                      AND (:search = '' OR LOWER(t.name) LIKE LOWER(CONCAT('%', :search, '%'))
                           OR LOWER(t.code) LIKE LOWER(CONCAT('%', :search, '%'))
                           OR LOWER(t.location) LIKE LOWER(CONCAT('%', :search, '%')))
                      AND (:status = '' OR t.status = :status)
                      AND (:year IS NULL OR YEAR(t.startDate) = :year)
                    ORDER BY
                      CASE WHEN :sortBy = 'ONGOING_FIRST' AND t.status = 'ONGOING' THEN 0 ELSE 1 END,
                      CASE WHEN :sortBy = 'REGISTRATION_CLOSING_SOON' THEN t.registrationEndAt END ASC,
                      CASE WHEN :sortBy = 'LATEST' THEN t.startDate END DESC,
                      t.id DESC
                    """,
            countQuery = """
                    SELECT COUNT(t) FROM Tournament t
                    WHERE t.deletedAt IS NULL
                      AND t.status IN :publicStatuses
                      AND (:search = '' OR LOWER(t.name) LIKE LOWER(CONCAT('%', :search, '%'))
                           OR LOWER(t.code) LIKE LOWER(CONCAT('%', :search, '%'))
                           OR LOWER(t.location) LIKE LOWER(CONCAT('%', :search, '%')))
                      AND (:status = '' OR t.status = :status)
                      AND (:year IS NULL OR YEAR(t.startDate) = :year)
                    """
    )
    Page<Tournament> searchPublic(
            String search,
            String status,
            Integer year,
            String sortBy,
            List<String> publicStatuses,
            Pageable pageable
    );

    @Query("SELECT MAX(t.endDate) FROM Tournament t WHERE t.deletedAt IS NULL AND t.status IN :publicStatuses")
    LocalDate findPublicSeasonFinale(List<String> publicStatuses);
}
