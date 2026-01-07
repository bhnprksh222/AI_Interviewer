from fastapi import APIRouter, File, UploadFile, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List, Dict, Set
from pydantic import BaseModel
from datetime import datetime
import os
import json
from langdetect import detect, DetectorFactory
from gtts import gTTS
from gtts.lang import tts_langs
from dotenv import load_dotenv
import random
import hashlib
import re

from backend.database import get_db
from backend.models.user import User
from backend.models.profile import Profile
from backend.models.round_scores import (
    MCQRoundScore,
    TechnicalRoundScore,
    SelfIntroductionScore,
)
from backend.services.round_service import (
    save_mcq_score,
    save_technical_score,
    save_intro_score,
    get_mcq_scores,
    get_technical_scores,
    get_self_intro_scores,
)
from backend.services.auth_service import get_current_user
import pinecone
from sentence_transformers import SentenceTransformer

# from llama_cpp import Llama
from pinecone import Pinecone, ServerlessSpec
from groq import Groq
from langchain_groq import ChatGroq
from transformers import AutoTokenizer, AutoModel
import torch

DetectorFactory.seed = 0
router = APIRouter()


# ✅ Load environment variables
load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")

# ✅ Safety check for keys
if not GROQ_API_KEY:
    raise ValueError("❌ GROQ_API_KEY is not found. Please check your .env file.")

if not PINECONE_API_KEY:
    raise ValueError("❌ PINECONE_API_KEY is not found. Please check your .env file.")

# ✅ Initialize Pinecone with supported region for free-tier users
pc = Pinecone(api_key=PINECONE_API_KEY)
index_name = "aiinterviewer"
allowed_region = "us-east-1"  # ✅ Use this to avoid INVALID_ARGUMENT error

# ✅ Create index only if not exists
existing_indexes = [i.name for i in pc.list_indexes()]
if index_name not in existing_indexes:
    pc.create_index(
        name=index_name,
        dimension=384,  # Reduced dimension size for better space efficiency
        metric="cosine",
        spec=ServerlessSpec(cloud="aws", region=allowed_region),
    )

# Initialize models
index = pc.Index(index_name)
# Initialize embedding model using a smaller but efficient model
embedding_model = SentenceTransformer(
    "all-MiniLM-L6-v2"
)  # Smaller model with 384 dimensions


def get_embedding(text: str) -> list:
    """Generate embedding using sentence-transformers model"""
    embeddings = embedding_model.encode(text, normalize_embeddings=True)
    return embeddings.tolist()


client = Groq(api_key=GROQ_API_KEY)
llm = ChatGroq(model="llama3-8b-8192", groq_api_key=GROQ_API_KEY, temperature=0.5)

# Fix deterministic output for langdetect
DetectorFactory.seed = 0


def generate_speech_from_text(text: str, file_name: str = "output_speech.mp3"):
    try:
        detected_lang = detect(text)
        available_languages = tts_langs()
        if detected_lang not in available_languages:
            detected_lang = "en"
        os.makedirs("static", exist_ok=True)
        full_path = os.path.join("static", file_name)
        tts = gTTS(text=text, lang=detected_lang)
        tts.save(full_path)
        return file_name
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to generate speech: {str(e)}"
        )


@router.post("/speechToText/")
async def speech_to_text_route(audio_file: UploadFile = File(...)):
    temp_wav_file = "temp_audio.wav"
    try:
        with open(temp_wav_file, "wb") as f:
            f.write(await audio_file.read())
        with open(temp_wav_file, "rb") as f:
            transcription = client.audio.transcriptions.create(
                file=("temp_audio.wav", f.read()),
                model="whisper-large-v3-turbo",
                response_format="json",
                language="en",
                temperature=0.0,
            )
        transcribed_text = transcription.text
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to transcribe audio: {str(e)}"
        )
    finally:
        if os.path.exists(temp_wav_file):
            os.remove(temp_wav_file)
    return {"transcription": transcribed_text}


@router.post("/textToSpeech/")
def text_to_speech_route(text: str):
    file_path = generate_speech_from_text(text)
    return {"speech_file": file_path}


class LlamaConversationRequest(BaseModel):
    prompt: str


@router.post("/llamaConversation/")
def llama_conversation(request: LlamaConversationRequest):
    try:
        response_text = llm.invoke(request.prompt)
        return {"response_text": response_text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Llama processing error: {str(e)}")


@router.post("/startSelfIntroduction/")
async def start_self_introduction(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    try:
        prompt_text = (
            f"Hello {current_user.full_name}, I'm Voxa, your AI interview coach. You are about to begin the self-introduction round. "
            "You will have 30 seconds to speak. Please share your name, background, and career goals. Begin speaking after the beep."
        )
        speech_file = generate_speech_from_text(prompt_text, "intro_start.wav")
        return {"ai_prompt": speech_file, "subtitle": prompt_text}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail="Failed to generate AI voice prompt."
        )


class StopSelfIntroductionRequest(BaseModel):
    transcription: str


@router.post("/stopSelfIntroduction/")
async def stop_self_introduction(
    request: StopSelfIntroductionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        feedback = get_self_intro_feedback_from_llama(
            request.transcription, db=db, user_id=current_user.id
        )
        closing_prompt = f"Thank you {current_user.full_name} for your introduction. You may now proceed to the next round when you're ready."
        speech_file = generate_speech_from_text(closing_prompt, "self_intro_stop.mp3")
        return {
            "closing_prompt": speech_file,
            "feedback": feedback,
            "subtitle": closing_prompt,
        }
    except Exception as e:
        print(f"❌ Error in /stopSelfIntroduction/: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to stop self-introduction: {e}"
        )


@router.post("/startTechnicalRound/")
async def start_technical_round():
    try:
        initial_prompt = (
            "Welcome to the technical round. I will ask you questions to assess your problem-solving and technical knowledge. "
            "Please answer confidently and clearly."
        )
        speech_file = generate_speech_from_text(initial_prompt, "technical_start.mp3")
        return {"ai_prompt": speech_file, "subtitle": initial_prompt}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to start technical round.")


class GenerateTechQuestionRequest(BaseModel):
    prev_question: str = None
    prev_answer: str = None


prev_qa_list = []

# Add global set to track asked questions per user
user_question_history = {}


# Add function to generate question hash
def get_question_hash(question: str) -> str:
    return hashlib.md5(question.lower().encode()).hexdigest()


# Add function to check and update question history
def update_question_history(user_id: int, question_hash: str) -> bool:
    """
    Returns True if question is new, False if it was asked before
    """
    if user_id not in user_question_history:
        user_question_history[user_id] = set()

    if question_hash in user_question_history[user_id]:
        return False

    user_question_history[user_id].add(question_hash)
    return True


# Add function to store questions in Pinecone
async def store_question_in_pinecone(question: str, category: str, difficulty: str):
    try:
        # Generate embedding for the question
        question_embedding = get_embedding(question)

        # Create a unique ID for the question
        question_id = get_question_hash(question)

        # Store in Pinecone with metadata
        index.upsert(
            vectors=[
                {
                    "id": question_id,
                    "values": question_embedding,
                    "metadata": {
                        "question": question,
                        "category": category,
                        "difficulty": difficulty,
                        "timestamp": datetime.now().isoformat(),
                    },
                }
            ]
        )
        return True
    except Exception as e:
        print(f"❌ Error storing question in Pinecone: {e}")
        return False


@router.post("/generateTechQuestion/")
async def generate_technical_question(
    request: GenerateTechQuestionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        # Get user's profile
        user_profile = (
            db.query(Profile).filter(Profile.user_id == current_user.id).first()
        )
        if not user_profile:
            print("⚠️ User profile not found, using default profile")
            skills = ["Software Development"]
            preferred_role = "Software Engineer"
        else:
            skills = user_profile.skills or ["Software Development"]
            preferred_role = user_profile.preferred_role or "Software Engineer"

        # Store previous Q&A if provided
        if request.prev_question and request.prev_answer:
            prev_qa_list.append(
                {"question": request.prev_question, "answer": request.prev_answer}
            )

        # Define question categories and difficulties
        question_categories = [
            "Data Structures & Algorithms",
            "System Design",
            "Programming Concepts",
            "Problem Solving",
            "Software Engineering Practices",
        ]

        # Add skill-specific categories
        if skills:
            for skill in skills:
                if "frontend" in skill.lower() or "react" in skill.lower():
                    question_categories.extend(
                        ["Frontend Development", "React", "JavaScript"]
                    )
                elif "backend" in skill.lower() or "python" in skill.lower():
                    question_categories.extend(
                        ["Backend Development", "API Design", "Database Systems"]
                    )
                elif "data" in skill.lower():
                    question_categories.extend(
                        ["Data Engineering", "Big Data", "Data Processing"]
                    )

        # Select random category and difficulty
        selected_category = random.choice(question_categories)
        difficulty_levels = ["Easy", "Medium", "Hard"]
        selected_difficulty = random.choice(difficulty_levels)

        # Try to find existing question from Pinecone first
        try:
            # Generate a random vector to get diverse results
            random_vector = [
                random.uniform(-1, 1) for _ in range(384)
            ]  # Updated dimension

            # Query Pinecone with filters
            query_response = index.query(
                vector=random_vector,
                top_k=5,
                include_metadata=True,
                filter={
                    "category": selected_category,
                    "difficulty": selected_difficulty,
                },
            )

            # Filter out previously asked questions
            fresh_questions = [
                match
                for match in query_response.matches
                if update_question_history(current_user.id, match.id)
            ]

            if fresh_questions:
                # Use a random question from fresh ones
                selected_question = random.choice(fresh_questions)
                question_text = selected_question.metadata["question"]
                print(f"✅ Using existing question from Pinecone: {question_text}")
            else:
                # Generate new question if no fresh ones found
                raise Exception("No fresh questions found in Pinecone")
        except Exception as e:
            print(f"⚠️ Pinecone query failed or no fresh questions: {e}")
            # Generate new question using LLaMA
            prompt = (
                f"You are conducting a technical interview for a {preferred_role} position. face to face interview so that ask question in a way candidate answer in few words.\n"
                f"Generate ONE specific technical question that:\n"
                f"1. Is in the category: Based on the candidate's skills  {', '.join(skills)} and role {preferred_role}\n"
                f"2. Has {selected_difficulty} difficulty level\n"
                f"3. Is specific and requires a detailed technical answer\n"
                f"4. Is different from previous questions: {json.dumps(prev_qa_list[-3:] if prev_qa_list else 'None')}\n"
                f"5. Tests the candidate's knowledge in: {', '.join(skills)}\n\n"
                f"Format your response exactly like this example:\n"
                f"Question: Explain the concept of dependency injection in software development and provide a practical example.\n\n"
                f"DO NOT include any prefixes. Start directly with the actual question."
            )

            # Get response from LLaMA with higher temperature for more randomness
            llm.temperature = 0.8  # Increase randomness
            llama_response = llm.invoke(prompt)
            llm.temperature = 0.5  # Reset temperature

            response_text = getattr(llama_response, "content", str(llama_response))
            question_text = response_text.strip()

            # Clean up the question
            if question_text.lower().startswith(("here", "technical", "question:")):
                question_text = question_text.split(":", 1)[-1].strip()

            # Store the new question in Pinecone for future use
            # await store_question_in_pinecone(
            #     question=question_text,
            #     category=selected_category,
            #     difficulty=selected_difficulty
            # )

            # Update question history
            question_hash = get_question_hash(question_text)
            update_question_history(current_user.id, question_hash)

        # Generate speech file
        speech_file = generate_speech_from_text(question_text, "technical_question.mp3")

        return {
            "new_question": question_text,
            "speech_file": speech_file,
            "category": selected_category,
            "difficulty": selected_difficulty,
        }

    except Exception as e:
        print(f"❌ Error in generateTechQuestion: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Failed to generate technical question: {str(e)}"
        )


@router.post("/stopTechRound/")
async def stop_tech_round(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """
    Stop the technical round, generate feedback, and return the closing prompt.
    """
    try:
        print(f"Stopping technical round for user: {current_user.id}")

        # Generate the closing prompt
        closing_prompt = f"Awesome {current_user.full_name}, You've wrapped up the technical round. Great job! Hit submit to head back to the dashboard."
        speech_file = generate_speech_from_text(closing_prompt, "technical_stop.mp3")
        print(f"✅ Generated speech file: {speech_file}")

        # Call the function to get feedback
        feedback = get_technical_feedback_from_llama(
            prev_qa_list, db=db, user_id=current_user.id
        )
        print(f"✅ Feedback from LLaMA: {feedback}")

        return {
            "closing_prompt": speech_file,
            "feedback": feedback,
            "subtitle": closing_prompt,
        }
    except Exception as e:
        print(f"❌ Error in /stopTechRound/: {e}")
        raise HTTPException(status_code=500, detail="Failed to stop technical round.")


@router.post("/startMCQRound/", tags=["Interview"])
async def start_mcq_round(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    try:
        # Get user's profile
        user_profile = (
            db.query(Profile).filter(Profile.user_id == current_user.id).first()
        )
        if not user_profile:
            print("⚠️ User profile not found, using default profile")
            skills = ["Software Development"]
            preferred_role = "Software Engineer"
        else:
            skills = user_profile.skills or ["Software Development"]
            preferred_role = user_profile.preferred_role or "Software Engineer"

        # Define categories and difficulties
        categories = [
            "Programming Fundamentals",
            "Data Structures",
            "Algorithms",
            "System Design",
            "Web Development",
            "Database Management",
            "Software Architecture",
            "DevOps & Tools",
        ]

        # Construct prompt with more diversity requirements
        prompt = (
            f"Create 10 diverse technical multiple-choice questions for a {preferred_role} candidate "
            f"with skills in {', '.join(skills)}.\n\n"
            f"Requirements for the 10 questions:\n"
            f"- Each question MUST be from a different category based on the candidate's skills {', '.join(skills)} and role {preferred_role}:\n"
            f"- Include a mix of difficulty levels (easy, medium, hard)\n"
            f"- Questions should test both theoretical knowledge and practical application\n"
            f"- No two questions should cover the same concept\n"
            f"- Include questions specific to the candidate's skills\n\n"
            f"Each question must have:\n"
            f"- Four unique options (A, B, C, D)\n"
            f"- One correct answer\n"
            f"- Clear and unambiguous wording\n\n"
            f"Return ONLY a JSON array in this format for all 10 questions:Example\n"
            f"[\n"
            f"  {{\n"
            f'    "question": "What is the time complexity of binary search?",\n'
            f'    "options": ["O(1)", "O(log n)", "O(n)", "O(n^2)"],\n'
            f'    "correct_answer": "O(log n)",\n'
            f'    "category": "Algorithms",\n'
            f'    "difficulty": "Medium"\n'
            f"  }}\n"
            f"]\n"
        )

        # Get response from LLaMA with higher temperature
        llm.temperature = 0.8  # Increase randomness
        llama_response = llm.invoke(prompt)
        llm.temperature = 0.5  # Reset temperature

        response_text = getattr(llama_response, "content", str(llama_response))
        print(f"✅ Response text: {response_text}")
        # Clean up and parse the response
        start_idx = response_text.find("[")
        end_idx = response_text.rfind("]") + 1
        if start_idx == -1 or end_idx == 0:
            raise ValueError("Invalid response format from LLaMA")

        json_str = response_text[start_idx:end_idx]
        questions_list = json.loads(json_str)
        print(f"✅ Questions list: {questions_list}")
        # Validate and filter questions
        filtered_questions = []
        used_categories = set()

        for q in questions_list:
            # Skip if category already used or question invalid
            if q["category"] in used_categories or not all(
                key in q
                for key in [
                    "question",
                    "options",
                    "correct_answer",
                    "category",
                    "difficulty",
                ]
            ):
                continue

            # Generate question hash
            question_hash = get_question_hash(q["question"])

            # Skip if question was asked before
            if not update_question_history(current_user.id, question_hash):
                continue

            used_categories.add(q["category"])
            filtered_questions.append(q)

            # # Store in Pinecone for future use
            # await store_question_in_pinecone(
            #     question=q["question"],
            #     category=q["category"],
            #     difficulty=q["difficulty"]
            # )

        # if len(filtered_questions) < 5:
        #     raise ValueError("Not enough unique questions generated")

        return {"questions": questions_list}

    except Exception as e:
        print(f"❌ Error in startMCQRound: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating MCQs: {str(e)}")


class SubmitMCQPayload(BaseModel):
    question: str
    answer: str


@router.post("/submitMCQ/")
async def submit_mcq(
    payload: List[SubmitMCQPayload],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Submit MCQ answers, evaluate them using LLaMA, and save the score and feedback.
    """
    try:
        # Construct the prompt for LLaMA
        prompt = (
            "Evaluate the following MCQ answers and provide a final score out of 10 and brief feedback.\n"
            "Return ONLY a JSON response in this exact format: Example\n"
            '{ "score": 8.0, "feedback": "Strong performance on networking and fundamentals." }\n\n'
            "Questions and Answers to evaluate:\n\n"
        )
        for response in payload:
            prompt += (
                f"Question: {response.question}\nUser's Answer: {response.answer}\n\n"
            )

        prompt += "Remember to return ONLY the JSON response in the specified format."

        # Call LLaMA to evaluate the answers
        llama_response = llm.invoke(prompt)
        review = getattr(llama_response, "content", str(llama_response))
        print(f"✅ Raw LLaMA Response: {review}")  # Log the raw response

        # Extract JSON from the response
        try:
            # Find the last occurrence of a JSON-like structure
            matches = list(
                re.finditer(r'{[^{]*"score":\s*\d+\.?\d*[^}]*"feedback":[^}]*}', review)
            )
            if not matches:
                raise ValueError("No valid JSON structure found in response")

            json_str = matches[-1].group()  # Take the last match
            parsed = json.loads(json_str)

            # Validate the required fields
            if "score" not in parsed or "feedback" not in parsed:
                raise ValueError("Missing required fields in JSON response")

            # Ensure score is a float
            parsed["score"] = float(parsed["score"])

        except (json.JSONDecodeError, ValueError) as e:
            print(f"❌ Error parsing LLaMA response: {e}")
            print(f"❌ Attempted to parse: {review}")
            raise HTTPException(
                status_code=500, detail="Failed to parse LLaMA response as JSON."
            )

        # Save the score and feedback to the database
        save_mcq_score(
            user_id=current_user.id,
            total_score=parsed["score"],
            feedback=parsed["feedback"],
            db=db,
        )

        return parsed
    except Exception as e:
        print(f"❌ Error in submitMCQ: {e}")
        raise HTTPException(status_code=500, detail=str(e))


def get_technical_feedback_from_llama(
    prev_qa_list: List[Dict[str, str]], db: Session, user_id: int
):
    """
    Evaluate the user's technical round responses using LLaMA and save the scores.
    """
    try:
        if not prev_qa_list:
            print("❌ prev_qa_list is empty. Cannot generate feedback.")
            raise HTTPException(
                status_code=400,
                detail="No questions and answers provided for feedback.",
            )

        # Construct the prompt for LLaMA
        prompt = (
            "You are evaluating a technical interview. Based on the candidate's answers, "
            "assign scores in the following categories:\n"
            "- communication_score (out of 10)\n"
            "- technical_knowledge_score (out of 10)\n"
            "- confidence_score (out of 10)\n"
            "Please analyze all answers together and provide just one overall score and one sentence of feedback (exactly 8-12 words).\n\n"
            "Return ONLY a valid JSON object with these exact keys, nothing else:\n"
            "{\n"
            '  "communication_score": number,\n'
            '  "technical_knowledge_score": number,\n'
            '  "confidence_score": number,\n'
            '  "feedback": "string"\n'
            "}\n\n"
            "Questions and Answers:\n"
        )

        for qa in prev_qa_list:
            prompt += f"Question: {qa['question']}\nAnswer: {qa['answer']}\n\n"

        print(f"📜 Prompt for LLaMA: {prompt}")

        # Call LLaMA to evaluate the responses
        llama_response = llm.invoke(prompt)
        evaluation_result = getattr(llama_response, "content", str(llama_response))
        print(f"✅ Raw LLaMA Response: {evaluation_result}")

        # Extract JSON from the response
        try:
            # Find JSON-like structure in the response
            json_start = evaluation_result.find("{")
            json_end = evaluation_result.rfind("}") + 1

            if json_start == -1 or json_end == 0:
                raise ValueError("No JSON structure found in response")

            json_str = evaluation_result[json_start:json_end]
            evaluation_data = json.loads(json_str)

            # Validate required fields and data types
            required_fields = [
                "communication_score",
                "technical_knowledge_score",
                "confidence_score",
                "feedback",
            ]
            for field in required_fields:
                if field not in evaluation_data:
                    raise ValueError(f"Missing required field: {field}")

                if field != "feedback" and not isinstance(
                    evaluation_data[field], (int, float)
                ):
                    evaluation_data[field] = float(evaluation_data[field])

            # Save the score to the database
            save_technical_score(
                user_id=user_id,
                comm=float(evaluation_data["communication_score"]),
                tech=float(evaluation_data["technical_knowledge_score"]),
                conf=float(evaluation_data["confidence_score"]),
                feedback=evaluation_data["feedback"],
                db=db,
            )

            return evaluation_data

        except json.JSONDecodeError as e:
            print(f"❌ JSON Parse Error: {e}")
            print(f"❌ Attempted to parse: {json_str}")
            raise HTTPException(
                status_code=500, detail="Failed to parse evaluation response"
            )
        except ValueError as e:
            print(f"❌ Validation Error: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    except Exception as e:
        print(f"❌ Error in get_technical_feedback_from_llama(): {e}")
        raise HTTPException(
            status_code=500, detail=f"Error processing technical feedback: {str(e)}"
        )


def get_self_intro_feedback_from_llama(transcript: str, db: Session, user_id: int):
    try:
        # Get user's profile to access skills and preferred role
        user_profile = db.query(Profile).filter(Profile.user_id == user_id).first()
        if not user_profile:
            print("⚠️ User profile not found, using default profile")
            skills = ["Software Development"]
            preferred_role = "Software Engineer"
        else:
            skills = user_profile.skills or ["Software Development"]
            preferred_role = user_profile.preferred_role or "Software Engineer"

        # Construct prompt for LLaMA with built-in ideal patterns
        ideal_patterns = [
            "Clear introduction with name and current role",
            "Highlight relevant skills and experience",
            "Express enthusiasm for the target role",
            "Share a brief career goal or objective",
            "Maintain professional tone throughout",
        ]

        prompt = (
            f"Analyze the following self-introduction transcript for a {preferred_role} candidate with "
            f"skills in: {', '.join(skills)}.\n\n"
            f"Key elements to look for:\n"
            f"{chr(10).join('- ' + pattern for pattern in ideal_patterns)}\n\n"
            f'Candidate\'s Transcript:\n"{transcript}"\n\n'
            f"Score the candidate in these categories (out of 10):\n"
            f"- communication_score: Clarity, structure, and effectiveness of communication\n"
            f"- confidence_score: Confidence level and presence\n"
            f"- professionalism_score: Professional tone and relevance to role\n\n"
            f"Also provide a one-sentence feedback focusing on strengths and areas for improvement.\n\n"
            f"Respond ONLY in this JSON format: Example\n"
            f'{{"communication_score": 8.5, "confidence_score": 9.0, '
            f'"professionalism_score": 8.0, "feedback": "Clear, confident and concise."}}'
        )

        # Get response from LLaMA
        llama_response = llm.invoke(prompt)
        response_text = getattr(llama_response, "content", str(llama_response))

        # Clean up the response to ensure it's valid JSON
        start_idx = response_text.find("{")
        end_idx = response_text.rfind("}") + 1
        if start_idx == -1 or end_idx == 0:
            raise ValueError("Invalid response format from LLaMA")

        json_str = response_text[start_idx:end_idx]
        evaluation = json.loads(json_str)

        # Validate the evaluation data
        required_fields = [
            "communication_score",
            "confidence_score",
            "professionalism_score",
            "feedback",
        ]
        if not all(field in evaluation for field in required_fields):
            raise ValueError("Missing required fields in evaluation response")

        # Save the scores
        save_intro_score(
            user_id=user_id,
            comm=float(evaluation["communication_score"]),
            conf=float(evaluation["confidence_score"]),
            prof=float(evaluation["professionalism_score"]),
            feedback=evaluation["feedback"],
            db=db,
        )

        return evaluation
    except json.JSONDecodeError as e:
        print(f"❌ JSON Parse Error in self-intro feedback: {e}")
        print(f"❌ Raw response: {response_text}")
        raise HTTPException(status_code=500, detail="Failed to parse feedback response")
    except Exception as e:
        print(f"❌ Error in self-intro feedback: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error processing self-introduction feedback: {str(e)}",
        )


@router.get("/interview/summary/")
async def interview_summary(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """
    Retrieve the summary of the last 3 attempts for all interview rounds.
    """
    try:
        self_intro_scores = get_self_intro_scores(current_user.id, db)
        mcq_scores = get_mcq_scores(current_user.id, db)
        technical_scores = get_technical_scores(current_user.id, db)

        if not (self_intro_scores or mcq_scores or technical_scores):
            return {"message": "No interviews taken yet."}

        return {
            "self_intro": self_intro_scores,
            "mcq": mcq_scores,
            "technical": technical_scores,
        }
    except Exception as e:
        print(f"❌ Error in /interview/summary: {e}")
        raise HTTPException(
            status_code=500, detail="Failed to retrieve interview summary."
        )


@router.post("/interview/overall-evaluation/")
async def overall_evaluation(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """
    Generate an overall evaluation score and feedback based on all rounds.
    """
    try:
        # Retrieve scores for all rounds
        self_intro_scores = get_self_intro_scores(current_user.id, db)
        mcq_scores = get_mcq_scores(current_user.id, db)
        technical_scores = get_technical_scores(current_user.id, db)

        if not (self_intro_scores or mcq_scores or technical_scores):
            raise HTTPException(
                status_code=400, detail="No interview data available for evaluation."
            )

        # Construct the prompt for LLaMA
        prompt = (
            "You are evaluating a mock interview process consisting of three rounds:\n"
            "- Self Introduction (assesses communication, confidence, and professionalism),\n"
            "- MCQ Round (assesses core technical concepts),\n"
            "- Technical Round (assesses applied knowledge, articulation, and confidence).\n\n"
            "Based on the candidate's scores and feedback from each round, assign a final interview performance score (0–100) "
            "and summarize performance in 1–2 sentences.\n\n"
            "Self Introduction Scores:\n"
            f"{self_intro_scores}\n\n"
            "MCQ Round Scores:\n"
            f"{mcq_scores}\n\n"
            "Technical Round Scores:\n"
            f"{technical_scores}\n\n"
            "Return ONLY in this JSON format:\n"
            '{"overall_score": 85, "summary_feedback": "Excellent communication and solid technical skills. Could show more confidence under pressure."}'
        )

        print(f"📜 Prompt for LLaMA: {prompt}")

        # Call LLaMA to generate the overall evaluation
        llama_response = llm.invoke(prompt)
        evaluation = json.loads(getattr(llama_response, "content", str(llama_response)))

        return evaluation
    except Exception as e:
        print(f"❌ Error in /interview/overall-evaluation/: {e}")
        raise HTTPException(
            status_code=500, detail="Failed to generate overall evaluation."
        )
