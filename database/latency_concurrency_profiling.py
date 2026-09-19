import requests
import time
import numpy as np
from concurrent.futures import ThreadPoolExecutor

login_resp = requests.post(
    'http://localhost:8000/auth/login',
    json={'email': 'nguyenmanhlc10@gmail.com', 'password': '12345678'}
)
token = login_resp.json()['data']['accessToken']
headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}

session = requests.Session()
adapter = requests.adapters.HTTPAdapter(pool_connections=100, pool_maxsize=150)
session.mount('http://', adapter)

def test_concurrency_level(concurrency, num_requests):
    results = []
    
    def send_req(i):
        # We book seat id 154111 or rotate
        seat_id = 154111 + (i % 16)
        payload = {"scheduleId": 5001, "scheduleSeatIds": [seat_id]}
        t0 = time.perf_counter()
        try:
            resp = session.post('http://localhost:8002/core/bookings', json=payload, headers=headers, timeout=10)
            latency = (time.perf_counter() - t0) * 1000.0
            results.append((latency, resp.status_code))
        except Exception as e:
            latency = (time.perf_counter() - t0) * 1000.0
            results.append((latency, 0))

    t_start = time.perf_counter()
    with ThreadPoolExecutor(max_workers=concurrency) as executor:
        for i in range(num_requests):
            executor.submit(send_req, i)
    t_total = time.perf_counter() - t_start

    latencies = [r[0] for r in results]
    p50 = np.percentile(latencies, 50)
    p90 = np.percentile(latencies, 90)
    p95 = np.percentile(latencies, 95)
    p99 = np.percentile(latencies, 99)
    avg = np.mean(latencies)
    throughput = len(results) / t_total

    print(f"Concurrency={concurrency:3d} | Reqs={num_requests:4d} | RPS={throughput:6.1f} | Avg={avg:6.1f}ms | p50={p50:6.1f}ms | p90={p90:6.1f}ms | p99={p99:6.1f}ms")

print("=== CONCURRENCY VS LATENCY PROFILING ===")
for c in [1, 5, 10, 20, 50, 100]:
    test_concurrency_level(c, 200)
