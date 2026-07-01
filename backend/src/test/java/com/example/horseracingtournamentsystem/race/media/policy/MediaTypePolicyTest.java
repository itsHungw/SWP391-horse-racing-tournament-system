package com.example.horseracingtournamentsystem.race.media.policy;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.example.horseracingtournamentsystem.race.entity.Race;
import com.example.horseracingtournamentsystem.race.enums.RaceStatus;
import com.example.horseracingtournamentsystem.race.media.enums.MediaBlockedReason;
import com.example.horseracingtournamentsystem.race.media.enums.MediaType;
import org.junit.jupiter.api.Test;

/**
 * Policy là POJO thuần nên test cực nhẹ (không DB/Spring) — đúng lợi ích của Strategy: luật riêng
 * từng loại media tách ra, kiểm tra độc lập.
 */
class MediaTypePolicyTest {

    @Test
    void highlightPublishableOnlyWhenResultOfficial() {
        HighlightPolicy policy = new HighlightPolicy();
        assertThat(policy.type()).isEqualTo(MediaType.HIGHLIGHT);
        // Chưa official -> chưa cho publish.
        assertThat(policy.isRaceStatePublishable(raceWith(RaceStatus.SCHEDULED))).isFalse();
        assertThat(policy.isRaceStatePublishable(raceWith(RaceStatus.ONGOING))).isFalse();
        // Official -> cho publish.
        assertThat(policy.isRaceStatePublishable(raceWith(RaceStatus.RESULT_CONFIRMED))).isTrue();
        assertThat(policy.isRaceStatePublishable(raceWith(RaceStatus.PUBLISHED))).isTrue();
        assertThat(policy.raceStateBlockedReason()).isEqualTo(MediaBlockedReason.RESULT_NOT_OFFICIAL);
    }

    @Test
    void liveStreamPublishableForAnyRaceStatus() {
        LiveStreamPolicy policy = new LiveStreamPolicy();
        assertThat(policy.type()).isEqualTo(MediaType.LIVE_STREAM);
        // Live không phụ thuộc race-status (policy bỏ qua status) -> luôn cho publish.
        assertThat(policy.isRaceStatePublishable(mock(Race.class))).isTrue();
        assertThat(policy.raceStateBlockedReason()).isNull();
    }

    private Race raceWith(RaceStatus status) {
        Race race = mock(Race.class);
        when(race.getStatus()).thenReturn(status);
        return race;
    }
}
