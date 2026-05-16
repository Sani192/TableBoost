# Phase 5 Architecture: Restaurant Growth Optimization Platform

Version: 1.0

---

## 1. Phase 5 Objective

Phase 5 transforms TableBoost from a **Revenue Intelligence Platform** into a **Restaurant Growth Optimization Platform**.

### Business Evolution

TableBoost has matured through operational tracking (Phase 1), customer engagement (Phase 2), loyalty retention (Phase 3), and revenue intelligence with automation (Phase 4). Phase 5 closes the final gap: **actionable growth intelligence** — giving restaurant owners the insights to grow revenue, reduce churn, optimize campaigns, and maximize loyalty ROI, all without enterprise BI complexity.

### Platform Evolution

| Phase | Identity |
|-------|----------|
| Phase 1 | Operational Tracking Tool |
| Phase 2 | Customer Engagement Platform |
| Phase 3 | Customer Retention & Loyalty Platform |
| Phase 4 | Revenue Intelligence & Automation Platform |
| **Phase 5** | **Restaurant Growth Optimization Platform** |

### Operational Goals

1. Help owners understand **which customers matter most** (CLV)
2. Surface **declining customers before they churn** (Health Scoring)
3. Prove **campaign and automation ROI** with attribution
4. Show **reward effectiveness** on repeat behavior
5. Deliver **weekly/monthly business summaries** automatically
6. Provide **lightweight, explainable recommendations** — no AI black boxes

---

## 2. Core Phase 5 Principles

### 2.1 Actionable Intelligence Philosophy
Every metric, chart, and insight must answer a business question a restaurant owner would ask. If a metric doesn't lead to an action, it doesn't belong. Examples:
- "Which customers are worth the most?" → CLV ranking
- "Who is about to stop coming?" → Health score alerts
- "Did that campaign actually work?" → Campaign ROI

### 2.2 Operational Simplicity Philosophy
Restaurant staff are non-technical. All intelligence must be:
- **Glanceable** — key numbers visible in < 2 seconds
- **One-tap actionable** — drill down with a single click
- **Jargon-free** — "Healthy", "Declining", "At Risk" instead of statistical terms

### 2.3 Lightweight Analytics Philosophy
- Use **existing data** (visits, spend, messages, redemptions) — no new data collection burden
- Use **simple formulas** — weighted averages, thresholds, date math — no ML models
- Use **scheduled pre-aggregation** where needed — no real-time heavy computation
- All logic must be **explainable in one sentence**

### 2.4 Mobile-First Philosophy
- All new dashboards must work on iPhone screens
- Cards > tables for mobile layouts
- Summaries > detailed reports
- Progressive disclosure: summary → detail → action

---

## 3. Customer Lifetime Intelligence Architecture

### 3.1 Overview
Customer Lifetime Value (CLV) provides visibility into which customers generate the most revenue. This uses existing `visits.amount` and `visits.visited_at` data.

### 3.2 CLV Calculation Model

```
CLV Score = total_spent × visit_frequency_factor × recency_factor
```

Where:
- `total_spent` = SUM(visits.amount) for customer
- `visit_frequency_factor` = total_visits / months_since_first_visit (normalized)
- `recency_factor` = decay multiplier based on days since last visit:
  - Last 7 days: 1.0
  - 8–30 days: 0.8
  - 31–60 days: 0.5
  - 61–90 days: 0.3
  - 90+ days: 0.1

### 3.3 Aggregation Strategy
- **Scheduled computation**: CLV scores are recalculated via the existing APScheduler (daily at 2:00 AM)
- Stored in a new `customer_intelligence` summary table (one row per customer)
- Dashboard reads pre-computed values — zero runtime aggregation cost

### 3.4 Operational Usage
- Customer list sortable/filterable by CLV tier (High / Medium / Low)
- Customer detail page shows CLV score and spend trend sparkline
- VIP segment enhanced with CLV ranking (replaces pure spend-based top 10%)

### 3.5 Integration with Current Code
- Extends `modules/analytics/service.py` with `compute_clv_scores()` function
- Reads from existing `Visit` model — no schema changes to visits
- Customer detail endpoint (`/api/customers/{id}`) enriched with CLV data from summary table

---

## 4. Customer Health Intelligence Architecture

### 4.1 Overview
Customer Health scoring identifies customers who are healthy, declining, or at churn risk using **lightweight, explainable logic** based on visit patterns.

### 4.2 Health Score Model

Health is determined by comparing a customer's **recent behavior** to their **historical baseline**:

```
health_status = f(visit_gap_trend, spend_trend, recency)
```

**Scoring Rules** (deterministic, threshold-based):

| Status | Criteria | Color |
|--------|----------|-------|
| **Healthy** | Visited within expected frequency AND spend stable or growing | 🟢 Green |
| **Cooling** | Visit gap increased 1.5x vs historical average | 🟡 Yellow |
| **Declining** | Visit gap increased 2x+ OR spend dropped 30%+ from baseline | 🟠 Orange |
| **Churn Risk** | No visit in 45+ days (for customers who averaged < 30-day gaps) | 🔴 Red |

**Expected visit frequency** = average days between visits (computed from visit history).

### 4.3 High-Value At-Risk Detection
Combines CLV tier with health status:
- Customer is **High-Value At-Risk** if: CLV tier = High AND health_status IN (Declining, Churn Risk)
- These customers surface as priority alerts on the dashboard

### 4.4 Implementation Strategy
- Health scores computed alongside CLV in the same daily scheduled job
- Stored in `customer_intelligence` table: `health_status`, `health_score`, `expected_visit_gap_days`
- Health status visible on customer list and customer detail pages
- New segment filter: `is_declining`, `is_churn_risk`

### 4.5 Why This Approach
- **Explainable**: "This customer used to visit every 10 days but hasn't been in 25 days"
- **No ML needed**: Pure date math and threshold comparison
- **Actionable**: Declining customers can be targeted with campaigns immediately

---

## 5. Campaign ROI Architecture

### 5.1 Current State
Phase 4 already implements basic campaign ROI in `analytics/service.py`:
- Tracks messages sent (campaign + automation types)
- Joins `Message` → `Visit` within 7-day attribution window
- Returns conversion rate and attributed revenue

### 5.2 Phase 5 Evolution
Evolve the existing `campaign_roi` logic with **per-campaign tracking** and **clearer attribution**.

### 5.3 Attribution Model

```
Attribution Window: 7 days after message sent
Attribution Logic:
  - Customer received message at time T
  - Customer visited at time T + N (where N ≤ 7 days)
  - Visit.amount attributed to that message/campaign
  - If multiple messages sent, credit goes to MOST RECENT message (last-touch)
```

**Why last-touch**: Simple, explainable, avoids double-counting. Restaurant owners understand "they came back after we texted them."

### 5.4 Per-Campaign ROI
Extend the existing `Campaign` model to track:
- `total_sent` — count of messages sent
- `total_converted` — count of recipients who visited within window
- `total_revenue_attributed` — sum of visit amounts within window
- `conversion_rate` — converted / sent × 100
- `cost_per_conversion` — if SMS costs are tracked (future extension point)

### 5.5 Implementation Strategy
- New function `compute_campaign_roi_summary()` in `analytics/service.py`
- Runs as part of daily scheduled aggregation
- Results stored in new `campaign_summaries` table (one row per campaign)
- Dashboard Campaign ROI card enhanced with trend indicator (↑/↓ vs previous period)

### 5.6 API Evolution
- `GET /api/analytics/campaign-roi` — returns per-campaign ROI list
- Existing dashboard endpoint enriched with campaign ROI trends

---

## 6. Reward Effectiveness Analytics Architecture

### 6.1 Overview
Measures whether loyalty rewards actually drive repeat visits and increased spending.

### 6.2 Effectiveness Metrics

| Metric | Calculation | Source |
|--------|-------------|--------|
| **Redemption Rate** | redeemed_count / eligible_count × 100 | `reward_redemptions`, `loyalty_progress` |
| **Post-Reward Revisit Rate** | % of customers who visit within 30 days after redemption | `reward_redemptions` JOIN `visits` |
| **Reward-Influenced Revenue** | SUM(visit.amount) within 30 days after redemption | `reward_redemptions` JOIN `visits` |
| **Avg Visits to Redemption** | AVG(visits_threshold) across redemptions | `reward_redemptions` |

### 6.3 Aggregation Model
- Computed in daily scheduled job alongside CLV/Health
- Stored in new `reward_summaries` table (one row per reward)
- Lightweight: queries only `reward_redemptions` + `visits` tables

### 6.4 Operational Insights
- Settings page Loyalty section shows per-reward effectiveness stats
- Dashboard shows "Loyalty Impact" card: total reward-influenced revenue and revisit rate
- Enables data-driven reward configuration: "Our Free Drink reward drives 80% revisits, but the Dessert reward only drives 40%"

### 6.5 Integration
- Extends `modules/analytics/service.py` with `compute_reward_effectiveness()` 
- Reads existing `RewardRedemption`, `Visit` models — no schema changes to core tables

---

## 7. Automation Effectiveness Architecture

### 7.1 Current State
The automation engine (`modules/automation/`) tracks:
- `AutomationConfig` — enabled/disabled status, message templates, schedules
- `AutomationHistory` — which customer received which automation and when
- Messages logged in `messages` table with `type='automation'`

### 7.2 Phase 5 Evolution: Automation ROI

Track effectiveness per automation type using the same attribution model as campaigns:

| Metric | Calculation |
|--------|-------------|
| **Messages Sent** | COUNT from `messages` WHERE type='automation' grouped by automation_type |
| **Revisit Rate** | % of automation recipients who visited within 7 days |
| **Revenue Attributed** | SUM(visit.amount) within 7-day window after automation message |
| **Best Performing** | Automation type with highest revisit rate |

### 7.3 Integration with Current Engine
- No changes to `automation/service.py` execution logic
- New analytics function `compute_automation_effectiveness()` in `analytics/service.py`
- Joins `AutomationHistory` → `messages` → `visits` using customer_id and time windows
- Results stored in `automation_summaries` table (one row per automation_type per month)

### 7.4 Dashboard Integration
- Automation Engine card on Intelligence tab shows per-pilot effectiveness
- "Birthday SMS: 45% revisit rate, $1,200 attributed revenue (30d)"
- Settings page automation section enhanced with effectiveness stats per pilot

---

## 8. Business Health Dashboard Evolution

### 8.1 Current Dashboard Structure
The dashboard has two tabs:
- **Operations**: Core metrics (customers, visits, repeat rate, redeemed) + recent activity
- **Intelligence**: Revenue KPIs, segments, revenue trends chart, Campaign ROI, automation/segments cards

### 8.2 Phase 5 Dashboard Evolution
Add a third tab: **Growth** — focused on business health trends and actionable insights.

```
Tab Layout:
[Operations] [Intelligence] [Growth ← NEW]
```

### 8.3 Growth Tab Content

#### Row 1: Health Summary Cards (2×2 grid)
| Card | Value | Source |
|------|-------|--------|
| Healthy Customers | count + % | `customer_intelligence` |
| Declining Customers | count + trend ↑↓ | `customer_intelligence` |
| Churn Risk | count + high-value alert | `customer_intelligence` |
| Customer Growth | net new this month | `customers.created_at` |

#### Row 2: Trend Sparklines (2 columns)
- **Retention Trend**: Weekly active customer count over last 8 weeks (sparkline)
- **Revenue Trend**: Weekly revenue over last 8 weeks (sparkline)

#### Row 3: Growth Insights Cards
- **Loyalty Impact**: Reward-influenced revenue + revisit rate
- **Campaign Performance**: Best performing campaign + overall conversion rate
- **Automation ROI**: Top performing automation pilot

#### Row 4: Recommendations (lightweight, rule-based)
- Action cards based on recommendation engine (Section 10)

### 8.4 Design Constraints
- Maximum 4 cards per row on mobile (2×2 grid)
- All values are pre-computed — dashboard load remains < 200ms
- No complex charts — sparklines and trend indicators only
- Every card is drillable (opens existing Drawer component)

---

## 9. Weekly/Monthly Summary Architecture

### 9.1 Overview
Automated business summaries generated on schedule, stored for historical reference, and displayed in a summary view.

### 9.2 Summary Types

#### Weekly Summary (generated every Monday at 3:00 AM)
```json
{
  "period": "weekly",
  "week_start": "2026-05-11",
  "week_end": "2026-05-17",
  "metrics": {
    "total_visits": 142,
    "total_revenue": 4250.00,
    "new_customers": 12,
    "repeat_visits": 98,
    "avg_ticket": 29.93,
    "rewards_redeemed": 5,
    "campaigns_sent": 2,
    "campaign_conversions": 8,
    "healthy_customers": 180,
    "declining_customers": 15,
    "churn_risk_customers": 8
  },
  "trends": {
    "revenue_vs_prev_week": "+12.5%",
    "visits_vs_prev_week": "+8.2%",
    "new_customers_vs_prev_week": "-2"
  },
  "highlights": [
    "Revenue up 12.5% from last week",
    "8 customers at churn risk — consider recovery campaign",
    "Birthday automation drove 6 revisits"
  ]
}
```

#### Monthly Summary (generated 1st of each month at 3:00 AM)
Same structure, expanded with:
- Month-over-month comparisons
- Top 5 customers by CLV
- Best/worst performing campaign
- Loyalty program effectiveness snapshot

### 9.3 Summary Generation Strategy
- Scheduled via existing APScheduler (add two new cron jobs)
- `generate_weekly_summary()` and `generate_monthly_summary()` in new `modules/summaries/service.py`
- Queries pre-computed tables (`customer_intelligence`, `campaign_summaries`, `reward_summaries`, `automation_summaries`) — minimal DB load
- Stored in `business_summaries` table

### 9.4 Frontend Integration
- New "Summaries" section accessible from Growth tab
- Card-based layout showing latest weekly + monthly summary
- Historical summaries browsable (paginated list)

---

## 10. Lightweight Recommendation Architecture

### 10.1 Philosophy
Recommendations are **rule-based, deterministic, and explainable**. No AI, no ML, no prediction models. Each recommendation is a simple IF-THEN rule evaluated against pre-computed data.

### 10.2 Recommendation Rules

| Rule ID | Condition | Recommendation | Priority |
|---------|-----------|---------------|----------|
| R1 | High-value customers (CLV=High) with health=Declining | "3 VIP customers are declining — send a personal recovery message" | 🔴 High |
| R2 | Churn risk count increased week-over-week | "Churn risk customers increased by {N} — review inactivity automation" | 🔴 High |
| R3 | Campaign conversion rate > 20% | "Your '{campaign_name}' campaign is performing well — consider expanding audience" | 🟢 Positive |
| R4 | Reward redemption rate < 30% | "Only {N}% of eligible customers redeem rewards — consider lowering thresholds" | 🟡 Medium |
| R5 | Automation revisit rate dropped vs last month | "Birthday automation effectiveness dropped — review message template" | 🟡 Medium |
| R6 | Net new customers declining for 3+ weeks | "Customer acquisition is slowing — consider a new campaign" | 🟡 Medium |
| R7 | No active campaigns in 14+ days | "You haven't sent a campaign in 2 weeks — engagement may drop" | 🟡 Medium |

### 10.3 Generation Strategy
- Evaluated during daily scheduled job
- Stored in `recommendations` table with: `rule_id`, `message`, `priority`, `is_dismissed`, `created_at`
- Max 5 active recommendations at any time (oldest auto-dismissed)
- Staff can dismiss recommendations with one tap

### 10.4 Frontend Integration
- Displayed as action cards on Growth tab
- Priority-colored left border (red/yellow/green)
- Each card has: icon, message, action button ("View Customers" / "Create Campaign" / "Review Settings")
- Dismissible with swipe or X button

### 10.5 Why This Approach
- **No AI complexity**: Rules are simple conditionals
- **Fully explainable**: Every recommendation says exactly WHY
- **Actionable**: Every recommendation links to a specific action
- **Low maintenance**: Rules are hardcoded — no training data, no model drift

---

## 11. Analytics Aggregation Strategy

### 11.1 Realtime vs Scheduled

| Data Category | Strategy | Rationale |
|---------------|----------|-----------|
| Core dashboard (customers, visits, repeat) | **Realtime** | Already fast via indexed COUNT queries in `dashboard/service.py` |
| Revenue KPIs (weekly/monthly/avg ticket) | **Realtime** | Existing aggregation in `analytics/service.py` performs well at current scale |
| Customer segments (VIP, at-risk, etc.) | **Realtime** | Existing subquery approach in `analytics/service.py` with proper indexes |
| CLV scores | **Scheduled** (daily 2:00 AM) | Requires multi-table scan across all customers — too heavy for per-request |
| Health scores | **Scheduled** (daily 2:00 AM) | Same batch as CLV — computed together |
| Campaign ROI summaries | **Scheduled** (daily 2:00 AM) | Per-campaign attribution requires window joins |
| Reward effectiveness | **Scheduled** (daily 2:00 AM) | Post-redemption analysis benefits from batch |
| Automation effectiveness | **Scheduled** (daily 2:00 AM) | Aggregated monthly stats |
| Business summaries | **Scheduled** (weekly/monthly) | Point-in-time snapshots |
| Recommendations | **Scheduled** (daily 6:00 AM) | Evaluated after all metrics are fresh |

### 11.2 Pre-Computation Pipeline

All scheduled jobs run via the existing APScheduler in `core/scheduler.py`:

```
02:00 AM — compute_daily_intelligence()
  ├── compute_clv_scores()        → customer_intelligence table
  ├── compute_health_scores()     → customer_intelligence table
  ├── compute_campaign_summaries()→ campaign_summaries table
  ├── compute_reward_effectiveness() → reward_summaries table
  └── compute_automation_effectiveness() → automation_summaries table

06:00 AM — generate_recommendations()
  └── evaluate_rules()            → recommendations table

Monday 03:00 AM — generate_weekly_summary()
  └── aggregate_and_store()       → business_summaries table

1st of Month 03:00 AM — generate_monthly_summary()
  └── aggregate_and_store()       → business_summaries table
```

### 11.3 Performance Optimization Approach
- All pre-computed tables are **small** (one row per customer for intelligence, one per campaign, one per reward)
- Dashboard reads from summary tables — constant-time lookups, no aggregation at request time
- Existing realtime queries (Phase 4) remain unchanged — already optimized with subqueries and indexes
- Scheduled jobs run during off-hours — zero impact on daytime operations

---

## 12. Database Evolution Strategy

### 12.1 Principle: Minimal Schema Evolution
Phase 5 adds **summary/cache tables only** — no changes to existing core tables (`customers`, `visits`, `messages`, `campaigns`, `loyalty_rewards`, `loyalty_progress`, `reward_redemptions`, `automation_configs`, `automation_history`, `settings`, `customer_profiles`).

### 12.2 New Tables

#### `customer_intelligence`
Pre-computed customer analytics. One row per customer, updated daily.

```sql
CREATE TABLE customer_intelligence (
    customer_id INTEGER PRIMARY KEY REFERENCES customers(id),
    clv_score REAL DEFAULT 0,
    clv_tier VARCHAR(10) DEFAULT 'low',       -- 'high', 'medium', 'low'
    total_spent REAL DEFAULT 0,
    visit_count INTEGER DEFAULT 0,
    avg_visit_gap_days REAL,                   -- historical average
    last_visit_at TIMESTAMP,
    health_status VARCHAR(15) DEFAULT 'new',   -- 'healthy', 'cooling', 'declining', 'churn_risk', 'new'
    health_score INTEGER DEFAULT 100,          -- 0-100
    spend_trend VARCHAR(10),                   -- 'growing', 'stable', 'declining'
    computed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### `campaign_summaries`
Per-campaign ROI metrics. One row per campaign, updated daily.

```sql
CREATE TABLE campaign_summaries (
    campaign_id INTEGER PRIMARY KEY REFERENCES campaigns(id),
    total_sent INTEGER DEFAULT 0,
    total_converted INTEGER DEFAULT 0,
    conversion_rate REAL DEFAULT 0,
    revenue_attributed REAL DEFAULT 0,
    computed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### `reward_summaries`
Per-reward effectiveness. One row per reward, updated daily.

```sql
CREATE TABLE reward_summaries (
    reward_id INTEGER PRIMARY KEY REFERENCES loyalty_rewards(id),
    total_redeemed INTEGER DEFAULT 0,
    eligible_count INTEGER DEFAULT 0,
    redemption_rate REAL DEFAULT 0,
    post_reward_revisit_rate REAL DEFAULT 0,
    reward_influenced_revenue REAL DEFAULT 0,
    computed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### `automation_summaries`
Per-automation-type effectiveness. One row per type per month.

```sql
CREATE TABLE automation_summaries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    automation_type VARCHAR(50) NOT NULL,
    period_month VARCHAR(7) NOT NULL,          -- '2026-05'
    messages_sent INTEGER DEFAULT 0,
    revisit_count INTEGER DEFAULT 0,
    revisit_rate REAL DEFAULT 0,
    revenue_attributed REAL DEFAULT 0,
    computed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(automation_type, period_month)
);
```

#### `business_summaries`
Weekly/monthly snapshots. One row per period.

```sql
CREATE TABLE business_summaries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    period_type VARCHAR(10) NOT NULL,          -- 'weekly', 'monthly'
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    metrics JSON NOT NULL,
    trends JSON,
    highlights JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(period_type, period_start)
);
```

#### `recommendations`
Active recommendation cards. Max ~10 rows at any time.

```sql
CREATE TABLE recommendations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rule_id VARCHAR(10) NOT NULL,
    message TEXT NOT NULL,
    priority VARCHAR(10) NOT NULL,             -- 'high', 'medium', 'positive'
    action_type VARCHAR(30),                   -- 'view_customers', 'create_campaign', 'review_settings'
    action_params JSON,
    is_dismissed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 12.3 Indexing Strategy
- `customer_intelligence.clv_tier` — index for segment filtering
- `customer_intelligence.health_status` — index for health-based queries
- `automation_summaries(automation_type, period_month)` — unique composite
- `business_summaries(period_type, period_start)` — unique composite
- `recommendations.is_dismissed` — for active recommendations query

### 12.4 Migration Safety
- All new tables are **additive** — zero risk to existing data
- New tables populated by scheduled jobs — no migration of historical data needed
- If a summary table is empty, UI shows "Computing..." placeholder
- All new tables use same SQLAlchemy Base from `core/database.py`

---

## 13. Backend Evolution Strategy

### 13.1 New Module: `modules/intelligence/`

```
modules/intelligence/
├── __init__.py
├── models.py          # CustomerIntelligence, CampaignSummary, RewardSummary,
│                      # AutomationSummary, BusinessSummary, Recommendation models
├── service.py         # CLV computation, health scoring, recommendation engine
├── router.py          # /api/intelligence/* endpoints
└── scheduler_jobs.py  # All scheduled computation functions
```

### 13.2 Service Functions

```python
# intelligence/service.py

def compute_clv_scores(db: Session) -> int:
    """Recompute CLV for all customers. Returns count updated."""

def compute_health_scores(db: Session) -> int:
    """Recompute health status for all customers. Returns count updated."""

def compute_campaign_summaries(db: Session) -> int:
    """Recompute per-campaign ROI. Returns count updated."""

def compute_reward_effectiveness(db: Session) -> int:
    """Recompute per-reward effectiveness. Returns count updated."""

def compute_automation_effectiveness(db: Session) -> int:
    """Recompute per-automation-type stats for current month."""

def generate_weekly_summary(db: Session) -> dict:
    """Generate and store weekly business summary."""

def generate_monthly_summary(db: Session) -> dict:
    """Generate and store monthly business summary."""

def evaluate_recommendations(db: Session) -> list:
    """Run all recommendation rules, store active recommendations."""

def get_customer_intelligence(db: Session, customer_id: int) -> dict:
    """Retrieve pre-computed intelligence for a customer."""

def get_growth_dashboard(db: Session) -> dict:
    """Aggregate growth metrics from all summary tables."""
```

### 13.3 API Endpoints

```
GET  /api/intelligence/growth          → Growth dashboard data
GET  /api/intelligence/customer/{id}   → Customer CLV + health detail
GET  /api/intelligence/campaigns       → Per-campaign ROI list
GET  /api/intelligence/rewards         → Per-reward effectiveness
GET  /api/intelligence/automations     → Per-automation effectiveness
GET  /api/intelligence/summaries       → Business summaries list
GET  /api/intelligence/recommendations → Active recommendations
POST /api/intelligence/recommendations/{id}/dismiss → Dismiss recommendation
```

### 13.4 Integration with Existing Modules

| Existing Module | Phase 5 Integration |
|-----------------|---------------------|
| `analytics/service.py` | Remains as-is for realtime KPIs; new intelligence module handles pre-computed |
| `dashboard/service.py` | Enriched to include growth summary counts from `customer_intelligence` |
| `customers/service.py` | Customer list/detail enriched with CLV tier and health status |
| `automation/service.py` | No changes — intelligence module reads automation data passively |
| `loyalty/service.py` | No changes — intelligence module reads redemption data passively |
| `messaging/service.py` | No changes — intelligence module reads message data passively |
| `core/scheduler.py` | New jobs registered via `sync_scheduler` extension |

### 13.5 Scheduler Registration
Extend `init_tables.py` or `main.py` startup to register Phase 5 scheduled jobs:

```python
# Add to scheduler sync
scheduler.add_job(compute_daily_intelligence, 'cron', hour=2, minute=0, id='daily_intelligence')
scheduler.add_job(generate_recommendations, 'cron', hour=6, minute=0, id='daily_recommendations')
scheduler.add_job(generate_weekly_summary, 'cron', day_of_week='mon', hour=3, id='weekly_summary')
scheduler.add_job(generate_monthly_summary, 'cron', day=1, hour=3, id='monthly_summary')
```

---

## 14. Frontend Evolution Strategy

### 14.1 Dashboard UX Evolution
Add third tab to existing `page.tsx` tab system:

```
[Operations] [Intelligence] [Growth]
```

Growth tab uses same design patterns as existing Intelligence tab:
- `StatCard` components for key metrics (reuse existing component)
- `Card` components for sparklines and insights (reuse existing)
- `Drawer` component for drilldowns (reuse existing)

### 14.2 New Frontend Components

```
components/
├── dashboard/
│   ├── HealthSummaryCards.tsx     # 2×2 grid of health metrics
│   ├── TrendSparkline.tsx        # Lightweight SVG sparkline (no chart library)
│   ├── RecommendationCard.tsx    # Dismissible action card
│   └── SummaryCard.tsx           # Weekly/monthly summary display
└── intelligence/
    ├── CustomerHealthBadge.tsx   # Colored health status badge
    ├── CLVBadge.tsx              # CLV tier indicator
    └── EffectivenessBar.tsx      # Simple progress bar for rates
```

### 14.3 Page Modifications

| Page | Change |
|------|--------|
| `page.tsx` (Dashboard) | Add Growth tab with health cards, trends, recommendations |
| `customers/page.tsx` | Add CLV tier and health status columns/badges; new filter options |
| `customers/[id]/page.tsx` | Add CLV score, health badge, spend trend sparkline |
| `settings/page.tsx` | Add per-reward effectiveness stats, per-automation ROI stats |

### 14.4 API Client Extensions (`lib/api.ts`)

```typescript
// New API functions
export const getGrowthDashboard = async (): Promise<GrowthDashboardResponse> => { ... };
export const getCustomerIntelligence = async (id: number): Promise<CustomerIntelligence> => { ... };
export const getCampaignROI = async (): Promise<CampaignROISummary[]> => { ... };
export const getRewardEffectiveness = async (): Promise<RewardEffectiveness[]> => { ... };
export const getBusinessSummaries = async (params): Promise<BusinessSummary[]> => { ... };
export const getRecommendations = async (): Promise<Recommendation[]> => { ... };
export const dismissRecommendation = async (id: number): Promise<void> => { ... };
```

### 14.5 Mobile-First UX Patterns
- All new cards follow existing `rounded-3xl border shadow-card` pattern
- Health badges are compact: colored dot + text (🟢 Healthy)
- Sparklines are inline SVGs — no heavy chart library (keep bundle size small)
- Recommendations use swipe-to-dismiss on mobile
- Growth tab uses same `animate-in fade-in` transitions as Intelligence tab

---

## 15. Performance & Scalability Strategy

### 15.1 Aggregation Optimization
- **Pre-computation eliminates dashboard query bottleneck**: Growth tab reads from summary tables (< 10ms)
- **Batch processing during off-hours**: All heavy computation at 2:00 AM
- **Incremental where possible**: CLV/health only recompute for customers with new visits since last run (optimization for scale)

### 15.2 Dashboard Performance Strategy
- **Target**: All dashboard tabs load in < 200ms
- Operations tab: already optimized (Phase 1-4)
- Intelligence tab: already optimized (Phase 4)
- Growth tab: reads pre-computed summary tables — constant time regardless of data volume

### 15.3 Scheduler Overhead Strategy
- Phase 5 adds 4 new scheduled jobs to existing APScheduler
- All jobs run at staggered off-peak times (2 AM, 3 AM, 6 AM)
- Total expected runtime for daily intelligence: < 30 seconds for 10K customers
- Jobs are idempotent — safe to re-run if interrupted

### 15.4 Scaling Thresholds
| Customer Count | Strategy |
|---------------|----------|
| < 1,000 | All queries work fine with current approach |
| 1,000–10,000 | Pre-computation essential (Phase 5 default) |
| 10,000–50,000 | Add DB indexes on computed fields; consider read replica |
| 50,000+ | Beyond Phase 5 scope — would need materialized views |

### 15.5 Query Optimization
- All new summary tables have primary keys aligned with lookup patterns
- No N+1 queries in intelligence computation — batch operations with JOINs
- Customer intelligence lookup by ID is O(1) — primary key on customer_id

---

## 16. Testing Strategy

### 16.1 Backend Unit Tests

```
tests/unit/
├── test_clv_computation.py        # CLV formula correctness
├── test_health_scoring.py         # Health status thresholds
├── test_campaign_roi.py           # Attribution window logic
├── test_reward_effectiveness.py   # Post-redemption revisit calc
├── test_automation_effectiveness.py # Automation ROI calc
├── test_recommendations.py        # Rule evaluation logic
└── test_summary_generation.py     # Weekly/monthly summary structure
```

**Key test cases:**
- CLV: Customer with zero visits → score = 0
- CLV: High-frequency, high-spend customer → tier = 'high'
- Health: Customer visiting every 7 days, last visit 20 days ago → 'declining'
- Health: New customer with 1 visit → 'new' (not enough data)
- Campaign ROI: Visit on day 7 → attributed; visit on day 8 → not attributed
- Recommendations: High-value declining customer → R1 fires

### 16.2 Backend Integration Tests

```
tests/integration/
├── test_intelligence_pipeline.py  # Full compute pipeline with real DB
├── test_intelligence_api.py       # API endpoint responses
└── test_scheduler_jobs.py         # Job registration and execution
```

### 16.3 Frontend Tests

```
__tests__/
├── components/
│   ├── CustomerHealthBadge.test.tsx
│   ├── RecommendationCard.test.tsx
│   └── TrendSparkline.test.tsx
└── pages/
    └── GrowthTab.test.tsx         # Growth tab rendering and interactions
```

**Key frontend test cases:**
- Health badge renders correct color for each status
- Recommendation card dismissal works
- Growth tab shows placeholder when data is computing
- CLV badge renders correct tier label

### 16.4 Edge Case Tests
- Customer with zero visits: health = 'new', CLV = 0
- Customer with one visit: health = based on recency only, CLV = minimal
- Campaign with zero recipients: conversion_rate = 0, no division by zero
- Reward never redeemed: redemption_rate = 0
- Empty database: all dashboards show graceful empty states

---

## 17. Operational Simplicity Principles

### 17.1 Avoiding Analytics Overload

**Rule: If a restaurant owner can't understand a metric in 5 seconds, remove it.**

Phase 5 limits the Growth tab to:
- 4 health summary cards
- 2 trend sparklines
- 3 effectiveness cards
- Max 5 recommendation cards

Total: ~14 visual elements. Compare to a typical BI dashboard with 30+ widgets.

### 17.2 Preserving Restaurant Usability

**The "Waiter Test"**: Can a server check a customer's status while the customer waits? Requirements:
- Customer lookup: < 2 seconds
- Health badge: visible without scrolling
- CLV tier: visible inline (not behind a click)
- Recommendation action: one tap

### 17.3 Avoiding Enterprise BI Complexity

| Enterprise BI Feature | Phase 5 Decision | Reason |
|----------------------|-------------------|--------|
| Custom report builder | ❌ Not implemented | Restaurant owners don't build reports |
| Multi-dimensional filtering | ❌ Not implemented | Predefined segments are sufficient |
| Export to CSV/PDF | ❌ Not in Phase 5 | Low priority for mobile-first users |
| Real-time streaming dashboards | ❌ Not implemented | Daily pre-computation is sufficient |
| User-defined KPIs | ❌ Not implemented | Predefined metrics cover all needs |
| Drag-and-drop widgets | ❌ Not implemented | Fixed layout is simpler and cleaner |

### 17.4 Information Hierarchy
```
Level 1 (Dashboard): Glanceable numbers — see in 2 seconds
Level 2 (Drill-down): Customer lists and details — one tap
Level 3 (Action): Send campaign, review settings — one more tap

Maximum depth: 3 taps from dashboard to action.
```

---

## 18. Future-Safe Architecture Decisions

### 18.1 Extension Points

| Extension Point | How | When |
|----------------|-----|------|
| SMS cost tracking | Add `cost_per_sms` to settings; multiply in campaign ROI | When SMS billing is integrated |
| WhatsApp/Email channels | Automation engine message type is already string-based | When new channels are needed |
| Multi-location support | Add `location_id` FK to visits, filter all queries | Phase 6+ if needed |
| Customer self-service app | Intelligence APIs are already RESTful and JSON-based | Future mobile app |
| Custom segments | Add `custom_segments` table with SQL-like filter definitions | If predefined segments aren't enough |

### 18.2 Scalability Boundaries

| Current Limit | Phase 5 Ceiling | Beyond Phase 5 |
|---------------|-----------------|-----------------|
| Single SQLite/PostgreSQL DB | ~50K customers comfortably | Read replicas, connection pooling |
| APScheduler in-process | ~10 concurrent scheduled jobs | Move to Celery or task queue |
| Single-tenant | One restaurant per instance | Multi-tenant schema with tenant_id |
| Mobile web | iPhone + desktop browser | Native mobile app |

### 18.3 What Phase 5 Does NOT Implement (Intentionally)

- **AI prediction models**: Churn prediction, demand forecasting — adds ML infrastructure complexity with marginal value at this scale
- **Enterprise reporting**: PDF reports, scheduled email digests — can be added later via summary data
- **SaaS/multi-tenant**: Each restaurant runs its own instance — simpler operations
- **Real-time event streaming**: Kafka/Redis pub-sub — APScheduler batch processing is sufficient
- **Data warehouse**: Star schema, OLAP cubes — pre-computed summary tables are the lightweight equivalent

---

## 19. Phase 5 Success Criteria

### 19.1 What Must Exist

- [ ] **Customer Intelligence**: CLV scores computed and visible on customer list/detail
- [ ] **Health Scoring**: All customers have health status (healthy/cooling/declining/churn_risk)
- [ ] **Campaign ROI**: Per-campaign conversion rate and attributed revenue visible
- [ ] **Reward Effectiveness**: Per-reward redemption rate and revisit influence visible
- [ ] **Automation Effectiveness**: Per-automation-type revisit rate and revenue visible
- [ ] **Growth Dashboard Tab**: Health summary, trends, recommendations visible
- [ ] **Business Summaries**: Weekly and monthly summaries auto-generated and browsable
- [ ] **Recommendations**: Rule-based recommendations displayed and dismissible
- [ ] **Pre-Computation Pipeline**: All intelligence computed via scheduled jobs
- [ ] **Mobile-First UX**: Growth tab fully functional on iPhone

### 19.2 What Defines Successful Completion

1. Restaurant owner can answer "Who are my most valuable customers?" in one tap
2. Restaurant owner can see declining customers before they churn
3. Restaurant owner can verify whether a campaign drove visits and revenue
4. Restaurant owner receives weekly business summaries without asking
5. Restaurant owner sees actionable recommendations without analytics training
6. All new features load in < 200ms on mobile
7. No regression in existing Phase 1-4 functionality

### 19.3 What Defines Production-Readiness

1. All scheduled jobs run reliably without manual intervention
2. All new API endpoints return valid responses (including empty states)
3. Backend test coverage > 90% for intelligence module
4. Frontend renders gracefully when intelligence data is not yet computed
5. Zero impact on core "Add Visit" performance (< 200ms)
6. Database migration is additive-only — zero risk to existing data

---

## Appendix A: Pre-Architecture Analysis Summary

### A.1 Intelligence Dashboard Analysis
- **Current**: `analytics/service.py` provides `get_revenue_metrics()` and `get_customer_segments()` — both use realtime SQL aggregation
- **Reusable**: Revenue split query, repeat rate calculation, segment subqueries
- **Scalability limit**: Realtime aggregation works for < 10K visits; beyond that, pre-computation needed
- **Decision**: Keep existing realtime queries for Phase 4 metrics; add pre-computed layer for Phase 5

### A.2 Smart Segmentation Analysis
- **Current**: VIP (top 10% spend), At-Risk (30-90 days), Lost (90+), New Blood (7 days), Near Rewards
- **Extensible**: Adding `is_declining` and `is_churn_risk` filters follows same pattern as `is_at_risk`
- **Decision**: Health-based segments integrated into existing `get_customers()` filter system

### A.3 Campaign System Analysis
- **Current**: `Campaign` model has lifecycle (draft → scheduled → completed), `Message` logs all sends
- **ROI tracking**: Already exists in `analytics/service.py` — 7-day attribution window joining messages → visits
- **Decision**: Evolve into per-campaign summaries stored in summary table

### A.4 Automation Engine Analysis
- **Current**: `AutomationConfig` + `AutomationHistory` + `Message` logging
- **Effectiveness gap**: No post-automation visit tracking
- **Decision**: Add `automation_summaries` table populated by joining history → messages → visits

### A.5 Customer Data Architecture
- **Current**: `Customer` + `CustomerProfile` (birthday/anniversary) + `Visit` (amount, timestamp) + `LoyaltyProgress`
- **CLV capability**: All data exists — total_spent, visit_count, visit_frequency, recency
- **Decision**: Compute CLV from existing data, store in new summary table

### A.6 Database Architecture
- **Current**: SQLite (dev) / PostgreSQL (prod), SQLAlchemy ORM, 11 tables
- **Aggregation**: Subqueries and CTEs used effectively in analytics service
- **Decision**: Add 6 summary tables (additive only), register daily computation jobs

---

## Appendix B: Complete Schema Overview (Post-Phase 5)

### Existing Tables (Unchanged)
1. `customers` — Core customer entity
2. `customer_profiles` — Birthday, anniversary
3. `visits` — Visit records with amount
4. `messages` — All SMS/campaign/automation logs
5. `campaigns` — Campaign definitions and lifecycle
6. `loyalty_rewards` — Reward configurations
7. `loyalty_progress` — Per-customer visit progress
8. `reward_redemptions` — Immutable redemption history
9. `automation_configs` — Automation pilot settings
10. `automation_history` — Automation send log
11. `settings` — Key-value global settings

### New Tables (Phase 5)
12. `customer_intelligence` — CLV scores, health status (1 row per customer)
13. `campaign_summaries` — Per-campaign ROI metrics (1 row per campaign)
14. `reward_summaries` — Per-reward effectiveness (1 row per reward)
15. `automation_summaries` — Per-automation monthly stats
16. `business_summaries` — Weekly/monthly snapshots
17. `recommendations` — Active recommendation cards

**Total: 17 tables** (11 existing + 6 new summary/cache tables)
