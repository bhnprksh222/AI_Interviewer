import whisper
import pyaudio
import wave
import os
from transformers import pipeline
from gtts import gTTS

# Load Whisper model
model = whisper.load_model(
    "base"
)  # You can choose a different model like 'small', 'medium', 'large', etc.

# Setup microphone input
p = pyaudio.PyAudio()

# Define recording parameters
FORMAT = pyaudio.paInt16
CHANNELS = 1
RATE = 16000
CHUNK = 1024
RECORD_SECONDS = 25  # Record for 25 seconds


# Method 1: Speech-to-Text using Whisper
def speech_to_text():
    print("Recording...")

    # Open the audio stream
    stream = p.open(
        format=FORMAT, channels=CHANNELS, rate=RATE, input=True, frames_per_buffer=CHUNK
    )

    frames = []

    # Record for the specified duration
    for _ in range(0, int(RATE / CHUNK * RECORD_SECONDS)):
        data = stream.read(CHUNK)
        frames.append(data)

    print("Recording finished.")
    stream.stop_stream()
    stream.close()

    # Save the recorded audio to a temporary file
    temp_audio_file = "temp.wav"
    wf = wave.open(temp_audio_file, "wb")
    wf.setnchannels(CHANNELS)
    wf.setsampwidth(p.get_sample_size(FORMAT))
    wf.setframerate(RATE)
    wf.writeframes(b"".join(frames))
    wf.close()

    # Transcribe audio using Whisper
    print("Transcribing audio...")
    result = model.transcribe(temp_audio_file)
    transcription = result["text"]

    # Optionally, clean up the temp file
    os.remove(temp_audio_file)

    print(f"Transcription: {transcription}")
    return transcription


# Method 2: LLaMA LLM Interaction
def llama_interaction(user_details, user_response):
    # Example: Use Hugging Face's pipeline for text generation
    generator = pipeline(
        "text-generation", model="EleutherAI/gpt-neo-1.3B"
    )  # Replace with LLaMA model if available
    prompt = f"User Details: {user_details}\nUser Response: {user_response}\nGenerate the next question:"
    response = generator(prompt, max_length=100, num_return_sequences=1)
    question = response[0]["generated_text"]
    print(f"Generated Question: {question}")
    return question


# Method 3: Text-to-Speech
def text_to_speech(text):
    tts = gTTS(text)
    tts.save("question.mp3")
    print(f"Generated speech for: {text}")
    os.system("start question.mp3")
    # For Windows, use 'start'.
    # For macOS, use 'afplay'. For Linux, use 'mpg123'


# Example Usage
if __name__ == "__main__":
    # Example user details and response
    user_details = "Name: John Doe, Role: Software \
    Engineer, Skills: Python, React"
    user_response = "I have experience in building scalable web applications."

    # Step 1: Listen to user
    user_text = speech_to_text()

    # Step 2: Generate question using LLaMA
    question = llama_interaction(user_details, user_text)

    # Step 3: Convert question to speech
    text_to_speech(question)
