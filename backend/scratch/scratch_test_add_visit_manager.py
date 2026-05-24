import urllib.request
import urllib.error
import json

login_data = json.dumps({"username": "manager", "password": "password123"}).encode('utf-8')
login_req = urllib.request.Request("http://127.0.0.1:8000/api/auth/login", data=login_data, headers={'Content-Type': 'application/json'})

try:
    with urllib.request.urlopen(login_req) as response:
        login_res_body = json.loads(response.read().decode('utf-8'))
        print("Login OK:", login_res_body)
        cookie = response.headers.get('Set-Cookie')
        restaurant_id = login_res_body.get('restaurant_id')
        
        visit_data = json.dumps({
            "phone_number": "5551234567",
            "name": "Test User",
            "amount": 15.50,
            "send_sms": False
        }).encode('utf-8')
        
        headers = {'Content-Type': 'application/json'}
        if cookie:
            headers['Cookie'] = cookie
        if restaurant_id:
            headers['X-Restaurant-ID'] = str(restaurant_id)
            
        visit_req = urllib.request.Request("http://127.0.0.1:8000/api/visits/", data=visit_data, headers=headers)
        with urllib.request.urlopen(visit_req) as visit_response:
            print("Add Visit OK:", visit_response.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print(f"HTTPError: {e.code} - {e.read().decode('utf-8')}")
