package com.example.horseracingtournamentsystem.user.repository;

import com.example.horseracingtournamentsystem.user.entity.User;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    @EntityGraph(attributePaths = {"userRoles", "userRoles.role"})
    Optional<User> findWithUserRolesByEmail(String email);

    boolean existsByEmail(String email);

    @org.springframework.data.jpa.repository.Query(
        value = "SELECT DISTINCT u FROM User u LEFT JOIN u.userRoles ur LEFT JOIN ur.role r WHERE u.deletedAt IS NULL AND " +
                "(LOWER(u.fullName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
                "LOWER(u.email) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
                "LOWER(u.phone) LIKE LOWER(CONCAT('%', :query, '%'))) AND " +
                "(:status IS NULL OR :status = '' OR u.status = :status) AND " +
                "(:role IS NULL OR :role = '' OR (r.name = :role AND ur.status = 'ACTIVE'))",
        countQuery = "SELECT COUNT(DISTINCT u) FROM User u LEFT JOIN u.userRoles ur LEFT JOIN ur.role r WHERE u.deletedAt IS NULL AND " +
                     "(LOWER(u.fullName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
                     "LOWER(u.email) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
                     "LOWER(u.phone) LIKE LOWER(CONCAT('%', :query, '%'))) AND " +
                     "(:status IS NULL OR :status = '' OR u.status = :status) AND " +
                     "(:role IS NULL OR :role = '' OR (r.name = :role AND ur.status = 'ACTIVE'))"
    )
    org.springframework.data.domain.Page<User> searchUsers(String query, String status, String role, org.springframework.data.domain.Pageable pageable);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(u) FROM User u JOIN u.userRoles ur JOIN ur.role r WHERE u.deletedAt IS NULL AND r.name = 'ADMIN' AND ur.status = 'ACTIVE'")
    long countActiveAdmins();
}
