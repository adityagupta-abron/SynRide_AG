"""
SynRide Oracle Database Connection & Pool Management
Handles thread-safe connection pooling, explicit transaction boundaries,
cursor dictionary formatting, and safe error mapping using python-oracledb.
"""
import oracledb
from contextlib import contextmanager
from typing import Generator, Any, Dict, List, Optional
import logging
from app.core.config import settings
from app.core.exceptions import (
    DatabaseTransactionError,
    CapacityExceededError,
    DuplicateMembershipError,
    ConfirmationDeadlineError,
    SynRideException
)

logger = logging.getLogger("synride.db")

_pool: Optional[oracledb.ConnectionPool] = None

def init_db_pool() -> oracledb.ConnectionPool:
    """Initializes the Oracle connection pool."""
    global _pool
    if _pool is None:
        try:
            logger.info("Initializing Oracle connection pool to %s:%s/%s...", settings.DB_HOST, settings.DB_PORT, settings.DB_SERVICE)
            _pool = oracledb.create_pool(
                user=settings.DB_USER,
                password=settings.DB_PASSWORD,
                host=settings.DB_HOST,
                port=settings.DB_PORT,
                service_name=settings.DB_SERVICE,
                min=settings.DB_POOL_MIN,
                max=settings.DB_POOL_MAX,
                increment=1
            )
            logger.info("Oracle connection pool initialized successfully.")
        except Exception as e:
            logger.error("Failed to initialize Oracle connection pool: %s", e)
            raise DatabaseTransactionError(f"Database connection failed: {str(e)}")
    return _pool

def close_db_pool():
    """Closes all connections in the Oracle connection pool."""
    global _pool
    if _pool is not None:
        try:
            _pool.close()
            _pool = None
            logger.info("Oracle connection pool closed.")
        except Exception as e:
            logger.warning("Error closing Oracle connection pool: %s", e)

@contextmanager
def get_db_connection() -> Generator[oracledb.Connection, None, None]:
    """Yields a connection from the pool, ensuring it is always returned."""
    pool = init_db_pool()
    conn = pool.acquire()
    try:
        yield conn
    finally:
        try:
            pool.release(conn)
        except Exception as e:
            logger.warning("Error releasing connection to pool: %s", e)

@contextmanager
def get_db_transaction() -> Generator[oracledb.Connection, None, None]:
    """
    Context manager for atomic database transactions.
    Automatically commits on success or rolls back on exception.
    """
    with get_db_connection() as conn:
        try:
            yield conn
            conn.commit()
        except oracledb.DatabaseError as e:
            conn.rollback()
            handle_oracle_error(e)
        except Exception:
            conn.rollback()
            raise

def handle_oracle_error(e: oracledb.DatabaseError):
    """Maps Oracle error codes to clean SynRide domain exceptions."""
    err, = e.args
    code = err.code
    msg = err.message or str(e)
    
    # Custom stored procedure error codes (-20001 to -20062)
    if code == 20004:
        raise CapacityExceededError("This group has reached its maximum capacity of 3 members.")
    elif code == 20003 or code == 1:  # ORA-00001 unique constraint
        if "UQ_ACTIVE_GROUP_MEMBER" in msg:
            raise DuplicateMembershipError("User already has an active membership in this group.")
        elif "UQ_APP_USER_EMAIL" in msg:
            raise SynRideException("An account with this email address already exists.", status_code=409, error_code="EMAIL_EXISTS")
        elif "UQ_STUDENT_REGISTRATION" in msg:
            raise SynRideException("A student with this registration number already exists.", status_code=409, error_code="REG_NO_EXISTS")
        elif "UQ_FACULTY_EMPLOYEE" in msg:
            raise SynRideException("A faculty member with this employee ID already exists.", status_code=409, error_code="EMP_ID_EXISTS")
        else:
            raise SynRideException(f"Unique constraint violation: {msg}", status_code=409, error_code="CONFLICT")
    elif code in (20012, 20022, 20032):
        raise ConfirmationDeadlineError(msg.split("ORA-200")[0] if "ORA-200" in msg else msg)
    elif code == 20024:
        raise SynRideException("Not all active members have confirmed participation.", status_code=400, error_code="MEMBERS_NOT_CONFIRMED")
    elif code == 20023:
        raise SynRideException("At least two members with confirmation records are required to confirm a group.", status_code=400, error_code="MINIMUM_MEMBERS_REQUIRED")
    else:
        logger.error("Oracle Database Error [%s]: %s", code, msg)
        raise DatabaseTransactionError(f"Database error ({code}): {msg}")

def rows_to_dicts(cursor: oracledb.Cursor) -> List[Dict[str, Any]]:
    """Converts fetched cursor rows to lowercased dictionary keys."""
    if not cursor.description:
        return []
    columns = [col[0].lower() for col in cursor.description]
    results = []
    for row in cursor.fetchall():
        results.append(dict(zip(columns, row)))
    return results

def row_to_dict(cursor: oracledb.Cursor) -> Optional[Dict[str, Any]]:
    """Converts a single fetched cursor row to lowercased dictionary keys."""
    if not cursor.description:
        return None
    row = cursor.fetchone()
    if not row:
        return None
    columns = [col[0].lower() for col in cursor.description]
    return dict(zip(columns, row))
