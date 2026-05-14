# Phase 4 Architecture: Restaurant Revenue Intelligence & Automation

## 1. Phase 4 Objective
The objective of Phase 4 is to transform TableBoost from a retention tool into an active **Revenue Intelligence & Automation Platform**. This phase focuses on closing the loop between data and action by automating customer engagement and providing actionable financial insights for restaurant owners.

- **Business Evolution**: Move from manual campaign sending to "Set and Forget" automation.
- **Technical Evolution**: Introduce lightweight event-driven triggers and background scheduling.
- **Operational Goals**: Increase "Return Visit" rates automatically while reducing manual management time for staff.

---

## 2. Core Phase 4 Principles
1. **Operational Simplicity**: Automations should be easy to enable/disable with one click.
2. **Lightweight Intelligence**: Use existing data (visits, spend, dates) to drive logic without complex AI.
3. **Actionable Analytics**: Every chart must answer a business question (e.g., "Is my Tuesday revenue growing?").
4. **Mobile-First Execution**: Dashboards and automation toggles must be fully functional on a smartphone.

---

## 3. Revenue Intelligence Architecture
Phase 4 introduces a dedicated aggregation layer to provide financial insights.

- **Metrics**: 
  - **Revenue Trends**: Daily, Weekly, and Monthly revenue visualization.
  - **Average Ticket**: Tracking average spend per visit over time.
  - **Repeat Rate Revenue**: Comparing revenue from new vs. repeat customers.
  - **Campaign ROI**: Tracking visits from customers who received an automated message within the last 7 days.
- **Aggregation Strategy**: 
  - For Phase 4, use **Materialized CTEs** or indexed views for real-time aggregation to maintain simplicity.
  - Avoid pre-computing tables unless the visit volume exceeds 100k records.
- **Dashboard Evolution**: Introduce a "Revenue Hub" view with lightweight SVG-based sparklines and trend indicators (↑/↓).

---

## 4. Automation Architecture
A lightweight "Trigger-Filter-Action" system integrated into the existing service layer.

- **Automation Rules**:
  - **Triggers**: System events (e.g., `VisitRecorded`).
  - **Filters**: Customer criteria (e.g., `lifetime_visits == 5`).
  - **Actions**: Messaging operations (e.g., `SendSMS`).
- **Standard Automations**:
  - **Birthday Greeting**: Triggered by daily scheduler for customers with birthdays today.
  - **Inactivity Recovery**: Triggered for customers who haven't visited in X days.
  - **Milestone Celebration**: Triggered when a customer hits a specific visit count.

---

## 5. Background Job Architecture
To support scheduled automations, TableBoost will introduce a lightweight background task runner.

- **Strategy**: Use **APScheduler** (BackgroundScheduler) running within the FastAPI process.
- **Execution**:
  - **Daily Cron**: Runs at 9:00 AM for date-based events (Birthdays, Anniversaries).
  - **Hourly Worker**: Scans for inactivity thresholds and cleanup tasks.
- **Retry Strategy**: Simple exponential backoff for messaging gateway failures, stored in the `message_logs` table with a `retry_count`.
- **Idempotency**: Use an `automation_history` table to ensure a specific automation (e.g., "Birthday 2024") is only sent once per customer per period.

---

## 6. Event Model Architecture
Events are internal signals emitted by existing services.

- **Core Events**:
  - `EVENT_VISIT_CREATED`: Emitted by `visits.service.add_visit`.
  - `EVENT_REWARD_UNLOCKED`: Emitted when loyalty progress hits a threshold.
  - `EVENT_CALENDAR_DAY`: Emitted by the background scheduler every morning.
- **Lightweight Implementation**: Direct function calls to an `automation_engine` module from within existing services to keep the stack simple (no external message brokers like RabbitMQ).

---

## 7. Smart Segmentation Architecture
Move from basic filtering to dynamic "Segments".

- **Logic**: Defined as stored SQL filters in the backend.
- **Segments**:
  - **VIPs**: Top 10% spenders or visitors.
  - **At-Risk**: Haven't visited in 30-60 days.
  - **Lost**: Haven't visited in 90+ days.
  - **New Blood**: Joined in the last 7 days.
- **Query Strategy**: Use SQLAlchemy `exists` queries to keep segment counts fast on the dashboard.

---

## 8. Dashboard Evolution Architecture
The Dashboard becomes a multi-tabbed interface:
1. **Operations (Current)**: Quick metrics and recent activity.
2. **Intelligence (New)**: Revenue charts and customer segments.
3. **Automations (New)**: Performance of active auto-pilots.

---

## 9. Campaign Evolution Architecture
- **Scheduled Campaigns**: Ability to set a `send_at` timestamp on a campaign.
- **Template Variables**: Extend templates to support `{last_visit_date}`, `{total_visits}`, and `{loyalty_points}`.
- **Tracking**: Link messages to subsequent visits to calculate "Campaign Conversion".

---

## 10. Notification Architecture
Reuse the `Message` model and `messaging.service`.
- **Internal notifications**: Optional staff alerts for high-value customer arrivals (VIP alerts).
- **Customer notifications**: Automated "You just unlocked a reward!" SMS.

---

## 11. Database Evolution Strategy
Minimal schema additions:
- `automation_configs`: Stores status (enabled/disabled) and parameters for auto-rules.
- `automation_history`: Logs which customer received which automation and when.
- `analytics_snapshots` (Optional): For caching daily revenue totals to speed up charts.

---

## 12. Backend Evolution Strategy
- **`modules.automation`**: New module containing the engine and rule definitions.
- **`modules.analytics`**: New module for revenue calculation and trend logic.
- **Service Hooks**: Add "Event Dispatcher" calls to `loyalty.service` and `visits.service`.

---

## 13. Frontend Evolution Strategy
- **Chart.js / Recharts Integration**: For lightweight, mobile-responsive revenue visualizations.
- **Automation Hub**: A "Switchboard" UI where owners can toggle specific automations.
- **Segment Quick-Filters**: One-tap segment selection in the Customer List.

---

## 14. Performance Strategy
- **Read Replicas/Optimized Queries**: Ensure the dashboard doesn't slow down the "Add Visit" flow.
- **Async Execution**: Messaging and automation logic should run after the database transaction is committed to prevent UI lag.

---

## 15. Testing Strategy
- **Automation Unit Tests**: Mocking "Time" to verify birthday/inactivity triggers.
- **Aggregation Tests**: Verifying revenue calculation against a set of test visits.
- **Concurrency Tests**: Ensuring background jobs don't lock the `customers` table.

---

## 16. Operational Simplicity Principles
- **No Complex Workflows**: Automations are predefined "recipes," not drag-and-drop builders.
- **Human-Readable Logs**: "Sent Birthday SMS to John" instead of cryptic status codes.
- **Default-Safe**: Automations are disabled by default to prevent accidental spam.

---

## 17. Future-Safe Decisions
- **Modularity**: The automation engine is separate from the messaging gateway, allowing for future WhatsApp or Email integration.
- **Stateless Jobs**: Background jobs recalculate state on each run, making the system resilient to server restarts.

---

## 18. Phase 4 Success Criteria
- [ ] Dashboard shows revenue trends and average ticket metrics.
- [ ] Automated Birthday SMS sends successfully without manual intervention.
- [ ] Automated Inactivity recovery SMS triggers for "At-Risk" customers.
- [ ] Staff can see "Campaign ROI" on the dashboard.
- [ ] System remains fast (under 200ms) for core "Add Visit" operations.
