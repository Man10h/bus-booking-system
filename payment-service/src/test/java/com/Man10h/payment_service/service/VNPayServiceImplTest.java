package com.Man10h.payment_service.service;

import com.Man10h.payment_service.model.entities.Merchant;
import com.Man10h.payment_service.model.entities.OutboxEvent;
import com.Man10h.payment_service.model.entities.Payment;
import com.Man10h.payment_service.model.enums.PaymentStatus;
import com.Man10h.payment_service.model.enums.Provider;
import com.Man10h.payment_service.repository.MerchantRepository;
import com.Man10h.payment_service.repository.OutboxRepository;
import com.Man10h.payment_service.repository.PaymentRepository;
import com.Man10h.payment_service.service.impl.VNPayServiceImpl;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class VNPayServiceImplTest {

    @Mock
    private PaymentRepository paymentRepository;
    @Mock
    private ObjectMapper objectMapper;
    @Mock
    private MerchantRepository merchantRepository;
    @Mock
    private OutboxRepository outboxRepository;

    @InjectMocks
    private VNPayServiceImpl vnPayService;

    private Merchant merchant;
    private Payment payment;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(vnPayService, "returnUrl", "http://localhost:8080/payments/vnpay/return");
        ReflectionTestUtils.setField(vnPayService, "paymentUrl", "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html");
        ReflectionTestUtils.setField(vnPayService, "paymentSuccessTopic", "payment-success");
        ReflectionTestUtils.setField(vnPayService, "paymentFailedTopic", "payment-failed");

        merchant = Merchant.builder()
                .id("merchant-uuid-1")
                .merchantCode("VNPAY_TEST_MERCHANT")
                .secretKey("SECRET_KEY_1234567890")
                .build();

        payment = Payment.builder()
                .id("pay-uuid-100")
                .userId("usr-1")
                .amount(BigDecimal.valueOf(200000))
                .status(PaymentStatus.PENDING)
                .provider(Provider.VNPAY)
                .txnRef("TXN_REF_999")
                .bookingId(50L)
                .merchant(merchant)
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("Should generate valid VNPay payment checkout URL with secure hash")
    void createPaymentUrl_Success() {
        String checkoutUrl = vnPayService.createPaymentUrl(payment);

        assertNotNull(checkoutUrl);
        assertTrue(checkoutUrl.startsWith("https://sandbox.vnpayment.vn/paymentv2/vpcpay.html"));
        assertTrue(checkoutUrl.contains("vnp_TmnCode=VNPAY_TEST_MERCHANT"));
        assertTrue(checkoutUrl.contains("vnp_Amount=20000000")); // Amount * 100
        assertTrue(checkoutUrl.contains("vnp_SecureHash="));
    }

    @Test
    @DisplayName("Should successfully process valid IPN callback and create outbox event")
    void processIpn_Success() throws Exception {
        Map<String, String> params = new HashMap<>();
        params.put("vnp_TmnCode", "VNPAY_TEST_MERCHANT");
        params.put("vnp_TxnRef", "TXN_REF_999");
        params.put("vnp_Amount", "20000000");
        params.put("vnp_ResponseCode", "00");
        params.put("vnp_TransactionStatus", "00");
        params.put("vnp_TransactionNo", "VNP_123456");

        // Calculate valid checksum manually for test params
        String hashData = "vnp_Amount=20000000&vnp_ResponseCode=00&vnp_TmnCode=VNPAY_TEST_MERCHANT&vnp_TransactionNo=VNP_123456&vnp_TransactionStatus=00&vnp_TxnRef=TXN_REF_999";

        // SecretKey: SECRET_KEY_1234567890
        // Use method to generate valid expected hash
        javax.crypto.Mac hmac512 = javax.crypto.Mac.getInstance("HmacSHA512");
        javax.crypto.spec.SecretKeySpec secretKey = new javax.crypto.spec.SecretKeySpec(
                "SECRET_KEY_1234567890".getBytes(java.nio.charset.StandardCharsets.UTF_8), "HmacSHA512");
        hmac512.init(secretKey);
        byte[] bytes = hmac512.doFinal(hashData.getBytes(java.nio.charset.StandardCharsets.UTF_8));
        StringBuilder hash = new StringBuilder();
        for (byte b : bytes) {
            hash.append(String.format("%02x", b));
        }
        params.put("vnp_SecureHash", hash.toString());

        when(merchantRepository.findByMerchantCode("VNPAY_TEST_MERCHANT")).thenReturn(Optional.of(merchant));
        when(paymentRepository.findByTxnRef("TXN_REF_999")).thenReturn(Optional.of(payment));
        when(objectMapper.writeValueAsString(any())).thenReturn("{\"paymentId\":100}");

        vnPayService.processIpn(params);

        assertEquals(PaymentStatus.SUCCESS, payment.getStatus());
        assertEquals("VNP_123456", payment.getTransactionId());
        verify(outboxRepository, times(1)).save(any(OutboxEvent.class));
        verify(paymentRepository, times(1)).save(payment);
    }

    @Test
    @DisplayName("Should throw IllegalArgumentException when IPN checksum is invalid")
    void processIpn_InvalidChecksum() {
        Map<String, String> params = new HashMap<>();
        params.put("vnp_TmnCode", "VNPAY_TEST_MERCHANT");
        params.put("vnp_TxnRef", "TXN_REF_999");
        params.put("vnp_SecureHash", "INVALID_CHECKSUM_HASH");

        when(merchantRepository.findByMerchantCode("VNPAY_TEST_MERCHANT")).thenReturn(Optional.of(merchant));

        assertThrows(IllegalArgumentException.class, () -> vnPayService.processIpn(params));
        verify(paymentRepository, never()).save(any());
        verify(outboxRepository, never()).save(any());
    }
}
