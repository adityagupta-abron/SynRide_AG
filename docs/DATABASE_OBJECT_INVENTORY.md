# SynRide — Oracle Database Object Inventory

**Database Image:** Oracle AI Database 26ai Free  
**Container:** `oracle-free-lite` (Podman / WSL2)  
**Pluggable Database Service:** `FREEPDB1`  
**Schema Username:** `SYNRIDE`  
**Default Tablespace:** `SYNRIDE_DATA`  
**Connection Mode:** Dedicated / Proxy (`SYSTEM[SYNRIDE]`)

---

## 1. Tables (18 Objects)

| Table Name | Primary Key | Foreign Keys | Unique Constraints | Check Constraints |
|---|---|---|---|---|
| `APP_USER` | `user_id` | None | `email` | `user_role IN ('STUDENT','FACULTY','ADMIN')`<br>`account_status IN ('ACTIVE','SUSPENDED','CLOSED')` |
| `STUDENT_PROFILE` | `user_id` | `user_id` -> `APP_USER(user_id)` | `registration_no` | `study_year BETWEEN 1 AND 5` |
| `FACULTY_PROFILE` | `user_id` | `user_id` -> `APP_USER(user_id)` | `employee_id` | `staff_category IN ('TEACHING','NON_TEACHING')` |
| `USER_EMAIL_ACCOUNT` | `email_account_id` | `user_id` -> `APP_USER(user_id)` | `user_id` | None |
| `USER_EMAIL_VERIFICATION` | `verification_id` | `user_id` -> `APP_USER(user_id)` | None | `verification_type IN ('REGISTRATION','EMAIL_CHANGE')`<br>`status IN ('PENDING','VERIFIED','EXPIRED','BLOCKED')` |
| `EMAIL_PREFERENCE` | `preference_id` | `user_id` -> `APP_USER(user_id)` | `user_id` | `email_enabled IN ('Y','N')` |
| `ROUTE_FARE` | `route_id` | None | `(pickup_location, destination)` | `estimated_fare >= 0`<br>`estimated_duration_minutes > 0`<br>`is_active IN ('Y','N')` |
| `RIDE_REQUEST` | `request_id` | `requester_id` -> `APP_USER(user_id)` | None | `request_type IN ('LOOKING_FOR_COMPANIONS','VEHICLE_ARRANGED')`<br>`request_status IN ('ACTIVE','MATCHED','CANCELLED','EXPIRED')` |
| `RIDE_GROUP` | `group_id` | `request_id` -> `RIDE_REQUEST(request_id)`<br>`coordinator_id` -> `APP_USER(user_id)` | None | `group_status IN ('PENDING','CONFIRMED','COMPLETED','CANCELLED','EXPIRED','CLOSED')`<br>`estimated_fare >= 0`<br>`actual_fare >= 0` |
| `RIDE_GROUP_MEMBER` | `membership_id` | `group_id` -> `RIDE_GROUP(group_id)`<br>`user_id` -> `APP_USER(user_id)` | `UQ_ACTIVE_GROUP_MEMBER` (function-based) | `member_role IN ('COORDINATOR','PASSENGER')`<br>`membership_status IN ('PENDING','CONFIRMED','CANCELLED','LEFT')` |
| `RIDE_CONFIRMATION` | `confirmation_id` | `membership_id` -> `RIDE_GROUP_MEMBER(membership_id)` | `membership_id` | `confirmation_status IN ('PENDING','CONFIRMED','DECLINED')` |
| `FARE_SHARE` | `fare_share_id` | `group_id` -> `RIDE_GROUP(group_id)`<br>`membership_id` -> `RIDE_GROUP_MEMBER(membership_id)` | `membership_id` | `share_amount >= 0`<br>`payment_status IN ('PENDING','PAID','FAILED','DISPUTED')` |
| `RIDE_CANCELLATION` | `cancellation_id` | `group_id` -> `RIDE_GROUP(group_id)`<br>`cancelled_by` -> `APP_USER(user_id)` | None | `type IN ('MEMBER_WITHDRAWAL','COORDINATOR_CANCEL','AUTO_EXPIRY')`<br>`admin_review_required IN ('Y','N')`<br>`review_status IN ('PENDING','REVIEWED','DISMISSED')` |
| `RIDE_RATING` | `rating_id` | `group_id` -> `RIDE_GROUP(group_id)`<br>`reviewer_membership_id` -> `RIDE_GROUP_MEMBER(membership_id)`<br>`reviewed_membership_id` -> `RIDE_GROUP_MEMBER(membership_id)` | `(group_id, reviewer_membership_id, reviewed_membership_id)` | `rating BETWEEN 1 AND 5`<br>`reviewer_membership_id != reviewed_membership_id` |
| `RIDE_REPORT` | `report_id` | `group_id` -> `RIDE_GROUP(group_id)`<br>`reporter_id` -> `APP_USER(user_id)`<br>`reported_user_id` -> `APP_USER(user_id)` | None | `report_status IN ('PENDING','UNDER_REVIEW','RESOLVED','DISMISSED')` |
| `ADMIN_REVIEW` | `review_id` | `group_id` -> `RIDE_GROUP(group_id)`<br>`cancellation_id` -> `RIDE_CANCELLATION(cancellation_id)`<br>`report_id` -> `RIDE_REPORT(report_id)`<br>`assigned_admin_id` -> `APP_USER(user_id)` | None | `status IN ('OPEN','IN_PROGRESS','RESOLVED','DISMISSED')` |
| `APP_NOTIFICATION` | `notification_id` | `user_id` -> `APP_USER(user_id)`<br>`group_id` -> `RIDE_GROUP(group_id)` | None | `is_read IN ('Y','N')` |
| `EMAIL_DELIVERY_LOG` | `email_log_id` | `notification_id` -> `APP_NOTIFICATION(notification_id)`<br>`recipient_user_id` -> `APP_USER(user_id)` | None | `delivery_status IN ('QUEUED','SENT','FAILED')` |

---

## 2. Views (5 Objects)

All views are compiled and verified `VALID` in `FREEPDB1`.

### 2.1 `V_USER_PROFILES`
Joins `APP_USER` with `STUDENT_PROFILE` and `FACULTY_PROFILE`.
- **Columns:** `user_id`, `full_name`, `email`, `user_role`, `account_status`, `created_at`, `registration_no`, `programme`, `study_year`, `employee_id`, `staff_category`, `department`.

### 2.2 `V_ACTIVE_RIDE_GROUPS`
Combines `RIDE_GROUP`, `RIDE_REQUEST`, coordinator user attributes, and passenger count aggregation.
- **Columns:** `group_id`, `request_id`, `coordinator_id`, `coordinator_name`, `coordinator_email`, `departure_time`, `group_status`, `estimated_fare`, `actual_fare`, `confirmation_deadline`, `pickup_location`, `destination`, `request_type`, `member_count`.

### 2.3 `V_RIDE_GROUP_MEMBERS_DETAIL`
Combines `RIDE_GROUP_MEMBER`, `APP_USER`, and `RIDE_CONFIRMATION` to display live membership status and explicit confirmation state.
- **Columns:** `membership_id`, `group_id`, `user_id`, `full_name`, `email`, `member_role`, `membership_status`, `joined_at`, `confirmation_status`, `confirmed_at`.

### 2.4 `V_USER_RATINGS_SUMMARY`
Aggregates peer feedback received by each user.
- **Columns:** `user_id`, `full_name`, `email`, `total_ratings_received`, `avg_rating`.

### 2.5 `V_ADMIN_REVIEW_QUEUE`
Union queue surfacing unresolved disciplinary reports and flagged cancellations requiring administrator attention.
- **Columns:** `item_type`, `source_id`, `group_id`, `initiator_id`, `target_user_id`, `reason`, `details`, `created_at`.

---

## 3. Stored Procedures and Functions (8 Objects)

All procedures and functions are compiled and verified `VALID`.

| Procedure Name | Parameter Signature | Description & Transaction Boundary |
|---|---|---|
| `JOIN_RIDE_GROUP` | `(p_group_id IN NUMBER, p_user_id IN NUMBER, p_membership_id OUT NUMBER)` | Locks group with `SELECT ... FOR UPDATE`, checks capacity `< 3`, verifies user is not already active, inserts membership with role `'PASSENGER'`, inserts pending confirmation record. Raises `ORA-20001` if full. Leaves `COMMIT`/`ROLLBACK` to caller. |
| `SET_CONFIRMATION_DEADLINE` | `(p_group_id IN NUMBER, p_minutes IN NUMBER DEFAULT 10)` | Updates `RIDE_GROUP.confirmation_deadline = SYSTIMESTAMP + INTERVAL p_minutes MINUTE`. |
| `RECORD_RIDE_CONFIRMATION` | `(p_membership_id IN NUMBER)` | Sets `confirmation_status = 'CONFIRMED'` and `confirmed_at = SYSTIMESTAMP`. |
| `DECLINE_RIDE_CONFIRMATION` | `(p_membership_id IN NUMBER)` | Sets `confirmation_status = 'DECLINED'` and `membership_status = 'CANCELLED'`. Explicit refusal does not immediately destroy group; allows coordinator to observe state. |
| `CONFIRM_RIDE_GROUP` | `(p_group_id IN NUMBER, p_success OUT CHAR)` | Validates that **every** active member has confirmed (`COUNT(PENDING) = 0` and `COUNT(CONFIRMED) = member_count`). If verified, transitions group to `'CONFIRMED'`. Returns `'Y'` or `'N'`. |
| `EXPIRE_UNCONFIRMED_GROUP` | `(p_group_id IN NUMBER)` | Marks `group_status = 'EXPIRED'` if `confirmation_deadline < SYSTIMESTAMP` and unconfirmed members remain. |
| `REPLACE_COORDINATOR` | `(p_group_id IN NUMBER, p_old_coordinator_id IN NUMBER, p_new_coordinator_id OUT NUMBER)` | If coordinator cancels, selects earliest-joined eligible active passenger (ordered by `joined_at ASC, membership_id ASC`) and promotes to coordinator. If no passenger remains, marks group as `'CANCELLED'`. |
| `CALCULATE_AND_ALLOCATE_FARE` | `(p_group_id IN NUMBER, p_actual_fare IN NUMBER)` | Updates `actual_fare`, queries active members, computes integer floor share (`FLOOR(actual_fare / member_count)`), and allocates rounding remainder to coordinator. Inserts rows into `FARE_SHARE`. |

---

## 4. Database User and Security Privileges

- **Direct User:** `SYNRIDE`
- **Proxy Authentication:**
  ```sql
  ALTER USER SYNRIDE GRANT CONNECT THROUGH SYSTEM;
  ```
- **Connection String:**
  ```
  SYSTEM[SYNRIDE]/<pwd>@localhost:1521/FREEPDB1
  ```
- **Table Privileges:** Full DML and DDL privileges on schema `SYNRIDE` restricted to authenticated application transactions.
