from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os
from dotenv import load_dotenv


load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")


# ✅ Debugging output
if DATABASE_URL:
    print("✅ Success: DATABASE_URL Loaded")

if not DATABASE_URL:
    raise ValueError("❌ ERROR: DATABASE_URL is not set! Check your .env file.")

# ✅ Initialize database connection
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# ✅ Dependency function for getting DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
