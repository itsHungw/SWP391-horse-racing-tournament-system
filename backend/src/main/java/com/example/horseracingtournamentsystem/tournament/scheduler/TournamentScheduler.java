package com.example.horseracingtournamentsystem.tournament.scheduler;

import com.example.horseracingtournamentsystem.tournament.entity.Tournament;
import com.example.horseracingtournamentsystem.tournament.repository.TournamentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class TournamentScheduler {

    private final TournamentRepository tournamentRepository;

    @Scheduled(fixedRate = 60000) // Run every 60 seconds
    @Transactional
    public void checkTournamentStatusTransitions() {
        log.debug("Scanning active tournaments for status auto-transitions...");
        LocalDateTime now = LocalDateTime.now();
        LocalDate today = LocalDate.now();

        List<Tournament> activeTournaments = tournamentRepository.findAllByStatusInAndDeletedAtIsNull(
                List.of("OPEN_REGISTRATION", "SCHEDULE_PUBLISHED", "ONGOING")
        );

        for (Tournament t : activeTournaments) {
            try {
                if ("OPEN_REGISTRATION".equals(t.getStatus())) {
                    if (now.isAfter(t.getRegistrationEndAt()) || now.isEqual(t.getRegistrationEndAt())) {
                        t.closeRegistration();
                        tournamentRepository.save(t);
                        log.info("Auto-transitioned Tournament ID {} from OPEN_REGISTRATION to CLOSED_REGISTRATION", t.getId());
                    }
                } else if ("SCHEDULE_PUBLISHED".equals(t.getStatus())) {
                    if (today.isAfter(t.getStartDate()) || today.isEqual(t.getStartDate())) {
                        t.startOngoing();
                        tournamentRepository.save(t);
                        log.info("Auto-transitioned Tournament ID {} from SCHEDULE_PUBLISHED to ONGOING", t.getId());
                    }
                } else if ("ONGOING".equals(t.getStatus())) {
                    if (today.isAfter(t.getEndDate())) {
                        t.completeTournament();
                        tournamentRepository.save(t);
                        log.info("Auto-transitioned Tournament ID {} from ONGOING to COMPLETED", t.getId());
                    }
                }
            } catch (Exception e) {
                log.error("Failed to auto-transition status for Tournament ID {}: {}", t.getId(), e.getMessage());
            }
        }
    }
}
