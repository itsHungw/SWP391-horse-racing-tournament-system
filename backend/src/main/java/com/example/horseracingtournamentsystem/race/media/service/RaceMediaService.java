package com.example.horseracingtournamentsystem.race.media.service;

import com.example.horseracingtournamentsystem.race.entity.Race;
import com.example.horseracingtournamentsystem.race.enums.RaceStatus;
import com.example.horseracingtournamentsystem.race.media.dto.RaceMediaPublicResponse;
import com.example.horseracingtournamentsystem.race.media.dto.RaceMediaRequest;
import com.example.horseracingtournamentsystem.race.media.dto.RaceMediaResponse;
import com.example.horseracingtournamentsystem.race.media.dto.RaceMediaValidateResponse;
import com.example.horseracingtournamentsystem.race.media.entity.RaceMedia;
import com.example.horseracingtournamentsystem.race.media.enums.MediaProviderType;
import com.example.horseracingtournamentsystem.race.media.enums.MediaStatus;
import com.example.horseracingtournamentsystem.race.media.enums.MediaVerificationStatus;
import com.example.horseracingtournamentsystem.race.media.exception.InvalidMediaUrlException;
import com.example.horseracingtournamentsystem.race.media.exception.ProviderUnavailableException;
import com.example.horseracingtournamentsystem.race.media.exception.VideoNotEmbeddableException;
import com.example.horseracingtournamentsystem.race.media.provider.HighlightProvider;
import com.example.horseracingtournamentsystem.race.media.provider.ProviderMeta;
import com.example.horseracingtournamentsystem.race.media.repository.RaceMediaRepository;
import com.example.horseracingtournamentsystem.race.repository.RaceRepository;
import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.user.repository.UserRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class RaceMediaService {

    private static final Set<RaceStatus> OFFICIAL_RESULT_STATUSES = Set.of(RaceStatus.RESULT_CONFIRMED, RaceStatus.PUBLISHED);

    private final RaceRepository raceRepository;
    private final RaceMediaRepository raceMediaRepository;
    private final UserRepository userRepository;
    private final HighlightProvider highlightProvider;

    @Transactional(readOnly = true)
    public Optional<RaceMediaResponse> getOrganizerHighlight(Long raceId, String organizerEmail) {
        Race race = requireOrganizerRace(raceId, organizerEmail, false);
        return raceMediaRepository.findActiveByRaceId(race.getId()).map(media -> toManageResponse(media, race, null));
    }

    @Transactional(readOnly = true)
    public Optional<RaceMediaResponse> getAdminHighlight(Long raceId) {
        Race race = requireRace(raceId);
        return raceMediaRepository.findActiveByRaceId(race.getId()).map(media -> toManageResponse(media, race, null));
    }

    @Transactional(readOnly = true)
    public RaceMediaValidateResponse validateOrganizerHighlight(Long raceId, RaceMediaRequest request, String organizerEmail) {
        requireOrganizerRace(raceId, organizerEmail, false);
        return validate(request.url());
    }

    @Transactional(readOnly = true)
    public RaceMediaValidateResponse validateAdminHighlight(Long raceId, RaceMediaRequest request) {
        requireRace(raceId);
        return validate(request.url());
    }

    @Transactional
    public RaceMediaResponse upsertOrganizerHighlight(Long raceId, RaceMediaRequest request, String organizerEmail) {
        Race race = requireOrganizerRace(raceId, organizerEmail, true);
        User actor = requireUser(organizerEmail);
        return upsertDraft(race, request, actor);
    }

    @Transactional
    public RaceMediaResponse upsertAdminHighlight(Long raceId, RaceMediaRequest request, String adminEmail) {
        Race race = requireRace(raceId);
        User actor = requireUser(adminEmail);
        return upsertDraft(race, request, actor);
    }

    @Transactional
    public RaceMediaResponse publishOrganizerHighlight(Long raceId, String organizerEmail) {
        Race race = requireOrganizerRace(raceId, organizerEmail, true);
        User actor = requireUser(organizerEmail);
        return publish(race, actor);
    }

    @Transactional
    public RaceMediaResponse publishAdminHighlight(Long raceId, String adminEmail) {
        Race race = requireRace(raceId);
        User actor = requireUser(adminEmail);
        return publish(race, actor);
    }

    @Transactional
    public RaceMediaResponse unpublishOrganizerHighlight(Long raceId, String organizerEmail) {
        Race race = requireOrganizerRace(raceId, organizerEmail, true);
        User actor = requireUser(organizerEmail);
        RaceMedia media = requireActiveMedia(race.getId());
        media.unpublish(actor);
        return toManageResponse(media, race, "Highlight unpublished.");
    }

    @Transactional
    public RaceMediaResponse unpublishAdminHighlight(Long raceId, String adminEmail) {
        Race race = requireRace(raceId);
        User actor = requireUser(adminEmail);
        RaceMedia media = requireActiveMedia(race.getId());
        media.unpublish(actor);
        return toManageResponse(media, race, "Highlight unpublished.");
    }

    @Transactional
    public RaceMediaResponse reverifyOrganizerHighlight(Long raceId, String organizerEmail) {
        Race race = requireOrganizerRace(raceId, organizerEmail, true);
        RaceMedia media = requireActiveMedia(race.getId());
        return reverify(media, race);
    }

    @Transactional
    public RaceMediaResponse reverifyAdminHighlight(Long raceId) {
        Race race = requireRace(raceId);
        RaceMedia media = requireActiveMedia(race.getId());
        return reverify(media, race);
    }

    @Transactional
    public void deleteOrganizerHighlight(Long raceId, String organizerEmail) {
        Race race = requireOrganizerRace(raceId, organizerEmail, true);
        User actor = requireUser(organizerEmail);
        requireActiveMedia(race.getId()).softDelete(actor);
    }

    @Transactional
    public void deleteAdminHighlight(Long raceId, String adminEmail) {
        Race race = requireRace(raceId);
        User actor = requireUser(adminEmail);
        requireActiveMedia(race.getId()).softDelete(actor);
    }

    @Transactional(readOnly = true)
    public Optional<RaceMediaPublicResponse> getPublicHighlight(Long raceId) {
        return raceMediaRepository.findPublishedByRaceId(raceId).map(this::toPublicResponse);
    }

    @Transactional(readOnly = true)
    public List<RaceMediaPublicResponse> getPublicHighlightsForTournament(Long tournamentId) {
        return raceMediaRepository.findPublishedByTournamentId(tournamentId)
                .stream()
                .map(this::toPublicResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<RaceMediaPublicResponse> getPublicHighlightsForRaces(List<Long> raceIds) {
        if (raceIds == null || raceIds.isEmpty()) {
            return List.of();
        }
        return raceMediaRepository.findPublishedByRaceIds(raceIds)
                .stream()
                .map(this::toPublicResponse)
                .toList();
    }

    private RaceMediaValidateResponse validate(String url) {
        String videoId = normalizeId(url);
        try {
            ProviderMeta meta = highlightProvider.verify(videoId);
            return new RaceMediaValidateResponse(
                    highlightProvider.type(),
                    videoId,
                    highlightProvider.embedUrl(videoId),
                    meta.title(),
                    meta.thumbnailUrl(),
                    MediaVerificationStatus.VERIFIED,
                    null,
                    "Video is embeddable."
            );
        } catch (VideoNotEmbeddableException exception) {
            return new RaceMediaValidateResponse(
                    highlightProvider.type(),
                    videoId,
                    highlightProvider.embedUrl(videoId),
                    null,
                    null,
                    MediaVerificationStatus.FAILED,
                    exception.errorCode(),
                    exception.getMessage()
            );
        } catch (ProviderUnavailableException exception) {
            return new RaceMediaValidateResponse(
                    highlightProvider.type(),
                    videoId,
                    highlightProvider.embedUrl(videoId),
                    null,
                    null,
                    MediaVerificationStatus.FAILED,
                    exception.errorCode(),
                    exception.getMessage()
            );
        }
    }

    private RaceMediaResponse upsertDraft(Race race, RaceMediaRequest request, User actor) {
        String videoId = normalizeId(request.url());
        RaceMedia media = raceMediaRepository.findActiveByRaceId(race.getId())
                .map(existing -> {
                    existing.changeSource(videoId, request.url(), actor);
                    existing.changeTitle(request.title(), actor);
                    return existing;
                })
                .orElseGet(() -> RaceMedia.create(race, MediaProviderType.YOUTUBE, videoId, request.url(), request.title(), actor));

        String message = "Highlight saved.";
        try {
            ProviderMeta meta = highlightProvider.verify(videoId);
            media.markVerified(meta, LocalDateTime.now());
            message = "Highlight saved and verified.";
        } catch (VideoNotEmbeddableException exception) {
            media.markFailed(exception.errorCode(), LocalDateTime.now());
            message = exception.getMessage();
        } catch (ProviderUnavailableException exception) {
            // Save draft stays off the provider critical path; publish will require a fresh verification.
            media.markFailed(exception.errorCode(), LocalDateTime.now());
            message = exception.getMessage();
        }

        RaceMedia saved = raceMediaRepository.save(media);
        return toManageResponse(saved, race, message);
    }

    private RaceMediaResponse publish(Race race, User actor) {
        RaceMedia media = requireActiveMedia(race.getId());
        if (!OFFICIAL_RESULT_STATUSES.contains(race.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "RESULT_NOT_OFFICIAL");
        }
        try {
            ProviderMeta meta = highlightProvider.verify(media.getProviderVideoId());
            media.markVerified(meta, LocalDateTime.now());
            media.publish(actor);
            return toManageResponse(media, race, "Highlight published.");
        } catch (VideoNotEmbeddableException exception) {
            media.markFailed(exception.errorCode(), LocalDateTime.now());
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, exception.errorCode());
        } catch (ProviderUnavailableException exception) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, exception.errorCode());
        }
    }

    private RaceMediaResponse reverify(RaceMedia media, Race race) {
        try {
            ProviderMeta meta = highlightProvider.verify(media.getProviderVideoId());
            media.markVerified(meta, LocalDateTime.now());
            return toManageResponse(media, race, "Highlight verified.");
        } catch (VideoNotEmbeddableException exception) {
            media.markFailed(exception.errorCode(), LocalDateTime.now());
            return toManageResponse(media, race, exception.getMessage());
        } catch (ProviderUnavailableException exception) {
            media.markFailed(exception.errorCode(), LocalDateTime.now());
            return toManageResponse(media, race, exception.getMessage());
        }
    }

    private String normalizeId(String url) {
        try {
            return highlightProvider.normalizeId(url);
        } catch (InvalidMediaUrlException exception) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, exception.getMessage());
        }
    }

    private Race requireRace(Long raceId) {
        return raceRepository.findByIdAndDeletedAtIsNull(raceId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Race not found"));
    }

    private Race requireOrganizerRace(Long raceId, String organizerEmail, boolean mutating) {
        Race race = requireRace(raceId);
        if (!race.getTournament().isManagedBy(organizerEmail)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not manage this race");
        }
        if (mutating) {
            race.getTournament().assertOrganizationOperational();
        }
        return race;
    }

    private RaceMedia requireActiveMedia(Long raceId) {
        return raceMediaRepository.findActiveByRaceId(raceId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Race highlight not found"));
    }

    private User requireUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private RaceMediaResponse toManageResponse(RaceMedia media, Race race, String message) {
        boolean official = OFFICIAL_RESULT_STATUSES.contains(race.getStatus());
        boolean canPublish = media.getStatus() == MediaStatus.DRAFT
                && media.getVerificationStatus() == MediaVerificationStatus.VERIFIED
                && official;
        return new RaceMediaResponse(
                media.getId(),
                race.getId(),
                media.getProvider(),
                media.getProviderVideoId(),
                media.getSourceUrl(),
                highlightProvider.embedUrl(media.getProviderVideoId()),
                media.getTitle(),
                media.getProviderTitle(),
                media.getThumbnailUrl(),
                media.getStatus(),
                media.getVerificationStatus(),
                media.getProviderErrorCode(),
                message,
                canPublish,
                publishBlockedReason(media, official),
                media.getLastVerifiedAt(),
                media.getPublishedAt(),
                media.getPublishedBy() == null ? null : media.getPublishedBy().getFullName(),
                media.getCreatedAt(),
                media.getUpdatedAt()
        );
    }

    private String publishBlockedReason(RaceMedia media, boolean official) {
        if (media.getStatus() == MediaStatus.PUBLISHED) {
            return "ALREADY_PUBLISHED";
        }
        if (!official) {
            return "RESULT_NOT_OFFICIAL";
        }
        if (media.getVerificationStatus() != MediaVerificationStatus.VERIFIED) {
            return "VIDEO_NOT_VERIFIED";
        }
        return null;
    }

    private RaceMediaPublicResponse toPublicResponse(RaceMedia media) {
        return new RaceMediaPublicResponse(
                media.getRace().getId(),
                media.getProvider(),
                media.getProviderVideoId(),
                highlightProvider.embedUrl(media.getProviderVideoId()),
                media.getTitle(),
                media.getProviderTitle(),
                media.getThumbnailUrl(),
                media.getPublishedAt()
        );
    }
}
