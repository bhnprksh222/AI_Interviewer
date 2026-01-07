from fastapi import APIRouter, Depends, HTTPException, status, Form, UploadFile, File
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.profile import Profile
from backend.models.user import User
from backend.services.auth_service import (
    get_current_user,
    verify_jwt_token,
)  # ✅ Import verify_jwt_token
from pydantic import BaseModel
from typing import List, Optional
import os
import shutil
import json

router = APIRouter()

UPLOAD_FOLDER = "uploads/resumes"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


# ✅ Define Profile Update Model
class CompanyExperience(BaseModel):
    company_name: str
    years: str


class Education(BaseModel):
    degree: str
    institution: str
    year_of_passing: str
    grade_or_percentage: Optional[str]


class UpdateProfileRequest(BaseModel):
    company_experience: List[CompanyExperience]
    skills: List[str]
    preferred_role: str
    education: List[Education]
    certifications: List[str]


# ✅ GET Profile
@router.get("/", tags=["Profile Management"])
def get_profile(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()

    if not profile:
        return {"message": "Profile not found"}

    return {
        "user_id": profile.user_id,
        "company_experience": profile.company_experience,
        "skills": profile.skills,
        "preferred_role": profile.preferred_role,
        "education": profile.education,
        "certifications": profile.certifications,
        "resume_file": profile.resume_file,
    }


# ✅ POST Profile (For Postman Testing)
@router.post("/", tags=["Profile Management"])
def get_profile_with_token(token: str, db: Session = Depends(get_db)):
    payload = verify_jwt_token(token)  # ✅ Use verify_jwt_token to decode the token

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Token"
        )

    user = db.query(User).filter(User.id == payload["user_id"]).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found"
        )

    profile = db.query(Profile).filter(Profile.user_id == user.id).first()
    if not profile:
        return {"message": "Profile not found", "skills": []}

    return profile


# ✅ PUT Profile (Explicit Update Profile Endpoint)
@router.put("/updateProfile/", tags=["Profile Management"])
async def update_profile_explicit(
    company_experience: str = Form(...),
    skills: str = Form(...),
    preferred_role: str = Form(...),
    education: str = Form(...),
    certifications: str = Form(...),
    resume: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        # Parse JSON strings into Python objects
        company_experience_data = json.loads(company_experience)
        skills_data = json.loads(skills)
        education_data = json.loads(education)
        certifications_data = json.loads(certifications)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Invalid JSON input: {e}")

    # Fetch or create the profile
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if not profile:
        profile = Profile(user_id=current_user.id)
        db.add(profile)

    # Update profile fields
    profile.company_experience = company_experience_data
    profile.skills = skills_data
    profile.preferred_role = preferred_role
    profile.education = education_data
    profile.certifications = certifications_data

    # Handle resume upload
    if resume:
        resume_path = os.path.join(UPLOAD_FOLDER, resume.filename)
        with open(resume_path, "wb") as buffer:
            shutil.copyfileobj(resume.file, buffer)
        profile.resume_file = resume_path

    db.commit()
    return {"message": "Profile updated successfully"}


# ✅ POST Profile (Create Profile)
@router.post("/createProfile/", tags=["Profile Management"])
def create_profile(
    company_experience: list[dict] = Form(...),
    skills: list[str] = Form(...),
    preferred_role: str = Form(...),
    education: list[dict] = Form(...),
    certifications: list[str] = Form(...),
    resume: UploadFile = File(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()

    if profile:
        raise HTTPException(status_code=400, detail="Profile already exists")

    profile = Profile(
        user_id=current_user.id,
        company_experience=company_experience,
        skills=skills,
        preferred_role=preferred_role,
        education=education,
        certifications=certifications,
    )

    if resume:
        resume_path = f"{UPLOAD_FOLDER}/{resume.filename}"
        with open(resume_path, "wb") as buffer:
            shutil.copyfileobj(resume.file, buffer)
        profile.resume_file = resume_path

    db.add(profile)
    db.commit()
    return {"message": "Profile created successfully"}
