import requests
import json

# Add credits to user
url = "http://localhost:8080/api/admin/add-credits"
headers = {
    "x-admin-key": "launchforge-admin-secret-2024",
    "Content-Type": "application/json"
}
data = {
    "displayName": "karim moh",
    "amount": 500
}

try:
    response = requests.post(url, headers=headers, json=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
except Exception as e:
    print(f"Error: {e}")
