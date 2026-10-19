"""
SynRide Ride Requests & Route Fares Repository
Parameterized SQL operations for RIDE_REQUEST, ROUTE_FARE, matching algorithms,
and trip overlap prevention.
"""
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from app.db.connection import get_db_connection, get_db_transaction, row_to_dict, rows_to_dicts

class RideRepository:

    @staticmethod
    def get_route_fare(pickup: str, destination: str) -> Optional[Dict[str, Any]]:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT route_id, pickup_location, destination, estimated_fare,
                           NVL(estimated_duration_minutes, 15) AS estimated_duration_minutes, is_active
                    FROM ROUTE_FARE
                    WHERE LOWER(pickup_location) = LOWER(:pickup)
                      AND LOWER(destination) = LOWER(:destination)
                      AND is_active = 'Y'
                """, {"pickup": pickup.strip(), "destination": destination.strip()})
                return row_to_dict(cur)

    @staticmethod
    def list_route_fares() -> List[Dict[str, Any]]:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT route_id, pickup_location, destination, estimated_fare,
                           NVL(estimated_duration_minutes, 15) AS estimated_duration_minutes, is_active
                    FROM ROUTE_FARE
                    WHERE is_active = 'Y'
                    ORDER BY pickup_location, destination
                """)
                return rows_to_dicts(cur)

    @staticmethod
    def create_ride_request(
        requester_id: int,
        request_type: str,
        pickup_location: str,
        destination: str,
        departure_time: datetime
    ) -> int:
        with get_db_transaction() as conn:
            with conn.cursor() as cur:
                req_id_var = cur.var(int)
                cur.execute("""
                    INSERT INTO RIDE_REQUEST (
                        requester_id, request_type, pickup_location, destination,
                        departure_time, request_status, created_at
                    )
                    VALUES (
                        :req_id, :r_type, :pickup, :dest,
                        :dep_time, 'OPEN', SYSTIMESTAMP
                    )
                    RETURNING request_id INTO :req_id_var
                """, {
                    "req_id": requester_id,
                    "r_type": request_type,
                    "pickup": pickup_location.strip(),
                    "dest": destination.strip(),
                    "dep_time": departure_time,
                    "req_id_var": req_id_var
                })
                return req_id_var.getvalue()[0]

    @staticmethod
    def get_request_by_id(request_id: int) -> Optional[Dict[str, Any]]:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT request_id, requester_id, request_type, pickup_location, destination,
                           departure_time, request_status, created_at
                    FROM RIDE_REQUEST
                    WHERE request_id = :req_id
                """, {"req_id": request_id})
                return row_to_dict(cur)

    @staticmethod
    def list_user_requests(user_id: int) -> List[Dict[str, Any]]:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT request_id, requester_id, request_type, pickup_location, destination,
                           departure_time, request_status, created_at
                    FROM RIDE_REQUEST
                    WHERE requester_id = :user_id
                    ORDER BY created_at DESC
                """, {"user_id": user_id})
                return rows_to_dicts(cur)

    @staticmethod
    def find_matches(
        pickup_location: str,
        destination: str,
        departure_time: datetime,
        exclude_user_id: Optional[int] = None,
        window_minutes: int = 15
    ) -> List[Dict[str, Any]]:
        """
        Finds matching OPEN ride requests and forming PENDING groups within +-15 minutes.
        Strict match: same pickup, same destination, and departure within window.
        """
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT 
                        r.request_id,
                        r.requester_id,
                        u.full_name AS requester_name,
                        r.request_type,
                        r.pickup_location,
                        r.destination,
                        r.departure_time,
                        r.request_status,
                        g.group_id,
                        g.group_status,
                        (
                            SELECT COUNT(*)
                            FROM RIDE_GROUP_MEMBER m
                            WHERE m.group_id = g.group_id
                              AND m.membership_status IN ('PENDING', 'CONFIRMED')
                        ) AS current_member_count
                    FROM RIDE_REQUEST r
                    JOIN APP_USER u ON r.requester_id = u.user_id
                    LEFT JOIN RIDE_GROUP g ON g.request_id = r.request_id AND g.group_status = 'PENDING'
                    WHERE LOWER(r.pickup_location) = LOWER(:pickup)
                      AND LOWER(r.destination) = LOWER(:dest)
                      AND r.request_status IN ('OPEN', 'MATCHED')
                      AND r.departure_time BETWEEN :dep_time - NUMTODSINTERVAL(:win_mins, 'MINUTE')
                                               AND :dep_time + NUMTODSINTERVAL(:win_mins, 'MINUTE')
                      AND (:exclude_uid IS NULL OR r.requester_id <> :exclude_uid)
                    ORDER BY r.departure_time ASC
                """, {
                    "pickup": pickup_location.strip(),
                    "dest": destination.strip(),
                    "dep_time": departure_time,
                    "win_mins": window_minutes,
                    "exclude_uid": exclude_user_id
                })
                return rows_to_dicts(cur)

    @staticmethod
    def check_overlapping_rides(
        user_id: int,
        departure_time: datetime,
        duration_minutes: int = 20
    ) -> bool:
        """
        Checks whether the user has any existing CONFIRMED or PENDING trip
        whose estimated window overlaps with the requested departure time.
        """
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT COUNT(*)
                    FROM RIDE_GROUP_MEMBER m
                    JOIN RIDE_GROUP g ON m.group_id = g.group_id
                    WHERE m.user_id = :user_id
                      AND m.membership_status IN ('PENDING', 'CONFIRMED')
                      AND g.group_status IN ('PENDING', 'CONFIRMED')
                      AND g.departure_time BETWEEN :dep_time - NUMTODSINTERVAL(:dur_mins, 'MINUTE')
                                               AND :dep_time + NUMTODSINTERVAL(:dur_mins, 'MINUTE')
                """, {
                    "user_id": user_id,
                    "dep_time": departure_time,
                    "dur_mins": duration_minutes
                })
                count = cur.fetchone()[0]
                return count > 0
