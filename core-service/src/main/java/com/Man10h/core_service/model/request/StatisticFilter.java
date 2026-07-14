package com.Man10h.core_service.model.request;

import com.Man10h.core_service.model.enums.StatisticType;

import java.time.LocalDate;

public record StatisticFilter(

        LocalDate from,

        LocalDate to,

        StatisticType statisticType
) {}