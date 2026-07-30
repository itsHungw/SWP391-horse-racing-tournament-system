package com.example.horseracingtournamentsystem.prediction.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import com.example.horseracingtournamentsystem.user.entity.User;

/**
 * Entity lưu trữ cấu hình chung của hệ thống cược (chỉ có 1 record duy nhất với id = 1).
 * Quản lý điểm ảo và tỷ lệ hoa hồng của hệ thống.
 */
@Entity
@Table(name = "prediction_settings")
public class PredictionSetting {

    @Id
    private Long id;

    @Column(name = "display_seed", nullable = false)
    private double displaySeed; // Điểm ảo làm mồi (seed) để làm mượt tỷ lệ cược khi mới bắt đầu

    @Column(name = "takeout_rate", nullable = false, precision = 5, scale = 4)
    private BigDecimal takeoutRate; // Tỷ lệ hoa hồng nhà cái giữ lại (VD: 0.15 = 15%)

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by")
    private User updatedBy;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public double getDisplaySeed() {
        return displaySeed;
    }

    public void setDisplaySeed(double displaySeed) {
        this.displaySeed = displaySeed;
    }

    public BigDecimal getTakeoutRate() {
        return takeoutRate;
    }

    public void setTakeoutRate(BigDecimal takeoutRate) {
        this.takeoutRate = takeoutRate;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public User getUpdatedBy() {
        return updatedBy;
    }

    public void setUpdatedBy(User updatedBy) {
        this.updatedBy = updatedBy;
    }
}
