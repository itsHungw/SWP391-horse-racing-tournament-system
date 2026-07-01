package com.example.horseracingtournamentsystem.race.media.enums;

/**
 * Loại media gắn với một race. Cùng nằm trên bảng {@code race_media}; mỗi race chỉ có tối đa
 * 1 bản active cho mỗi loại (partial unique {@code (race_id, media_type) WHERE deleted_at IS NULL}).
 * Khi thêm giá trị mới nhớ nới CHECK {@code ck_race_media_type} trong migration cho khớp
 * (đã có contract test bắt lệch enum/DB).
 */
public enum MediaType {
    /** Video quay lại/highlight sau khi race có kết quả chính thức. */
    HIGHLIGHT,
    /** Luồng phát trực tiếp YouTube; công khai chỉ khi race đang ONGOING. */
    LIVE_STREAM
}
