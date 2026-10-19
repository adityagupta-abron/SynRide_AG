# SynRide — Campus Ride-Pooling Coordination Platform

[![Python](https://img.shields.io/badge/Python-3.12-blue.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688.svg)](https://fastapi.tiangolo.com)
[![Oracle Database](https://img.shields.io/badge/Oracle-26ai%20Free-red.svg)](https://www.oracle.com/database/)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6.svg)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC.svg)](https://tailwindcss.com)
[![Tests](https://img.shields.io/badge/Pytest-21%2F21%20PASS-brightgreen.svg)]()

> **SynRide** is an academic software project designed for Vellore Institute of Technology (VIT). It coordinates journey companion finding, vehicle-arranged ride sharing, accurate fare split allocation, and post-ride dispute resolution among eligible students, teaching faculty, and non-teaching staff.

---

## 1. Architectural Overview

```
                      React + TypeScript + Vite + Tailwind CSS
                                (Port 5173 / Client)
                                         │
                                         ▼ HTTP / JSON REST
                               FastAPI Backend (Python 3.12)
                                 (Port 8000 / Uvicorn)
                                         │
                                         ▼ python-oracledb (Native Thin Mode)
                            Oracle AI Database 26ai Free
                             (Service: FREEPDB1 / Port 1521)
```

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Lucide icons.
- **Backend:** Python 3.12, FastAPI, `python-oracledb`, `bcrypt`, `PyJWT`, `pydantic`.
- **Database:** Oracle AI Database 26ai Free (`FREEPDB1`), 18 tables, 5 views, 8 stored procedures, row locking, transactions.
- **No Java / JDBC:** Pure Python and TypeScript full-stack implementation.

---

## 2. Key Academic DBMS Concepts Demonstrated

1. **EER Modeling & Specialization:** `APP_USER` supertype with disjoint/partial specialization into `STUDENT_PROFILE` and `FACULTY_PROFILE`.
2. **Normalized 3NF Relational Design:** 18 relational tables with strictly atomic domains, composite keys, and zero transitive dependencies.
3. **Integrity & Check Constraints:** Primary keys, foreign keys with cascading deletions on subtypes, check constraints for roles, statuses, and score ranges.
4. **Function-Based Unique Indexes:** `UQ_ACTIVE_GROUP_MEMBER` enforces strictly 1 active concurrent membership per user while permitting rejoining after exit.
5. **Academic SQL Views:** 5 complex relational views (`V_USER_PROFILES`, `V_ACTIVE_RIDE_GROUPS`, `V_RIDE_GROUP_MEMBERS_DETAIL`, `V_USER_RATINGS_SUMMARY`, `V_ADMIN_REVIEW_QUEUE`).
6. **PL/SQL Stored Procedures & Functions:** 8 stored procedures enforcing capacity limits, confirmation deadlines, coordinator replacement, and fare splits.
7. **Concurrency Control & Row Locking:** `SELECT ... FOR UPDATE` row locks inside `JOIN_RIDE_GROUP` preventing race conditions from exceeding the 3-passenger limit.
8. **Transaction Isolation:** Multi-step atomic transactions using Python context managers (`get_db_transaction()`).
9. **Exact Fare Allocation Mathematics:** Integer floor division with rounding remainder allocated to coordinator (zero rounding discrepancy).
10. **Data Control Language (DCL):** Oracle proxy authentication (`SYSTEM[SYNRIDE]`) securing credentials while preserving schema integrity.

---

## 3. Repository Structure

```
SynRide_AG/
├── backend/                  # FastAPI Python backend
│   ├── app/
│   │   ├── api/              # REST API endpoint routers
│   │   ├── core/             # Security, JWT, bcrypt, config
│   │   ├── db/               # Oracle connection pool & transactions
│   │   ├── models/           # Pydantic schemas
│   │   └── repositories/     # Parameterized Oracle SQL repositories
│   ├── tests/                # Pytest automated test suite (21 tests)
│   ├── requirements.txt      # Python dependencies
│   └── .env.example          # Environment template
├── frontend/                 # React + TypeScript + Vite frontend
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── context/          # Auth context and session state
│   │   ├── pages/            # View pages (Login, Dashboard, GroupDetail, Admin...)
│   │   ├── services/         # Axios-compatible Fetch API client
│   │   └── types/            # TypeScript data contracts
│   ├── package.json          # Node dependencies
│   ├── tailwind.config.js    # Tailwind styling configuration
│   └── vite.config.ts        # Vite configuration with API proxy
├── database/                 # Oracle SQL and PL/SQL scripts
│   ├── 01_schema_inventory.sql
│   ├── 02_views.sql
│   ├── 03_procedures_and_functions.sql
│   ├── 04_seed_route_fares.sql
│   └── 05_verification_tests.sql
└── docs/                     # Academic documentation
    ├── EER_DIAGRAM.md        # Conceptual EER model & Mermaid diagrams
    ├── RELATIONAL_SCHEMA.md  # 3NF schema, tables, and constraints
    ├── REQUIREMENTS_MATRIX.md# Traceability matrix for all requirements
    ├── DATABASE_OBJECT_INVENTORY.md # Catalog of all DB objects
    ├── API_DOCUMENTATION.md  # Complete OpenAPI / REST documentation
    ├── TEST_REPORT.md        # Test results log (21/21 PASS)
    └── DEMONSTRATION_GUIDE.md# Viva and project evaluation script
```

---

## 4. Quickstart Setup & Startup

### Prerequisites
- Python 3.12+
- Node.js 18+ and npm
- Oracle Database 26ai Free container (`oracle-free-lite`) running on WSL2 / Podman on port `1521`

### Step 1: Backend Setup
```powershell
cd c:\Users\HP\Desktop\SynRide\SynRide_AG\backend

# Install Python dependencies
pip install -r requirements.txt

# Start FastAPI dev server
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
- Interactive Swagger UI: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

### Step 2: Frontend Setup
```powershell
cd c:\Users\HP\Desktop\SynRide\SynRide_AG\frontend

# Install dependencies (if not already installed)
npm install

# Start Vite dev server
npm run dev
```
- SynRide Web Application: [http://localhost:5173](http://localhost:5173)

---

## 5. Running Automated Tests

Run the complete backend integration and unit test suite against the live Oracle database:

```powershell
cd c:\Users\HP\Desktop\SynRide\SynRide_AG\backend
pytest -v
```

**Output:**
```
============================= 21 passed in 1.26s ==============================
```

Build and validate the React TypeScript bundle:
```powershell
cd c:\Users\HP\Desktop\SynRide\SynRide_AG\frontend
npm run build
```

---

## 6. Default Test Accounts

| Role | Email | Password | Access Scope |
|---|---|---|---|
| **Administrator** | `admin@vit.ac.in` | `Admin@123` | Admin review queue, stats, user directory |
| **Student (New)** | Register on website | Any | Student ride booking, companion finding |
| **Coordinator (Preserved)** | `test.coordinator@synride.example` | *(Dev fixture)* | Preserved Group 1 coordinator |
| **Passenger 1 (Preserved)** | `test.passenger1@synride.example` | *(Dev fixture)* | Preserved Group 1 passenger |

---

## 7. Project Documentation

For comprehensive academic details, refer to the documents in `/docs`:
- [EER Diagram & Specialization Modeling](file:///c:/Users/HP/Desktop/SynRide/SynRide_AG/docs/EER_DIAGRAM.md)
- [Relational Schema & 3NF Normalization](file:///c:/Users/HP/Desktop/SynRide/SynRide_AG/docs/RELATIONAL_SCHEMA.md)
- [Requirements Traceability Matrix](file:///c:/Users/HP/Desktop/SynRide/SynRide_AG/docs/REQUIREMENTS_MATRIX.md)
- [Database Object Inventory](file:///c:/Users/HP/Desktop/SynRide/SynRide_AG/docs/DATABASE_OBJECT_INVENTORY.md)
- [REST API Specification](file:///c:/Users/HP/Desktop/SynRide/SynRide_AG/docs/API_DOCUMENTATION.md)
- [Automated Test Report](file:///c:/Users/HP/Desktop/SynRide/SynRide_AG/docs/TEST_REPORT.md)
- [Viva & Demonstration Guide](file:///c:/Users/HP/Desktop/SynRide/SynRide_AG/docs/DEMONSTRATION_GUIDE.md)
