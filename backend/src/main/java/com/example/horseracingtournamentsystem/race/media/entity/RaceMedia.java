package com.example.horseracingtournamentsystem.race.media.entity;

import com.example.horseracingtournamentsystem.race.entity.Race;
import com.example.horseracingtournamentsystem.race.media.enums.MediaProviderType;
import com.example.horseracingtournamentsystem.race.media.enums.MediaStatus;
import com.example.horseracingtournamentsystem.race.media.enums.MediaType;
import com.example.horseracingtournamentsystem.race.media.enums.MediaVerificationStatus;
import com.example.horseracingtournamentsystem.race.media.provider.ProviderMeta;
import com.example.horseracingtournamentsystem.user.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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

@Entity
@Table(name = "race_media")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RaceMedia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "race_id", nullable = false)
    private Race race;

    @Enumerated(EnumType.STRING)
    @Column(name = "media_type", nullable = false, length = 40)
    private MediaType mediaType;

    @Enumerated(EnumType.STRING)
    @Column(name = "provider", nullable = false, length = 40)
    private MediaProviderType provider;

    @Column(name = "provider_video_id", nullable = false, length = 100)
    private String providerVideoId;

    @Column(name = "source_url", nullable = false, length = 1000)
    private String sourceUrl;

    @Column(name = "title", length = 160)
    private String title;

    @Column(name = "provider_title", length = 300)
    private String providerTitle;

    @Column(name = "thumbnail_url", length = 1000)
    private String thumbnailUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 40)
    private MediaStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "verification_status", nullable = false, length = 40)
    private MediaVerificationStatus verificationStatus;

    @Column(name = "provider_error_code", length = 80)
    private String providerErrorCode;

    @Column(name = "last_verified_at")
    private LocalDateTime lastVerifiedAt;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by")
    private User updatedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "published_by")
    private User publishedBy;

    @Column(name = "published_at")
    private LocalDateTime publishedAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    public static RaceMedia create(
            Race race,
            MediaProviderType provider,
            String providerVideoId,
            String sourceUrl,
            String title,
            User creator
    ) {
        RaceMedia media = new RaceMedia();
        media.race = race;
        media.mediaType = MediaType.HIGHLIGHT;
        media.provider = provider;
        media.providerVideoId = providerVideoId;
        media.sourceUrl = sourceUrl;
        media.title = normalizeTitle(title);
        media.status = MediaStatus.DRAFT;
        media.verificationStatus = MediaVerificationStatus.UNVERIFIED;
        media.createdBy = creator;
        media.updatedBy = creator;
        media.createdAt = LocalDateTime.now();
        return media;
    }

    public void changeSource(String providerVideoId, String sourceUrl, User editor) {
        if (this.providerVideoId.equals(providerVideoId)) {
            touch(editor);
            this.sourceUrl = sourceUrl;
            return;
        }
        this.providerVideoId = providerVideoId;
        this.sourceUrl = sourceUrl;
        this.status = MediaStatus.DRAFT;
        this.verificationStatus = MediaVerificationStatus.UNVERIFIED;
        this.providerTitle = null;
        this.thumbnailUrl = null;
        this.providerErrorCode = null;
        this.lastVerifiedAt = null;
        this.publishedAt = null;
        this.publishedBy = null;
        touch(editor);
    }

    public void changeTitle(String title, User editor) {
        this.title = normalizeTitle(title);
        touch(editor);
    }

    public void markVerified(ProviderMeta meta, LocalDateTime at) {
        this.verificationStatus = MediaVerificationStatus.VERIFIED;
        this.providerTitle = meta.title();
        this.thumbnailUrl = meta.thumbnailUrl();
        this.providerErrorCode = null;
        this.lastVerifiedAt = at;
        this.updatedAt = at;
    }

    public void markFailed(String errorCode, LocalDateTime at) {
        this.verificationStatus = MediaVerificationStatus.FAILED;
        this.providerErrorCode = errorCode;
        this.lastVerifiedAt = at;
        if (this.status == MediaStatus.PUBLISHED) {
            this.status = MediaStatus.DRAFT;
            this.publishedAt = null;
            this.publishedBy = null;
        }
        this.updatedAt = at;
    }

    public void publish(User publisher) {
        if (verificationStatus != MediaVerificationStatus.VERIFIED) {
            throw new IllegalStateException("Race media must be verified before publishing");
        }
        this.status = MediaStatus.PUBLISHED;
        this.publishedBy = publisher;
        this.publishedAt = LocalDateTime.now();
        touch(publisher);
    }

    public void unpublish(User editor) {
        this.status = MediaStatus.DRAFT;
        this.publishedAt = null;
        this.publishedBy = null;
        touch(editor);
    }

    public void softDelete(User editor) {
        this.deletedAt = LocalDateTime.now();
        this.status = MediaStatus.DRAFT;
        this.publishedAt = null;
        this.publishedBy = null;
        touch(editor);
    }

    private void touch(User editor) {
        this.updatedBy = editor;
        this.updatedAt = LocalDateTime.now();
    }

    private static String normalizeTitle(String title) {
        if (title == null || title.isBlank()) {
            return null;
        }
        return title.trim();
    }
}
