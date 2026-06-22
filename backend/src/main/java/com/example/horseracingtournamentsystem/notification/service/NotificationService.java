package com.example.horseracingtournamentsystem.notification.service;

import com.example.horseracingtournamentsystem.notification.dto.response.NotificationResponse;
import com.example.horseracingtournamentsystem.notification.entity.Notification;
import com.example.horseracingtournamentsystem.notification.repository.NotificationRepository;
import com.example.horseracingtournamentsystem.user.entity.User;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NotificationService {

    private final NotificationRepository notificationRepository;

    /**
     * Record a notification for {@code recipient}. No-op when recipient is null so callers can
     * fire-and-forget without guarding every edge case (e.g. a tournament without an organization).
     */
    @Transactional
    public void notify(User recipient, String type, String title, String body, String referenceType, Long referenceId) {
        if (recipient == null) {
            return;
        }
        notificationRepository.save(Notification.create(recipient, type, title, body, referenceType, referenceId));
    }

    public List<NotificationResponse> list(String email) {
        return notificationRepository.findTop50ByRecipient_EmailOrderByCreatedAtDesc(email)
                .stream().map(this::toResponse).toList();
    }

    public long unreadCount(String email) {
        return notificationRepository.countByRecipient_EmailAndReadAtIsNull(email);
    }

    @Transactional
    public void markRead(Long id, String email) {
        notificationRepository.findByIdAndRecipient_Email(id, email).ifPresent(Notification::markRead);
    }

    @Transactional
    public void markAllRead(String email) {
        notificationRepository.findAllByRecipient_EmailAndReadAtIsNull(email).forEach(Notification::markRead);
    }

    private NotificationResponse toResponse(Notification n) {
        return new NotificationResponse(
                n.getId(), n.getType(), n.getTitle(), n.getBody(),
                n.getReferenceType(), n.getReferenceId(), n.getReadAt() != null, n.getCreatedAt());
    }
}
