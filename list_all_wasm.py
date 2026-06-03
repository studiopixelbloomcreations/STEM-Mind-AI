import requests

url = "https://data.jsdelivr.com/v1/package/npm/onnxruntime-web@1.22.0/flat"
try:
    r = requests.get(url)
    files = r.json().get("files", [])
    for f in files:
        if f["name"].endswith(".wasm"):
            print(f["name"])
except Exception as e:
    print("Error:", e)
