#!/usr/bin/env python3
"""
Performance & Benchmark Testing Script: UC "Thêm mới tuyến xe của nhà xe (Route)" (Create Route)
Target Load: 100 requests / second
Target Endpoint: POST http://localhost:8080/core/routes
Operator: nguyenmanhlcbg1@gmail.com
"""

import sys
import time
import json
import statistics
import uuid
import urllib.request
import urllib.error
from concurrent.futures import ThreadPoolExecutor

sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://localhost:8080"
LOGIN_URL = f"{BASE_URL}/auth/login"
CREATE_ROUTE_URL = f"{BASE_URL}/core/routes"

OPERATOR_EMAIL = "nguyenmanhlcbg1@gmail.com"
OPERATOR_PASS = "12345678"

TARGET_RPS = 100
DURATION_SECONDS = 15  # Total 1500 requests
WORKER_THREADS = 80

def login():
    payload = json.dumps({"email": OPERATOR_EMAIL, "password": OPERATOR_PASS}).encode("utf-8")
    headers = {"Content-Type": "application/json"}
    req = urllib.request.Request(LOGIN_URL, data=payload, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=10) as res:
            body = json.loads(res.read().decode("utf-8"))
            return body["data"]["accessToken"]
    except Exception as e:
        print(f"Login failed: {e}")
        sys.exit(1)

def execute_create_route(req_id, token, route_code):
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}",
        "Connection": "keep-alive"
    }
    payload = json.dumps({
        "routeCode": route_code,
        "departureCityId": 1,
        "arrivalCityId": 2,
        "distance": 150.0,
        "estimatedDurationMinutes": 180,
        "routeStops": [
            {
                "cityId": 1,
                "stopName": f"Trạm Đón {req_id}",
                "stopOrder": 1,
                "distanceFromStart": 10.0,
                "estimatedArrivalOffsetMinutes": 15,
                "isPickup": True,
                "isDropOff": False
            },
            {
                "cityId": 2,
                "stopName": f"Trạm Trả {req_id}",
                "stopOrder": 2,
                "distanceFromStart": 140.0,
                "estimatedArrivalOffsetMinutes": 170,
                "isPickup": False,
                "isDropOff": True
            }
        ]
    }).encode("utf-8")

    req = urllib.request.Request(CREATE_ROUTE_URL, data=payload, headers=headers, method="POST")

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
    print("  BENCHMARK: UC THÊM MỚI TUYẾN XE (CREATE ROUTE) - LOAD 100 RPS")
    print("=================================================================")
    print(f"Target Load: {TARGET_RPS} req/s")
    print(f"Duration: {DURATION_SECONDS} seconds (~{TARGET_RPS * DURATION_SECONDS} requests)")
    print(f"Operator: {OPERATOR_EMAIL}")
    print("Authenticating...")
    token = login()
    print("✅ Authenticated successfully!")

    total_requests = TARGET_RPS * DURATION_SECONDS
    batch_prefix = f"RT_{uuid.uuid4().hex[:6]}"

    # Pre-generate unique route requests
    requests_data = []
    for i in range(total_requests):
        route_code = f"{batch_prefix}_{i:04d}"
        requests_data.append((i, token, route_code))

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
            futures.append(executor.submit(execute_create_route, *item))

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
