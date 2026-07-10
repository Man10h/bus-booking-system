package com.Man10h.payment_service.service.impl;

import com.Man10h.payment_service.controller.exceptions.InvalidBookingException;
import com.Man10h.payment_service.controller.exceptions.InvalidAccessException;
import com.Man10h.payment_service.controller.exceptions.MerchantInActiveException;
import com.Man10h.payment_service.controller.exceptions.MerchantNotFound;
import com.Man10h.payment_service.model.entities.Merchant;
import com.Man10h.payment_service.model.entities.Payment;
import com.Man10h.payment_service.model.enums.BookingStatus;
import com.Man10h.payment_service.model.enums.PaymentStatus;
import com.Man10h.payment_service.model.enums.Provider;
import com.Man10h.payment_service.model.request.CreatePaymentRequest;
import com.Man10h.payment_service.model.request.ServiceTokenRequest;
import com.Man10h.payment_service.model.response.ApiResponse;
import com.Man10h.payment_service.model.response.BookingSummaryResponse;
import com.Man10h.payment_service.model.response.PaymentResponse;
import com.Man10h.payment_service.repository.MerchantRepository;
import com.Man10h.payment_service.repository.PaymentRepository;
import com.Man10h.payment_service.service.AuthService;
import com.Man10h.payment_service.service.CoreService;
import com.Man10h.payment_service.service.PaymentMethod;
import com.Man10h.payment_service.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.RandomStringUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Objects;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {


    @Value("${services.payment.clientId}")
    private String clientId;

    @Value("${services.payment.clientSecret}")
    private String clientSecret;

    @Value("${services.payment.scope}")
    private String scope;

    private final CoreService coreService;
    private final AuthService authService;
    private final MerchantRepository merchantRepository;
    private final PaymentRepository paymentRepository;
    private final PaymentMethodFactory paymentMethodFactory;

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

    @Override
    public String createPayment(String userId, CreatePaymentRequest createPaymentRequest) {
        ServiceTokenRequest serviceTokenRequest = new ServiceTokenRequest("client_credentials",clientId, clientSecret, scope);
        ResponseEntity<ApiResponse<String>> tokenResponse = authService.serviceToken(serviceTokenRequest);

        if(tokenResponse.getStatusCode().is2xxSuccessful()) {
            String token = Objects.requireNonNull(tokenResponse.getBody()).data();

            ResponseEntity<ApiResponse<BookingSummaryResponse>> bookingSummaryResponse = coreService.getBookingById(createPaymentRequest.bookingId(), "Bearer " + token);

            if(bookingSummaryResponse.getStatusCode().is2xxSuccessful()) {
                BookingSummaryResponse data = bookingSummaryResponse.getBody().data();
                if(!data.userId().equals(userId)) {
                    throw new InvalidAccessException("You do not owned this booking");
                }
                if(data.paymentDeadline().isBefore(LocalDateTime.now())) {
                    throw new InvalidBookingException("Booking paid expired");
                }
                if(!data.status().equals(BookingStatus.PENDING_PAYMENT)) {
                    throw new InvalidBookingException("Booking is not in pending");
                }
                Optional<Merchant> optionalMerchant = merchantRepository.findByProviderAndOperatorId(
                        Provider.valueOf(createPaymentRequest.provider()),
                        data.operatorId()
                );
                if(optionalMerchant.isEmpty()) {
                    throw new MerchantNotFound("Merchant not found");
                }
                if(!optionalMerchant.get().getActive()){
                    throw new MerchantInActiveException("Merchant inactive");
                }
                Payment payment = Payment.builder()
                        .merchant(optionalMerchant.get())
                        .bookingId(createPaymentRequest.bookingId())
                        .provider(Provider.valueOf(createPaymentRequest.provider()))
                        .amount(data.totalAmount())
                        .txnRef(LocalDateTime.now()
                                .format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"))
                                + RandomStringUtils.randomNumeric(6))
                        .createdAt(LocalDateTime.now())
                        .status(PaymentStatus.PENDING)
                        .build();
                paymentRepository.save(payment);

                PaymentMethod paymentMethod = paymentMethodFactory.getPaymentMethod(
                        Provider.valueOf(createPaymentRequest.provider())
                );

                return paymentMethod.createPaymentUrl(payment);
            }
        }
        return "";
    }

    @Override
    public Page<PaymentResponse> getUserPayments(String userId, Pageable pageable) {
        return paymentRepository.findByUserId(userId, pageable)
                .map(this::toPaymentResponse);
    }


}
