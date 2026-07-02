package com.example.horseracingtournamentsystem.race.media.entity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.example.horseracingtournamentsystem.race.entity.Race;
import com.example.horseracingtournamentsystem.race.enums.RaceStatus;
import com.example.horseracingtournamentsystem.race.media.enums.MediaProviderType;
import com.example.horseracingtournamentsystem.race.media.enums.MediaStatus;
import com.example.horseracingtournamentsystem.race.media.enums.MediaType;
import com.example.horseracingtournamentsystem.race.media.enums.MediaVerificationStatus;
import com.example.horseracingtournamentsystem.race.media.provider.ProviderMeta;
import com.example.horseracingtournamentsystem.tournament.entity.Tournament;
import com.example.horseracingtournamentsystem.user.entity.User;
import java.time.LocalDate;
import java.time.LocalDateTime;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class RaceMediaTest {

    private User actor;
    private Race race;

    @BeforeEach
    void setUp() {
        actor = User.pending("Organizer", "organizer@example.com", "hash");
        actor.verifyEmail();
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
                actor
        );
        race = Race.create(tournament, "Final", "FINAL", LocalDateTime.now().minusHours(2), 1200, 12, actor);
        race.updateStatus(RaceStatus.RESULT_CONFIRMED);
    }

    @Test
    void newMediaStartsAsDraftAndCannotPublishBeforeVerification() {
        RaceMedia media = RaceMedia.create(
                race,
                MediaType.HIGHLIGHT,
                MediaProviderType.YOUTUBE,
                "dQw4w9WgXcQ",
                "https://youtu.be/dQw4w9WgXcQ",
                "Final replay",
                actor
        );

        assertThat(media.getStatus()).isEqualTo(MediaStatus.DRAFT);
        assertThat(media.getVerificationStatus()).isEqualTo(MediaVerificationStatus.UNVERIFIED);
        assertThatThrownBy(() -> media.publish(actor))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("verified");
    }

    @Test
    void changingPublishedSourceDemotesAndClearsPublishAudit() {
        RaceMedia media = RaceMedia.create(
                race,
                MediaType.HIGHLIGHT,
                MediaProviderType.YOUTUBE,
                "dQw4w9WgXcQ",
                "https://youtu.be/dQw4w9WgXcQ",
                "Final replay",
                actor
        );
        media.markVerified(new ProviderMeta("Official replay", "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg"), LocalDateTime.now());
        media.publish(actor);

        media.changeSource("aaaaaaaaaaa", "https://youtu.be/aaaaaaaaaaa", actor);

        assertThat(media.getProviderVideoId()).isEqualTo("aaaaaaaaaaa");
        assertThat(media.getStatus()).isEqualTo(MediaStatus.DRAFT);
        assertThat(media.getVerificationStatus()).isEqualTo(MediaVerificationStatus.UNVERIFIED);
        assertThat(media.getPublishedAt()).isNull();
        assertThat(media.getPublishedBy()).isNull();
    }

    @Test
    void titleOnlyEditKeepsPublishedAndVerifiedState() {
        RaceMedia media = RaceMedia.create(
                race,
                MediaType.HIGHLIGHT,
                MediaProviderType.YOUTUBE,
                "dQw4w9WgXcQ",
                "https://youtu.be/dQw4w9WgXcQ",
                "Final replay",
                actor
        );
        media.markVerified(new ProviderMeta("Official replay", "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg"), LocalDateTime.now());
        media.publish(actor);

        media.changeTitle("Stewards cut", actor);

        assertThat(media.getTitle()).isEqualTo("Stewards cut");
        assertThat(media.getStatus()).isEqualTo(MediaStatus.PUBLISHED);
        assertThat(media.getVerificationStatus()).isEqualTo(MediaVerificationStatus.VERIFIED);
    }
}
