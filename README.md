# TableBoost 🚀

TableBoost is a professional, mobile-first restaurant **Revenue Intelligence & Automation Platform**. It empowers restaurant owners to capture customer data in seconds, automate personalized engagement, and gain deep financial insights into their business performance.

## 🌟 Core Functionalities

### 1. Revenue Intelligence & Analytics
- **Live Performance Tracking**: Monitor daily, weekly, and monthly revenue trends directly on your dashboard.
- **Financial Insights**: Track critical metrics like **Average Ticket Size** and **Revenue Splits** (New vs. Repeat customers).
- **Campaign ROI**: Visualize how your automated messages translate into actual return visits and revenue.

### 2. Smart Automation Engine (Auto-Pilots)
- **Set & Forget Engagement**: Enable automated SMS notifications that run in the background.
- **Personalized Celebrations**: Automatically send rewards for customer **Birthdays** and **Anniversaries**.
- **Inactivity Recovery**: Automatically reach out to "At-Risk" customers who haven't visited in 30 days to bring them back.
- **Reward Notifications**: Instantly notify customers when they unlock a new loyalty reward.

### 3. Multi-Reward Loyalty System
- **Milestone Tracking**: Create custom rewards based on lifetime visit counts (e.g., "Free Drink after 5 visits").
- **Event Rewards**: Specialized rewards for yearly events (Birthdays/Anniversaries) that reset automatically.
- **Redemption Management**: A secure flow for staff to verify and redeem rewards with a full audit trail.

### 4. Customer Management & Smart Segmentation
- **Rich Profiles**: Store customer names, phone numbers, and celebration dates in a scalable structure.
- **Intelligence Segments**: Instantly identify **VIP Customers** (top spenders) and **At-Risk** visitors who need attention.
- **Advanced Discovery**: Filter your customer base by spend, visit frequency, or upcoming celebration months.

### 5. High-Speed Operations
- **5-Second Billing**: Optimized mobile interface allowing staff to record a visit and amount in seconds.
- **Real-time Activity**: A live feed of recent visits and customer interactions.
- **Automated Review Requests**: One-click or automated SMS requests to boost your Google/Yelp ratings after a visit.

### 6. Campaigns & Messaging
- **Manual Blasts**: Send immediate announcements to your entire audience or specific segments.
- **Scheduled Campaigns**: Design campaigns today and schedule them for automatic delivery at a future date/time.

---

## 🛠 Tech Stack

- **Backend**: FastAPI (Python 3.10+), SQLAlchemy, PostgreSQL, APScheduler
- **Frontend**: Next.js 14 (React), Tailwind CSS, Lucide Icons, Recharts
- **Testing**: Pytest (Backend), React Testing Library (Frontend)

---

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL

### 1. Backend Setup
1. **Virtual Environment**:
   ```bash
   python -m venv .venv
   source .venv/bin/activate
   ```
2. **Install Dependencies**:
   ```bash
   pip install -r backend/requirements.txt
   ```
3. **Database Initialization**:
   Create your `.env` file with `DATABASE_URL` and run:
   ```bash
   python backend/init_tables.py
   ```
4. **Run Server**:
   ```bash
   uvicorn backend.main:app --reload
   ```

### 2. Frontend Setup
1. **Install & Run**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   *Web App available at http://localhost:3000*

---

## 🧪 Quality Assurance
- **Backend Tests**: `pytest backend/tests`
- **Frontend Verification**: `npm run build` (Ensures type safety and production readiness)

---

## 📄 License
This project is private and intended for internal use only.