import requests

url = "https://huggingface.co/api/spaces?search=Kokoro&limit=15&sort=likes&direction=-1"
try:
    r = requests.get(url)
    data = r.json()
    for space in data:
        print(f"ID: {space['id']}, Likes: {space.get('likes', 0)}, SDK: {space.get('sdk', '')}, Runtime: {space.get('runtime', {}).get('stage', 'UNKNOWN')}")
except Exception as e:
    print(f"Error: {e}")
