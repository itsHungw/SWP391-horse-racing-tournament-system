package com.example.horseracingtournamentsystem.race.media.policy;

import com.example.horseracingtournamentsystem.race.entity.Race;
import com.example.horseracingtournamentsystem.race.media.enums.MediaBlockedReason;
import com.example.horseracingtournamentsystem.race.media.enums.MediaType;

/**
 * Luật riêng theo từng loại media (Strategy). Chỗ DUY NHẤT hai loại media khác nhau về nghiệp vụ
 * là <b>điều kiện race-status để được publish</b>: highlight cần kết quả chính thức, live thì không.
 *
 * <p>Service KHÔNG {@code if (type == ...)} — nó resolve policy qua {@link MediaPolicyRegistry}.
 * Thêm loại media mới = thêm 1 bean policy, service giữ nguyên (Open/Closed).</p>
 */
public interface MediaTypePolicy {

    /** Loại media mà policy này phụ trách. */
    MediaType type();

    /**
     * Trạng thái race hiện tại đã cho phép publish loại media này chưa?
     * (highlight: {@code RESULT_CONFIRMED/PUBLISHED}; live: luôn true vì cấu hình trước race).
     */
    boolean isRaceStatePublishable(Race race);

    /**
     * Mã lý do khi {@link #isRaceStatePublishable(Race)} = false. Trả {@code null} nếu loại media
     * này không bao giờ bị chặn bởi race-status (vd live stream).
     */
    MediaBlockedReason raceStateBlockedReason();
}
