package com.Man10h.user_service.repository.spec;

import com.Man10h.user_service.model.entities.Role;
import com.Man10h.user_service.model.entities.User;
import com.Man10h.user_service.model.enums.Gender;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

public class UserSpecification {

    public static Specification<User> keyword(String keyword) {
        return (root, query, cb) -> {
            if (keyword == null || keyword.isBlank()) {
                return null;
            }
            String pattern = "%" + keyword.trim().toLowerCase() + "%";
            Predicate namePredicate = cb.like(cb.lower(root.get("fullName")), pattern);
            Predicate emailPredicate = cb.like(cb.lower(root.get("email")), pattern);
            Predicate phonePredicate = cb.like(root.get("phone"), "%" + keyword.trim() + "%");

            return cb.or(namePredicate, emailPredicate, phonePredicate);
        };
    }

    public static Specification<User> roleId(Long roleId) {
        return (root, query, cb) -> {
            if (roleId == null) {
                return null;
            }
            Join<User, Role> roleJoin = root.join("role", JoinType.INNER);
            return cb.equal(roleJoin.get("id"), roleId);
        };
    }

    public static Specification<User> roleName(String roleName) {
        return (root, query, cb) -> {
            if (roleName == null || roleName.isBlank()) {
                return null;
            }
            Join<User, Role> roleJoin = root.join("role", JoinType.INNER);
            return cb.equal(cb.upper(roleJoin.get("name")), roleName.trim().toUpperCase());
        };
    }

    public static Specification<User> enabled(Boolean enabled) {
        return (root, query, cb) -> {
            if (enabled == null) {
                return null;
            }
            return cb.equal(root.get("enabled"), enabled);
        };
    }

    public static Specification<User> gender(String gender) {
        return (root, query, cb) -> {
            if (gender == null || gender.isBlank()) {
                return null;
            }
            try {
                Gender g = Gender.valueOf(gender.trim().toUpperCase());
                return cb.equal(root.get("gender"), g);
            } catch (IllegalArgumentException e) {
                return null;
            }
        };
    }
}
