package com.example.horseracingtournamentsystem.user.repository;

import com.example.horseracingtournamentsystem.user.entity.RefereeProfile;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RefereeProfileRepository extends JpaRepository<RefereeProfile, Long> {

    Optional<RefereeProfile> findByUserId(Long userId);
}
