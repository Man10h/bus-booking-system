package com.Man10h.core_service.model.response;

import com.Man10h.core_service.model.enums.BookingStatus;
import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class BookingSummaryResponse  implements Serializable {
    private Long id;
    private String userId;
    private String operatorId;
    private String bookingCode;
    private BigDecimal totalAmount;
    private LocalDateTime paymentDeadline;
    private LocalDateTime createAt;
    private BookingStatus status;

}
