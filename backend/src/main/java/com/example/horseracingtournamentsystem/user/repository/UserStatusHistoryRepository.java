package com.example.horseracingtournamentsystem.user.repository;

import com.example.horseracingtournamentsystem.user.entity.UserStatusHistory;
import java.util.List;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserStatusHistoryRepository extends JpaRepository<UserStatusHistory, Long> {

    @EntityGraph(attributePaths = "changedBy")
    List<UserStatusHistory> findByUserIdOrderByChangedAtDescIdDesc(Long userId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT h FROM UserStatusHistory h
            WHERE h.user.id = :userId
            ORDER BY h.changedAt DESC, h.id DESC
            """)
    List<UserStatusHistory> findLatestByUserIdForUpdate(@Param("userId") Long userId, Pageable pageable);
}
