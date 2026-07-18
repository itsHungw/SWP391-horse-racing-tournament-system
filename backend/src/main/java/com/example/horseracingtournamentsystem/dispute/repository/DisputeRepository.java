package com.example.horseracingtournamentsystem.dispute.repository;

import com.example.horseracingtournamentsystem.dispute.entity.Dispute;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DisputeRepository extends JpaRepository<Dispute, Long> {
    List<Dispute> findByRequesterIdOrderByCreatedAtDesc(Long requesterId);
    
    List<Dispute> findAllByOrderByCreatedAtDesc();
}
