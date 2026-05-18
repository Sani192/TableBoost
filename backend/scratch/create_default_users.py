import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from core.database import SessionLocal
from modules.users.service import create_user
from modules.users.schemas import UserCreate
from modules.users.models import User

def create_defaults():
    db = SessionLocal()
    try:
        # Check if users already exist
        owner = db.query(User).filter(User.username == "owner").first()
        if not owner:
            create_user(db, UserCreate(username="owner", password="password123", role="OWNER"))
            print("Created owner user")
        else:
            print("Owner user already exists")
        
        manager = db.query(User).filter(User.username == "manager").first()
        if not manager:
            create_user(db, UserCreate(username="manager", password="password123", role="MANAGER"))
            print("Created manager user")
        else:
            print("Manager user already exists")
            
        staff = db.query(User).filter(User.username == "staff").first()
        if not staff:
            create_user(db, UserCreate(username="staff", password="password123", role="STAFF"))
            print("Created staff user")
        else:
            print("Staff user already exists")
            
        print("Default users check completed.")
    finally:
        db.close()

if __name__ == "__main__":
    create_defaults()
