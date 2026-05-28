from gradio_client import Client

spaces = [
    "hexgrad/Kokoro-TTS",
    "Remsky/Kokoro-TTS-Zero",
    "brainzcode/hexgrad-Kokoro-82M",
]

for space in spaces:
    try:
        print(f"\n=============================\nSpace: {space}")
        client = Client(space)
        print(client.view_api(return_format="str"))
    except Exception as e:
        print(f"FAILED: {e}")
