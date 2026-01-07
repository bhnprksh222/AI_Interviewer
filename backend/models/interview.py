from sqlalchemy import Column, Integer, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.database import Base


class UserInterview(Base):
    __tablename__ = "user_interviews"

    id = Column(Integer, primary_key=True, index=True)  # Unique interview ID
    user_id = Column(
        Integer, ForeignKey("users.id"), nullable=False
    )  # Foreign key to users table
    interview_attempt = Column(
        Integer, nullable=False
    )  # Attempt number for the interview
    date = Column(DateTime, default=datetime.utcnow)
    self_intro_response = Column(Text, nullable=True)
    questions = Column(Text, nullable=False)
    answers = Column(Text, nullable=False)

    # Relationship to the User model (if needed)
    user = relationship("User", back_populates="interviews")
