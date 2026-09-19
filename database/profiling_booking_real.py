import time
import requests
import numpy as np
import psycopg2
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

headers = {
    'Authorization': f'Bearer {token}',
    'Content-Type': 'application/json'
}

session = requests.Session()
adapter = requests.adapters.HTTPAdapter(pool_connections=100, pool_maxsize=150)
session.mount('http://', adapter)

import subprocess

# 2. Reset and fetch valid available seat pairs directly from Docker container PostgreSQL
subprocess.run(
    'docker exec db-postgres psql -U postgres -d core -c "UPDATE schedule SET departure_time = NOW() + INTERVAL \'10 days\', arrival_time = NOW() + INTERVAL \'11 days\', status = \'OPEN\' WHERE id BETWEEN 4800 AND 5001; UPDATE schedule_seat SET status = \'AVAILABLE\', booking_id = NULL, held_by = NULL, held_at = NULL, expired_at = NULL WHERE schedule_id BETWEEN 4800 AND 5001;"',
    shell=True,
    check=True,
    stdout=subprocess.DEVNULL
)

res = subprocess.run(
    'docker exec db-postgres psql -U postgres -d core -t -A -c "SELECT schedule_id || \',\' || id FROM schedule_seat WHERE schedule_id BETWEEN 4800 AND 5001 AND status = \'AVAILABLE\' ORDER BY id ASC LIMIT 2000;"',
    shell=True,
    check=True,
    capture_output=True,
    text=True
)

rows = []
for line in res.stdout.strip().splitlines():
    if line.strip() and ',' in line:
        sched, seat = line.strip().split(',')
        rows.append((int(sched), int(seat)))

print(f"Loaded {len(rows)} valid available seat pairs from database for profiling.")
payloads = [{"scheduleId": r[0], "scheduleSeatIds": [r[1]]} for r in rows]

def run_profiling_test(target_url, test_name, test_payloads, target_rps=100, duration_seconds=10):
    print(f"\n=======================================================")
    print(f" Running Profiling: {test_name}")
    print(f" Target URL: {target_url}")
    print(f" Target Rate: {target_rps} req/s for {duration_seconds}s (Total ~{target_rps * duration_seconds} requests)")
    print(f"=======================================================")

    results = []
    total_expected = min(target_rps * duration_seconds, len(test_payloads))
    start_time = time.perf_counter()

    def send_booking_request(req_idx):
        payload = test_payloads[req_idx]
        t0 = time.perf_counter()
        try:
            resp = session.post(target_url, json=payload, headers=headers, timeout=10)
            latency_ms = (time.perf_counter() - t0) * 1000.0
            results.append({
                "latency_ms": latency_ms,
                "status_code": resp.status_code,
                "success": resp.status_code == 200,
                "error": None
            })
        except Exception as e:
            latency_ms = (time.perf_counter() - t0) * 1000.0
            results.append({
                "latency_ms": latency_ms,
                "status_code": 0,
                "success": False,
                "error": str(e)
            })

    with ThreadPoolExecutor(max_workers=50) as executor:
        for i in range(total_expected):
            executor.submit(send_booking_request, i)
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
    print(f"p90 Latency:              {p90:.2f} ms")
    print(f"p95 Latency:              {p95:.2f} ms")
    print(f"p99 Latency:              {p99:.2f} ms")
    print(f"Max Latency:              {max_lat:.2f} ms")
    
    passed = p99 <= 200.0
    print("\n--- BUSINESS RULE EVALUATION ---")
    print(f"Rule: p99 <= 200ms")
    print(f"Result: p99 = {p99:.2f}ms -> {'[PASSED]' if passed else '[FAILED]'}")
    return p99, passed

if __name__ == '__main__':
    # Test 1: Direct to core-service (Port 8002) - First 1000 distinct available seats
    p99_direct, pass_direct = run_profiling_test(
        target_url='http://localhost:8002/core/bookings',
        test_name='Booking Service Directly (Port 8002) - Core Business Logic',
        test_payloads=payloads[0:1000],
        target_rps=100,
        duration_seconds=10
    )

    # Test 2: Through API Gateway (Port 8080) - Next 1000 distinct available seats
    p99_gw, pass_gw = run_profiling_test(
        target_url='http://localhost:8080/core/bookings',
        test_name='Booking via API Gateway (Port 8080) - Edge & Rate Limiter',
        test_payloads=payloads[1000:2000],
        target_rps=100,
        duration_seconds=10
    )
