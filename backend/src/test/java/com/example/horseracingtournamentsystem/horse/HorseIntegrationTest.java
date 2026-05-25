package com.example.horseracingtournamentsystem.horse;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.example.horseracingtournamentsystem.horse.entity.Horse;
import com.example.horseracingtournamentsystem.horse.repository.HorseRepository;
import com.example.horseracingtournamentsystem.security.JwtService;
import com.example.horseracingtournamentsystem.user.entity.Role;
import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.user.repository.RoleRepository;
import com.example.horseracingtournamentsystem.user.repository.UserRepository;
import com.example.horseracingtournamentsystem.user.repository.UserRoleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.Set;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class HorseIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private HorseRepository horseRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRoleRepository userRoleRepository;

    private String adminToken;
    private String spectatorToken;
    private User ownerUser;

    @BeforeEach
    void setUp() {
        horseRepository.deleteAll();
        userRoleRepository.deleteAll();
        roleRepository.deleteAll();
        userRepository.deleteAll();

        Role adminRole = roleRepository.save(Role.of("ADMIN", "Admin"));
        Role specRole = roleRepository.save(Role.of("SPECTATOR", "Spectator"));

        User adminUser = User.pending("Admin User", "admin@example.com", "hash");
        adminUser.verifyEmail();
        adminUser = userRepository.save(adminUser);
        userRoleRepository.save(com.example.horseracingtournamentsystem.user.entity.UserRole.active(adminUser, adminRole, adminUser));

        ownerUser = User.pending("Owner User", "owner@example.com", "hash");
        ownerUser.verifyEmail();
        ownerUser = userRepository.save(ownerUser);
        userRoleRepository.save(com.example.horseracingtournamentsystem.user.entity.UserRole.active(ownerUser, specRole, adminUser));

        adminToken = jwtService.generateToken(adminUser.getEmail(), Set.of("ADMIN"));
        spectatorToken = jwtService.generateToken(ownerUser.getEmail(), Set.of("SPECTATOR"));
    }

    @Test
    void adminCanCreateHorse() throws Exception {
        String body = String.format("""
                {
                    "ownerId": %d,
                    "name": "Secretariat",
                    "breed": "Thoroughbred",
                    "gender": "MALE",
                    "dateOfBirth": "1970-03-30",
                    "color": "Chestnut"
                }
                """, ownerUser.getId());

        mockMvc.perform(post("/api/v1/admin/horses")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Secretariat"))
                .andExpect(jsonPath("$.status").value("APPROVED"));
    }

    @Test
    void publicEndPointsReturnsOnlyApprovedHorses() throws Exception {
        Horse horse = Horse.create(ownerUser, "Draft Horse", "H_CODE_1", "Thoroughbred", "MALE", LocalDate.now(), "Black");
        org.springframework.test.util.ReflectionTestUtils.setField(horse, "status", "INACTIVE");
        horseRepository.save(horse);

        mockMvc.perform(get("/api/v1/horses"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }
}
