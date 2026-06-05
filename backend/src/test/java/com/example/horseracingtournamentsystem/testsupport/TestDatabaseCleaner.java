package com.example.horseracingtournamentsystem.testsupport;

import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;

public final class TestDatabaseCleaner {

    private TestDatabaseCleaner() {
    }

    public static void clean(JdbcTemplate jdbcTemplate) {
        jdbcTemplate.execute("SET REFERENTIAL_INTEGRITY FALSE");
        try {
            List<String> tableNames = jdbcTemplate.queryForList(
                    """
                    SELECT TABLE_NAME
                    FROM INFORMATION_SCHEMA.TABLES
                    WHERE TABLE_SCHEMA = 'PUBLIC'
                      AND TABLE_TYPE = 'BASE TABLE'
                    """,
                    String.class
            );

            for (String tableName : tableNames) {
                jdbcTemplate.execute("DELETE FROM " + tableName);
            }
        } finally {
            jdbcTemplate.execute("SET REFERENTIAL_INTEGRITY TRUE");
        }
    }
}
