package com.example.horseracingtournamentsystem.auth;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.horseracingtournamentsystem.auth.dto.request.RegisterRequest;
import com.example.horseracingtournamentsystem.auth.service.AuthService;
import com.example.horseracingtournamentsystem.user.entity.Role;
import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.user.entity.UserRole;
import com.example.horseracingtournamentsystem.user.repository.RoleRepository;
import com.example.horseracingtournamentsystem.user.repository.UserRepository;
import com.example.horseracingtournamentsystem.user.repository.UserRoleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AuthLoginIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRoleRepository userRoleRepository;

    @Autowired
    private AuthService authService;

    @BeforeEach
    void setUp() {
        userRoleRepository.deleteAll();
        roleRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void shouldLoginSuccessfullyAfterEmailVerified() throws Exception {
        // 1. Tạo role SPECTATOR để phục vụ đăng ký
        roleRepository.save(Role.of("SPECTATOR", "Spectator Role"));

        // 2. Đăng ký SPECTATOR
        RegisterRequest reg = new RegisterRequest("Anh B", "testlogin@example.com", "validPassword123", null);
        authService.register(reg);

        // 3. Kích hoạt Email thủ công từ database
        User user = userRepository.findByEmail("testlogin@example.com").orElseThrow();
        user.verifyEmail();
        userRepository.save(user);

        // 4. Tiến hành POST login
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"testlogin@example.com\",\"password\":\"validPassword123\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.email").value("testlogin@example.com"))
                .andExpect(jsonPath("$.fullName").value("Anh B"));
    }

    @Test
    void shouldRejectLoginWithInvalidCredentials() throws Exception {
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"wrong@example.com\",\"password\":\"wrongpassword\"}"))
                .andExpect(status().isBadRequest());
    }
}
