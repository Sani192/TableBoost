# TableBoost 🚀

TableBoost is a mobile-friendly restaurant management application designed to capture customer data, track visits, and automate review requests to increase restaurant revenue.

## 🛠 Tech Stack

- **Backend**: FastAPI (Python 3.10+), SQLAlchemy, PostgreSQL
- **Frontend**: Next.js (React), Tailwind CSS, Axios
- **Testing**: Pytest

---

## 📂 Project Structure

- `backend/`: FastAPI application containing core logic and feature modules.
- `frontend/`: Next.js application for the mobile-optimized user interface.
- `docs/`: System architecture and product specifications.

---

## 🚀 Getting Started

### Prerequisites
- Python 3.10 or higher
- Node.js & npm
- PostgreSQL server

### 1. Backend Setup

1. **Create and activate a virtual environment:**
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # Windows: .venv\Scripts\activate
   ```

2. **Install dependencies:**
   ```bash
   pip install -r backend/requirements.txt
   ```

3. **Configure Environment:**
   Create a `.env` file in the `backend/` directory:
   ```env
   DATABASE_URL=postgresql://tableboost_user:tableboost_pass@localhost:5432/tableboost
   ```

4. **Initialize Database Tables:**
   Run this command to create the initial schema:
   ```bash
   python -c "from core.database import engine, Base; from modules.customers.models import Customer; from modules.visits.models import Visit; from modules.messaging.models import Message; from modules.settings.models import Setting; from modules.loyalty.models import LoyaltyReward, LoyaltyProgress, RewardRedemption; Base.metadata.create_all(bind=engine)"
   ```

5. **Run the Backend Server:**
   ```bash
   uvicorn backend.main:app --reload
   ```
   *API Docs: http://localhost:8000/docs*

---

### 2. Frontend Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the Development Server:**
   ```bash
   npm run dev
   ```
   *Web App: http://localhost:3000*

---

## 🧪 Testing

To run the backend test suite:
```bash
pytest backend/tests
```
*Note: Tests use an in-memory SQLite database and will not affect your local PostgreSQL data.*

---

## 📄 License
This project is private and intended for internal use.