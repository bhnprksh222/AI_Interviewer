from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer
from backend.database import get_db
from backend.models.user import User
from backend.services.auth_service import (
    hash_password,
    verify_password,
    create_jwt_token,
    verify_jwt_token,
)
from pydantic import BaseModel, EmailStr

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


# ✅ User Signup Model
class SignupModel(BaseModel):
    username: str
    email: EmailStr
    password: str
    fullname: str
    confirm_password: str


# ✅ User Login Model
class LoginModel(BaseModel):
    email: EmailStr
    password: str


# ✅ User Signup Route
@router.post("/signup/")
def signup(user: SignupModel, db: Session = Depends(get_db)):
    print("user.full_name:", user.fullname)

    # Check if passwords match
    if user.password != user.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")

    # Check if email already exists
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Hash password and create new user
    new_user = User(
        username=user.username,
        full_name=user.fullname,
        email=user.email,
        hashed_password=hash_password(user.password),  # Corrected field name
    )
    db.add(new_user)
    db.commit()

    return {"message": "User registered successfully"}


# ✅ User Login Route
@router.post("/login/")
def login(user: LoginModel, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user.email).first()
    if not existing_user or not verify_password(
        user.password, existing_user.hashed_password
    ):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_jwt_token({"user_id": existing_user.id})
    return {"access_token": token, "token_type": "bearer"}  # Ensure this format
