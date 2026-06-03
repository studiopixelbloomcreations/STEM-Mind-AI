import requests

versions = ["1.19.0", "1.20.0", "1.20.1", "1.20.3", "1.21.0"]

for v in versions:
    url = f"https://cdn.jsdelivr.net/npm/onnxruntime-web@{v}/dist/ort-wasm.mjs"
    r = requests.head(url)
    print(f"Version {v}: {r.status_code}")
