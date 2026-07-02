package com.example.horseracingtournamentsystem.race.media;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.horseracingtournamentsystem.organization.entity.Organization;
import com.example.horseracingtournamentsystem.organization.repository.OrganizationRepository;
import com.example.horseracingtournamentsystem.race.entity.Race;
import com.example.horseracingtournamentsystem.race.enums.RaceStatus;
import com.example.horseracingtournamentsystem.race.media.enums.MediaProviderType;
import com.example.horseracingtournamentsystem.race.media.exception.ProviderUnavailableException;
import com.example.horseracingtournamentsystem.race.media.provider.HighlightProvider;
import com.example.horseracingtournamentsystem.race.media.provider.ProviderMeta;
import com.example.horseracingtournamentsystem.race.media.repository.RaceMediaRepository;
import com.example.horseracingtournamentsystem.race.repository.RaceRepository;
import com.example.horseracingtournamentsystem.security.JwtService;
import com.example.horseracingtournamentsystem.tournament.entity.Tournament;
import com.example.horseracingtournamentsystem.tournament.repository.TournamentRepository;
import com.example.horseracingtournamentsystem.user.entity.Role;
import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.user.entity.UserRole;
import com.example.horseracingtournamentsystem.user.repository.RoleRepository;
import com.example.horseracingtournamentsystem.user.repository.UserRepository;
import com.example.horseracingtournamentsystem.user.repository.UserRoleRepository;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Set;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class RaceMediaIntegrationTest {

    private static final String VIDEO_ID = "dQw4w9WgXcQ";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private RaceMediaRepository raceMediaRepository;

    @Autowired
    private RaceRepository raceRepository;

    @Autowired
    private TournamentRepository tournamentRepository;

    @Autowired
    private OrganizationRepository organizationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserRoleRepository userRoleRepository;

    @Autowired
    private RoleRepository roleRepository;

    @MockitoBean
    private HighlightProvider highlightProvider;

    private String organizerToken;
    private String adminToken;
    private Race race;
    private Tournament tournament;

    @BeforeEach
    void setUp() {
        raceMediaRepository.deleteAll();
        raceRepository.deleteAll();
        tournamentRepository.deleteAll();
        organizationRepository.deleteAll();
        userRoleRepository.deleteAll();
        roleRepository.deleteAll();
        userRepository.deleteAll();

        when(highlightProvider.type()).thenReturn(MediaProviderType.YOUTUBE);
        when(highlightProvider.normalizeId(anyString())).thenReturn(VIDEO_ID);
        when(highlightProvider.embedUrl(VIDEO_ID)).thenReturn("https://www.youtube-nocookie.com/embed/" + VIDEO_ID);
        when(highlightProvider.verify(VIDEO_ID)).thenReturn(
                new ProviderMeta("Official replay", "https://i.ytimg.com/vi/" + VIDEO_ID + "/hqdefault.jpg")
        );

        Role organizerRole = roleRepository.save(Role.of("ORGANIZER", "Organizer"));
        Role adminRole = roleRepository.save(Role.of("ADMIN", "Admin"));

        User organizer = User.pending("Organizer User", "organizer-media@example.com", "hash");
        organizer.verifyEmail();
        organizer = userRepository.save(organizer);
        userRoleRepository.save(UserRole.active(organizer, organizerRole, organizer));

        User admin = User.pending("Admin User", "admin-media@example.com", "hash");
        admin.verifyEmail();
        admin = userRepository.save(admin);
        userRoleRepository.save(UserRole.active(admin, adminRole, admin));

        Organization organization = Organization.application(
                organizer,
                "MEDIA_ORG",
                "Media Club",
                "LIC",
                "ops@example.com",
                "0900000000",
                "Season operator",
                "evidence.pdf",
                null,
                "Ready"
        );
        organization.approve(admin);
        organization = organizationRepository.save(organization);

        tournament = Tournament.create(
                "Media Cup",
                "MEDIA_CUP",
                "Season",
                "Belmont",
                LocalDate.now(),
                LocalDate.now().plusDays(3),
                LocalDateTime.now(),
                LocalDateTime.now().plusDays(1),
                20,
                organizer
        );
        tournament.assignOrganization(organization);
        tournament = tournamentRepository.save(tournament);

        race = Race.create(tournament, "Final", "MEDIA_FINAL", LocalDateTime.now().minusHours(1), 1200, 12, organizer);
        race.updateStatus(RaceStatus.RESULT_CONFIRMED);
        race = raceRepository.save(race);

        organizerToken = jwtService.generateToken(organizer.getEmail(), Set.of("ORGANIZER"));
        adminToken = jwtService.generateToken(admin.getEmail(), Set.of("ADMIN"));
    }

    @Test
    void organizerPublishesHighlightAndPublicEndpointOnlyShowsPublishedVerifiedMedia() throws Exception {
        mockMvc.perform(get("/api/v1/races/{raceId}/highlight", race.getId()))
                .andExpect(status().isNoContent());

        mockMvc.perform(put("/api/v1/organizer/races/{raceId}/media", race.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + organizerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "url": "https://youtu.be/dQw4w9WgXcQ",
                                  "title": "Final replay"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("DRAFT"))
                .andExpect(jsonPath("$.verificationStatus").value("VERIFIED"))
                .andExpect(jsonPath("$.canPublish").value(true));

        mockMvc.perform(get("/api/v1/races/{raceId}/highlight", race.getId()))
                .andExpect(status().isNoContent());

        mockMvc.perform(post("/api/v1/organizer/races/{raceId}/media/publish", race.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + organizerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PUBLISHED"))
                .andExpect(jsonPath("$.verificationStatus").value("VERIFIED"));

        mockMvc.perform(get("/api/v1/races/{raceId}/highlight", race.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.raceId").value(race.getId()))
                .andExpect(jsonPath("$.embedUrl").value("https://www.youtube-nocookie.com/embed/" + VIDEO_ID))
                .andExpect(jsonPath("$.sourceUrl").doesNotExist());

        mockMvc.perform(get("/api/v1/races/highlights").param("tournamentId", tournament.getId().toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].raceId").value(race.getId()));
    }

    @Test
    void draftSaveSurvivesProviderOutageAndStaysPrivate() throws Exception {
        when(highlightProvider.verify(VIDEO_ID))
                .thenThrow(new ProviderUnavailableException("PROVIDER_UNAVAILABLE", "YouTube could not be reached"));

        mockMvc.perform(put("/api/v1/organizer/races/{raceId}/media", race.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + organizerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "url": "https://youtu.be/dQw4w9WgXcQ",
                                  "title": "Final replay"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("DRAFT"))
                .andExpect(jsonPath("$.verificationStatus").value("FAILED"))
                .andExpect(jsonPath("$.providerErrorCode").value("PROVIDER_UNAVAILABLE"))
                .andExpect(jsonPath("$.canPublish").value(false));

        mockMvc.perform(get("/api/v1/races/{raceId}/highlight", race.getId()))
                .andExpect(status().isNoContent());
    }

    @Test
    void adminCanManageHighlightWithoutTournamentOwnership() throws Exception {
        mockMvc.perform(put("/api/v1/admin/races/{raceId}/media", race.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                                  "title": "Admin replay"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Admin replay"))
                .andExpect(jsonPath("$.verificationStatus").value("VERIFIED"));
    }
}
