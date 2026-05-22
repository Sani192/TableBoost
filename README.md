# TableBoost 🚀

TableBoost is a mobile-first restaurant **Revenue Intelligence, Loyalty, and Automation Platform**. It helps restaurant teams capture customer visits in seconds, build repeat business through rewards and messaging, and turn operational data into practical growth recommendations.

The product is organized around a simple workflow: record a visit, enrich the customer profile over time, trigger the right engagement, measure the business impact, and surface the next best action for the restaurant owner.

TableBoost features a **dark / light mode toggle**, a unified **design system** with shared components, a **subscription-governed UX**, and a **mobile-first** responsive layout.

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

- Create and manage multiple rewards from the dedicated Loyalty Hub.
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

TableBoost includes configurable automation records that can be enabled, disabled, and edited from the dedicated Automations dashboard. The backend syncs these records into a scheduler so background jobs can run without manual intervention.

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

### 9. Audit Logging & Governance

TableBoost features a robust governance and audit module to ensure operational compliance and traceability.

- **User Activity Audit Trails**: Logs user activities like login success/failure, profile updates, change passwords, and visit capture.
- **Marketing & Engagement Audits**: Track campaign broadcasts, reward creation, edits, and redemptions, settings changes, and automation pilot updates.
- **Operational & Scheduler Traceability**: Logs automation background runs, scheduler event states (run success, errors, missed runs) for background jobs.
- **Strict Role-Based Filtering**: Only users with the `OWNER` role can view audit trails or access the governance dashboards.
- **Organized Storage Isolation**: Database logs are isolated under dedicated `gov_audit_logs` and `gov_operational_logs` tables.

### 10. Production Reliability & Operational Stability

A dedicated suite of production-grade safeguards protects the platform from cascading failures and provides deep operational visibility.

- **Centralized Error Governance**: Global API exception handlers normalize all backend errors into predictable frontend responses.
- **Resilient Scheduler Execution**: Background automation jobs (like SMS sending and intelligence computation) are wrapped in `@resilient_job` decorators with transaction safety (`db.rollback()`) to prevent isolated errors from crashing the global task scheduler.
- **Health Monitoring Foundations**: A dedicated `/api/health` heartbeat endpoint provides system health status for uptime monitoring tools.
- **Frontend Error Boundaries**: Global React `ErrorBoundary` catch-alls prevent the UI from white-screening during unhandled client-side render exceptions.
- **Network Deduplication**: Core data-fetching pipelines use strict parameter-based cache references to eliminate redundant API calls and optimize bandwidth.

### 11. Security Hardening & Abuse Prevention

TableBoost implements strict security controls to protect against operational abuse, unauthorized data access, and common web vulnerabilities.

- **Authentication & Session Hardening**: JWTs are embedded with a strict `token_version` validated against the database. User logouts and password changes automatically increment this version, globally and immediately invalidating all previously issued session tokens.
- **Brute-Force & Abuse Mitigation**: The authentication system includes lightweight, in-memory sliding-window rate limiters. Identical mutation requests (like duplicate visit creations or rapid SMS campaign broadcasts) are blocked by a short-lived idempotency cache to prevent spam.
- **API & Network Security**: The FastAPI backend employs a strict CORS policy limited to the frontend origin, a global rate limiter mitigating broad DoS attempts, and robust HTTP security headers (`X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`).
- **Data Validation Bounds**: Pydantic schemas enforce rigid `max_length` bounds on incoming text fields to defend against massive payload processing attacks.
- **Secure Route Guards**: The frontend employs React `useEffect` hooks to securely redirect unauthorized staff members away from restricted administrative panels automatically.

### 12. Deployment & Disaster Recovery

TableBoost is built to be resilient, recoverable, and simple to deploy in standard VPS environments without enterprise cloud orchestration.

- **Safe Migrations**: Uses Alembic for database migrations, enabling safe structural updates and clean rollbacks instead of destructive operations.
- **Startup Governance**: The application mandates secure environment variables on startup. The API will refuse to boot in `production` mode if unsafe default keys are detected.
- **Deep Health & Connectivity Backoffs**: The server implements exponential backoff to handle transient database unavailability during startup. A deep `/api/health` heartbeat performs live SQL verification and scheduler status checks.
- **Scheduler Recovery**: Background automation and intelligence generation processes are strictly idempotent. If the server crashes mid-day, the scheduler will not duplicate intelligence metrics or resend the same SMS blasts for that period.
- **Disaster Recovery Utilities**: Includes lightweight `pg_dump` based shell scripts (`scripts/backup.sh` and `scripts/restore.sh`) for rapid database backups and schema reconstruction. See the `docs/DEPLOYMENT_RUNBOOK.md` for full deployment and recovery procedures.

### 13. Dark Mode & Theme System

TableBoost includes a full dark / light mode experience with FOUC (Flash of Unstyled Content) prevention.

- **Theme Toggle**: Available in both the desktop navigation bar and the mobile bottom nav bar.
- **Persistence**: Theme preference is saved to `localStorage` and restored on page load via an inline blocking script.
- **Implementation**: Uses Tailwind's `darkMode: 'class'` strategy with the `dark` class applied to the `<html>` element.
- **Global CSS Overrides**: A comprehensive set of CSS-level dark mode rules automatically styles all light-mode-only elements (backgrounds, text, borders, shadows, form inputs, status badges, and hover states).
- **Component-level support**: Core UI components (Card, Button, Drawer, Modal, Input, Badge, Tabs, StatCard, etc.) include inline `dark:` Tailwind variants for precise control.

### 14. Design System & Shared Components

TableBoost uses a unified component library that enforces design consistency across all pages.

- **Shared UI Components**: `PageHeader`, `Skeleton`, `EmptyState`, `Badge`, `Tabs`, `FeatureGate`, `Pagination`, `ThemeToggle`, `PlanDetailsModal`.
- **Design Tokens**: CSS custom properties for surfaces (`--color-surface`, `--color-surface-raised`), ink (`--color-ink`, `--color-ink-muted`), and borders (`--color-border`, `--color-border-muted`).
- **Unified Palette**: Consistent `stone` color palette across all pages, replacing ad-hoc `slate`, `gray`, and `zinc` usage.
- **Animation System**: `tailwindcss-animate` plugin for `fade-in`, `slide-in`, `zoom-in`, and `scale-in` transitions.

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

## Subscription Tiers & Feature Gating

TableBoost incorporates a role-aware subscription plan model to gate access to premium CRM, loyalty, marketing, and intelligence features.

### 1. Subscription Tiers & Pricing
*   **Starter**: Core customer tracking and basic features.
    *   *Included Features*: `visits` (capture logs), `customers` (basic directory), `review_sms` (checkout feedback texts).
*   **Growth**: Customer retention programs and scheduled messaging campaigns.
    *   *Included Features*: `loyalty` (milestone rewards), `segments` (VIP, Healthy, New tags), `campaigns` (scheduled SMS broadcasts).
*   **Pro**: Automated workflows, churn prevention, and deep intelligence insights.
    *   *Included Features*: `automation` (birthday, anniversary, and inactivity SMS pilots), `intelligence` (analytics tab, CLV tiers, ROI trackers), `governance` (audit logging & operational governance dashboard).
*   **Enterprise**: Large scale multitenancy and priority assistance.

### 2. Multi-User Plan Inheritance
In a multi-user layout (e.g., Owner + Manager + Staff), the active subscription is attached to the workspace **OWNER**. 
*   All employee/staff accounts automatically inherit the active plan and feature-access configuration of the OWNER.
*   Upgrading the OWNER's plan database record instantly updates the capability permissions for all linked employee accounts under that venue.

### 3. Role-Based Plan Management
*   **Owner Access Only**: Only the account with the `OWNER` role is permitted to see subscription statuses, browse available plan tiers, or trigger upgrade request inquiries in the User Profile Drawer.
*   **Staff/Manager Hiding**: For accounts with the `MANAGER` or `STAFF` roles, the entire subscription card section is completely omitted from the profile drawer layout.

### 4. API & Background Job Constraints
*   **FastAPI Routing Layer**: Premium API routes verify the active plan's features. If a restricted endpoint is accessed by a user on a lower tier, the system returns a `403 Forbidden` response prompting the user to contact support at `[EMAIL_ADDRESS]` to upgrade.
*   **Background Jobs (SMS Gating)**: Background APScheduler tasks that send marketing texts or trigger automated birthday/anniversary/inactivity recovery messages check the workspace subscription first and skip delivery if the respective features (`campaigns` or `automation`) are inactive.
*   **System Calculation Exception**: Core background computations (CLV scores, churn risk predictions, daily/weekly metrics summaries) run globally for all venues regardless of subscription status. This ensures analytics are fully pre-calculated and instantly visible the moment a venue upgrades to a higher plan.

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
| `/loyalty` | Manage milestone and event-based customer rewards. |
| `/automations` | Manage auto-pilot campaigns and system operations. |
| `/settings` | Global engagement settings and review message templates. |
| `/governance` | Security, audit, and operational tracking dashboard (Owner only). |


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
| Governance | `/api/governance` | Retrieve paginated and filtered audit and operational logs (restricted to Owner). |


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
- Alembic (Database migrations)

### Frontend

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- tailwindcss-animate (transition & animation utilities)
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
│   │   ├── governance/       # Audit and operational logs management
│   │   ├── users/            # User models and schemas
│   │   └── visits/           # Visit capture and history
│   ├── tests/                # Backend unit and integration tests
│   ├── init_tables.py        # Table creation and default automation seeding
│   └── main.py               # FastAPI app setup
├── docs/                     # Product and phase architecture documents
├── frontend/
│   ├── src/app/              # Next.js app routes
│   ├── src/components/       # Reusable UI and feature components
│   │   ├── ui/               # Core design system (Button, Card, Drawer, Modal, Input, Badge, Tabs, etc.)
│   │   ├── dashboard/        # Dashboard-specific components (RecommendationCard, TrendSparkline)
│   │   ├── intelligence/     # Intelligence badges (CLVBadge, CustomerHealthBadge)
│   │   ├── Navigation.tsx    # Main navigation shell
│   │   ├── ProfileDrawer.tsx  # User profile & subscription drawer
│   │   └── PlanDetailsModal.tsx # Subscription plan details modal
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

# Production Security Configurations
ENVIRONMENT=production # Set to 'production' to enforce HTTPS-only secure JWT cookies
ALLOWED_ORIGINS=https://your-production-domain.com # Comma-separated list of allowed CORS origins
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
- Production reliability & operational stability (Error boundaries, resilient schedulers, health monitoring)

The codebase is structured to continue evolving into a broader restaurant growth optimization platform.

---

## License

This project is private and intended for internal use only.
