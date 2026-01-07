from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from backend.database import Base
import datetime


class MockInterview(Base):
    __tablename__ = "mock_interviews"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    date = Column(DateTime, default=datetime.datetime.utcnow)
    round_number = Column(
        Integer, nullable=False
    )  # 1: Self Intro, 2: Technical, 3: Coding
    status = Column(String(50), nullable=False, default="pending")

    user = relationship("User", back_populates="interviews")
