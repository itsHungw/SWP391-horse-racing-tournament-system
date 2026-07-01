package com.example.horseracingtournamentsystem.notification;

import com.example.horseracingtournamentsystem.notification.repository.NotificationRepository;
import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.user.repository.UserRepository;
import com.example.horseracingtournamentsystem.wallet.entity.TopUpOrder;
import com.example.horseracingtournamentsystem.wallet.entity.WithdrawalRequest;
import com.example.horseracingtournamentsystem.wallet.repository.TopUpOrderRepository;
import com.example.horseracingtournamentsystem.wallet.repository.WithdrawalRequestRepository;
import com.example.horseracingtournamentsystem.wallet.service.TopUpService;
import com.example.horseracingtournamentsystem.wallet.service.WithdrawalService;
import com.example.horseracingtournamentsystem.wallet.service.VNPayService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;
import java.util.Map;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@SpringBootTest
@Transactional
class NotificationIntegrationTest {

    @Autowired
    private WithdrawalService withdrawalService;

    @Autowired
    private TopUpService topUpService;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TopUpOrderRepository topUpOrderRepository;

    @Autowired
    private WithdrawalRequestRepository withdrawalRequestRepository;

    @MockitoBean
    private VNPayService vnPayService;

    private User user;

    @BeforeEach
    void setUp() {
        notificationRepository.deleteAll();
        withdrawalRequestRepository.deleteAll();
        topUpOrderRepository.deleteAll();
        userRepository.deleteAll();

        user = User.pending("Test Wallet User", "testwallet@example.com", "hash");
        user.verifyEmail();
        user = userRepository.save(user);

        // Mock VNPay signature verification to always succeed for testing processResult
        when(vnPayService.verifySignature(any())).thenReturn(true);
    }

    @Test
    void testWithdrawalNotifications() {
        WithdrawalRequest request1 = withdrawalRequestRepository.save(WithdrawalRequest.create(user, 100000L, "Bank Info"));

        // Test approve notification
        notificationRepository.deleteAll();
        withdrawalService.approve(request1.getId(), "testwallet@example.com");
        assertEquals(1, notificationRepository.countByRecipient_EmailAndReadAtIsNull("testwallet@example.com"));
        var notifApprove = notificationRepository.findAll().stream().filter(n -> "WITHDRAWAL_APPROVED".equals(n.getType())).findFirst().orElseThrow();
        assertEquals("WITHDRAWAL", notifApprove.getReferenceType());
        assertEquals(request1.getId(), notifApprove.getReferenceId());

        // Test reject notification
        WithdrawalRequest request2 = withdrawalRequestRepository.save(WithdrawalRequest.create(user, 100000L, "Bank Info"));
        notificationRepository.deleteAll();
        withdrawalService.reject(request2.getId(), "testwallet@example.com", "Wrong account name");
        assertEquals(1, notificationRepository.countByRecipient_EmailAndReadAtIsNull("testwallet@example.com"));
        var notifReject = notificationRepository.findAll().stream().filter(n -> "WITHDRAWAL_REJECTED".equals(n.getType())).findFirst().orElseThrow();
        assertEquals("WITHDRAWAL", notifReject.getReferenceType());
        assertEquals(request2.getId(), notifReject.getReferenceId());

        // Test markPaid notification
        WithdrawalRequest request3 = withdrawalRequestRepository.save(WithdrawalRequest.create(user, 100000L, "Bank Info"));
        withdrawalService.approve(request3.getId(), "testwallet@example.com");
        notificationRepository.deleteAll();
        withdrawalService.markPaid(request3.getId(), "testwallet@example.com");
        assertEquals(1, notificationRepository.countByRecipient_EmailAndReadAtIsNull("testwallet@example.com"));
        var notifPaid = notificationRepository.findAll().stream().filter(n -> "WITHDRAWAL_PAID".equals(n.getType())).findFirst().orElseThrow();
        assertEquals("WITHDRAWAL", notifPaid.getReferenceType());
        assertEquals(request3.getId(), notifPaid.getReferenceId());
    }

    @Test
    void testTopUpNotifications() {
        TopUpOrder order = topUpOrderRepository.save(TopUpOrder.initiate(user, 50000L, "TXN_MOCK_123"));

        notificationRepository.deleteAll();
        topUpService.processResult(Map.of(
                "vnp_TxnRef", "TXN_MOCK_123",
                "vnp_Amount", "5000000",
                "vnp_ResponseCode", "00",
                "vnp_TransactionStatus", "00"
        ));

        assertEquals(1, notificationRepository.countByRecipient_EmailAndReadAtIsNull("testwallet@example.com"));
        var notif = notificationRepository.findAll().get(0);
        assertEquals("TOPUP_SUCCESS", notif.getType());
        assertEquals("TOPUP_ORDER", notif.getReferenceType());
        assertEquals(order.getId(), notif.getReferenceId());
    }
}
