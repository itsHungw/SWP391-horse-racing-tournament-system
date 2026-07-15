package com.example.horseracingtournamentsystem.championship.entity;

import com.example.horseracingtournamentsystem.tournament.entity.Tournament;
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
 * Hợp đồng thuê trọng tài theo từng giải (BR-07/08/14). Ban tổ chức mời referee
 * đã được nền tảng cấp phép; referee accept -> ACTIVE; có thể DECLINED / TERMINATED.
 * Mô phỏng theo {@link JockeyInvitation}.
 */
@Entity
@Table(name = "referee_contracts")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RefereeContract {

    public static final String STATUS_PENDING = "PENDING";
    public static final String STATUS_ACTIVE = "ACTIVE";
    public static final String STATUS_DECLINED = "DECLINED";
    public static final String STATUS_TERMINATED = "TERMINATED";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tournament_id", nullable = false)
    private Tournament tournament;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "referee_id", nullable = false)
    private User referee;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "invited_by", nullable = false)
    private User invitedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "terminated_by")
    private User terminatedBy;

    @Column(name = "status", nullable = false, length = 30)
    private String status;

    @Column(name = "agreement_url", length = 500)
    private String agreementUrl;

    @Column(name = "reason", length = 500)
    private String reason;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "responded_at")
    private LocalDateTime respondedAt;

    @Column(name = "terminated_at")
    private LocalDateTime terminatedAt;

    public static RefereeContract invite(Tournament tournament, User referee, User invitedBy,
                                         String agreementUrl, String message) {
        RefereeContract contract = new RefereeContract();
        contract.tournament = tournament;
        contract.referee = referee;
        contract.invitedBy = invitedBy;
        contract.agreementUrl = agreementUrl;
        contract.reason = message;
        contract.status = STATUS_PENDING;
        contract.createdAt = LocalDateTime.now();
        return contract;
    }

    public void accept(String refereeEmail) {
        ensureOwnedByReferee(refereeEmail);
        ensurePending();
        this.status = STATUS_ACTIVE;
        this.respondedAt = LocalDateTime.now();
        this.updatedAt = this.respondedAt;
    }

    public void decline(String refereeEmail, String reason) {
        ensureOwnedByReferee(refereeEmail);
        ensurePending();
        this.status = STATUS_DECLINED;
        this.reason = reason;
        this.respondedAt = LocalDateTime.now();
        this.updatedAt = this.respondedAt;
    }

    public void terminate(User terminatedBy, String reason) {
        if (!STATUS_ACTIVE.equals(this.status)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only active contracts can be terminated");
        }
        this.status = STATUS_TERMINATED;
        this.terminatedBy = terminatedBy;
        this.reason = reason;
        this.terminatedAt = LocalDateTime.now();
        this.updatedAt = this.terminatedAt;
    }

    public boolean isActive() {
        return STATUS_ACTIVE.equals(this.status);
    }

    public void reInvite(User invitedBy, String agreementUrl, String message) {
        this.invitedBy = invitedBy;
        this.agreementUrl = agreementUrl;
        this.reason = message;
        this.status = STATUS_PENDING;
        this.createdAt = LocalDateTime.now();
        this.terminatedBy = null;
        this.terminatedAt = null;
        this.respondedAt = null;
        this.updatedAt = null;
    }

    private void ensureOwnedByReferee(String refereeEmail) {
        if (!this.referee.getEmail().equals(refereeEmail)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only respond to your own contracts");
        }
    }

    private void ensurePending() {
        if (!STATUS_PENDING.equals(this.status)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only pending contracts can be reviewed");
        }
    }
}
