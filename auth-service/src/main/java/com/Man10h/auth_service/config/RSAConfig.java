package com.Man10h.auth_service.config;

import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.OctetSequenceKey;
import com.nimbusds.jose.jwk.RSAKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.crypto.SecretKey;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.security.KeyFactory;
import java.security.NoSuchAlgorithmException;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.InvalidKeySpecException;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;

@Configuration
public class RSAConfig {
    @Value("${private_key.path}")
    private String privateKeyPath;

    @Value("${public_key.path}")
    private String publicKeyPath;

    @Bean
    public RSAPrivateKey privateKey() {
        String key = null;
        try {
            key = Files.readString(Paths.get(privateKeyPath));
        } catch (IOException e) {
            throw new RuntimeException(e);
        }

        key = key
                .replace("-----BEGIN PRIVATE KEY-----", "")
                .replace("-----END PRIVATE KEY-----", "")
                .replaceAll("\\s", "");

        byte[] decoded = Base64.getDecoder().decode(key);

        PKCS8EncodedKeySpec spec = new PKCS8EncodedKeySpec(decoded);

        try {
            return (RSAPrivateKey) KeyFactory
                    .getInstance("RSA")
                    .generatePrivate(spec);
        } catch (InvalidKeySpecException | NoSuchAlgorithmException e) {
            throw new RuntimeException(e);
        }
    }

    

    @Bean
    public RSAPublicKey publicKey() {
        String key = null;
        try {
            key = Files.readString(Paths.get(publicKeyPath));
        } catch (IOException e) {
            throw new RuntimeException(e);
        }

        key = key
                .replace("-----BEGIN PUBLIC KEY-----", "")
                .replace("-----END PUBLIC KEY-----", "")
                .replaceAll("\\s", "");

        byte[] decoded = Base64.getDecoder().decode(key);

        X509EncodedKeySpec spec = new X509EncodedKeySpec(decoded);

        try {
            return (RSAPublicKey) KeyFactory
                    .getInstance("RSA")
                    .generatePublic(spec);
        } catch (InvalidKeySpecException | NoSuchAlgorithmException e) {
            throw new RuntimeException(e);
        }
    }


    @Bean
    public JWKSet jwkSet() {
        RSAKey jwk = new RSAKey.Builder(publicKey())
                .keyID("auth-key-2026")
                .algorithm(com.nimbusds.jose.JWSAlgorithm.RS256)
                .build();
        return new JWKSet(jwk);
    }
}
