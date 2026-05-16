import requests

BASE_URL = "http://localhost:8000/api/automation"

def test_automation_update():
    # Only sending automation_type and message_template
    payload = {
        "automation_type": "birthday",
        "message_template": "Happy Birthday {name}! 🎂 Enjoy a free drink on us today at TableBoost!"
    }
    
    response = requests.post(BASE_URL, json=payload)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")

if __name__ == "__main__":
    test_automation_update()
