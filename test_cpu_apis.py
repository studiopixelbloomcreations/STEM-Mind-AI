from gradio_client import Client

spaces = [
    "RobinsAIWorld/Kokoro-TTS-cpu",
    "NeuralFalcon/KOKORO-TTS-1.0",
    "Incorporo-user/kokoro-voice-creator",
    "sdafd/KOKORO-TTS-1.0",
]

for space in spaces:
    try:
        print(f"\n=============================\nConnecting to {space}...")
        client = Client(space)
        print("Connected. API Info:")
        print(client.view_api(return_format="str"))
        
        # Let's try to find an endpoint to test prediction
        # If it uses standard Kokoro voice, it might need some arguments
        # Let's try predicting with a simple call if we know the signature
    except Exception as e:
        print("FAILED:", e)
