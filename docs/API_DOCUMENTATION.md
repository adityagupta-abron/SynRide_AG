# SynRide — REST API Specification & Endpoint Documentation

The SynRide backend API is built with **FastAPI** in Python 3.12, providing high-performance, asynchronous endpoints connected directly to Oracle AI Database 26ai Free via `python-oracledb`.

**Interactive API Documentation:** `http://127.0.0.1:8000/docs` (Swagger UI)  
**Alternative Redoc:** `http://127.0.0.1:8000/redoc`  
**Base API Prefix:** `/api`

---

## 1. Authentication & Account Management (`/api/auth`)

All secured endpoints require the HTTP Header:  
`Authorization: Bearer <jwt_access_token>`

### 1.1 `POST /api/auth/register`
Initiates account registration for eligible VIT members. Sends simulated 6-digit OTP.
- **Request Body:**
  ```json
  {
    "full_name": "Rohan Sharma",
    "email": "rohan.sharma2023@vitstudent.ac.in",
    "password": "SecurePassword123",
    "user_role": "STUDENT",
    "registration_no": "23BCE1001",
    "programme": "B.Tech CSE",
    "study_year": 2
  }
  ```
- **Validation Rules:**
  - `email` must end in `@vitstudent.ac.in` for `STUDENT` or `@vit.ac.in` for `FACULTY`.
  - Passwords hashed using `bcrypt` (work factor 12).
- **Responses:**
  - `200 OK`: `{"status": "OTP_SENT", "email": "...", "expires_in_minutes": 10}`
  - `400 Bad Request`: Email already registered or invalid institutional domain.

### 1.2 `POST /api/auth/verify-otp`
Verifies registration OTP and activates the account.
- **Request Body:**
  ```json
  {
    "email": "rohan.sharma2023@vitstudent.ac.in",
    "otp": "839201"
  }
  ```
- **Responses:**
  - `200 OK`: `{"access_token": "ey...", "token_type": "bearer", "user": {...}}`
  - `400 Bad Request`: Invalid OTP or maximum attempts exceeded.

### 1.3 `POST /api/auth/login`
Authenticates user using email and password.
- **Request Body:**
  ```json
  {
    "email": "admin@vit.ac.in",
    "password": "Admin@123"
  }
  ```
- **Responses:**
  - `200 OK`: `{"access_token": "ey...", "token_type": "bearer", "user": {...}}`
  - `401 Unauthorized`: Invalid credentials.

### 1.4 `GET /api/auth/profile` *(Protected)*
Fetches full profile (joining supertype and student/faculty subtypes from `V_USER_PROFILES`).

### 1.5 `POST /api/auth/change-email` *(Protected)*
Requests email change. Max 3 changes per 24 hours. Valid for 24 hours.

### 1.6 `POST /api/auth/verify-email-change` *(Protected)*
Verifies OTP sent to the pending new institutional email.

---

## 2. Ride Requests & Routes (`/api/rides`)

### 2.1 `GET /api/rides/routes`
Returns all active predefined route fares and estimated travel durations from `ROUTE_FARE`.
- **Response:**
  ```json
  [
    {
      "route_id": 1,
      "pickup_location": "VIT Main Gate",
      "destination": "Katpadi Railway Station",
      "estimated_fare": 250.0,
      "estimated_duration_minutes": 25,
      "is_active": "Y"
    }
  ]
  ```

### 2.2 `POST /api/rides/requests` *(Protected)*
Creates a new ride request or vehicle-arranged ride intent.
- **Request Body:**
  ```json
  {
    "request_type": "LOOKING_FOR_COMPANIONS",
    "pickup_location": "VIT Main Gate",
    "destination": "Katpadi Railway Station",
    "departure_time": "2026-10-20T10:00:00"
  }
  ```

### 2.3 `GET /api/rides/match` *(Protected)*
Discovers companion requests with identical pickup & destination and departure time within ±15 minutes.
- **Query Params:** `pickup`, `destination`, `departure_time`

---

## 3. Ride Groups & Lifecycle (`/api/groups`)

### 3.1 `GET /api/groups`
Lists active ride groups with filter support (`status`, `pickup`, `destination`). Queries `V_ACTIVE_RIDE_GROUPS`.

### 3.2 `POST /api/groups` *(Protected)*
Creates a ride group from an existing request or standalone vehicle arrangement.

### 3.3 `GET /api/groups/{id}`
Returns complete group metadata, including coordinator, confirmed passenger count, deadline countdown, and members list from `V_RIDE_GROUP_MEMBERS_DETAIL`.

### 3.4 `POST /api/groups/{id}/join` *(Protected)*
Invokes PL/SQL stored procedure `JOIN_RIDE_GROUP`.
- **Concurrency & Integrity:**
  - Acquires row lock on group.
  - Verifies current count < 3.
  - Prevents duplicate active memberships.
  - Automatically provisions `RIDE_CONFIRMATION` record for new passenger.

### 3.5 `POST /api/groups/{id}/cancel` *(Protected)*
Cancels passenger participation or coordinator role.
- **60-Minute Business Rule:**
  - If cancellation occurs $\le 60$ minutes before departure, automatically sets `ADMIN_REVIEW_REQUIRED = 'Y'`.
  - If coordinator cancels, invokes `REPLACE_COORDINATOR` to promote earliest-joined eligible passenger.

### 3.6 `POST /api/groups/{id}/complete` *(Protected)*
Marks ride as `COMPLETED`. Only coordinator or administrator can trigger normal completion.

---

## 4. Confirmation Workflow (`/api/confirmations`)

### 4.1 `POST /api/confirmations/groups/{id}/set-deadline` *(Protected)*
Sets a 10-minute confirmation window via `SET_CONFIRMATION_DEADLINE`.

### 4.2 `POST /api/confirmations/{membership_id}/confirm` *(Protected)*
Records explicit confirmation for a participant via `RECORD_RIDE_CONFIRMATION`.

### 4.3 `POST /api/confirmations/{membership_id}/decline` *(Protected)*
Records explicit refusal via `DECLINE_RIDE_CONFIRMATION`.

### 4.4 `POST /api/confirmations/groups/{id}/confirm-group` *(Protected)*
Evaluates whether 100% of active members have confirmed. If verified, sets group to `CONFIRMED`.

### 4.5 `POST /api/confirmations/groups/{id}/check-expiry` *(Protected)*
Expires group if deadline has passed and unconfirmed members remain.

---

## 5. Fare Estimation & Allocation (`/api/fares`)

### 5.1 `POST /api/fares/groups/{id}/allocate` *(Protected)*
Coordinator submits actual fare.
- **Request Body:** `{"actual_fare": 300.0}`
- **Discrepancy Check:** Flags for review if actual fare differs by >25% from initial estimate.
- **Remainder Rule:** Shares split equally using integer floor, and any rounding remainder is added to coordinator's share.
- **Response:**
  ```json
  {
    "actual_fare": 300.0,
    "shares": [
      {"membership_id": 1, "role": "COORDINATOR", "share_amount": 100.0},
      {"membership_id": 2, "role": "PASSENGER", "share_amount": 100.0},
      {"membership_id": 3, "role": "PASSENGER", "share_amount": 100.0}
    ],
    "discrepancy_flagged": false
  }
  ```

### 5.2 `PATCH /api/fares/shares/{id}/status` *(Protected)*
Updates simulated payment status (`PENDING`, `PAID`, `FAILED`, `DISPUTED`).

---

## 6. Ratings & Peer Reviews (`/api/ratings`)

### 6.1 `POST /api/ratings` *(Protected)*
Submits peer review (1-5 stars) for a completed ride.
- **Validation:** Ride must be `COMPLETED`. Self-rating strictly disallowed. Exactly 1 rating per pair per group.

### 6.2 `GET /api/ratings/user/{id}/summary`
Fetches user's average rating and total reviews received from `V_USER_RATINGS_SUMMARY`.

---

## 7. Disciplinary & Dispute Reports (`/api/reports`)

### 7.1 `POST /api/reports` *(Protected)*
Files a report against a fellow participant or coordinator.

### 7.2 `GET /api/reports/group/{id}` *(Protected)*
Returns reports associated with a specific ride group.

---

## 8. In-App Notifications (`/api/notifications`)

### 8.1 `GET /api/notifications` *(Protected)*
Fetches recent notifications for the logged-in user.

### 8.2 `PATCH /api/notifications/{id}/read` *(Protected)*
Marks notification as read.

### 8.3 `GET /api/notifications/preferences` *(Protected)*
Fetches email dispatch preferences (`email_enabled`: `'Y'`/`'N'`).

### 8.4 `PUT /api/notifications/preferences` *(Protected)*
Updates email toggle.

---

## 9. Administrator Portal (`/api/admin`) *(Admin Role Required)*

### 9.1 `GET /api/admin/stats`
Returns system statistics (total users, active groups, completed rides, open reports, flagged cancellations).

### 9.2 `GET /api/admin/users`
Lists all registered users with role and status.

### 9.3 `GET /api/admin/review-queue`
Queries `V_ADMIN_REVIEW_QUEUE` for unhandled reports and late cancellation flags.

### 9.4 `POST /api/admin/reports/{id}/resolve`
Resolves or dismisses a report. **Requires mandatory `admin_outcome_note`**.
