package com.Man10h.user_service.service;

import com.Man10h.user_service.model.entities.User;
import com.Man10h.user_service.model.request.ChangePasswordRequest;
import com.Man10h.user_service.model.request.UserLoginRequest;
import com.Man10h.user_service.model.request.UserRegisterRequest;
import com.Man10h.user_service.model.request.UserUpdateRequest;
import com.Man10h.user_service.model.response.UserResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface UserService {
    public void registerUser(UserRegisterRequest request);
    public boolean verifyUser(String email, String verificationCode);
    public UserResponse checkCredentials(UserLoginRequest request);
    public UserResponse getUserDetails(String id);
    public UserResponse getUserByEmail(String email);
    public UserResponse updateUser(String userId, UserUpdateRequest request);
    public void changePassword(String userId, ChangePasswordRequest request);
    public Page<UserResponse> findAllUsers(Pageable pageable);
    public void lockUser(String userId);
    public void unlockUser(String userId);
    public void promoteUserToOperator(String userId);
}
