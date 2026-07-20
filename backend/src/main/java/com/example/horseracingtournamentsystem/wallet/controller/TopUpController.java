package com.example.horseracingtournamentsystem.wallet.controller;

import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.user.repository.UserRepository;
import com.example.horseracingtournamentsystem.wallet.config.VNPayProperties;
import com.example.horseracingtournamentsystem.wallet.dto.CreateTopUpRequest;
import com.example.horseracingtournamentsystem.wallet.dto.CreateTopUpResponse;
import com.example.horseracingtournamentsystem.wallet.dto.TopUpReceiptResponse;
import jakarta.validation.constraints.Size;
import com.example.horseracingtournamentsystem.wallet.service.TopUpService;
import com.example.horseracingtournamentsystem.wallet.service.TopUpService.TopUpResult;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.view.RedirectView;
import org.springframework.web.util.UriComponentsBuilder;

@RestController
@RequestMapping("/api/v1/wallet")
@RequiredArgsConstructor
public class TopUpController {

    private final TopUpService topUpService;
    private final UserRepository userRepository;
    private final VNPayProperties props;

    /** User chọn mệnh giá -> tạo đơn + trả URL VNPay để redirect. */
    @PostMapping("/topup")
    public ResponseEntity<CreateTopUpResponse> createTopUp(
            @RequestBody CreateTopUpRequest request,
            Authentication authentication,
            HttpServletRequest http
    ) {
        User user = currentUser(authentication);
        String url = topUpService.createTopUp(user, request.amount(), clientIp(http));
        return ResponseEntity.ok(new CreateTopUpResponse(url));
    }

    /** IPN server-to-server (permitAll). Trả response code theo chuẩn VNPay. */
    @GetMapping("/vnpay/ipn")
    public ResponseEntity<Map<String, String>> ipn(@RequestParam Map<String, String> params) {
        TopUpResult result = topUpService.processResult(params);
        return ResponseEntity.ok(ipnResponse(result));
    }

    /**
     * Return URL: redirect trình duyệt sau thanh toán (permitAll). Verify + xử lý idempotent rồi
     * điều hướng về FE. (Trên localhost, IPN của VNPay không gọi tới được nên return là fallback
     * ghi-có; idempotency đảm bảo không cộng tiền 2 lần. Production nên để IPN là nguồn sự thật.)
     */
    @GetMapping("/vnpay/return")
    public RedirectView vnpayReturn(@RequestParam Map<String, String> params) {
        TopUpResult result = topUpService.processResult(params);
        String status = switch (result) {
            case SUCCESS, ALREADY_CONFIRMED -> "success";
            default -> "failed";
        };
        UriComponentsBuilder redirect = UriComponentsBuilder.fromUriString(props.getFrontendReturnUrl())
                .queryParam("topup", status);
        String txnRef = params.get("vnp_TxnRef");
        if (txnRef != null && !txnRef.isBlank()) {
            redirect.queryParam("txnRef", txnRef);
        }
        return new RedirectView(redirect.build().encode().toUriString());
    }

    @GetMapping("/topups/{txnRef}/receipt")
    public TopUpReceiptResponse receipt(
            @PathVariable @Size(max = 100) String txnRef, Authentication authentication) {
        return topUpService.receipt(currentUser(authentication), txnRef);
    }

    private Map<String, String> ipnResponse(TopUpResult result) {
        return switch (result) {
            case SUCCESS, FAILED -> Map.of("RspCode", "00", "Message", "Confirm Success");
            case ALREADY_CONFIRMED -> Map.of("RspCode", "02", "Message", "Order already confirmed");
            case ORDER_NOT_FOUND -> Map.of("RspCode", "01", "Message", "Order not found");
            case INVALID_AMOUNT -> Map.of("RspCode", "04", "Message", "Invalid amount");
            case INVALID_SIGNATURE -> Map.of("RspCode", "97", "Message", "Invalid signature");
        };
    }

    private User currentUser(Authentication authentication) {
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
    }

    private String clientIp(HttpServletRequest http) {
        String forwarded = http.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return http.getRemoteAddr();
    }
}
