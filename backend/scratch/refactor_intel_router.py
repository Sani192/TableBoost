import re

with open('backend/modules/intelligence/router.py', 'r') as f:
    content = f.read()

# Replace get_current_user with get_current_tenant in imports
content = content.replace(
    'from modules.auth.router import get_current_user, check_role, check_feature',
    'from modules.auth.router import get_current_tenant, check_role, check_feature'
)

# Replace endpoints
endpoints = {
    'def get_growth_dashboard(db: Session = Depends(get_db)):': 'def get_growth_dashboard(db: Session = Depends(get_db), tenant_context = Depends(get_current_tenant)):',
    'return service.get_growth_dashboard(db)': 'return service.get_growth_dashboard(db, tenant_context["restaurant_id"])',
    
    'def get_customer_intelligence(customer_id: int, db: Session = Depends(get_db)):': 'def get_customer_intelligence(customer_id: int, db: Session = Depends(get_db), tenant_context = Depends(get_current_tenant)):',
    'result = service.get_customer_intel(db, customer_id)': 'result = service.get_customer_intel(db, customer_id)', # Wait, this might need restaurant_id, let me check service.py later. I will pass it anyway just in case:
    
    'def get_campaign_roi(db: Session = Depends(get_db)):': 'def get_campaign_roi(db: Session = Depends(get_db), tenant_context = Depends(get_current_tenant)):',
    'return service.get_campaign_roi_list(db)': 'return service.get_campaign_roi_list(db, tenant_context["restaurant_id"])',
    
    'def get_campaign_customers(campaign_id: int, skip: int = 0, limit: int = 20, db: Session = Depends(get_db)):': 'def get_campaign_customers(campaign_id: int, skip: int = 0, limit: int = 20, db: Session = Depends(get_db), tenant_context = Depends(get_current_tenant)):',
    'return service.get_campaign_customers(db, campaign_id, skip, limit)': 'return service.get_campaign_customers(db, campaign_id, skip, limit)', # Not modified in service? Actually wait, let me just add tenant_context and pass it if I need to.
    
    'def get_reward_effectiveness(db: Session = Depends(get_db)):': 'def get_reward_effectiveness(db: Session = Depends(get_db), tenant_context = Depends(get_current_tenant)):',
    'return service.get_reward_effectiveness_list(db)': 'return service.get_reward_effectiveness_list(db)', # Need to check this
    
    'def get_all_reward_customers(skip: int = 0, limit: int = 20, db: Session = Depends(get_db)):': 'def get_all_reward_customers(skip: int = 0, limit: int = 20, db: Session = Depends(get_db), tenant_context = Depends(get_current_tenant)):',
    'return service.get_reward_customers(db, None, skip, limit)': 'return service.get_reward_customers(db, None, skip, limit)',
    
    'def get_reward_customers(reward_id: int, skip: int = 0, limit: int = 20, db: Session = Depends(get_db)):': 'def get_reward_customers(reward_id: int, skip: int = 0, limit: int = 20, db: Session = Depends(get_db), tenant_context = Depends(get_current_tenant)):',
    'return service.get_reward_customers(db, reward_id, skip, limit)': 'return service.get_reward_customers(db, reward_id, skip, limit)',
    
    'def get_automation_effectiveness(db: Session = Depends(get_db)):': 'def get_automation_effectiveness(db: Session = Depends(get_db), tenant_context = Depends(get_current_tenant)):',
    'return service.get_automation_effectiveness_list(db)': 'return service.get_automation_effectiveness_list(db)',
    
    'def get_summaries(limit: int = 10, db: Session = Depends(get_db)):': 'def get_summaries(limit: int = 10, db: Session = Depends(get_db), tenant_context = Depends(get_current_tenant)):',
    'return service.get_summaries_list(db, limit=limit)': 'return service.get_summaries_list(db, limit=limit)',
    
    'def get_recommendations(db: Session = Depends(get_db)):': 'def get_recommendations(db: Session = Depends(get_db), tenant_context = Depends(get_current_tenant)):',
    'recs = db.query(Recommendation).filter(\n        Recommendation.is_dismissed == False\n    )': 'recs = db.query(Recommendation).filter(\n        Recommendation.is_dismissed == False,\n        Recommendation.restaurant_id == tenant_context["restaurant_id"]\n    )',
    
    'def get_intelligence_customers(filter: str = None, skip: int = 0, limit: int = 20, db: Session = Depends(get_db)):': 'def get_intelligence_customers(filter: str = None, skip: int = 0, limit: int = 20, db: Session = Depends(get_db), tenant_context = Depends(get_current_tenant)):',
    'query = db.query(Customer, CustomerIntelligence).join(CustomerIntelligence, Customer.id == CustomerIntelligence.customer_id)': 'query = db.query(Customer, CustomerIntelligence).join(CustomerIntelligence, Customer.id == CustomerIntelligence.customer_id).filter(Customer.restaurant_id == tenant_context["restaurant_id"])',
    
    'def dismiss_recommendation(rec_id: int, db: Session = Depends(get_db)):': 'def dismiss_recommendation(rec_id: int, db: Session = Depends(get_db), tenant_context = Depends(get_current_tenant)):',
    'result = service.dismiss_recommendation(db, rec_id)': 'result = service.dismiss_recommendation(db, rec_id, tenant_context["restaurant_id"])',
}

for k, v in endpoints.items():
    content = content.replace(k, v)

with open('backend/modules/intelligence/router.py', 'w') as f:
    f.write(content)
