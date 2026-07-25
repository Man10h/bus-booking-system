package com.Man10h.core_service.controller;

import com.Man10h.core_service.model.enums.SeatType;
import com.Man10h.core_service.model.request.*;
import com.Man10h.core_service.model.response.ApiResponse;
import com.Man10h.core_service.model.response.SeatResponse;
import com.Man10h.core_service.model.response.VehicleResponse;
import com.Man10h.core_service.model.response.VehicleTypeResponse;
import com.Man10h.core_service.service.VehicleService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RequestMapping("/core")
@RestController
@RequiredArgsConstructor
public class VehicleController {

    private final VehicleService vehicleService;

    @PreAuthorize("hasRole('OPERATOR')")
    @GetMapping("/vehicles/{vehicleId}")
    public ResponseEntity<ApiResponse<VehicleResponse>> getVehicleDetail(@PathVariable Long vehicleId) {
        VehicleResponse data = vehicleService.getVehicleDetail(vehicleId);
        return ResponseEntity.ok(new ApiResponse<>(data, "success", 200));
    }

    @PreAuthorize("hasRole('OPERATOR')")
    @GetMapping("/vehicles")
    public ResponseEntity<ApiResponse<Page<VehicleResponse>>> getVehicles(@RequestParam(name = "page", defaultValue = "0") int page,
                                                                          @RequestParam(name = "size", defaultValue = "10") int size,
                                                                          @AuthenticationPrincipal Jwt jwt) {
        Page<VehicleResponse> data = vehicleService.getOperatorsVehicles(jwt.getSubject(), PageRequest.of(page, size));
        return ResponseEntity.ok(new ApiResponse<>(data, "success", 200));
    }

    @PreAuthorize("hasRole('OPERATOR')")
    @PostMapping("/vehicles")
    public ResponseEntity<ApiResponse<VehicleResponse>> createVehicle(@RequestBody @Valid CreateVehicleRequest request,
                                                                      @AuthenticationPrincipal Jwt jwt) {
        VehicleResponse data = vehicleService.createVehicle(jwt.getSubject(), request);
        return ResponseEntity.ok(new ApiResponse<>(data, "success", 201));
    }

    @PreAuthorize("hasRole('OPERATOR')")
    @PutMapping("/vehicles/{vehicleId}")
    public ResponseEntity<ApiResponse<?>> updateVehicle(
            @PathVariable Long vehicleId,
            @RequestBody @Valid UpdateVehicleRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        vehicleService.updateVehicle(vehicleId, jwt.getSubject(), request);
        return ResponseEntity.ok(new ApiResponse<>(null, "success", 200));
    }

    @PreAuthorize("hasRole('OPERATOR')")
    @PatchMapping("/vehicles/{vehicleId}/status")
    public ResponseEntity<ApiResponse<?>> updateVehicleStatus(@RequestBody @NotBlank String status,
                                                              @AuthenticationPrincipal Jwt jwt,
                                                              @PathVariable Long vehicleId) {
        vehicleService.updateVehicleStatus(vehicleId, jwt.getSubject(), status);
        return ResponseEntity.ok(new ApiResponse<>(null, "success", 200));
    }


    @PreAuthorize("hasRole('OPERATOR')")
    @GetMapping("/vehicles/{vehicleId}/seats")
    public ResponseEntity<ApiResponse<List<SeatResponse>>> getVehicleSeats(@PathVariable Long vehicleId,
                                                                           @AuthenticationPrincipal Jwt jwt) {
        List<SeatResponse> data = vehicleService.getVehicleSeats(vehicleId, jwt.getSubject());
        return ResponseEntity.ok(new ApiResponse<>(data, "success", 200));
    }

    @PreAuthorize("hasRole('OPERATOR')")
    @PatchMapping("/seats/{seatId}/status")
    public ResponseEntity<ApiResponse<?>> updateSeatStatus(@PathVariable Long seatId,
                                                           @AuthenticationPrincipal Jwt jwt,
                                                           @RequestBody @Valid UpdateSeatStatusRequest request){
        vehicleService.updateSeatStatus(seatId, jwt.getSubject(), request.status());
        return ResponseEntity.ok(new ApiResponse<>(null, "success", 200));
    }

    @PreAuthorize("hasRole('OPERATOR')")
    @PatchMapping("/seats/{seatId}/isVip")
    public ResponseEntity<ApiResponse<?>> updateSeatVipStatus(@PathVariable Long seatId,
                                                              @AuthenticationPrincipal Jwt jwt){
        vehicleService.updateSeatVipStatus(seatId, jwt.getSubject());
        return ResponseEntity.ok(new ApiResponse<>(null, "success", 200));
    }

    @PreAuthorize("hasAnyRole('OPERATOR', 'ADMIN')")
    @GetMapping("/vehicleTypes")
    public ResponseEntity<ApiResponse<List<VehicleTypeResponse>>> getVehicleTypes() {
        List<VehicleTypeResponse> data = vehicleService.getAllVehicleTypes();
        return ResponseEntity.ok(new ApiResponse<>(data, "success", 200));
    }

    @PreAuthorize("hasAnyRole('ADMIN')")
    @PostMapping("/vehicleTypes")
    public ResponseEntity<ApiResponse<VehicleTypeResponse>> createVehicleType(@RequestBody @Valid CreateVehicleTypeRequest request){
        VehicleTypeResponse data = vehicleService.createVehicleType(request);
        return ResponseEntity.ok(new ApiResponse<>(data, "success", 200));
    }

    @PreAuthorize("hasAnyRole('ADMIN')")
    @PutMapping("/vehicleTypes/{vehicleTypeId}")
    public ResponseEntity<ApiResponse<?>> updateVehicleType(@PathVariable Long vehicleTypeId,
                                                            @RequestBody @Valid UpdateVehicleTypeRequest request){
        vehicleService.updateVehicleType(vehicleTypeId, request);
        return ResponseEntity.ok(new ApiResponse<>(null, "success", 200));
    }

    @PreAuthorize("hasAnyRole('ADMIN')")
    @DeleteMapping("/vehicleTypes/{vehicleTypeId}")
    public ResponseEntity<ApiResponse<?>> deleteVehicleType(@PathVariable Long vehicleTypeId) {
        vehicleService.deleteVehicleType(vehicleTypeId);
        return ResponseEntity.ok(new ApiResponse<>(null, "success", 200));
    }

    @PreAuthorize("hasAnyRole('ADMIN')")
    @GetMapping("/seatType")
    public ResponseEntity<ApiResponse<List<SeatType>>> getSeatTypes() {
        List<SeatType> data = List.of(SeatType.SEAT, SeatType.BED);
        return ResponseEntity.ok(new ApiResponse<>(data, "success", 200));
    }
}
