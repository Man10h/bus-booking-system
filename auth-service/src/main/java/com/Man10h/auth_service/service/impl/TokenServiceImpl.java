package com.Man10h.auth_service.service.impl;

import com.Man10h.auth_service.controller.exception.AuthenticationFailedException;
import com.Man10h.auth_service.controller.exception.GlobalException;
import com.Man10h.auth_service.model.response.ClaimsResponse;
import com.Man10h.auth_service.model.response.UserResponse;
import com.Man10h.auth_service.service.TokenService;
import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jose.crypto.RSASSASigner;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.security.PrivateKey;
import java.text.ParseException;
import java.util.Date;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TokenServiceImpl implements TokenService {
    private final PrivateKey privateKey;

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






}
