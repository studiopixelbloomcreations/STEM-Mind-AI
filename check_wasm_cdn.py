import requests

versions = ["1.20.1", "1.21.0", "1.22.0"]
for v in versions:
    url1 = f"https://cdn.jsdelivr.net/npm/onnxruntime-web@{v}/dist/ort-wasm.wasm"
    url2 = f"https://cdn.jsdelivr.net/npm/onnxruntime-web@{v}/dist/ort.wasm.wasm"
    r1 = requests.head(url1)
    r2 = requests.head(url2)
    print(f"Version {v}: ort-wasm.wasm={r1.status_code}, ort.wasm.wasm={r2.status_code}")
