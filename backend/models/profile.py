from sqlalchemy import Column, Integer, String, JSON, ForeignKey
from sqlalchemy.orm import relationship
from backend.database import Base


class Profile(Base):
    __tablename__ = "profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    company_experience = Column(JSON, nullable=True)
    skills = Column(JSON, nullable=True)
    preferred_role = Column(String, nullable=True)
    education = Column(JSON, nullable=True)
    certifications = Column(JSON, nullable=True)
    resume_file = Column(String, nullable=True)

    user = relationship("User", back_populates="profile")
