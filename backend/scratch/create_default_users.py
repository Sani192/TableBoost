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
        from modules.restaurants.models import Restaurant, RestaurantUser
        
        # Ensure default restaurant exists
        restaurant = db.query(Restaurant).filter(Restaurant.id == 1).first()
        if not restaurant:
            restaurant = Restaurant(id=1, name="Default Test Restaurant")
            db.add(restaurant)
            db.commit()
            print("Created default restaurant ID 1")

        # Check if users already exist and ensure their passwords are 'password123'
        from modules.users.service import verify_password, get_password_hash
        
        owner = db.query(User).filter(User.username == "owner").first()
        if not owner:
            owner = create_user(db, UserCreate(username="owner", password="password123", role="OWNER"))
            print("Created owner user")
        else:
            if not verify_password("password123", owner.password_hash):
                owner.password_hash = get_password_hash("password123")
                db.commit()
                print("Updated owner password to password123")
            else:
                print("Owner user already exists with correct password")
        
        manager = db.query(User).filter(User.username == "manager").first()
        if not manager:
            manager = create_user(db, UserCreate(username="manager", password="password123", role="MANAGER"))
            print("Created manager user")
        else:
            if not verify_password("password123", manager.password_hash):
                manager.password_hash = get_password_hash("password123")
                db.commit()
                print("Updated manager password to password123")
            else:
                print("Manager user already exists with correct password")
            
        staff = db.query(User).filter(User.username == "staff").first()
        if not staff:
            staff = create_user(db, UserCreate(username="staff", password="password123", role="STAFF"))
            print("Created staff user")
        else:
            if not verify_password("password123", staff.password_hash):
                staff.password_hash = get_password_hash("password123")
                db.commit()
                print("Updated staff password to password123")
            else:
                print("Staff user already exists with correct password")
            
        # Ensure they are linked to restaurant 1
        for u in [owner, manager, staff]:
            link = db.query(RestaurantUser).filter(RestaurantUser.user_id == u.id, RestaurantUser.restaurant_id == 1).first()
            if not link:
                link = RestaurantUser(restaurant_id=1, user_id=u.id)
                db.add(link)
                db.commit()
                print(f"Linked user {u.username} to restaurant 1")
            
        print("Default users check and restaurant mappings completed.")
    finally:
        db.close()

if __name__ == "__main__":
    create_defaults()
