package com.example.horseracingtournamentsystem.race.media.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.example.horseracingtournamentsystem.organization.entity.Organization;
import com.example.horseracingtournamentsystem.race.entity.Race;
import com.example.horseracingtournamentsystem.race.enums.RaceStatus;
import com.example.horseracingtournamentsystem.race.media.dto.RaceMediaRequest;
import com.example.horseracingtournamentsystem.race.media.dto.RaceMediaResponse;
import com.example.horseracingtournamentsystem.race.media.entity.RaceMedia;
import com.example.horseracingtournamentsystem.race.media.enums.MediaProviderType;
import com.example.horseracingtournamentsystem.race.media.enums.MediaStatus;
import com.example.horseracingtournamentsystem.race.media.enums.MediaType;
import com.example.horseracingtournamentsystem.race.media.enums.MediaVerificationStatus;
import com.example.horseracingtournamentsystem.race.media.exception.ProviderUnavailableException;
import com.example.horseracingtournamentsystem.race.media.exception.VideoNotEmbeddableException;
import com.example.horseracingtournamentsystem.race.media.policy.HighlightPolicy;
import com.example.horseracingtournamentsystem.race.media.policy.LiveStreamPolicy;
import com.example.horseracingtournamentsystem.race.media.policy.MediaPolicyRegistry;
import com.example.horseracingtournamentsystem.race.media.provider.HighlightProvider;
import com.example.horseracingtournamentsystem.race.media.provider.ProviderMeta;
import com.example.horseracingtournamentsystem.race.media.repository.RaceMediaRepository;
import com.example.horseracingtournamentsystem.race.repository.RaceRepository;
import com.example.horseracingtournamentsystem.tournament.entity.Tournament;
import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.user.repository.UserRepository;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class RaceMediaServiceTest {

    @Mock
    private RaceRepository raceRepository;

    @Mock
    private RaceMediaRepository raceMediaRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private HighlightProvider highlightProvider;

    private RaceMediaService service;
    private User organizer;
    private Race race;

    @BeforeEach
    void setUp() {
        // Policy là POJO thuần -> dùng thật trong unit test (không cần mock), đúng tinh thần Strategy testable.
        service = new RaceMediaService(raceRepository, raceMediaRepository, userRepository, highlightProvider,
                new MediaPolicyRegistry(List.of(new HighlightPolicy(), new LiveStreamPolicy())));
        organizer = User.pending("Organizer", "organizer@example.com", "hash");
        organizer.verifyEmail();
        Organization organization = Organization.application(
                organizer,
                "ORG",
                "Organizer Club",
                "LIC",
                "ops@example.com",
                "0900000000",
                "Season operator",
                "evidence.pdf",
                null,
                "Ready"
        );
        organization.approve(organizer);
        Tournament tournament = Tournament.create(
                "Main Cup",
                "MAIN_CUP",
                "Season",
                "Belmont",
                LocalDate.now(),
                LocalDate.now().plusDays(2),
                LocalDateTime.now(),
                LocalDateTime.now().plusDays(1),
                20,
                organizer
        );
        tournament.assignOrganization(organization);
        race = Race.create(tournament, "Final", "FINAL", LocalDateTime.now().minusHours(2), 1200, 12, organizer);
        ReflectionTestUtils.setField(race, "id", 1L);
        race.updateStatus(RaceStatus.RESULT_CONFIRMED);
    }

    @Test
    void saveDraftPersistsEvenWhenProviderIsUnavailable() {
        when(raceRepository.findByIdAndDeletedAtIsNull(1L)).thenReturn(Optional.of(race));
        when(userRepository.findByEmail("organizer@example.com")).thenReturn(Optional.of(organizer));
        when(raceMediaRepository.findActiveByRaceIdAndType(1L, MediaType.HIGHLIGHT)).thenReturn(Optional.empty());
        when(raceMediaRepository.save(any(RaceMedia.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(highlightProvider.normalizeId("https://youtu.be/dQw4w9WgXcQ")).thenReturn("dQw4w9WgXcQ");
        when(highlightProvider.embedUrl("dQw4w9WgXcQ")).thenReturn("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
        when(highlightProvider.verify("dQw4w9WgXcQ"))
                .thenThrow(new ProviderUnavailableException("PROVIDER_UNAVAILABLE", "YouTube could not be reached"));

        RaceMediaResponse response = service.upsertOrganizerHighlight(
                1L,
                new RaceMediaRequest("https://youtu.be/dQw4w9WgXcQ", "Official replay"),
                "organizer@example.com"
        );

        assertThat(response.status()).isEqualTo(MediaStatus.DRAFT);
        assertThat(response.verificationStatus()).isEqualTo(MediaVerificationStatus.FAILED);
        assertThat(response.providerErrorCode()).isEqualTo("PROVIDER_UNAVAILABLE");
        assertThat(response.canPublish()).isFalse();
        verify(raceMediaRepository).save(any(RaceMedia.class));
    }

    @Test
    void publishReverifiesAndRejectsNonEmbeddableVideo() {
        RaceMedia media = RaceMedia.create(
                race,
                MediaType.HIGHLIGHT,
                MediaProviderType.YOUTUBE,
                "dQw4w9WgXcQ",
                "https://youtu.be/dQw4w9WgXcQ",
                "Official replay",
                organizer
        );
        media.markVerified(new ProviderMeta("Official replay", "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg"), LocalDateTime.now());
        when(raceRepository.findByIdAndDeletedAtIsNull(1L)).thenReturn(Optional.of(race));
        when(userRepository.findByEmail("organizer@example.com")).thenReturn(Optional.of(organizer));
        when(raceMediaRepository.findActiveByRaceIdAndType(1L, MediaType.HIGHLIGHT)).thenReturn(Optional.of(media));
        when(highlightProvider.verify("dQw4w9WgXcQ"))
                .thenThrow(new VideoNotEmbeddableException("NOT_EMBEDDABLE", "Video cannot be embedded"));

        assertThatThrownBy(() -> service.publishOrganizerHighlight(1L, "organizer@example.com"))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(ex -> ((ResponseStatusException) ex).getStatusCode())
                .isEqualTo(HttpStatus.UNPROCESSABLE_ENTITY);
        assertThat(media.getStatus()).isEqualTo(MediaStatus.DRAFT);
        assertThat(media.getVerificationStatus()).isEqualTo(MediaVerificationStatus.FAILED);
        assertThat(media.getProviderErrorCode()).isEqualTo("NOT_EMBEDDABLE");
    }

    @Test
    void publishRequiresOfficialRaceResult() {
        race.updateStatus(RaceStatus.SCHEDULED);
        RaceMedia media = RaceMedia.create(
                race,
                MediaType.HIGHLIGHT,
                MediaProviderType.YOUTUBE,
                "dQw4w9WgXcQ",
                "https://youtu.be/dQw4w9WgXcQ",
                "Official replay",
                organizer
        );
        media.markVerified(new ProviderMeta("Official replay", "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg"), LocalDateTime.now());
        when(raceRepository.findByIdAndDeletedAtIsNull(1L)).thenReturn(Optional.of(race));
        when(userRepository.findByEmail("organizer@example.com")).thenReturn(Optional.of(organizer));
        when(raceMediaRepository.findActiveByRaceIdAndType(1L, MediaType.HIGHLIGHT)).thenReturn(Optional.of(media));

        assertThatThrownBy(() -> service.publishOrganizerHighlight(1L, "organizer@example.com"))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(ex -> ((ResponseStatusException) ex).getStatusCode())
                .isEqualTo(HttpStatus.CONFLICT);
    }

    @Test
    void liveStreamPublishesOnScheduledRaceWithoutResultGate() {
        // Điểm khác biệt cốt lõi vs highlight: live publish được DÙ race chưa official (LiveStreamPolicy).
        race.updateStatus(RaceStatus.SCHEDULED);
        RaceMedia media = RaceMedia.create(
                race,
                MediaType.LIVE_STREAM,
                MediaProviderType.YOUTUBE,
                "dQw4w9WgXcQ",
                "https://youtu.be/dQw4w9WgXcQ",
                "Live feed",
                organizer
        );
        media.markVerified(new ProviderMeta("Live feed", "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg"), LocalDateTime.now());
        when(raceRepository.findByIdAndDeletedAtIsNull(1L)).thenReturn(Optional.of(race));
        when(userRepository.findByEmail("organizer@example.com")).thenReturn(Optional.of(organizer));
        when(raceMediaRepository.findActiveByRaceIdAndType(1L, MediaType.LIVE_STREAM)).thenReturn(Optional.of(media));
        when(highlightProvider.verify("dQw4w9WgXcQ"))
                .thenReturn(new ProviderMeta("Live feed", "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg"));

        RaceMediaResponse response = service.publishOrganizerLiveStream(1L, "organizer@example.com");

        assertThat(response.status()).isEqualTo(MediaStatus.PUBLISHED);
        assertThat(response.verificationStatus()).isEqualTo(MediaVerificationStatus.VERIFIED);
    }
}
