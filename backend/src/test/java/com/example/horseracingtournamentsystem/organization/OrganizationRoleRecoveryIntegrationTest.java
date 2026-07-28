package com.example.horseracingtournamentsystem.organization;

import static org.assertj.core.api.Assertions.assertThat;

import com.example.horseracingtournamentsystem.organization.entity.Organization;
import com.example.horseracingtournamentsystem.organization.repository.OrganizationRepository;
import com.example.horseracingtournamentsystem.organization.service.OrganizationService;
import com.example.horseracingtournamentsystem.testsupport.TestDatabaseCleaner;
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
import org.springframework.jdbc.core.JdbcTemplate;

@SpringBootTest
class OrganizationRoleRecoveryIntegrationTest {

    @Autowired private JdbcTemplate jdbcTemplate;
    @Autowired private OrganizationRepository organizationRepository;
    @Autowired private OrganizationService organizationService;
    @Autowired private RoleRepository roleRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private UserRoleRepository userRoleRepository;

    private User owner;

    @BeforeEach
    void setUp() {
        TestDatabaseCleaner.clean(jdbcTemplate);

        Role organizerRole = roleRepository.save(Role.of("ORGANIZER", "Organizer"));

        User admin = userRepository.save(User.pending("Admin", "admin-recovery@example.com", "hash"));
        owner = userRepository.save(User.pending("Organizer", "owner-recovery@example.com", "hash"));

        Organization organization = Organization.application(
                owner,
                "ORG_RECOVERY",
                "Recovery Racing Club",
                "RECOVERY-2026",
                "contact@recovery.example.com",
                null,
                "Approved organizer whose role was accidentally removed",
                "/api/v1/files/private/recovery.pdf",
                null,
                "Approved organizer whose role was accidentally removed by generic role management."
        );
        organization.approve(admin);
        organizationRepository.save(organization);

        UserRole removedOrganizerRole = userRoleRepository.save(UserRole.active(owner, organizerRole, admin));
        removedOrganizerRole.remove(admin);
        userRoleRepository.save(removedOrganizerRole);
    }

    @Test
    void readingActiveOrganizationRestoresMissingOrganizerRole() {
        organizationService.getMine(owner.getEmail());

        boolean hasActiveOrganizerRole = userRepository
                .findWithUserRolesByEmail(owner.getEmail())
                .orElseThrow()
                .getActiveRoleNames()
                .contains("ORGANIZER");

        assertThat(hasActiveOrganizerRole).isTrue();
        assertThat(jdbcTemplate.queryForObject(
                "select count(*) from user_roles where user_id = ? and role_id = ?",
                Long.class,
                owner.getId(),
                roleRepository.findByName("ORGANIZER").orElseThrow().getId()
        )).isEqualTo(1L);
    }
}
