package com.example.horseracingtournamentsystem.tournament.repository;

import com.example.horseracingtournamentsystem.tournament.entity.Tournament;
import com.example.horseracingtournamentsystem.tournament.enums.TournamentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.time.LocalDate;

public interface TournamentRepository extends JpaRepository<Tournament, Long> {
    Optional<Tournament> findByIdAndDeletedAtIsNull(Long id);
    List<Tournament> findAllByDeletedAtIsNull();
    List<Tournament> findAllByStatusInAndDeletedAtIsNull(Collection<TournamentStatus> statuses);
    long countByStatusInAndDeletedAtIsNull(Collection<TournamentStatus> statuses);
    boolean existsByCodeAndDeletedAtIsNull(String code);
    boolean existsByCodeAndIdNotAndDeletedAtIsNull(String code, Long id);
    List<Tournament> findAllByOrganization_Owner_EmailAndDeletedAtIsNullOrderByCreatedAtDesc(String ownerEmail);

    @Query(
            value = """
                    SELECT t FROM Tournament t
                    WHERE t.deletedAt IS NULL
                      AND t.status IN :publicStatuses
                      AND (:search = '' OR LOWER(t.name) LIKE LOWER(CONCAT('%', :search, '%'))
                           OR LOWER(t.code) LIKE LOWER(CONCAT('%', :search, '%'))
                           OR LOWER(t.location) LIKE LOWER(CONCAT('%', :search, '%')))
                      AND (:status IS NULL OR t.status = :status)
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
                      AND (:status IS NULL OR t.status = :status)
                      AND (:year IS NULL OR YEAR(t.startDate) = :year)
                    """
    )
    Page<Tournament> searchPublic(
            String search,
            @Param("status") TournamentStatus status,
            Integer year,
            String sortBy,
            List<TournamentStatus> publicStatuses,
            Pageable pageable
    );

    @Query("SELECT MAX(t.endDate) FROM Tournament t WHERE t.deletedAt IS NULL AND t.status IN :publicStatuses")
    LocalDate findPublicSeasonFinale(List<TournamentStatus> publicStatuses);
}
