package com.example.horseracingtournamentsystem.tournament.entity;

import com.example.horseracingtournamentsystem.organization.entity.Organization;
import com.example.horseracingtournamentsystem.tournament.enums.TournamentStatus;
import com.example.horseracingtournamentsystem.user.entity.User;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "tournaments")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Tournament {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Column(name = "code", nullable = false, unique = true, length = 100)
    private String code;

    @Column(name = "description")
    private String description;

    @Column(name = "location", nullable = false, length = 255)
    private String location;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(name = "registration_start_at", nullable = false)
    private LocalDateTime registrationStartAt;

    @Column(name = "registration_end_at", nullable = false)
    private LocalDateTime registrationEndAt;

    @Column(name = "max_horses")
    private Integer maxHorses;

    @Column(name = "max_horses_per_owner", nullable = false)
    private Integer maxHorsesPerOwner;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 40)
    private TournamentStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id")
    private Organization organization;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by")
    private User approvedBy;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "rejection_reason", length = 255)
    private String rejectionReason;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @Column(name = "total_prize_pool", nullable = false)
    private long totalPrizePool;

    public static Tournament create(String name, String code, String description, String location, 
                                    LocalDate startDate, LocalDate endDate, LocalDateTime regStart, 
                                    LocalDateTime regEnd, Integer maxHorses, User creator) {
        return create(name, code, description, location, startDate, endDate, regStart, regEnd, maxHorses, 0L, creator);
    }

    public static Tournament create(String name, String code, String description, String location, 
                                    LocalDate startDate, LocalDate endDate, LocalDateTime regStart, 
                                    LocalDateTime regEnd, Integer maxHorses, long totalPrizePool, User creator) {
        Tournament tournament = new Tournament();
        tournament.name = name;
        tournament.code = code;
        tournament.description = description;
        tournament.location = location;
        tournament.startDate = startDate;
        tournament.endDate = endDate;
        tournament.registrationStartAt = regStart;
        tournament.registrationEndAt = regEnd;
        tournament.maxHorses = maxHorses;
        tournament.maxHorsesPerOwner = 2;
        tournament.status = TournamentStatus.DRAFT;
        tournament.totalPrizePool = totalPrizePool;
        tournament.createdBy = creator;
        tournament.createdAt = LocalDateTime.now();
        return tournament;
    }

    public static Tournament create(String name, String code, String description, String location,
                                    LocalDate startDate, LocalDate endDate, LocalDateTime regStart,
                                    LocalDateTime regEnd, Integer maxHorses, Integer maxHorsesPerOwner,
                                    User creator) {
        return create(name, code, description, location, startDate, endDate, regStart, regEnd, maxHorses, maxHorsesPerOwner, 0L, creator);
    }

    public static Tournament create(String name, String code, String description, String location,
                                    LocalDate startDate, LocalDate endDate, LocalDateTime regStart,
                                    LocalDateTime regEnd, Integer maxHorses, Integer maxHorsesPerOwner,
                                    long totalPrizePool, User creator) {
        Tournament tournament = create(
                name, code, description, location, startDate, endDate, regStart, regEnd, maxHorses, totalPrizePool, creator);
        tournament.maxHorsesPerOwner = maxHorsesPerOwner == null ? 2 : maxHorsesPerOwner;
        return tournament;
    }

    public void update(String name, String description, String location, LocalDate startDate, LocalDate endDate,
                       LocalDateTime regStart, LocalDateTime regEnd, Integer maxHorses) {
        update(name, description, location, startDate, endDate, regStart, regEnd, maxHorses, this.maxHorsesPerOwner, this.totalPrizePool);
    }

    public void update(String name, String description, String location, LocalDate startDate, LocalDate endDate,
                       LocalDateTime regStart, LocalDateTime regEnd, Integer maxHorses, Integer maxHorsesPerOwner) {
        update(name, description, location, startDate, endDate, regStart, regEnd, maxHorses, maxHorsesPerOwner, this.totalPrizePool);
    }

    public void update(String name, String description, String location, LocalDate startDate, LocalDate endDate,
                       LocalDateTime regStart, LocalDateTime regEnd, Integer maxHorses, Integer maxHorsesPerOwner, long totalPrizePool) {
        this.name = name;
        this.description = description;
        this.location = location;
        this.startDate = startDate;
        this.endDate = endDate;
        this.registrationStartAt = regStart;
        this.registrationEndAt = regEnd;
        this.maxHorses = maxHorses;
        this.maxHorsesPerOwner = maxHorsesPerOwner == null ? 2 : maxHorsesPerOwner;
        this.totalPrizePool = totalPrizePool;
        this.updatedAt = LocalDateTime.now();
    }

    public void postpone() {
        this.status = TournamentStatus.POSTPONED;
        this.updatedAt = LocalDateTime.now();
    }

    public void openRegistration() {
        this.status = TournamentStatus.OPEN_REGISTRATION;
        this.updatedAt = LocalDateTime.now();
    }

    public void closeRegistration() {
        this.status = TournamentStatus.CLOSED_REGISTRATION;
        this.updatedAt = LocalDateTime.now();
    }

    public void lockParticipants() {
        this.status = TournamentStatus.PARTICIPANTS_LOCKED;
        this.updatedAt = LocalDateTime.now();
    }

    public void publishSchedule() {
        this.status = TournamentStatus.SCHEDULE_PUBLISHED;
        this.updatedAt = LocalDateTime.now();
    }

    public void startOngoing() {
        this.status = TournamentStatus.ONGOING;
        this.updatedAt = LocalDateTime.now();
    }

    public void completeTournament() {
        this.status = TournamentStatus.COMPLETED;
        this.updatedAt = LocalDateTime.now();
    }

    public void assignOrganization(Organization organization) {
        this.organization = organization;
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * True khi {@code email} là chủ tổ chức đang sở hữu giải này (BR-09). Dùng để chặn
     * quyền vận hành cross-organization ở mọi service organizer (duyệt đăng ký, xếp race, chốt KQ).
     */
    public boolean isManagedBy(String email) {
        return organization != null
                && organization.getOwner() != null
                && organization.getOwner().getEmail().equalsIgnoreCase(email);
    }

    /**
     * BR-10/BR-13: chặn mọi thao tác VẬN HÀNH khi tổ chức chủ quản không còn ACTIVE
     * (bị đình chỉ SUSPENDED). Gọi ở các method mutating của organizer (duyệt đăng ký,
     * xếp race, chốt KQ, mời/gỡ referee...). Đường đọc/list KHÔNG gọi để organizer vẫn
     * xem được giải và biết vì sao bị khóa.
     */
    public void assertOrganizationOperational() {
        if (organization == null || !organization.isActive()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Your organization is not active — operations are locked (BR-10)");
        }
    }

    /** Cổng 2 / BR-17: DRAFT -> chờ admin duyệt. Service kiểm tra điều kiện chuyển trạng thái. */
    public void submitForApproval() {
        this.status = TournamentStatus.PENDING_APPROVAL;
        this.updatedAt = LocalDateTime.now();
    }

    public void approveLaunch(User reviewer) {
        this.status = TournamentStatus.APPROVED;
        this.approvedBy = reviewer;
        this.approvedAt = LocalDateTime.now();
        this.rejectionReason = null;
        this.updatedAt = this.approvedAt;
    }

    public void rejectLaunch(User reviewer, String reason) {
        this.status = TournamentStatus.DRAFT;
        this.approvedBy = reviewer;
        this.rejectionReason = reason;
        this.updatedAt = LocalDateTime.now();
    }

    public void softDelete() {
        this.deletedAt = LocalDateTime.now();
    }
}
