from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from backend.database import Base
from pydantic import BaseModel, EmailStr


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)  # Correct field name
    full_name = Column(String)

    # Reverse relationships
    mcq_scores = relationship("MCQRoundScore", back_populates="user")
    technical_scores = relationship("TechnicalRoundScore", back_populates="user")
    intro_scores = relationship("SelfIntroductionScore", back_populates="user")
    profile = relationship("Profile", back_populates="user", uselist=False)


class UserSignup(BaseModel):
    username: str
    email: EmailStr
    password: str
    fullname: str


# Import Profile Here to Avoid Import Issues
from backend.models.profile import Profile
