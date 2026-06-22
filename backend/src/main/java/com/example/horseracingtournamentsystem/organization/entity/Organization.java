package com.example.horseracingtournamentsystem.organization.entity;

import com.example.horseracingtournamentsystem.user.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

/**
 * Ban tổ chức (Organizer). MVP: mỗi tổ chức có đúng 1 chủ sở hữu (owner).
 * Vòng đời: PENDING (đăng ký) -> ACTIVE (admin duyệt) -> SUSPENDED (đình chỉ);
 * hoặc PENDING -> REJECTED. Xem docs/ba/2026-06-14-organizer-role-ba.md.
 */
@Entity
@Table(name = "organizations")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Organization {

    public static final String STATUS_PENDING = "PENDING";
    public static final String STATUS_ACTIVE = "ACTIVE";
    public static final String STATUS_SUSPENDED = "SUSPENDED";
    public static final String STATUS_REJECTED = "REJECTED";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_user_id", nullable = false)
    private User owner;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by")
    private User approvedBy;

    @Column(name = "code", nullable = false, unique = true, length = 100)
    private String code;

    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Column(name = "status", nullable = false, length = 30)
    private String status;

    @Column(name = "license_number", length = 100)
    private String licenseNumber;

    @Column(name = "contact_email", length = 150)
    private String contactEmail;

    @Column(name = "contact_phone", length = 30)
    private String contactPhone;

    @Column(name = "logo_url", length = 500)
    private String logoUrl;

    @Column(name = "evidence_url", length = 500)
    private String evidenceUrl;

    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "application_note")
    private String applicationNote;

    @Column(name = "rejection_reason", length = 255)
    private String rejectionReason;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    public static Organization application(User owner, String code, String name, String licenseNumber,
                                           String contactEmail, String contactPhone, String description,
                                           String evidenceUrl, String logoUrl, String applicationNote) {
        Organization org = new Organization();
        org.owner = owner;
        org.code = code;
        org.name = name;
        org.licenseNumber = licenseNumber;
        org.contactEmail = contactEmail;
        org.contactPhone = contactPhone;
        org.description = description;
        org.evidenceUrl = evidenceUrl;
        org.logoUrl = logoUrl;
        org.applicationNote = applicationNote;
        org.status = STATUS_PENDING;
        org.createdAt = LocalDateTime.now();
        return org;
    }

    /** Nộp lại sau khi bị từ chối: dùng lại chính record này (tránh rác DB), đưa về PENDING. */
    public void resubmit(String name, String licenseNumber, String contactEmail, String contactPhone,
                         String description, String evidenceUrl, String logoUrl, String applicationNote) {
        if (!STATUS_REJECTED.equals(this.status)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only a rejected application can be resubmitted");
        }
        this.name = name;
        this.licenseNumber = licenseNumber;
        this.contactEmail = contactEmail;
        this.contactPhone = contactPhone;
        this.description = description;
        this.evidenceUrl = evidenceUrl;
        this.logoUrl = logoUrl;
        this.applicationNote = applicationNote;
        this.status = STATUS_PENDING;
        this.rejectionReason = null;
        this.approvedBy = null;
        this.approvedAt = null;
        this.updatedAt = LocalDateTime.now();
    }

    public void approve(User reviewer) {
        ensurePending();
        this.status = STATUS_ACTIVE;
        this.approvedBy = reviewer;
        this.approvedAt = LocalDateTime.now();
        this.rejectionReason = null;
        this.updatedAt = this.approvedAt;
    }

    public void reject(User reviewer, String reason) {
        ensurePending();
        this.status = STATUS_REJECTED;
        this.approvedBy = reviewer;
        this.rejectionReason = reason;
        this.updatedAt = LocalDateTime.now();
    }

    public void suspend() {
        this.status = STATUS_SUSPENDED;
        this.updatedAt = LocalDateTime.now();
    }

    public void reactivate() {
        this.status = STATUS_ACTIVE;
        this.updatedAt = LocalDateTime.now();
    }

    public boolean isActive() {
        return STATUS_ACTIVE.equals(this.status);
    }

    private void ensurePending() {
        if (!STATUS_PENDING.equals(this.status)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only pending organizations can be reviewed");
        }
    }
}
