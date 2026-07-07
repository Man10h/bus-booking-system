package com.Man10h.auth_service.model.entities;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "service_client")
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ServiceClient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String clientId;

    private String clientSecret;

    private String scopes;

    private Boolean active;
}