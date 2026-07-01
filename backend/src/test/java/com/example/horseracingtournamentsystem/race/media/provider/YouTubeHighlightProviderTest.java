package com.example.horseracingtournamentsystem.race.media.provider;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.example.horseracingtournamentsystem.race.media.enums.MediaProviderType;
import com.example.horseracingtournamentsystem.race.media.exception.InvalidMediaUrlException;
import org.junit.jupiter.api.Test;

class YouTubeHighlightProviderTest {

    private final YouTubeHighlightProvider provider = new YouTubeHighlightProvider(
            videoId -> new ProviderMeta("Race replay", "https://i.ytimg.com/vi/" + videoId + "/hqdefault.jpg")
    );

    @Test
    void normalizesSupportedYouTubeUrlShapes() {
        assertThat(provider.type()).isEqualTo(MediaProviderType.YOUTUBE);
        assertThat(provider.normalizeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).isEqualTo("dQw4w9WgXcQ");
        assertThat(provider.normalizeId("https://youtu.be/dQw4w9WgXcQ?t=42")).isEqualTo("dQw4w9WgXcQ");
        assertThat(provider.normalizeId("https://www.youtube.com/embed/dQw4w9WgXcQ")).isEqualTo("dQw4w9WgXcQ");
        assertThat(provider.normalizeId("https://m.youtube.com/shorts/dQw4w9WgXcQ")).isEqualTo("dQw4w9WgXcQ");
        assertThat(provider.normalizeId("https://youtube.com/live/dQw4w9WgXcQ?feature=share")).isEqualTo("dQw4w9WgXcQ");
    }

    @Test
    void rejectsNonWhitelistedHostsAndMalformedIds() {
        assertThatThrownBy(() -> provider.normalizeId("https://evil.com/watch?v=dQw4w9WgXcQ"))
                .isInstanceOf(InvalidMediaUrlException.class);
        assertThatThrownBy(() -> provider.normalizeId("https://www.youtube.com.evil.com/watch?v=dQw4w9WgXcQ"))
                .isInstanceOf(InvalidMediaUrlException.class);
        assertThatThrownBy(() -> provider.normalizeId("https://www.youtube.com/watch?v=too-short"))
                .isInstanceOf(InvalidMediaUrlException.class);
        assertThatThrownBy(() -> provider.normalizeId("javascript:alert(1)"))
                .isInstanceOf(InvalidMediaUrlException.class);
    }

    @Test
    void embedUrlIsBuiltFromCanonicalVideoIdOnly() {
        assertThat(provider.embedUrl("dQw4w9WgXcQ"))
                .isEqualTo("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
    }
}
