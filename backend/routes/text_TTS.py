import os
from groq import Groq
from dotenv import dotenv_values

# ✅ Reference the `.env` file from the root directory
env_path = os.path.join(os.path.dirname(__file__), "..", "..", ".env")

# ✅ Load environment variables safely
env_values = dotenv_values(env_path)

API_KEY = env_values.get("GROQ_API_KEY")  # Replace with your Groq API key
client = Groq(api_key=API_KEY)

speech_file_path = "D:/speech.wav"
model = "playai-tts"
voice = "Fritz-PlayAI"
text = "I love building and shipping new features for our users!"
response_format = "wav"

response = client.audio.speech.create(
    model=model, voice=voice, input=text, response_format=response_format
)

response.write_to_file(speech_file_path)
