package com.example.horseracingtournamentsystem.race.media.service;

import com.example.horseracingtournamentsystem.race.entity.Race;
import com.example.horseracingtournamentsystem.race.media.dto.RaceMediaPublicResponse;
import com.example.horseracingtournamentsystem.race.media.dto.RaceMediaRequest;
import com.example.horseracingtournamentsystem.race.media.dto.RaceMediaResponse;
import com.example.horseracingtournamentsystem.race.media.dto.RaceMediaValidateResponse;
import com.example.horseracingtournamentsystem.race.media.entity.RaceMedia;
import com.example.horseracingtournamentsystem.race.media.enums.MediaBlockedReason;
import com.example.horseracingtournamentsystem.race.media.enums.MediaProviderType;
import com.example.horseracingtournamentsystem.race.media.enums.MediaStatus;
import com.example.horseracingtournamentsystem.race.media.enums.MediaType;
import com.example.horseracingtournamentsystem.race.media.enums.MediaVerificationStatus;
import com.example.horseracingtournamentsystem.race.media.exception.InvalidMediaUrlException;
import com.example.horseracingtournamentsystem.race.media.exception.ProviderUnavailableException;
import com.example.horseracingtournamentsystem.race.media.exception.VideoNotEmbeddableException;
import com.example.horseracingtournamentsystem.race.media.policy.MediaPolicyRegistry;
import com.example.horseracingtournamentsystem.race.media.policy.MediaTypePolicy;
import com.example.horseracingtournamentsystem.race.media.provider.HighlightProvider;
import com.example.horseracingtournamentsystem.race.media.provider.ProviderMeta;
import com.example.horseracingtournamentsystem.race.media.repository.RaceMediaRepository;
import com.example.horseracingtournamentsystem.race.repository.RaceRepository;
import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.user.repository.UserRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Service dùng chung cho mọi loại media của race (HIGHLIGHT, LIVE_STREAM, ...).
 *
 * <p>Lõi CRUD/publish là generic theo {@link MediaType}; các method public đặt tên theo nghiệp vụ
 * (highlight/live) chỉ là wrapper mỏng truyền đúng loại xuống lõi -> không nhân đôi logic.</p>
 *
 * <p>Luật khác nhau giữa các loại (cổng publish) sống trong {@link MediaTypePolicy} và được tra qua
 * {@link MediaPolicyRegistry} -> service KHÔNG rẽ nhánh {@code if (type == ...)}.</p>
 */
@Service
@RequiredArgsConstructor
public class RaceMediaService {

    private final RaceRepository raceRepository;
    private final RaceMediaRepository raceMediaRepository;
    private final UserRepository userRepository;
    private final HighlightProvider highlightProvider; // provider YouTube, phục vụ cả highlight lẫn live
    private final MediaPolicyRegistry policyRegistry;

    // ===================================================================================
    // Highlight — wrapper public, giữ nguyên chữ ký cũ (controller + test phụ thuộc), truyền HIGHLIGHT
    // ===================================================================================

    @Transactional(readOnly = true)
    public Optional<RaceMediaResponse> getOrganizerHighlight(Long raceId, String organizerEmail) {
        Race race = requireOrganizerRace(raceId, organizerEmail, false);
        return getManage(race, MediaType.HIGHLIGHT);
    }

    @Transactional(readOnly = true)
    public Optional<RaceMediaResponse> getAdminHighlight(Long raceId) {
        Race race = requireRace(raceId);
        return getManage(race, MediaType.HIGHLIGHT);
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
        return upsertDraft(race, MediaType.HIGHLIGHT, request, actor);
    }

    @Transactional
    public RaceMediaResponse upsertAdminHighlight(Long raceId, RaceMediaRequest request, String adminEmail) {
        Race race = requireRace(raceId);
        User actor = requireUser(adminEmail);
        return upsertDraft(race, MediaType.HIGHLIGHT, request, actor);
    }

    @Transactional
    public RaceMediaResponse publishOrganizerHighlight(Long raceId, String organizerEmail) {
        Race race = requireOrganizerRace(raceId, organizerEmail, true);
        User actor = requireUser(organizerEmail);
        return publish(race, MediaType.HIGHLIGHT, actor);
    }

    @Transactional
    public RaceMediaResponse publishAdminHighlight(Long raceId, String adminEmail) {
        Race race = requireRace(raceId);
        User actor = requireUser(adminEmail);
        return publish(race, MediaType.HIGHLIGHT, actor);
    }

    @Transactional
    public RaceMediaResponse unpublishOrganizerHighlight(Long raceId, String organizerEmail) {
        Race race = requireOrganizerRace(raceId, organizerEmail, true);
        User actor = requireUser(organizerEmail);
        return unpublish(race, MediaType.HIGHLIGHT, actor);
    }

    @Transactional
    public RaceMediaResponse unpublishAdminHighlight(Long raceId, String adminEmail) {
        Race race = requireRace(raceId);
        User actor = requireUser(adminEmail);
        return unpublish(race, MediaType.HIGHLIGHT, actor);
    }

    @Transactional
    public RaceMediaResponse reverifyOrganizerHighlight(Long raceId, String organizerEmail) {
        Race race = requireOrganizerRace(raceId, organizerEmail, true);
        return reverify(race, MediaType.HIGHLIGHT);
    }

    @Transactional
    public RaceMediaResponse reverifyAdminHighlight(Long raceId) {
        Race race = requireRace(raceId);
        return reverify(race, MediaType.HIGHLIGHT);
    }

    @Transactional
    public void deleteOrganizerHighlight(Long raceId, String organizerEmail) {
        Race race = requireOrganizerRace(raceId, organizerEmail, true);
        User actor = requireUser(organizerEmail);
        delete(race, MediaType.HIGHLIGHT, actor);
    }

    @Transactional
    public void deleteAdminHighlight(Long raceId, String adminEmail) {
        Race race = requireRace(raceId);
        User actor = requireUser(adminEmail);
        delete(race, MediaType.HIGHLIGHT, actor);
    }

    @Transactional(readOnly = true)
    public Optional<RaceMediaPublicResponse> getPublicHighlight(Long raceId) {
        return getPublic(raceId, MediaType.HIGHLIGHT);
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

    // ===================================================================================
    // Live stream — wrapper public, giống hệt highlight nhưng truyền MediaType.LIVE_STREAM.
    // (Luật khác nhau nằm ở LiveStreamPolicy: publish KHÔNG cần race official.)
    // ===================================================================================

    @Transactional(readOnly = true)
    public Optional<RaceMediaResponse> getOrganizerLiveStream(Long raceId, String organizerEmail) {
        Race race = requireOrganizerRace(raceId, organizerEmail, false);
        return getManage(race, MediaType.LIVE_STREAM);
    }

    @Transactional(readOnly = true)
    public Optional<RaceMediaResponse> getAdminLiveStream(Long raceId) {
        return getManage(requireRace(raceId), MediaType.LIVE_STREAM);
    }

    @Transactional(readOnly = true)
    public RaceMediaValidateResponse validateOrganizerLiveStream(Long raceId, RaceMediaRequest request, String organizerEmail) {
        requireOrganizerRace(raceId, organizerEmail, false);
        return validate(request.url());
    }

    @Transactional(readOnly = true)
    public RaceMediaValidateResponse validateAdminLiveStream(Long raceId, RaceMediaRequest request) {
        requireRace(raceId);
        return validate(request.url());
    }

    @Transactional
    public RaceMediaResponse upsertOrganizerLiveStream(Long raceId, RaceMediaRequest request, String organizerEmail) {
        Race race = requireOrganizerRace(raceId, organizerEmail, true);
        return upsertDraft(race, MediaType.LIVE_STREAM, request, requireUser(organizerEmail));
    }

    @Transactional
    public RaceMediaResponse upsertAdminLiveStream(Long raceId, RaceMediaRequest request, String adminEmail) {
        Race race = requireRace(raceId);
        return upsertDraft(race, MediaType.LIVE_STREAM, request, requireUser(adminEmail));
    }

    @Transactional
    public RaceMediaResponse publishOrganizerLiveStream(Long raceId, String organizerEmail) {
        Race race = requireOrganizerRace(raceId, organizerEmail, true);
        return publish(race, MediaType.LIVE_STREAM, requireUser(organizerEmail));
    }

    @Transactional
    public RaceMediaResponse publishAdminLiveStream(Long raceId, String adminEmail) {
        Race race = requireRace(raceId);
        return publish(race, MediaType.LIVE_STREAM, requireUser(adminEmail));
    }

    @Transactional
    public RaceMediaResponse unpublishOrganizerLiveStream(Long raceId, String organizerEmail) {
        Race race = requireOrganizerRace(raceId, organizerEmail, true);
        return unpublish(race, MediaType.LIVE_STREAM, requireUser(organizerEmail));
    }

    @Transactional
    public RaceMediaResponse unpublishAdminLiveStream(Long raceId, String adminEmail) {
        Race race = requireRace(raceId);
        return unpublish(race, MediaType.LIVE_STREAM, requireUser(adminEmail));
    }

    @Transactional
    public RaceMediaResponse reverifyOrganizerLiveStream(Long raceId, String organizerEmail) {
        Race race = requireOrganizerRace(raceId, organizerEmail, true);
        return reverify(race, MediaType.LIVE_STREAM);
    }

    @Transactional
    public RaceMediaResponse reverifyAdminLiveStream(Long raceId) {
        return reverify(requireRace(raceId), MediaType.LIVE_STREAM);
    }

    @Transactional
    public void deleteOrganizerLiveStream(Long raceId, String organizerEmail) {
        Race race = requireOrganizerRace(raceId, organizerEmail, true);
        delete(race, MediaType.LIVE_STREAM, requireUser(organizerEmail));
    }

    @Transactional
    public void deleteAdminLiveStream(Long raceId, String adminEmail) {
        Race race = requireRace(raceId);
        delete(race, MediaType.LIVE_STREAM, requireUser(adminEmail));
    }

    @Transactional(readOnly = true)
    public Optional<RaceMediaPublicResponse> getPublicLiveStream(Long raceId) {
        // FE gate hiển thị theo race.status == ONGOING; endpoint chỉ trả bản published+verified.
        return getPublic(raceId, MediaType.LIVE_STREAM);
    }

    // ===================================================================================
    // Lõi generic theo MediaType
    // ===================================================================================

    private Optional<RaceMediaResponse> getManage(Race race, MediaType type) {
        return raceMediaRepository.findActiveByRaceIdAndType(race.getId(), type)
                .map(media -> toManageResponse(media, race, null));
    }

    private RaceMediaValidateResponse validate(String url) {
        // Validate KHÔNG lưu gì: chuẩn hoá id + best-effort oEmbed để FE preview trước khi save.
        String videoId = normalizeId(url);
        try {
            ProviderMeta meta = highlightProvider.verify(videoId);
            return new RaceMediaValidateResponse(
                    highlightProvider.type(), videoId, highlightProvider.embedUrl(videoId),
                    meta.title(), meta.thumbnailUrl(),
                    MediaVerificationStatus.VERIFIED, null, "Video is embeddable.");
        } catch (VideoNotEmbeddableException exception) {
            return new RaceMediaValidateResponse(
                    highlightProvider.type(), videoId, highlightProvider.embedUrl(videoId),
                    null, null, MediaVerificationStatus.FAILED, exception.errorCode(), exception.getMessage());
        } catch (ProviderUnavailableException exception) {
            return new RaceMediaValidateResponse(
                    highlightProvider.type(), videoId, highlightProvider.embedUrl(videoId),
                    null, null, MediaVerificationStatus.FAILED, exception.errorCode(), exception.getMessage());
        }
    }

    private RaceMediaResponse upsertDraft(Race race, MediaType type, RaceMediaRequest request, User actor) {
        // Chuẩn hoá id (offline) TRƯỚC -> url rác thì 422, không tạo/sửa gì.
        String videoId = normalizeId(request.url());
        RaceMedia media = raceMediaRepository.findActiveByRaceIdAndType(race.getId(), type)
                .map(existing -> {
                    existing.changeSource(videoId, request.url(), actor);
                    existing.changeTitle(request.title(), actor);
                    return existing;
                })
                .orElseGet(() -> RaceMedia.create(race, type, MediaProviderType.YOUTUBE, videoId, request.url(), request.title(), actor));

        // Verify (network) là best-effort: KHÔNG bao giờ chặn việc lưu draft. Fail -> đánh dấu, publish sẽ verify lại.
        String message = "Media saved.";
        try {
            ProviderMeta meta = highlightProvider.verify(videoId);
            media.markVerified(meta, LocalDateTime.now());
            message = "Media saved and verified.";
        } catch (VideoNotEmbeddableException exception) {
            media.markFailed(exception.errorCode(), LocalDateTime.now());
            message = exception.getMessage();
        } catch (ProviderUnavailableException exception) {
            media.markFailed(exception.errorCode(), LocalDateTime.now());
            message = exception.getMessage();
        }
        return toManageResponse(raceMediaRepository.save(media), race, message);
    }

    private RaceMediaResponse publish(Race race, MediaType type, User actor) {
        RaceMedia media = requireActiveMedia(race.getId(), type);
        MediaTypePolicy policy = policyRegistry.policyFor(type);
        // Cổng race-status theo loại, kiểm TRƯỚC verify để fail nhanh (khỏi gọi mạng nếu chưa đủ điều kiện).
        // Highlight: race phải official -> 409. Live: luôn qua (cấu hình trước race).
        if (!policy.isRaceStatePublishable(race)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, policy.raceStateBlockedReason().name());
        }
        // Verify lại (network) để chốt embeddable ngay lúc publish; fail thì KHÔNG publish.
        try {
            ProviderMeta meta = highlightProvider.verify(media.getProviderVideoId());
            media.markVerified(meta, LocalDateTime.now());
            media.publish(actor);
            return toManageResponse(media, race, "Media published.");
        } catch (VideoNotEmbeddableException exception) {
            media.markFailed(exception.errorCode(), LocalDateTime.now());
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, exception.errorCode());
        } catch (ProviderUnavailableException exception) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, exception.errorCode());
        }
    }

    private RaceMediaResponse unpublish(Race race, MediaType type, User actor) {
        RaceMedia media = requireActiveMedia(race.getId(), type);
        media.unpublish(actor);
        return toManageResponse(media, race, "Media unpublished.");
    }

    private RaceMediaResponse reverify(Race race, MediaType type) {
        RaceMedia media = requireActiveMedia(race.getId(), type);
        // Chạy lại oEmbed cho một draft đang FAILED/UNVERIFIED (vd stream vừa public) — không đổi status DRAFT/PUBLISHED.
        try {
            ProviderMeta meta = highlightProvider.verify(media.getProviderVideoId());
            media.markVerified(meta, LocalDateTime.now());
            return toManageResponse(media, race, "Media verified.");
        } catch (VideoNotEmbeddableException exception) {
            media.markFailed(exception.errorCode(), LocalDateTime.now());
            return toManageResponse(media, race, exception.getMessage());
        } catch (ProviderUnavailableException exception) {
            media.markFailed(exception.errorCode(), LocalDateTime.now());
            return toManageResponse(media, race, exception.getMessage());
        }
    }

    private void delete(Race race, MediaType type, User actor) {
        requireActiveMedia(race.getId(), type).softDelete(actor);
    }

    private Optional<RaceMediaPublicResponse> getPublic(Long raceId, MediaType type) {
        return raceMediaRepository.findPublishedByRaceIdAndType(raceId, type).map(this::toPublicResponse);
    }

    // ===================================================================================
    // Helpers
    // ===================================================================================

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

    private RaceMedia requireActiveMedia(Long raceId, MediaType type) {
        return raceMediaRepository.findActiveByRaceIdAndType(raceId, type)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Race media not found"));
    }

    private User requireUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private RaceMediaResponse toManageResponse(RaceMedia media, Race race, String message) {
        MediaTypePolicy policy = policyRegistry.policyFor(media.getMediaType());
        boolean raceStateOk = policy.isRaceStatePublishable(race);
        boolean canPublish = media.getStatus() == MediaStatus.DRAFT
                && media.getVerificationStatus() == MediaVerificationStatus.VERIFIED
                && raceStateOk;
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
                publishBlockedReason(media, policy, raceStateOk),
                media.getLastVerifiedAt(),
                media.getPublishedAt(),
                media.getPublishedBy() == null ? null : media.getPublishedBy().getFullName(),
                media.getCreatedAt(),
                media.getUpdatedAt());
    }

    private String publishBlockedReason(RaceMedia media, MediaTypePolicy policy, boolean raceStateOk) {
        if (media.getStatus() == MediaStatus.PUBLISHED) {
            return MediaBlockedReason.ALREADY_PUBLISHED.name();
        }
        if (!raceStateOk) {
            // raceStateOk=false chỉ xảy ra với loại có gate (highlight) -> raceStateBlockedReason() không null.
            return policy.raceStateBlockedReason().name();
        }
        if (media.getVerificationStatus() != MediaVerificationStatus.VERIFIED) {
            return MediaBlockedReason.VIDEO_NOT_VERIFIED.name();
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
                media.getPublishedAt());
    }
}
