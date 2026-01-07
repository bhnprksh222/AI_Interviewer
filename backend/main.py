# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from backend.database import Base, engine
from backend.routes import auth, profile_routes
from backend.routes.interview import router as interview_router
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI()

# Configure CORS
ALLOWED_ORIGINS = [
    "https://ai-interviewer-lilac.vercel.app",
    "https://ai-interviewer-ciu9.onrender.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Include routers
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(
    profile_routes.router, prefix="/profile", tags=["Profile Management"]
)
app.include_router(interview_router, prefix="/api", tags=["Interview"])


@app.on_event("startup")
async def startup_event():
    print("Initializing Database...")
    Base.metadata.create_all(bind=engine)
    print("Database initialized successfully")


@app.get("/")
def read_root():
    return {"message": "Welcome to the AI Interview Preparation API"}


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run("backend.main:app", host=host, port=port, reload=True)
