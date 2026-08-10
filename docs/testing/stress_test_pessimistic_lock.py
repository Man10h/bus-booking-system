#!/usr/bin/env python3
"""
Stress Testing Script for Pessimistic Seat Reservation (Bus Booking System)

Simulates N concurrent clients hitting the `POST /core/bookings` endpoint 
simultaneously targeting the exact same schedule seat IDs to verify:
1. Concurrency isolation and pessimistic locking (SELECT ... FOR UPDATE).
2. Exactly 1 request succeeds (HTTP 200/201).
3. The remaining N-1 requests fail gracefully (HTTP 400 - Seat no longer available).
"""

import sys
import time
import json
import concurrent.futures
import urllib.request
import urllib.error

BASE_URL = "http://localhost:8080"
SCHEDULE_ID = 1
SCHEDULE_SEAT_IDS = [1, 2]
CONCURRENT_USERS = 10
JWT_TOKEN = "YOUR_JWT_TOKEN_HERE"

def perform_booking(user_index):
    url = f"{BASE_URL}/core/bookings"
    payload = json.dumps({
        "scheduleId": SCHEDULE_ID,
        "scheduleSeatIds": SCHEDULE_SEAT_IDS
    }).encode("utf-8")

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {JWT_TOKEN}"
    }

    req = urllib.request.Request(url, data=payload, headers=headers, method="POST")

    start_time = time.time()
    try:
        with urllib.request.urlopen(req, timeout=5) as response:
            latency = (time.time() - start_time) * 1000
            res_body = response.read().decode("utf-8")
            return {
                "user_index": user_index,
                "status": response.status,
                "latency_ms": latency,
                "success": True,
                "response": json.loads(res_body) if res_body else {}
            }
    except urllib.error.HTTPError as e:
        latency = (time.time() - start_time) * 1000
        error_body = e.read().decode("utf-8")
        return {
            "user_index": user_index,
            "status": e.code,
            "latency_ms": latency,
            "success": False,
            "error": error_body
        }
    except Exception as e:
        latency = (time.time() - start_time) * 1000
        return {
            "user_index": user_index,
            "status": 500,
            "latency_ms": latency,
            "success": False,
            "error": str(e)
        }

def run_stress_test():
    print(f"=== Starting Concurrency Stress Test ===")
    print(f"Target URL: {BASE_URL}/core/bookings")
    print(f"Concurrent Threads: {CONCURRENT_USERS}")
    print(f"Schedule ID: {SCHEDULE_ID}, Seat IDs: {SCHEDULE_SEAT_IDS}\n")

    results = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=CONCURRENT_USERS) as executor:
        futures = [executor.submit(perform_booking, i) for i in range(CONCURRENT_USERS)]
        for future in concurrent.futures.as_completed(futures):
            results.append(future.result())

    success_count = sum(1 for r in results if r["success"])
    failure_count = sum(1 for r in results if not r["success"])

    print("--- Test Results Summary ---")
    print(f"Total Requests: {len(results)}")
    print(f"Successful Reservations (200/201): {success_count}")
    print(f"Rejected Concurrent Requests: {failure_count}\n")

    for res in sorted(results, key=lambda x: x["user_index"]):
        status_str = "SUCCESS" if res["success"] else "FAILED"
        print(f"User {res['user_index']:02d} | Status: {res['status']} [{status_str}] | Latency: {res['latency_ms']:.2f} ms")

    print("\n--- Validation Result ---")
    if success_count == 1 and failure_count == (CONCURRENT_USERS - 1):
        print("✅ PASS: Pessimistic locking verified! Exactly 1 booking succeeded and all others were rejected.")
    else:
        print("⚠️ WARN / FAIL: Unexpected concurrency result. Check database transaction isolation levels.")

if __name__ == "__main__":
    run_stress_test()
