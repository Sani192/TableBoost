import sys
import os
sys.path.append(os.path.join(os.getcwd(), "backend"))

from sqlalchemy import text
from core.database import engine

def migrate():
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE automation_configs ADD COLUMN schedule VARCHAR"))
            conn.commit()
            print("Column 'schedule' added successfully.")
        except Exception as e:
            if "already exists" in str(e).lower():
                print("Column 'schedule' already exists.")
            else:
                print(f"Error adding column: {e}")
        
        # Seed default schedules for existing types
        defaults = {
            'birthday': 'cron:17:14',
            'anniversary': 'cron:17:14',
            'inactivity': 'cron:17:14',
            'campaign_scheduler': 'interval:1'
        }
        
        for auto_type, schedule in defaults.items():
            try:
                # Check if exists
                res = conn.execute(text("SELECT id FROM automation_configs WHERE automation_type = :type"), {"type": auto_type})
                exists = res.fetchone()
                
                if exists:
                    conn.execute(text("UPDATE automation_configs SET schedule = :schedule WHERE automation_type = :type"), {"schedule": schedule, "type": auto_type})
                else:
                    if auto_type == 'campaign_scheduler':
                        conn.execute(
                            text("INSERT INTO automation_configs (automation_type, is_enabled, message_template, schedule) VALUES (:type, :enabled, :template, :schedule)"),
                            {"type": auto_type, "enabled": True, "template": "SYSTEM JOB", "schedule": schedule}
                        )
                conn.commit()
            except Exception as e:
                print(f"Error seeding {auto_type}: {e}")
                
    print("Migration and seeding completed.")

if __name__ == "__main__":
    migrate()
