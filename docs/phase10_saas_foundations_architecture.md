# Phase 10.1: Multi-Restaurant SaaS Foundations & Tenant-Aware Architecture

Version: 1.0

---

## 1. PHASE OVERVIEW

TableBoost has reached a critical maturity level. Following Phase 1 through Phase 6.8, the platform is now a production-grade restaurant operations system featuring advanced messaging, loyalty, revenue intelligence, growth optimization, and robust operational logging. 

However, a fundamental architectural limitation remains: the platform was designed conceptually around a single restaurant context. While RBAC (Owner, Manager, Staff) and subscription gating have been introduced, they are currently mapped directly to **users**, not **restaurants**.

This phase introduces **SaaS Foundations** to transform TableBoost into a safe, multi-client, tenant-aware SaaS platform. 

**Why Tenant Isolation and Restaurant-Centric Ownership Matter:**
* A single restaurant can have multiple users (1 Owner, 2 Managers, 5 Staff). 
* Currently, subscriptions are owned by individual users, creating duplicated logic, convoluted inheritance, and a massive risk of cross-tenant data leakage if multiple restaurants are onboarded.
* The SaaS business model sells to *restaurants*, not *individuals*. The architecture must reflect this commercial reality.

This phase is **critical** because onboarding a second restaurant on the current architecture would risk exposing data across boundaries, breaking subscription limits, and confusing automation engines. This phase establishes the foundations to safely scale the platform to hundreds of restaurants while preserving our lightweight, mobile-first, and operational simplicity.

---

## 2. CURRENT ARCHITECTURE ANALYSIS

**Current Single-Restaurant Assumptions:**
* **Global Queries:** Many services implicitly query the entire database (e.g., aggregating visits or running analytics) because they assume all rows belong to the only restaurant.
* **Current User-Centric Subscription Assumptions:** Subscriptions are tied directly to `user_id` (via `sub_subscriptions`). Non-owner users must execute expensive, convoluted queries to find "their owner's subscription" to determine feature access.
* **Current RBAC Assumptions:** Users have roles (`OWNER`, `MANAGER`, `STAFF`) globally, without a clear structural link to *which* restaurant they own or manage.
* **Current Scheduler Assumptions:** The automation engine (`core/scheduler.py`) runs jobs assuming all matched customers belong to the same context, risking cross-contamination of SMS campaigns if multiple restaurants exist.
* **Current Analytics Assumptions:** Dashboards aggregate revenue and CLV based on global tables rather than scoping by tenant.

**Risks Preventing Multi-Client Onboarding:**
Without correcting these issues, adding a second restaurant would result in their customers receiving loyalty texts from the first restaurant, or a staff member at Restaurant A seeing revenue data for Restaurant B.

---

## 3. CURRENT DATABASE SCHEMA ANALYSIS

**Current Schema Structure:**
* `users` table links directly to `user_profiles`.
* `sub_subscriptions` table links directly to `users.id` (1:1 mapping).
* `customers`, `visits`, `messages`, `loyalty_rewards` have no explicit tenant identifier.

**Current Ownership Model:**
Ownership is defined implicitly through a user whose role is `OWNER`. Staff users access features via a fallback lookup to the `OWNER`'s active subscription.

**Schema Limitations for SaaS Evolution:**
* Missing a core `restaurants` (tenant) entity.
* Missing `restaurant_id` on operational tables (`customers`, `visits`, `campaigns`, `messages`).
* Subscriptions are attached to `users`, meaning if an `OWNER` is deleted or changes role, the restaurant loses its subscription and billing relationship.

**Risks in Current Ownership Model:**
* **Orphaned Entities:** Deleting an owner breaks the application for the staff.
* **Data Leakage:** Impossible to enforce row-level security or strict WHERE clauses without a `restaurant_id`.

---

## 4. SAAS FOUNDATIONS OBJECTIVES

1. **Tenant-Aware Architecture Goals:** Introduce strict `restaurant_id` scoping for all queries and APIs.
2. **Restaurant-Centric Ownership Goals:** Migrate subscriptions, limits, features, and settings from the `User` to the `Restaurant`.
3. **Operational Simplicity Goals:** Achieve multi-tenancy without resorting to massive Kubernetes clusters, complex microservices, or DB-per-tenant architectures.
4. **Commercialization Goals:** Align the data model with the billing model (Restaurant pays for Subscription).
5. **Future SaaS Evolution Goals:** Establish a clean foundation for upcoming self-signup ecosystems, billing engine integrations, and external API gateways.

---

## 5. RESTAURANT-CENTRIC SAAS OWNERSHIP MODEL

The most crucial paradigm shift in Phase 10 is moving away from the `User`.

**New Model: Restaurant = Tenant**

* **Restaurant owns the subscription:** Billing and feature gating apply to the business entity.
* **Restaurant owns features:** If the restaurant is on the PRO plan, PRO features are unlocked for that restaurant context.
* **Restaurant owns limits:** SMS quotas and customer limits apply to the restaurant.
* **Restaurant owns governance:** Audit logs and configurations belong to the restaurant.
* **Restaurant owns automation:** Campaign schedules execute in the context of the restaurant.

**Users Inherit Capabilities:**
Users do not own features. They inherit capabilities from the restaurant.
*Why must subscription ownership move from user → restaurant?* 
Because a user is simply a human accessing the system. The *restaurant* is the business that pays TableBoost. If a restaurant fires their manager, the manager's user account is deactivated, but the restaurant's subscription, automations, and data must remain perfectly intact.

---

## 6. TENANT MODEL ARCHITECTURE

The core of the new architecture is the `restaurants` table.

**Restaurants Table Architecture:**
* `id` (Primary Key)
* `name` (String, core identifier)
* `timezone` (String, critical for scheduler)
* `owner_details` (JSON/JSONB): Extensible structure to support single or multiple owners (e.g., `[{"name": "...", "phone": "...", "email": "..."}]`).
* `restaurant_details` (JSON/JSONB): Extensible structure for full location data (e.g., `{"address": "...", "city": "...", "state": "...", "zip": "...", "country": "..."}`).
* `created_at` / `updated_at`

**Tenant Ownership Model:**
The restaurant sits at the top of the hierarchy. All operational data depends on it.

**Restaurant Lifecycle Model:**
Restaurants can be `ACTIVE`, `SUSPENDED` (e.g., failed payment), or `CHURNED`. When a restaurant is suspended, all inherited user access and background automations for that tenant are paused.

**Restaurant Settings Model:**
Current global settings (like SMS review templates and auto-send preferences) will be migrated to `restaurant_settings`, belonging to the tenant.

---

## 7. DATABASE MULTI-TENANCY STRATEGY

**Strategy:** Shared Database + Tenant Isolation (Row-Level Multi-tenancy).

We will use a **Shared DB Strategy** where all restaurants reside in the same PostgreSQL database, isolated by a `restaurant_id` foreign key on every table.

**Why Shared DB is Chosen:**
* **Operational Simplicity:** A single DB is vastly easier to deploy, backup, and migrate than managing 500 individual databases.
* **Scalability:** PostgreSQL handles row-level isolation for millions of rows effortlessly with proper indexing.
* **Lightweight:** Preserves the current monolithic, fast, mobile-optimized deployment structure without requiring Kubernetes orchestration or dynamic connection pooling.

**Why Separate DB per Restaurant is Avoided:**
* TableBoost prioritizes low DevOps overhead. A DB-per-tenant model introduces complex provisioning workflows, massive infrastructure costs, and makes cross-tenant analytics (for TableBoost admins) exponentially harder.

---

## 8. DATABASE RELATIONSHIP EVOLUTION

**Current Model:**
`User` -> `Subscription`
`User` -> `Visits`, `Customers`, `Messages` (Implicitly)

**New Model:**
`Restaurant` -> `Subscription` (1:1)
`Restaurant` -> `Users` (1:N, via a `restaurant_users` association table to support future multi-location)
`Restaurant` -> `Customers` (1:N)
`Restaurant` -> `Visits` (1:N)
`Restaurant` -> `Messages`, `Campaigns`, `Settings` (1:N)

**Migration-Safe Relationship Changes:**
1. Create the `restaurants` table.
2. Create a default "TableBoost Primary" restaurant.
3. Add `restaurant_id` to all tables, nullable initially.
4. Backfill all existing rows to the default `restaurant_id`.
5. Make `restaurant_id` non-nullable.
6. Migrate `sub_subscriptions.user_id` to `sub_subscriptions.restaurant_id`.

---

## 9. TENANT ISOLATION ARCHITECTURE

This is the most critical security boundary.

**Tenant-Aware Query Architecture:**
Every single database query MUST include `.filter(Model.restaurant_id == current_restaurant_id)`.
We will implement an application-level isolation layer using SQLAlchemy's `with_loader_criteria` or explicit base repository patterns to automatically append this filter.

**Tenant-Aware Service Architecture:**
Service layer functions (e.g., `customers/service.py`) will no longer accept just `db: Session`. They will accept `tenant_id: int` and enforce it strictly on all reads and writes.

**Tenant-Aware API Architecture:**
FastAPI dependency injection will extract the `restaurant_id` from the authenticated user's session token and pass it to the service layer.

**Cross-Tenant Leakage Prevention:**
By requiring `tenant_id` at the service layer, the backend remains authoritative. The frontend can never "request" another restaurant's data because the token limits the tenant context.

---

## 10. TENANT-AWARE AUTHENTICATION & RBAC

**Tenant-Aware User Model:**
Users will be linked to a restaurant with a specific role via a `restaurant_users` linking table, mapping `user_id` to `restaurant_id` with `role`.

**Effective Permissions = Restaurant Subscription + User Role**

**Example:**
* If Restaurant A is on the **STARTER** plan, an `OWNER` of Restaurant A can only access Starter features.
* If Restaurant B is on the **PRO** plan, a `STAFF` member of Restaurant B can access Pro features, *but only those permitted by the STAFF role* (e.g., they can't access Billing).

**Tenant-Aware Permission Boundaries:**
This cleanly separates *Business Capability* (Subscription) from *User Authority* (Role).
Future scalability allows a single User (e.g., an area manager) to have the `OWNER` role in Restaurant A and the `MANAGER` role in Restaurant B.

---

## 11. TENANT-AWARE SUBSCRIPTION ARCHITECTURE

**Restaurant-Level Subscription Ownership:**
The `sub_subscriptions` table will drop `user_id` and replace it with `restaurant_id`.

**Tenant-Aware Feature Gating:**
The centralized feature registry (`sub_features`) remains. However, instead of checking `user.subscription`, the backend will check `restaurant.subscription`. 

**Why User-Level Subscriptions are Incorrect for SaaS:**
If user-level subscriptions were kept, 5 staff members at one restaurant would technically need 5 subscriptions, or one owner would share credentials. By shifting to the restaurant, the business pays one fee, and the system seamlessly gates features for all authorized staff under that umbrella.

---

## 12. TENANT-AWARE AUTOMATION & SCHEDULER ARCHITECTURE

**Scheduler Isolation:**
The current APScheduler jobs (e.g., `compute_clv_scores`, `send_scheduled_campaigns`) must be heavily refactored.

**Tenant-Aware Job Execution:**
Jobs must iterate through *active restaurants* first, and then process data *within that tenant's context*, respecting the restaurant's timezone. 
A cron job meant to run at 8:00 AM must run at 8:00 AM EST for a New York restaurant, and 8:00 AM PST for a California restaurant.

**Preventing Cross-Tenant Execution Leakage:**
When the automation engine fetches customers to send SMS campaigns, the SQL query must strictly bound by `restaurant_id`. Failure to do this would result in Restaurant A texting Restaurant B's customers.

---

## 13. TENANT-AWARE INTELLIGENCE & ANALYTICS

**Analytics Isolation Strategy:**
All pre-computed tables introduced in Phase 5 (`customer_intelligence`, `campaign_summaries`, `business_summaries`) must include `restaurant_id`. 

**Tenant-Aware KPIs & Dashboards:**
When the dashboard requests metrics, it will only aggregate data WHERE `restaurant_id = current_tenant`. This prevents a newly boarded restaurant from seeing the platform-wide global metrics that were implicitly returned in earlier phases.

---

## 14. TENANT-AWARE GOVERNANCE & AUDIT ARCHITECTURE

**Governance Isolation:**
The operational logs and audit trails introduced in Phase 6.3 must include `restaurant_id`. 

**Tenant-Aware Troubleshooting:**
When a restaurant owner claims "the system didn't send my messages", TableBoost support can filter audit logs by `restaurant_id` to provide exact diagnostics without wading through other tenants' data.

---

## 15. TENANT-AWARE SECURITY MODEL

**Backend-Authoritative Enforcement:**
The frontend never dictates the tenant context via raw JSON payloads like `{"restaurant_id": 5}`. 
Instead, the FastAPI backend extracts the `tenant_id` securely from the JWT token or session context of the authenticated user.

**Query Protection (Leakage Prevention):**
All ORM updates and deletes will be structured to verify ownership. 
`db.query(Customer).filter(Customer.id == target_id, Customer.restaurant_id == tenant_id).first()`
If a user maliciously guesses another tenant's `Customer.id`, the query will safely return `None`.

---

## 16. FRONTEND SAAS EVOLUTION ARCHITECTURE

**Tenant-Aware Session Handling:**
The frontend session state will store the `currentRestaurantId`. 
All API calls will pass standard bearer tokens. The backend determines the restaurant.

**Tenant-Aware Navigation:**
If a user belongs to multiple restaurants (future-proofing), the frontend will display a Tenant Switcher dropdown. The UI will dynamically re-render premium features based on the `subscription` payload of the *currently selected restaurant*.

---

## 17. OPERATIONAL WORKFLOW EVOLUTION

**Onboarding Assumptions:**
When a new user signs up, the workflow is:
1. Create User.
2. Create Restaurant (Tenant).
3. Assign User as `OWNER` to Restaurant.
4. Assign default STARTER Subscription to Restaurant.

**Operational Simplicity:**
For 99% of users who only own one restaurant, the UI remains perfectly identical. They will never see a "Tenant ID" or complexity. The isolation is entirely handled invisibly by the backend.

---

## 18. FUTURE SAAS EVOLUTION COMPATIBILITY

This architecture creates the foundation for massive future expansion without rewriting:
* **Self-Signup:** The onboarding workflow perfectly supports automated provisioning.
* **Billing Systems (Stripe):** The `restaurant_id` maps perfectly to a Stripe Customer ID.
* **Multi-Location Chains:** A chain is simply multiple `restaurants`, with an overarching "Organization" table (Phase 11+) linking them.
* **Integrations:** API keys can be scoped strictly to a `restaurant_id`.

---

## 19. DATABASE MIGRATION STRATEGY

Because this touches every table, the migration must be meticulously safe.

1. **Schema Migration:** Alembic creates `restaurants` table and adds `restaurant_id` to all tables (nullable).
2. **Backfill Strategy:** A python script creates one `Restaurant` for the existing installation, and updates all rows in all tables to use this `restaurant_id`.
3. **Constraint Migration:** Alembic makes `restaurant_id` non-nullable and sets up Foreign Keys.
4. **Subscription Migration:** Move active subscription records from pointing at `users.id` to the newly created `restaurants.id`. 
5. **Code Rollout:** Deploy tenant-aware APIs.

---

## 20. PERFORMANCE & SCALABILITY STRATEGY

**Tenant-Aware Indexing:**
PostgreSQL indexes will be updated to composite indexes: `(restaurant_id, created_at)` or `(restaurant_id, phone_number)`. Because all queries filter by `restaurant_id` first, this optimizes lookups significantly.

Avoid enterprise overengineering: We are not using Citus or sharding. Standard PostgreSQL with proper indexing is perfectly capable of handling 10,000+ restaurants on a single instance.

---

## 21. TESTING STRATEGY

**Tenant Isolation Tests:**
The test suite must be updated. Create Tenant A and Tenant B.
Ensure Tenant A calling `GET /api/customers` does not see Tenant B's customers.
Ensure Tenant A cannot delete Tenant B's campaign.

**RBAC Tests:**
Verify `Effective Permissions = Restaurant Subscription + User Role`.
Test an Owner on a Starter plan vs Staff on a Pro plan.

---

## 22. SECURITY & GOVERNANCE CONSIDERATIONS

**SaaS Operational Risks:**
The biggest risk in SaaS is data bleeding. The primary mitigation is rigorous code review ensuring no repository method bypasses the `restaurant_id` filter. 

**Operational Visibility:**
System admins need a global view. An internal `SUPERADMIN` role will be created that explicitly bypasses the tenant filters to allow monitoring platform health.

---

## 23. IMPLEMENTATION ROADMAP

1. **Phase 10.1A:** Database Schema Migration & Backfill (Zero downtime).
2. **Phase 10.1B:** Service Layer Refactor (Inject `tenant_id` into all queries).
3. **Phase 10.1C:** API Auth Layer Refactor (Extract `tenant_id` from JWT).
4. **Phase 10.1D:** Scheduler Refactor (Tenant-aware cron jobs).
5. **Phase 10.1E:** Frontend Refactor & Tenant Switcher foundations.

---

## 24. RISKS & MITIGATION STRATEGY

* **Migration Risk:** Data loss during subscription migration. *Mitigation:* Full database snapshot before Alembic upgrade.
* **Scheduler Risks:** Automations failing due to missing timezone context. *Mitigation:* Require `timezone` on the `restaurants` table.
* **Rollout Risks:** Downtime during backfill. *Mitigation:* Deploy schema as nullable first, backfill in background, then enforce constraints.

---

## 25. FINAL ARCHITECTURE SUMMARY

TableBoost is evolving from a **single-restaurant product** to a **SaaS-ready multi-restaurant platform**.

By shifting ownership from the User to the Restaurant, implementing Row-Level Tenant Isolation, and enforcing strict backend-authoritative scoping, we solve critical scaling blockers. 

We achieve this while strictly preserving our core principles:
* **Operational Simplicity:** No Kubernetes, no DB-per-tenant, no heavy enterprise bloat.
* **Commercialization Architecture:** The platform aligns directly with the business model (Restaurant pays for Subscription).
* **Mobile-First UX:** The complexity remains entirely in the backend; the restaurant staff experience remains fast, simple, and unchanged.
