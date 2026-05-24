import re

with open('backend/modules/intelligence/service.py', 'r') as f:
    content = f.read()

# get_customer_intel
content = content.replace(
    'def get_customer_intel(db: Session, customer_id: int):',
    'def get_customer_intel(db: Session, customer_id: int, restaurant_id: int):'
)
content = content.replace(
    'CustomerIntelligence.customer_id == customer_id',
    'CustomerIntelligence.customer_id == customer_id, CustomerIntelligence.restaurant_id == restaurant_id'
)

# get_campaign_roi_list
content = content.replace(
    'def get_campaign_roi_list(db: Session):',
    'def get_campaign_roi_list(db: Session, restaurant_id: int):'
)

# get_campaign_customers
content = content.replace(
    'def get_campaign_customers(db: Session, campaign_id: int, skip: int = 0, limit: int = 20):',
    'def get_campaign_customers(db: Session, campaign_id: int, restaurant_id: int, skip: int = 0, limit: int = 20):'
)
content = content.replace(
    'Message.campaign_id == campaign_id,',
    'Message.campaign_id == campaign_id, Message.restaurant_id == restaurant_id,'
)
content = content.replace(
    'Campaign.id == campaign_id',
    'Campaign.id == campaign_id, Campaign.restaurant_id == restaurant_id'
)

# get_reward_customers
content = content.replace(
    'def get_reward_customers(db: Session, reward_id: int = None, skip: int = 0, limit: int = 20):',
    'def get_reward_customers(db: Session, restaurant_id: int, reward_id: int = None, skip: int = 0, limit: int = 20):'
)
content = content.replace(
    'query = db.query(RewardRedemption).join(Customer)',
    'query = db.query(RewardRedemption).join(Customer).filter(RewardRedemption.restaurant_id == restaurant_id)'
)

# get_reward_effectiveness_list
content = content.replace(
    'def get_reward_effectiveness_list(db: Session):',
    'def get_reward_effectiveness_list(db: Session, restaurant_id: int):'
)
content = content.replace(
    'query = db.query(LoyaltyReward, RewardSummary).select_from(LoyaltyReward).outerjoin(RewardSummary, LoyaltyReward.id == RewardSummary.reward_id)',
    'query = db.query(LoyaltyReward, RewardSummary).select_from(LoyaltyReward).outerjoin(RewardSummary, LoyaltyReward.id == RewardSummary.reward_id).filter(LoyaltyReward.restaurant_id == restaurant_id)'
)

# get_automation_effectiveness_list
content = content.replace(
    'def get_automation_effectiveness_list(db: Session):',
    'def get_automation_effectiveness_list(db: Session, restaurant_id: int):'
)
content = content.replace(
    'return db.query(AutomationSummary)',
    'return db.query(AutomationSummary).filter(AutomationSummary.restaurant_id == restaurant_id)'
)

# get_summaries_list
content = content.replace(
    'def get_summaries_list(db: Session, limit: int = 10):',
    'def get_summaries_list(db: Session, restaurant_id: int, limit: int = 10):'
)
content = content.replace(
    'return db.query(BusinessSummary)',
    'return db.query(BusinessSummary).filter(BusinessSummary.restaurant_id == restaurant_id)'
)


with open('backend/modules/intelligence/service.py', 'w') as f:
    f.write(content)
