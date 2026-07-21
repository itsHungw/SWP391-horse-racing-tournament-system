package com.example.horseracingtournamentsystem.dispute.repository;

import com.example.horseracingtournamentsystem.dispute.entity.Dispute;
import com.example.horseracingtournamentsystem.dispute.enums.DisputeReferenceType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DisputeRepository extends JpaRepository<Dispute, Long> {
    List<Dispute> findByRequesterIdOrderByCreatedAtDesc(Long requesterId);
    
    List<Dispute> findAllByOrderByCreatedAtDesc();

    boolean existsByRequesterIdAndReferenceTypeAndReferenceId(
            Long requesterId, DisputeReferenceType referenceType, Long referenceId);

    Optional<Dispute> findByRequesterIdAndReferenceTypeAndReferenceId(
            Long requesterId, DisputeReferenceType referenceType, Long referenceId);
}
