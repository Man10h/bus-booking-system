package com.Man10h.core_service.util;

import com.Man10h.core_service.model.entities.Seat;
import com.Man10h.core_service.model.entities.VehicleType;
import com.Man10h.core_service.model.enums.SeatStatus;
import com.Man10h.core_service.model.enums.SeatType;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class SeatGenerator {

    public List<Seat> generate(VehicleType type) {
        return seat(type);
    }

    private List<Seat> seat(VehicleType type) {
        List<Seat> seats = new ArrayList<>();

        int number = 1;
        for(int floor = 1; floor <= type.getFloors(); floor++) {
            for (int row = 1; row <= type.getRows(); row++) {
                for (int col = 1; col <= type.getCols(); col++) {
                    seats.add(createSeat(number++, floor, row, col, false, type.getSeatType()));
                }
            }
        }

        return seats;
    }


    private Seat createSeat(
            int number,
            int floor,
            int row,
            int col,
            boolean vip,
            SeatType type
    ) {
        return Seat.builder()
                .seatNumber(String.format("%02d", number))
                .floor((long) floor)
                .row((long) row)
                .col((long) col)
                .isVip(vip)
                .seatType(type)
                .status(SeatStatus.ACTIVE)
                .build();
    }

}
