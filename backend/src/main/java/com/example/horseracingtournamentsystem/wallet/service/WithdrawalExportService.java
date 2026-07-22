package com.example.horseracingtournamentsystem.wallet.service;

import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.wallet.dto.AdminWithdrawalRowResponse;
import com.example.horseracingtournamentsystem.wallet.dto.WithdrawalExportFilter;
import com.example.horseracingtournamentsystem.wallet.dto.WithdrawalExportPreviewResponse;
import com.example.horseracingtournamentsystem.wallet.entity.WithdrawalActionHistory;
import com.example.horseracingtournamentsystem.wallet.entity.WithdrawalActionType;
import com.example.horseracingtournamentsystem.wallet.entity.WithdrawalRequest;
import com.example.horseracingtournamentsystem.wallet.entity.WithdrawalStatus;
import com.example.horseracingtournamentsystem.wallet.repository.WithdrawalActionHistoryRepository;
import com.example.horseracingtournamentsystem.wallet.repository.WithdrawalExportAuditRepository;
import com.example.horseracingtournamentsystem.wallet.repository.WithdrawalRequestRepository;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.ZoneId;
import java.util.Collection;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.apache.poi.common.usermodel.HyperlinkType;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.CreationHelper;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.streaming.SXSSFWorkbook;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class WithdrawalExportService {

    private static final int HEADER_ROW = 2;
    private static final int FIRST_DATA_ROW = 3;
    private static final List<WithdrawalStatus> RECONCILIATION_STATUSES =
            List.of(WithdrawalStatus.APPROVED, WithdrawalStatus.PAID);

    private final AdminWithdrawalQueryService queryService;
    private final WithdrawalRequestRepository withdrawalRepository;
    private final WithdrawalActionHistoryRepository actionHistoryRepository;
    private final WithdrawalExportAuditRepository auditRepository;
    private final VietQrService vietQrService;

    @Value("${wallet.withdrawal.export.max-rows:50000}")
    private int maxRows;

    @Value("${app.frontend-base-url:}")
    private String frontendBaseUrl;

    @Transactional(readOnly = true)
    public WithdrawalExportPreviewResponse preview(WithdrawalExportFilter filter) {
        List<AdminWithdrawalRowResponse> rows = queryService.findAllForExport(filter);
        int paymentQueueRows = (int) rows.stream()
                .filter(row -> row.status() == WithdrawalStatus.APPROVED)
                .count();
        int paidReconciliationRows = (int) rows.stream()
                .filter(row -> row.status() == WithdrawalStatus.PAID)
                .count();
        return new WithdrawalExportPreviewResponse(
                rows.size(),
                paymentQueueRows,
                paidReconciliationRows,
                paymentQueueRows + paidReconciliationRows > 0);
    }

    @Transactional
    public byte[] export(WithdrawalExportFilter filter, User actor) {
        List<AdminWithdrawalRowResponse> rows = queryService.findAllForExport(filter);
        validateRowLimit(rows.size());

        List<Long> ids = rows.stream().map(AdminWithdrawalRowResponse::id).toList();
        Map<Long, WithdrawalRequest> withdrawals = withdrawalRepository.findAllById(ids).stream()
                .collect(Collectors.toMap(WithdrawalRequest::getId, Function.identity()));
        Map<Long, String> paidActors = paidActors(ids);
        int reconciliationRows = (int) rows.stream()
                .filter(row -> RECONCILIATION_STATUSES.contains(row.status()))
                .count();

        byte[] bytes = buildWorkbook(rows, withdrawals, paidActors, filter.normalized());
        auditRepository.save(com.example.horseracingtournamentsystem.wallet.entity.WithdrawalExportAudit.record(
                actor, filter.normalized(), rows.size(), reconciliationRows));
        return bytes;
    }

    private byte[] buildWorkbook(
            List<AdminWithdrawalRowResponse> rows,
            Map<Long, WithdrawalRequest> withdrawals,
            Map<Long, String> paidActors,
            String normalizedFilters
    ) {
        SXSSFWorkbook workbook = new SXSSFWorkbook(100);
        workbook.setCompressTempFiles(true);
        try (workbook; ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            Styles styles = styles(workbook);
            CreationHelper creationHelper = workbook.getCreationHelper();
            writePaymentQueue(
                    workbook, rows, withdrawals, styles, creationHelper, normalizedFilters);
            writePaidReconciliation(
                    workbook, rows, withdrawals, paidActors, styles, creationHelper, normalizedFilters);
            writeOperations(workbook, rows, styles, normalizedFilters);
            workbook.write(output);
            return output.toByteArray();
        } catch (IOException exception) {
            throw new IllegalStateException("Could not generate withdrawal workbook", exception);
        } finally {
            workbook.dispose();
        }
    }

    private void writeOperations(
            SXSSFWorkbook workbook,
            List<AdminWithdrawalRowResponse> rows,
            Styles styles,
            String filters
    ) {
        Sheet sheet = workbook.createSheet("Operations");
        prepareSheet(sheet, "Withdrawal Operations", filters, styles, 9);
        writeHeader(sheet, styles, List.of(
                "Request ID", "Requested At", "User", "Email", "Amount (VND)",
                "Status", "Bank", "Account", "Risk"));

        int rowIndex = FIRST_DATA_ROW;
        for (AdminWithdrawalRowResponse item : rows) {
            Row row = sheet.createRow(rowIndex++);
            number(row, 0, item.id(), styles.number());
            date(row, 1, item.requestedAt(), styles.date());
            text(row, 2, item.userName());
            text(row, 3, item.userEmail());
            number(row, 4, item.amount(), styles.amount());
            text(row, 5, item.status().name());
            text(row, 6, bankLabel(item.bankName(), item.bankCode()));
            text(row, 7, item.maskedAccountNumber());
            text(row, 8, item.risk().level().name());
        }
        finishSheet(sheet, rowIndex, 8);
    }

    private void writePaymentQueue(
            SXSSFWorkbook workbook,
            List<AdminWithdrawalRowResponse> rows,
            Map<Long, WithdrawalRequest> withdrawals,
            Styles styles,
            CreationHelper creationHelper,
            String filters
    ) {
        Sheet sheet = workbook.createSheet("Payment Queue");
        prepareSheet(sheet, "Approved Payouts — Payment Queue", filters, styles, 11);
        writeHeader(sheet, styles, List.of(
                "Request ID", "Approved At", "User", "Email", "Amount (VND)",
                "Bank", "Account Number", "Account Holder", "Transfer Content",
                "Reviewed By", "Admin Review"));

        int rowIndex = FIRST_DATA_ROW;
        for (AdminWithdrawalRowResponse item : rows) {
            if (item.status() != WithdrawalStatus.APPROVED) {
                continue;
            }
            WithdrawalRequest withdrawal = withdrawals.get(item.id());
            Row row = sheet.createRow(rowIndex++);
            number(row, 0, item.id(), styles.number());
            date(row, 1, withdrawal == null ? null : withdrawal.getReviewedAt(), styles.date());
            text(row, 2, item.userName());
            text(row, 3, item.userEmail());
            number(row, 4, item.amount(), styles.amount());
            text(row, 5, bankLabel(item.bankName(), item.bankCode()));
            text(row, 6, withdrawal == null ? null : withdrawal.getAccountNumber());
            text(row, 7, withdrawal == null ? null : withdrawal.getAccountHolder());
            text(row, 8, withdrawal == null ? null : vietQrService.transferContentFor(withdrawal));
            text(row, 9, withdrawal == null || withdrawal.getReviewedBy() == null
                    ? null : withdrawal.getReviewedBy().getFullName());
            adminLink(row, 10, "Open review", item.id(), styles.hyperlink(), creationHelper);
        }
        finishSheet(sheet, rowIndex, 10);
    }

    private void writePaidReconciliation(
            SXSSFWorkbook workbook,
            List<AdminWithdrawalRowResponse> rows,
            Map<Long, WithdrawalRequest> withdrawals,
            Map<Long, String> paidActors,
            Styles styles,
            CreationHelper creationHelper,
            String filters
    ) {
        Sheet sheet = workbook.createSheet("Paid Reconciliation");
        prepareSheet(sheet, "Paid Payouts — Reconciliation", filters, styles, 11);
        writeHeader(sheet, styles, List.of(
                "Request ID", "Paid At", "User", "Email", "Amount (VND)",
                "Bank", "Account Number", "Account Holder", "Transfer Reference",
                "Paid By", "Receipt Review"));

        int rowIndex = FIRST_DATA_ROW;
        for (AdminWithdrawalRowResponse item : rows) {
            if (item.status() != WithdrawalStatus.PAID) {
                continue;
            }
            WithdrawalRequest withdrawal = withdrawals.get(item.id());
            Row row = sheet.createRow(rowIndex++);
            number(row, 0, item.id(), styles.number());
            date(row, 1, withdrawal == null ? null : withdrawal.getPaidAt(), styles.date());
            text(row, 2, item.userName());
            text(row, 3, item.userEmail());
            number(row, 4, item.amount(), styles.amount());
            text(row, 5, bankLabel(item.bankName(), item.bankCode()));
            text(row, 6, withdrawal == null ? null : withdrawal.getAccountNumber());
            text(row, 7, withdrawal == null ? null : withdrawal.getAccountHolder());
            text(row, 8, withdrawal == null ? null : withdrawal.getTransferReference());
            text(row, 9, paidActors.get(item.id()));
            adminLink(row, 10, "Open receipt", item.id(), styles.hyperlink(), creationHelper);
        }
        finishSheet(sheet, rowIndex, 10);
    }

    private void prepareSheet(
            Sheet sheet,
            String title,
            String filters,
            Styles styles,
            int columns
    ) {
        Row titleRow = sheet.createRow(0);
        Cell titleCell = titleRow.createCell(0);
        titleCell.setCellValue(title);
        titleCell.setCellStyle(styles.title());
        sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, columns - 1));
        text(sheet.createRow(1), 0, "Filters: " + filters);
    }

    private void writeHeader(Sheet sheet, Styles styles, List<String> labels) {
        Row row = sheet.createRow(HEADER_ROW);
        for (int index = 0; index < labels.size(); index++) {
            Cell cell = row.createCell(index);
            cell.setCellValue(labels.get(index));
            cell.setCellStyle(styles.header());
        }
    }

    private void finishSheet(Sheet sheet, int nextRowIndex, int lastColumn) {
        sheet.createFreezePane(0, FIRST_DATA_ROW);
        sheet.setAutoFilter(new CellRangeAddress(
                HEADER_ROW, Math.max(HEADER_ROW, nextRowIndex - 1), 0, lastColumn));
        int[] widths = {14, 22, 24, 30, 18, 26, 22, 24, 24, 24, 30};
        for (int index = 0; index <= lastColumn; index++) {
            sheet.setColumnWidth(index, widths[index] * 256);
        }
    }

    private Styles styles(SXSSFWorkbook workbook) {
        Font titleFont = workbook.createFont();
        titleFont.setBold(true);
        titleFont.setFontHeightInPoints((short) 16);
        CellStyle title = workbook.createCellStyle();
        title.setFont(titleFont);

        Font headerFont = workbook.createFont();
        headerFont.setBold(true);
        headerFont.setColor(IndexedColors.WHITE.getIndex());
        CellStyle header = workbook.createCellStyle();
        header.setFont(headerFont);
        header.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
        header.setFillPattern(FillPatternType.SOLID_FOREGROUND);

        CellStyle number = workbook.createCellStyle();
        number.setDataFormat(workbook.createDataFormat().getFormat("0"));
        CellStyle amount = workbook.createCellStyle();
        amount.setDataFormat(workbook.createDataFormat().getFormat("#,##0"));
        CellStyle date = workbook.createCellStyle();
        date.setDataFormat(workbook.createDataFormat().getFormat("yyyy-mm-dd hh:mm"));
        Font hyperlinkFont = workbook.createFont();
        hyperlinkFont.setColor(IndexedColors.BLUE.getIndex());
        hyperlinkFont.setUnderline(Font.U_SINGLE);
        CellStyle hyperlink = workbook.createCellStyle();
        hyperlink.setFont(hyperlinkFont);
        return new Styles(title, header, number, amount, date, hyperlink);
    }

    private Map<Long, String> paidActors(Collection<Long> withdrawalIds) {
        if (withdrawalIds.isEmpty()) {
            return Map.of();
        }
        return actionHistoryRepository.findForWithdrawals(withdrawalIds).stream()
                .filter(history -> history.getAction() == WithdrawalActionType.MARKED_PAID)
                .collect(Collectors.toMap(
                        history -> history.getWithdrawal().getId(),
                        WithdrawalActionHistory::getActorName,
                        (first, latest) -> latest));
    }

    private void validateRowLimit(int rowCount) {
        if (rowCount > maxRows) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Export contains " + rowCount + " rows; narrow the filters to " + maxRows + " or fewer");
        }
    }

    private String bankLabel(String bankName, String bankCode) {
        if (bankName == null) {
            return bankCode;
        }
        return bankCode == null ? bankName : bankName + " (" + bankCode + ")";
    }

    private void text(Row row, int column, String value) {
        row.createCell(column).setCellValue(safeText(value));
    }

    private void number(Row row, int column, long value, CellStyle style) {
        Cell cell = row.createCell(column);
        cell.setCellValue(value);
        cell.setCellStyle(style);
    }

    private void date(Row row, int column, java.time.LocalDateTime value, CellStyle style) {
        Cell cell = row.createCell(column);
        if (value == null) {
            cell.setCellValue("");
            return;
        }
        cell.setCellValue(Date.from(value.atZone(ZoneId.systemDefault()).toInstant()));
        cell.setCellStyle(style);
    }

    private void adminLink(
            Row row,
            int column,
            String label,
            long withdrawalId,
            CellStyle style,
            CreationHelper creationHelper
    ) {
        Cell cell = row.createCell(column);
        cell.setCellValue(label);
        String address = adminReviewUrl(withdrawalId);
        if (address == null) {
            return;
        }
        var hyperlink = creationHelper.createHyperlink(HyperlinkType.URL);
        hyperlink.setAddress(address);
        cell.setHyperlink(hyperlink);
        cell.setCellStyle(style);
    }

    private String adminReviewUrl(long withdrawalId) {
        if (frontendBaseUrl == null || frontendBaseUrl.isBlank()) {
            return null;
        }
        return frontendBaseUrl.strip().replaceAll("/+$", "")
                + "/admin/withdrawals?review=" + withdrawalId;
    }

    private String safeText(String value) {
        if (value == null) {
            return "";
        }
        String leadingTrimmed = value.stripLeading();
        if (!leadingTrimmed.isEmpty() && "=+-@".indexOf(leadingTrimmed.charAt(0)) >= 0) {
            return "'" + value;
        }
        return value;
    }

    private record Styles(
            CellStyle title,
            CellStyle header,
            CellStyle number,
            CellStyle amount,
            CellStyle date,
            CellStyle hyperlink
    ) {
    }
}
