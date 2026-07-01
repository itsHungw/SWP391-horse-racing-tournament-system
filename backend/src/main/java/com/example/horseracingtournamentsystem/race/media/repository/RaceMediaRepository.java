package com.example.horseracingtournamentsystem.race.media.repository;

import com.example.horseracingtournamentsystem.race.media.entity.RaceMedia;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RaceMediaRepository extends JpaRepository<RaceMedia, Long> {

    @Query("""
            SELECT media FROM RaceMedia media
            JOIN FETCH media.race race
            WHERE race.id = :raceId
              AND media.mediaType = com.example.horseracingtournamentsystem.race.media.enums.MediaType.HIGHLIGHT
              AND media.deletedAt IS NULL
            """)
    Optional<RaceMedia> findActiveByRaceId(@Param("raceId") Long raceId);

    // Bản generic theo loại media (dùng cho cả highlight lẫn live). One-per-type nhờ partial unique index.
    @Query("""
            SELECT media FROM RaceMedia media
            JOIN FETCH media.race race
            WHERE race.id = :raceId
              AND media.mediaType = :mediaType
              AND media.deletedAt IS NULL
            """)
    Optional<RaceMedia> findActiveByRaceIdAndType(
            @Param("raceId") Long raceId,
            @Param("mediaType") com.example.horseracingtournamentsystem.race.media.enums.MediaType mediaType);

    // Public: chỉ trả bản PUBLISHED + VERIFIED của một loại media (không lộ draft/chưa verify).
    @Query("""
            SELECT media FROM RaceMedia media
            JOIN FETCH media.race race
            WHERE race.id = :raceId
              AND media.mediaType = :mediaType
              AND media.status = com.example.horseracingtournamentsystem.race.media.enums.MediaStatus.PUBLISHED
              AND media.verificationStatus = com.example.horseracingtournamentsystem.race.media.enums.MediaVerificationStatus.VERIFIED
              AND media.deletedAt IS NULL
            """)
    Optional<RaceMedia> findPublishedByRaceIdAndType(
            @Param("raceId") Long raceId,
            @Param("mediaType") com.example.horseracingtournamentsystem.race.media.enums.MediaType mediaType);

    @Query("""
            SELECT media FROM RaceMedia media
            JOIN FETCH media.race race
            WHERE race.id = :raceId
              AND media.mediaType = com.example.horseracingtournamentsystem.race.media.enums.MediaType.HIGHLIGHT
              AND media.status = com.example.horseracingtournamentsystem.race.media.enums.MediaStatus.PUBLISHED
              AND media.verificationStatus = com.example.horseracingtournamentsystem.race.media.enums.MediaVerificationStatus.VERIFIED
              AND media.deletedAt IS NULL
            """)
    Optional<RaceMedia> findPublishedByRaceId(@Param("raceId") Long raceId);

    @Query("""
            SELECT media FROM RaceMedia media
            JOIN FETCH media.race race
            WHERE race.id IN :raceIds
              AND media.mediaType = com.example.horseracingtournamentsystem.race.media.enums.MediaType.HIGHLIGHT
              AND media.status = com.example.horseracingtournamentsystem.race.media.enums.MediaStatus.PUBLISHED
              AND media.verificationStatus = com.example.horseracingtournamentsystem.race.media.enums.MediaVerificationStatus.VERIFIED
              AND media.deletedAt IS NULL
            """)
    List<RaceMedia> findPublishedByRaceIds(@Param("raceIds") Collection<Long> raceIds);

    @Query("""
            SELECT media FROM RaceMedia media
            JOIN FETCH media.race race
            WHERE race.tournament.id = :tournamentId
              AND media.mediaType = com.example.horseracingtournamentsystem.race.media.enums.MediaType.HIGHLIGHT
              AND media.status = com.example.horseracingtournamentsystem.race.media.enums.MediaStatus.PUBLISHED
              AND media.verificationStatus = com.example.horseracingtournamentsystem.race.media.enums.MediaVerificationStatus.VERIFIED
              AND media.deletedAt IS NULL
            ORDER BY race.raceAt DESC
            """)
    List<RaceMedia> findPublishedByTournamentId(@Param("tournamentId") Long tournamentId);
}
