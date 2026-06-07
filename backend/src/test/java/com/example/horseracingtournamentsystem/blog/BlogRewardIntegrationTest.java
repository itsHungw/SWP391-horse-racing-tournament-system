package com.example.horseracingtournamentsystem.blog;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.horseracingtournamentsystem.blog.entity.Blog;
import com.example.horseracingtournamentsystem.blog.entity.BlogStatus;
import com.example.horseracingtournamentsystem.blog.repository.BlogRepository;
import com.example.horseracingtournamentsystem.blog.repository.UserBlogRewardRepository;
import com.example.horseracingtournamentsystem.blog.repository.UserDailyPointLimitRepository;
import com.example.horseracingtournamentsystem.point.entity.PointSetting;
import com.example.horseracingtournamentsystem.point.entity.PointSettingKey;
import com.example.horseracingtournamentsystem.point.entity.PointTransactionType;
import com.example.horseracingtournamentsystem.point.repository.PointSettingRepository;
import com.example.horseracingtournamentsystem.point.repository.PointTransactionRepository;
import com.example.horseracingtournamentsystem.point.repository.UserPointAccountRepository;
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
class BlogRewardIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private BlogRepository blogRepository;

    @Autowired
    private UserBlogRewardRepository userBlogRewardRepository;

    @Autowired
    private UserDailyPointLimitRepository userDailyPointLimitRepository;

    @Autowired
    private PointTransactionRepository pointTransactionRepository;

    @Autowired
    private UserPointAccountRepository userPointAccountRepository;

    @Autowired
    private PointSettingRepository pointSettingRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRoleRepository userRoleRepository;

    private User admin;
    private User spectator;
    private String spectatorToken;

    @BeforeEach
    void setUp() {
        userBlogRewardRepository.deleteAll();
        userDailyPointLimitRepository.deleteAll();
        pointTransactionRepository.deleteAll();
        userPointAccountRepository.deleteAll();
        blogRepository.deleteAll();
        pointSettingRepository.deleteAll();
        userRoleRepository.deleteAll();
        roleRepository.deleteAll();
        userRepository.deleteAll();

        Role adminRole = roleRepository.save(Role.of("ADMIN", "Administrator"));
        Role spectatorRole = roleRepository.save(Role.of("SPECTATOR", "Spectator"));

        admin = userRepository.save(User.pending("Admin User", "admin@example.com", "hash"));
        admin.verifyEmail();
        spectator = userRepository.save(User.pending("Spectator User", "spectator@example.com", "hash"));
        spectator.verifyEmail();

        userRoleRepository.save(UserRole.active(admin, adminRole, admin));
        userRoleRepository.save(UserRole.active(spectator, spectatorRole, admin));

        spectatorToken = jwtService.generateToken(spectator.getEmail(), Set.of("SPECTATOR"));
        setPointSetting(PointSettingKey.BLOG_REWARD_POINTS, 10);
        setPointSetting(PointSettingKey.DAILY_BLOG_REWARD_LIMIT, 100);
    }

    @Test
    void spectatorCanClaimRewardForPublishedBlog() throws Exception {
        Blog blog = saveBlog("Published race guide", "published-race-guide", BlogStatus.PUBLISHED);

        mockMvc.perform(post("/api/v1/blogs/{slug}/claim-reward", blog.getSlug())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + spectatorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "readingSeconds": 30,
                                  "scrollPercent": 80
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.outcome").value("CLAIMED"))
                .andExpect(jsonPath("$.pointsAwarded").value(10))
                .andExpect(jsonPath("$.balance").value(10));

        assertThat(userPointAccountRepository.findById(spectator.getId()))
                .get()
                .extracting("pointBalance")
                .isEqualTo(10);
        assertThat(pointTransactionRepository.findAll()).hasSize(1);
        assertThat(pointTransactionRepository.findAll().get(0).getAmount()).isEqualTo(10);
        assertThat(pointTransactionRepository.findAll().get(0).getTransactionType()).isEqualTo(PointTransactionType.BLOG_REWARD);
        assertThat(pointTransactionRepository.findAll().get(0).getReferenceType()).isEqualTo("BLOG");
        assertThat(pointTransactionRepository.findAll().get(0).getReferenceId()).isEqualTo(blog.getId());
        assertThat(userBlogRewardRepository.existsByUserIdAndBlogId(spectator.getId(), blog.getId())).isTrue();
        assertThat(userDailyPointLimitRepository.findAll()).hasSize(1);
        assertThat(userDailyPointLimitRepository.findAll().get(0).getPointsEarnedFromBlog()).isEqualTo(10);
        assertThat(userDailyPointLimitRepository.findAll().get(0).getPointsEarnedTotal()).isEqualTo(10);
    }

    @Test
    void spectatorCannotClaimSameBlogTwice() throws Exception {
        Blog blog = saveBlog("Single claim guide", "single-claim-guide", BlogStatus.PUBLISHED);

        claim(blog.getSlug())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.outcome").value("CLAIMED"));

        claim(blog.getSlug())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.outcome").value("ALREADY_CLAIMED"))
                .andExpect(jsonPath("$.pointsAwarded").value(0))
                .andExpect(jsonPath("$.balance").value(10));

        assertThat(pointTransactionRepository.findAll()).hasSize(1);
        assertThat(userBlogRewardRepository.findAll()).hasSize(1);
    }

    @Test
    void zeroRewardSettingsDoNotCreatePointRecords() throws Exception {
        setPointSetting(PointSettingKey.BLOG_REWARD_POINTS, 0);
        Blog blog = saveBlog("Zero reward guide", "zero-reward-guide", BlogStatus.PUBLISHED);

        claim(blog.getSlug())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.outcome").value("DAILY_LIMIT_REACHED"))
                .andExpect(jsonPath("$.pointsAwarded").value(0))
                .andExpect(jsonPath("$.balance").value(0));

        assertThat(userPointAccountRepository.findById(spectator.getId())).isEmpty();
        assertThat(pointTransactionRepository.findAll()).isEmpty();
        assertThat(userBlogRewardRepository.findAll()).isEmpty();
        assertThat(userDailyPointLimitRepository.findAll()).isEmpty();
    }

    @Test
    void draftBlogCannotReward() throws Exception {
        Blog blog = saveBlog("Draft race guide", "draft-race-guide", BlogStatus.DRAFT);

        claim(blog.getSlug())
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Only published blogs can reward points."));

        assertThat(pointTransactionRepository.findAll()).isEmpty();
        assertThat(userPointAccountRepository.findById(spectator.getId())).isEmpty();
    }

    @Test
    void rewardAmountFollowsPointSettings() throws Exception {
        setPointSetting(PointSettingKey.BLOG_REWARD_POINTS, 7);
        Blog blog = saveBlog("Settings reward guide", "settings-reward-guide", BlogStatus.PUBLISHED);

        claim(blog.getSlug())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.outcome").value("CLAIMED"))
                .andExpect(jsonPath("$.pointsAwarded").value(7))
                .andExpect(jsonPath("$.balance").value(7));

        assertThat(pointTransactionRepository.findAll().get(0).getAmount()).isEqualTo(7);
    }

    @Test
    void dailyCapFollowsPointSettings() throws Exception {
        setPointSetting(PointSettingKey.BLOG_REWARD_POINTS, 10);
        setPointSetting(PointSettingKey.DAILY_BLOG_REWARD_LIMIT, 15);
        Blog first = saveBlog("First daily guide", "first-daily-guide", BlogStatus.PUBLISHED);
        Blog second = saveBlog("Second daily guide", "second-daily-guide", BlogStatus.PUBLISHED);

        claim(first.getSlug())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.outcome").value("CLAIMED"))
                .andExpect(jsonPath("$.balance").value(10));

        claim(second.getSlug())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.outcome").value("DAILY_LIMIT_REACHED"))
                .andExpect(jsonPath("$.pointsAwarded").value(0))
                .andExpect(jsonPath("$.balance").value(10));

        assertThat(pointTransactionRepository.findAll()).hasSize(1);
        assertThat(userBlogRewardRepository.findAll()).hasSize(1);
    }

    @Test
    void claimRequiresReadingTimeAndScrollDepth() throws Exception {
        Blog blog = saveBlog("Reading proof guide", "reading-proof-guide", BlogStatus.PUBLISHED);

        mockMvc.perform(post("/api/v1/blogs/{slug}/claim-reward", blog.getSlug())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + spectatorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "readingSeconds": 29,
                                  "scrollPercent": 79
                                }
                                """))
                .andExpect(status().isBadRequest());

        assertThat(pointTransactionRepository.findAll()).isEmpty();
    }

    private org.springframework.test.web.servlet.ResultActions claim(String slug) throws Exception {
        return mockMvc.perform(post("/api/v1/blogs/{slug}/claim-reward", slug)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + spectatorToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {
                          "readingSeconds": 30,
                          "scrollPercent": 80
                        }
                        """));
    }

    private Blog saveBlog(String title, String slug, BlogStatus status) {
        return blogRepository.save(Blog.create(
                title,
                slug,
                "Summary",
                "Long article content",
                null,
                status,
                admin
        ));
    }

    private void setPointSetting(PointSettingKey key, int value) {
        PointSetting setting = pointSettingRepository.findById(key)
                .orElseGet(() -> PointSetting.defaultSetting(key, key.name()));
        setting.updateValue(value, null);
        pointSettingRepository.save(setting);
    }
}
