package com.example.horseracingtournamentsystem.filestorage;

import com.example.horseracingtournamentsystem.championship.repository.JockeyInvitationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class FileAccessAuthorizationService {

    private final JockeyInvitationRepository invitationRepository;

    public boolean canRead(StoredFileMetadata metadata, Authentication authentication) {
        boolean admin = authentication.getAuthorities().stream()
                .anyMatch(authority -> "ROLE_ADMIN".equals(authority.getAuthority()));
        boolean uploader = metadata.getUploadedBy().getEmail()
                .equalsIgnoreCase(authentication.getName());
        if (admin || uploader) {
            return true;
        }
        if ("JOCKEY_AGREEMENT".equals(metadata.getCategory())) {
            String stableUrl = "/api/v1/files/private/" + metadata.getFilename();
            return invitationRepository.existsByAgreementUrlAndJockey_Email(
                    stableUrl,
                    authentication.getName()
            );
        }
        return false;
    }
}
