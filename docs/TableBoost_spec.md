# TableBoost – Product Specification

For: Bowie Fusion Kitchen (Bowie, TX, USA)

---

# 📌 1. Overview

**TableBoost** is a mobile-friendly web application designed to help restaurants:

- Capture customer data
- Track visits
- Increase repeat customers
- Improve online reviews
- Run simple marketing campaigns

Primary goal: **Increase restaurant revenue without changing operations**

---

# 🎯 2. Core Concept

The system revolves around a single entity:

> **Customer (identified by phone number)**

All features are built on top of:
- Customers
- Visits
- Messages

---

# 👤 3. Users

### Primary Users
- Restaurant Owner
- Billing Staff

### Characteristics
- Non-technical
- Uses iPhone or browser
- Needs fast interaction (<5 seconds)

---

# 📱 4. Platform

- Web application (no installation)
- Mobile-first design
- Works on iPhone and Mac browser

---

# 🧩 5. Functional Specification

---

## 5.1 Customer Management

- Create customer using phone number
- Avoid duplicate customers
- Optional name field
- View customer list
- View customer details

---

## 5.2 Visit Tracking

- Record each visit
- Link visit to customer
- Optional amount field
- Maintain visit history

---

## 5.3 Review Automation

- Send review request after visit
- Configurable message template
- Optional auto-send toggle

---

## 5.4 Campaign Messaging

- Write promotional message
- Select audience:
  - All customers
  - Inactive customers
- Send bulk messages

---

## 5.5 Messaging Logs

- Store all messages
- Track status:
  - Sent
  - Failed

---

## 5.6 Dashboard

Display:
- Total customers
- Total visits
- Repeat customers
- Recent activity

---

## 5.7 Settings

- Review message template
- Auto-send toggle

---

# 🔄 6. Core Flows

---

## 6.1 Add Visit

User:
- Enters phone number
- Clicks save

System:
- Creates/updates customer
- Records visit
- Sends review message (optional)

---

## 6.2 Campaign

User:
- Writes message
- Selects audience
- Sends

System:
- Fetches customers
- Sends messages
- Logs results

---

## 6.3 View Customers

User:
- Opens customer list

System:
- Shows visit count
- Shows last visit

---

## 6.4 Dashboard

User:
- Opens home screen

System:
- Displays key metrics
- Shows recent activity

---

# 🧠 7. Business Rules

---

## Customer Rules
- Phone number is unique
- Same phone = same customer

---

## Visit Rules
- Every visit must belong to a customer

---

## Messaging Rules
- All messages must be logged
- Failures must be tracked

---

## Campaign Rules
- Message cannot be empty
- Confirmation required before sending

---

# 🚀 8. Phase-wise Plan

---

## Phase 1 – Foundation
- Customer capture
- Visit tracking
- Review SMS
- Dashboard

---

## Phase 2 – Engagement
- Customer listing
- Campaign messaging
- Message logs

---

## Phase 3 – Retention
- Loyalty system
- Rewards

---

## Phase 4 – Optimization
- Advanced analytics
- Smart targeting

---

# ⚙️ 9. Technical Specification (Abstract)

---

## 9.1 Architecture

Frontend → Backend → Database → SMS Service

---

## 9.2 Backend

- Language: Python
- Framework: FastAPI
- Responsibilities:
  - Business logic
  - API handling
  - Messaging integration

---

## 9.3 Frontend

- Framework: React (Next.js)
- Styling: Tailwind CSS
- Requirements:
  - Mobile-first
  - Fast interaction
  - Simple UI

---

## 9.4 Database

- Type: Relational (PostgreSQL)

### Core Entities:

#### Customers
- phone (unique)
- name
- created_at

#### Visits
- customer reference
- visit date
- amount

#### Messages
- customer reference
- message text
- type (review/campaign)
- status

#### Campaigns
- message text
- target type

---

## 9.5 External Integration

- SMS provider (e.g., Twilio)

---

## 9.6 System Behavior

- Create customer if not exists
- Prevent duplicate phone entries
- Log all messages
- Handle failures gracefully

---

# 📱 10. UX Requirements

- Mobile-first design
- Minimal inputs
- Fast actions (<5 seconds)
- Clean UI
- No learning curve

---

# ⚠️ 11. Constraints

- No authentication (Phase 1)
- No POS integration
- No ordering system
- Keep system simple

---

# 📊 12. Success Metrics

- Increase repeat customers
- Increase total visits
- Increase review count
- Increase revenue

---

# ✅ 13. Final Note

This system is designed to be:

- Simple to use
- Fast to build
- Easy to scale
- Focused on revenue impact

---
