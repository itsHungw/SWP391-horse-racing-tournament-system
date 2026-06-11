package com.example.horseracingtournamentsystem.tools;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

/**
 * Regeneration tool (not an assertion suite): boots the context with Hibernate
 * schema-script generation forced to the SQL Server dialect and writes the DDL
 * for every entity to target/generated/baseline-raw.sql, which seeds
 * db/migration/V1__baseline.sql.
 *
 * Disabled by default so it does not run (or rewrite target/) on every build.
 * When the entities change and the baseline needs refreshing, remove @Disabled,
 * run {@code ./mvnw -o test -Dtest=SchemaScriptGenerationTest}, then reconcile
 * the generated DDL into V1__baseline.sql.
 */
@Disabled("Regeneration tool — enable manually to refresh the baseline from entities")
@SpringBootTest
@TestPropertySource(properties = {
        "spring.flyway.enabled=false",
        "spring.jpa.hibernate.ddl-auto=none",
        "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.SQLServerDialect",
        "spring.jpa.properties.jakarta.persistence.schema-generation.scripts.action=create",
        "spring.jpa.properties.jakarta.persistence.schema-generation.scripts.create-target=target/generated/baseline-raw.sql",
        "spring.jpa.properties.hibernate.hbm2ddl.delimiter=;"
})
class SchemaScriptGenerationTest {

    @Test
    void generatesSqlServerBaselineScript() throws Exception {
        Path script = Path.of("target/generated/baseline-raw.sql");
        assertThat(Files.exists(script)).isTrue();
        String sql = Files.readString(script).toLowerCase();
        assertThat(sql).contains("create table users");
        assertThat(sql).contains("create table stored_files");
    }
}
