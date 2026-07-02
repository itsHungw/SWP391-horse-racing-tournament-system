package com.example.horseracingtournamentsystem.race.media.policy;

import com.example.horseracingtournamentsystem.race.entity.Race;
import com.example.horseracingtournamentsystem.race.enums.RaceStatus;
import com.example.horseracingtournamentsystem.race.media.enums.MediaBlockedReason;
import com.example.horseracingtournamentsystem.race.media.enums.MediaType;
import java.util.Set;
import org.springframework.stereotype.Component;

/**
 * Highlight chỉ được publish sau khi kết quả race đã chính thức
 * ({@code RESULT_CONFIRMED} hoặc {@code PUBLISHED}). Đây là luật cũ của highlight, nay tách khỏi
 * service để không hardcode chung cho mọi loại media.
 */
@Component
public class HighlightPolicy implements MediaTypePolicy {

    private static final Set<RaceStatus> OFFICIAL_RESULT_STATUSES =
            Set.of(RaceStatus.RESULT_CONFIRMED, RaceStatus.PUBLISHED);

    @Override
    public MediaType type() {
        return MediaType.HIGHLIGHT;
    }

    @Override
    public boolean isRaceStatePublishable(Race race) {
        return OFFICIAL_RESULT_STATUSES.contains(race.getStatus());
    }

    @Override
    public MediaBlockedReason raceStateBlockedReason() {
        return MediaBlockedReason.RESULT_NOT_OFFICIAL;
    }
}
