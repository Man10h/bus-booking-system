package com.Man10h.payment_service.service.impl;

import com.Man10h.payment_service.controller.exceptions.MerchantNotFound;
import com.Man10h.payment_service.model.entities.Merchant;
import com.Man10h.payment_service.model.entities.OutboxEvent;
import com.Man10h.payment_service.model.entities.Payment;
import com.Man10h.payment_service.model.enums.OutboxStatus;
import com.Man10h.payment_service.model.enums.PaymentStatus;
import com.Man10h.payment_service.model.enums.Provider;
import com.Man10h.payment_service.model.response.PaymentResponse;
import com.Man10h.payment_service.repository.MerchantRepository;
import com.Man10h.payment_service.repository.OutboxRepository;
import com.Man10h.payment_service.repository.PaymentRepository;
import com.Man10h.payment_service.service.PaymentMethod;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Iterator;
import java.util.Map;
import java.util.TreeMap;

@Service
@RequiredArgsConstructor
public class VNPayServiceImpl implements PaymentMethod {


    @Value("${payment.providers.VNPAY.returnlUrl}")
    private String returnUrl;

    @Value("${payment.providers.VNPAY.paymentUrl}")
    private String paymentUrl;

    @Value("${kafka.topics.payment-success}")
    private String paymentSuccessTopic;

    @Value("${kafka.topics.payment-failed}")
    private String paymentFailedTopic;

    private final PaymentRepository paymentRepository;
    private final ObjectMapper objectMapper;
    private final MerchantRepository merchantRepository;
    private final OutboxRepository outboxRepository;

    public PaymentResponse toPaymentResponse(Payment payment) {
        return new PaymentResponse(
                payment.getId(),
                payment.getAmount(),
                payment.getStatus(),
                payment.getProvider(),
                payment.getTransactionId(),
                payment.getTxnRef(),
                payment.getCreatedAt(),
                payment.getPaidAt(),
                payment.getBookingId()
        );
    }

    public String getClientIp(HttpServletRequest request) {

        String ip = request.getHeader("X-Forwarded-For");

        if (ip != null && !ip.isBlank() && !"unknown".equalsIgnoreCase(ip)) {
            return ip.split(",")[0].trim();
        }

        ip = request.getHeader("X-Real-IP");

        if (ip != null && !ip.isBlank() && !"unknown".equalsIgnoreCase(ip)) {
            return ip;
        }

        return request.getRemoteAddr();
    }

    @Override
    public Provider getProvider() {
        return Provider.VNPAY;
    }

    @Override
    public String createPaymentUrl(Payment payment) {

        Merchant merchant = payment.getMerchant();

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expire = now.plusMinutes(15);

        DateTimeFormatter formatter =
                DateTimeFormatter.ofPattern("yyyyMMddHHmmss");

        TreeMap<String, String> params = new TreeMap<>();

        params.put("vnp_Version", "2.1.0");
        params.put("vnp_Command", "pay");
        params.put("vnp_TmnCode", merchant.getMerchantCode());

        params.put(
                "vnp_Amount",
                payment.getAmount()
                        .multiply(BigDecimal.valueOf(100))
                        .toBigInteger()
                        .toString()
        );

        params.put("vnp_CurrCode", "VND");
        params.put("vnp_TxnRef", payment.getTxnRef());

        params.put(
                "vnp_OrderInfo",
                "Thanh toan booking " + payment.getBookingId()
        );

        params.put("vnp_OrderType", "other");
        params.put("vnp_Locale", "vn");

        params.put("vnp_ReturnUrl", returnUrl);

        // TODO: Lấy IP thật của client
//        params.put("vnp_IpAddr", "127.0.0.1");

        params.put("vnp_IpAddr", "127.0.0.1");
        params.put("vnp_CreateDate", now.format(formatter));
        params.put("vnp_ExpireDate", expire.format(formatter));

        String hashData = buildQuery(params, true);

        String secureHash = hmacSHA512(
                merchant.getSecretKey(),
                hashData
        );

        params.put("vnp_SecureHash", secureHash);


        System.out.println(hashData);
        System.out.println(secureHash);

        return paymentUrl + "?" + buildQuery(params, true);
    }

    @Override
    @Transactional
    public void processIpn(Map<String, String> params) {

        String secureHash = params.remove("vnp_SecureHash");
        params.remove("vnp_SecureHashType");

        String hashData = buildQuery(new TreeMap<>(params), true);

        Merchant merchant = merchantRepository.findByMerchantCode(params.get("vnp_TmnCode"))
                .orElseThrow(() -> new MerchantNotFound("Merchant not found"));

        String calculatedHash = hmacSHA512(
                merchant.getSecretKey(),
                hashData
        );

        if (!calculatedHash.equalsIgnoreCase(secureHash)) {
            throw new IllegalArgumentException("Invalid checksum");
        }

        String txnRef = params.get("vnp_TxnRef");

        Payment payment = paymentRepository.findByTxnRef(txnRef)
                .orElseThrow(() -> new RuntimeException("Payment not found"));

        if (!payment.getAmount()
                .multiply(BigDecimal.valueOf(100))
                .toBigInteger()
                .toString()
                .equals(params.get("vnp_Amount"))) {

            throw new IllegalArgumentException("Invalid amount");
        }

        if ("00".equals(params.get("vnp_ResponseCode"))
                && "00".equals(params.get("vnp_TransactionStatus"))) {

            payment.setStatus(PaymentStatus.SUCCESS);
            payment.setTransactionId(params.get("vnp_TransactionNo"));
            payment.setPaidAt(LocalDateTime.now());

            PaymentResponse paymentResponse = toPaymentResponse(payment);
            //push message
            try {
                OutboxEvent event = OutboxEvent.builder()
                        .source("payment")
                        .createdAt(LocalDateTime.now())
                        .eventType(paymentSuccessTopic)
                        .payload(objectMapper.writeValueAsString(paymentResponse))
                        .aggregateType("booking")
                        .aggregateId(paymentResponse.bookingId())
                        .retryCount(0)
                        .status(OutboxStatus.PENDING)
                        .build();

                outboxRepository.save(event);
            } catch (JsonProcessingException e) {
                throw new RuntimeException(e);
            }
        } else {

            payment.setStatus(PaymentStatus.FAILED);
            PaymentResponse paymentResponse = toPaymentResponse(payment);
            //push message
            try {
                OutboxEvent event = OutboxEvent.builder()
                        .source("payment")
                        .createdAt(LocalDateTime.now())
                        .eventType(paymentFailedTopic)
                        .aggregateType("booking")
                        .aggregateId(paymentResponse.bookingId())
                        .payload(objectMapper.writeValueAsString(paymentResponse))
                        .status(OutboxStatus.PENDING)
                        .retryCount(0)
                        .build();

                outboxRepository.save(event);
            } catch (JsonProcessingException e) {
                throw new RuntimeException(e);
            }
        }
        paymentRepository.save(payment);
    }

    private String buildQuery(Map<String, String> params, boolean encode) {

        StringBuilder sb = new StringBuilder();

        try {

            Iterator<Map.Entry<String, String>> iterator = params.entrySet().iterator();

            while (iterator.hasNext()) {

                Map.Entry<String, String> entry = iterator.next();

                String key = entry.getKey();
                String value = entry.getValue();

                if (encode) {
                    sb.append(URLEncoder.encode(key, StandardCharsets.US_ASCII))
                            .append("=")
                            .append(URLEncoder.encode(value, StandardCharsets.US_ASCII));
                } else {
                    sb.append(key)
                            .append("=")
                            .append(value);
                }

                if (iterator.hasNext()) {
                    sb.append("&");
                }
            }

        } catch (Exception e) {
            throw new RuntimeException(e);
        }

        return sb.toString();
    }

    private String hmacSHA512(String key, String data) {

        try {

            Mac hmac512 = Mac.getInstance("HmacSHA512");

            SecretKeySpec secretKey = new SecretKeySpec(
                    key.getBytes(StandardCharsets.UTF_8),
                    "HmacSHA512");

            hmac512.init(secretKey);

            byte[] bytes = hmac512.doFinal(data.getBytes(StandardCharsets.UTF_8));

            StringBuilder hash = new StringBuilder();

            for (byte b : bytes) {
                hash.append(String.format("%02x", b));
            }

            return hash.toString();

        } catch (Exception e) {
            throw new RuntimeException("Cannot generate HMAC SHA512", e);
        }
    }
}