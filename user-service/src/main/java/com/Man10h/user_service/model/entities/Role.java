package com.Man10h.user_service.model.entities;

import jakarta.persistence.*;
import lombok.*;

import java.util.Set;

@Table(name = "role")
@Entity
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Role {
    @Id
    private Long id;

    private String name;

    @OneToMany(mappedBy = "role", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<User> users;
}
