package com.example.horseracingtournamentsystem.tournament.repository;

import com.example.horseracingtournamentsystem.tournament.entity.Tournament;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface TournamentRepository extends JpaRepository<Tournament, Long> {
    Optional<Tournament> findByIdAndDeletedAtIsNull(Long id);
    List<Tournament> findAllByDeletedAtIsNull();
    List<Tournament> findAllByStatusInAndDeletedAtIsNull(List<String> statuses);
    long countByStatusInAndDeletedAtIsNull(List<String> statuses);
    boolean existsByCodeAndDeletedAtIsNull(String code);
    boolean existsByCodeAndIdNotAndDeletedAtIsNull(String code, Long id);
}
