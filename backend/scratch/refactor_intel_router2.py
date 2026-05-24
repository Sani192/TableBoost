import re

with open('backend/modules/intelligence/router.py', 'r') as f:
    content = f.read()

endpoints = {
    'def get_customer_intelligence(customer_id: int, db: Session = Depends(get_db), tenant_context = Depends(get_current_tenant)):': 'def get_customer_intelligence(customer_id: int, db: Session = Depends(get_db), tenant_context = Depends(get_current_tenant)):',
    'result = service.get_customer_intel(db, customer_id)': 'result = service.get_customer_intel(db, customer_id, tenant_context["restaurant_id"])',
    
    'return service.get_campaign_customers(db, campaign_id, skip, limit)': 'return service.get_campaign_customers(db, campaign_id, tenant_context["restaurant_id"], skip, limit)',
    
    'def get_reward_effectiveness(db: Session = Depends(get_db), tenant_context = Depends(get_current_tenant)):': 'def get_reward_effectiveness(db: Session = Depends(get_db), tenant_context = Depends(get_current_tenant)):',
    'return service.get_reward_effectiveness_list(db)': 'return service.get_reward_effectiveness_list(db, tenant_context["restaurant_id"])',
    
    'return service.get_reward_customers(db, None, skip, limit)': 'return service.get_reward_customers(db, tenant_context["restaurant_id"], None, skip, limit)',
    
    'return service.get_reward_customers(db, reward_id, skip, limit)': 'return service.get_reward_customers(db, tenant_context["restaurant_id"], reward_id, skip, limit)',
    
    'return service.get_automation_effectiveness_list(db)': 'return service.get_automation_effectiveness_list(db, tenant_context["restaurant_id"])',
    
    'return service.get_summaries_list(db, limit=limit)': 'return service.get_summaries_list(db, tenant_context["restaurant_id"], limit=limit)',
}

for k, v in endpoints.items():
    content = content.replace(k, v)

with open('backend/modules/intelligence/router.py', 'w') as f:
    f.write(content)
