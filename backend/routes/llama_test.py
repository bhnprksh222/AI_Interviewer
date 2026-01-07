import sys

sys.path.append(
    "/opt/anaconda3/lib/python3.12/site-packages"
)  # Ensure correct package path

from langchain_groq import ChatGroq  # Now import should work
from dotenv import load_dotenv

# from models.data_clean import initialize_chromadb
from bs4 import BeautifulSoup
import os

load_dotenv()


def setup_llm():
    """Initializes the LLM model."""
    return ChatGroq(
        model="llama3-8b-8192", groq_api_key=os.getenv("GROQ_API_KEY"), temperature=0.5
    )


llm = setup_llm()


def generate_question():
    """Generates a career-related question dynamically based on previous answers."""

    categories = [
        "Interests",
        "Skills",
        "Education",
        "Experience",
        "Work Environment Preferences",
        "Industry Preference",
        "Career Growth Aspirations",
    ]

    prompt_template = "You are a interviewer now and i want you to take actual interview of candudates who attending this interview, first round would be self introduction, second round would be technical round in where you have to ask technical questions as per the candidate self introduction response and third round would be coding in where you need to provide code first and on submit you have to review all three rounds and give scroe and feedback for the cadidate to improve thier skills."
    "now ask a question"

    return llm.invoke(prompt_template)


print(generate_question())
