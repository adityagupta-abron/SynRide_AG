# SynRide — Automated Testing & Quality Assurance Report

**Execution Date:** 2026-10-19  
**Test Framework:** Pytest 9.1.1, Python 3.12.0  
**Database Under Test:** Oracle AI Database 26ai Free (`FREEPDB1`) on WSL2 Podman  
**Frontend Build Tool:** Vite 8.3.4, TypeScript 5.9.3, React 19  
**Overall Result:** **ALL 21 TESTS PASSED (100% Pass Rate)**

---

## 1. Executive Summary

The SynRide test suite rigorously evaluates institutional security policies, concurrent transaction isolation, PL/SQL capacity enforcement, exact fare share mathematics, EER specialization views, and lifecycle transitions.

All 21 backend tests execute against the live, persistent Oracle database instance without mocking database side-effects.

---

## 2. Test Execution Log

```
============================= test session starts =============================
platform win32 -- Python 3.12.0, pytest-9.1.1, pluggy-1.7.0 -- python.exe
rootdir: C:\Users\HP\Desktop\SynRide\SynRide_AG\backend
plugins: anyio-4.6.2.post1, asyncio-1.4.0
collected 21 items

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

============================= 21 passed in 1.26s ==============================
```

---

## 3. Test Cases Breakdown

### 3.1 Authentication & Security (`test_auth_and_security.py`)
| Test Function | Verification Scope | Result |
|---|---|:---:|
| `test_institutional_email_validation` | Confirms rejection of personal emails (`@gmail.com`) and acceptance of `@vitstudent.ac.in` and `@vit.ac.in`. | **PASS** |
| `test_password_hashing` | Validates `bcrypt` salt generation, verification, and rejection of erroneous passwords. | **PASS** |
| `test_otp_generation_and_hashing` | Confirms 6-digit numeric OTP generation, SHA-256 one-way hashing, and secure comparison. | **PASS** |
| `test_registration_flow_with_invalid_domain` | Asserts HTTP 400 Bad Request when attempting registration with a non-institutional domain. | **PASS** |
| `test_registration_and_otp_workflow` | Validates end-to-end registration, OTP storage in `USER_EMAIL_VERIFICATION`, OTP verification, and JWT issuance. | **PASS** |
| `test_unauthenticated_endpoints_return_401` | Asserts HTTP 401 Unauthorized when accessing protected routes without Bearer token. | **PASS** |
| `test_admin_endpoints_guard` | Asserts HTTP 403 Forbidden when a student account attempts to query admin management endpoints. | **PASS** |

### 3.2 Fares & Confirmations (`test_confirmations_and_fares.py`)
| Test Function | Verification Scope | Result |
|---|---|:---:|
| `test_fare_allocation_calculation_exact_shares` | Verifies exact integer floor splitting where total of shares strictly equals the actual fare, and coordinator absorbs remainder. (e.g., ₹250 divided by 3 = ₹83, ₹83, ₹84). | **PASS** |
| `test_fare_discrepancy_check` | Confirms that fare differences $> 25\%$ trigger an audit discrepancy flag while differences $\le 25\%$ do not. | **PASS** |
| `test_payment_status_update` | Asserts transition between payment states (`PENDING` -> `PAID` -> `DISPUTED`). | **PASS** |

### 3.3 Live Oracle Database Integration (`test_oracle_integration.py`)
| Test Function | Verification Scope | Result |
|---|---|:---:|
| `test_oracle_live_connectivity` | Queries `SELECT banner FROM v$version` confirming live session on Oracle AI Database 26ai Free. | **PASS** |
| `test_oracle_views_and_specialization` | Queries academic view `V_USER_PROFILES`, validating outer join between `APP_USER`, `STUDENT_PROFILE`, and `FACULTY_PROFILE`. | **PASS** |
| `test_oracle_stored_procedure_join_capacity_enforcement` | Creates an isolated test group, adds coordinator + 2 passengers, and attempts to join a 4th passenger. Confirms `ORA-20001: Group is full. Maximum 3 members allowed.` is raised by Oracle PL/SQL. | **PASS** |
| `test_oracle_duplicate_active_membership_prevention` | Tests function-based unique index `UQ_ACTIVE_GROUP_MEMBER` by attempting to enroll the same user twice in an active group. Confirms rejection. | **PASS** |
| `test_email_preference_and_notifications` | Validates inserting an in-app notification and creating a queued email delivery log in `EMAIL_DELIVERY_LOG`. | **PASS** |

### 3.4 Ratings & Reports (`test_ratings_and_reports.py`)
| Test Function | Verification Scope | Result |
|---|---|:---:|
| `test_rating_score_validation` | Asserts rejection of out-of-range star ratings ($< 1$ or $> 5$) and checks check constraint `CK_NO_SELF_RATING`. | **PASS** |
| `test_report_creation_and_resolution_flow` | Validates filing a dispute report and resolving it with a mandatory administrator outcome note. | **PASS** |

### 3.5 Rides & Groups (`test_rides_and_groups.py`)
| Test Function | Verification Scope | Result |
|---|---|:---:|
| `test_identical_pickup_and_destination_fails` | Rejects ride creation where pickup and destination locations are identical. | **PASS** |
| `test_active_route_fares_listing` | Validates retrieval of seeded routes from `ROUTE_FARE` table. | **PASS** |
| `test_ride_matching_within_15_minutes` | Verifies algorithm matching trips along identical routes departing within $\pm 15$ minutes of request. | **PASS** |
| `test_get_existing_group_details` | Queries existing Group 1 without mutating data, verifying coordinator and members 1, 2, 3. | **PASS** |

---

## 4. Frontend Build & Static Analysis Verification

Vite production build executed cleanly:
```
> frontend@0.0.0 build
> tsc -b && vite build

vite v8.3.4 building client environment for production...
transforming...
✓ 1938 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   1.24 kB │ gzip:  0.75 kB
dist/assets/index-DyaCBI9U.css   27.37 kB │ gzip:  5.99 kB
dist/assets/index-DeEeJ7nO.js   327.43 kB │ gzip: 90.21 kB

✓ built in 1.38s
```
- **TypeScript Compiler (`tsc`):** Clean exit code `0`, no type errors.
- **Tailwind CSS PostCSS Pipeline:** Clean generation of compiled CSS bundle (`27.37 kB`).

---

## 5. Test Data Preservation Confirmation

- Test Users `1`, `2`, `3`, `21`: **Preserved intact.**
- Test Group `1` (Route: `VIT Main Gate` to `Katpadi Railway Station`, coordinator `1`, members `1`, `2`, `3`): **Preserved intact.**
- Isolated fixtures created during testing were rolled back or cleared without altering existing baseline state.
