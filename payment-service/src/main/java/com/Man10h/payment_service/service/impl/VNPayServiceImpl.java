package com.Man10h.payment_service.service.impl;

import com.Man10h.payment_service.model.entities.Merchant;
import com.Man10h.payment_service.model.entities.Payment;
import com.Man10h.payment_service.model.request.CreatePaymentRequest;
import com.Man10h.payment_service.service.VNPayService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

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
public class VNPayServiceImpl implements VNPayService {

    @Value("${payment.providers.VNPAY.returnlUrl}")
    private String returnUrl;

    @Value("${payment.providers.VNPAY.paymentUrl}")
    private String paymentUrl;

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

        String hashData = buildQuery(params, false);

        String secureHash = hmacSHA512(
                merchant.getSecretKey(),
                hashData
        );

        params.put("vnp_SecureHash", secureHash);

        return paymentUrl + "?" + buildQuery(params, true);
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