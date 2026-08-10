# Bus Booking System - Comprehensive Project Summary

## 1. Project Purpose

The **Bus Booking System** is an enterprise-grade, event-driven microservices platform designed for modern intercity bus transport operations and online ticket reservations. 

The system provides:
* **For Passengers (Users)**: Real-time search of bus routes and schedules, interactive seat map selection with real-time availability, temporary seat holding with concurrency protection, online payment processing, booking management, and email notifications.
* **For Bus Operators (Operators)**: Fleet management, route and stop setup, schedule creation with conflict detection, pricing configuration (Regular vs. VIP seats), and financial revenue analytics.
* **For System Administrators (Admins)**: Platform user administration (account locking/unlocking, operator promotion), vehicle layout configuration (`VehicleType`), and inner-service client security management.

---

## 2. Main Modules

The system is organized into a microservices architecture composed of the following services:

| Module | Subdirectory | Port | Primary Responsibilities |
| :--- | :--- | :--- | :--- |
| **API Gateway** | `api-gateway` | `8080` | Entry point for client requests, reverse proxy via Eureka service discovery (`lb://`), central JWT authentication enforcement via JWKS, CORS configuration, and Redis-backed IP rate limiting (`RequestRateLimiter`). |
| **Discovery Server** | `discovery-server` | `8761` | Netflix Eureka Discovery Server for dynamic microservice instance registration and service discovery. |
| **Config Server** | `config-server` | `8888` | Centralized externalized configuration management across environments. *(Note: Configured in codebase, optional in Docker Compose)* |
| **Auth Service** | `auth-service` | `8000` | Authentication provider issuing RS256-signed JWT Access Tokens, Refresh Token Rotation with automatic compromised token reuse detection, public JWKS endpoint (`/.well-known/jwks.json`), Client Credentials token generation for inter-service communication, and Redis-based token revocation blacklist. |
| **User Service** | `user-service` | `8001` | User profile lifecycle, registration with OTP generation, credential validation (`/users/check-credentials`), and user role assignment. |
| **Core Service** | `core-service` | `8002` | Core domain management including Cities, Operators, Vehicles, Routes, Route Stops, Schedules, and Bookings. Enforces Pessimistic Locking (`SELECT FOR UPDATE`) during seat selection and runs background schedulers for seat expiration and trip status updates. |
| **Payment Service** | `payment-service` | `8003` | Integration with VNPay payment gateway, merchant configuration management, IPN callback processing, and reliable event publishing via the Transactional Outbox Pattern. |
| **Notification Service** | `notification-service` | `8004` | Event-driven notification system consuming Kafka topics to send email notifications (OTP verification, payment receipts, trip reminders) via SMTP and persisting user notification history. |
| **Frontend** | `frontend` | `3000` | Single Page Application (SPA) built with React 19, Vite, TypeScript, and Tailwind CSS v4. Includes role-based dashboards for Users, Operators, and Admins. |

---

## 3. Business Domains

The project encompasses several distinct business domains:

### 3.1. Identity & Access Management (IAM)
* User lifecycle management: registration, email OTP verification, password hashing, account activation.
* Authentication and Token issuing (JWT RS256 with JWKS).
* Refresh Token Rotation and Reuse Detection: Every refresh request invalidates the old refresh token and issues a new pair. If a revoked token is presented, all active sessions for that user are immediately invalidated.
* Role-based access control with 3 primary roles: `ADMIN`, `OPERATOR`, `USER`.

### 3.2. Vehicle & Fleet Management
* **Vehicle Types**: Physical seating grid configuration (floors, rows, columns, seat categories: `REGULAR` and `VIP`).
* **Vehicles**: Fleet records linked to specific operators, license plates, physical seat layouts, and active status control.
* **Operator Profiles**: Business entity verification (company name, tax code, contact info).

### 3.3. Route & Network Operations
* City locations (Departure/Arrival).
* Route definitions and ordered intermediate stops (`RouteStop` with pickup/drop-off indicators).

### 3.4. Trip Scheduling & Fares
* Trip schedule creation linking operator, vehicle, route, departure, and arrival times.
* Schedule overlap validation per vehicle.
* Differential seat pricing configuration (`basePrice` for regular seats, `vipPrice` for VIP seats).
* Automatic generation of `ScheduleSeat` instances upon schedule creation.
* Automated trip lifecycle state transitions (`OPEN` $\rightarrow$ `RUNNING` $\rightarrow$ `COMPLETED`).

### 3.5. Reservation & Seat Holding
* Interactive visual seat map selection.
* Pessimistic concurrency control (`SELECT ... FOR UPDATE`) to prevent double-booking.
* Temporary seat reservation (`HELD` state) with a strict 30-minute payment deadline (`PENDING_PAYMENT`).
* Automated background scheduler for seat release and booking cancellation upon deadline expiration.

### 3.6. Payment & Financial Settlement
* Merchant configuration per operator.
* VNPay payment URL generation and IPN (Instant Payment Notification) checksum verification.
* Transactional Outbox Pattern for eventual consistency between Payment and Core DBs via Kafka.
* Operator revenue dashboard analytics (daily and monthly revenue charts).

### 3.7. Notification & Messaging
* Event-driven email notifications triggered by system events (registration OTP, payment confirmation, schedule departure reminders).

---

## 4. Tech Stack

### Backend Technologies
* **Language & Runtime**: Java 21
* **Framework**: Spring Boot `3.5.16`
* **Microservices Framework**: Spring Cloud `2025.0.3` (Spring Cloud Gateway, Eureka Server, OpenFeign)
* **Security & Auth**: Spring Security, OAuth2 Resource Server, RSA (RS256) JWT, BCrypt
* **ORM & Database Migration**: Spring Data JPA, Liquibase

### Databases & Data Stores
* **MySQL 8.0**: Stores authentication data (`auth` database) and user profiles (`users` database).
* **PostgreSQL 16**: Stores operational domain data (`core` database), payment logs (`payment` database), and notification history (`notifications` database).
* **Redis 7 (Alpine)**: In-memory store for revoked token blacklist, caching, and Reactive Gateway Rate Limiting (`spring-boot-starter-data-redis-reactive`).

### Messaging & Event Streaming
* **Apache Kafka 7.4.0** & **Zookeeper 7.4.0**: Distributed event streaming platform powering asynchronous inter-service communication (Event-Driven Architecture).

### Resilience & Reliability
* **Resilience4j `2.2.0`**: Circuit breaker and rate-limiting support.
* **Architectural Patterns**: Transactional Outbox Pattern, Pessimistic Locking (`SELECT FOR UPDATE`), Refresh Token Rotation with Reuse Detection.

### Frontend Technologies
* **UI Library**: React 19
* **Language**: TypeScript 6
* **Build Tool**: Vite 8
* **Styling**: Tailwind CSS v4
* **State Management**: Zustand 5
* **HTTP Client**: Axios
* **Icons**: Lucide React
* **Linter**: Oxlint

### Infrastructure & Deployment
* **Containerization**: Docker & Docker Compose 3.8
* **Reverse Proxy / Tunneling**: Ngrok (for local gateway exposure to external webhooks)

---

## 5. Important Business Rules

### 5.1. User & Activation Rules
1. **User Registration & OTP**: New accounts are created in a disabled state (`enabled = false`). An email OTP valid for **10 minutes** is issued. Resent OTPs are valid for **15 minutes**. Account activation sets `enabled = true` and invalidates the OTP.
2. **Password Security**: All user passwords must be hashed using the **BCrypt** algorithm before database storage.
3. **Refresh Token Rotation & Reuse Detection**: Upon refreshing an access token, the presented refresh token is immediately marked as `revoked = true`, and a new refresh token is returned. If an already-revoked refresh token is submitted (indicating a compromised token reuse attempt), all active refresh tokens associated with that user ID are automatically invalidated.
4. **Role Privileges**:
   * `ADMIN`: Account locking/unlocking, user promotion to `OPERATOR`, inner-service OAuth client configuration, vehicle type creation.
   * `OPERATOR`: Manages operator profile, vehicles, routes, route stops, schedules, and views revenue reports.
   * `USER`: Searches schedules, holds seats, creates bookings, pays, and manages booking history.

### 5.2. Vehicle, Route & Schedule Constraints
1. **Physical Seat Map**: Every vehicle is tied to a `VehicleType` defining floor, row, column grid dimensions and seat tiers (`REGULAR` vs `VIP`).
2. **Active Status**: Only vehicles and routes with `ACTIVE` status can be scheduled.
3. **Route Stops**: Stops are ordered sequentially (`stopOrder` starting at 1) and marked as pickup (`isPickup`) or drop-off (`isDropOff`).
4. **Schedule Validation**:
   * Departure time must strictly precede arrival time (`departureTime < arrivalTime`).
   * Operators can only schedule vehicles and routes that belong to their operator profile.
5. **Vehicle Overlap Prevention**: A single vehicle cannot be assigned to overlapping schedules:
   $$\text{New.Departure} < \text{Existing.Arrival} \quad \land \quad \text{New.Arrival} > \text{Existing.Departure}$$
6. **Automatic Seat Initialization**: When a schedule is created in the `OPEN` state, `ScheduleSeat` records are automatically generated for all physical seats on the vehicle, assigned pricing according to seat tier (`basePrice` for regular, `vipPrice` for VIP).

### 5.3. Booking & Seat Holding Rules
1. **Pessimistic Locking**: Booking requests (`POST /core/bookings`) execute `SELECT ... FOR UPDATE` on target `ScheduleSeat` rows to prevent concurrent double-booking.
2. **Seat Reservation & Payment Deadline**: If seats are in `AVAILABLE` state, they switch to `HELD`, and a booking is created in `PENDING_PAYMENT` state with a **30-minute payment deadline** (`paymentDeadline = createdAt + 30 minutes`).
3. **Automated Seat Release Scheduler**: A background task in `core-service` runs every minute to scan for pending bookings past their payment deadline (`paymentDeadline < NOW`). It resets affected seats back to `AVAILABLE` (clearing `heldBy`, `heldAt`, `expiredAt`, and `booking_id`) and updates the booking status to `CANCELLED`.
4. **Immediate Cancellation**: Customers can manually cancel `PENDING_PAYMENT` bookings, immediately releasing seats to `AVAILABLE`.

### 5.4. Payment & Trip Lifecycle Rules
1. **VNPay Payment Callback (IPN)**:
   * Upon successful payment callback (`vnp_ResponseCode = "00"`), Payment Service marks the transaction `SUCCESS` and records a `payment-success` event in the `OutboxEvent` table within a single local transaction.
   * `OutboxRelay` publishes the event to Kafka. Core Service consumes it, transitioning the booking status to `PAID` and seat statuses from `HELD` to `BOOKED`.
2. **Payment Failure**: Failed transactions set payment status to `FAILED`. Booking remains `PENDING_PAYMENT` until paid or expired by the 30-minute scheduler.
3. **Trip State Transitions**:
   * When $\text{NOW} \ge \text{departureTime}$, schedule status automatically transitions from `OPEN` to `RUNNING`.
   * When $\text{NOW} \ge \text{arrivalTime}$, schedule status transitions to `COMPLETED`, and all linked `PAID` bookings transition to `COMPLETED`.
4. **Schedule Cancellation Rule**: Operators can only cancel a schedule if it is in `OPEN` state and **no seats** are currently `HELD` or `BOOKED`.

---

## 6. External Integrations

1. **VNPay Payment Gateway**:
   * Used for processing online passenger ticket payments.
   * Handles payment link creation and asynchronous IPN (Instant Payment Notification) callback processing with secure checksum signature verification.
2. **SMTP Email Service (Spring Mail / JavaMailSender)**:
   * Integrated via `notification-service` to deliver transactional emails:
     * User registration & resend OTP codes.
     * Booking payment receipts and e-ticket confirmations.
     * Schedule departure reminder notifications.
3. **Cloudinary**:
   * Cloud storage service integrated into the frontend application for uploading and managing vehicle photos and user profile avatars.
4. **Ngrok**:
   * Network tunneling utility used during local development to expose the local API Gateway (`localhost:8080`) to the public internet so that external payment callbacks (e.g., VNPay IPN) reach the local environment.
