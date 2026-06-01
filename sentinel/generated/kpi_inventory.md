# KPI & Metrics Inventory

Mapping of displayed analytics cards and charts to the database schemas and SQL calculations.

| KPI Name | Target Component | DB Table | Database SQL Formula / Method | Filters / Parameters |
| :--- | :--- | :--- | :--- | :--- |
| **Total Customers** | Dashboard StatCard | `customers` | `SELECT COUNT(id) FROM customers WHERE restaurant_id = :r_id` | restaurant_id |
| **Total Visits** | Dashboard StatCard | `visits` | `SELECT COUNT(id) FROM visits WHERE restaurant_id = :r_id` | restaurant_id |
| **Repeat Spenders** | Dashboard StatCard | `visits` | `SELECT COUNT(*) FROM (SELECT customer_id FROM visits WHERE restaurant_id = :r_id GROUP BY customer_id HAVING COUNT(id) > 1)` | restaurant_id |
| **Total Redeemed** | Dashboard StatCard | `reward_redemptions` | `SELECT COUNT(id) FROM reward_redemptions WHERE restaurant_id = :r_id` | restaurant_id |
| **Weekly Revenue** | Dashboard StatCard | `visits` | `SELECT SUM(amount) FROM visits WHERE restaurant_id = :r_id AND visited_at >= :start_date` | restaurant_id, visited_at >= (now - 7 days) |
| **Monthly Revenue** | Dashboard StatCard | `visits` | `SELECT SUM(amount) FROM visits WHERE restaurant_id = :r_id AND visited_at >= :start_date` | restaurant_id, visited_at >= (now - 30 days) |
| **Avg Ticket Size** | Dashboard StatCard | `visits` | `SELECT AVG(amount) FROM visits WHERE restaurant_id = :r_id AND visited_at >= :start_date` | restaurant_id, visited_at >= (now - 30 days) |
| **Repeat Rate** | Dashboard StatCard | `visits` | `(repeat_visits_30 / total_visits_30) * 100` | restaurant_id, last 30 days |
| **VIP Segments** | Dashboard StatCard | `visits` | `SELECT COUNT(customer_id) FROM (SELECT customer_id, SUM(amount) AS spend FROM visits WHERE restaurant_id = :r_id GROUP BY customer_id) WHERE spend >= (90th percentile)` | restaurant_id |
| **At Risk** | Dashboard StatCard | `visits` | `SELECT COUNT(DISTINCT customer_id) FROM (SELECT customer_id, MAX(visited_at) AS last_v FROM visits WHERE restaurant_id = :r_id GROUP BY customer_id) WHERE last_v BETWEEN (now - 90d) AND (now - 30d)` | restaurant_id |
| **Near Reward** | Dashboard StatCard | `loyalty_progress` | `SELECT COUNT(customer_id) FROM loyalty_progress JOIN customers ON customer_id = id WHERE customers.restaurant_id = :r_id AND EXISTS (SELECT 1 FROM loyalty_rewards r WHERE r.restaurant_id = :r_id AND r.reward_type = 'milestone' AND r.is_active = 1 AND r.required_visits - lifetime_visits BETWEEN 0 AND 2)` | restaurant_id |
| **Lost Customers** | Dashboard StatCard | `visits` | `SELECT COUNT(DISTINCT customer_id) FROM (SELECT customer_id, MAX(visited_at) AS last_v FROM visits WHERE restaurant_id = :r_id GROUP BY customer_id) WHERE last_v < (now - 90d)` | restaurant_id |
| **New Blood** | Dashboard StatCard | `customers` | `SELECT COUNT(id) FROM customers WHERE restaurant_id = :r_id AND created_at >= :start_date` | restaurant_id, created_at >= (now - 7 days) |
