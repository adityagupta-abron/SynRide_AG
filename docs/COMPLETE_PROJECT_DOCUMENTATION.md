# SynRide — Complete Master Project Documentation & Codebase Audit

**Project Name:** SynRide — Campus Ride-Pooling Coordination Platform  
**Target Institution:** Vellore Institute of Technology (VIT), Vellore  
**Database System:** Oracle AI Database 26ai Free (`FREEPDB1`) on Linux container (WSL2 Podman)  
**Backend Framework:** FastAPI (Python 3.12, `python-oracledb` Thin Native Mode)  
**Frontend Framework:** React 19, TypeScript 5.9, Vite 8.3, Tailwind CSS 3.4  
**Audit & Verification Date:** October 28, 2026  
**Automated Test Status:** 21 / 21 Tests Passed (100% Pass Rate)  
**Frontend Build Status:** Clean Exit (0 Errors, 1938 Modules Transformed)  

---

## Table of Contents
1. [Executive Summary & High-Level Architecture](#1-executive-summary--high-level-architecture)
2. [Complete Database Object Catalog (A to Z)](#2-complete-database-object-catalog-a-to-z)
   - 2.1 [Database Configuration & DCL Security Architecture](#21-database-configuration--dcl-security-architecture)
   - 2.2 [The 18 Relational Tables (Full DDL Specifications)](#22-the-18-relational-tables-full-ddl-specifications)
   - 2.3 [The 5 Academic SQL Views](#23-the-5-academic-sql-views)
   - 2.4 [The 8 PL/SQL Stored Procedures & Functions](#24-the-8-plsql-stored-procedures--functions)
   - 2.5 [Indexes, Check Constraints & Integrity Rules](#25-indexes-check-constraints--integrity-rules)
3. [EER Modeling, Specialization & Normalization Analysis](#3-eer-modeling-specialization--normalization-analysis)
   - 3.1 [Supertype / Subtype Specialization Hierarchy](#31-supertype--subtype-specialization-hierarchy)
   - 3.2 [Conceptual EER Diagram](#32-conceptual-eer-diagram)
   - 3.3 [Formal Normalization Analysis (1NF, 2NF, 3NF)](#33-formal-normalization-analysis-1nf-2nf-3nf)
4. [Backend API Architecture & REST Specification](#4-backend-api-architecture--rest-specification)
   - 4.1 [FastAPI Core, Lifespan & Connection Pool](#41-fastapi-core-lifespan--connection-pool)
   - 4.2 [Pydantic Schemas & Data Contracts](#42-pydantic-schemas--data-contracts)
   - 4.3 [Repository Layer & Parameterized Execution](#43-repository-layer--parameterized-execution)
   - 4.4 [Complete REST API Endpoint Catalog](#44-complete-rest-api-endpoint-catalog)
5. [Frontend Architecture & Component Catalog](#5-frontend-architecture--component-catalog)
   - 5.1 [Design System & Tailwind Configuration](#51-design-system--tailwind-configuration)
   - 5.2 [Authentication Context & State Management](#52-authentication-context--state-management)
   - 5.3 [API Service Integration Client](#53-api-service-integration-client)
   - 5.4 [Page Views & Modal Workflows](#54-page-views--modal-workflows)
   - 5.5 [Reusable UI Components](#55-reusable-ui-components)
6. [Security, Cryptography & Institutional Policies](#6-security-cryptography--institutional-policies)
   - 6.1 [Institutional Domain Validation](#61-institutional-domain-validation)
   - 6.2 [Password Security & Bcrypt Work Factor](#62-password-security--bcrypt-work-factor)
   - 6.3 [Salted Cryptographic OTP Lifecycle & Throttling](#63-salted-cryptographic-otp-lifecycle--throttling)
   - 6.4 [JWT Access Token Architecture & Role Guards](#64-jwt-access-token-architecture--role-guards)
7. [Core Business Logic & Algorithmic Rules](#7-core-business-logic--algorithmic-rules)
   - 7.1 [Concurrent Group Capacity (Max 3 Members)](#71-concurrent-group-capacity-max-3-members)
   - 7.2 [100% Confirmation Window & Expiry](#72-100-confirmation-window--expiry)
   - 7.3 [Automatic Coordinator Replacement Succession](#73-automatic-coordinator-replacement-succession)
   - 7.4 [60-Minute Cancellation Penalty Flagging](#74-60-minute-cancellation-penalty-flagging)
   - 7.5 [Exact Fare Split Formula & Coordinator Remainder](#75-exact-fare-split-formula--coordinator-remainder)
   - 7.6 [25% Fare Discrepancy Auditing](#76-25-fare-discrepancy-auditing)
   - 7.7 [Peer Rating Anonymity & Anti-Self-Rating](#77-peer-rating-anonymity--anti-self-rating)
   - 7.8 [Administrator Disciplinary Review & Mandatory Outcome Notes](#78-administrator-disciplinary-review--mandatory-outcome-notes)
8. [Testing, Verification & Quality Assurance Report](#8-testing-verification--quality-assurance-report)
   - 8.1 [Pytest Automated Suite (21/21 Pass Details)](#81-pytest-automated-suite-2121-pass-details)
   - 8.2 [Live End-to-End User Acceptance Test (UAT) Suite](#82-live-end-to-end-user-acceptance-test-uat-suite)
   - 8.3 [TypeScript Compiler & Vite Production Build Audit](#83-typescript-compiler--vite-production-build-audit)
9. [Comprehensive Documentation Currency & Audit Report](#9-comprehensive-documentation-currency--audit-report)
   - 9.1 [Audit Methodology](#91-audit-methodology)
   - 9.2 [Discrepancies Found in Existing Docs](#92-discrepancies-found-in-existing-docs)
   - 9.3 [Currency Verification Table](#93-currency-verification-table)
   - 9.4 [Actionable Recommendations](#94-actionable-recommendations)

---

## 1. Executive Summary & High-Level Architecture

SynRide is a production-grade campus ride-pooling coordination platform built specifically for Vellore Institute of Technology (VIT). It connects campus commuters (students and faculty/staff) traveling between VIT Vellore campus and primary transit destinations (Katpadi Railway Station, Chennai Airport, Bengaluru Airport, CMC Hospital, Vellore New Bus Stand, etc.).

```
┌────────────────────────────────────────────────────────────────────────┐
│                        PRESENTATION TIER                               │
│              React 19 + TypeScript 5.9 + Vite 8.3                      │
│            Tailwind CSS 3.4 (Lucide Icons, Glassmorphic UI)            │
│               Running on Local Dev Server (Port 5173)                  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / JSON REST
                                    │ Bearer JWT Authentication
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        APPLICATION TIER                                │
│                   FastAPI Backend (Python 3.12)                        │
│                 Uvicorn ASGI Server (Port 8005)                        │
│  ├── Domain Routers: Auth, Rides, Groups, Fares, Ratings, Admin        │
│  ├── Security Engine: Bcrypt (WF 12), PyJWT, Salted SHA-256 OTP        │
│  ├── Repositories: Direct Parameterized SQL (Zero ORM overhead)        │
│  └── Connection Pool: Thread-safe python-oracledb Thin Mode            │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Native Thin Wire Protocol (Port 1521)
                                    │ Current Schema: SYNRIDE
                                    │ Connection Identity: SYNRIDE_APP
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                         DATA STORAGE TIER                              │
│              Oracle AI Database 26ai Free (Release 23.26)              │
│                  Service: FREEPDB1 / Port 1521                         │
│  ├── 18 Relational Tables (1NF -> 2NF -> 3NF Normalized)               │
│  ├── 5 Complex Relational Views (Outer Joins & Aggregations)           │
│  ├── 8 PL/SQL Stored Procedures & Functions                            │
│  ├── Function-Based Unique Indexes & Granular Check Constraints        │
│  └── DCL Least-Privilege Security (Role: RL_SYNRIDE_APP, 31 Synonyms)  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Complete Database Object Catalog (A to Z)

### 2.1 Database Configuration & DCL Security Architecture
- **DBMS Version:** Oracle AI Database 26ai Free Release 23.26.3.0.0 (Develop, Learn, and Run for Free)
- **Container Host:** WSL2 Ubuntu running rootless Podman (`oracle-free-lite`, Image: `container-registry.oracle.com/database/free:latest-lite`)
- **Pluggable Database:** `FREEPDB1`
- **Schema Owner:** `SYNRIDE`
- **Application User:** `SYNRIDE_APP`
- **Application Role:** `RL_SYNRIDE_APP`
- **Data Tablespace:** `SYNRIDE_DATA`
- **Security Hardening (`06_security_hardening_app_user.sql`):** Direct administrative `SYSTEM` proxy access is revoked. `SYNRIDE_APP` holds explicit DML privileges on the 18 tables, `SELECT` on all 5 views, and `EXECUTE` on all 8 procedures via `RL_SYNRIDE_APP`. 31 private synonyms in `SYNRIDE_APP` permit unqualified SQL query execution against `SYNRIDE.*`.

---

### 2.2 The 18 Relational Tables (Full DDL Specifications)

#### 1. `APP_USER` (Supertype Entity)
Stores baseline identity, credentials, role classification, and account status.
- `USER_ID`: `NUMBER` GENERATED BY DEFAULT AS IDENTITY — **PRIMARY KEY**
- `FULL_NAME`: `VARCHAR2(100)` NOT NULL
- `EMAIL`: `VARCHAR2(254)` NOT NULL — **UNIQUE** (`UQ_APP_USER_EMAIL`)
- `PASSWORD_HASH`: `VARCHAR2(255)` NOT NULL (Bcrypt work factor 12)
- `USER_ROLE`: `VARCHAR2(20)` NOT NULL — **CHECK** (`USER_ROLE IN ('STUDENT', 'FACULTY', 'ADMIN')`)
- `ACCOUNT_STATUS`: `VARCHAR2(20)` DEFAULT `'ACTIVE'` NOT NULL — **CHECK** (`ACCOUNT_STATUS IN ('ACTIVE', 'SUSPENDED', 'CLOSED')`)
- `CREATED_AT`: `TIMESTAMP(6)` DEFAULT SYSTIMESTAMP NOT NULL

#### 2. `STUDENT_PROFILE` (Subtype Entity)
Specialized matriculation details for student commuters.
- `USER_ID`: `NUMBER` — **PRIMARY KEY**, **FOREIGN KEY** REFERENCES `APP_USER(USER_ID)` ON DELETE CASCADE
- `REGISTRATION_NO`: `VARCHAR2(30)` NOT NULL — **UNIQUE** (`UQ_STUDENT_REGISTRATION`)
- `PROGRAMME`: `VARCHAR2(100)`
- `STUDY_YEAR`: `NUMBER(1)` — **CHECK** (`STUDY_YEAR BETWEEN 1 AND 6`)

#### 3. `FACULTY_PROFILE` (Subtype Entity)
Specialized institutional details for teaching and administrative university staff.
- `USER_ID`: `NUMBER` — **PRIMARY KEY**, **FOREIGN KEY** REFERENCES `APP_USER(USER_ID)` ON DELETE CASCADE
- `EMPLOYEE_ID`: `VARCHAR2(30)` NOT NULL — **UNIQUE** (`UQ_FACULTY_EMPLOYEE`)
- `STAFF_CATEGORY`: `VARCHAR2(20)` NOT NULL — **CHECK** (`STAFF_CATEGORY IN ('TEACHING', 'NON_TEACHING')`)
- `DEPARTMENT`: `VARCHAR2(100)`

#### 4. `RIDE_REQUEST`
Intent to commute submitted by a campus member.
- `REQUEST_ID`: `NUMBER` GENERATED BY DEFAULT AS IDENTITY — **PRIMARY KEY**
- `REQUESTER_ID`: `NUMBER` NOT NULL — **FOREIGN KEY** REFERENCES `APP_USER(USER_ID)`
- `REQUEST_TYPE`: `VARCHAR2(30)` NOT NULL — **CHECK** (`REQUEST_TYPE IN ('LOOKING_FOR_COMPANIONS', 'VEHICLE_ARRANGED')`)
- `PICKUP_LOCATION`: `VARCHAR2(200)` NOT NULL
- `DESTINATION`: `VARCHAR2(200)` NOT NULL
- `DEPARTURE_TIME`: `TIMESTAMP(6)` NOT NULL
- `REQUEST_STATUS`: `VARCHAR2(20)` DEFAULT `'OPEN'` NOT NULL — **CHECK** (`REQUEST_STATUS IN ('OPEN', 'MATCHED', 'CANCELLED', 'CLOSED')`)
- `CREATED_AT`: `TIMESTAMP(6)` DEFAULT SYSTIMESTAMP NOT NULL
- **Constraint:** `CK_REQUEST_LOCATIONS` CHECK (`PICKUP_LOCATION <> DESTINATION`)

#### 5. `RIDE_GROUP`
Active ride pool container managing passengers, timing, and lifecycle status.
- `GROUP_ID`: `NUMBER` GENERATED BY DEFAULT AS IDENTITY — **PRIMARY KEY**
- `REQUEST_ID`: `NUMBER` NOT NULL — **FOREIGN KEY** REFERENCES `RIDE_REQUEST(REQUEST_ID)`
- `COORDINATOR_ID`: `NUMBER` NOT NULL — **FOREIGN KEY** REFERENCES `APP_USER(USER_ID)`
- `DEPARTURE_TIME`: `TIMESTAMP(6)` NOT NULL
- `GROUP_STATUS`: `VARCHAR2(20)` DEFAULT `'PENDING'` NOT NULL — **CHECK** (`GROUP_STATUS IN ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'EXPIRED', 'CLOSED')`)
- `ESTIMATED_FARE`: `NUMBER(10,2)` — **CHECK** (`ESTIMATED_FARE IS NULL OR ESTIMATED_FARE >= 0`)
- `ACTUAL_FARE`: `NUMBER(10,2)` — **CHECK** (`ACTUAL_FARE IS NULL OR ACTUAL_FARE >= 0`)
- `CONFIRMATION_DEADLINE`: `TIMESTAMP(6)`
- `CREATED_AT`: `TIMESTAMP(6)` DEFAULT SYSTIMESTAMP NOT NULL

#### 6. `RIDE_GROUP_MEMBER`
Enrollment junction table tracking member roles and live participation status.
- `MEMBERSHIP_ID`: `NUMBER` GENERATED BY DEFAULT AS IDENTITY — **PRIMARY KEY**
- `GROUP_ID`: `NUMBER` NOT NULL — **FOREIGN KEY** REFERENCES `RIDE_GROUP(GROUP_ID)`
- `USER_ID`: `NUMBER` NOT NULL — **FOREIGN KEY** REFERENCES `APP_USER(USER_ID)`
- `MEMBER_ROLE`: `VARCHAR2(20)` DEFAULT `'PASSENGER'` NOT NULL — **CHECK** (`MEMBER_ROLE IN ('COORDINATOR', 'PASSENGER')`)
- `MEMBERSHIP_STATUS`: `VARCHAR2(20)` DEFAULT `'PENDING'` NOT NULL — **CHECK** (`MEMBERSHIP_STATUS IN ('PENDING', 'CONFIRMED', 'CANCELLED', 'LEFT')`)
- `JOINED_AT`: `TIMESTAMP(6)` DEFAULT SYSTIMESTAMP NOT NULL
- **Function-Based Unique Index:** `UQ_ACTIVE_GROUP_MEMBER` on:
  ```sql
  (CASE MEMBERSHIP_STATUS WHEN 'PENDING' THEN GROUP_ID WHEN 'CONFIRMED' THEN GROUP_ID END,
   CASE MEMBERSHIP_STATUS WHEN 'PENDING' THEN USER_ID WHEN 'CONFIRMED' THEN USER_ID END)
  ```

#### 7. `ROUTE_FARE`
Predefined benchmark catalog of campus transit routes, standard fares, and typical durations.
- `ROUTE_ID`: `NUMBER` GENERATED BY DEFAULT AS IDENTITY — **PRIMARY KEY**
- `PICKUP_LOCATION`: `VARCHAR2(200)` NOT NULL
- `DESTINATION`: `VARCHAR2(200)` NOT NULL
- `ESTIMATED_FARE`: `NUMBER(10,2)` NOT NULL — **CHECK** (`ESTIMATED_FARE >= 0`)
- `ESTIMATED_DURATION_MINUTES`: `NUMBER(5)` — **CHECK** (`ESTIMATED_DURATION_MINUTES IS NULL OR ESTIMATED_DURATION_MINUTES > 0`)
- `IS_ACTIVE`: `CHAR(1)` DEFAULT `'Y'` NOT NULL — **CHECK** (`IS_ACTIVE IN ('Y', 'N')`)
- `UPDATED_AT`: `TIMESTAMP(6)` DEFAULT SYSTIMESTAMP NOT NULL
- **Constraint:** `UQ_ROUTE_FARE` UNIQUE (`PICKUP_LOCATION`, `DESTINATION`)
- **Constraint:** `CK_ROUTE_LOCATIONS` CHECK (`PICKUP_LOCATION <> DESTINATION`)

#### 8. `RIDE_CONFIRMATION`
Member confirmation voting ledger tracking individual commitments prior to departure.
- `CONFIRMATION_ID`: `NUMBER` GENERATED BY DEFAULT AS IDENTITY — **PRIMARY KEY**
- `MEMBERSHIP_ID`: `NUMBER` NOT NULL — **FOREIGN KEY** REFERENCES `RIDE_GROUP_MEMBER(MEMBERSHIP_ID)` — **UNIQUE** (`UQ_CONFIRMATION_MEMBER`)
- `CONFIRMATION_STATUS`: `VARCHAR2(20)` DEFAULT `'PENDING'` NOT NULL — **CHECK** (`CONFIRMATION_STATUS IN ('PENDING', 'CONFIRMED', 'DECLINED', 'EXPIRED')`)
- `CONFIRMED_AT`: `TIMESTAMP(6)`
- `CREATED_AT`: `TIMESTAMP(6)` DEFAULT SYSTIMESTAMP NOT NULL

#### 9. `FARE_SHARE`
Exact individual mathematical split allocation for completed rides.
- `FARE_SHARE_ID`: `NUMBER` GENERATED BY DEFAULT AS IDENTITY — **PRIMARY KEY**
- `GROUP_ID`: `NUMBER` NOT NULL — **FOREIGN KEY** REFERENCES `RIDE_GROUP(GROUP_ID)`
- `MEMBERSHIP_ID`: `NUMBER` NOT NULL — **FOREIGN KEY** REFERENCES `RIDE_GROUP_MEMBER(MEMBERSHIP_ID)` — **UNIQUE** (`UQ_FARE_SHARE_MEMBER`)
- `SHARE_AMOUNT`: `NUMBER(10,2)` NOT NULL — **CHECK** (`SHARE_AMOUNT >= 0`)
- `PAYMENT_STATUS`: `VARCHAR2(20)` DEFAULT `'PENDING'` NOT NULL — **CHECK** (`PAYMENT_STATUS IN ('PENDING', 'PAID', 'FAILED', 'DISPUTED')`)
- `CREATED_AT`: `TIMESTAMP(6)` DEFAULT SYSTIMESTAMP NOT NULL

#### 10. `RIDE_CANCELLATION`
Disciplinary and administrative audit log for member withdrawals and coordinator cancellations.
- `CANCELLATION_ID`: `NUMBER` GENERATED BY DEFAULT AS IDENTITY — **PRIMARY KEY**
- `GROUP_ID`: `NUMBER` NOT NULL — **FOREIGN KEY** REFERENCES `RIDE_GROUP(GROUP_ID)`
- `CANCELLED_BY`: `NUMBER` NOT NULL — **FOREIGN KEY** REFERENCES `APP_USER(USER_ID)`
- `CANCELLATION_REASON`: `VARCHAR2(500)` NOT NULL
- `CANCELLATION_TYPE`: `VARCHAR2(20)` NOT NULL — **CHECK** (`CANCELLATION_TYPE IN ('USER', 'COORDINATOR', 'ADMIN')`)
- `CANCELLED_AT`: `TIMESTAMP(6)` DEFAULT SYSTIMESTAMP NOT NULL
- `ADMIN_REVIEW_REQUIRED`: `CHAR(1)` DEFAULT `'N'` NOT NULL — **CHECK** (`ADMIN_REVIEW_REQUIRED IN ('Y', 'N')`)
- `REVIEW_STATUS`: `VARCHAR2(20)` DEFAULT `'NOT_REQUIRED'` NOT NULL — **CHECK** (`REVIEW_STATUS IN ('NOT_REQUIRED', 'PENDING', 'UNDER_REVIEW', 'RESOLVED')`)

#### 11. `RIDE_RATING`
Post-trip peer evaluation table enforcing 1-to-5 star ratings and preventing self-evaluation.
- `RATING_ID`: `NUMBER` GENERATED BY DEFAULT AS IDENTITY — **PRIMARY KEY**
- `GROUP_ID`: `NUMBER` NOT NULL — **FOREIGN KEY** REFERENCES `RIDE_GROUP(GROUP_ID)`
- `REVIEWER_MEMBERSHIP_ID`: `NUMBER` NOT NULL — **FOREIGN KEY** REFERENCES `RIDE_GROUP_MEMBER(MEMBERSHIP_ID)`
- `REVIEWED_MEMBERSHIP_ID`: `NUMBER` NOT NULL — **FOREIGN KEY** REFERENCES `RIDE_GROUP_MEMBER(MEMBERSHIP_ID)`
- `RATING`: `NUMBER(1)` NOT NULL — **CHECK** (`RATING BETWEEN 1 AND 5`)
- `REVIEW_TEXT`: `VARCHAR2(1000)`
- `CREATED_AT`: `TIMESTAMP(6)` DEFAULT SYSTIMESTAMP NOT NULL
- **Constraint:** `CK_RATING_DIFFERENT_USERS` CHECK (`REVIEWER_MEMBERSHIP_ID <> REVIEWED_MEMBERSHIP_ID`)
- **Constraint:** `UQ_RATING_REVIEW` UNIQUE (`GROUP_ID`, `REVIEWER_MEMBERSHIP_ID`, `REVIEWED_MEMBERSHIP_ID`)

#### 12. `RIDE_REPORT`
Formal incident and misconduct reporting table with mandatory outcome auditing.
- `REPORT_ID`: `NUMBER` GENERATED BY DEFAULT AS IDENTITY — **PRIMARY KEY**
- `GROUP_ID`: `NUMBER` — **FOREIGN KEY** REFERENCES `RIDE_GROUP(GROUP_ID)`
- `REPORTER_ID`: `NUMBER` NOT NULL — **FOREIGN KEY** REFERENCES `APP_USER(USER_ID)`
- `REPORTED_USER_ID`: `NUMBER` — **FOREIGN KEY** REFERENCES `APP_USER(USER_ID)`
- `REPORT_REASON`: `VARCHAR2(100)` NOT NULL
- `DESCRIPTION`: `VARCHAR2(1000)`
- `REPORT_STATUS`: `VARCHAR2(20)` DEFAULT `'PENDING'` NOT NULL — **CHECK** (`REPORT_STATUS IN ('PENDING', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED')`)
- `ADMIN_OUTCOME_NOTE`: `VARCHAR2(1000)`
- `CREATED_AT`: `TIMESTAMP(6)` DEFAULT SYSTIMESTAMP NOT NULL
- `RESOLVED_AT`: `TIMESTAMP(6)`
- **Constraint:** `CK_REPORT_NOT_SELF` CHECK (`REPORTED_USER_ID IS NULL OR REPORTER_ID <> REPORTED_USER_ID`)
- **Constraint:** `CK_REPORT_OUTCOME_NOTE` CHECK (`REPORT_STATUS NOT IN ('RESOLVED', 'DISMISSED') OR ADMIN_OUTCOME_NOTE IS NOT NULL`)

#### 13. `APP_NOTIFICATION`
Internal notification queue for real-time in-app alerts.
- `NOTIFICATION_ID`: `NUMBER` GENERATED BY DEFAULT AS IDENTITY — **PRIMARY KEY**
- `USER_ID`: `NUMBER` NOT NULL — **FOREIGN KEY** REFERENCES `APP_USER(USER_ID)`
- `GROUP_ID`: `NUMBER` — **FOREIGN KEY** REFERENCES `RIDE_GROUP(GROUP_ID)`
- `NOTIFICATION_TYPE`: `VARCHAR2(50)` NOT NULL
- `MESSAGE`: `VARCHAR2(1000)` NOT NULL
- `IS_READ`: `CHAR(1)` DEFAULT `'N'` NOT NULL — **CHECK** (`IS_READ IN ('Y', 'N')`)
- `CREATED_AT`: `TIMESTAMP(6)` DEFAULT SYSTIMESTAMP NOT NULL

#### 14. `EMAIL_PREFERENCE`
User-level notification delivery preferences.
- `PREFERENCE_ID`: `NUMBER` GENERATED BY DEFAULT AS IDENTITY — **PRIMARY KEY**
- `USER_ID`: `NUMBER` NOT NULL — **FOREIGN KEY** REFERENCES `APP_USER(USER_ID)` — **UNIQUE** (`UQ_EMAIL_PREFERENCE_USER`)
- `EMAIL_ENABLED`: `CHAR(1)` DEFAULT `'Y'` NOT NULL — **CHECK** (`EMAIL_ENABLED IN ('Y', 'N')`)
- `UPDATED_AT`: `TIMESTAMP(6)` DEFAULT SYSTIMESTAMP NOT NULL

#### 15. `EMAIL_DELIVERY_LOG`
Outbox delivery ledger for email dispatches with retry scheduling.
- `EMAIL_LOG_ID`: `NUMBER` GENERATED BY DEFAULT AS IDENTITY — **PRIMARY KEY**
- `NOTIFICATION_ID`: `NUMBER` — **FOREIGN KEY** REFERENCES `APP_NOTIFICATION(NOTIFICATION_ID)`
- `RECIPIENT_USER_ID`: `NUMBER` NOT NULL — **FOREIGN KEY** REFERENCES `APP_USER(USER_ID)`
- `EMAIL_SUBJECT`: `VARCHAR2(255)` NOT NULL
- `ATTEMPT_COUNT`: `NUMBER(1)` DEFAULT 0 NOT NULL — **CHECK** (`ATTEMPT_COUNT BETWEEN 0 AND 3`)
- `DELIVERY_STATUS`: `VARCHAR2(20)` DEFAULT `'PENDING'` NOT NULL — **CHECK** (`DELIVERY_STATUS IN ('PENDING', 'SENT', 'FAILED', 'RETRY_SCHEDULED')`)
- `LAST_ATTEMPT_AT`: `TIMESTAMP(6)`
- `NEXT_RETRY_AT`: `TIMESTAMP(6)`
- `ERROR_MESSAGE`: `VARCHAR2(1000)`
- `CREATED_AT`: `TIMESTAMP(6)` DEFAULT SYSTIMESTAMP NOT NULL

#### 16. `USER_EMAIL_VERIFICATION`
Cryptographic OTP verification challenge table with attempt counters and expiry.
- `VERIFICATION_ID`: `NUMBER` GENERATED BY DEFAULT AS IDENTITY — **PRIMARY KEY**
- `USER_ID`: `NUMBER` — **FOREIGN KEY** REFERENCES `APP_USER(USER_ID)`
- `EMAIL_ADDRESS`: `VARCHAR2(254)` NOT NULL
- `VERIFICATION_TYPE`: `VARCHAR2(20)` NOT NULL — **CHECK** (`VERIFICATION_TYPE IN ('REGISTRATION', 'EMAIL_CHANGE')`)
- `OTP_HASH`: `VARCHAR2(255)` NOT NULL (Salted SHA-256)
- `EXPIRES_AT`: `TIMESTAMP(6)` NOT NULL
- `FAILED_ATTEMPTS`: `NUMBER(2)` DEFAULT 0 NOT NULL — **CHECK** (`FAILED_ATTEMPTS BETWEEN 0 AND 5`)
- `VERIFICATION_STATUS`: `VARCHAR2(20)` DEFAULT `'PENDING'` NOT NULL — **CHECK** (`VERIFICATION_STATUS IN ('PENDING', 'VERIFIED', 'EXPIRED', 'BLOCKED', 'INVALIDATED')`)
- `CREATED_AT`: `TIMESTAMP(6)` DEFAULT SYSTIMESTAMP NOT NULL

#### 17. `USER_EMAIL_ACCOUNT`
Verified institutional email registry tracking pending 24-hour change requests.
- `EMAIL_ACCOUNT_ID`: `NUMBER` GENERATED BY DEFAULT AS IDENTITY — **PRIMARY KEY**
- `USER_ID`: `NUMBER` NOT NULL — **FOREIGN KEY** REFERENCES `APP_USER(USER_ID)` — **UNIQUE** (`UQ_EMAIL_ACCOUNT_USER`)
- `VERIFIED_EMAIL`: `VARCHAR2(254)` NOT NULL — **UNIQUE** (`UQ_VERIFIED_EMAIL`)
- `PENDING_EMAIL`: `VARCHAR2(254)`
- `PENDING_EMAIL_EXPIRES_AT`: `TIMESTAMP(6)`
- `EMAIL_VERIFIED_AT`: `TIMESTAMP(6)` DEFAULT SYSTIMESTAMP NOT NULL
- `UPDATED_AT`: `TIMESTAMP(6)` DEFAULT SYSTIMESTAMP NOT NULL
- **Constraint:** `CK_EMAIL_CHANGE_DIFFERENT` CHECK (`PENDING_EMAIL IS NULL OR PENDING_EMAIL <> VERIFIED_EMAIL`)

#### 18. `ADMIN_REVIEW`
Centralized administrator review and disciplinary queue.
- `REVIEW_ID`: `NUMBER` GENERATED BY DEFAULT AS IDENTITY — **PRIMARY KEY**
- `GROUP_ID`: `NUMBER` — **FOREIGN KEY** REFERENCES `RIDE_GROUP(GROUP_ID)`
- `CANCELLATION_ID`: `NUMBER` — **FOREIGN KEY** REFERENCES `RIDE_CANCELLATION(CANCELLATION_ID)`
- `REPORT_ID`: `NUMBER` — **FOREIGN KEY** REFERENCES `RIDE_REPORT(REPORT_ID)`
- `ASSIGNED_ADMIN_ID`: `NUMBER` — **FOREIGN KEY** REFERENCES `APP_USER(USER_ID)`
- `REVIEW_REASON`: `VARCHAR2(200)` NOT NULL
- `REVIEW_STATUS`: `VARCHAR2(20)` DEFAULT `'PENDING'` NOT NULL — **CHECK** (`REVIEW_STATUS IN ('PENDING', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED')`)
- `OUTCOME_NOTE`: `VARCHAR2(1000)`
- `CREATED_AT`: `TIMESTAMP(6)` DEFAULT SYSTIMESTAMP NOT NULL
- `REVIEWED_AT`: `TIMESTAMP(6)`

---

### 2.3 The 5 Academic SQL Views

#### 1. `V_USER_PROFILES`
Demonstrates outer-join specialization modeling (EER Supertype/Subtype mapping):
```sql
SELECT u.user_id, u.full_name, u.email, u.user_role, u.account_status, u.created_at,
       CASE WHEN s.user_id IS NOT NULL THEN 'STUDENT'
            WHEN f.user_id IS NOT NULL THEN 'FACULTY'
            ELSE 'ADMIN' END AS profile_type,
       COALESCE(s.registration_no, f.employee_id, 'N/A') AS institutional_id,
       s.programme, s.study_year, f.staff_category, f.department
FROM APP_USER u
LEFT JOIN STUDENT_PROFILE s ON u.user_id = s.user_id
LEFT JOIN FACULTY_PROFILE f ON u.user_id = f.user_id;
```

#### 2. `V_ACTIVE_RIDE_GROUPS`
Consolidates active ride groups with coordinator identity, route parameters, and live member aggregations:
- Columns: `group_id`, `request_id`, `request_type`, `pickup_location`, `destination`, `departure_time`, `group_status`, `estimated_fare`, `actual_fare`, `confirmation_deadline`, `created_at`, `coordinator_id`, `coordinator_name`, `coordinator_email`, `estimated_duration_minutes`, `active_member_count`, `confirmed_member_count`.

#### 3. `V_RIDE_GROUP_MEMBERS_DETAIL`
Combines `RIDE_GROUP_MEMBER`, `APP_USER`, `RIDE_CONFIRMATION`, and `FARE_SHARE` to expose live member status, roles, confirmation timestamps, and individual fare splits.

#### 4. `V_USER_RATINGS_SUMMARY`
Aggregates peer ratings per user: average rating (`ROUND(AVG(rating), 2)`), total reviews count, and star-by-star breakdown (1 to 5 stars).

#### 5. `V_ADMIN_REVIEW_QUEUE`
Consolidates open incident reports and late cancellation flags with full relational context (reporter, reported party, cancelling user, group ID, and reason).

---

### 2.4 The 8 PL/SQL Stored Procedures & Functions

| Stored Procedure | Parameter Signature | Logic & Exceptions |
|---|---|---|
| `JOIN_RIDE_GROUP` | `(p_group_id IN NUMBER, p_user_id IN NUMBER, p_membership_id OUT NUMBER)` | Acquires row lock via `SELECT FOR UPDATE` on `RIDE_GROUP`. Validates status is `PENDING` (`ORA-20001`). Verifies user is active (`ORA-20002`). Rejects duplicate active memberships (`ORA-20003`). Validates capacity strictly `< 3` (`ORA-20004`). Inserts member as `PASSENGER` with `PENDING` status, provisions `RIDE_CONFIRMATION`, and returns `p_membership_id`. |
| `SET_CONFIRMATION_DEADLINE` | `(p_group_id IN NUMBER)` | Row-locks group. Sets `confirmation_deadline = SYSTIMESTAMP + INTERVAL '10' MINUTE`. Rejects non-pending groups (`ORA-20010`). |
| `RECORD_RIDE_CONFIRMATION` | `(p_membership_id IN NUMBER)` | Validates deadline hasn't elapsed (`ORA-20032`). Sets `confirmation_status = 'CONFIRMED'` and `confirmed_at = SYSTIMESTAMP`. |
| `DECLINE_RIDE_CONFIRMATION` | `(p_membership_id IN NUMBER)` | Sets `confirmation_status = 'DECLINED'`. Does not immediately destroy the group, preserving visibility for the coordinator. |
| `CONFIRM_RIDE_GROUP` | `(p_group_id IN NUMBER)` | Verifies deadline has not passed (`ORA-20022`). Verifies at least 2 members exist (`ORA-20023`). Enforces 100% confirmation: transitions group and all pending members to `CONFIRMED`. If any unconfirmed member remains, raises `ORA-20024`. |
| `EXPIRE_UNCONFIRMED_GROUP` | `(p_group_id IN NUMBER)` | If `confirmation_deadline < SYSTIMESTAMP` and pending confirmations remain, transitions group and pending confirmation records to `EXPIRED`. |
| `REPLACE_COORDINATOR` | `(p_group_id IN NUMBER, p_volunteer_user_id IN NUMBER DEFAULT NULL, p_new_coordinator_id OUT NUMBER)` | If volunteer provided and eligible, promotes volunteer. Otherwise promotes earliest-joined eligible active participant (`ORDER BY joined_at ASC, membership_id ASC`). Updates `RIDE_GROUP.coordinator_id` and swaps member roles. Raises `ORA-20051` if no candidates remain. |
| `CALCULATE_AND_ALLOCATE_FARE` | `(p_group_id IN NUMBER, p_actual_fare IN NUMBER, p_discrepancy_flag OUT CHAR)` | Computes $>25\%$ fare discrepancy flag against `estimated_fare`. Counts confirmed members. Calculates integer/trunc share `TRUNC(actual_fare / active_count, 2)`. Allocates rounding remainder to coordinator. Upserts rows in `FARE_SHARE` via `MERGE`. |

---

## 3. EER Modeling, Specialization & Normalization Analysis

### 3.1 Supertype / Subtype Specialization Hierarchy
- **Supertype:** `APP_USER`
- **Subtypes:** `STUDENT_PROFILE`, `FACULTY_PROFILE`
- **Disjointness Constraint:** **Disjoint (`d`)** — A commuter cannot simultaneously be enrolled as a student and employed as a faculty/staff member.
- **Participation Constraint:** **Partial Participation** — An administrative user (`user_role = 'ADMIN'`) belongs to `APP_USER` without requiring a student or faculty profile.
- **Defining Attribute:** `user_role` in `APP_USER`.
- **Relational Mapping:** Implements **Option C (Multiple Relations for Supertype and Subtypes)**. Subtypes use `user_id` as primary key with foreign key cascading deletion (`ON DELETE CASCADE`).

### 3.2 Conceptual EER Diagram
```mermaid
erDiagram
    APP_USER ||--o| STUDENT_PROFILE : "specialization (d)"
    APP_USER ||--o| FACULTY_PROFILE : "specialization (d)"
    APP_USER ||--o{ USER_EMAIL_ACCOUNT : "owns"
    APP_USER ||--o{ USER_EMAIL_VERIFICATION : "challenges"
    APP_USER ||--o| EMAIL_PREFERENCE : "configures"
    APP_USER ||--o{ APP_NOTIFICATION : "receives"
    APP_USER ||--o{ RIDE_REQUEST : "initiates"
    APP_USER ||--o{ RIDE_GROUP : "coordinates"
    APP_USER ||--o{ RIDE_GROUP_MEMBER : "participates"
    APP_USER ||--o{ RIDE_REPORT : "files / reported in"

    RIDE_REQUEST ||--o| RIDE_GROUP : "instantiates"
    ROUTE_FARE ||--o{ RIDE_GROUP : "prices"

    RIDE_GROUP ||--|{ RIDE_GROUP_MEMBER : "comprises (max 3)"
    RIDE_GROUP ||--o{ FARE_SHARE : "splits into"
    RIDE_GROUP ||--o{ RIDE_CANCELLATION : "logs"
    RIDE_GROUP ||--o{ RIDE_REPORT : "escalates"

    RIDE_GROUP_MEMBER ||--o| RIDE_CONFIRMATION : "votes"
    RIDE_GROUP_MEMBER ||--o| FARE_SHARE : "settles"
    RIDE_GROUP_MEMBER ||--o{ RIDE_RATING : "rates / rated"

    APP_NOTIFICATION ||--o{ EMAIL_DELIVERY_LOG : "dispatches"
    RIDE_CANCELLATION ||--o| ADMIN_REVIEW : "requires"
    RIDE_REPORT ||--o| ADMIN_REVIEW : "requires"
```

### 3.3 Formal Normalization Analysis (1NF, 2NF, 3NF)
- **First Normal Form (1NF):** Every attribute domain contains strictly atomic scalar values. Repeating groups and multivalued arrays (such as individual passenger shares) are decomposed into separate child relations (`FARE_SHARE`). All tables possess explicit primary keys.
- **Second Normal Form (2NF):** Satisfies 1NF. For tables with composite candidate keys (e.g. `RIDE_RATING` unique key on `group_id, reviewer_membership_id, reviewed_membership_id`), every non-prime attribute (`rating`, `review_text`, `created_at`) depends fully on the complete composite key with zero partial functional dependencies.
- **Third Normal Form (3NF):** Satisfies 2NF. Zero transitive dependencies exist among non-prime attributes ($X \to Y \to Z$ where $Z$ is non-prime). Route coordinates and standard fares are isolated in `ROUTE_FARE` and `RIDE_REQUEST`, preventing redundancy in `RIDE_GROUP`. Student and faculty attributes reside exclusively in their respective subtype relations.

---

## 4. Backend API Architecture & REST Specification

### 4.1 FastAPI Core, Lifespan & Connection Pool
The backend is driven by FastAPI with asynchronous lifespan event handlers (`app.main:lifespan`):
- **Startup:** Initializes `oracledb.ConnectionPool` with `min=2`, `max=10`, `increment=1`, and session callback setting `current_schema = SYNRIDE`.
- **Shutdown:** Cleanly drains and closes all active pool connections.
- **Exception Mapping:** Centralized `@app.exception_handler(SynRideException)` converts domain errors to JSON responses with distinct error codes (`NOT_FOUND`, `UNAUTHORIZED`, `FORBIDDEN`, `CAPACITY_EXCEEDED`, `DUPLICATE_MEMBERSHIP`, `DEADLINE_PASSED`, etc.).

### 4.2 Pydantic Schemas & Data Contracts
All payload schemas in `app.models.schemas` inherit from Pydantic `BaseModel`:
- `RegisterRequest`, `VerifyOTPRequest`, `LoginRequest`, `TokenResponse`, `UserProfileResponse`
- `RideRequestCreate` (with validator rejecting identical pickup and destination)
- `MatchSearchRequest`, `RideGroupCreate`, `RideGroupResponse`, `GroupMemberResponse`
- `ActualFareInput`, `FareAllocationResponse`, `PaymentStatusUpdate`
- `RatingCreate`, `RatingResponse`, `ReportCreate`, `ReportResponse`
- `AdminReviewResolve` (enforcing min 5-character outcome note), `AdminDashboardStats`, `RouteFareCreateOrUpdate`

### 4.3 Repository Layer & Parameterized Execution
Zero ORM overhead. All SQL interactions reside in static repository classes utilizing explicit connection and transaction context managers (`get_db_connection()`, `get_db_transaction()`):
- `UserRepository`, `RideRepository`, `GroupRepository`, `ConfirmationRepository`, `FareRepository`, `RatingRepository`, `ReportRepository`, `NotificationRepository`, `AdminRepository`.

### 4.4 Complete REST API Endpoint Catalog

| Method | Endpoint | Protection | Description |
|---|---|:---:|---|
| `POST` | `/api/auth/register` | Public | Step 1 registration: validates institutional domain, hashes password, generates salted OTP. |
| `POST` | `/api/auth/verify-otp` | Public | Step 2 registration: validates OTP, enforces 5-attempt rate limit, provisions user + profile, issues JWT. |
| `POST` | `/api/auth/login` | Public | Authenticates credentials, returns signed JWT access token. |
| `POST` | `/api/auth/token` | Public | OAuth2-compliant token login for Swagger UI. |
| `GET` | `/api/auth/me` | Bearer | Returns full profile joining supertype and subtype attributes from `V_USER_PROFILES`. |
| `GET` | `/api/rides/routes` | Public | Returns all active routes with benchmark fares and durations from `ROUTE_FARE`. |
| `POST` | `/api/rides/requests` | Bearer | Creates ride request. Verifies route duration and rejects overlapping active rides. |
| `GET` | `/api/rides/requests/me` | Bearer | Lists all commute requests created by the authenticated user. |
| `POST` | `/api/rides/match` | Bearer | Matches requests with identical pickup/destination within a $\pm 15$-minute departure window. |
| `POST` | `/api/groups` | Bearer | Creates ride pool from an active request. Creator is assigned initial coordinator. |
| `GET` | `/api/groups` | Public | Lists active/pending ride pools from `V_ACTIVE_RIDE_GROUPS`. |
| `GET` | `/api/groups/me` | Bearer | Lists all groups where the authenticated user is an active participant. |
| `GET` | `/api/groups/{group_id}` | Public | Returns full group details with member confirmation and payment statuses. |
| `POST` | `/api/groups/{group_id}/join` | Bearer | Calls PL/SQL `JOIN_RIDE_GROUP` with row-locking to enforce max 3 capacity and prevent duplicate memberships. |
| `POST` | `/api/groups/{group_id}/cancel` | Bearer | Cancels participation. Applies 60-min rule penalty flag and calls `REPLACE_COORDINATOR` if coordinator exits. |
| `POST` | `/api/groups/{group_id}/complete` | Bearer | Coordinator marks ride as `COMPLETED`. Opens post-ride peer rating window. |
| `POST` | `/api/groups/{group_id}/deadline` | Bearer | Coordinator initiates 10-minute confirmation countdown via `SET_CONFIRMATION_DEADLINE`. |
| `POST` | `/api/confirmations/{membership_id}/confirm` | Bearer | Confirms participation via `RECORD_RIDE_CONFIRMATION`. Auto-promotes group to `CONFIRMED` upon 100% agreement. |
| `POST` | `/api/confirmations/{membership_id}/decline` | Bearer | Declines participation via `DECLINE_RIDE_CONFIRMATION`. |
| `POST` | `/api/groups/{group_id}/expire` | Bearer | Expires group via `EXPIRE_UNCONFIRMED_GROUP` if confirmation deadline elapsed. |
| `POST` | `/api/groups/{group_id}/fare` | Bearer | Coordinator enters actual fare. Calculates exact splits and flags $>25\%$ fare discrepancies. |
| `GET` | `/api/groups/{group_id}/fare` | Bearer | Retrieves individual fare share breakdown and payment statuses for a group. |
| `PUT` | `/api/fares/{membership_id}/payment` | Bearer | Updates simulated payment status (`PAID`, `FAILED`, `DISPUTED`). |
| `POST` | `/api/groups/{group_id}/ratings` | Bearer | Submits 1-5 star peer rating. Requires `COMPLETED` ride. Enforces anti-self-rating constraint. |
| `GET` | `/api/users/{user_id}/ratings` | Bearer | Retrieves reviews received by a user. Reviewer identity masked for non-administrators. |
| `POST` | `/api/reports` | Bearer | Files misconduct or dispute report. Automatically enqueues case into `ADMIN_REVIEW`. |
| `GET` | `/api/reports` | Admin | Lists all filed incident reports across the university. |
| `POST` | `/api/reports/{report_id}/resolve` | Admin | Resolves incident report with mandatory audit outcome note. |
| `GET` | `/api/notifications` | Bearer | Retrieves in-app alerts for authenticated user. |
| `PUT` | `/api/notifications/{notification_id}/read` | Bearer | Marks in-app alert as read. |
| `GET` | `/api/notifications/preferences` | Bearer | Retrieves email notification toggle state. |
| `PUT` | `/api/notifications/preferences` | Bearer | Updates persistent email notification preference (`'Y'` / `'N'`). |
| `GET` | `/api/admin/dashboard` | Admin | Returns operational counts (users, active groups, completed rides, pending reviews, routes). |
| `GET` | `/api/admin/reviews` | Admin | Retrieves consolidated review queue from `V_ADMIN_REVIEW_QUEUE`. |
| `POST` | `/api/admin/reviews/{review_id}/resolve` | Admin | Resolves open administrative review with mandatory justification note. |
| `GET` | `/api/admin/routes` | Admin | Lists all configured campus routes. |
| `POST` | `/api/admin/routes` | Admin | Upserts benchmark route fare, duration, and active status. |
| `GET` | `/api/admin/users` | Admin | Lists all campus users with student/faculty profile specialization details. |

---

## 5. Frontend Architecture & Component Catalog

### 5.1 Design System & Tailwind Configuration
Modern, dark-themed responsive UI configured in `tailwind.config.js` with glassmorphic cards, emerald accent highlights, and Lucide React iconography:
- Glass Panel Styling: `backdrop-blur-md bg-slate-900/70 border border-slate-800/80`
- Color Hierarchy: Emerald (`text-emerald-400`, `bg-emerald-500`), Slate (`bg-[#0b1120]`), Amber (warnings), Rose (cancellations/errors), Indigo (coordinator badge).

### 5.2 Authentication Context & State Management
`frontend/src/context/AuthContext.tsx` maintains global session state:
- Local storage token caching under `synride_token`.
- Automatic user profile hydration on boot via `api.getMe()`.
- Computed permission properties: `isAuthenticated`, `isAdmin` (`user_role === 'ADMIN'`), `isCoordinator(coordinatorId)`.

### 5.3 API Service Integration Client
`frontend/src/services/api.ts` provides a complete typed fetch client with automatic bearer header injection and unified JSON error unwrapping.

### 5.4 Page Views & Modal Workflows
1. `Login.tsx`: Credentials authentication with demo shortcut accounts.
2. `Register.tsx`: Multi-step registration, institutional domain dropdowns, subtype profile forms, and live OTP verification modal.
3. `Dashboard.tsx`: Commuter home showing quick ride creation, active enrolled groups, companion matches, and stats.
4. `RideDiscovery.tsx`: Exploration of forming pools, pickup/destination filtering, and direct group joining.
5. `CreateRide.tsx`: Form for companion search vs. vehicle arranged rides with route selection and estimated fare display.
6. `RideGroupDetail.tsx`: Master coordination hub with modals for confirmation deadline, fare allocation, payment updating, cancellation, rating submission, and incident reporting.
7. `RoutesView.tsx`: Catalog of university routes and standard fares.
8. `Profile.tsx`: User profile showing specialization attributes, average rating, star breakdown, and email notification preference switch.
9. `NotificationsPage.tsx`: Notification feed with mark-as-read actions.
10. `AdminDashboard.tsx`: Administrative console featuring metrics cards, escalations review queue, route management, and user audit tables.

### 5.5 Reusable UI Components
- `Navbar.tsx`: Responsive navigation with role-aware tab indicators and notification badge.
- `Modal.tsx`: Accessible dialog container with backdrop dismissal.
- `StatusBadge.tsx`: Color-coded status pills for ride statuses, roles, and payment states.
- `StarRating.tsx`: Interactive and display star rating widget.
- `AlertBanner.tsx`: Dismissible alerts for errors, successes, and warnings.

---

## 6. Security, Cryptography & Institutional Policies

### 6.1 Institutional Domain Validation
Strict domain enforcement validated in `app/core/security.py`:
- `STUDENT`: Must end in `@vitstudent.ac.in`.
- `FACULTY`: Must end in `@vit.ac.in` (or `@vitstudent.ac.in`).
- `ADMIN`: Must end in `@vit.ac.in`.
- Personal domains (`@gmail.com`, `@yahoo.com`, etc.) are rejected with HTTP 400.

### 6.2 Password Security & Bcrypt Work Factor
Passwords are encrypted using `bcrypt` with salt generation and work factor 12 (`bcrypt.hashpw(password.encode(), bcrypt.gensalt())`). Cleartext passwords are never persisted.

### 6.3 Salted Cryptographic OTP Lifecycle & Throttling
- **Generation:** Cryptographically secure 6-digit integer (`secrets.randbelow(1_000_000)`).
- **Salting & Hashing:** SHA-256 hashed with email salt: `hashlib.sha256(f"{otp}:synride_salt_{email}".encode()).hexdigest()`.
- **Timing & Expiry:** 10-minute validity (`expires_at = SYSTIMESTAMP + 10 min`).
- **Throttling:** Max 5 failed attempts allowed before the challenge is blocked (`failed_attempts >= 5` -> HTTP 429 lockout for 15 minutes).
- **Constant-Time Verification:** Uses `secrets.compare_digest` to prevent timing attacks.

### 6.4 JWT Access Token Architecture & Role Guards
- Signed with `HS256` secret key and 24-hour expiration (`ACCESS_TOKEN_EXPIRE_MINUTES = 1440`).
- Token claims: `sub` (user ID string), `role` (`STUDENT`, `FACULTY`, `ADMIN`), `iat`, `exp`.
- Route guards: `get_current_user` validates token signature and active account status; `get_current_admin` enforces administrator role.

---

## 7. Core Business Logic & Algorithmic Rules

### 7.1 Concurrent Group Capacity (Max 3 Members)
Strictly enforces a maximum of 3 active members (1 coordinator + 2 passengers). PL/SQL procedure `JOIN_RIDE_GROUP` acquires an exclusive row lock (`SELECT group_status FROM RIDE_GROUP ... FOR UPDATE`) before checking member count. If count $\ge 3$, raises `ORA-20004: This group has reached its maximum capacity of 3 members.` (mapped to HTTP 409 `CapacityExceededError`).

### 7.2 100% Confirmation Window & Expiry
- Coordinator triggers a 10-minute window via `SET_CONFIRMATION_DEADLINE`.
- All active participants must record explicit agreement via `RECORD_RIDE_CONFIRMATION`.
- `CONFIRM_RIDE_GROUP` validates that $100\%$ of members confirmed (`COUNT(CONFIRMED) == member_count`). If any member declines or remains pending, the group cannot reach `CONFIRMED`.
- If the deadline elapses with unconfirmed members, `EXPIRE_UNCONFIRMED_GROUP` marks the group as `EXPIRED`.

### 7.3 Automatic Coordinator Replacement Succession
When the coordinator cancels participation, PL/SQL `REPLACE_COORDINATOR` promotes the earliest-joined eligible active passenger (`ORDER BY joined_at ASC, membership_id ASC`) to become the new group coordinator. If no eligible passengers remain, the group transitions to `CANCELLED`.

### 7.4 60-Minute Cancellation Penalty Flagging
Members can withdraw freely until 60 minutes before scheduled departure. Any cancellation submitted $\le 60$ minutes prior to departure sets `admin_review_required = 'Y'` in `RIDE_CANCELLATION` and automatically logs a case in `ADMIN_REVIEW`.

### 7.5 Exact Fare Split Formula & Coordinator Remainder
Integer floor division guarantees exact rupee reconciliation:
$$\text{Base Share} = \left\lfloor \frac{\text{Actual Fare}}{\text{Active Members}} \right\rfloor$$
$$\text{Rounding Remainder} = \text{Actual Fare} - (\text{Base Share} \times \text{Active Members})$$
The coordinator absorbs the remainder: $\text{Coordinator Share} = \text{Base Share} + \text{Remainder}$.  
*Example:* ₹250 divided among 3 members: Passenger 1 pays ₹83.00, Passenger 2 pays ₹83.00, Coordinator pays ₹84.00 ($83 + 83 + 84 = 250.00$).

### 7.6 25% Fare Discrepancy Auditing
If the actual fare entered by the coordinator differs from the route estimate by $> 25\%$:
$$\frac{|\text{Actual Fare} - \text{Estimated Fare}|}{\text{Estimated Fare}} > 0.25$$
The stored procedure sets `p_discrepancy_flag = 'Y'` and flags the record for administrative audit.

### 7.7 Peer Rating Anonymity & Anti-Self-Rating
- Ratings (1–5 stars) are permitted only after a ride group reaches status `COMPLETED`.
- Anti-self-rating is enforced at the database level: `CK_RATING_DIFFERENT_USERS` (`reviewer_membership_id <> reviewed_membership_id`).
- Unique constraint `UQ_RATING_REVIEW` permits exactly 1 rating per participant pair per ride.
- Peer identities are anonymized for ordinary commuters to eliminate retaliatory bias.

### 7.8 Administrator Disciplinary Review & Mandatory Outcome Notes
Administrators review open incidents, disputes, and late cancellations via `V_ADMIN_REVIEW_QUEUE`. When resolving or dismissing a case, the system strictly requires a mandatory justification note of at least 5 characters (`CK_REPORT_OUTCOME_NOTE` and repository validation), creating an auditable disciplinary trail.

---

## 8. Testing, Verification & Quality Assurance Report

### 8.1 Pytest Automated Suite (21/21 Pass Details)
All 21 backend tests execute against the live, persistent Oracle AI Database 26ai Free instance without mocks.

```
tests/test_auth_and_security.py::test_institutional_email_validation PASSED [  4%]
tests/test_auth_and_security.py::test_password_hashing PASSED            [  9%]
tests/test_auth_and_security.py::test_otp_generation_and_hashing PASSED  [ 14%]
tests/test_auth_and_security.py::test_registration_flow_with_invalid_domain PASSED [ 19%]
tests/test_auth_and_security.py::test_registration_and_otp_workflow PASSED [ 23%]
tests/test_auth_and_security.py::test_unauthenticated_endpoints_return_401 PASSED [ 28%]
tests/test_auth_and_security.py::test_admin_endpoints_guard PASSED       [ 33%]
tests/test_confirmations_and_fares.py::test_fare_allocation_calculation_exact_shares PASSED [ 38%]
tests/test_confirmations_and_fares.py::test_fare_discrepancy_check PASSED [ 42%]
tests/test_confirmations_and_fares.py::test_payment_status_update PASSED [ 47%]
tests/test_oracle_integration.py::test_oracle_live_connectivity PASSED   [ 52%]
tests/test_oracle_integration.py::test_oracle_views_and_specialization PASSED [ 57%]
tests/test_oracle_integration.py::test_oracle_stored_procedure_join_capacity_enforcement PASSED [ 61%]
tests/test_oracle_integration.py::test_oracle_duplicate_active_membership_prevention PASSED [ 66%]
tests/test_oracle_integration.py::test_email_preference_and_notifications PASSED [ 71%]
tests/test_ratings_and_reports.py::test_rating_score_validation PASSED   [ 76%]
tests/test_ratings_and_reports.py::test_report_creation_and_resolution_flow PASSED [ 80%]
tests/test_rides_and_groups.py::test_identical_pickup_and_destination_fails PASSED [ 85%]
tests/test_rides_and_groups.py::test_active_route_fares_listing PASSED   [ 90%]
tests/test_rides_and_groups.py::test_ride_matching_within_15_minutes PASSED [ 95%]
tests/test_rides_and_groups.py::test_get_existing_group_details PASSED   [100%]
============================= 21 passed in 1.79s ==============================
```

### 8.2 Live End-to-End User Acceptance Test (UAT) Suite
`backend/tests/run_live_uat.py` executes end-to-end integration workflows against running backend and frontend instances:
- Workflow 1: Registration, domain validation, OTP, and login.
- Workflow 2: Route retrieval, request submission, and matching algorithm.
- Workflow 3: Group formation, join capacity enforcement, and coordinator assignment.
- Workflow 4: Confirmation deadline, explicit confirmation, and group transition to `CONFIRMED`.
- Workflow 5: Completion, fare allocation with rounding remainder, payment status update, and peer rating.
- Workflow 6: Admin review queue, route-fare management, and user audit queries.

### 8.3 TypeScript Compiler & Vite Production Build Audit
```
> frontend@0.0.0 build
> tsc -b && vite build

vite v8.3.4 building client environment for production...
transforming...
✓ 1938 modules transformed.
rendering chunks...
dist/index.html                   1.24 kB │ gzip:  0.75 kB
dist/assets/index-DyaCBI9U.css   27.37 kB │ gzip:  5.99 kB
dist/assets/index-DeEeJ7nO.js   327.43 kB │ gzip: 90.21 kB
✓ built in 11.12s
```
Zero type errors, zero bundling errors, 100% compliant with React 19 and TypeScript 5.9.

---

## 9. Comprehensive Documentation Currency & Audit Report

### 9.1 Audit Methodology
A line-by-line audit was conducted comparing the existing repository documentation (`README.md`, `docs/API_DOCUMENTATION.md`, `docs/DATABASE_OBJECT_INVENTORY.md`, `docs/REQUIREMENTS_MATRIX.md`, `docs/TEST_REPORT.md`, `docs/DEMONSTRATION_GUIDE.md`, `docs/INITIAL_AUDIT_AND_PLAN.md`, `docs/RELATIONAL_SCHEMA.md`, `docs/EER_DIAGRAM.md`) against the actual source code across the database, backend, and frontend.

### 9.2 Discrepancies Found in Existing Docs

1. **`README.md` Repository Tree Omissions:**
   - Omitted `database/06_security_hardening_app_user.sql` from the repository file list.
   - Omitted `docs/INITIAL_AUDIT_AND_PLAN.md` from the documentation list.

2. **API Endpoint Path & Method Discrepancies in `docs/API_DOCUMENTATION.md`:**
   - **Auth Profile:** Docs documented `GET /api/auth/profile`. In actual code (`auth.py` and `api.ts`), the endpoint is `GET /api/auth/me`.
   - **Email Changes:** Docs documented `POST /api/auth/change-email` and `POST /api/auth/verify-email-change`. These endpoints exist in Pydantic models and DB schema (`USER_EMAIL_ACCOUNT`), but are not mounted in `auth.py`.
   - **Ride Matching:** Docs documented `GET /api/rides/match` with query parameters. In code, it is `POST /api/rides/match` accepting a JSON body (`MatchSearchRequest`).
   - **My Requests:** Code includes `GET /api/rides/requests/me`, which was missing from the API docs.
   - **My Groups:** Code includes `GET /api/groups/me`, which was missing from the API docs.
   - **Confirmation Deadline:** Docs documented `POST /api/confirmations/groups/{id}/set-deadline`. In code, it is `POST /api/groups/{group_id}/deadline`.
   - **Confirm Participation:** Docs documented `POST /api/confirmations/{membership_id}/confirm`. In code, this endpoint requires query parameter `?group_id={group_id}` to trigger automatic group confirmation.
   - **Group Expiry:** Docs documented `POST /api/confirmations/groups/{id}/check-expiry`. In code, it is `POST /api/groups/{group_id}/expire`.
   - **Fare Allocation:** Docs documented `POST /api/fares/groups/{id}/allocate`. In code, it is `POST /api/groups/{group_id}/fare`.
   - **Fare Breakdown:** Code includes `GET /api/groups/{group_id}/fare`, which was missing from docs.
   - **Payment Status Update:** Docs documented `PATCH /api/fares/shares/{id}/status`. In code, it is `PUT /api/fares/{membership_id}/payment`.
   - **Rating Submission:** Docs documented `POST /api/ratings`. In code, it is `POST /api/groups/{group_id}/ratings`.
   - **User Ratings Summary:** Docs documented `GET /api/ratings/user/{id}/summary`. In code, it is `GET /api/users/{user_id}/ratings`.
   - **Report Listing & Resolution:** Docs documented `GET /api/reports/group/{id}` and `POST /api/admin/reports/{id}/resolve`. In code, incidents are listed globally by administrators via `GET /api/reports` and resolved via `POST /api/reports/{report_id}/resolve`.
   - **Notification Read:** Docs documented `PATCH /api/notifications/{id}/read`. In code, it is `PUT /api/notifications/{notification_id}/read`.
   - **Admin Metrics & Queue:** Docs documented `GET /api/admin/stats` and `GET /api/admin/review-queue`. In code, they are `GET /api/admin/dashboard` and `GET /api/admin/reviews`.
   - **Admin Route Management:** Code includes `GET /api/admin/routes` and `POST /api/admin/routes`, which were missing from the API documentation.

3. **Database Object Inventory (`DATABASE_OBJECT_INVENTORY.md`):**
   - Did not catalog `database/06_security_hardening_app_user.sql` or the 31 private synonyms created under `SYNRIDE_APP`.
   - Discrepancy on `JOIN_RIDE_GROUP` error code: Docs stated `ORA-20001` is raised when full; in actual PL/SQL code, `ORA-20004` is raised when capacity $\ge 3$ (`ORA-20001` is raised when the group is not `PENDING`). `connection.py` correctly maps code `20004` to `CapacityExceededError`.

4. **Runtime Environment & Database Container Status:**
   - The Oracle AI Database container in WSL2 (`oracle-free-lite`) was initially stopped (dormant for 9 days). Starting the container enabled all 21 live tests to execute cleanly and pass.

---

### 9.3 Currency Verification Table

| Component | Source of Truth | Documentation Status | Actual State | Alignment |
|---|---|---|---|:---:|
| **Tables (18)** | `database/01_schema_inventory.sql` | Fully Documented in `RELATIONAL_SCHEMA.md` | 18 tables compiled and verified in `FREEPDB1` | **100% MATCH** |
| **Views (5)** | `database/02_views.sql` | Documented in `DATABASE_OBJECT_INVENTORY.md` | 5 valid views in `FREEPDB1` | **100% MATCH** |
| **PL/SQL Procedures (8)** | `database/03_procedures_and_functions.sql` | Documented in `DATABASE_OBJECT_INVENTORY.md` | 8 valid procedures in `FREEPDB1` | **100% MATCH** |
| **DCL & Security Hardening** | `database/06_security_hardening_app_user.sql` | Partially missing from `README.md` tree | Implemented (`RL_SYNRIDE_APP` + 31 synonyms) | **DOCUMENTED HERE** |
| **REST Endpoints** | `backend/app/api/*.py` | Multiple discrepancies in `API_DOCUMENTATION.md` | 36 active endpoints in FastAPI | **RECONCILED HERE** |
| **Pydantic Schemas** | `backend/app/models/schemas.py` | Partially documented | Fully typed with field validators | **100% MATCH** |
| **Frontend Components** | `frontend/src/` | Summarized in `README.md` | 10 pages, 5 reusable components, AuthContext | **100% MATCH** |
| **Automated Tests** | `backend/tests/` | Reported as 21/21 PASS | 21/21 passed in 1.79s against live Oracle DB | **100% MATCH** |
| **Production Build** | `frontend/dist/` | Reported clean | `npm run build` cleanly compiled (0 errors) | **100% MATCH** |

---

### 9.4 Actionable Recommendations
1. **Synchronize Repository Docs:** Update `docs/API_DOCUMENTATION.md` with the verified endpoint paths (`/api/auth/me`, `POST /api/rides/match`, `/api/admin/dashboard`, etc.) documented in Section 4.4.
2. **Update `README.md` File Tree:** Add `06_security_hardening_app_user.sql` and `INITIAL_AUDIT_AND_PLAN.md` to Section 3 of `README.md`.
3. **Database Container Auto-Start:** Ensure the Podman container `oracle-free-lite` is marked for restart (`podman update --restart=always oracle-free-lite`) so WSL2 launches it automatically upon boot.

