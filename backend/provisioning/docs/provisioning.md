# TableBoost Restaurant Provisioning & Tenant Bootstrap Guide

This module provides platform operators (with `SUPER_ADMIN` privileges) a safe, backend-driven way to onboard new restaurants, seed default configurations, assign subscription plans, and initialize background tasks without requiring direct DB access or shell execution.

---

## Architecture Overview

All provisioning files reside under `/backend/provisioning`:

1.  **Orchestrator (`service.py`)**: Manages transaction boundaries. If any step fails during bootstrapping, the entire change rolls back. If `dryRun=True`, a transaction rollback is explicitly triggered at the end, allowing risk-free simulation.
2.  **Validators (`validators.py`)**: Executes health check audits for a specific restaurant ID to confirm the presence of subscriptions, owners, settings, automations, and background scheduler jobs.
3.  **RBAC Provisioner (`core/rbac.py` / models)**: Creates exactly three unique users:
    *   **Owner**: `{owner_username}`
    *   **Manager**: `{owner_username}_manager`
    *   **Staff**: `{owner_username}_staff`
    These users are given their respective roles, secure hashed passwords, and mapped to the restaurant. Username conflicts are checked globally; attempting to link existing users belonging to other restaurants is rejected to maintain strict tenant isolation.
    *Note: Every user is automatically associated with a `UserProfile` where the `username` is set as the profile's `last_name`. The `profile_id` column in the `users` table is strictly `NOT NULL` (non-nullable).*
4.  **Automation & Seeder (`core/automation.py`)**: Seeds default templates, four default automation configurations (birthday, anniversary, inactivity, reward_unlocked), and baseline milestone loyalty rewards (5 visits -> Free Drink, 10 visits -> 10% Discount).
5.  **FastAPI Router (`router.py`)**: Exposes administrative endpoints `/internal/admin/provision-restaurant` and `/internal/admin/validate-restaurant`. These require cookies containing a JWT session representing a user with `role="SUPER_ADMIN"`.

---

## Platform Bootstrapping ("First Admin")

For a fresh production environment with an empty database, a default `SUPER_ADMIN` operator is automatically seeded on database initialization (`init_tables.py`):
*   **Username**: `superadmin`
*   **Password**: Reads from the `SUPER_ADMIN_PASSWORD` environment variable. If the variable is unset, it defaults to a fallback of `superadmin123`.

Once the database is initialized, use the `/api/auth/login` endpoint with the `superadmin` credentials to acquire the `tableboost_token` session cookie. This cookie will authenticate your subsequent calls to the provisioning and validation endpoints.

---

## API Documentation

### 1. Provision Restaurant
*   **Method**: `POST`
*   **Path**: `/internal/admin/provision-restaurant`
*   **Auth Required**: Active session cookies with role `SUPER_ADMIN`.
*   **Headers**: `Content-Type: application/json`
*   **Request Body**:
    ```json
    {
      "restaurant_name": "Flavor Fusion",
      "timezone": "America/Chicago",
      "owner_username": "flavor_fusion",
      "owner_password": "supersecretpassword123",
      "plan_name": "PRO",
      "dryRun": false
    }
    ```
*   **Response (200 OK)**:
    ```json
    {
      "success": true,
      "dryRun": false,
      "restaurant_id": 3,
      "restaurant_name": "Flavor Fusion",
      "owner_username": "flavor_fusion",
      "manager_username": "flavor_fusion_manager",
      "staff_username": "flavor_fusion_staff",
      "plan_assigned": "PRO",
      "actions_taken": [
        "Created new restaurant: Flavor Fusion (ID: 3)",
        "Seeded default settings: review_message_template, auto_send_sms, campaign_inactive_days",
        "Created new subscription to plan: PRO",
        "Created OWNER user: flavor_fusion and linked to restaurant ID 3",
        "Created MANAGER user: flavor_fusion_manager and linked to restaurant ID 3",
        "Created STAFF user: flavor_fusion_staff and linked to restaurant ID 3",
        "Seeded automation config: birthday",
        "Seeded automation config: anniversary",
        "Seeded automation config: inactivity",
        "Seeded automation config: reward_unlocked",
        "Seeded loyalty reward milestone: Free Drink (5 visits)",
        "Seeded loyalty reward milestone: 10% Discount (10 visits)",
        "Synchronized active background scheduler jobs"
      ]
    }
    ```

---

### 2. Validate Restaurant (Health Check)
*   **Method**: `GET`
*   **Path**: `/internal/admin/validate-restaurant`
*   **Auth Required**: Active session cookies with role `SUPER_ADMIN`.
*   **Query Parameters**:
    *   `restaurant_id` (integer, required)
*   **Response (200 OK - Healthy)**:
    ```json
    {
      "status": "healthy",
      "restaurant_id": 3,
      "details": {
        "restaurant_exists": true,
        "owner_exists": true,
        "subscription_active": true,
        "subscription_plan": "PRO",
        "settings_count": 3,
        "automations_count": 4,
        "loyalty_rewards_count": 2,
        "scheduler_jobs_count": 2
      }
    }
    ```
*   **Response (200 OK - Degraded)**:
    ```json
    {
      "status": "degraded",
      "restaurant_id": 999,
      "details": {
        "restaurant_exists": false,
        "owner_exists": false,
        "subscription_active": false,
        "subscription_plan": null,
        "settings_count": 0,
        "automations_count": 0,
        "loyalty_rewards_count": 0,
        "scheduler_jobs_count": 0
      }
    }
    ```

---

## Security & Operator Governance
1.  **Platform Audit Trail**: All successful and failed provisioning attempts are logged in the platform `audit_logs` table, tracking the actor username and status.
2.  **Rate Limiting**: Integrated with TableBoost's standard middleware rate limiter to protect endpoints from abuse.
3.  **Role Gating**: Standard tenant-aware decorators check for `SUPER_ADMIN`. Super Admins can query any endpoint and pass the `X-Restaurant-ID` header to inspect tenant-specific metrics.
