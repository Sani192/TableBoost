import re

with open('backend/modules/automation/service.py', 'r') as f:
    content = f.read()

replacement = """        from modules.intelligence import service as intel_service
        from modules.restaurants.models import Restaurant
        
        active_restaurants = db.query(Restaurant).all()
        
        for restaurant in active_restaurants:
            restaurant_id = restaurant.id
            try:
                if job_type == 'daily_intelligence':
                    intel_service.compute_daily_intelligence(db, restaurant_id)
                    intel_service.compute_campaign_summaries(db, restaurant_id)
                    intel_service.compute_reward_effectiveness(db, restaurant_id)
                    intel_service.compute_automation_effectiveness(db, restaurant_id)
                elif job_type == 'daily_recommendations':
                    intel_service.evaluate_recommendations(db, restaurant_id)
                elif job_type == 'weekly_summary':
                    intel_service.generate_summary(db, 'weekly', restaurant_id)
                elif job_type == 'monthly_summary':
                    intel_service.generate_summary(db, 'monthly', restaurant_id)
            except Exception as e:
                logger.error(f"Error running {job_type} for restaurant {restaurant_id}: {str(e)}", exc_info=True)"""

target = """        from modules.intelligence import service as intel_service
        # For system jobs, we will iterate over ALL restaurants later inside the service if needed,
        # but intelligence metrics are now usually computed per restaurant.
        # Wait! intel_service computes intelligence globally? We must make sure intel_service is tenant-aware!
        # Actually, let's just call the service method and pass db. The service method should iterate over restaurants.
        
        if job_type == 'daily_intelligence':
            intel_service.compute_daily_intelligence(db)
            intel_service.compute_campaign_summaries(db)
            intel_service.compute_reward_effectiveness(db)
            intel_service.compute_automation_effectiveness(db)
        elif job_type == 'daily_recommendations':
            intel_service.evaluate_recommendations(db)
        elif job_type == 'weekly_summary':
            intel_service.generate_summary(db, 'weekly')
        elif job_type == 'monthly_summary':
            intel_service.generate_summary(db, 'monthly')"""

content = content.replace(target, replacement)

with open('backend/modules/automation/service.py', 'w') as f:
    f.write(content)
