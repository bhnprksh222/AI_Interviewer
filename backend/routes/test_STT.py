# test_audio.py
import os
from groq import Groq
from dotenv import dotenv_values

# ✅ Reference the `.env` file from the root directory
env_path = os.path.join(os.path.dirname(__file__), "..", "..", ".env")

# ✅ Load environment variables safely
env_values = dotenv_values(env_path)

API_KEY = env_values.get("GROQ_API_KEY")  # Replace with your Groq API key
client = Groq(api_key=API_KEY)

# Specify the path to your audio file
audio_file_path = "C:/Users/knave/Downloads/OSR_us_000_0010_8k.wav"  # <-- Replace this with your actual audio file path

# Check if the file exists
if not os.path.exists(audio_file_path):
    raise FileNotFoundError(f"❌ File not found: {audio_file_path}")

# Read the audio file and send it to Groq API
try:
    print("🎤 Reading audio file...")
    with open(audio_file_path, "rb") as audio_file:
        # Sending the file to Groq Whisper API
        transcription = client.audio.transcriptions.create(
            file=("audio.wav", audio_file.read()),  # Send file name and content
            model="whisper-large-v3",  # Model to use
            prompt="Specify context or spelling",  # Optional prompt
            response_format="json",  # Optional response format
            language="en",  # Language of the audio
            temperature=0.0,  # Optional: 0.0 means deterministic output
        )
    print("✅ Transcription response:", transcription)

    # Check if transcription is successful
    if transcription and "text" in transcription:
        print("✅ Transcription successful:\n")
        print(transcription["text"])
    else:
        print("❌ Failed to retrieve transcription result.")

except Exception as e:
    print(f"❌ Error during transcription: {e}")
