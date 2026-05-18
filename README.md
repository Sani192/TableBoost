# TableBoost 🚀

TableBoost is a mobile-first restaurant **Revenue Intelligence, Loyalty, and Automation Platform**. It helps restaurant teams capture customer visits in seconds, build repeat business through rewards and messaging, and turn operational data into practical growth recommendations.

The product is organized around a simple workflow: record a visit, enrich the customer profile over time, trigger the right engagement, measure the business impact, and surface the next best action for the restaurant owner.

---

## What TableBoost Offers

### 1. Fast Visit Capture

- **Mobile-first add-visit flow** for staff at checkout or the counter.
- Capture customer phone number, optional name, spend amount, birthday, anniversary, and SMS preference.
- Automatically create new customer records or attach visits to existing customers.
- Track visit timestamps, spend, and messaging status for every transaction.

### 2. Customer CRM & Segmentation

- Searchable customer directory with profile and spending history.
- Customer detail pages with visit history, loyalty progress, reward redemptions, and intelligence metrics.
- Filters for:
  - Visit count and spend ranges
  - Birthday and anniversary month
  - Customers celebrating today
  - VIP customers
  - At-risk customers
  - Customers near a reward
  - Lost or newly acquired customers

### 3. Dashboard & Revenue Analytics

- Operational dashboard for total customers, total visits, repeat customers, recent activity, and reward redemptions.
- Revenue dashboard for daily trends, weekly and monthly totals, average ticket size, repeat rate, and revenue split.
- Segment drilldowns for VIP, at-risk, near-reward, lost, new, weekly revenue, and monthly revenue cohorts.
- Campaign ROI and reward effectiveness panels for understanding which engagement programs drive return visits and revenue.

### 4. Loyalty Rewards Hub

- Create and manage multiple rewards from the settings area.
- Support for reward types such as:
  - Visit milestone rewards
  - Birthday rewards
  - Anniversary rewards
- Track per-customer lifetime visits and reward eligibility.
- Redeem eligible rewards from the customer detail page.
- Preserve redemption history for auditability and customer service.

### 5. Messaging & Campaigns

- Send campaign messages to targeted audiences, including inactive customers.
- Configure inactive-customer thresholds from the campaigns/settings flow.
- Maintain searchable message logs with type, status, and date filtering.
- Customize review-request message templates.
- Respect per-visit SMS preference when recording new visits.

### 6. Automation Pilots

TableBoost includes configurable automation records that can be enabled, disabled, and edited from the settings area. The backend syncs these records into a scheduler so background jobs can run without manual intervention.

Default automation/add-on types include:

- **Birthday** messages
- **Anniversary** messages
- **Inactivity recovery** messages
- **Reward unlocked** notifications
- **Daily intelligence** computation
- **Daily recommendations** evaluation
- **Weekly business summaries**
- **Monthly business summaries**

### 7. Growth Intelligence Add-ons

The intelligence module turns raw visits, customers, campaigns, rewards, and automations into owner-friendly insights.

Current intelligence capabilities include:

- Customer lifetime value (CLV) scoring and tiering.
- Customer health status and health score.
- Spend trend and average visit-gap analysis.
- Growth dashboard metrics.
- Campaign ROI summaries.
- Reward effectiveness summaries.
- Automation effectiveness summaries.
- Weekly and monthly business summaries.
- Lightweight recommendations that can be dismissed after review.

### 8. Authentication & Role-Based Access Control (RBAC)

TableBoost includes a production-safe authentication system with role-based access control.

- **JWT Authentication**: Secure stateless authentication using JSON Web Tokens.
- **HTTP-only Cookies**: Session tokens are stored in secure, HTTP-only cookies to prevent XSS attacks.
- **Roles**:
  - **OWNER**: Full access to all features, analytics, and settings.
  - **MANAGER**: Access to operations, analytics, and limited settings.
  - **STAFF**: Operational access only (Add Visit). Cannot access sensitive analytics or settings.

### Customer Intelligence Tags

The system uses a combination of backend calculations and frontend heuristics to tag customers:

#### CLV Tiers (Customer Lifetime Value)
*   **High CLV**: Top 20% of customers (by spend, frequency, and recency).
*   **Medium CLV**: Next 40% of customers.
*   **Low CLV**: Bottom 40% of customers.

#### Customer Health Status
*   **New**: Fewer than 3 total visits.
*   **Healthy**: Visiting regularly based on their average gap.
*   **Cooling**: Slightly overdue compared to their normal pattern.
*   **Declining**: Significantly overdue.
*   **Churn Risk**: Very overdue and at high risk of not returning.

#### Special Frontend Tags
*   **VIP**: High CLV OR 10+ visits OR >$300 total spent.
*   **NEW**: 0 or 1 visit.
*   **LOST**: Not seen in >90 days (fallback).

---

## Application Screens

| Screen | Purpose |
| --- | --- |
| `/login` | Secure login page for all roles. |
| `/` | Dashboard with operations, revenue, growth insights, recommendations, and drilldowns. |
| `/add-visit` | Fast mobile visit capture for staff. |
| `/visits` | Visit history with search, date, amount, and sorting controls. |
| `/customers` | Customer CRM with segmentation filters. |
| `/customers/[id]` | Customer profile, visit history, loyalty status, reward redemption, and intelligence. |
| `/campaigns` | Manual campaign creation for targeted audiences. |
| `/messages` | Message log review and filtering. |
| `/settings` | Engagement settings, automation pilots, and loyalty reward management. |

---

## Backend API Overview

The FastAPI backend exposes modular APIs under `/api`:

| Module | Prefix | Capabilities |
| --- | --- | --- |
| Auth | `/api/auth` | Login, logout, and session verification. |
| Visits | `/api/visits` | Create visits and list/filter visit history. |
| Customers | `/api/customers` | List, filter, update, and inspect customer profiles and visits. |
| Dashboard | `/api/dashboard` | Aggregate operational, revenue, segment, celebration, and recent-visit metrics. |
| Messaging | `/api/messages` | List message logs and create campaign sends. |
| Settings | `/api/settings` | Read and update engagement settings. |
| Loyalty | `/api/loyalty` | Manage rewards, calculate customer reward status, redeem rewards, and view redemption history. |
| Automation | `/api/automation` | Read/update automation configs and resync scheduled jobs. |
| Intelligence | `/api/intelligence` | Growth dashboard, customer intelligence, campaign ROI, reward effectiveness, automation summaries, business summaries, and recommendations. |

---

## Tech Stack

### Backend

- Python 3.10+
- FastAPI
- SQLAlchemy
- PostgreSQL
- Pydantic v2
- APScheduler
- Uvicorn
- Pytest
- Passlib & Bcrypt (Password hashing)
- Python-Jose (JWT)

### Frontend

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Lucide React icons
- Jest
- React Testing Library

---

## Project Structure

```text
TableBoost/
├── backend/
│   ├── api/                  # Shared API dependencies
│   ├── core/                 # Config, database, scheduler
│   ├── modules/
│   │   ├── auth/             # JWT handling and auth routes
│   │   ├── automation/       # Automation configs, history, scheduler integration
│   │   ├── customers/        # Customer CRM and profile logic
│   │   ├── dashboard/        # Dashboard aggregation
│   │   ├── intelligence/     # CLV, health, summaries, recommendations, ROI
│   │   ├── loyalty/          # Rewards, progress, redemptions
│   │   ├── messaging/        # Message logs and campaigns
│   │   ├── settings/         # Engagement settings
│   │   ├── users/            # User models and schemas
│   │   └── visits/           # Visit capture and history
│   ├── tests/                # Backend unit and integration tests
│   ├── init_tables.py        # Table creation and default automation seeding
│   └── main.py               # FastAPI app setup
├── docs/                     # Product and phase architecture documents
├── frontend/
│   ├── src/app/              # Next.js app routes
│   ├── src/components/       # Reusable UI and feature components
│   ├── src/context/          # React Context (Auth)
│   ├── src/lib/api.ts        # Frontend API client and response types
│   └── __tests__/            # Frontend tests
└── README.md
```

---

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL

### 1. Backend Setup

Create and activate a virtual environment:

```bash
python -m venv .venv
source .venv/bin/activate
```

Install backend dependencies:

```bash
pip install -r backend/requirements.txt
```

Create `backend/.env` with your PostgreSQL connection string:

```bash
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DB_NAME
```

Initialize database tables and seed default automation configs:

```bash
python backend/init_tables.py
```

Run the API server:

```bash
uvicorn backend.main:app --reload
```

The backend runs at `http://localhost:8000` by default.

### 2. Frontend Setup

Install frontend dependencies:

```bash
cd frontend
npm install
```

Optionally configure the API base URL:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

Run the development server:

```bash
npm run dev
```

The frontend runs at `http://localhost:3000` by default.

---

## Testing & Quality Checks

### Backend

```bash
pytest backend/tests
```

### Frontend

```bash
cd frontend
npm test
npm run build
```

### Useful lightweight check

```bash
git diff --check
```

---

## Configuration Notes

- The backend reads `DATABASE_URL` from `backend/.env`.
- The frontend API client uses `NEXT_PUBLIC_API_BASE_URL` and falls back to `http://localhost:8000`.
- CORS is currently open in the FastAPI app for development convenience; restrict allowed origins before production deployment.
- The scheduler starts with the FastAPI app and syncs automation jobs from database configuration.

---

## Product Status

TableBoost currently includes the major building blocks for:

- Restaurant customer capture
- Visit history
- Review/request messaging
- Campaign messaging
- Loyalty rewards
- Automation pilots
- Revenue analytics
- Customer intelligence
- Growth recommendations

The codebase is structured to continue evolving into a broader restaurant growth optimization platform.

---

## License

This project is private and intended for internal use only.
