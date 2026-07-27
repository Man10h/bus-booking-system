# TÀI LIỆU API HỆ THỐNG ĐẶT VÉ XE KHÁCH (BUS BOOKING SYSTEM)

Tài liệu này cung cấp thông tin chi tiết về các API Endpoint, Request Header, Request Body, Response Body, cơ chế xác thực và cấu trúc hệ thống của dự án Bus Booking System.

---

## 1. MÔ TẢ HỆ THỐNG & KIẾN TRÚC

Hệ thống được phát triển theo kiến trúc **Microservices** sử dụng **Spring Cloud**. Frontend sẽ gọi các API thông qua một cổng duy nhất là **API Gateway** (chạy mặc định ở cổng `8080`).

### Các Dịch vụ trong Hệ thống (Microservices):
1. **API Gateway (`api-gateway`)**: Cổng điều hướng (Routing) tất cả các request đến các microservices tương ứng, đồng thời xử lý xác thực tập trung (JWT Verification) dựa trên JWKS public keys.
2. **Auth Service (`auth-service`)**: Quản lý việc Đăng nhập, cấp phát Access Token (JWT), Refresh Token, Service Token (dùng cho Service-to-Service) và quản lý danh sách Service Client.
3. **User Service (`user-service`)**: Quản lý Đăng ký tài khoản, Xác thực mã OTP qua email, Cập nhật thông tin cá nhân, Đổi mật khẩu, phân quyền và khóa/mở tài khoản.
4. **Core Service (`core-service`)**: Dịch vụ lõi quản lý Nhà xe (Operator), Xe khách (Vehicle), Tuyến đường (Route), Lịch trình chuyến xe (Schedule), Trạng thái ghế ngồi, Đặt vé (Booking), Hủy vé và Thống kê doanh thu/hiệu suất.
5. **Payment Service (`payment-service`)**: Quản lý cổng thanh toán (tích hợp VNPay), cấu hình Merchant cho từng nhà xe, xử lý callback IPN từ VNPay và lưu lịch sử giao dịch thanh toán.
6. **Notification Service (`notification-service`)**: Gửi email thông báo (xác nhận tài khoản, nhắc nhở chuyến xe, vé đặt thành công) qua Kafka Events và quản lý danh sách thông báo của người dùng.
7. **Discovery Server (`discovery-server`)**: Eureka Server giúp các microservices tự động tìm thấy nhau.
8. **Databases & Cache**:
   - **MySQL**: Cơ sở dữ liệu cho `auth-service` và `user-service`.
   - **PostgreSQL**: Cơ sở dữ liệu cho `core-service`, `payment-service` và `notification-service`.
   - **Redis**: Lưu trữ danh sách Token bị thu hồi (Blacklist) và cấu hình cache giúp tối ưu tốc độ truy xuất.
   - **Apache Kafka**: Xử lý hàng đợi tin nhắn bất đồng bộ giữa các service (Ví dụ: khi đặt vé hoặc thanh toán xong, Core/Payment Service phát event sang Kafka để Notification Service gửi email).

---

## 2. QUY ĐỊNH CHUNG VỀ REQUEST & RESPONSE

### 2.1. Địa chỉ Base URL qua API Gateway
- **Môi trường Local**: `http://localhost:8080` (hoặc thông qua tunnel Ngrok được cấu hình).

### 2.2. Định tuyến (Routing Table) tại Gateway
Tất cả các API được định tuyến dựa trên tiền tố của đường dẫn:
- `/auth/**` $\rightarrow$ Chuyển tiếp tới **Auth Service** (`port 8000`)
- `/users/**` $\rightarrow$ Chuyển tiếp tới **User Service** (`port 8001`)
- `/core/**` $\rightarrow$ Chuyển tiếp tới **Core Service** (`port 8002`)
- `/payments/**` $\rightarrow$ Chuyển tiếp tới **Payment Service** (`port 8003`)
- `/notifications/**` $\rightarrow$ Chuyển tiếp tới **Notification Service** (`port 8004`)

### 2.3. Request Headers mặc định
Đối với các API yêu cầu xác thực, Client phải gửi kèm JWT token trong header:
```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

### 2.4. Phân quyền Người dùng (Roles)
Hệ thống hỗ trợ 3 nhóm quyền chính:
- **`ADMIN`**: Quản trị viên toàn hệ thống, có quyền quản lý Service Client, xem chi tiết tất cả User, khóa User, nâng cấp User lên Operator.
- **`OPERATOR`**: Nhà xe, có quyền quản lý thông tin nhà xe, quản lý xe (Vehicle), cấu hình tuyến đường (Route), thiết lập lịch trình (Schedule) và xem báo cáo thống kê doanh thu của nhà xe đó.
- **`USER`**: Khách hàng, có quyền đặt vé (Booking), hủy vé, xem lịch sử thanh toán, xem danh sách thông báo cá nhân, cập nhật profile và xem danh sách tuyến đường/lịch trình công khai.

### 2.5. Cấu trúc Response Wrapper chung (`ApiResponse`)
Mọi kết quả trả về từ API đều được bọc trong một định dạng JSON chuẩn:
```json
{
  "code": 200,
  "message": "success",
  "data": { ... }
}
```
*Lưu ý: Nếu API thực hiện thao tác không trả về dữ liệu (như thay đổi trạng thái, xóa), trường `"data"` sẽ là `null`.*

---

## 3. TÀI LIỆU CHI TIẾT CÁC ENDPOINT API

### 3.1. AUTH SERVICE (`/auth/**`)

#### API Đăng nhập (Login)
- **Method**: `POST`
- **Path**: `/auth/login`
- **Xác thực**: Không yêu cầu (Public)
- **Request Body**:
  ```json
  {
    "email": "customer@gmail.com",
    "password": "Password123"
  }
  ```
- **Response Body**:
  ```json
  {
    "code": 200,
    "message": "success",
    "data": {
      "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "48b61c47-38e5-4720-bd91-032c81ad8697",
      "tokenType": "Bearer",
      "expiresIn": 3600,
      "refreshTokenExpiresIn": 86400
    }
  }
  ```

#### Lấy Khóa Công khai JWKS (JWK Set)
- **Method**: `GET`
- **Path**: `/auth/.well-known/jwks.json`
- **Xác thực**: Không yêu cầu (Public)
- **Mô tả**: Trả về tập hợp các khóa công khai dạng JWK dùng để verify chữ ký của JWT token (dùng cho API Gateway hoặc các service khác tự verify).
- **Response Body**:
  ```json
  {
    "keys": [
      {
        "kty": "RSA",
        "e": "AQAB",
        "n": "v9X-...",
        "alg": "RS256",
        "use": "sig"
      }
    ]
  }
  ```

#### Tạo Token dịch vụ (Service Token - Client Credentials)
- **Method**: `POST`
- **Path**: `/auth/service-token`
- **Xác thực**: Không yêu cầu (Public - dùng mã Client Secret)
- **Request Body**:
  ```json
  {
    "grantType": "client_credentials",
    "clientId": "core-service",
    "clientSecret": "SecretKey123",
    "scope": "core.read"
  }
  ```
- **Response Body**:
  ```json
  {
    "code": 200,
    "message": "success",
    "data": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```

#### Làm mới Token (Refresh Token)
- **Method**: `POST`
- **Path**: `/auth/refresh-token`
- **Xác thực**: Không yêu cầu (Public)
- **Request Body**:
  ```json
  {
    "refreshToken": "48b61c47-38e5-4720-bd91-032c81ad8697"
  }
  ```
- **Response Body**: Trả về một `LoginResponse` mới gồm Access Token và Refresh Token mới.

#### Xem danh sách Service Client (Hệ thống nội bộ)
- **Method**: `GET`
- **Path**: `/auth/service-client`
- **Xác thực**: Yêu cầu Token (Quyền `ADMIN`)
- **Response Body**:
  ```json
  {
    "code": 200,
    "message": "success",
    "data": [
      {
        "id": 1,
        "clientId": "core-service",
        "clientSecret": "$2a$10$...",
        "scope": "core.read core.write",
        "active": true
      }
    ]
  }
  ```

#### Tạo mới Service Client
- **Method**: `POST`
- **Path**: `/auth/service-client`
- **Xác thực**: Yêu cầu Token (Quyền `ADMIN`)
- **Request Body**:
  ```json
  {
    "clientId": "payment-service",
    "clientSecret": "PaymentSecret789",
    "scope": "payment.read"
  }
  ```
- **Response Body**: Trả về thông tin chi tiết client vừa tạo kèm ID.

#### Cập nhật Service Client
- **Method**: `PUT`
- **Path**: `/auth/service-client/{id}`
- **Xác thực**: Yêu cầu Token (Quyền `ADMIN`)
- **Request Body**:
  ```json
  {
    "clientId": "payment-service",
    "clientSecret": "NewPaymentSecret789",
    "scope": "payment.read payment.write"
  }
  ```
- **Response Body**: Trả về thông tin client đã được cập nhật.

---

### 3.2. USER SERVICE (`/users/**`)

#### Đăng ký Tài khoản mới (Register)
- **Method**: `POST`
- **Path**: `/users/register`
- **Xác thực**: Không yêu cầu (Public)
- **Request Body**:
  ```json
  {
    "email": "customer@gmail.com",
    "password": "Password123",
    "rePassword": "Password123",
    "phone": "0987654321",
    "fullName": "Nguyen Van A"
  }
  ```
- **Response Body**:
  ```json
  {
    "code": 201,
    "message": "success",
    "data": null
  }
  ```

#### Xác thực tài khoản qua OTP Email (Verify Account)
- **Method**: `GET`
- **Path**: `/users/verify`
- **Xác thực**: Không yêu cầu (Public)
- **Query Parameters**:
  - `email`: `customer@gmail.com`
  - `verificationCode`: `123456`
- **Response Body**:
  ```json
  {
    "code": 200,
    "message": "success",
    "data": true
  }
  ```

#### Kiểm tra thông tin đăng nhập (Check Credentials - Dùng cho Auth Service gọi nội bộ)
- **Method**: `POST`
- **Path**: `/users/check-credentials`
- **Xác thực**: Không yêu cầu (Public)
- **Request Body**:
  ```json
  {
    "email": "customer@gmail.com",
    "password": "Password123"
  }
  ```
- **Response Body**:
  ```json
  {
    "code": 200,
    "message": "success",
    "data": {
      "id": "usr_92f8c5b1",
      "email": "customer@gmail.com",
      "phone": "0987654321",
      "fullName": "Nguyen Van A",
      "address": "123 Đường Lê Lợi, TP. HCM",
      "gender": "MALE",
      "avatarUrl": "https://example.com/avatar.png",
      "enabled": true,
      "createdAt": "2026-07-20T10:30:00",
      "role": "USER"
    }
  }
  ```

#### Lấy thông tin cá nhân hiện tại (Get My Profile)
- **Method**: `GET`
- **Path**: `/users/me`
- **Xác thực**: Yêu cầu Token (Quyền `USER`, `OPERATOR` hoặc `ADMIN`)
- **Response Body**:
  ```json
  {
    "code": 200,
    "message": "success",
    "data": {
      "id": "usr_92f8c5b1",
      "email": "customer@gmail.com",
      "phone": "0987654321",
      "fullName": "Nguyen Van A",
      "address": "123 Đường Lê Lợi, TP. HCM",
      "gender": "MALE",
      "avatarUrl": "https://example.com/avatar.png",
      "enabled": true,
      "createdAt": "2026-07-20T10:30:00",
      "role": "USER"
    }
  }
  ```

#### Cập nhật thông tin cá nhân (Update My Profile)
- **Method**: `PUT`
- **Path**: `/users/me`
- **Xác thực**: Yêu cầu Token (Quyền `USER`, `OPERATOR` hoặc `ADMIN`)
- **Request Body**:
  ```json
  {
    "fullName": "Nguyen Van A (Đã Sửa)",
    "phone": "0987654322",
    "address": "456 Đường Nguyễn Huệ, TP. HCM",
    "avatarUrl": "https://example.com/new-avatar.png",
    "gender": "MALE"
  }
  ```
- **Response Body**: Trả về `UserResponse` mới đã cập nhật.

#### Đổi mật khẩu (Change Password)
- **Method**: `POST`
- **Path**: `/users/change-password`
- **Xác thực**: Yêu cầu Token (Quyền `USER`, `OPERATOR` hoặc `ADMIN`)
- **Request Body**:
  ```json
  {
    "oldPassword": "Password123",
    "newPassword": "NewPassword123",
    "confirmPassword": "NewPassword123"
  }
  ```
- **Response Body**:
  ```json
  {
    "code": 200,
    "message": "success",
    "data": null
  }
  ```

#### Lấy chi tiết thông tin User bất kỳ bằng ID
- **Method**: `GET`
- **Path**: `/users/{userId}`
- **Xác thực**: Yêu cầu Token (Quyền `ADMIN` hoặc Scope `user.read`)
- **Response Body**: Trả về đối tượng `UserResponse` của userId tương ứng.

#### Xem danh sách toàn bộ User (Phân trang)
- **Method**: `GET`
- **Path**: `/users`
- **Xác thực**: Yêu cầu Token (Quyền `ADMIN`)
- **Query Parameters**:
  - `page`: Chỉ số trang, bắt đầu từ `0` (Mặc định `0`)
  - `size`: Số lượng bản ghi mỗi trang (Mặc định `10`)
- **Response Body**: Trả về một đối tượng Page chứa mảng `UserResponse` và thông tin tổng số phần tử.

#### Khóa Tài khoản người dùng (Lock User)
- **Method**: `PATCH`
- **Path**: `/users/{userId}/lock`
- **Xác thực**: Yêu cầu Token (Quyền `ADMIN`)
- **Response Body**:
  ```json
  {
    "code": 200,
    "message": "success",
    "data": null
  }
  ```

#### Mở khóa Tài khoản người dùng (Unlock User)
- **Method**: `PATCH`
- **Path**: `/users/{userId}/unlock`
- **Xác thực**: Yêu cầu Token (Quyền `ADMIN`)
- **Response Body**:
  ```json
  {
    "code": 200,
    "message": "success",
    "data": null
  }
  ```

#### Nâng cấp quyền người dùng lên Nhà xe (Promote to Operator)
- **Method**: `PATCH`
- **Path**: `/users/{userId}/promote-operator`
- **Xác thực**: Yêu cầu Token (Quyền `ADMIN`)
- **Mô tả**: Thay đổi vai trò (Role) của người dùng từ `USER` lên thành `OPERATOR`.
- **Response Body**:
  ```json
  {
    "code": 200,
    "message": "success",
    "data": null
  }
  ```

---

### 3.3. CORE SERVICE (`/core/**`)

#### Lấy danh sách toàn bộ Tỉnh/Thành phố (Get All Cities)
- **Method**: `GET`
- **Path**: `/core/cities`
- **Xác thực**: Không yêu cầu (Public)
- **Mô tả**: Lấy danh sách toàn bộ các tỉnh/thành phố hỗ trợ việc tìm kiếm và lọc tuyến đường/lịch trình.
- **Response Body**:
  ```json
  {
    "code": 200,
    "message": "success",
    "data": [
      {
        "id": 1,
        "name": "Hồ Chí Minh",
        "code": "HCM",
        "createdAt": "2026-07-20T10:30:00"
      },
      {
        "id": 2,
        "name": "Đà Lạt",
        "code": "DL",
        "createdAt": "2026-07-20T10:30:00"
      }
    ]
  }
  ```

#### Tìm kiếm tuyến đường công khai (Find Routes)
- **Method**: `GET`
- **Path**: `/core/routes`
- **Xác thực**: Không yêu cầu (Public)
- **Query Parameters (Bộ lọc RouteFilter & Phân trang)**:
  - `departureCityId`: ID của thành phố đi (Optional)
  - `arrivalCityId`: ID của thành phố đến (Optional)
  - `operatorId`: ID của nhà xe quản lý tuyến (Optional)
  - `status`: Trạng thái tuyến xe (e.g. `ACTIVE`, `INACTIVE` - Optional)
  - `page`: Trang cần lấy (Mặc định `0`)
  - `size`: Kích thước trang (Mặc định `10`)
- **Response Body**:
  ```json
  {
    "code": 200,
    "message": "success",
    "data": {
      "content": [
        {
          "id": 10,
          "routeCode": "SG-DL-01",
          "distance": 310.5,
          "estimatedDurationMinutes": 360,
          "status": "ACTIVE",
          "operatorResponse": {
            "id": "op_9837a28f",
            "companyName": "Phương Trang FUTA Bus Lines",
            "taxCode": "0301234567",
            "contactPhone": "19006067",
            "avatarUrl": "https://futa.vn/logo.png"
          },
          "departureCityName": "Hồ Chí Minh",
          "arrivalCityName": "Đà Lạt"
        }
      ],
      "totalElements": 1,
      "totalPages": 1,
      "page": 0,
      "size": 10
    }
  }
  ```

#### Xem chi tiết một tuyến đường và các trạm dừng (Get Route Detail)
- **Method**: `GET`
- **Path**: `/core/routes/{routeId}`
- **Xác thực**: Không yêu cầu (Public)
- **Response Body**:
  ```json
  {
    "code": 200,
    "message": "success",
    "data": {
      "id": 10,
      "routeCode": "SG-DL-01",
      "distance": 310.5,
      "estimatedDurationMinutes": 360,
      "status": "ACTIVE",
      "operatorResponse": { ... },
      "departureCityName": "Hồ Chí Minh",
      "arrivalCityName": "Đà Lạt",
      "routeStopResponse": [
        {
          "id": 101,
          "stopOrder": 1,
          "stopName": "Bến xe Miền Tây",
          "distanceFromStart": 0.0,
          "estimatedArrivalOffsetMinutes": 0,
          "isPickup": true,
          "isDropOff": false,
          "cityName": "Hồ Chí Minh"
        },
        {
          "id": 102,
          "stopOrder": 2,
          "stopName": "Trạm dừng Bảo Lộc",
          "distanceFromStart": 180.0,
          "estimatedArrivalOffsetMinutes": 220,
          "isPickup": true,
          "isDropOff": true,
          "cityName": "Lâm Đồng"
        },
        {
          "id": 103,
          "stopOrder": 3,
          "stopName": "Bến xe Đà Lạt",
          "distanceFromStart": 310.5,
          "estimatedArrivalOffsetMinutes": 360,
          "isPickup": false,
          "isDropOff": true,
          "cityName": "Đà Lạt"
        }
      ]
    }
  }
  ```

#### Tạo tuyến xe mới (Create Route)
- **Method**: `POST`
- **Path**: `/core/routes`
- **Xác thực**: Yêu cầu Token (Quyền `OPERATOR`)
- **Request Body**:
  ```json
  {
    "routeCode": "SG-DL-01",
    "departureCityId": 1,
    "arrivalCityId": 5,
    "distance": 310.5,
    "estimatedDurationMinutes": 360,
    "routeStops": [
      {
        "stopOrder": 1,
        "stopName": "Bến xe Miền Tây",
        "distanceFromStart": 0,
        "estimatedArrivalOffsetMinutes": 0,
        "isPickup": true,
        "isDropOff": false,
        "cityId": 1
      },
      {
        "stopOrder": 2,
        "stopName": "Bến xe Đà Lạt",
        "distanceFromStart": 310.5,
        "estimatedArrivalOffsetMinutes": 360,
        "isPickup": false,
        "isDropOff": true,
        "cityId": 5
      }
    ]
  }
  ```
- **Response Body**: Trả về `RouteDetailResponse` của tuyến đường vừa tạo thành công.

#### Cập nhật tuyến xe (Update Route)
- **Method**: `PUT`
- **Path**: `/core/routes/{routeId}`
- **Xác thực**: Yêu cầu Token (Quyền `OPERATOR`)
- **Request Body**: Cấu trúc tương tự CreateRouteRequest.
- **Response Body**: Trả về `RouteDetailResponse` sau khi cập nhật.

#### Đổi trạng thái tuyến xe ngưng hoạt động (Deactivate Route)
- **Method**: `PATCH`
- **Path**: `/core/routes/{routeId}/status`
- **Xác thực**: Yêu cầu Token (Quyền `OPERATOR`)
- **Response Body**: Trả về code `200` nếu thành công.

#### Tạo mới Lịch trình chuyến xe (Create Schedule)
- **Method**: `POST`
- **Path**: `/core/schedules`
- **Xác thực**: Yêu cầu Token (Quyền `OPERATOR`)
- **Request Body**:
  ```json
  {
    "routeId": 10,
    "vehicleId": 2,
    "departureTime": "2026-07-25T08:00:00",
    "arrivalTime": "2026-07-25T14:00:00",
    "basePrice": 250000.00,
    "vipPrice": 350000.00
  }
  ```
- **Response Body**:
  ```json
  {
    "code": 201,
    "message": "success",
    "data": {
      "id": 50,
      "operatorId": "op_9837a28f",
      "departureTime": "2026-07-25T08:00:00",
      "arrivalTime": "2026-07-25T14:00:00",
      "basePrice": 250000.00,
      "vipPrice": 350000.00,
      "availableSeats": 40,
      "totalSeats": 40,
      "status": "OPEN"
    }
  }
  ```

#### Hủy lịch trình chuyến xe (Cancel Schedule)
- **Method**: `PATCH`
- **Path**: `/core/schedules/{id}/cancel`
- **Xác thực**: Yêu cầu Token (Quyền `OPERATOR`)
- **Response Body**: Trả về thông báo thành công, trạng thái chuyến chuyển thành `CANCELLED`.

#### Cập nhật Lịch trình
- **Method**: `PUT`
- **Path**: `/core/schedules/{id}`
- **Xác thực**: Yêu cầu Token (Quyền `OPERATOR`)
- **Request Body**: Cấu trúc tương tự CreateScheduleRequest.
- **Response Body**: Trả về thông báo thành công.

#### Tìm kiếm lịch trình các chuyến xe (Find Schedules - Dùng cho Khách tìm chuyến)
- **Method**: `GET`
- **Path**: `/core/schedules`
- **Xác thực**: Không yêu cầu (Public)
- **Query Parameters (ScheduleFilter)**:
  - `routeId`: Lọc theo ID tuyến đường (Optional)
  - `departureCityId`: Điểm xuất phát (Optional)
  - `arrivalCityId`: Điểm kết thúc (Optional)
  - `departureTime`: Lọc từ thời gian đi (Optional, format: `2026-07-25T00:00:00`)
  - `arrivalTime`: Lọc tới thời gian đến (Optional)
  - `vehicleTypeId`: Lọc theo loại xe (Optional)
  - `status`: Trạng thái lịch trình (e.g. `OPEN`, `RUNNING`, `COMPLETED` - Optional)
  - `page`: (Mặc định `0`)
  - `size`: (Mặc định `10`)
- **Response Body**:
  ```json
  {
    "code": 200,
    "message": "success",
    "data": {
      "content": [
        {
          "id": 50,
          "operatorId": "op_9837a28f",
          "departureTime": "2026-07-25T08:00:00",
          "arrivalTime": "2026-07-25T14:00:00",
          "basePrice": 250000.00,
          "vipPrice": 350000.00,
          "availableSeats": 38,
          "totalSeats": 40,
          "status": "OPEN"
        }
      ],
      "totalElements": 1,
      "totalPages": 1,
      "page": 0,
      "size": 10
    }
  }
  ```

#### Xem chi tiết một Lịch trình chuyến xe
- **Method**: `GET`
- **Path**: `/core/schedules/{id}`
- **Xác thực**: Không yêu cầu (Public)
- **Response Body**: Trả về `ScheduleDetailResponse` chứa thông tin chi tiết lịch trình, đối tượng `VehicleResponse` và đối tượng `RouteDetailResponse`.

#### Xem trạng thái sơ đồ ghế ngồi của một lịch trình (Get Schedule Seats)
- **Method**: `GET`
- **Path**: `/core/schedules/{id}/seats`
- **Xác thực**: Không yêu cầu (Public)
- **Mô tả**: Dùng để hiển thị sơ đồ xe cho khách hàng chọn ghế trống. Cho biết ghế nào đã được mua (`BOOKED`), ghế nào đang được giữ tạm thời (`HELD`), hoặc ghế nào còn trống (`AVAILABLE`).
- **Response Body**:
  ```json
  {
    "code": 200,
    "message": "success",
    "data": [
      {
        "id": 5001,
        "price": 250000.00,
        "heldBy": null,
        "heldAt": null,
        "expiresAt": null,
        "status": "AVAILABLE",
        "seatResponse": {
          "id": 201,
          "seatNumber": "A01",
          "floor": 1,
          "row": 1,
          "col": 1,
          "seatType": "SLEEPER",
          "status": "ACTIVE",
          "isVip": false
        }
      },
      {
        "id": 5002,
        "price": 350000.00,
        "heldBy": "usr_92f8c5b1",
        "heldAt": "2026-07-23T21:10:00",
        "expiresAt": "2026-07-23T21:20:00",
        "status": "HELD",
        "seatResponse": {
          "id": 202,
          "seatNumber": "VIP01",
          "floor": 1,
          "row": 1,
          "col": 2,
          "seatType": "SLEEPER",
          "status": "ACTIVE",
          "isVip": true
        }
      }
    ]
  }
  ```

#### Lấy danh sách toàn bộ nhà xe (Get All Operators)
- **Method**: `GET`
- **Path**: `/core/operators`
- **Xác thực**: Không yêu cầu (Public)
- **Response Body**:
  ```json
  {
    "code": 200,
    "message": "success",
    "data": [
      {
        "id": "op_9837a28f",
        "companyName": "Phương Trang FUTA Bus Lines",
        "taxCode": "0301234567",
        "contactPhone": "19006067",
        "avatarUrl": "https://futa.vn/logo.png"
      }
    ]
  }
  ```

#### Lấy thông tin hồ sơ nhà xe của tôi (Get My Operator Profile)
- **Method**: `GET`
- **Path**: `/core/operators/me`
- **Xác thực**: Yêu cầu Token (Quyền `OPERATOR`)
- **Response Body**: Trả về `OperatorResponse`.

#### Lấy thông tin nhà xe qua Operator ID
- **Method**: `GET`
- **Path**: `/core/operators/{operatorId}`
- **Xác thực**: Yêu cầu Token (Quyền `ADMIN`)
- **Response Body**: Trả về `OperatorResponse`.

#### Lấy thông tin nhà xe qua User ID
- **Method**: `GET`
- **Path**: `/core/operators/by-user/{userId}`
- **Xác thực**: Yêu cầu Token (Scope `core.read`)
- **Response Body**: Trả về `OperatorResponse`.

#### Tạo mới hồ sơ Nhà xe (Register Operator Profile)
- **Method**: `POST`
- **Path**: `/core/operators`
- **Xác thực**: Yêu cầu Token (Quyền `OPERATOR`)
- **Request Body**:
  ```json
  {
    "companyName": "Phương Trang FUTA Bus Lines",
    "taxCode": "0301234567",
    "contactPhone": "19006067"
  }
  ```
- **Response Body**: Trả về `OperatorResponse` vừa được tạo.

#### Cập nhật hồ sơ Nhà xe
- **Method**: `PUT`
- **Path**: `/core/operators`
- **Xác thực**: Yêu cầu Token (Quyền `OPERATOR`)
- **Request Body**:
  ```json
  {
    "companyName": "Phương Trang FUTA Bus Lines (Cập nhật)",
    "taxCode": "0301234567",
    "contactPhone": "19006068",
    "avatarUrl": "https://futa.vn/new-logo.png"
  }
  ```
- **Response Body**: Trả về kết quả thành công.

#### Lấy thông tin chi tiết một Xe (Get Vehicle Detail)
- **Method**: `GET`
- **Path**: `/core/vehicles/{vehicleId}`
- **Xác thực**: Yêu cầu Token (Quyền `OPERATOR`)
- **Response Body**:
  ```json
  {
    "code": 200,
    "message": "success",
    "data": {
      "id": 1,
      "licensePlate": "51B-123.45",
      "brand": "Thaco",
      "model": "Mobihome 2024",
      "totalSeats": 40,
      "description": "Xe giường nằm cao cấp 40 chỗ có wifi, nước uống miễn phí.",
      "status": "ACTIVE",
      "vehicleType": {
        "id": 1,
        "seatType": "BED",
        "code": "SLEEPER_2F",
        "name": "Xe giường nằm 2 tầng",
        "floors": 2,
        "rows": 6,
        "cols": 3
      },
      "operatorResponse": {
        "id": "op_9837a28f",
        "companyName": "Phương Trang FUTA Bus Lines",
        "taxCode": "0301234567",
        "contactPhone": "19006067",
        "avatarUrl": "https://futa.vn/logo.png"
      }
    }
  }
  ```

#### Xem danh sách Xe của nhà xe hiện tại (Get My Vehicles)
- **Method**: `GET`
- **Path**: `/core/vehicles`
- **Xác thực**: Yêu cầu Token (Quyền `OPERATOR`)
- **Query Parameters**: Phân trang `page` và `size`.
- **Response Body**: Trả về Page chứa danh sách `VehicleResponse`.

#### Tạo mới Xe (Create Vehicle)
- **Method**: `POST`
- **Path**: `/core/vehicles`
- **Xác thực**: Yêu cầu Token (Quyền `OPERATOR`)
- **Request Body**:
  ```json
  {
    "licensePlate": "51B-123.45",
    "brand": "Thaco",
    "model": "Mobihome 2024",
    "totalSeats": 40,
    "description": "Xe giường nằm cao cấp 40 chỗ có wifi, nước uống miễn phí.",
    "vehicleTypeId": 1
  }
  ```
- **Response Body**: Trả về `VehicleResponse` vừa tạo thành công.

#### Cập nhật Xe
- **Method**: `PUT`
- **Path**: `/core/vehicles/{vehicleId}`
- **Xác thực**: Yêu cầu Token (Quyền `OPERATOR`)
- **Request Body**: Cấu trúc tương tự CreateVehicleRequest.
- **Response Body**: Trả về thành công.

#### Đổi trạng thái hoạt động của Xe
- **Method**: `PATCH`
- **Path**: `/core/vehicles/{vehicleId}/status`
- **Xác thực**: Yêu cầu Token (Quyền `OPERATOR`)
- **Headers**: `Content-Type: text/plain`
- **Request Body**: Trạng thái mới (ví dụ: `INACTIVE`, `ACTIVE`)
- **Response Body**: Trả về thành công.

#### Xem sơ đồ ghế gốc của một Xe
- **Method**: `GET`
- **Path**: `/core/vehicles/{vehicleId}/seats`
- **Xác thực**: Yêu cầu Token (Quyền `OPERATOR`)
- **Response Body**: Trả về danh sách `SeatResponse` biểu diễn cấu trúc ghế trên xe thực tế.

#### Cập nhật trạng thái một ghế ngồi cố định
- **Method**: `PATCH`
- **Path**: `/core/seats/{seatId}/status`
- **Xác thực**: Yêu cầu Token (Quyền `OPERATOR`)
- **Request Body**:
  ```json
  {
    "status": "INACTIVE"
  }
  ```
- **Response Body**: Trả về thành công.

#### Chuyển đổi trạng thái VIP của ghế (Toggle VIP)
- **Method**: `PATCH`
- **Path**: `/core/seats/{seatId}/isVip`
- **Xác thực**: Yêu cầu Token (Quyền `OPERATOR`)
- **Response Body**: Trả về thành công (Đổi ghế từ thường sang VIP và ngược lại).

#### Lấy danh sách các Loại xe (Get Vehicle Types)
- **Method**: `GET`
- **Path**: `/core/vehicleTypes`
- **Xác thực**: Yêu cầu Token (Quyền `OPERATOR` hoặc `ADMIN`)
- **Response Body**:
  ```json
  {
    "code": 200,
    "message": "success",
    "data": [
      {
        "id": 1,
        "seatType": "BED",
        "code": "SLEEPER_2F",
        "name": "Xe giường nằm 2 tầng",
        "floors": 2,
        "rows": 6,
        "cols": 3
      }
    ]
  }
  ```

#### Tạo loại xe mới (Create Vehicle Type)
- **Method**: `POST`
- **Path**: `/core/vehicleTypes`
- **Xác thực**: Yêu cầu Token (Quyền `ADMIN`)
- **Request Body**:
  ```json
  {
    "seatType": "SEAT",
    "code": "LIMOUSINE_9S",
    "name": "Xe Limousine 9 chỗ VIP",
    "floors": 1,
    "rows": 3,
    "cols": 3
  }
  ```
- **Response Body**: Trả về `VehicleTypeResponse` chứa thông tin loại xe vừa được tạo.

#### Cập nhật thông tin loại xe (Update Vehicle Type)
- **Method**: `PUT`
- **Path**: `/core/vehicleTypes/{vehicleTypeId}`
- **Xác thực**: Yêu cầu Token (Quyền `ADMIN`)
- **Request Body**: Tương tự như CreateVehicleTypeRequest.
- **Response Body**: Trả về code `200` nếu thành công.

#### Xóa loại xe (Delete Vehicle Type)
- **Method**: `DELETE`
- **Path**: `/core/vehicleTypes/{vehicleTypeId}`
- **Xác thực**: Yêu cầu Token (Quyền `ADMIN`)
- **Response Body**: Trả về code `200` nếu thành công.

#### Lấy danh sách các loại ghế/giường (Get Seat Types)
- **Method**: `GET`
- **Path**: `/core/seatType`
- **Xác thực**: Yêu cầu Token (Quyền `ADMIN`)
- **Response Body**:
  ```json
  {
    "code": 200,
    "message": "success",
    "data": [
      "SEAT",
      "BED"
    ]
  }
  ```

#### Đặt vé xe (Create Booking)
- **Method**: `POST`
- **Path**: `/core/bookings`
- **Xác thực**: Yêu cầu Token (Quyền `USER`)
- **Request Body**:
  ```json
  {
    "scheduleId": 50,
    "scheduleSeatIds": [5001, 5002]
  }
  ```
- **Response Body**:
  ```json
  {
    "code": 200,
    "message": "success",
    "data": {
      "id": 80001,
      "userId": "usr_92f8c5b1",
      "operatorId": "op_9837a28f",
      "bookingCode": "BK172359",
      "totalAmount": 600000.00,
      "paymentDeadline": "2026-07-23T21:30:00",
      "createAt": "2026-07-23T21:15:00",
      "status": "PENDING"
    }
  }
  ```

#### Xem chi tiết một đơn đặt vé của bản thân
- **Method**: `GET`
- **Path**: `/core/bookings/me/{id}`
- **Xác thực**: Yêu cầu Token (Quyền `USER`)
- **Response Body**:
  ```json
  {
    "code": 200,
    "message": "success",
    "data": {
      "id": 80001,
      "userId": "usr_92f8c5b1",
      "operatorId": "op_9837a28f",
      "bookingCode": "BK172359",
      "totalAmount": 600000.00,
      "paymentDeadline": "2026-07-23T21:30:00",
      "createAt": "2026-07-23T21:15:00",
      "status": "PENDING",
      "scheduleSummaryResponse": {
        "id": 50,
        "operatorId": "op_9837a28f",
        "departureTime": "2026-07-25T08:00:00",
        "arrivalTime": "2026-07-25T14:00:00",
        "basePrice": 250000.00,
        "vipPrice": 350000.00,
        "availableSeats": 38,
        "totalSeats": 40,
        "status": "OPEN"
      },
      "scheduleSeatResponseList": [
        {
          "id": 5001,
          "price": 250000.00,
          "status": "HELD",
          "seatResponse": {
            "seatNumber": "A01",
            "floor": 1,
            "row": 1,
            "col": 1,
            "isVip": false
          }
        },
        {
          "id": 5002,
          "price": 350000.00,
          "status": "HELD",
          "seatResponse": {
            "seatNumber": "VIP01",
            "floor": 1,
            "row": 1,
            "col": 2,
            "isVip": true
          }
        }
      ]
    }
  }
  ```

#### Xem danh sách đơn đặt vé của bản thân (Paged)
- **Method**: `GET`
- **Path**: `/core/bookings/me`
- **Xác thực**: Yêu cầu Token (Quyền `USER`)
- **Query Parameters (BookingFilter & Phân trang)**:
  - `operatorId`: ID của nhà xe lọc vé (Optional)
  - `departureTime`: Khung thời gian đi bắt đầu lọc (Optional, format ISO)
  - `arrivalTime`: Khung thời gian đến lọc (Optional, format ISO)
  - `page`: Chỉ số trang (Mặc định `0`)
  - `size`: Kích thước trang (Mặc định `10`)
- **Response Body**:
  ```json
  {
    "code": 200,
    "message": "success",
    "data": {
      "content": [
        {
          "id": 80001,
          "userId": "usr_92f8c5b1",
          "operatorId": "op_9837a28f",
          "bookingCode": "BK172359",
          "totalAmount": 600000.00,
          "paymentDeadline": "2026-07-23T21:30:00",
          "createAt": "2026-07-23T21:15:00",
          "status": "PENDING"
        }
      ],
      "totalElements": 1,
      "totalPages": 1,
      "page": 0,
      "size": 10
    }
  }
  ```

#### Xem chi tiết một đơn đặt vé bất kỳ (Get Booking Detail by ID)
- **Method**: `GET`
- **Path**: `/core/bookings/{id}`
- **Xác thực**: Yêu cầu Token (Scope `core.read`)
- **Response Body**: Trả về `BookingSummaryResponse` của đơn đặt vé tương ứng.

#### Hủy đơn đặt vé (Cancel Booking)
- **Method**: `PATCH`
- **Path**: `/core/bookings/{bookingId}/cancel`
- **Xác thực**: Yêu cầu Token (Quyền `USER`)
- **Response Body**: Trả về code `200` nếu hủy thành công, trả các ghế đã đặt về trạng thái trống.

#### Xem thống kê tổng quan của Nhà xe (Statistical Overview)
- **Method**: `GET`
- **Path**: `/core/statistic/overview`
- **Xác thực**: Yêu cầu Token (Quyền `OPERATOR`)
- **Response Body**:
  ```json
  {
    "code": 200,
    "message": "success",
    "data": {
      "totalBookings": 1500,
      "completedBookings": 1400,
      "cancelledBookings": 80,
      "pendingBookings": 20,
      "todayRevenue": 15200000.00,
      "monthRevenue": 482000000.00,
      "totalRevenue": 2405000000.00,
      "activeRoute": 5,
      "activeVehicle": 12,
      "openSchedule": 8,
      "runningSchedule": 2
    }
  }
  ```

#### Xem thống kê doanh thu theo mốc thời gian (Revenue Chart)
- **Method**: `GET`
- **Path**: `/core/statistic/revenue`
- **Xác thực**: Yêu cầu Token (Quyền `OPERATOR`)
- **Query Parameters (StatisticFilter)**:
  - `from`: Ngày bắt đầu (e.g. `2026-07-01`)
  - `to`: Ngày kết thúc (e.g. `2026-07-23`)
  - `statisticType`: Loại thống kê thời gian (e.g. `DAILY`, `MONTHLY`)
- **Response Body**:
  ```json
  {
    "code": 200,
    "message": "success",
    "data": [
      {
        "label": "2026-07-21",
        "revenue": 14500000.00
      },
      {
        "label": "2026-07-22",
        "revenue": 16200000.00
      }
    ]
  }
  ```

#### Xem top các tuyến đường đem lại nhiều doanh thu nhất (Top Routes)
- **Method**: `GET`
- **Path**: `/core/statistic/routes/top`
- **Xác thực**: Yêu cầu Token (Quyền `OPERATOR`)
- **Response Body**: Trả về danh sách `TopRouteResponse` gồm `routeId`, `routeCode`, `revenue`.

#### Xem top các Xe khách đem lại nhiều doanh thu nhất (Top Vehicles)
- **Method**: `GET`
- **Path**: `/core/statistic/vehicles/top`
- **Xác thực**: Yêu cầu Token (Quyền `OPERATOR`)
- **Response Body**: Trả về danh sách `TopVehicleResponse` gồm `vehicleId`, `licensePlate`, `revenue`.

---

### 3.4. PAYMENT SERVICE (`/payments/**`)

#### Đăng ký Tài khoản nhà bán cấu hình ví VNPay (Create Merchant)
- **Method**: `POST`
- **Path**: `/payments/merchants`
- **Xác thực**: Yêu cầu Token (Quyền `OPERATOR`)
- **Request Body**:
  ```json
  {
    "provider": "VNPAY",
    "merchantCode": "VNPAY_MERCHANT_FUTA",
    "secretKey": "VNPaySecretKeyABC"
  }
  ```
- **Response Body**:
  ```json
  {
    "code": 200,
    "message": "success",
    "data": {
      "id": "mer_02847aef",
      "operatorId": "op_9837a28f",
      "provider": "VNPAY",
      "merchantCode": "VNPAY_MERCHANT_FUTA",
      "secretKey": "VNPaySecretKeyABC",
      "active": true,
      "createAt": "2026-07-23T21:15:00"
    }
  }
  ```

#### Xem danh sách các tài khoản cấu hình ví nhà bán (Get My Merchants - Paged)
- **Method**: `GET`
- **Path**: `/payments/merchants`
- **Xác thực**: Yêu cầu Token (Quyền `OPERATOR`)
- **Query Parameters**:
  - `page`: Chỉ số trang (Mặc định `0`)
  - `size`: Kích thước trang (Mặc định `5`)
- **Response Body**: Trả về Page chứa mảng các `MerchantResponse`.

#### Cập nhật tài khoản ví nhà bán (Update Merchant)
- **Method**: `PUT`
- **Path**: `/payments/merchants/{id}`
- **Xác thực**: Yêu cầu Token (Quyền `OPERATOR`)
- **Request Body**:
  ```json
  {
    "merchantCode": "VNPAY_MERCHANT_FUTA_NEW",
    "secretKey": "VNPaySecretKeyDEF",
    "active": true
  }
  ```
- **Response Body**: Trả về `MerchantResponse` mới được cập nhật.

#### Xem thông tin cấu hình ví nhà bán
- **Method**: `GET`
- **Path**: `/payments/merchants/{id}`
- **Xác thực**: Yêu cầu Token (Quyền `OPERATOR`)
- **Response Body**: Trả về `MerchantResponse` tương ứng.

#### Tạo link thanh toán VNPay cho Đơn đặt vé (Create Payment Link)
- **Method**: `POST`
- **Path**: `/payments`
- **Xác thực**: Yêu cầu Token (Quyền `USER`)
- **Mô tả**: Sau khi gọi đặt vé thành công ở Core Service và nhận về `bookingId`, Client gọi API này để lấy URL thanh toán VNPay. Client sẽ chuyển hướng người dùng tới URL này để thực hiện thanh toán qua thẻ ngân hàng/quét mã QR.
- **Request Body**:
  ```json
  {
    "provider": "VNPAY",
    "bookingId": 80001
  }
  ```
- **Response Body**:
  ```json
  {
    "code": 200,
    "message": "success",
    "data": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=60000000&vnp_Command=pay&vnp_CreateDate=20260723211500..."
  }
  ```

#### Cổng nhận kết quả thanh toán bất đồng bộ từ VNPay (VNPay IPN Callback)
- **Method**: `GET`
- **Path**: `/payments/vnpay/ipn`
- **Xác thực**: Không yêu cầu (Public - được gọi trực tiếp bởi máy chủ VNPay)
- **Query Parameters**: Danh sách các tham số phản hồi giao dịch từ phía VNPay (e.g. `vnp_ResponseCode`, `vnp_TxnRef`, `vnp_SecureHash`...).
- **Mô tả**: Xử lý logic nghiệp vụ khi thanh toán thành công hay thất bại. Đồng thời bắn sự kiện qua Kafka để cập nhật trạng thái đơn đặt vé ở Core Service và gửi email xác nhận ở Notification Service.
- **Response Body**: Trả về status chuẩn của VNPay IPN (thường là JSON phản hồi mã lỗi/thành công theo đặc tả VNPay).

#### Xem lịch sử thanh toán giao dịch cá nhân (Get My Payments)
- **Method**: `GET`
- **Path**: `/payments/me`
- **Xác thực**: Yêu cầu Token (Quyền `USER`)
- **Query Parameters**: Phân trang `page` và `size`.
- **Response Body**:
  ```json
  {
    "code": 200,
    "message": "success",
    "data": {
      "content": [
        {
          "id": "pay_928174f",
          "userId": "usr_92f8c5b1",
          "amount": 600000.00,
          "status": "SUCCESS",
          "provider": "VNPAY",
          "transactionId": "14567289",
          "txnRef": "BK172359_1721773021",
          "createdAt": "2026-07-23T21:15:00",
          "paidAt": "2026-07-23T21:18:22",
          "bookingId": 80001
        }
      ],
      "totalElements": 1,
      "totalPages": 1,
      "page": 0,
      "size": 10
    }
  }
  ```

#### Xem danh sách các cổng thanh toán hỗ trợ (Get All Providers)
- **Method**: `GET`
- **Path**: `/payments/providers`
- **Xác thực**: Yêu cầu Token (Quyền `OPERATOR`)
- **Response Body**:
  ```json
  {
    "code": 200,
    "message": "success",
    "data": [
      "VNPAY"
    ]
  }
  ```

---

### 3.5. NOTIFICATION SERVICE (`/notifications/**`)

#### Xem danh sách thông báo của tôi (Get My Notifications)
- **Method**: `GET`
- **Path**: `/notifications`
- **Xác thực**: Yêu cầu Token (Quyền `USER`)
- **Query Parameters**: Phân trang `page` và `size`.
- **Response Body**:
  ```json
  {
    "code": 200,
    "message": "success",
    "data": {
      "content": [
        {
          "id": 901,
          "userId": "usr_92f8c5b1",
          "content": "Bạn đã thanh toán thành công đơn đặt vé BK172359. Chúc bạn có một hành trình vui vẻ!",
          "isRead": false,
          "createdAt": "2026-07-23T21:19:00",
          "targetCode": "BK172359"
        }
      ],
      "totalElements": 1,
      "totalPages": 1,
      "page": 0,
      "size": 10
    }
  }
  ```

#### Đánh dấu thông báo đã đọc (Mark notification as read)
- **Method**: `PATCH`
- **Path**: `/notifications/{notificationId}/mark`
- **Xác thực**: Yêu cầu Token (Quyền `USER`)
- **Response Body**:
  ```json
  {
    "code": 200,
    "message": "success",
    "data": null
  }
  ```

---
*Tài liệu này được biên soạn tự động từ mã nguồn hệ thống hiện tại của dự án Bus Booking System. Vui lòng không sửa mã nguồn dịch vụ khi đọc hoặc sử dụng các API này.*
