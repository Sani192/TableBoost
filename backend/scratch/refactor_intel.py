import re

with open('backend/modules/intelligence/service.py', 'r') as f:
    content = f.read()

# 1. Update function signatures
content = re.sub(r'def compute_daily_intelligence\(db: Session\):', r'def compute_daily_intelligence(db: Session, restaurant_id: int):', content)
content = re.sub(r'def compute_campaign_summaries\(db: Session\):', r'def compute_campaign_summaries(db: Session, restaurant_id: int):', content)
content = re.sub(r'def compute_reward_effectiveness\(db: Session\):', r'def compute_reward_effectiveness(db: Session, restaurant_id: int):', content)
content = re.sub(r'def compute_automation_effectiveness\(db: Session\):', r'def compute_automation_effectiveness(db: Session, restaurant_id: int):', content)
content = re.sub(r'def generate_summary\(db: Session, period_type: str\):', r'def generate_summary(db: Session, period_type: str, restaurant_id: int):', content)
content = re.sub(r'def evaluate_recommendations\(db: Session\):', r'def evaluate_recommendations(db: Session, restaurant_id: int):', content)
content = re.sub(r'def get_growth_dashboard\(db: Session\):', r'def get_growth_dashboard(db: Session, restaurant_id: int):', content)
content = re.sub(r'def get_customer_health_list\(db: Session, skip: int = 0, limit: int = 50, status: str = None\):', r'def get_customer_health_list(db: Session, restaurant_id: int, skip: int = 0, limit: int = 50, status: str = None):', content)
content = re.sub(r'def get_campaign_roi_list\(db: Session, skip: int = 0, limit: int = 20\):', r'def get_campaign_roi_list(db: Session, restaurant_id: int, skip: int = 0, limit: int = 20):', content)
content = re.sub(r'def get_recommendations\(db: Session, include_dismissed: bool = False\):', r'def get_recommendations(db: Session, restaurant_id: int, include_dismissed: bool = False):', content)
content = re.sub(r'def dismiss_recommendation\(db: Session, recommendation_id: int\):', r'def dismiss_recommendation(db: Session, recommendation_id: int, restaurant_id: int):', content)

# 2. compute_daily_intelligence filtering
content = content.replace(
    ').outerjoin(Visit).group_by(Customer.id).all()',
    ').outerjoin(Visit).filter(Customer.restaurant_id == restaurant_id).group_by(Customer.id).all()'
)
content = content.replace(
    'intel = CustomerIntelligence(customer_id=cid)',
    'intel = CustomerIntelligence(customer_id=cid, restaurant_id=restaurant_id)'
)

# 3. compute_campaign_summaries filtering
content = content.replace(
    'campaigns = db.query(Campaign).filter(Campaign.status == "completed").all()',
    'campaigns = db.query(Campaign).filter(Campaign.status == "completed", Campaign.restaurant_id == restaurant_id).all()'
)
content = content.replace(
    'Message.status == "sent",',
    'Message.restaurant_id == restaurant_id,\n                Message.status == "sent",'
)
content = content.replace(
    'summary = CampaignSummary(campaign_id=camp.id)',
    'summary = CampaignSummary(campaign_id=camp.id, restaurant_id=restaurant_id)'
)

# 4. compute_reward_effectiveness filtering
content = content.replace(
    'rewards = db.query(LoyaltyReward).all()',
    'rewards = db.query(LoyaltyReward).filter(LoyaltyReward.restaurant_id == restaurant_id).all()'
)
content = content.replace(
    'RewardRedemption.reward_id == reward.id',
    'RewardRedemption.reward_id == reward.id, RewardRedemption.restaurant_id == restaurant_id'
)
content = content.replace(
    'LoyaltyProgress.lifetime_visits >= reward.required_visits',
    'LoyaltyProgress.lifetime_visits >= reward.required_visits, LoyaltyProgress.restaurant_id == restaurant_id'
)
content = content.replace(
    'summary = RewardSummary(reward_id=reward.id)',
    'summary = RewardSummary(reward_id=reward.id, restaurant_id=restaurant_id)'
)

# 5. compute_automation_effectiveness filtering
content = content.replace(
    'CustomerIntelligence.health_status == "churn_risk"',
    'CustomerIntelligence.health_status == "churn_risk", CustomerIntelligence.restaurant_id == restaurant_id'
)
content = content.replace(
    'Visit.visited_at <= hist.sent_at + timedelta(days=14),',
    'Visit.restaurant_id == restaurant_id,\n                    Visit.visited_at <= hist.sent_at + timedelta(days=14),'
)
content = content.replace(
    'summary = AutomationSummary(\n                    automation_type=auto_type,\n                    period_month=period\n                )',
    'summary = AutomationSummary(\n                    restaurant_id=restaurant_id,\n                    automation_type=auto_type,\n                    period_month=period\n                )'
)

# 6. generate_summary filtering
content = content.replace(
    'visits_q = db.query(Visit).filter(Visit.visited_at >= start)',
    'visits_q = db.query(Visit).filter(Visit.visited_at >= start, Visit.restaurant_id == restaurant_id)'
)
content = content.replace(
    'summary = BusinessSummary(\n            period_type=period_type,\n            period_start=start,\n            period_end=end,\n            metrics=metrics,\n            trends=trends,\n            highlights=highlights\n        )',
    'summary = BusinessSummary(\n            restaurant_id=restaurant_id,\n            period_type=period_type,\n            period_start=start,\n            period_end=end,\n            metrics=metrics,\n            trends=trends,\n            highlights=highlights\n        )'
)
content = content.replace(
    'recent_summ = db.query(BusinessSummary).filter(BusinessSummary.period_type == period_type).order_by(desc(BusinessSummary.period_start)).first()',
    'recent_summ = db.query(BusinessSummary).filter(BusinessSummary.period_type == period_type, BusinessSummary.restaurant_id == restaurant_id).order_by(desc(BusinessSummary.period_start)).first()'
)

# 7. evaluate_recommendations filtering
content = content.replace(
    'rec = db.query(Recommendation).filter(Recommendation.rule_id == rule_id).first()',
    'rec = db.query(Recommendation).filter(Recommendation.rule_id == rule_id, Recommendation.restaurant_id == restaurant_id).first()'
)
content = content.replace(
    'rec = Recommendation(\n                rule_id=rule_id,\n                message=message,\n                priority=priority,\n                action_type=action_type,\n                action_params=action_params\n            )',
    'rec = Recommendation(\n                restaurant_id=restaurant_id,\n                rule_id=rule_id,\n                message=message,\n                priority=priority,\n                action_type=action_type,\n                action_params=action_params\n            )'
)

# 8. get_growth_dashboard filtering
content = content.replace(
    'db.query(CustomerIntelligence).all()',
    'db.query(CustomerIntelligence).filter(CustomerIntelligence.restaurant_id == restaurant_id).all()'
)
content = content.replace(
    'db.query(Customer).filter(Customer.created_at >= last_month).count()',
    'db.query(Customer).filter(Customer.restaurant_id == restaurant_id, Customer.created_at >= last_month).count()'
)
content = content.replace(
    'camp_sums = db.query(CampaignSummary).all()',
    'camp_sums = db.query(CampaignSummary).filter(CampaignSummary.restaurant_id == restaurant_id).all()'
)
content = content.replace(
    'rew_sums = db.query(RewardSummary).all()',
    'rew_sums = db.query(RewardSummary).filter(RewardSummary.restaurant_id == restaurant_id).all()'
)
content = content.replace(
    'db.query(AutomationSummary).all()',
    'db.query(AutomationSummary).filter(AutomationSummary.restaurant_id == restaurant_id).all()'
)

# 9. get_customer_health_list filtering
content = content.replace(
    'query = db.query(Customer, CustomerIntelligence).select_from(Customer).join(CustomerIntelligence, Customer.id == CustomerIntelligence.customer_id)',
    'query = db.query(Customer, CustomerIntelligence).select_from(Customer).join(CustomerIntelligence, Customer.id == CustomerIntelligence.customer_id).filter(Customer.restaurant_id == restaurant_id)'
)

# 10. get_campaign_roi_list filtering
content = content.replace(
    'query = db.query(Campaign, CampaignSummary).select_from(Campaign).outerjoin(CampaignSummary, Campaign.id == CampaignSummary.campaign_id)',
    'query = db.query(Campaign, CampaignSummary).select_from(Campaign).outerjoin(CampaignSummary, Campaign.id == CampaignSummary.campaign_id).filter(Campaign.restaurant_id == restaurant_id)'
)

# 11. get_recommendations filtering
content = content.replace(
    'query = db.query(Recommendation)',
    'query = db.query(Recommendation).filter(Recommendation.restaurant_id == restaurant_id)'
)

# 12. dismiss_recommendation filtering
content = content.replace(
    'rec = db.query(Recommendation).filter(Recommendation.id == recommendation_id).first()',
    'rec = db.query(Recommendation).filter(Recommendation.id == recommendation_id, Recommendation.restaurant_id == restaurant_id).first()'
)

# Final write
with open('backend/modules/intelligence/service.py', 'w') as f:
    f.write(content)
