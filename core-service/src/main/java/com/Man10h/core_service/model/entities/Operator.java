package com.Man10h.core_service.model.entities;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;
import java.util.Set;

@Entity
@Table(name = "operator")
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Operator {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "user_id", nullable = false, unique = true)
    private String userId;

    @Column(name = "company_name")
    private String companyName;

    @Column(name = "tax_code", nullable = false, unique = true)
    private String taxCode;

    @Column(name = "contact_phone")
    private String contactPhone;

    @Column(name = "avatar_url")
    private String avatarUrl;

    @OneToMany(mappedBy = "operator", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Route> routeList;

    @OneToMany(mappedBy = "operator", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Vehicle> vehicleList;
}
