from sqlalchemy.orm import Session
from modules.users.models import User
from modules.restaurants.models import RestaurantUser
from modules.users.service import get_password_hash

def provision_users_and_rbac(
    db: Session, 
    restaurant_id: int, 
    owner_username: str, 
    password: str, 
    actions_taken: list
) -> tuple[User, User, User]:
    # 1. Define the 3 usernames
    usernames = {
        "OWNER": owner_username.strip(),
        "MANAGER": f"{owner_username.strip()}_manager",
        "STAFF": f"{owner_username.strip()}_staff"
    }

    # 2. Check for duplicate usernames globally or handle reuse
    created_users = {}
    for role, username in usernames.items():
        existing_user = db.query(User).filter(User.username == username).first()
        if existing_user:
            # Check if this user is already linked to the current restaurant
            link = db.query(RestaurantUser).filter(
                RestaurantUser.restaurant_id == restaurant_id,
                RestaurantUser.user_id == existing_user.id
            ).first()
            if not link:
                raise ValueError(f"Username '{username}' already exists and is associated with another restaurant.")
            
            created_users[role] = existing_user
            actions_taken.append(f"Reused existing {role} user: {username}")
        else:
            # 3. Hash the password and create user
            password_hash = get_password_hash(password)
            user = User(
                username=username,
                password_hash=password_hash,
                role=role,
                is_active=True
            )
            db.add(user)
            db.flush() # Populate user.id

            # Link to restaurant
            link = RestaurantUser(
                restaurant_id=restaurant_id,
                user_id=user.id
            )
            db.add(link)
            db.flush()

            created_users[role] = user
            actions_taken.append(f"Created {role} user: {username} and linked to restaurant ID {restaurant_id}")

    return created_users["OWNER"], created_users["MANAGER"], created_users["STAFF"]
