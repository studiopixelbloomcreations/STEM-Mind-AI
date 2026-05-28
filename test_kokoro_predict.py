from gradio_client import Client

try:
    print("Connecting to Remsky/Kokoro-TTS-Zero...")
    client = Client("Remsky/Kokoro-TTS-Zero")
    print("Predicting...")
    # Remsky's predict signature: predict(text, voice_names, speed, api_name="/generate_speech_from_ui")
    result = client.predict("Hello from Python", ["af_heart"], 1.0, api_name="/generate_speech_from_ui")
    print("SUCCESS:", result)
except Exception as e:
    print("FAILED:", e)
