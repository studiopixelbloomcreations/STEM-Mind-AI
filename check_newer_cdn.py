import requests

versions = ["1.20.1", "1.21.0", "1.22.0"]
for v in versions:
    # Basic
    url1 = f"https://cdn.jsdelivr.net/npm/onnxruntime-web@{v}/dist/ort-wasm.mjs"
    url2 = f"https://cdn.jsdelivr.net/npm/onnxruntime-web@{v}/dist/ort.wasm.mjs"
    r1 = requests.head(url1)
    r2 = requests.head(url2)
    print(f"Version {v}: ort-wasm.mjs={r1.status_code}, ort.wasm.mjs={r2.status_code}")
