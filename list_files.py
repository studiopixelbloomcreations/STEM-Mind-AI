import requests

url = "https://data.jsdelivr.com/v1/package/npm/onnxruntime-web@1.20.1/flat"
try:
    r = requests.get(url)
    files = r.json().get("files", [])
    for f in files:
        if f["name"].startswith("/dist/"):
            print(f["name"])
except Exception as e:
    print("Error:", e)
