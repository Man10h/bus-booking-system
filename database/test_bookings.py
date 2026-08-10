import urllib.request
import urllib.error
import json

def test():
    # Login
    login_url = "http://localhost:8000/auth/login"
    login_data = json.dumps({
        "email": "customer01@gmail.com",
        "password": "Password123"
    }).encode('utf-8')
    
    req = urllib.request.Request(
        login_url,
        data=login_data,
        headers={'Content-Type': 'application/json'}
    )
    
    try:
        with urllib.request.urlopen(req) as response:
            res_body = response.read().decode('utf-8')
            res_json = json.loads(res_body)
            print("Login response:")
            print(json.dumps(res_json, indent=2))
            token = res_json['data']['accessToken']
    except urllib.error.HTTPError as e:
        print("Login HTTP Error:", e.code, e.read().decode('utf-8'))
        return
    except Exception as e:
        print("Login Error:", e)
        return

    # Get bookings
    # Let's try directly via core-service first to isolate gateway issues (core-service is on 8002)
    # The API is /core/bookings/me
    bookings_url = "http://localhost:8002/core/bookings/me"
    req_bookings = urllib.request.Request(
        bookings_url,
        headers={
            'Authorization': f'Bearer {token}',
            'Accept': 'application/json'
        }
    )
    
    print("\nFetching bookings from core-service directly...")
    try:
        with urllib.request.urlopen(req_bookings) as response:
            res_body = response.read().decode('utf-8')
            res_json = json.loads(res_body)
            print("Bookings count:", len(res_json['data']['content']))
            print(json.dumps(res_json['data']['content'][:2], indent=2, ensure_ascii=False))
    except urllib.error.HTTPError as e:
        print("Bookings HTTP Error:", e.code, e.read().decode('utf-8'))
    except Exception as e:
        print("Bookings Error:", e)

    # Let's also try via Gateway (8080)
    gateway_url = "http://localhost:8080/core/bookings/me"
    req_gateway = urllib.request.Request(
        gateway_url,
        headers={
            'Authorization': f'Bearer {token}',
            'Accept': 'application/json'
        }
    )
    
    print("\nFetching bookings via Gateway...")
    try:
        with urllib.request.urlopen(req_gateway) as response:
            res_body = response.read().decode('utf-8')
            res_json = json.loads(res_body)
            print("Gateway response code:", res_json.get('code'))
            print("Gateway bookings count:", len(res_json['data']['content']))
    except urllib.error.HTTPError as e:
        print("Gateway HTTP Error:", e.code, e.read().decode('utf-8'))
    except Exception as e:
        print("Gateway Error:", e)

if __name__ == '__main__':
    test()
