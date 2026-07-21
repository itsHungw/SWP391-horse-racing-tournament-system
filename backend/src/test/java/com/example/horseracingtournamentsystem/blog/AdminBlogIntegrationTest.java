package com.example.horseracingtournamentsystem.blog;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.horseracingtournamentsystem.blog.entity.Blog;
import com.example.horseracingtournamentsystem.blog.entity.BlogStatus;
import com.example.horseracingtournamentsystem.blog.repository.BlogRepository;
import com.example.horseracingtournamentsystem.security.JwtService;
import com.example.horseracingtournamentsystem.user.entity.Role;
import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.user.entity.UserRole;
import com.example.horseracingtournamentsystem.user.repository.RoleRepository;
import com.example.horseracingtournamentsystem.user.repository.UserRepository;
import com.example.horseracingtournamentsystem.user.repository.UserRoleRepository;
import java.util.Set;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class AdminBlogIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private BlogRepository blogRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRoleRepository userRoleRepository;

    private User admin;
    private String adminToken;

    @BeforeEach
    void setUp() {
        blogRepository.deleteAll();
        userRoleRepository.deleteAll();
        roleRepository.deleteAll();
        userRepository.deleteAll();

        Role adminRole = roleRepository.save(Role.of("ADMIN", "Administrator"));
        admin = User.pending("Admin User", "admin@example.com", "hash");
        admin.verifyEmail();
        admin = userRepository.save(admin);
        userRoleRepository.save(UserRole.active(admin, adminRole, admin));
        adminToken = jwtService.generateToken(admin.getEmail(), Set.of("ADMIN"));
    }

    @Test
    void adminCanCreateBlogWithAuthenticatedAuthor() throws Exception {
        mockMvc.perform(post("/api/v1/admin/blogs")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "Derby Preview",
                                  "summary": "Race-day context",
                                  "content": "A detailed look at the upcoming race.",
                                  "thumbnail": null,
                                  "status": "DRAFT"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("Derby Preview"))
                .andExpect(jsonPath("$.slug").value("derby-preview"))
                .andExpect(jsonPath("$.authorId").value(admin.getId()))
                .andExpect(jsonPath("$.authorName").value("Admin User"));

        assertThat(blogRepository.findAll()).hasSize(1);
        assertThat(blogRepository.findAll().get(0).getAuthor().getId()).isEqualTo(admin.getId());
    }

    @Test
    void publicBlogListOnlyReturnsPublishedPosts() throws Exception {
        blogRepository.save(Blog.create(
                "Published race preview",
                "published-race-preview",
                "Visible public summary",
                "Visible public content",
                null,
                BlogStatus.PUBLISHED,
                admin
        ));
        blogRepository.save(Blog.create(
                "Draft race notes",
                "draft-race-notes",
                "Private draft summary",
                "Private draft content",
                null,
                BlogStatus.DRAFT,
                admin
        ));

        mockMvc.perform(get("/api/v1/blogs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].title").value("Published race preview"))
                .andExpect(jsonPath("$.content[0].status").value("PUBLISHED"));
    }

    @Test
    void publicBlogDetailRejectsDraftPostsBySlug() throws Exception {
        blogRepository.save(Blog.create(
                "Internal draft guide",
                "internal-draft-guide",
                "Private draft summary",
                "Private draft content",
                null,
                BlogStatus.DRAFT,
                admin
        ));

        mockMvc.perform(get("/api/v1/blogs/internal-draft-guide"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Requested blog post is not published."));
    }
}
