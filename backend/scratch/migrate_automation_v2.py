import sqlite3
import os

DB_PATH = "backend/tableboost.db"

def migrate():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # Add schedule column if it doesn't exist
        cursor.execute("ALTER TABLE automation_configs ADD COLUMN schedule TEXT")
        print("Column 'schedule' added successfully.")
    except sqlite3.OperationalError:
        print("Column 'schedule' already exists.")
        
    # Seed default schedules for existing types
    defaults = {
        'birthday': 'cron:17:14',
        'anniversary': 'cron:17:14',
        'inactivity': 'cron:17:14',
        'campaign_scheduler': 'interval:1'
    }
    
    for auto_type, schedule in defaults.items():
        # Check if exists
        cursor.execute("SELECT id FROM automation_configs WHERE automation_type = ?", (auto_type,))
        exists = cursor.fetchone()
        
        if exists:
            cursor.execute("UPDATE automation_configs SET schedule = ? WHERE automation_type = ?", (schedule, auto_type))
        else:
            # For campaign_scheduler we might need to insert if missing
            if auto_type == 'campaign_scheduler':
                cursor.execute(
                    "INSERT INTO automation_configs (automation_type, is_enabled, message_template, schedule) VALUES (?, ?, ?, ?)",
                    (auto_type, True, "SYSTEM JOB", schedule)
                )
    
    conn.commit()
    conn.close()
    print("Migration and seeding completed.")

if __name__ == "__main__":
    migrate()
