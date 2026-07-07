package com.Man10h.auth_service.service.impl;

import com.Man10h.auth_service.controller.exception.GlobalException;
import com.Man10h.auth_service.controller.exception.InvalidClientIdException;
import com.Man10h.auth_service.controller.exception.InvalidScopeException;
import com.Man10h.auth_service.controller.exception.ServiceClientNotFoundException;
import com.Man10h.auth_service.model.entities.ServiceClient;
import com.Man10h.auth_service.model.request.ServiceTokenRequest;
import com.Man10h.auth_service.model.response.UserResponse;
import com.Man10h.auth_service.repository.ServiceClientRepository;
import com.Man10h.auth_service.service.TokenService;
import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.RSASSASigner;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.PrivateKey;
import java.util.Date;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class TokenServiceImpl implements TokenService {


    private final PrivateKey privateKey;
    private final ServiceClientRepository serviceClientRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public String generateUserToken(UserResponse userResponse) {
        JWTClaimsSet claim = new JWTClaimsSet.Builder()
                .subject(userResponse.id())
                .claim("roles", List.of(userResponse.role()))
                .claim("scope", "")
                .claim("token_type", "user")
                .expirationTime(new Date(new Date().getTime() + 1000 * 60 * 60 * 3))
                .build();
        try {
            JWSHeader header = new JWSHeader(JWSAlgorithm.RS256);
            SignedJWT signedJWT = new SignedJWT(header, claim);
            JWSSigner signer = new RSASSASigner(privateKey);
            signedJWT.sign(signer);
            return signedJWT.serialize();
        } catch (JOSEException e) {
            throw new GlobalException(e.getMessage());
        }
    }

    @Override
    public String generateUserRefreshToken(UserResponse userResponse) {
        JWTClaimsSet claim = new JWTClaimsSet.Builder()
                .subject(userResponse.id())
                .claim("roles", List.of("ROLE_" + userResponse.role()))
                .claim("scopes", List.of())
                .claim("token_type", "access")
                .expirationTime(new Date(new Date().getTime() + 1000 * 60 * 60 * 24))
                .build();
        try {
            JWSHeader header = new JWSHeader(JWSAlgorithm.RS256);
            SignedJWT signedJWT = new SignedJWT(header, claim);
            JWSSigner signer = new RSASSASigner(privateKey);
            signedJWT.sign(signer);
            return signedJWT.serialize();
        } catch (JOSEException e) {
            throw new GlobalException(e.getMessage());
        }
    }

    @Override
    public String generateServiceToken(ServiceTokenRequest request) {
        Optional<ServiceClient> optional = serviceClientRepository.findByClientId(request.clientId());
        if(optional.isEmpty()){
            throw new ServiceClientNotFoundException("Service client not found");
        }
        ServiceClient serviceClient = optional.get();
        if(!passwordEncoder.matches(request.clientSecret(), serviceClient.getClientSecret())){
            throw new InvalidClientIdException("Invalid Client Secret");
        }
        if(!Objects.equals(serviceClient.getScopes(), request.scope())){
            throw new InvalidScopeException("Invalid Scope");
        }

        JWTClaimsSet claim = new JWTClaimsSet.Builder()
                .subject(request.clientId())
                .claim("roles", List.of())
                .claim("scope", request.scope())
                .claim("token_type", "service_token")
                .expirationTime(new Date(new Date().getTime() + 1000 * 60 * 60 * 3))
                .build();
        try {
            JWSHeader header = new JWSHeader(JWSAlgorithm.RS256);
            SignedJWT signedJWT = new SignedJWT(header, claim);
            JWSSigner signer = new RSASSASigner(privateKey);
            signedJWT.sign(signer);
            return signedJWT.serialize();
        } catch (JOSEException e) {
            throw new GlobalException(e.getMessage());
        }
    }


}
