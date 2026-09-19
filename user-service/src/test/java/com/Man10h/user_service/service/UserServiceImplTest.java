package com.Man10h.user_service.service;

import com.Man10h.user_service.model.entities.Role;
import com.Man10h.user_service.model.entities.User;
import com.Man10h.user_service.model.enums.Gender;
import com.Man10h.user_service.model.request.UserFilter;
import com.Man10h.user_service.model.response.UserResponse;
import com.Man10h.user_service.repository.RoleRepository;
import com.Man10h.user_service.repository.UserRepository;
import com.Man10h.user_service.service.impl.UserServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @InjectMocks
    private UserServiceImpl userService;

    private User createSampleUser(String id, String email, String fullName, String phone, Role role, boolean enabled) {
        return User.builder()
                .id(id)
                .email(email)
                .fullName(fullName)
                .phone(phone)
                .role(role)
                .enabled(enabled)
                .gender(Gender.MALE)
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("Should return all users when filter is null")
    void findAllUsers_NullFilter() {
        Role role = Role.builder().id(1L).name("USER").build();
        User user1 = createSampleUser("u1", "user1@example.com", "User One", "0900000001", role, true);
        Pageable pageable = PageRequest.of(0, 10);
        Page<User> userPage = new PageImpl<>(List.of(user1), pageable, 1);

        when(userRepository.findAll(pageable)).thenReturn(userPage);

        Page<UserResponse> result = userService.findAllUsers(null, pageable);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals("user1@example.com", result.getContent().get(0).email());
        verify(userRepository, times(1)).findAll(pageable);
        verify(userRepository, never()).findAll(any(Specification.class), any(Pageable.class));
    }

    @Test
    @DisplayName("Should return filtered users when filter criteria provided")
    void findAllUsers_WithFilter() {
        Role role = Role.builder().id(2L).name("OPERATOR").build();
        User user1 = createSampleUser("u2", "operator@example.com", "Nha Xe ABC", "0988888888", role, true);
        UserFilter filter = new UserFilter("ABC", 2L, "OPERATOR", true, "MALE");
        Pageable pageable = PageRequest.of(0, 10);
        Page<User> userPage = new PageImpl<>(List.of(user1), pageable, 1);

        when(userRepository.findAll(any(Specification.class), eq(pageable))).thenReturn(userPage);

        Page<UserResponse> result = userService.findAllUsers(filter, pageable);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals("Nha Xe ABC", result.getContent().get(0).fullName());
        assertEquals("OPERATOR", result.getContent().get(0).role());
        verify(userRepository, times(1)).findAll(any(Specification.class), eq(pageable));
    }
}
