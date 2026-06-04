package com.example.horseracingtournamentsystem.user.repository;

import com.example.horseracingtournamentsystem.user.entity.UserRoleHistory;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface UserRoleHistoryRepository extends JpaRepository<UserRoleHistory, Long> {

    @Query("SELECT h FROM UserRoleHistory h JOIN FETCH h.userRole ur JOIN FETCH ur.role r WHERE ur.user.id = :userId ORDER BY h.changedAt DESC")
    List<UserRoleHistory> findRecentHistoryByUserId(Long userId);
}
