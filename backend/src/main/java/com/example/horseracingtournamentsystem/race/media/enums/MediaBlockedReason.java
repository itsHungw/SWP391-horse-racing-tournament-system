package com.example.horseracingtournamentsystem.race.media.enums;

/**
 * Lý do một media chưa thể publish. Gom về enum (thay vì rải chuỗi literal) để FE có contract ổn
 * định và backend không lệch mã lỗi giữa các nơi. {@code name()} chính là mã trả cho FE.
 */
public enum MediaBlockedReason {
    /** Đã publish rồi. */
    ALREADY_PUBLISHED,
    /** Trạng thái race chưa cho publish loại media này (vd highlight cần kết quả chính thức). */
    RESULT_NOT_OFFICIAL,
    /** Chưa verify được video (oEmbed chưa xác nhận embeddable). */
    VIDEO_NOT_VERIFIED
}
