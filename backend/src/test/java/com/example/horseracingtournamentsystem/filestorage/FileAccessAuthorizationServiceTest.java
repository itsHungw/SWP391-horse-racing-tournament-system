package com.example.horseracingtournamentsystem.filestorage;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import com.example.horseracingtournamentsystem.championship.repository.JockeyInvitationRepository;
import com.example.horseracingtournamentsystem.user.entity.User;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class FileAccessAuthorizationServiceTest {

    @Mock
    private JockeyInvitationRepository invitationRepository;

    @Test
    void permitsInvitedJockeyToReadAgreement() {
        User owner = User.pending("Owner", "owner@example.com", "hash");
        StoredFileMetadata metadata = StoredFileMetadata.create(
                "agreement.pdf",
                "private/jockey-agreements/agreement.pdf",
                "agreement.pdf",
                "JOCKEY_AGREEMENT",
                "application/pdf",
                true,
                123,
                owner
        );
        ReflectionTestUtils.setField(owner, "id", 1L);
        when(invitationRepository.existsByAgreementUrlAndJockey_Email(
                "/api/v1/files/private/agreement.pdf",
                "jockey@example.com"
        )).thenReturn(true);

        FileAccessAuthorizationService service =
                new FileAccessAuthorizationService(invitationRepository);
        boolean allowed = service.canRead(
                metadata,
                new UsernamePasswordAuthenticationToken("jockey@example.com", null)
        );

        assertThat(allowed).isTrue();
    }
}
