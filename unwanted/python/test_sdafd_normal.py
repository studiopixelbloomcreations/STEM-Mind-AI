from gradio_client import Client

try:
    print("Connecting to sdafd/Kokoro-TTS...")
    client = Client("sdafd/Kokoro-TTS")
    print("Connected. API Info:")
    print(client.view_api(return_format="str"))
except Exception as e:
    print("FAILED:", e)
