package com.example.horseracingtournamentsystem.notification.repository;

import com.example.horseracingtournamentsystem.notification.entity.Notification;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findTop50ByRecipient_EmailOrderByCreatedAtDesc(String email);

    long countByRecipient_EmailAndReadAtIsNull(String email);

    Optional<Notification> findByIdAndRecipient_Email(Long id, String email);

    List<Notification> findAllByRecipient_EmailAndReadAtIsNull(String email);
}
