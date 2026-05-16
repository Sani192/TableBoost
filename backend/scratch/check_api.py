import requests

response = requests.get("http://localhost:8000/api/dashboard/")
print(f"Status: {response.status_code}")
data = response.json()

import json
print(json.dumps(data, indent=2))
