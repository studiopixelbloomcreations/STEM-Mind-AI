from gradio_client import Client

try:
    print("Connecting to hexgrad/Kokoro-TTS...")
    client = Client("hexgrad/Kokoro-TTS")
    print("Connected. Running prediction...")
    # Let's see if we can view api or just predict
    # In hexgrad/Kokoro-TTS, the main endpoint might be /predict or /predict_1 etc.
    # Let's try predicting with a simple string:
    result = client.predict("Hello from Python", api_name="/predict")
    print("SUCCESS:", result)
except Exception as e:
    print("FAILED:", e)
