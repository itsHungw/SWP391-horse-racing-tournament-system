package com.example.horseracingtournamentsystem.organization.repository;

import com.example.horseracingtournamentsystem.organization.entity.Organization;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrganizationRepository extends JpaRepository<Organization, Long> {

    boolean existsByCode(String code);

    boolean existsByOwner_IdAndStatusIn(Long ownerId, Collection<String> statuses);

    Optional<Organization> findByOwner_EmailAndDeletedAtIsNull(String email);

    Optional<Organization> findByIdAndDeletedAtIsNull(Long id);

    List<Organization> findAllByStatusOrderByCreatedAtDesc(String status);

    List<Organization> findAllByOrderByCreatedAtDesc();
}
