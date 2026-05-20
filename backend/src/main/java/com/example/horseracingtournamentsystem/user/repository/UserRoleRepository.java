package com.example.horseracingtournamentsystem.user.repository;

import com.example.horseracingtournamentsystem.user.entity.UserRole;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRoleRepository extends JpaRepository<UserRole, Long> {

    List<UserRole> findByUserIdAndStatus(Long userId, String status);
}
