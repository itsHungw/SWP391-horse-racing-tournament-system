package com.example.horseracingtournamentsystem.tournamentregistration.repository;

import com.example.horseracingtournamentsystem.tournamentregistration.entity.TournamentRegistration;
import com.example.horseracingtournamentsystem.tournamentregistration.enums.RegistrationStatus;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TournamentRegistrationRepository extends JpaRepository<TournamentRegistration, Long> {

    List<TournamentRegistration> findAllByOwnerEmailOrderByCreatedAtDesc(String ownerEmail);

    Page<TournamentRegistration> findAllByOwnerEmail(String ownerEmail, Pageable pageable);

    Page<TournamentRegistration> findAllByOwnerEmailAndHorseId(String ownerEmail, Long horseId, Pageable pageable);

    List<TournamentRegistration> findAllByStatusOrderByCreatedAtDesc(RegistrationStatus status);

    List<TournamentRegistration> findAllByOrderByCreatedAtDesc();

    List<TournamentRegistration> findAllByTournament_IdOrderByCreatedAtDesc(Long tournamentId);

    List<TournamentRegistration> findAllByTournament_IdAndStatusOrderByCreatedAtDesc(Long tournamentId, String status);

    Optional<TournamentRegistration> findByIdAndOwnerEmail(Long id, String ownerEmail);

    Optional<TournamentRegistration> findByIdAndOwnerEmailAndHorseId(Long id, String ownerEmail, Long horseId);

    @Query("""
            select count(registration)
            from TournamentRegistration registration
            where registration.owner.email = :ownerEmail
              and (:horseId is null or registration.horse.id = :horseId)
              and (
                registration.createdAt > :createdAt
                or (registration.createdAt = :createdAt and registration.id > :id)
              )
            """)
    long countOwnerRegistrationsBeforeFocus(
            @Param("ownerEmail") String ownerEmail,
            @Param("horseId") Long horseId,
            @Param("createdAt") java.time.LocalDateTime createdAt,
            @Param("id") Long id
    );

    boolean existsByTournament_IdAndHorse_IdAndStatusIn(
            Long tournamentId,
            Long horseId,
            Collection<RegistrationStatus> statuses
    );

    Optional<TournamentRegistration> findByTournament_IdAndHorse_IdAndStatusIn(Long tournamentId, Long horseId,
            Collection<RegistrationStatus> statuses);

    long countByTournament_IdAndStatus(Long tournamentId, RegistrationStatus status);

    long countByTournament_IdAndOwner_IdAndStatusIn(
            Long tournamentId,
            Long ownerId,
            Collection<RegistrationStatus> statuses
    );
}
