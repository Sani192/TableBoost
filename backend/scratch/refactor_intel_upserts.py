import re

with open('backend/modules/intelligence/service.py', 'r') as f:
    content = f.read()

content = content.replace(
    'summary = db.query(RewardSummary).filter(\n                RewardSummary.reward_id == reward.id\n            ).first()',
    'summary = db.query(RewardSummary).filter(\n                RewardSummary.reward_id == reward.id,\n                RewardSummary.restaurant_id == restaurant_id\n            ).first()'
)

content = content.replace(
    'summary = db.query(AutomationSummary).filter(\n                    AutomationSummary.automation_type == auto_type,\n                    AutomationSummary.period_month == period\n                ).first()',
    'summary = db.query(AutomationSummary).filter(\n                    AutomationSummary.automation_type == auto_type,\n                    AutomationSummary.period_month == period,\n                    AutomationSummary.restaurant_id == restaurant_id\n                ).first()'
)

with open('backend/modules/intelligence/service.py', 'w') as f:
    f.write(content)
