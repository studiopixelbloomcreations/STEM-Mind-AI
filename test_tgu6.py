from gradio_client import Client

try:
    print("Connecting to tgu6/hexgrad-Kokoro-82M...")
    client = Client("tgu6/hexgrad-Kokoro-82M")
    print("Predicting...")
    # Let's inspect API signature first
    print(client.view_api(return_format="str"))
    result = client.predict("Hello from Python", api_name="/predict")
    print("SUCCESS:", result)
except Exception as e:
    print("FAILED:", e)
