package com.example.horseracingtournamentsystem.finance;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

import com.example.horseracingtournamentsystem.finance.controller.AdminFinanceController;
import com.example.horseracingtournamentsystem.finance.service.AdminFinanceLedgerService;
import com.example.horseracingtournamentsystem.finance.service.AdminFinanceQueryService;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.Arrays;

class AdminFinanceControllerTest {

    @Test
    void exposesFinanceOnlyInsideTheAdminApiBoundary() {
        RequestMapping mapping = AdminFinanceController.class.getAnnotation(RequestMapping.class);
        PreAuthorize authorization = AdminFinanceController.class.getAnnotation(PreAuthorize.class);

        assertThat(mapping.value()).containsExactly("/api/v1/admin/finance");
        assertThat(authorization.value()).isEqualTo("hasRole('ADMIN')");
    }

    @Test
    void canBeConstructedWithReadOnlyQueryServicesOnly() {
        AdminFinanceController controller = new AdminFinanceController(
                mock(AdminFinanceQueryService.class), mock(AdminFinanceLedgerService.class));

        assertThat(controller).isNotNull();
    }

    @Test
    void doesNotExposeDuplicatePredictionTrendOrPerformanceEndpoints() {
        var paths = Arrays.stream(AdminFinanceController.class.getDeclaredMethods())
                .map(method -> method.getAnnotation(GetMapping.class))
                .filter(java.util.Objects::nonNull)
                .flatMap(mapping -> Arrays.stream(mapping.value()))
                .toList();

        assertThat(paths).doesNotContain("/series", "/performance");
    }
}
