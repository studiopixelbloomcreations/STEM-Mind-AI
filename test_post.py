import requests

spaces = [
    {"url": "https://brainzcode-hexgrad-kokoro-82m.hf.space/api/predict", "payload": {"data": ["Hello world"], "fn_index": 0}},
    {"url": "https://tgu6-hexgrad-kokoro-82m.hf.space/api/predict", "payload": {"data": ["Hello world"], "fn_index": 0}},
    {"url": "https://remsky-kokoro-tts-zero.hf.space/api/predict", "payload": {"data": ["Hello world", ["af_heart"], 1.0], "fn_index": 7}},
]

for space in spaces:
    try:
        print(f"Testing {space['url']}...")
        r = requests.post(space["url"], json=space["payload"], timeout=10)
        print(f"Status: {r.status_code}")
        print(f"Response: {r.json()}")
    except Exception as e:
        print(f"Error: {e}")
