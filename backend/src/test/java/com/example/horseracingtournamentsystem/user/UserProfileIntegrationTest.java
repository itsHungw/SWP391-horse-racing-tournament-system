package com.example.horseracingtournamentsystem.user;

import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.horseracingtournamentsystem.security.JwtService;
import com.example.horseracingtournamentsystem.user.entity.Role;
import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.user.repository.RoleRepository;
import com.example.horseracingtournamentsystem.user.repository.RoleRequestRepository;
import com.example.horseracingtournamentsystem.user.repository.UserRepository;
import com.example.horseracingtournamentsystem.user.repository.UserRoleRepository;
import java.time.LocalDate;
import java.util.Set;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class UserProfileIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRoleRepository userRoleRepository;

    @Autowired
    private RoleRequestRepository roleRequestRepository;

    private String userToken;
    private User user;

    @BeforeEach
    void setUp() {
        roleRequestRepository.deleteAll();
        userRoleRepository.deleteAll();
        roleRepository.deleteAll();
        userRepository.deleteAll();

        Role spectatorRole = roleRepository.save(Role.of("SPECTATOR", "Spectator"));

        user = User.pending("Minh Quan", "quan@example.com", "hash", "0909123456");
        user.verifyEmail();
        user = userRepository.save(user);

        userToken = jwtService.generateToken(user.getEmail(), Set.of("SPECTATOR"));
    }

    @Test
    void userCanGetProfile() throws Exception {
        ReflectionTestUtils.setField(user, "dateOfBirth", LocalDate.of(2000, 1, 2));
        ReflectionTestUtils.setField(user, "gender", "MALE");
        ReflectionTestUtils.setField(user, "address", "Ho Chi Minh City");
        ReflectionTestUtils.setField(user, "avatarUrl", "http://example.com/avatar.png");
        ReflectionTestUtils.setField(user, "profileCompleted", true);
        userRepository.save(user);

        mockMvc.perform(get("/api/v1/users/me/profile")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fullName").value("Minh Quan"))
                .andExpect(jsonPath("$.phone").value("0909123456"))
                .andExpect(jsonPath("$.gender").value("MALE"))
                .andExpect(jsonPath("$.dateOfBirth").value("2000-01-02"))
                .andExpect(jsonPath("$.address").value("Ho Chi Minh City"))
                .andExpect(jsonPath("$.avatarUrl").value("http://example.com/avatar.png"))
                .andExpect(jsonPath("$.profileCompleted").value(true))
                .andExpect(jsonPath("$.phoneVerified").value(false))
                .andExpect(jsonPath("$.ageVerified").value(false));
    }

    @Test
    void userCanUpdateProfile() throws Exception {
        String updateRequest = """
                {
                    "fullName": "Nguyen Van B",
                    "phone": "0987654321",
                    "gender": "FEMALE",
                    "dateOfBirth": "1995-12-25",
                    "address": "Hanoi, Vietnam",
                    "avatarUrl": "http://example.com/new_avatar.png"
                }
                """;

        mockMvc.perform(put("/api/v1/users/me/profile")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateRequest))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fullName").value("Nguyen Van B"))
                .andExpect(jsonPath("$.phone").value("0987654321"))
                .andExpect(jsonPath("$.gender").value("FEMALE"))
                .andExpect(jsonPath("$.dateOfBirth").value("1995-12-25"))
                .andExpect(jsonPath("$.address").value("Hanoi, Vietnam"))
                .andExpect(jsonPath("$.avatarUrl").value("http://example.com/new_avatar.png"))
                .andExpect(jsonPath("$.profileCompleted").value(true))
                .andExpect(jsonPath("$.ageVerified").value(true));
    }

    @Test
    void updateProfileDoesNotAgeVerifyUnder18User() throws Exception {
        String updateRequest = """
                {
                    "fullName": "Young Rider",
                    "phone": "0987654321",
                    "gender": "FEMALE",
                    "dateOfBirth": "2015-12-25",
                    "address": "Hanoi, Vietnam"
                }
                """;

        mockMvc.perform(put("/api/v1/users/me/profile")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateRequest))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.profileCompleted").value(true))
                .andExpect(jsonPath("$.ageVerified").value(false));
    }

    @Test
    void updateProfileValidatesInput() throws Exception {
        String invalidRequest = """
                {
                    "fullName": "",
                    "phone": "",
                    "gender": "",
                    "dateOfBirth": "3000-01-01",
                    "address": ""
                }
                """;

        mockMvc.perform(put("/api/v1/users/me/profile")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidRequest))
                .andExpect(status().isBadRequest());
    }
}
