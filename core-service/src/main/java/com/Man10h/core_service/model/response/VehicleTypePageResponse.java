package com.Man10h.core_service.model.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.List;

@Getter
@AllArgsConstructor
@NoArgsConstructor
public class VehicleTypePageResponse implements Serializable {
    private List<VehicleTypeResponse> content;
    private long totalElements;
    private int totalPages;
    private int page;
    private int size;
}
