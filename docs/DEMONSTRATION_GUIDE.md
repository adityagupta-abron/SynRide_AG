# SynRide — University Project & Viva Demonstration Guide

This guide provides a step-by-step demonstration walkthrough for viva examinations, academic project reviews, and portfolio presentations. It showcases the integration between **React TypeScript**, **FastAPI**, and **Oracle AI Database 26ai Free**.

---

## 1. Credentials Reference

| Role | Email | Password | Purpose |
|---|---|---|---|
| **System Administrator** | `admin@vit.ac.in` | `Admin@123` | Admin dashboard, review queue, route fares, user management |
| **Coordinator (User 1)** | `test.coordinator@synride.example` | *(Dev fixture)* | Coordinator of preserved Group 1 |
| **Passenger 1 (User 2)** | `test.passenger1@synride.example` | *(Dev fixture)* | Passenger in Group 1 |
| **Passenger 2 (User 3)** | `test.passenger2@synride.example` | *(Dev fixture)* | Passenger in Group 1 |
| **Passenger 3 (User 21)** | `test.passenger3@synride.example` | *(Dev fixture)* | Additional passenger fixture |

> **Note on Student Registration:** You can register any new student account using an institutional email like `yourname2024@vitstudent.ac.in` and password `Password@123`.

---

## 2. Startup Instructions

### Terminal 1: FastAPI Backend
```powershell
cd c:\Users\HP\Desktop\SynRide\SynRide_AG\backend
# (Activate python environment if using venv)
python -m uvicorn app.main:app --host 127.0.0.1 --port 8005 --reload
```
- API Docs live at: `http://127.0.0.1:8005/docs`

### Terminal 2: Vite React Frontend
```powershell
cd c:\Users\HP\Desktop\SynRide\SynRide_AG\frontend
npm run dev
```
- Web Application live at: `http://localhost:5173`

---

## 3. Demonstration Scenarios for Viva / Evaluators

### Scenario 1: Registration & Institutional Domain Security
1. Navigate to `http://localhost:5173` and click **Register**.
2. **Demonstrate Domain Enforcement:**
   - Attempt to register with `testuser@gmail.com` as a Student.
   - *Observation:* The system displays a validation error: *"Students must use a @vitstudent.ac.in institutional email."*
3. **Valid Registration:**
   - Enter `arjun.kumar2024@vitstudent.ac.in`, Full Name: `Arjun Kumar`, Password: `Password@123`, Reg No: `24BCE2041`, Programme: `B.Tech CSE`, Year: `2`.
   - Submit registration.
   - *Observation:* SynRide hashes the password via `bcrypt`, generates a 6-digit cryptographic OTP, and prompts for OTP entry.
4. **OTP Verification:**
   - Enter OTP (the dev simulation displays the OTP code directly on screen for testing convenience).
   - Click **Verify & Complete Registration**.
   - *Result:* JWT session token issued; redirected to user dashboard.

---

### Scenario 2: EER Specialization & Views in Action
**Evaluator Question:** *"How did you implement the EER User supertype/subtypes in Oracle?"*
1. Open Oracle SQL Developer or run Python script:
   ```sql
   SELECT user_id, full_name, email, user_role, registration_no, employee_id
   FROM V_USER_PROFILES
   WHERE user_id IN (1, 22);
   ```
2. **Explain Design:**
   - `APP_USER` is the generalized supertype table.
   - `STUDENT_PROFILE` and `FACULTY_PROFILE` are specialized subtype tables with foreign keys referencing `APP_USER(user_id) ON DELETE CASCADE`.
   - The academic view `V_USER_PROFILES` performs outer joins to seamlessly present unified profiles.

---

### Scenario 3: Group Capacity Limit & Row-Level Locking
**Evaluator Question:** *"How do you prevent more than 3 passengers from joining concurrently?"*
1. Explain the PL/SQL Stored Procedure `JOIN_RIDE_GROUP`:
   ```sql
   SELECT COUNT(*) INTO v_current_members
   FROM RIDE_GROUP_MEMBER
   WHERE group_id = p_group_id
     AND membership_status IN ('PENDING', 'CONFIRMED')
   FOR UPDATE; -- Row-level lock prevents race conditions

   IF v_current_members >= 3 THEN
       RAISE_APPLICATION_ERROR(-20001, 'Group is full. Maximum 3 members allowed.');
   END IF;
   ```
2. Show Pytest Automated Proof:
   - Run `pytest -k test_oracle_stored_procedure_join_capacity_enforcement` in `backend/`.
   - The test proves that a 4th join attempt is immediately rejected with `ORA-20001`.

---

### Scenario 4: Exact Fare Split & Rounding Remainder
**Evaluator Question:** *"What happens when an odd fare like ₹250 cannot be divided evenly among 3 passengers?"*
1. Explain the mathematical rule:
   - Base share: $\lfloor 250 / 3 \rfloor = ₹83.00$.
   - Rounding remainder: $250 - (83 \times 3) = ₹1.00$.
   - The coordinator receives the remainder: Coordinator pays ₹84.00, Passenger 1 pays ₹83.00, Passenger 2 pays ₹83.00.
   - Total shares: $84 + 83 + 83 = ₹250.00$ (100% exact reconciliation, zero discrepancy).
2. Show Pytest Automated Proof:
   - Run `pytest -k test_fare_allocation_calculation_exact_shares` in `backend/`.

---

### Scenario 5: 60-Minute Cancellation Rule & Coordinator Replacement
**Evaluator Question:** *"What happens if the coordinator cancels, or a passenger cancels shortly before departure?"*
1. **60-Minute Rule:**
   - If a member cancels $\le 60$ minutes before scheduled departure, the system records `ADMIN_REVIEW_REQUIRED = 'Y'` in `RIDE_CANCELLATION` to prevent abuse.
2. **Coordinator Replacement:**
   - When the coordinator cancels, PL/SQL procedure `REPLACE_COORDINATOR` promotes the earliest-joined active passenger (ordered by `joined_at ASC, membership_id ASC`) to become the new group coordinator.

---

### Scenario 6: Administrator Review Queue & Resolution Note
1. Log in to SynRide with Admin credentials: `admin@vit.ac.in` / `Admin@123`.
2. Navigate to **Admin Dashboard**.
3. View **Escalations & Review Queue** (populated by `V_ADMIN_REVIEW_QUEUE`).
4. Resolve an item:
   - Provide the mandatory **Resolution Outcome Note** (the system enforces that administrators must provide a justification before resolving).
   - Submit resolution.
   - *Result:* Status transitions to `RESOLVED` with timestamp in `ADMIN_REVIEW`.

---

## 4. Quick Verification Query Sheet for Evaluators

Execute these queries in Oracle SQL Developer to demonstrate DBMS integrity:

```sql
-- 1. Check Compiled PL/SQL Procedures
SELECT object_name, object_type, status 
FROM user_objects 
WHERE object_type IN ('PROCEDURE', 'VIEW')
ORDER BY object_type, object_name;

-- 2. Inspect Preserved Group 1
SELECT * FROM V_ACTIVE_RIDE_GROUPS WHERE group_id = 1;

-- 3. Inspect Preserved Group 1 Members & Live Confirmations
SELECT * FROM V_RIDE_GROUP_MEMBERS_DETAIL WHERE group_id = 1;

-- 4. Check Seeded Campus Routes
SELECT route_id, pickup_location, destination, estimated_fare, estimated_duration_minutes 
FROM ROUTE_FARE 
WHERE is_active = 'Y';
```
