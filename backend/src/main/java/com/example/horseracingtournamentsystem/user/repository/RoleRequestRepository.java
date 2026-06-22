package com.example.horseracingtournamentsystem.user.repository;

import com.example.horseracingtournamentsystem.user.entity.RoleRequest;
import com.example.horseracingtournamentsystem.user.enums.RoleRequestStatus;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RoleRequestRepository extends JpaRepository<RoleRequest, Long> {

    @EntityGraph(attributePaths = {"user", "user.userRoles", "user.userRoles.role", "reviewedBy"})
    List<RoleRequest> findAllByOrderByCreatedAtDesc();

    @EntityGraph(attributePaths = {"user", "user.userRoles", "user.userRoles.role", "reviewedBy"})
    List<RoleRequest> findByStatusOrderByCreatedAtDesc(RoleRequestStatus status);

    List<RoleRequest> findByUserEmailOrderByCreatedAtDesc(String email);

    @Query("SELECT COUNT(r) FROM RoleRequest r WHERE r.status = :status")
    long countByStatus(@Param("status") RoleRequestStatus status);

    @EntityGraph(attributePaths = {"user", "user.userRoles", "user.userRoles.role", "reviewedBy"})
    List<RoleRequest> findTop5ByStatusOrderByCreatedAtDesc(RoleRequestStatus status);

    boolean existsByUserEmailAndRequestedRoleAndStatus(String email, String requestedRole, RoleRequestStatus status);

    boolean existsByUserEmailAndStatusAndRequestedRoleIn(
            String email,
            @Param("status") RoleRequestStatus status,
            Collection<String> requestedRoles
    );
}
