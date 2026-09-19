package com.Man10h.core_service.service;

import com.Man10h.core_service.model.request.*;
import com.Man10h.core_service.model.response.SeatResponse;
import com.Man10h.core_service.model.response.VehicleResponse;
import com.Man10h.core_service.model.response.VehicleTypePageResponse;
import com.Man10h.core_service.model.response.VehicleTypeResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface VehicleService {
    public VehicleResponse createVehicle(String userId, CreateVehicleRequest request);
    public VehicleResponse getVehicleDetail(Long id);
    public Page<VehicleResponse> getOperatorsVehicles(String userId, Pageable pageable);
    public void updateVehicle(Long id, String userId, UpdateVehicleRequest request);
    public void updateVehicleStatus(Long id, String userId, String status);
    public List<SeatResponse> getVehicleSeats(Long id, String userId);
    public void updateSeatStatus(Long id, String userId, String status);
    public void updateSeatVipStatus(Long id, String userId);

    public VehicleTypePageResponse findVehicleTypes(VehicleTypeFilter filter, Pageable pageable);
    public List<VehicleTypeResponse> getAllVehicleTypes();
    public VehicleTypeResponse createVehicleType(CreateVehicleTypeRequest request);
    public void updateVehicleType(Long id, UpdateVehicleTypeRequest request);
    public void deleteVehicleType(Long id);
}
