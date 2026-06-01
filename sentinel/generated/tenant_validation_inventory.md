# Tenant Isolation Schema Inventory

Mapping of database tables and the corresponding `restaurant_id` column configuration for multi-restaurant scoping.

| Table Name | Entity Class | Scoping Column | Enforced Scoping Mechanism |
| :--- | :--- | :--- | :--- |
| `restaurants` | `Restaurant` | `id` | Root Tenant Entity |
| `restaurant_users` | `RestaurantUser` | `restaurant_id` | Join Association linking Users to Tenants |
| `customers` | `Customer` | `restaurant_id` | Foreign Key (non-nullable) |
| `customer_profiles` | `CustomerProfile` | `restaurant_id` | Foreign Key (non-nullable) |
| `visits` | `Visit` | `restaurant_id` | Foreign Key (non-nullable) |
| `messages` | `Message` | `restaurant_id` | Foreign Key (non-nullable) |
| `campaigns` | `Campaign` | `restaurant_id` | Foreign Key (non-nullable) |
| `loyalty_rewards` | `LoyaltyReward` | `restaurant_id` | Foreign Key (non-nullable) |
| `loyalty_progress` | `LoyaltyProgress` | Indirect via Customer | Joined to `customers` table |
| `reward_redemptions` | `RewardRedemption` | `restaurant_id` | Foreign Key (non-nullable) |
| `automation_configs` | `AutomationConfig` | `restaurant_id` | Foreign Key (non-nullable) |
| `automation_history` | `AutomationHistory` | `restaurant_id` | Foreign Key (non-nullable) |
| `customer_intelligence`| `CustomerIntelligence`| `restaurant_id` | Foreign Key (non-nullable) |
| `campaign_summaries` | `CampaignSummary` | `restaurant_id` | Foreign Key (non-nullable) |
| `reward_summaries` | `RewardSummary` | `restaurant_id` | Foreign Key (non-nullable) |
| `automation_summaries`| `AutomationSummary`| `restaurant_id` | Foreign Key (non-nullable) |
| `business_summaries` | `BusinessSummary` | `restaurant_id` | Foreign Key (non-nullable) |
| `recommendations` | `Recommendation` | `restaurant_id` | Foreign Key (non-nullable) |
| `gov_audit_logs` | `AuditLog` | `restaurant_id` | Foreign Key (nullable for general logins, non-nullable for tenant context operations) |
| `gov_operational_logs` | `OperationalLog` | `restaurant_id` | Foreign Key (nullable for system jobs, non-nullable for tenant tasks) |
| `sub_subscriptions` | `Subscription` | `restaurant_id` | Foreign Key (non-nullable, Unique constraint) |
