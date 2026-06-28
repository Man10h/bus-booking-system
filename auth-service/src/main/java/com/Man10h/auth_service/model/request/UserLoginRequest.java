package com.Man10h.auth_service.model.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;

public record UserLoginRequest(
        @Email
        String email,

        @NotNull
        String password
){
}
