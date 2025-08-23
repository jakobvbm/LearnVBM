from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from src.backend.user_model import Base, User
from fastapi.middleware.cors import CORSMiddleware
import bcrypt
import os

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

@app.post("/register")
async def register(user: UserRegister, db: Session = Depends(get_db)):
    # Prüfe, ob Username oder Email schon existiert
    if db.query(User).filter((User.username == user.username) | (User.email == user.email)).first():
        raise HTTPException(status_code=400, detail="Benutzername oder E-Mail existiert bereits.")
    hashed_pw = bcrypt.hashpw(user.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    db_user = User(username=user.username, email=user.email, password=hashed_pw)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    print(f"[INFO] Neuer User registriert: {db_user.username}, {db_user.email}")
    # Zeige alle User nach Registrierung
    all_users = db.query(User).all()
    print("[INFO] Alle User in der DB:")
    for u in all_users:
        print(f"  - {u.username}, {u.email}")
    return {"message": "User registered", "user": db_user.username, "email": db_user.email}

@app.post("/login")
async def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.username == user.username).first()
    if not db_user:
        print(f"[DEBUG] User not found: {user.username}")
        raise HTTPException(status_code=401, detail="Benutzername oder Passwort falsch.")
    print(f"[DEBUG] Gespeicherter Hash: {db_user.password}")
    if not bcrypt.checkpw(user.password.encode('utf-8'), db_user.password.encode('utf-8')):
        print("[DEBUG] Passwort stimmt nicht überein!")
        raise HTTPException(status_code=401, detail="Benutzername oder Passwort falsch.")
    print("[DEBUG] Login erfolgreich!")
    return {"message": "Login erfolgreich", "user": db_user.username, "email": db_user.email}

@app.post("/reset-password")
async def reset_password():
    # TODO: Implement password reset logic
    return {"message": "Password reset endpoint"}
