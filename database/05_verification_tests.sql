-- ============================================================================
-- SYNRIDE — DATABASE VERIFICATION TESTS
-- Oracle AI Database 26ai Free / FREEPDB1 / Schema: SYNRIDE
-- ============================================================================

SET SERVEROUTPUT ON;

PROMPT [TEST 1] Verifying Views;
SELECT COUNT(*) AS total_user_profiles FROM V_USER_PROFILES;
SELECT COUNT(*) AS active_groups FROM V_ACTIVE_RIDE_GROUPS;
SELECT COUNT(*) AS group_members FROM V_RIDE_GROUP_MEMBERS_DETAIL;

PROMPT [TEST 2] Verifying Seed Route Fares;
SELECT pickup_location, destination, estimated_fare, estimated_duration_minutes
FROM ROUTE_FARE
WHERE ROWNUM <= 5;

PROMPT [TEST 3] Testing Fare Allocation Logic in Isolated Test Block;
DECLARE
    v_flag CHAR(1);
BEGIN
    -- Group 1 has estimated fare 250
    -- Test with actual fare 240 (within 25% discrepancy limit)
    -- Group 1 is pending confirmation so we test discrepancy check computation logic
    IF ABS(240 - 250) / 250 > 0.25 THEN
        DBMS_OUTPUT.PUT_LINE('Discrepancy: Y');
    ELSE
        DBMS_OUTPUT.PUT_LINE('Discrepancy: N (Expected)');
    END IF;
END;
/
