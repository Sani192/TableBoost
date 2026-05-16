from sqlalchemy import text
from core.database import engine

def add_indexes():
    with engine.connect() as conn:
        try:
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_auto_sum_type ON automation_summaries (automation_type)"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_auto_sum_month ON automation_summaries (period_month)"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_bus_sum_type ON business_summaries (period_type)"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_rec_dismissed ON recommendations (is_dismissed)"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_rec_priority ON recommendations (priority)"))
            conn.commit()
            print("Indexes added successfully.")
        except Exception as e:
            print(f"Error adding indexes: {e}")

if __name__ == "__main__":
    add_indexes()
