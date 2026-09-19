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

token = login_resp.json()['data']['accessToken']
print("Customer logged in successfully.")

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

def run_profiling(test_func, test_name, target_rps=100, duration_seconds=10):
    print(f"\n=======================================================")
    print(f" Running Profiling: {test_name}")
    print(f" Target Load: {target_rps} req/s for {duration_seconds}s (Total ~{target_rps * duration_seconds} requests)")
    print(f"=======================================================")

    results = []
    total_expected = target_rps * duration_seconds
    start_time = time.perf_counter()

    def worker(req_idx):
        t0 = time.perf_counter()
        try:
            status_code, err = test_func(req_idx)
            latency_ms = (time.perf_counter() - t0) * 1000.0
            results.append({
                "latency_ms": latency_ms,
                "status_code": status_code,
                "error": err
            })
        except Exception as e:
            latency_ms = (time.perf_counter() - t0) * 1000.0
            results.append({
                "latency_ms": latency_ms,
                "status_code": 0,
                "error": str(e)
            })

    with ThreadPoolExecutor(max_workers=50) as executor:
        for i in range(total_expected):
            executor.submit(worker, i)
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

# Test Scenario 1: POST /core/bookings (Direct Core Service)
def booking_direct_func(idx):
    seat = SEAT_IDS[idx % len(SEAT_IDS)]
    resp = session.post('http://localhost:8002/core/bookings', json={"scheduleId": SCHEDULE_ID, "scheduleSeatIds": [seat]}, headers=headers, timeout=10)
    return resp.status_code, None

# Test Scenario 2: POST /payments (Create VNPay Checkout URL for an active booking)
# First create a booking to have a valid bookingId
create_booking_res = session.post('http://localhost:8002/core/bookings', json={"scheduleId": SCHEDULE_ID, "scheduleSeatIds": [SEAT_IDS[0]]}, headers=headers)
valid_booking_id = None
if create_booking_res.status_code == 200:
    valid_booking_id = create_booking_res.json()['data']['id']
    print(f"Created active booking ID for VNPay test: {valid_booking_id}")
else:
    print(f"Notice: Could not create single booking (status {create_booking_res.status_code}): {create_booking_res.text}")

def payment_vnpay_func(idx):
    # Payment creation endpoint POST /payments
    payload = {
        "provider": "VNPAY",
        "bookingId": valid_booking_id if valid_booking_id else 92561
    }
    resp = session.post('http://localhost:8003/payments', json=payload, headers=headers, timeout=10)
    return resp.status_code, None

if __name__ == '__main__':
    # 1. Booking Service Direct
    run_profiling(booking_direct_func, "1. Booking Seat Reservation (Port 8002 - Core Service)", target_rps=100, duration_seconds=10)
    
    # 2. Payment Service VNPay Checkout URL Generation
    if valid_booking_id:
        run_profiling(payment_vnpay_func, "2. VNPay Payment Initiation (Port 8003 - Payment Service)", target_rps=100, duration_seconds=10)
