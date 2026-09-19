import time
import json
import threading
import requests
import numpy as np
from concurrent.futures import ThreadPoolExecutor

# 1. Login Customer
print("=== 1. Logging in customer (nguyenmanhlc10@gmail.com) ===")
login_resp = requests.post(
    'http://localhost:8000/auth/login',
    json={'email': 'nguyenmanhlc10@gmail.com', 'password': '12345678'}
)
if login_resp.status_code != 200:
    print(f"Login failed: {login_resp.status_code} - {login_resp.text}")
    exit(1)

auth_data = login_resp.json()['data']
token = auth_data['accessToken']
print("Customer logged in successfully.")
print("Token acquired for User: 3176ee49-2fdf-4f40-8cbf-831c95f14f73")

# 2. Setup Booking parameters
SCHEDULE_ID = 5001
SEAT_IDS = [154111, 154112, 154113, 154114, 154115, 154116, 154117, 154118,
            154119, 154120, 154121, 154122, 154123, 154124, 154125, 154126]

headers = {
    'Authorization': f'Bearer {token}',
    'Content-Type': 'application/json'
}

session = requests.Session()
adapter = requests.adapters.HTTPAdapter(pool_connections=100, pool_maxsize=150)
session.mount('http://', adapter)

def run_booking_profiling(target_url, test_name, target_rps=100, duration_seconds=10):
    print("\n=======================================================")
    print(f" {test_name}")
    print(f" Target URL:  {target_url}")
    print(f" Target Load: {target_rps} req/s for {duration_seconds}s (Total {target_rps * duration_seconds} requests)")
    print("=======================================================")

    results = []
    total_expected = target_rps * duration_seconds
    start_time = time.perf_counter()

    def send_booking(req_idx):
        seat = SEAT_IDS[req_idx % len(SEAT_IDS)]
        payload = {
            "scheduleId": SCHEDULE_ID,
            "scheduleSeatIds": [seat]
        }
        t0 = time.perf_counter()
        try:
            resp = session.post(target_url, json=payload, headers=headers, timeout=10)
            latency_ms = (time.perf_counter() - t0) * 1000.0
            results.append({
                "latency_ms": latency_ms,
                "status_code": resp.status_code,
                "is_success": resp.status_code == 200
            })
        except Exception as e:
            latency_ms = (time.perf_counter() - t0) * 1000.0
            results.append({
                "latency_ms": latency_ms,
                "status_code": 0,
                "is_success": False
            })

    with ThreadPoolExecutor(max_workers=50) as executor:
        for i in range(total_expected):
            executor.submit(send_booking, i)
            expected_elapsed = (i + 1) / target_rps
            actual_elapsed = time.perf_counter() - start_time
            if expected_elapsed > actual_elapsed:
                time.sleep(expected_elapsed - actual_elapsed)

    total_time = time.perf_counter() - start_time
    actual_rps = len(results) / total_time

    latencies = [r['latency_ms'] for r in results]
    status_counts = {}
    for r in results:
        status_counts[r['status_code']] = status_counts.get(r['status_code'], 0) + 1

    p50 = np.percentile(latencies, 50)
    p75 = np.percentile(latencies, 75)
    p90 = np.percentile(latencies, 90)
    p95 = np.percentile(latencies, 95)
    p99 = np.percentile(latencies, 99)
    min_lat = np.min(latencies)
    max_lat = np.max(latencies)
    avg_lat = np.mean(latencies)

    print("\n--- RESULTS SUMMARY ---")
    print(f"Total Requests Processed: {len(results)}")
    print(f"Total Test Time:          {total_time:.2f} s")
    print(f"Actual Throughput:        {actual_rps:.2f} req/s")
    print(f"Status Code Breakdown:    {status_counts}")
    print(f"Min Latency:              {min_lat:.2f} ms")
    print(f"Avg Latency:              {avg_lat:.2f} ms")
    print(f"Median (p50):             {p50:.2f} ms")
    print(f"p75 Latency:              {p75:.2f} ms")
    print(f"p90 Latency:              {p90:.2f} ms")
    print(f"p95 Latency:              {p95:.2f} ms")
    print(f"p99 Latency:              {p99:.2f} ms")
    print(f"Max Latency:              {max_lat:.2f} ms")
    
    passed = p99 <= 200.0
    print("\n--- BUSINESS RULE EVALUATION ---")
    print("Rule: p99 <= 200ms")
    print(f"Result: p99 = {p99:.2f}ms -> {'[PASSED]' if passed else '[FAILED]'}")

if __name__ == '__main__':
    run_booking_profiling(
        target_url='http://localhost:8002/core/bookings',
        test_name='PROFILING: Booking and Seat Holding (POST /core/bookings)',
        target_rps=100,
        duration_seconds=10
    )
