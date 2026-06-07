package com.example.horseracingtournamentsystem.user.repository;

import com.example.horseracingtournamentsystem.user.entity.HorseOwnerProfile;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HorseOwnerProfileRepository extends JpaRepository<HorseOwnerProfile, Long> {
    Optional<HorseOwnerProfile> findByUserEmail(String email);
    Optional<HorseOwnerProfile> findByUserId(Long userId);
}
