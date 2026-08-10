import uuid
import random
from datetime import datetime, timedelta
import os

# Constants
NUM_USERS = 20
NUM_OPERATORS = 20
NUM_ROUTES = 100
NUM_VEHICLES = 500  # 25 per operator
NUM_SCHEDULES = 5000  # 10 per vehicle
TOTAL_BOOKINGS_TARGET = 100000

# BCrypt hash of "Password123"
BCRYPT_PASSWORD_HASH = "$2a$10$yfja4DWOyX4fe1acVicFz.UW3ubGOR4e16ewpalhwBmHLuzvnliIW"


def generate_mysql_users():
    """Generates the MySQL users seed script for Liquibase."""
    sql_lines = []
    sql_lines.append("--liquibase formatted sql")
    sql_lines.append("--changeset manh:seed_users")
    
    # Add cleanup to make it idempotent
    sql_lines.append("\n-- Clean up existing seed users to prevent duplicate keys on retry")
    sql_lines.append("DELETE FROM users WHERE email LIKE 'customer%' OR email LIKE 'operator%';")
    
    # Generate User UUIDs (using fixed seeds/logic or static UUIDs so they don't change every run,
    # but since this script is run once to generate the static files, random UUIDs are fine)
    user_ids = [str(uuid.uuid5(uuid.NAMESPACE_DNS, f"customer_{i:02d}")) for i in range(1, NUM_USERS + 1)]
    operator_user_ids = [str(uuid.uuid5(uuid.NAMESPACE_DNS, f"operator_{i:02d}")) for i in range(1, NUM_OPERATORS + 1)]
    
    # 20 regular users
    sql_lines.append("\n-- Seeding 20 regular users")
    for i, uid in enumerate(user_ids, 1):
        email = f"customer{i:02d}@gmail.com"
        full_name = f"Khách Hàng {i:02d}"
        phone = f"09123456{i:02d}"
        address = f"Địa chỉ khách hàng {i}"
        gender = "MALE" if i % 2 == 0 else "FEMALE"
        created_at = datetime.now() - timedelta(days=60)
        
        sql = f"INSERT INTO users (id, email, password, full_name, phone, address, avatar_url, gender, enabled, created_at, role_id) VALUES " \
              f"('{uid}', '{email}', '{BCRYPT_PASSWORD_HASH}', '{full_name}', '{phone}', '{address}', 'https://example.com/avatars/user.png', '{gender}', 1, '{created_at.strftime('%Y-%m-%d %H:%M:%S')}', 1);"
        sql_lines.append(sql)
        
    # 20 operator users
    sql_lines.append("\n-- Seeding 20 operator users")
    for i, uid in enumerate(operator_user_ids, 1):
        email = f"operator{i:02d}@gmail.com"
        full_name = f"Nhà Xe Operator {i:02d}"
        phone = f"09876543{i:02d}"
        address = f"Địa chỉ nhà xe {i}"
        gender = "MALE"
        created_at = datetime.now() - timedelta(days=60)
        
        sql = f"INSERT INTO users (id, email, password, full_name, phone, address, avatar_url, gender, enabled, created_at, role_id) VALUES " \
              f"('{uid}', '{email}', '{BCRYPT_PASSWORD_HASH}', '{full_name}', '{phone}', '{address}', 'https://example.com/avatars/operator.png', '{gender}', 1, '{created_at.strftime('%Y-%m-%d %H:%M:%S')}', 2);"
        sql_lines.append(sql)
        
    target_path = "../user-service/src/main/resources/db/changelog/scripts/seed_users.sql"
    os.makedirs(os.path.dirname(target_path), exist_ok=True)
    with open(target_path, "w", encoding="utf-8") as f:
        f.write("\n".join(sql_lines))
        
    return user_ids, operator_user_ids

def generate_postgres_core(user_ids, operator_user_ids):
    """Generates the PostgreSQL core services seed script for Liquibase."""
    sql_lines = []
    sql_lines.append("--liquibase formatted sql")
    sql_lines.append("--changeset manhc:seed_core")
    
    # Add cleanup to make it idempotent
    sql_lines.append("\n-- Clean up existing seed data to prevent duplicate keys on retry")
    sql_lines.append("TRUNCATE TABLE schedule_seat RESTART IDENTITY CASCADE;")
    sql_lines.append("TRUNCATE TABLE booking RESTART IDENTITY CASCADE;")
    sql_lines.append("TRUNCATE TABLE schedule RESTART IDENTITY CASCADE;")
    sql_lines.append("TRUNCATE TABLE seat RESTART IDENTITY CASCADE;")
    sql_lines.append("TRUNCATE TABLE route RESTART IDENTITY CASCADE;")
    sql_lines.append("TRUNCATE TABLE vehicle RESTART IDENTITY CASCADE;")
    sql_lines.append("TRUNCATE TABLE vehicle_type RESTART IDENTITY CASCADE;")
    sql_lines.append("TRUNCATE TABLE operator RESTART IDENTITY CASCADE;")
    
    # 1. Operators (20)
    operator_ids = [str(uuid.uuid5(uuid.NAMESPACE_DNS, f"operator_profile_{i:02d}")) for i in range(1, NUM_OPERATORS + 1)]
    sql_lines.append("\n-- Seeding Operators")
    companies = [
        "Phương Trang FUTA", "Mai Linh Express", "Thành Bưởi", "Hoa Mai", "Toàn Thắng",
        "Kumho Samco", "Sao Việt", "Hải Vân", "Hoàng Long", "Cúc Tùng",
        "Thuận Thảo", "Liên HưngExpress", "Hùng Cường", "Phúc Xuyên", "Vân Anh Limousine",
        "Tràng An Limousine", "Sao Nghệ", "Bình Minh Limousine", "Hải Âu", "Hà Sơn Hải Vân"
    ]
    for i, op_id in enumerate(operator_ids):
        company_name = companies[i]
        tax_code = f"0301234{i:03d}"
        phone = f"190060{i:02d}"
        sql = f"INSERT INTO operator (id, user_id, company_name, tax_code, contact_phone, avatar_url) VALUES " \
              f"('{op_id}', '{operator_user_ids[i]}', '{company_name}', '{tax_code}', '{phone}', 'https://example.com/logos/op_{i}.png');"
        sql_lines.append(sql)

    # 2. Vehicle Types (4)
    sql_lines.append("\n-- Seeding Vehicle Types")
    sql_lines.append("INSERT INTO vehicle_type (id, seat_type, code, name, floors, \"rows\", cols) VALUES (1, 'SEAT', 'VT16', 'Ford Solati 16 chỗ', 1, 4, 4);")
    sql_lines.append("INSERT INTO vehicle_type (id, seat_type, code, name, floors, \"rows\", cols) VALUES (2, 'SEAT', 'VT29', 'Samco Felix 29 chỗ', 1, 10, 3);")
    sql_lines.append("INSERT INTO vehicle_type (id, seat_type, code, name, floors, \"rows\", cols) VALUES (3, 'BED', 'VT34S', 'Thaco Mobihome 34 Phòng', 2, 6, 3);")
    sql_lines.append("INSERT INTO vehicle_type (id, seat_type, code, name, floors, \"rows\", cols) VALUES (4, 'BED', 'VT45S', 'Hyundai Universe 45 chỗ', 2, 8, 3);")
    sql_lines.append("SELECT setval('vehicle_type_id_seq', 4);")

    # 3. Vehicles (500)
    sql_lines.append("\n-- Seeding Vehicles")
    brands = {1: "Ford", 2: "Samco", 3: "Thaco", 4: "Hyundai"}
    models = {1: "Solati", 2: "Felix", 3: "Mobihome", 4: "Universe"}
    seat_counts = {1: 16, 2: 29, 3: 34, 4: 45}
    
    vehicles = []
    vehicle_id_counter = 1
    
    seats_sql_batch = []
    seat_id_counter = 1
    
    for op_idx, op_id in enumerate(operator_ids):
        for v_idx in range(1, 26):
            type_id = random.choice([1, 2, 3, 4])
            license_plate = f"{random.choice([29, 30, 51, 79, 49])}B-{random.randint(10000, 99999)}"
            brand = brands[type_id]
            model = models[type_id]
            total_seats = seat_counts[type_id]
            
            sql = f"INSERT INTO vehicle (id, license_plate, brand, model, total_seats, description, status, operator_id, vehicle_type_id) VALUES " \
                  f"({vehicle_id_counter}, '{license_plate}', '{brand}', '{model}', {total_seats}, 'Xe chất lượng cao', 'ACTIVE', '{op_id}', {type_id});"
            sql_lines.append(sql)
            
            vehicles.append({
                'id': vehicle_id_counter,
                'total_seats': total_seats,
                'operator_id': op_id,
                'type_id': type_id
            })
            
            if type_id == 1:
                floors, rows, cols = 1, 4, 4
            elif type_id == 2:
                floors, rows, cols = 1, 10, 3
            elif type_id == 3:
                floors, rows, cols = 2, 6, 3
            else:
                floors, rows, cols = 2, 8, 3
                
            seat_count_added = 0
            for f in range(1, floors + 1):
                for r in range(1, rows + 1):
                    for c in range(1, cols + 1):
                        if seat_count_added >= total_seats:
                            break
                        seat_count_added += 1
                        seat_number = f"T{f}-G{r:02d}-{c}" if floors > 1 else f"G{r:02d}-{c}"
                        is_vip = True if r in [1, 2] else False
                        seat_type = "BED" if type_id in [3, 4] else "SEAT"
                        
                        seats_sql_batch.append(
                            f"({seat_id_counter}, '{seat_number}', {f}, {r}, {c}, {'TRUE' if is_vip else 'FALSE'}, '{seat_type}', 'ACTIVE', {vehicle_id_counter})"
                        )
                        seat_id_counter += 1
                        
            vehicle_id_counter += 1

    sql_lines.append(f"SELECT setval('vehicle_id_seq', {vehicle_id_counter - 1});")

    sql_lines.append("\n-- Seeding Seats (Batch Insert)")
    batch_size = 1000
    for idx in range(0, len(seats_sql_batch), batch_size):
        batch = seats_sql_batch[idx : idx + batch_size]
        sql_lines.append("INSERT INTO seat (id, seat_number, floor, \"row\", col, is_vip, seat_type, status, vehicle_id) VALUES " + ", ".join(batch) + ";")
    sql_lines.append(f"SELECT setval('seat_id_seq', {seat_id_counter - 1});")

    # 4. Routes (100)
    sql_lines.append("\n-- Seeding Routes")
    routes = []
    route_id_counter = 1
    
    for op_idx, op_id in enumerate(operator_ids):
        for r_idx in range(5):
            dep_city_id = random.randint(1, 34)
            arr_city_id = random.randint(1, 34)
            while arr_city_id == dep_city_id:
                arr_city_id = random.randint(1, 34)
                
            route_code = f"RT-{op_idx+1:02d}-{r_idx+1:02d}"
            distance = round(random.uniform(70.0, 480.0), 2)
            duration = int(distance * 1.5 + 30)
            
            sql = f"INSERT INTO route (id, route_code, distance, estimated_duration_minutes, status, operator_id, departure_city_id, arrival_city_id) VALUES " \
                  f"({route_id_counter}, '{route_code}', {distance}, {duration}, 'ACTIVE', '{op_id}', {dep_city_id}, {arr_city_id});"
            sql_lines.append(sql)
            
            routes.append({
                'id': route_id_counter,
                'operator_id': op_id,
                'duration': duration
            })
            route_id_counter += 1
            
    sql_lines.append(f"SELECT setval('route_id_seq', {route_id_counter - 1});")

    # 5. Schedules (5000)
    sql_lines.append("\n-- Seeding Schedules")
    schedules = []
    schedule_id_counter = 1
    base_date = datetime.now() - timedelta(days=15)
    
    for v in vehicles:
        v_id = v['id']
        op_id = v['operator_id']
        total_seats = v['total_seats']
        
        op_routes = [r for r in routes if r['operator_id'] == op_id]
        if not op_routes:
            continue
            
        for s_idx in range(10):
            route = random.choice(op_routes)
            dep_time = base_date + timedelta(days=s_idx * 2, hours=random.randint(5, 20))
            arr_time = dep_time + timedelta(minutes=route['duration'])
            
            base_price = random.choice([120000, 150000, 180000, 220000, 250000, 300000])
            vip_price = int(base_price * 1.4)
            
            sql = f"INSERT INTO schedule (id, departure_time, arrival_time, base_price, vip_price, available_seats, total_seats, operator_id, status, route_id, vehicle_id) VALUES " \
                  f"({schedule_id_counter}, '{dep_time.strftime('%Y-%m-%d %H:%M:%S')}', '{arr_time.strftime('%Y-%m-%d %H:%M:%S')}', {base_price}, {vip_price}, {total_seats}, {total_seats}, '{op_id}', 'OPEN', {route['id']}, {v_id});"
            sql_lines.append(sql)
            
            schedules.append({
                'id': schedule_id_counter,
                'operator_id': op_id,
                'departure_time': dep_time,
                'base_price': base_price,
                'vip_price': vip_price,
                'total_seats': total_seats,
                'vehicle_id': v_id,
                'available_seats': total_seats
            })
            schedule_id_counter += 1
            
    sql_lines.append(f"SELECT setval('schedule_id_seq', {schedule_id_counter - 1});")

    # 6. Dynamic Seats (Schedule Seat) & Bookings (100,000)
    vehicle_seats_map = {}
    current_seat_id = 1
    for v in vehicles:
        v_id = v['id']
        total_seats = v['total_seats']
        type_id = v['type_id']
        if type_id == 1:
            floors, rows, cols = 1, 4, 4
        elif type_id == 2:
            floors, rows, cols = 1, 10, 3
        elif type_id == 3:
            floors, rows, cols = 2, 6, 3
        else:
            floors, rows, cols = 2, 8, 3
            
        seats_info = []
        seat_count_added = 0
        for f in range(1, floors + 1):
            for r in range(1, rows + 1):
                for c in range(1, cols + 1):
                    if seat_count_added >= total_seats:
                        break
                    seat_count_added += 1
                    is_vip = True if r in [1, 2] else False
                    seats_info.append((current_seat_id, is_vip))
                    current_seat_id += 1
        vehicle_seats_map[v_id] = seats_info

    booking_id_counter = 1
    bookings_sql_batch = []
    schedule_seats_sql_batch = []
    schedule_seat_id_counter = 1
    
    bookings_per_schedule = TOTAL_BOOKINGS_TARGET // NUM_SCHEDULES
    
    for s in schedules:
        s_id = s['id']
        v_id = s['vehicle_id']
        op_id = s['operator_id']
        dep_time = s['departure_time']
        
        seats_info = vehicle_seats_map[v_id]
        
        num_to_book = min(bookings_per_schedule, len(seats_info) - 2)
        booked_seat_indices = set(random.sample(range(len(seats_info)), num_to_book))
        
        for idx, (seat_id, is_vip) in enumerate(seats_info):
            price = s['vip_price'] if is_vip else s['base_price']
            
            if idx in booked_seat_indices:
                booking_code = f"BK-{s_id:04d}-{booking_id_counter:06d}"
                user_id = random.choice(user_ids)
                create_at = dep_time - timedelta(days=random.randint(1, 5), hours=random.randint(0, 23))
                deadline = create_at + timedelta(minutes=30)
                
                bookings_sql_batch.append(
                    f"({booking_id_counter}, '{booking_code}', '{user_id}', {price}, '{deadline.strftime('%Y-%m-%d %H:%M:%S')}', '{create_at.strftime('%Y-%m-%d %H:%M:%S')}', '{op_id}', 'COMPLETED', TRUE, {s_id})"
                )
                
                schedule_seats_sql_batch.append(
                    f"({schedule_seat_id_counter}, {price}, 'BOOKED', NULL, NULL, NULL, {booking_id_counter}, {s_id}, {seat_id})"
                )
                booking_id_counter += 1
            else:
                schedule_seats_sql_batch.append(
                    f"({schedule_seat_id_counter}, {price}, 'AVAILABLE', NULL, NULL, NULL, NULL, {s_id}, {seat_id})"
                )
                
            schedule_seat_id_counter += 1

    sql_lines.append("\n-- Inserting Bookings (Batch)")
    for idx in range(0, len(bookings_sql_batch), batch_size):
        batch = bookings_sql_batch[idx : idx + batch_size]
        sql_lines.append("INSERT INTO booking (id, booking_code, user_id, total_amount, payment_deadline, create_at, operator_id, status, notified, schedule_id) VALUES " + ", ".join(batch) + ";")
    sql_lines.append(f"SELECT setval('booking_id_seq', {booking_id_counter - 1});")

    sql_lines.append("\n-- Inserting Schedule Seats (Batch)")
    for idx in range(0, len(schedule_seats_sql_batch), batch_size):
        batch = schedule_seats_sql_batch[idx : idx + batch_size]
        sql_lines.append("INSERT INTO schedule_seat (id, price, status, held_by, held_at, expired_at, booking_id, schedule_id, seat_id) VALUES " + ", ".join(batch) + ";")
    sql_lines.append(f"SELECT setval('schedule_seat_id_seq', {schedule_seat_id_counter - 1});")

    sql_lines.append("\n-- Updating Schedule Available Seats counts")
    sql_lines.append("UPDATE schedule s SET available_seats = total_seats - (SELECT COALESCE(COUNT(*), 0) FROM schedule_seat ss WHERE ss.schedule_id = s.id AND ss.status = 'BOOKED');")
    
    target_path = "../core-service/src/main/resources/db/changelog/scripts/seed_core.sql"
    os.makedirs(os.path.dirname(target_path), exist_ok=True)
    with open(target_path, "w", encoding="utf-8") as f:
        f.write("\n".join(sql_lines))

if __name__ == "__main__":
    print("Generating Liquibase seed scripts...")
    user_ids, operator_user_ids = generate_mysql_users()
    generate_postgres_core(user_ids, operator_user_ids)
    print("Liquibase seed scripts generated successfully in services' resource folders!")
