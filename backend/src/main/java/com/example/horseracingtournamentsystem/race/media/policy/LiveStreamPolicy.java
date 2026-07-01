package com.example.horseracingtournamentsystem.race.media.policy;

import com.example.horseracingtournamentsystem.race.entity.Race;
import com.example.horseracingtournamentsystem.race.media.enums.MediaBlockedReason;
import com.example.horseracingtournamentsystem.race.media.enums.MediaType;
import org.springframework.stereotype.Component;

/**
 * Live stream được cấu hình TRƯỚC race (lúc {@code SCHEDULED}) để sẵn sàng ngay khi bấm Start
 * (race chuyển {@code ONGOING}). Vì vậy publish KHÔNG phụ thuộc race-status — chỉ cần đã verify.
 * Việc phát công khai hay không do FE gate theo {@code race.status == ONGOING}, không phải ở đây.
 */
@Component
public class LiveStreamPolicy implements MediaTypePolicy {

    @Override
    public MediaType type() {
        return MediaType.LIVE_STREAM;
    }

    @Override
    public boolean isRaceStatePublishable(Race race) {
        // Live không bị chặn bởi race-status; luôn cho publish (miễn đã verify).
        return true;
    }

    @Override
    public MediaBlockedReason raceStateBlockedReason() {
        // Không bao giờ bị chặn vì race-status.
        return null;
    }
}
