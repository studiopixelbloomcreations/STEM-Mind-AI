import requests

url = "https://huggingface.co/api/spaces?search=Kokoro&limit=50&sort=likes&direction=-1"
try:
    r = requests.get(url)
    data = r.json()
    for space in data:
        space_id = space['id']
        # Let's get more details about runtime
        detail_url = f"https://huggingface.co/api/spaces/{space_id}"
        detail_r = requests.get(detail_url)
        detail_data = detail_r.json()
        runtime = detail_data.get("runtime", {})
        stage = runtime.get("stage", "UNKNOWN")
        hardware = runtime.get("hardware", "UNKNOWN")
        print(f"ID: {space_id}, SDK: {space.get('sdk', '')}, Hardware: {hardware}, Stage: {stage}")
except Exception as e:
    print(f"Error: {e}")
