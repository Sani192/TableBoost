from sqlalchemy.orm import Session
from modules.automation.models import AutomationConfig
from modules.loyalty.models import LoyaltyReward

def provision_automations_and_loyalty(db: Session, restaurant_id: int, actions_taken: list):
    # 1. Define default automation configs
    default_automations = [
        {
            "automation_type": "birthday",
            "is_enabled": True,
            "message_template": "Happy Birthday {name}! 🎂 Enjoy a free drink on us today at TableBoost!"
        },
        {
            "automation_type": "anniversary",
            "is_enabled": True,
            "message_template": "Happy Anniversary {name}! ❤️ Thanks for being with us for another year. Here is a special treat for you!"
        },
        {
            "automation_type": "inactivity",
            "is_enabled": False,
            "message_template": "Hi {name}, we haven't seen you in a while! 🍕 Come visit us this week and get 10% off your bill.",
            "settings": {"days": 30}
        },
        {
            "automation_type": "reward_unlocked",
            "is_enabled": True,
            "message_template": "Congratulations {name}! 🏆 You've just unlocked a new reward. Visit us to redeem it!"
        }
    ]

    for d in default_automations:
        config = db.query(AutomationConfig).filter(
            AutomationConfig.restaurant_id == restaurant_id,
            AutomationConfig.automation_type == d["automation_type"]
        ).first()

        if not config:
            config = AutomationConfig(restaurant_id=restaurant_id, **d)
            db.add(config)
            actions_taken.append(f"Seeded automation config: {d['automation_type']}")
        else:
            for key, value in d.items():
                setattr(config, key, value)
            actions_taken.append(f"Updated existing automation config: {d['automation_type']}")
        db.flush()

    # 2. Define default loyalty rewards
    default_rewards = [
        {
            "name": "Free Drink",
            "description": "Get a free drink on your 5th visit!",
            "required_visits": 5,
            "reward_type": "milestone",
            "is_active": True
        },
        {
            "name": "10% Discount",
            "description": "Get 10% off your bill on your 10th visit!",
            "required_visits": 10,
            "reward_type": "milestone",
            "is_active": True
        }
    ]

    for r in default_rewards:
        reward = db.query(LoyaltyReward).filter(
            LoyaltyReward.restaurant_id == restaurant_id,
            LoyaltyReward.required_visits == r["required_visits"]
        ).first()

        if not reward:
            reward = LoyaltyReward(restaurant_id=restaurant_id, **r)
            db.add(reward)
            actions_taken.append(f"Seeded loyalty reward milestone: {r['name']} ({r['required_visits']} visits)")
        else:
            for key, value in r.items():
                setattr(reward, key, value)
            actions_taken.append(f"Updated existing loyalty reward milestone: {r['name']} ({r['required_visits']} visits)")
        db.flush()
