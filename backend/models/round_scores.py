from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.database import Base  # Correct import path for Base


class MCQRoundScore(Base):
    __tablename__ = "mcq_round_scores"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    total_score = Column(Float)
    feedback = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="mcq_scores")


class TechnicalRoundScore(Base):
    __tablename__ = "technical_round_scores"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    communication_score = Column(Float)
    technical_knowledge_score = Column(Float)
    confidence_score = Column(Float)
    feedback = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="technical_scores")


class SelfIntroductionScore(Base):
    __tablename__ = "self_intro_scores"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    communication_score = Column(Float)
    confidence_score = Column(Float)
    professionalism_score = Column(Float)
    feedback = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="intro_scores")
