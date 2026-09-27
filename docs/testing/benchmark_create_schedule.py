#!/usr/bin/env python3
"""
Performance & Benchmark Testing Script: UC "Thêm mới chuyến xe của nhà xe" (Create Schedule)
Target Load: 100 requests / second
Target Endpoint: POST http://localhost:8080/core/schedules
Operator: nguyenmanhlcbg1@gmail.com
"""

import sys
import time
import json
import statistics
import datetime
import urllib.request
import urllib.error
from concurrent.futures import ThreadPoolExecutor

sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://localhost:8080"
LOGIN_URL = f"{BASE_URL}/auth/login"
CREATE_SCHEDULE_URL = f"{BASE_URL}/core/schedules"

OPERATOR_EMAIL = "nguyenmanhlcbg1@gmail.com"
OPERATOR_PASS = "12345678"
OPERATOR_ID = "71403b13-331e-4f79-8173-8735d5908e75"

TARGET_RPS = 100
DURATION_SECONDS = 15  # Total 1500 requests at 100 req/s
WORKER_THREADS = 80

def login():
    payload = json.dumps({"email": OPERATOR_EMAIL, "password": OPERATOR_PASS}).encode("utf-8")
    headers = {"Content-Type": "application/json"}
    req = urllib.request.Request(LOGIN_URL, data=payload, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=10) as res:
            body = json.loads(res.read().decode("utf-8"))
            token = body["data"]["accessToken"]
            return token
    except Exception as e:
        print(f"Login failed: {e}")
        sys.exit(1)

def fetch_operator_assets(token):
    headers = {"Authorization": f"Bearer {token}"}
    
    # Fetch vehicles owned by operator
    req_v = urllib.request.Request(f"{BASE_URL}/core/vehicles?operatorId={OPERATOR_ID}&size=100", headers=headers)
    vehicles = []
    try:
        with urllib.request.urlopen(req_v, timeout=10) as res:
            data = json.loads(res.read().decode("utf-8"))
            content = data.get("data", {}).get("content", data.get("data", []))
            vehicles = [v["id"] for v in content if v.get("status") == "ACTIVE"]
    except Exception as e:
        print(f"Error fetching vehicles: {e}")

    # Fetch routes owned by operator
    req_r = urllib.request.Request(f"{BASE_URL}/core/routes?operatorId={OPERATOR_ID}&size=100", headers=headers)
    routes = []
    try:
        with urllib.request.urlopen(req_r, timeout=10) as res:
            data = json.loads(res.read().decode("utf-8"))
            content = data.get("data", {}).get("content", data.get("data", []))
            routes = [r["id"] for r in content if r.get("status") == "ACTIVE"]
    except Exception as e:
        print(f"Error fetching routes: {e}")

    return routes, vehicles

def execute_request(req_id, token, route_id, vehicle_id, dep_time, arr_time):
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}",
        "Connection": "keep-alive"
    }
    payload = json.dumps({
        "routeId": route_id,
        "vehicleId": vehicle_id,
        "departureTime": dep_time,
        "arrivalTime": arr_time,
        "basePrice": 250000,
        "vipPrice": 350000
    }).encode("utf-8")

    req = urllib.request.Request(CREATE_SCHEDULE_URL, data=payload, headers=headers, method="POST")

    start_t = time.perf_counter()
    try:
        with urllib.request.urlopen(req, timeout=15) as res:
            latency_ms = (time.perf_counter() - start_t) * 1000
            return {
                "id": req_id,
                "status": res.status,
                "latency_ms": latency_ms,
                "success": True,
                "error": None
            }
    except urllib.error.HTTPError as e:
        latency_ms = (time.perf_counter() - start_t) * 1000
        err_msg = ""
        try:
            err_msg = e.read().decode("utf-8")
        except:
            pass
        return {
            "id": req_id,
            "status": e.code,
            "latency_ms": latency_ms,
            "success": False,
            "error": err_msg
        }
    except Exception as e:
        latency_ms = (time.perf_counter() - start_t) * 1000
        return {
            "id": req_id,
            "status": 500,
            "latency_ms": latency_ms,
            "success": False,
            "error": str(e)
        }

def run_benchmark():
    print("=================================================================")
    print("  BENCHMARK: UC THÊM MỚI CHUYẾN XE (CREATE SCHEDULE) - LOAD 100 RPS")
    print("=================================================================")
    print(f"Target Load: {TARGET_RPS} req/s")
    print(f"Duration: {DURATION_SECONDS} seconds (~{TARGET_RPS * DURATION_SECONDS} requests)")
    print(f"Operator: {OPERATOR_EMAIL} (Operator ID: {OPERATOR_ID})")
    print("Authenticating...")
    token = login()
    print("✅ Authenticated successfully!")

    print("Fetching operator routes & vehicles...")
    routes, vehicles = fetch_operator_assets(token)
    print(f"✅ Found {len(routes)} active routes, {len(vehicles)} active vehicles belonging to this operator.")

    total_requests = TARGET_RPS * DURATION_SECONDS
    base_date = datetime.datetime.now() + datetime.timedelta(days=2000)

    # Pre-generate non-overlapping request parameter slots
    requests_data = []
    for i in range(total_requests):
        v_id = vehicles[i % len(vehicles)]
        r_id = routes[i % len(routes)]
        # Use distinct day offset per vehicle cycle so there is no time overlap for the same vehicle
        cycle = i // len(vehicles)
        dep = (base_date + datetime.timedelta(days=cycle * 2, hours=8)).strftime("%Y-%m-%dT%H:%M:%S")
        arr = (base_date + datetime.timedelta(days=cycle * 2, hours=12)).strftime("%Y-%m-%dT%H:%M:%S")
        requests_data.append((i, token, r_id, v_id, dep, arr))

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
            futures.append(executor.submit(execute_request, *item))

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
    print("                    KẾT QUẢ ĐO ĐẠC METRIC                       ")
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
            print(f"  [Req #{err['id']}] HTTP {err['status']} -> {err['error']}")

if __name__ == "__main__":
    run_benchmark()
