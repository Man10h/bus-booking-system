#!/usr/bin/env python3
"""
Performance & Benchmark Testing Script: UC "Hủy chuyến xe của nhà xe" (Cancel Schedule)
Target Load: 100 / 150 requests / second
Target Endpoint: PATCH http://localhost:8080/core/schedules/{id}/cancel
Operator: nguyenmanhlcbg1@gmail.com
"""

import sys
import time
import json
import statistics
import datetime
import subprocess
import requests
from requests.adapters import HTTPAdapter
from urllib3.util import Retry
from concurrent.futures import ThreadPoolExecutor

sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://localhost:8080"
LOGIN_URL = f"{BASE_URL}/auth/login"
CANCEL_SCHEDULE_URL_TEMPLATE = f"{BASE_URL}/core/schedules/{{schedule_id}}/cancel"

OPERATOR_EMAIL = "nguyenmanhlcbg1@gmail.com"
OPERATOR_PASS = "12345678"
OPERATOR_ID = "71403b13-331e-4f79-8173-8735d5908e75"

TARGET_RPS = int(sys.argv[1]) if len(sys.argv) > 1 else 100
DURATION_SECONDS = int(sys.argv[2]) if len(sys.argv) > 2 else 15
WORKER_THREADS = min(TARGET_RPS, 100)

session = requests.Session()
adapter = HTTPAdapter(pool_connections=150, pool_maxsize=150, max_retries=0)
session.mount("http://", adapter)
session.mount("https://", adapter)

def login():
    payload = {"email": OPERATOR_EMAIL, "password": OPERATOR_PASS}
    headers = {"Content-Type": "application/json"}
    try:
        res = session.post(LOGIN_URL, json=payload, headers=headers, timeout=10)
        body = res.json()
        token = body["data"]["accessToken"]
        return token
    except Exception as e:
        print(f"Login failed: {e}")
        sys.exit(1)

def prepare_schedules_for_cancel(count):
    """
    Directly creates `count` distinct OPEN schedules in PostgreSQL for this operator
    so each cancel request operates on an authentic, distinct schedule.
    """
    print(f"Preparing {count} valid OPEN schedules for operator in database...")
    
    p = subprocess.run([
        'docker', 'exec', '-i', 'db-postgres', 'psql', '-U', 'postgres', '-d', 'core', '-t', '-c',
        "SELECT COALESCE(MAX(id), 0) FROM schedule;"
    ], capture_output=True, text=True)
    start_id = int(p.stdout.strip()) + 1000

    sql_commands = []
    base_time = datetime.datetime.now() + datetime.timedelta(days=2000)
    
    schedule_ids = []
    for i in range(count):
        s_id = start_id + i
        v_id = (i % 50) + 1
        r_id = (i % 20) + 1
        cycle = i // 50
        dep = (base_time + datetime.timedelta(days=cycle * 3, hours=8)).strftime("%Y-%m-%d %H:%M:%S")
        arr = (base_time + datetime.timedelta(days=cycle * 3, hours=12)).strftime("%Y-%m-%d %H:%M:%S")
        sql_commands.append(f"""
        INSERT INTO schedule (id, departure_time, arrival_time, base_price, vip_price, available_seats, total_seats, status, route_id, vehicle_id, operator_id)
        VALUES ({s_id}, '{dep}', '{arr}', 250000, 350000, 40, 40, 'OPEN', {r_id}, {v_id}, '{OPERATOR_ID}');
        """)
        schedule_ids.append(s_id)
        
    full_sql = "\n".join(sql_commands)
    
    p = subprocess.run([
        'docker', 'exec', '-i', 'db-postgres', 'psql', '-U', 'postgres', '-d', 'core', '-v', 'ON_ERROR_STOP=1'
    ], input=full_sql, capture_output=True, text=True)
    
    if p.returncode != 0:
        print("Error preparing test schedules:", p.stderr)
        sys.exit(1)
        
    print(f"✅ Successfully seeded {len(schedule_ids)} OPEN schedules (IDs: {schedule_ids[0]} -> {schedule_ids[-1]}).")
    return schedule_ids

def execute_cancel_request(req_id, token, schedule_id):
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}",
        "Connection": "keep-alive"
    }
    url = CANCEL_SCHEDULE_URL_TEMPLATE.format(schedule_id=schedule_id)

    start_t = time.perf_counter()
    try:
        res = session.patch(url, headers=headers, timeout=15)
        latency_ms = (time.perf_counter() - start_t) * 1000
        return {
            "id": req_id,
            "schedule_id": schedule_id,
            "status": res.status_code,
            "latency_ms": latency_ms,
            "success": (res.status_code == 200),
            "error": None if res.status_code == 200 else res.text[:200]
        }
    except Exception as e:
        latency_ms = (time.perf_counter() - start_t) * 1000
        return {
            "id": req_id,
            "schedule_id": schedule_id,
            "status": 500,
            "latency_ms": latency_ms,
            "success": False,
            "error": str(e)
        }

def run_benchmark():
    print("=================================================================")
    print(f"  BENCHMARK: UC HỦY CHUYẾN XE (CANCEL SCHEDULE) - LOAD {TARGET_RPS} RPS  ")
    print("=================================================================")
    print(f"Target Load: {TARGET_RPS} req/s")
    print(f"Duration: {DURATION_SECONDS} seconds (~{TARGET_RPS * DURATION_SECONDS} requests)")
    print(f"Target Endpoint: PATCH /core/schedules/{{id}}/cancel")
    print(f"Operator: {OPERATOR_EMAIL} (Operator ID: {OPERATOR_ID})")
    print("Authenticating...")
    token = login()
    print("✅ Authenticated successfully!")

    total_requests = TARGET_RPS * DURATION_SECONDS
    schedule_ids = prepare_schedules_for_cancel(total_requests)

    requests_data = []
    for i in range(total_requests):
        requests_data.append((i, token, schedule_ids[i]))

    print(f"\n🚀 Starting benchmark execution at {TARGET_RPS} req/s with {WORKER_THREADS} threads...")
    
    results = []
    start_benchmark_time = time.perf_counter()

    with ThreadPoolExecutor(max_workers=WORKER_THREADS) as executor:
        futures = []
        for idx, item in enumerate(requests_data):
            target_time = start_benchmark_time + (idx / TARGET_RPS)
            now = time.perf_counter()
            if target_time > now:
                time.sleep(target_time - now)
            futures.append(executor.submit(execute_cancel_request, *item))

        for f in futures:
            results.append(f.result())

    total_duration = time.perf_counter() - start_benchmark_time

    # Compute statistics
    latencies = [r["latency_ms"] for r in results]
    success_results = [r for r in results if r["success"]]
    error_results = [r for r in results if not r["success"]]

    total_req_count = len(results)
    success_count = len(success_results)
    error_count = len(error_results)
    error_rate = (error_count / total_req_count) * 100 if total_req_count > 0 else 0

    actual_rps = total_req_count / total_duration if total_duration > 0 else 0

    sorted_latencies = sorted(latencies)
    min_lat = min(latencies) if latencies else 0
    max_lat = max(latencies) if latencies else 0
    avg_lat = statistics.mean(latencies) if latencies else 0
    median_lat = statistics.median(latencies) if latencies else 0
    stdev_lat = statistics.stdev(latencies) if len(latencies) > 1 else 0

    p50 = sorted_latencies[int(len(sorted_latencies) * 0.50)] if sorted_latencies else 0
    p90 = sorted_latencies[int(len(sorted_latencies) * 0.90)] if sorted_latencies else 0
    p95 = sorted_latencies[int(len(sorted_latencies) * 0.95)] if sorted_latencies else 0
    p99 = sorted_latencies[int(len(sorted_latencies) * 0.99)] if sorted_latencies else 0

    # Status codes breakdown
    status_counts = {}
    for r in results:
        status_counts[r["status"]] = status_counts.get(r["status"], 0) + 1

    print("\n=================================================================")
    print(f"       KẾT QUẢ ĐO ĐẠC METRIC (LOAD {TARGET_RPS} REQ/S)            ")
    print("=================================================================")
    print(f"Tổng số request đã gửi   : {total_req_count}")
    print(f"Số request thành công    : {success_count} ({success_count/total_req_count*100:.2f}%)")
    print(f"Số request thất bại      : {error_count} (Tỷ lệ lỗi: {error_rate:.2f}%)")
    print(f"Thời gian chạy tổng cộng : {total_duration:.2f} giây")
    print(f"Thông lượng thực tế (RPS): {actual_rps:.2f} req/s (Target: {TARGET_RPS} req/s)")
    print("-----------------------------------------------------------------")
    print("PHÂN BỐ MÃ PHẢN HỒI (HTTP Status Codes):")
    for status, count in sorted(status_counts.items()):
        print(f"  - HTTP {status}: {count} ({count/total_req_count*100:.2f}%)")
    print("-----------------------------------------------------------------")
    print("THÔNG SỐ ĐỘ TRỄ (LATENCY METRICS):")
    print(f"  - Min Latency          : {min_lat:.2f} ms")
    print(f"  - Avg Latency          : {avg_lat:.2f} ms")
    print(f"  - Median (p50)         : {p50:.2f} ms")
    print(f"  - p90 Latency          : {p90:.2f} ms")
    print(f"  - p95 Latency          : {p95:.2f} ms")
    print(f"  - p99 Latency          : {p99:.2f} ms")
    print(f"  - Max Latency          : {max_lat:.2f} ms")
    print(f"  - Std Deviation        : {stdev_lat:.2f} ms")
    print("=================================================================")

    if error_results:
        print("\nMột số mẫu lỗi gặp phải (Top 5 error samples):")
        for err in error_results[:5]:
            print(f"  [Req #{err['id']} - Schedule #{err['schedule_id']}] HTTP {err['status']} -> {err['error']}")

if __name__ == "__main__":
    run_benchmark()
