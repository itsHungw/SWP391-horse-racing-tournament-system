package com.example.horseracingtournamentsystem.result;

import static org.assertj.core.api.Assertions.assertThat;

import jakarta.persistence.EntityManager;
import jakarta.persistence.Table;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class RaceResultMappingIntegrationTest {

    @Autowired
    private EntityManager entityManager;

    @Test
    void raceResultsTableHasSingleJpaSourceOfTruth() {
        long mappedRaceResultEntities = entityManager.getMetamodel()
                .getEntities()
                .stream()
                .filter(entityType -> {
                    Table table = entityType.getJavaType().getAnnotation(Table.class);
                    return table != null && "race_results".equals(table.name());
                })
                .count();

        assertThat(mappedRaceResultEntities).isEqualTo(1);
    }
}
