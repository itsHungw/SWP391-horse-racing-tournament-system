package com.example.horseracingtournamentsystem.user.repository;

import com.example.horseracingtournamentsystem.user.entity.UserStatusHistory;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserStatusHistoryRepository extends JpaRepository<UserStatusHistory, Long> {

    @EntityGraph(attributePaths = "changedBy")
    List<UserStatusHistory> findByUserIdOrderByChangedAtDescIdDesc(Long userId);
}
