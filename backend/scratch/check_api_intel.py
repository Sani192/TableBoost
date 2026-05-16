import requests
import json

response = requests.get("http://localhost:8000/api/dashboard/")
data = response.json()

print("REVENUE:")
print(json.dumps(data.get("revenue"), indent=2))
print("\nSEGMENTS:")
print(json.dumps(data.get("segments"), indent=2))
