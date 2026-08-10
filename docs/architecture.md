# Bus Booking System - Comprehensive Architecture Documentation

This document provides a deep technical analysis of the system architecture, component design, layer responsibilities, data flow pipelines, security protocols, database schemas, messaging infrastructure, and external service integrations for the **Bus Booking System**.

---

## 1. System Architecture Overview

The system is engineered as an **Event-Driven Microservices Architecture** utilizing the Spring Cloud ecosystem for backend orchestration and React 19 with Vite for the web frontend.

```mermaid
graph TB
    subgraph Client_Layer [Client Layer]
        SPA["React 19 SPA (Vite + Tailwind v4)<br/>Port 3000"]
    end

    subgraph Edge_Layer [API Gateway & Infrastructure]
        Gateway["API Gateway (Spring Cloud Gateway)<br/>Port 8080<br/>Redis RateLimiter (10 req/s)"]
        Eureka["Eureka Discovery Server<br/>Port 8761"]
        Config["Config Server<br/>Port 8888"]
    end

    subgraph Security_Identity [Auth & User Microservices]
        AuthSvc["Auth Service (Port 8000)<br/>OAuth2 / RSA RS256 JWKS<br/>Refresh Token Rotation"]
        UserSvc["User Service (Port 8001)<br/>User Profile & OTP"]
    end

    subgraph Core_Business [Business & Operations Microservices]
        CoreSvc["Core Service (Port 8002)<br/>Vehicles, Routes, Schedules, Bookings"]
        PaymentSvc["Payment Service (Port 8003)<br/>VNPay Integration & Outbox"]
        NotifSvc["Notification Service (Port 8004)<br/>Email Sender & History"]
    end

    subgraph Persistence_Layer [Polyglot Data Stores & Messaging]
        MySQL_Auth[("MySQL 8.0<br/>DB: auth")]
        MySQL_User[("MySQL 8.0<br/>DB: users")]
        PG_Core[("PostgreSQL 16<br/>DB: core")]
        PG_Pay[("PostgreSQL 16<br/>DB: payment")]
        PG_Notif[("PostgreSQL 16<br/>DB: notifications")]
        RedisStore[("Redis 7<br/>Cache, Blacklist & Rate Limiter")]
        KafkaBroker[["Apache Kafka 7.4<br/>Event Streaming Broker"]]
    end

    subgraph External_Integrations [External Third-Party Services]
        VNPayGateway["VNPay Payment Gateway"]
        SMTPServer["SMTP Mail Server"]
        CloudinaryCDN["Cloudinary CDN"]
    end

    %% Routing
    SPA -->|HTTP / REST API| Gateway
    Gateway -->|Discovery Lookup| Eureka
    AuthSvc -.->|Register| Eureka
    UserSvc -.->|Register| Eureka
    CoreSvc -.->|Register| Eureka
    PaymentSvc -.->|Register| Eureka
    NotifSvc -.->|Register| Eureka

    Gateway -->|/auth/**| AuthSvc
    Gateway -->|/users/**| UserSvc
    Gateway -->|/core/**| CoreSvc
    Gateway -->|/payments/**| PaymentSvc
    Gateway -->|/notifications/**| NotifSvc

    %% Database & Redis connections
    Gateway -->|Rate Limiting| RedisStore
    AuthSvc --> MySQL_Auth
    AuthSvc --> RedisStore
    UserSvc --> MySQL_User
    CoreSvc --> PG_Core
    CoreSvc --> RedisStore
    PaymentSvc --> PG_Pay
    NotifSvc --> PG_Notif

    %% Event-Driven Kafka
    UserSvc -- "user-register-success" --> KafkaBroker
    PaymentSvc -- "payment-success / payment-failed" --> KafkaBroker
    CoreSvc -- "booking-ready-topic" --> KafkaBroker

    KafkaBroker -- Consume --> CoreSvc
    KafkaBroker -- Consume --> NotifSvc

    %% External Integrations
    PaymentSvc <-->|VNPay API / IPN Callback| VNPayGateway
    NotifSvc -->|JavaMailSender| SMTPServer
    SPA -->|Image Upload| CloudinaryCDN
```

---

## 2. Package Structure & Module Blueprint

Each backend microservice follows a standard DDD-inspired (Domain-Driven Design) layered package structure:

```
<service-root>/
├── src/main/java/com/Man10h/<service_name>/
│   ├── config/             # Spring Security, Kafka, Redis, Web MVC configurations
│   ├── controller/         # REST Controllers & API Endpoints
│   ├── kafka/              # Kafka Consumers (@KafkaListener) & Producers
│   ├── model/
│   │   ├── dtos/           # Request & Response Data Transfer Objects
│   │   ├── entities/       # JPA Entity classes mapping to database tables
│   │   └── enums/          # Status and domain enumeration definitions
│   ├── repository/         # Spring Data JPA Repositories
│   ├── scheduler/          # Background cron jobs & periodic task handlers
│   ├── service/            # Interface & Implementation business logic
│   │   └── impl/           # Service concrete implementations
│   └── util/               # Utility classes (Crypto, Date formatters, Mappers)
└── src/main/resources/
    ├── application.yml     # Service configurations
    └── db/changelog/       # Liquibase SQL migration scripts
```

### Detailed Submodule Map

```
bus-booking-system/
├── api-gateway/            # Spring Cloud Gateway routing, JWKS JWT validation, Redis RateLimiter
│   ├── config/RateLimiterConfig.java   # RedisRateLimiter & KeyResolver beans
│   └── config/RouterConfig.java        # RequestRateLimiter filter pipeline
├── auth-service/           # OAuth2 Auth server, RS256 token provider, Token Rotation & Revocation
│   ├── repository/RefreshTokenRepository.java  # Token lookup & bulk revocation queries
│   └── service/impl/AuthServiceImpl.java        # Token Rotation & reuse detection
├── user-service/           # User lifecycle, OTP verification, credential check endpoint
├── core-service/           # Fleet, Route, Schedule, Booking & Pessimistic Seat Locking
├── payment-service/        # VNPay checkout, IPN handler, Transactional Outbox pattern
├── notification-service/   # Kafka event consumer, SMTP Mail dispatching
├── discovery-server/      # Netflix Eureka service discovery server
├── config-server/         # Centralized configuration management server
└── frontend/               # React 19 SPA (Vite + Tailwind v4 + Zustand)
```

---

## 3. Layer Responsibilities

```mermaid
graph TD
    Client[Client / Gateway Request] --> RateLimiterFilter[Gateway Redis Rate Limiter Filter]
    RateLimiterFilter --> ControllerLayer[Controller Layer]
    ControllerLayer --> ServiceLayer[Service Layer]
    ServiceLayer --> RepoLayer[Repository Layer]
    RepoLayer --> Database[(Database)]
    
    ServiceLayer -.-> OutboxRelay[Outbox Relay / Scheduler]
    OutboxRelay -.-> KafkaBroker[[Kafka Broker]]
    KafkaBroker -.-> ConsumerLayer[Kafka Consumer Layer]
    ConsumerLayer -.-> ServiceLayer
```

| Layer | Component Responsibilities |
| :--- | :--- |
| **Gateway Rate Limiter** | Evaluates incoming HTTP request frequency using a Redis-backed Token Bucket algorithm (`RedisRateLimiter(10, 20, 1)`). Returns `429 Too Many Requests` if client rate exceeds capacity. |
| **Controller Layer** | Exposes HTTP REST endpoints, validates incoming JSON payloads using `@Valid`, maps DTOs to internal command objects, and formats standardized HTTP responses (`200 OK`, `201 Created`, `400 Bad Request`, `404 Not Found`). |
| **Service Layer** | Implements core business logic, orchestrates cross-repository transactions (`@Transactional`), enforces domain rules (schedule overlap checks, token rotation with reuse detection), and triggers outbox events. |
| **Repository Layer** | Encapsulates data persistence using Spring Data JPA. Defines custom JPQL and native SQL queries, including `SELECT ... FOR UPDATE` pessimistic locks and bulk update queries for expired bookings and token revocation. |
| **Model & DTO Layer** | Defines JPA entities with relational annotations (`@Entity`, `@ManyToOne`, `@OneToMany`) and DTO classes to prevent leaking database schemas to clients. |
| **Outbox & Scheduler Layer** | Executes periodic background jobs using `@Scheduled` annotations: `OutboxRelay` polls pending outbox events to publish to Kafka; `BookingScheduler` sweeps expired held seats. |
| **Kafka Consumer Layer** | Listens to Kafka topics using `@KafkaListener`, deserializes event JSON payloads, and calls corresponding service methods to update domain states asynchronously. |
| **Security Layer** | Decodes incoming RS256 JWT tokens using public keys retrieved from `auth-service`'s JWKS endpoint, establishes `SecurityContextHolder` credentials, and checks RBAC authorities (`ROLE_ADMIN`, `ROLE_OPERATOR`, `ROLE_USER`). |

---

## 4. End-to-End Data Flow

### 4.1. Booking & Payment Lifecycle Data Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as Passenger (Frontend)
    participant GW as API Gateway (8080)
    participant Core as Core Service (8002)
    participant DB_Core as Postgres (core DB)
    participant Pay as Payment Service (8003)
    participant DB_Pay as Postgres (payment DB)
    participant VNPay as VNPay Gateway
    participant Kafka as Kafka Broker
    participant Notif as Notification Service (8004)

    %% 1. Booking Request & Pessimistic Locking
    User->>GW: POST /core/bookings (scheduleId, seatIds)
    GW->>Core: Forward Request (with User JWT)
    Note over Core,DB_Core: Start Database Transaction
    Core->>DB_Core: SELECT * FROM schedule_seat WHERE id IN (...) FOR UPDATE
    DB_Core-->>Core: Locked seat records
    alt Any Seat Status != AVAILABLE
        Core-->>User: 400 Bad Request (Seat already held/booked)
    else All Seats AVAILABLE
        Core->>DB_Core: INSERT INTO booking (status='PENDING_PAYMENT', deadline=NOW+30m)
        Core->>DB_Core: UPDATE schedule_seat SET status='HELD', booking_id=...
        Core-->>User: 201 Created (Booking details & bookingCode)
    end

    %% 2. Payment Initiation
    User->>GW: POST /payments/vnpay/create-payment (bookingCode)
    GW->>Pay: Forward Request
    Pay->>VNPay: Build Payment URL with HMAC-SHA512 checksum
    Pay-->>User: Return VNPay Checkout URL
    User->>VNPay: Redirect & Complete Payment on VNPay Sandbox

    %% 3. VNPay IPN Callback & Outbox Pattern
    VNPay->>Pay: GET /payments/vnpay/ipn (vnp_ResponseCode="00", Checksum)
    Note over Pay,DB_Pay: Start Database Transaction
    Pay->>Pay: Verify Checksum Signature & Amount
    Pay->>DB_Pay: UPDATE payment SET status='SUCCESS'
    Pay->>DB_Pay: INSERT INTO outbox_event (event_type='payment-success', status='PENDING')
    Note over Pay,DB_Pay: Commit Transaction (Atomically saved)
    Pay-->>VNPay: Return IPN Response {"RspCode":"00","Message":"Confirm Success"}

    %% 4. Outbox Relay to Kafka
    loop Scheduled Outbox Relay (Every 1-5s)
        Pay->>DB_Pay: SELECT * FROM outbox_event WHERE status='PENDING'
        Pay->>Kafka: Publish "payment-success" Event
        Kafka-->>Pay: ACK (Published)
        Pay->>DB_Pay: UPDATE outbox_event SET status='PUBLISHED'
    end

    %% 5. Asynchronous Event Consumption
    par Consumer: Core Service
        Kafka->>Core: Consume "payment-success"
        Core->>DB_Core: UPDATE booking SET status='PAID'
        Core->>DB_Core: UPDATE schedule_seat SET status='BOOKED'
    and Consumer: Notification Service
        Kafka->>Notif: Consume "payment-success"
        Notif->>Notif: Format Booking Invoice Email
        Notif->>User: Send Email via SMTP (Payment Confirmation)
    end
```

---

### 4.2. Refresh Token Rotation & Reuse Detection Sequence

```mermaid
sequenceDiagram
    autonumber
    actor Client as Client App
    participant Auth as Auth Service (8000)
    participant DB_Auth as MySQL (auth DB)

    Client->>Auth: POST /auth/refresh-token (refreshToken: "R1")
    Auth->>DB_Auth: SELECT * FROM refresh_token WHERE token = "R1"
    
    alt Token Not Found or Expired
        Auth-->>Client: 401 Unauthorized ("Refresh token invalid or expired")
    else Token Exists and Is Revoked (Reuse Attempt Detected!)
        Note over Auth,DB_Auth: Security Event: Token theft suspected!
        Auth->>DB_Auth: UPDATE refresh_token SET revoked = true WHERE userId = ...
        Auth-->>Client: 401 Unauthorized ("Revoked token reuse detected. All sessions terminated.")
    else Token Exists and Active (revoked = false)
        Auth->>DB_Auth: UPDATE refresh_token SET revoked = true WHERE token = "R1"
        Auth->>Auth: Generate new Access Token ("A2") and new Refresh Token ("R2")
        Auth->>DB_Auth: INSERT INTO refresh_token (token = "R2", revoked = false)
        Auth-->>Client: 200 OK { accessToken: "A2", refreshToken: "R2" }
    end
```

---

## 5. Authentication & Security Architecture

The platform implements a centralized **OAuth2 Authorization Server / Resource Server** pattern using RSA RS256 asymmetric cryptographic keys.

```mermaid
sequenceDiagram
    autonumber
    actor Client as Frontend / User
    participant Auth as Auth Service (8000)
    participant GW as API Gateway (8080)
    participant UserSvc as User Service (8001)
    participant CoreSvc as Core Service (8002)

    %% Startup Key Exchange / JWKS
    Note over Auth: Generates RSA Public/Private Key pair at startup
    GW->>Auth: GET /auth/.well-known/jwks.json
    Auth-->>GW: Public Key Set (JWKS)
    CoreSvc->>Auth: GET /auth/.well-known/jwks.json
    Auth-->>CoreSvc: Public Key Set (JWKS)

    %% Login Flow
    Client->>GW: POST /auth/login (username, password)
    GW->>Auth: Forward to Auth Service
    Auth->>UserSvc: POST /users/check-credentials
    UserSvc-->>Auth: User Validated (userId, roles, BCrypt match)
    Auth->>Auth: Sign JWT Access Token with RSA Private Key
    Auth-->>Client: Return JWT Access Token + Refresh Token

    %% Authenticated Request Flow
    Client->>GW: GET /core/schedules (Bearer <JWT>)
    GW->>GW: Check Redis Rate Limiter (Token Bucket)
    GW->>GW: Verify JWT signature locally using Auth JWKS Public Key
    GW->>CoreSvc: Forward request with validated Security Context
    CoreSvc->>CoreSvc: Verify JWT & extract Authorities (ROLE_USER/OPERATOR)
    CoreSvc-->>Client: 200 OK (Schedule Data)
```

### Key Security Features
1. **Asymmetric Signing (RS256)**: Tokens are signed with Auth Service's private key and verified by Gateway/Microservices using the public key fetched from `/auth/.well-known/jwks.json`.
2. **Refresh Token Rotation & Reuse Detection**: Old refresh tokens are invalidated upon consumption. Submission of a revoked token triggers automatic revocation of all user tokens.
3. **Gateway Rate Limiting**: API Gateway uses a Redis-backed `RedisRateLimiter(10, 20, 1)` and IP key resolver to defend against brute-force attacks and DDoS traffic spikes.
4. **Client Credentials Flow**: Internal service-to-service requests obtain short-lived service tokens via `/auth/service-token`.
5. **Password Security**: Passwords stored in MySQL are hashed using **BCrypt**.

---

## 6. Database Architecture & Schemas

The system uses **Polyglot Persistence**, separating relational workloads between MySQL and PostgreSQL.

```mermaid
erDiagram
    CITY ||--o{ ROUTE : "departure/arrival city"
    OPERATOR ||--o{ VEHICLE : "owns"
    OPERATOR ||--o{ ROUTE : "owns"
    VEHICLE_TYPE ||--o{ VEHICLE : "defines layout"
    VEHICLE ||--o{ SEAT : "has physical seats"
    VEHICLE ||--o{ SCHEDULE : "assigned to"
    ROUTE ||--o{ ROUTE_STOP : "contains ordered stops"
    ROUTE ||--o{ SCHEDULE : "scheduled on"
    SCHEDULE ||--o{ SCHEDULE_SEAT : "generates trip seats"
    SEAT ||--o{ SCHEDULE_SEAT : "maps to"
    BOOKING ||--o{ SCHEDULE_SEAT : "holds/books"
    SCHEDULE ||--o{ BOOKING : "belongs to"

    CITY {
        bigint id PK
        string name
        string code
    }

    OPERATOR {
        string id PK
        string user_id UK
        string company_name
        string tax_code UK
        string contact_phone
    }

    VEHICLE_TYPE {
        bigint id PK
        string name
        int floors
        int rows
        int cols
    }

    VEHICLE {
        bigint id PK
        string license_plate
        string brand
        string status
        string operator_id FK
        bigint vehicle_type_id FK
    }

    SEAT {
        bigint id PK
        string seat_number
        int floor
        int row
        int col
        boolean is_vip
        bigint vehicle_id FK
    }

    ROUTE {
        bigint id PK
        string route_code UK
        decimal distance
        bigint departure_city_id FK
        bigint arrival_city_id FK
        string operator_id FK
    }

    ROUTE_STOP {
        bigint id PK
        bigint stop_order
        string stop_name
        boolean is_pickup
        boolean is_drop_off
        bigint route_id FK
    }

    SCHEDULE {
        bigint id PK
        timestamp departure_time
        timestamp arrival_time
        decimal base_price
        decimal vip_price
        string status
        bigint route_id FK
        bigint vehicle_id FK
    }

    BOOKING {
        bigint id PK
        string booking_code UK
        string user_id
        decimal total_amount
        timestamp payment_deadline
        string status
        bigint schedule_id FK
    }

    SCHEDULE_SEAT {
        bigint id PK
        decimal price
        string status
        string held_by
        timestamp expired_at
        bigint booking_id FK
        bigint schedule_id FK
        bigint seat_id FK
    }
```

### Database Partitioning Matrix

| Database Instance | DB Name | Microservice | Database Technology | Main Tables |
| :--- | :--- | :--- | :--- | :--- |
| `db-mysql` | `auth` | `auth-service` | MySQL 8.0 | `refresh_token`, `service_client` |
| `db-mysql` | `users` | `user-service` | MySQL 8.0 | `users`, `roles`, `user_roles` |
| `db-postgres` | `core` | `core-service` | PostgreSQL 16 | `city`, `operator`, `vehicle_type`, `vehicle`, `seat`, `route`, `route_stop`, `schedule`, `schedule_seat`, `booking` |
| `db-postgres` | `payment` | `payment-service` | PostgreSQL 16 | `payment`, `merchant`, `outbox_event` |
| `db-postgres` | `notifications` | `notification-service` | PostgreSQL 16 | `notification` |

---

## 7. Redis Caching & Session Architecture

Redis is utilized as an in-memory cache, token blacklist, and rate-limiting store across services:

```mermaid
graph TD
    Gateway[API Gateway] -->|RequestRateLimiter| RedisInstance[Redis 7 Store]
    CoreSvc[Core Service] -->|Cache Queries (@Cacheable)| RedisInstance
    AuthSvc[Auth Service] -->|Blacklist Tokens & Sessions| RedisInstance
    
    subgraph Redis_Key_Namespaces [Redis Key Namespaces]
        RateLimiter["request_rate_limiter::<ip> -> Token Bucket Counter"]
        RoutesCache["cache::routes -> Cached Route Definitions"]
        CitiesCache["cache::cities -> Cached City List"]
        RevokedTokens["auth::blacklist::<token> -> Revoked Tokens"]
    end
    
    RedisInstance --- RateLimiter
    RedisInstance --- RoutesCache
    RedisInstance --- CitiesCache
    RedisInstance --- RevokedTokens
```

* **API Gateway Rate Limiter**: `spring-boot-starter-data-redis-reactive` maintains token bucket counters for IP rate limiting (`request_rate_limiter`).
* **Cache Layer in Core Service**: `@EnableCaching` with `RedisCacheManager` caches frequently read, low-volatility data such as Cities and Routes to reduce SQL workload on PostgreSQL.
* **Token Blacklisting in Auth Service**: Invalidated or logged-out JWT tokens are stored in Redis with an expiration matching the token's TTL.

---

## 8. Apache Kafka Event-Driven Architecture

Kafka acts as the asynchronous event backbone connecting producer and consumer services.

```mermaid
graph LR
    subgraph Producers [Event Producers]
        UserSvc[User Service]
        PaySvc[Payment Service - OutboxRelay]
        CoreSvc[Core Service]
    end

    subgraph Topics [Kafka Broker Topics]
        T_User["user-register-success<br/>(3 Partitions)"]
        T_PaySucc["payment-success<br/>(3 Partitions)"]
        T_PayFail["payment-failed<br/>(3 Partitions)"]
        T_BookReady["booking-ready-topic<br/>(3 Partitions)"]
    end

    subgraph Consumers [Event Consumers]
        CoreConsumer[Core Service PaymentConsumer]
        NotifUserCons[Notif Service UserConsumer]
        NotifPayCons[Notif Service PaymentConsumer]
        NotifBookCons[Notif Service BookingConsumer]
    end

    UserSvc -->|Publish OTP Event| T_User
    PaySvc -->|Publish Payment Success| T_PaySucc
    PaySvc -->|Publish Payment Failed| T_PayFail
    CoreSvc -->|Publish Departure Reminder| T_BookReady

    T_User -->|Consume| NotifUserCons
    T_PaySucc -->|Consume| CoreConsumer
    T_PaySucc -->|Consume| NotifPayCons
    T_PayFail -->|Consume| NotifPayCons
    T_BookReady -->|Consume| NotifBookCons
```

### Kafka Topic Specifications

| Topic Name | Producer Service | Consumer Service(s) | Trigger / Purpose |
| :--- | :--- | :--- | :--- |
| `user-register-success` | `user-service` | `notification-service` | Fires on user registration to send an account activation OTP email. |
| `payment-success` | `payment-service` | `core-service`, `notification-service` | Fires when VNPay IPN succeeds. Updates booking to `PAID`, seats to `BOOKED`, and sends payment receipt email. |
| `payment-failed` | `payment-service` | `notification-service` | Fires when payment fails. Sends notification of payment failure. |
| `booking-ready-topic` | `core-service` | `notification-service` | Fires prior to schedule departure to send trip departure reminders to passengers. |

---

## 9. External Service Integrations

```mermaid
graph TD
    PaymentSvc[Payment Service] <-->|HMAC-SHA512 Checkout & IPN| VNPay[VNPay Payment Gateway]
    NotifSvc[Notification Service] -->|SMTP Protocol| MailServer[SMTP Email Server]
    FrontendApp[React Frontend] -->|REST API Upload| Cloudinary[Cloudinary CDN]
    GatewayApp[API Gateway] <-->|Webhook Tunnel| NgrokTunnel[Ngrok Tunneling Service]
```

1. **VNPay Gateway**:
   * **URL Generation**: Constructs secure redirect URLs including merchant ID, order info, total amount, return URL, and HMAC-SHA512 hash signature.
   * **IPN Callback**: Receives asynchronous webhooks from VNPay server, re-calculates hash signature to verify authenticity, and updates transaction status.
2. **SMTP Email Service**:
   * Integrated in `notification-service` via `spring-boot-starter-mail`.
   * Sends transactional HTML emails for registration OTPs, booking payment receipts, and trip departure reminders.
3. **Cloudinary CDN**:
   * Integrates directly with `frontend` via Cloudinary React SDK for client-side image uploads (vehicle photos and profile avatars).
4. **Ngrok Tunneling**:
   * Exposes local `api-gateway` (Port `8080`) to an external public HTTPS endpoint so that external webhooks (e.g. VNPay IPN callbacks) can hit the local development environment.
