import sys
import os
from src.backend.user_model import Base, User
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), 'data/users.db'))
DATABASE_URL = f"sqlite:///{DB_PATH}"
print(f"[INFO] Datenbankdatei: {DB_PATH}")
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def list_users():
    db = SessionLocal()
    users = db.query(User).all()
    for user in users:
        print(f"ID: {user.id}, Username: {user.username}, Email: {user.email}")
    db.close()

def delete_user(username):
    db = SessionLocal()
    user = db.query(User).filter(User.username == username).first()
    if user:
        db.delete(user)
        db.commit()
        print(f"User '{username}' gelöscht.")
    else:
        print(f"User '{username}' nicht gefunden.")
    db.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Nutze: python manage_users.py list | delete <username>")
        sys.exit(1)
    if sys.argv[1] == "list":
        list_users()
    elif sys.argv[1] == "delete" and len(sys.argv) == 3:
        delete_user(sys.argv[2])
    else:
        print("Ungültiger Befehl.")
