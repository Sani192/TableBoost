# Role & Plan Gating Matrix

Effective Permissions = Restaurant Subscription + User Role.

## Plan Level Features

| Feature Code | Description | STARTER | GROWTH | PRO |
| :--- | :--- | :---: | :---: | :---: |
| `visits` | Visits tracking and logging | ✅ | ✅ | ✅ |
| `customers` | Basic customer CRM registry | ✅ | ✅ | ✅ |
| `review_sms` | Review feedback request SMS | ✅ | ✅ | ✅ |
| `loyalty` | Loyalty milestone rewards & claims | 🔒 | ✅ | ✅ |
| `campaigns` | Marketing campaign SMS broadcasts | 🔒 | ✅ | ✅ |
| `smart_segments`| VIP and near-reward segmentation | 🔒 | ✅ | ✅ |
| `automation` | Automatic birthday/anniversary texts | 🔒 | 🔒 | ✅ |
| `intelligence` | CLV tiers and growth dashboards | 🔒 | 🔒 | ✅ |
| `governance` | Audit logs & operational scheduler logs | 🔒 | 🔒 | ✅ |

---

## Role Authority Boundaries

| Screen / Capability | STAFF | MANAGER | OWNER |
| :--- | :---: | :---: | :---: |
| **Add Visit UI (`/add-visit`)** | ✅ | ✅ | ✅ |
| **Visits List UI (`/visits`)** | 🔒 (Redirect) | ✅ | ✅ |
| **Customers List UI (`/customers`)** | 🔒 (Redirect) | ✅ | ✅ |
| **Loyalty Management UI (`/loyalty`)** | 🔒 (Redirect) | ✅ | ✅ |
| **Campaigns & Logs UI (`/campaigns`, `/messages`)** | 🔒 (Redirect) | ✅ | ✅ |
| **Automations UI (`/automations`)** | 🔒 (Redirect) | ✅ | ✅ |
| **Settings UI (`/settings`)** | 🔒 (Redirect) | 🔒 (Redirect) | ✅ |
| **Governance Dashboard UI (`/governance`)** | 🔒 (Redirect) | 🔒 (Redirect) | ✅ |
| **Audit Logs API (`/api/governance/audit`)** | 🔒 (403) | 🔒 (403) | ✅ |
| **Change Subscription API (`/api/auth/subscription`)** | 🔒 (403) | 🔒 (403) | ✅ |
