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

    private String userId;
    private String companyName;
    private String taxCode;
    private String contactPhone;
    private String avatarUrl;

    @OneToMany(mappedBy = "operator", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Route> routeList;

    @OneToMany(mappedBy = "operator", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Vehicle> vehicleList;
}
