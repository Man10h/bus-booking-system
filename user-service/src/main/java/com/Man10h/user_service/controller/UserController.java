package com.Man10h.user_service.controller;

import com.Man10h.user_service.model.request.ChangePasswordRequest;
import com.Man10h.user_service.model.request.UserLoginRequest;
import com.Man10h.user_service.model.request.UserRegisterRequest;
import com.Man10h.user_service.model.request.UserUpdateRequest;
import com.Man10h.user_service.model.response.ApiResponse;
import com.Man10h.user_service.model.response.UserResponse;
import com.Man10h.user_service.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<?>> register(@RequestBody @Valid UserRegisterRequest request) {
        if(!request.password().equals(request.rePassword())){
            return ResponseEntity.badRequest().build();
        }
        userService.registerUser(request);
        return ResponseEntity.ok(new ApiResponse<>(null, "success", 201));
    }

    @GetMapping("/verify")
    public ResponseEntity<ApiResponse<Boolean>> verify(@RequestParam String email,
                                                 @RequestParam String verificationCode) {
        Boolean data = userService.verifyUser(email, verificationCode);
        return ResponseEntity.ok(new ApiResponse<>(data, "success", 200));
    }

    @PostMapping("/check-credentials")
    public ResponseEntity<ApiResponse<UserResponse>> checkCredentials(@RequestBody @Valid UserLoginRequest request) {
        UserResponse data = userService.checkCredentials(request);
        return ResponseEntity.ok(new ApiResponse<>(data, "success", 200));
    }

    @PreAuthorize("hasRole('USER')")
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> me(@AuthenticationPrincipal Jwt jwt) {
        UserResponse data = userService.getUserDetails(jwt.getSubject());
        return ResponseEntity.ok(new ApiResponse<>(data, "success", 200));
    }

    @PreAuthorize("hasRole('USER')")
    @PutMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> updateUser(@RequestBody @Valid UserUpdateRequest request,
                                                                @AuthenticationPrincipal Jwt jwt) {
        UserResponse data = userService.updateUser(jwt.getSubject(), request);
        return ResponseEntity.ok(new ApiResponse<>(data, "success", 200));
    }

    @PreAuthorize("hasRole('USER')")
    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse<?>> changePassword(@RequestBody @Valid ChangePasswordRequest request,
                                                         @AuthenticationPrincipal Jwt jwt) {
        if(!request.newPassword().equals(request.confirmPassword())){
            return ResponseEntity.badRequest().build();
        }
        userService.changePassword(jwt.getSubject(), request);
        return ResponseEntity.ok(new ApiResponse<>(null, "success", 200));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/{userId}")
    public ResponseEntity<ApiResponse<UserResponse>> getUser(@PathVariable String userId) {
        UserResponse data = userService.getUserDetails(userId);
        return ResponseEntity.ok(new ApiResponse<>(data, "success", 200));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public ResponseEntity<ApiResponse<Page<UserResponse>>> findAllUsers(
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "10") int size) {
        Page<UserResponse> data = userService.findAllUsers(PageRequest.of(page, size));
        return ResponseEntity.ok(new ApiResponse<>(data, "success", 200));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{userId}/lock")
    public ResponseEntity<ApiResponse<UserResponse>> lockUser(@PathVariable String userId) {
        userService.lockUser(userId);
        return ResponseEntity.ok(new ApiResponse<>(null, "success", 200));
    }

    @PatchMapping("/{userId}/promote-operator")
    public ResponseEntity<ApiResponse<?>> promoteUserToOperator(@PathVariable String userId) {
        userService.promoteUserToOperator(userId);
        return ResponseEntity.ok(new ApiResponse<>(null, "success", 200));
    }
}
