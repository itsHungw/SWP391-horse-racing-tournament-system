package com.example.horseracingtournamentsystem.common.error;

import jakarta.servlet.http.HttpServletRequest;
import java.util.LinkedHashMap;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleValidation(
            MethodArgumentNotValidException ex,
            HttpServletRequest request
    ) {
        Map<String, String> fieldErrors = new LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(fieldError ->
                fieldErrors.putIfAbsent(fieldError.getField(), fieldError.getDefaultMessage())
        );

        return buildResponse(HttpStatus.BAD_REQUEST, "Validation failed", request, fieldErrors);
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ApiErrorResponse> handleResponseStatus(
            ResponseStatusException ex,
            HttpServletRequest request
    ) {
        HttpStatusCode statusCode = ex.getStatusCode();
        String message = ex.getReason() == null || ex.getReason().isBlank()
                ? statusText(statusCode)
                : ex.getReason();

        return buildResponse(statusCode, message, request, Map.of());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiErrorResponse> handleIllegalArgument(
            IllegalArgumentException ex,
            HttpServletRequest request
    ) {
        return buildResponse(HttpStatus.BAD_REQUEST, ex.getMessage(), request, Map.of());
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiErrorResponse> handleMalformedBody(
            HttpMessageNotReadableException ex,
            HttpServletRequest request
    ) {
        return buildResponse(HttpStatus.BAD_REQUEST, "Malformed request body", request, Map.of());
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleMissingRoute(
            NoResourceFoundException ex,
            HttpServletRequest request
    ) {
        return buildResponse(HttpStatus.NOT_FOUND, "Resource not found", request, Map.of());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleUnexpected(
            Exception ex,
            HttpServletRequest request
    ) {
        logger.error("Unhandled API exception at {}", request.getRequestURI(), ex);
        return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, "Unexpected server error", request, Map.of());
    }

    private ResponseEntity<ApiErrorResponse> buildResponse(
            HttpStatusCode statusCode,
            String message,
            HttpServletRequest request,
            Map<String, String> fieldErrors
    ) {
        ApiErrorResponse response = ApiErrorResponse.of(
                statusCode.value(),
                statusText(statusCode),
                message,
                request.getRequestURI(),
                fieldErrors
        );

        return ResponseEntity.status(statusCode).body(response);
    }

    private String statusText(HttpStatusCode statusCode) {
        if (statusCode instanceof HttpStatus status) {
            return status.getReasonPhrase();
        }
        return String.valueOf(statusCode.value());
    }
}
