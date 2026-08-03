package com.Man10h.user_service.service.impl;

import com.Man10h.user_service.controller.exception.*;
import com.Man10h.user_service.model.entities.Role;
import com.Man10h.user_service.model.entities.User;
import com.Man10h.user_service.model.enums.Gender;
import com.Man10h.user_service.model.request.ChangePasswordRequest;
import com.Man10h.user_service.model.request.UserLoginRequest;
import com.Man10h.user_service.model.request.UserRegisterRequest;
import com.Man10h.user_service.model.request.UserUpdateRequest;
import com.Man10h.user_service.model.response.UserResponse;
import com.Man10h.user_service.model.response.UserVerificationResponse;
import com.Man10h.user_service.repository.RoleRepository;
import com.Man10h.user_service.repository.UserRepository;
import com.Man10h.user_service.service.UserService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {
    @Value("${kafka.topics.user-register-success}")
    private String topicUserRegisterSuccess;

    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper om;


    public String generateVerificationCode() {
        return new Random().nextLong(10000L) + "";
    }

    public UserResponse toUserResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getPhone(),
                user.getFullName(),
                user.getAddress(),
                user.getGender() == null ? null : user.getGender().toString(),
                user.getAvatarUrl(),
                user.getEnabled(),
                user.getCreatedAt(),
                user.getRole().getName()
        );
    }

    public User getUserById(String id) {
        Optional<User> optional = userRepository.findById(id);
        if(optional.isEmpty()){
            throw new UserNotFoundException("User not found");
        }
        return optional.get();
    }

    @Transactional
    public void registerUser(UserRegisterRequest request) {
        if(userRepository.existsByEmail(request.email())) {
            throw new AccountExistsException("Email already exists");
        }
        Role role = roleRepository.findById(1L).orElseThrow(
                () -> new RoleNotFoundException("Role not found")
        );

        String verificationCode = generateVerificationCode();
        User user = User.builder()
                .email(request.email())
                .password(request.password())
                .fullName(request.fullName())
                .role(role)
                .password(passwordEncoder.encode(request.password()))
                .enabled(false)
                .phone(request.phone())
                .verificationCode(verificationCode)
                .verificationExpiryDate(LocalDateTime.now().plusMinutes(10))
                .createdAt(LocalDateTime.now())
                .build();

        userRepository.save(user);

        //send email verification code
        UserVerificationResponse userVerificationResponse = new UserVerificationResponse(
                user.getEmail(),
                user.getEnabled(),
                user.getCreatedAt(),
                user.getVerificationCode(),
                user.getVerificationExpiryDate()
        );
        try {
            kafkaTemplate.send(topicUserRegisterSuccess, user.getId(), om.writeValueAsString(userVerificationResponse))
                    .whenComplete((res, ex) -> {
                        if(ex == null){
                            throw new GlobalException("Can not send the message");
                        }
                    });
        } catch (JsonProcessingException e) {
            throw new GlobalException(e.getMessage());
        }

    }

    @Transactional
    public boolean verifyUser(String email, String verificationCode) {
        Optional<User> optionalUser = userRepository.findByEmail(email);
        if(optionalUser.isEmpty()){
            throw new UserNotFoundException("User not found");
        }
        User user = optionalUser.get();
        if(user.isEnabled()){
            throw new AccountEnabledException("Account already enabled");
        }
        if(!user.getVerificationCode().equals(verificationCode) || LocalDateTime.now().isAfter(user.getVerificationExpiryDate())){
            return false;
        }

        user.setEnabled(true);
        user.setVerificationCode(null);
        user.setVerificationExpiryDate(null);
        userRepository.save(user);

        return true;
    }

    @Transactional
    public void resendVerificationCode(String email) {
        Optional<User> optionalUser = userRepository.findByEmail(email);
        if(optionalUser.isEmpty()){
            throw new UserNotFoundException("User not found");
        }
        User user = optionalUser.get();
        if(user.isEnabled()){
            throw new AccountEnabledException("Account already enabled");
        }
        String verificationCode = generateVerificationCode();
        user.setVerificationCode(verificationCode);
        user.setVerificationExpiryDate(LocalDateTime.now().plusMinutes(15));
        userRepository.save(user);

        //send email verification code
        UserVerificationResponse userVerificationResponse = new UserVerificationResponse(
                user.getEmail(),
                user.getEnabled(),
                user.getCreatedAt(),
                user.getVerificationCode(),
                user.getVerificationExpiryDate()
        );
        try {
            kafkaTemplate.send(topicUserRegisterSuccess, user.getId(), om.writeValueAsString(userVerificationResponse))
                    .whenComplete((res, ex) -> {
                        if(ex == null){
                            throw new GlobalException("Can not send the message");
                        }
                    });
        } catch (JsonProcessingException e) {
            throw new GlobalException(e.getMessage());
        }
    }

    @Override
    public UserResponse checkCredentials(UserLoginRequest request) {
        Optional<User> optional = userRepository.findByEmail(request.email());
        if(optional.isEmpty()){
            throw new UserNotFoundException("User not found");
        }
        User user = optional.get();
        if(!passwordEncoder.matches(request.password(), user.getPassword())){
            throw new AuthenticationFailedException("Password is incorrect");
        }
        if(!user.isEnabled()){
            throw new AccountNotEnabledException("User is not enabled");
        }
        return toUserResponse(user);
    }

    @Override
    public UserResponse getUserDetails(String id) {
        User user = getUserById(id);
        if(!user.getEnabled()){
            throw new AccountNotEnabledException("Account not enabled");
        }
        return toUserResponse(user);
    }

    @Override
    public UserResponse getUserByEmail(String email) {
        Optional<User> optional = userRepository.findByEmail(email);
        if(optional.isEmpty()){
            throw new UserNotFoundException("User not found");
        }
        User user = optional.get();
        if(!user.isEnabled()){
            throw new AccountNotEnabledException("User is not enabled");
        }
        return toUserResponse(user);
    }

    @Transactional
    public UserResponse updateUser(String userId, UserUpdateRequest request) {
        User user = getUserById(userId);
        if(!user.getEnabled()){
            throw new AccountNotEnabledException("Account not enabled");
        }

        user.setFullName(request.fullName());
        user.setAddress(request.address());
        user.setPhone(request.phone());
        user.setGender(Gender.valueOf(request.gender()));
        user.setAvatarUrl(request.avatarUrl());
        userRepository.save(user);
        return toUserResponse(user);
    }

    @Transactional
    public void changePassword(String userId, ChangePasswordRequest request) {
        User user = getUserById(userId);
        if(!user.getEnabled()){
            throw new AccountNotEnabledException("Account not enabled");
        }

        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
    }

    @Override
    public Page<UserResponse> findAllUsers(Pageable pageable) {
        return userRepository.findAll(pageable)
                .map(this::toUserResponse);
    }

    @Transactional
    public void lockUser(String userId) {
        User user = getUserById(userId);
        if(!user.getEnabled()){
            throw new AccountNotEnabledException("Account not enabled");
        }
        user.setEnabled(false);
        userRepository.save(user);
    }

    @Transactional
    public void unlockUser(String userId) {
        User user = getUserById(userId);
        if(user.getEnabled()){
            throw new AccountEnabledException("Account already enabled");
        }
        user.setEnabled(true);
        userRepository.save(user);
    }

    @Override
    public void promoteUserToOperator(String userId) {
        User user = getUserById(userId);
        if(!user.getEnabled()){
            throw new AccountNotEnabledException("Account not enabled");
        }
        Role role = roleRepository.findById(2L).orElseThrow(
                () -> new RoleNotFoundException("Role not found")
        );
        user.setRole(role);
        userRepository.save(user);
    }


}
