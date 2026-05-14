# TableBoost – Phase 3 Architecture
# Customer Retention & Loyalty Engine

Version: 1.0

---

# 📌 PHASE 3 OBJECTIVE

Phase 3 transforms TableBoost from:

- Customer Engagement Platform

into:

👉 Customer Retention & Loyalty Platform

The primary goal is:

- Increase customer retention
- Encourage repeat visits
- Build customer loyalty habits
- Track reward redemption history

---

# 🧠 CORE PHASE 3 CONCEPT

The loyalty system revolves around:

Customer → Visits → Loyalty Progress → Reward Eligibility → Reward Redemption

The system must remain:

- Simple
- Operationally lightweight
- Mobile-first
- Easy for restaurant staff

---

# 🎯 PHASE 3 BUSINESS GOALS

The restaurant owner should be able to:

- Configure loyalty rewards
- Reward repeat customers
- Track reward redemption history
- See loyalty progress
- Encourage repeat visits

---

# ❌ OUT OF SCOPE

DO NOT implement:

- Points wallet
- Tier systems
- Customer mobile app
- QR code scanning
- Multi-location loyalty
- AI-based recommendations
- Advanced gamification
- Referral systems

---

# 🧱 CORE DOMAIN EXTENSIONS

Existing entities:
- Customer
- Visit
- Message
- Campaign

New Phase 3 entities:
- Loyalty Rule
- Loyalty Progress
- Reward Redemption

---

# 🧩 LOYALTY SYSTEM DESIGN

---

# 1. Loyalty Rule

Defines how rewards are earned.

Example:
5 visits → Free Drink

---

## Responsibilities

- Configure reward threshold
- Configure reward description
- Define active loyalty rule

---

## Constraints

Phase 3 supports:
- ONE active loyalty rule only

Reason:
- Simpler UX
- Easier operations
- Avoid staff confusion

---

# 2. Loyalty Progress

Tracks customer progress toward reward.

Example:
3 / 5 visits completed

---

## Behavior

When customer visit added:
- Loyalty progress recalculated
- Eligibility checked automatically

---

# 3. Reward Eligibility

When threshold reached:
- Customer becomes eligible
- Reward becomes redeemable

---

## Example

Required Visits: 5
Customer Visits: 5

→ Reward Available

---

# 4. Reward Redemption

Restaurant staff can:
- Mark reward as redeemed

Redemption should:
- Reset loyalty progress appropriately
- Create redemption history record

---

# 5. Redemption History

ALL redeemed rewards must be stored historically.

Example:

| Date | Reward | Trigger |
|------|--------|---------|
| Jan 5 | Free Drink | 5 Visits |
| Feb 20 | Free Dessert | 10 Visits |

---

# 🗄️ ABSTRACT DATA MODEL

---

# LoyaltyRule

Purpose:
Defines reward configuration.

Fields:
- id
- reward_name
- reward_description
- required_visits
- is_active
- created_at

---

# LoyaltyProgress

Purpose:
Tracks customer progress.

Fields:
- customer_id
- current_visits
- eligible_reward
- updated_at

---

# RewardRedemption

Purpose:
Stores immutable redemption history.

Fields:
- id
- customer_id
- loyalty_rule_id
- reward_name_snapshot
- redeemed_at
- triggered_by_visits

---

# 🔄 LOYALTY LIFECYCLE

---

# Step 1 – Customer Visit

Customer visit recorded.

---

# Step 2 – Progress Update

System recalculates:
- total visits
- loyalty progress

---

# Step 3 – Eligibility Detection

If threshold reached:
- reward marked available

---

# Step 4 – Reward Redemption

Staff redeems reward.

---

# Step 5 – Redemption History

System stores redemption record.

---

# 🎨 FRONTEND ARCHITECTURE

---

# 1. Loyalty Settings Screen

New settings section:

## Loyalty Preferences

Fields:
- Reward Name
- Reward Description
- Required Visits

---

# 2. Customer Loyalty View

Customer detail screen should display:

---

## Loyalty Progress

Example:
3 / 5 visits completed

---

## Reward Status

Example:
🎁 Free Drink available

---

## Redemption History

Example:
Jan 5 → Free Drink redeemed

---

# 3. Reward Redemption UI

Staff should be able to:

- Redeem reward in one click

Requirements:
- Simple
- Fast
- Mobile-friendly

---

# 📱 UX REQUIREMENTS

The loyalty experience must:

- Work on iPhone
- Work on MacBook
- Be understandable instantly
- Require minimal training

---

# 🎯 UX PRINCIPLES

- Simple reward system
- Clear progress
- Clear redemption state
- No clutter
- No gaming complexity

---

# 🔧 BACKEND ARCHITECTURE

---

# New Backend Responsibilities

---

## Loyalty Service

Responsible for:
- Progress calculation
- Eligibility checks
- Redemption handling

---

## Reward Redemption Logic

Responsible for:
- Creating redemption records
- Resetting eligibility
- Preserving history

---

# 📊 DASHBOARD EXTENSIONS

Add lightweight retention metrics.

---

# Loyalty Metrics

Examples:
- Customers near reward
- Rewards redeemed
- Repeat customer rate

---

# ⚠️ IMPORTANT BUSINESS RULES

---

# 1. Redemption History is Immutable

Never overwrite redemption history.

Always:
- Create new redemption record

---

# 2. Single Active Rule

Phase 3 supports:
- only one active loyalty rule

Reason:
- Operational simplicity

---

# 3. Loyalty Must Be Visit-Based

DO NOT introduce:
- points
- spending-based rewards
- tiers

Yet.

---

# 🧪 TESTING REQUIREMENTS

---

# Backend Tests

Must cover:
- Progress calculation
- Eligibility detection
- Reward redemption
- Redemption history creation
- Edge cases

---

# Frontend Tests

Must cover:
- Loyalty settings
- Progress rendering
- Reward redemption flow
- Redemption history rendering

---

# 📈 PERFORMANCE REQUIREMENTS

Ensure:
- Loyalty calculations are efficient
- Customer detail page remains fast
- Redemption history paginated if large

---

# 🧹 CODE QUALITY RULES

Ensure:
- No architecture redesign
- No duplicated loyalty logic
- No dead code
- No unnecessary abstractions
- No frontend lint issues
- No TypeScript/build issues

---

# 🚀 PHASE 3 SUCCESS CRITERIA

Phase 3 is COMPLETE only if:

- Loyalty rules configurable
- Customer progress tracked
- Rewards automatically detected
- Rewards redeemable
- Redemption history visible
- Mobile UX works well
- Tests pass
- Existing Phase 1 & 2 features remain stable

---

# 🧠 FINAL PRODUCT EVOLUTION

Phase 1:
Operational Tracking

↓

Phase 2:
Customer Engagement

↓

Phase 3:
Customer Retention & Loyalty

---

# 🔥 FINAL PRINCIPLE

Phase 3 should feel:

👉 Simple enough for restaurant staff
while
👉 Powerful enough to increase repeat visits consistently