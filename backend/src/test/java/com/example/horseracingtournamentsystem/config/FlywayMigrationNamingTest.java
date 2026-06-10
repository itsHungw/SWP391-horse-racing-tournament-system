package com.example.horseracingtournamentsystem.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import org.junit.jupiter.api.Test;

class FlywayMigrationNamingTest {

    private static final Pattern VERSIONED_MIGRATION = Pattern.compile("^V([^_]+)__.+\\.sql$");

    @Test
    void versionedMigrationsHaveUniqueVersions() throws IOException {
        Path migrationDirectory = Path.of("src/main/resources/db/migration");

        Map<String, List<String>> scriptsByVersion;
        try (var files = Files.list(migrationDirectory)) {
            scriptsByVersion = files
                    .map(path -> path.getFileName().toString())
                    .map(VERSIONED_MIGRATION::matcher)
                    .filter(Matcher::matches)
                    .collect(Collectors.groupingBy(
                            matcher -> matcher.group(1),
                            Collectors.mapping(matcher -> matcher.group(0), Collectors.toList())
                    ));
        }

        Map<String, List<String>> duplicateVersions = scriptsByVersion.entrySet().stream()
                .filter(entry -> entry.getValue().size() > 1)
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));

        assertThat(duplicateVersions)
                .as("Flyway migration versions must be unique")
                .isEmpty();
    }
}
