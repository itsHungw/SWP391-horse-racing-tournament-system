package com.example.horseracingtournamentsystem.user.repository;

import com.example.horseracingtournamentsystem.user.entity.RoleRequest;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoleRequestRepository extends JpaRepository<RoleRequest, Long> {

    @EntityGraph(attributePaths = {"user", "user.userRoles", "user.userRoles.role", "reviewedBy"})
    List<RoleRequest> findAllByOrderByCreatedAtDesc();

    @EntityGraph(attributePaths = {"user", "user.userRoles", "user.userRoles.role", "reviewedBy"})
    List<RoleRequest> findByStatusOrderByCreatedAtDesc(String status);
}
