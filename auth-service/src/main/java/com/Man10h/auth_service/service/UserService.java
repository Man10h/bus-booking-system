package com.Man10h.auth_service.service;

import com.Man10h.auth_service.model.response.ApiResponse;
import com.Man10h.auth_service.model.response.UserResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;

@FeignClient(name = "user-service", url = "${service.users.url}")
public interface UserService {


    @GetMapping("/{userId}")
    public ResponseEntity<ApiResponse<UserResponse>> getUser(@PathVariable String userId,
                                                             @RequestHeader("Authorization") String bearerToken);

}
