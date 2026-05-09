# TableBoost Architecture Document

## 1. High-Level Architecture

- **Frontend**: Next.js (React) application, optimized for mobile browsers. Communicates with the backend via REST APIs.
- **Backend**: FastAPI (Python) service. Handles core business logic, data persistence, and external service integrations.
- **Database**: PostgreSQL database for reliable relational data storage.
- **External Services**: SMS Gateway (e.g., Twilio, AWS SNS) for sending review text messages.

**Data Flow**:
1. User (Restaurant Staff) interacts with the Frontend (Mobile UI).
2. Frontend sends JSON payloads via HTTP requests to the FastAPI Backend.
3. FastAPI validates requests, interacts with PostgreSQL via an ORM (e.g., SQLAlchemy/SQLModel), and returns JSON responses.
4. If SMS sending is requested, FastAPI asynchronously calls the external SMS Gateway.

---

## 2. Backend Structure

The backend follows a modular, feature-based structure to ensure it remains AI-friendly, simple, and easy to extend.

- **`customers/`**: Handles customer lookup, creation, and profile management.
- **`visits/`**: Manages visit logging, retrieving recent visits, and aggregating visit statistics.
- **`messaging/`**: Encapsulates external SMS logic, formatting message templates, and logging sent messages.
- **`dashboard/`**: Aggregates data from customers and visits to provide quick top-level stats.
- **`settings/`**: Manages global configuration such as the SMS review template and auto-send toggle.

*Note: Each module will contain its own routes, database models, and service logic to maintain clear, independent boundaries.*

---

## 3. Data Model (Abstract)

### Customer
- `id` (Primary Key)
- `phone_number` (String, Unique, Indexed for fast lookup)
- `name` (String, Optional)
- `created_at` (Timestamp)

### Visit
- `id` (Primary Key)
- `customer_id` (Foreign Key -> Customer)
- `amount` (Decimal, Optional)
- `visited_at` (Timestamp, Indexed for recent queries)

### Message
- `id` (Primary Key)
- `customer_id` (Foreign Key -> Customer)
- `message_text` (String)
- `type` (String - e.g., 'review', 'campaign')
- `status` (String - e.g., 'sent', 'failed')
- `sent_at` (Timestamp)

---

## 4. API Design (Abstract)

### Add Visit
- **Purpose**: Logs a new visit. Creates a customer on the fly if the phone number does not already exist.
- **Endpoint**: `POST /api/visits`
- **Inputs**: 
  - `phone_number` (Required, string)
  - `name` (Optional, string)
  - `amount` (Optional, decimal)
  - `send_sms` (Optional, boolean)
- **Outputs**: 
  - `visit_id` (UUID/Integer)
  - `customer_id` (UUID/Integer)
  - `message_status` (String, if `send_sms` was true)

### Get Dashboard
- **Purpose**: Retrieves core statistics and recent visits for the dashboard view.
- **Endpoint**: `GET /api/dashboard`
- **Inputs**: None
- **Outputs**:
  - `total_customers` (Integer)
  - `total_visits` (Integer)
  - `repeat_customers` (Integer)
  - `recent_visits` (List of objects containing: `customer_name`, `phone_number`, `visited_at`, `amount`)

### Get/Update Settings
- **Purpose**: Manage the review SMS template and auto-send preference.
- **Endpoints**: `GET /api/settings`, `POST /api/settings`
- **Inputs (POST)**: 
  - `review_message_template` (String)
  - `auto_send_sms` (Boolean)
- **Outputs**: 
  - `review_message_template` (String)
  - `auto_send_sms` (Boolean)

---

## 5. Frontend Structure

### Screens
1. **Home / Dashboard Screen**
   - **Responsibilities**: Display top-level metrics (`Total Customers`, `Total Visits`) and a feed of `Recent Visits`.
2. **Add Visit Screen**
   - **Responsibilities**: Provide a fast, mobile-optimized form to input `phone_number`, `name`, `amount`, and a toggle for "Send Review SMS". Submit data to the API and show a success confirmation.

### Components
- **Stats Card**: Reusable widget for displaying aggregate numbers.
- **Visit List Item**: Reusable row displaying details of a past visit.
- **Mobile Number Input**: Optimized number input component for fast entry on mobile devices.

---

## 6. Future Extensibility Notes

### Campaign Messaging (Phase 2)
- **How to Support**: The `messaging` module is already isolated. We can easily introduce a `Campaign` entity and a `POST /api/campaigns` endpoint that pulls segments from the `Customer` table and queues SMS tasks, directly reusing the core SMS utility without touching the Visit logic.

### Loyalty System (Phase 3)
- **How to Support**: Since `Visit` and `Customer` are clearly defined, we can add a `points` column to `Customer` or calculate points dynamically by summing up `Visit.amount`. A new `loyalty` module can wrap this business logic without requiring any redesign of the core logging mechanism.
