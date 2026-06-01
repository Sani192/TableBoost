# Sentinel Functionality Matrix

Discovered API endpoints, routes, gated features, and required permissions in TableBoost.

| Endpoint Path | Methods | Gated Feature | Allowed Roles |
| :--- | :--- | :--- | :--- |
| `/api/auth/login` | POST | None | STAFF, MANAGER, OWNER |
| `/api/auth/logout` | POST | None | STAFF, MANAGER, OWNER |
| `/api/auth/me` | GET | None | STAFF, MANAGER, OWNER |
| `/api/auth/profile` | GET, PUT | None | STAFF, MANAGER, OWNER |
| `/api/auth/change-password` | POST | None | STAFF, MANAGER, OWNER |
| `/api/auth/subscription` | POST | None | OWNER |
| `/api/visits/` | GET | None | MANAGER, OWNER |
| `/api/visits/` | POST | None | STAFF, MANAGER, OWNER |
| `/api/customers/` | GET | None | MANAGER, OWNER |
| `/api/customers/{id}` | GET, PATCH | None | STAFF, MANAGER, OWNER |
| `/api/customers/{id}/visits` | GET | None | STAFF, MANAGER, OWNER |
| `/api/dashboard/` | GET | None | MANAGER, OWNER |
| `/api/messages/` | GET | campaigns | MANAGER, OWNER |
| `/api/messages/campaign` | POST | campaigns | MANAGER, OWNER |
| `/api/messages/campaign/audience-count` | GET | campaigns | MANAGER, OWNER |
| `/api/settings/` | GET, POST | None | OWNER |
| `/api/loyalty/rewards` | GET | loyalty | STAFF, MANAGER, OWNER |
| `/api/loyalty/rewards` | POST | loyalty | MANAGER, OWNER |
| `/api/loyalty/rewards/{id}` | PATCH | loyalty | MANAGER, OWNER |
| `/api/loyalty/status/{id}` | GET | loyalty | STAFF, MANAGER, OWNER |
| `/api/loyalty/redeem/{c_id}/{r_id}` | POST | loyalty | STAFF, MANAGER, OWNER |
| `/api/loyalty/history/{id}` | GET | loyalty | STAFF, MANAGER, OWNER |
| `/api/automation/` | GET, POST | automation | OWNER |
| `/api/intelligence/growth` | GET | intelligence | MANAGER, OWNER |
| `/api/intelligence/customer/{id}` | GET | intelligence | MANAGER, OWNER |
| `/api/intelligence/campaigns` | GET | intelligence | MANAGER, OWNER |
| `/api/intelligence/campaigns/{id}/customers` | GET | intelligence | MANAGER, OWNER |
| `/api/intelligence/rewards` | GET | intelligence | MANAGER, OWNER |
| `/api/intelligence/rewards/customers` | GET | intelligence | MANAGER, OWNER |
| `/api/intelligence/rewards/{id}/customers` | GET | intelligence | MANAGER, OWNER |
| `/api/intelligence/automations` | GET | intelligence | MANAGER, OWNER |
| `/api/intelligence/summaries` | GET | intelligence | MANAGER, OWNER |
| `/api/intelligence/recommendations` | GET | intelligence | MANAGER, OWNER |
| `/api/intelligence/recommendations/{id}/dismiss` | POST | intelligence | MANAGER, OWNER |
| `/api/governance/audit` | GET | governance | OWNER |
| `/api/governance/operational` | GET | governance | MANAGER, OWNER |
