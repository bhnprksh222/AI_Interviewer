from sqlalchemy import Column, Integer, ForeignKey, Float
from sqlalchemy.orm import relationship
from backend.database import Base


class Score(Base):
    __tablename__ = "scores"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    interview_id = Column(Integer, ForeignKey("mock_interviews.id"))
    round_number = Column(Integer, nullable=False)
    clarity = Column(Float, nullable=True)
    fluency = Column(Float, nullable=True)
    technical_knowledge = Column(Float, nullable=True)
    problem_solving = Column(Float, nullable=True)
    logical_thinking = Column(Float, nullable=True)
    overall_score = Column(Float, nullable=True)

    user = relationship("User", back_populates="scores")
    interview = relationship("MockInterview")
