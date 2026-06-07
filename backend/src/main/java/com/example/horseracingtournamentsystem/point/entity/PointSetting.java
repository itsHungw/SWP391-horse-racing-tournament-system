package com.example.horseracingtournamentsystem.point.entity;

import com.example.horseracingtournamentsystem.user.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "point_settings")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PointSetting {

    @Id
    @Enumerated(EnumType.STRING)
    @Column(name = "setting_key", nullable = false, length = 80)
    private PointSettingKey key;

    @Column(name = "setting_value", nullable = false)
    private int value;

    @Column(name = "description", length = 255)
    private String description;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by")
    private User updatedBy;

    public static PointSetting defaultSetting(PointSettingKey key, String description) {
        PointSetting setting = new PointSetting();
        setting.key = key;
        setting.value = 0;
        setting.description = description;
        return setting;
    }

    public void updateValue(int value, User updatedBy) {
        if (value < 0) {
            throw new IllegalArgumentException("Point setting value must be greater than or equal to 0.");
        }
        this.value = value;
        this.updatedBy = updatedBy;
        this.updatedAt = LocalDateTime.now();
    }
}
