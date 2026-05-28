from gradio_client import Client

try:
    print("Connecting to sdafd/KOKORO-TTS-1.0...")
    client = Client("sdafd/KOKORO-TTS-1.0")
    print("Connected. Generating speech...")
    result = client.predict(
        "Hello from Python! This is a test of the CPU-based Kokoro API.", # text
        "American English", # language
        "af_heart", # voice
        1.0, # speed
        False, # translate_text
        False, # remove_silence
        None, # input_key
        0.05, # keep_silence_up_to
        api_name="/KOKORO_TTS_API"
    )
    print("SUCCESS! Result:", result)
except Exception as e:
    print("FAILED:", e)
