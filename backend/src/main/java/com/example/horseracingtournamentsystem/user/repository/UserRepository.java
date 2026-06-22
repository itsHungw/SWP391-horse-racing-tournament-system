package com.example.horseracingtournamentsystem.user.repository;

import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.user.enums.UserStatus;
import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    long countByStatusAndDeletedAtIsNull(UserStatus status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT u FROM User u WHERE u.email = :email")
    Optional<User> findByEmailForUpdate(String email);

   
    @EntityGraph(attributePaths = {"userRoles", "userRoles.role", "refereeProfile"})

    Optional<User> findWithUserRolesByEmail(String email);

    boolean existsByEmail(String email);

    @Query(
        value = "SELECT DISTINCT u FROM User u LEFT JOIN u.userRoles ur LEFT JOIN ur.role r WHERE u.deletedAt IS NULL AND " +
                "(LOWER(u.fullName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
                "LOWER(u.email) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
                "LOWER(u.phone) LIKE LOWER(CONCAT('%', :query, '%'))) AND " +
                "(:status IS NULL OR u.status = :status) AND " +
                "(:role IS NULL OR :role = '' OR (r.name = :role AND ur.status = com.example.horseracingtournamentsystem.user.enums.UserRoleStatus.ACTIVE))",
        countQuery = "SELECT COUNT(DISTINCT u) FROM User u LEFT JOIN u.userRoles ur LEFT JOIN ur.role r WHERE u.deletedAt IS NULL AND " +
                     "(LOWER(u.fullName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
                     "LOWER(u.email) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
                     "LOWER(u.phone) LIKE LOWER(CONCAT('%', :query, '%'))) AND " +
                     "(:status IS NULL OR u.status = :status) AND " +
                     "(:role IS NULL OR :role = '' OR (r.name = :role AND ur.status = com.example.horseracingtournamentsystem.user.enums.UserRoleStatus.ACTIVE))"
    )
    org.springframework.data.domain.Page<User> searchUsers(@org.springframework.data.repository.query.Param("query") String query, @org.springframework.data.repository.query.Param("status") UserStatus status, @org.springframework.data.repository.query.Param("role") String role, org.springframework.data.domain.Pageable pageable);

    @Query("""
            SELECT COUNT(u) FROM User u
            JOIN u.userRoles ur
            JOIN ur.role r
            WHERE u.deletedAt IS NULL
              AND r.name = 'ADMIN'
              AND ur.status = com.example.horseracingtournamentsystem.user.enums.UserRoleStatus.ACTIVE
            """)
    long countActiveAdmins();

    @Query("SELECT DISTINCT u FROM User u JOIN u.userRoles ur JOIN ur.role r "
            + "WHERE u.deletedAt IS NULL AND ur.status = 'ACTIVE' AND r.name = :roleName ORDER BY u.fullName")
    List<User> findActiveByRoleName(String roleName);
}
