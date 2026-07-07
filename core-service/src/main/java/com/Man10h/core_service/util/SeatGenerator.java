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
        return switch (type.getCode()) {
            case "LIMOUSINE_9" -> limousine9();
            case "SEAT_16" -> seat16();
            case "SEAT_28" -> seat28();
            case "SLEEPER_40" -> sleeper40();
            default -> throw new IllegalStateException("Unexpected value: " + type.getName());
        };
    }

    private List<Seat> limousine9() {
        List<Seat> seats = new ArrayList<>();

        int number = 1;
        for (int row = 1; row <= 3; row++) {
            for (int col = 1; col <= 3; col++) {
                seats.add(createSeat(number++, 1, row, col, true, SeatType.SEAT));
            }
        }

        return seats;
    }

    private List<Seat> seat16() {
        List<Seat> seats = new ArrayList<>();

        int number = 1;
        for (int row = 1; row <= 4; row++) {
            for (int col = 1; col <= 4; col++) {
                seats.add(createSeat(number++, 1, row, col, false, SeatType.SEAT));
            }
        }

        return seats;
    }

    private List<Seat> sleeper34() {
        List<Seat> seats = new ArrayList<>();

        int number = 1;

        // Tầng 1: 17 giường
        number = generateSleeperFloor(seats, number, 1, 17);

        // Tầng 2: 17 giường
        generateSleeperFloor(seats, number, 2, 17);

        return seats;
    }

    private List<Seat> sleeper40() {
        List<Seat> seats = new ArrayList<>();

        int number = 1;

        // Tầng 1: 20 giường
        number = generateSleeperFloor(seats, number, 1, 20);

        // Tầng 2: 20 giường
        generateSleeperFloor(seats, number, 2, 20);

        return seats;
    }

    private int generateSleeperFloor(
            List<Seat> seats,
            int startNumber,
            int floor,
            int count
    ) {
        int number = startNumber;

        int row = 1;
        int col = 1;

        for (int i = 0; i < count; i++) {

            seats.add(createSeat(
                    number++,
                    floor,
                    row,
                    col,
                    false,
                    SeatType.BED
            ));

            col++;

            if (col > 3) {
                col = 1;
                row++;
            }
        }

        return number;
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

    private List<Seat> seat28() {
        List<Seat> seats = new ArrayList<>();

        int number = 1;

        for (int row = 1; row <= 7; row++) {
            for (int col = 1; col <= 4; col++) {
                seats.add(createSeat(
                        number++,
                        1,
                        row,
                        col,
                        false,
                        SeatType.SEAT
                ));
            }
        }

        return seats;
    }
}
