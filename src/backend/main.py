from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from src.backend.user_model import Base, User
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
import bcrypt
import os
import secrets
from datetime import datetime, timedelta

DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../data/users.db'))
DATABASE_URL = f"sqlite:///{DB_PATH}"
print(f"[INFO] Backend DB: {DB_PATH}")
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Für Entwicklung, später gezielt setzen!
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class UserRegister(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class TokenData(BaseModel):
    session_token: str

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordReset(BaseModel):
    token: str
    new_password: str

@app.post("/register")
async def register(user: UserRegister, db: Session = Depends(get_db)):
    if db.query(User).filter((User.username == user.username) | (User.email == user.email)).first():
        raise HTTPException(status_code=400, detail="Benutzername oder E-Mail existiert bereits.")
    hashed_pw = bcrypt.hashpw(user.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    db_user = User(username=user.username, email=user.email, password=hashed_pw)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return {"message": "User registered", "user": db_user.username, "email": db_user.email}

@app.post("/login")
async def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.username == user.username).first()
    if not db_user or not bcrypt.checkpw(user.password.encode('utf-8'), db_user.password.encode('utf-8')):
        raise HTTPException(status_code=401, detail="Benutzername oder Passwort falsch.")
    
    token = secrets.token_hex(16)
    db_user.session_token = token
    db.commit()
    
    return {"message": "Login erfolgreich", "user": db_user.username, "email": db_user.email, "session_token": token}

@app.post("/verify-token")
async def verify_token(token_data: TokenData, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.session_token == token_data.session_token).first()
    if not db_user:
        raise HTTPException(status_code=401, detail="Ungültiger Session Token.")
    return {"message": "Token valid", "user": db_user.username, "email": db_user.email}

@app.post("/logout")
async def logout(token_data: TokenData, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.session_token == token_data.session_token).first()
    if db_user:
        db_user.session_token = None
        db.commit()
    return {"message": "Logout erfolgreich"}

@app.post("/request-password-reset")
async def request_password_reset(request: PasswordResetRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    if user:
        token = secrets.token_urlsafe(32)
        expires = datetime.utcnow() + timedelta(hours=1)
        user.reset_password_token = token
        user.reset_password_token_expires = expires
        db.commit()
        print(f"[INFO] Password reset token for {user.email}: {token}")
    return {"message": "If an account with this email exists, a password reset link has been sent."}


@app.post("/reset-password")
async def reset_password(request: PasswordReset, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.reset_password_token == request.token).first()

    if not user or user.reset_password_token_expires < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Invalid or expired password reset token.")

    hashed_pw = bcrypt.hashpw(request.new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    user.password = hashed_pw
    user.reset_password_token = None
    user.reset_password_token_expires = None
    db.commit()

    return {"message": "Password has been reset successfully."}

# Serve frontend
@app.get("/")
async def read_index():
    return FileResponse(os.path.abspath(os.path.join(os.path.dirname(__file__), '../frontend/index.html')))

app.mount("/", StaticFiles(directory=os.path.abspath(os.path.join(os.path.dirname(__file__), '../frontend'))), name="frontend")
