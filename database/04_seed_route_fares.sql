-- ============================================================================
-- SYNRIDE — SEED ROUTE FARES & DURATIONS
-- Oracle AI Database 26ai Free / FREEPDB1 / Schema: SYNRIDE
-- ============================================================================

MERGE INTO ROUTE_FARE target
USING (
    SELECT 'VIT Main Gate' AS pickup, 'Katpadi Railway Station' AS dest, 250.00 AS fare, 15 AS duration FROM DUAL UNION ALL
    SELECT 'Katpadi Railway Station', 'VIT Main Gate', 250.00, 15 FROM DUAL UNION ALL
    SELECT 'VIT Main Gate', 'Vellore New Bus Stand', 200.00, 20 FROM DUAL UNION ALL
    SELECT 'Vellore New Bus Stand', 'VIT Main Gate', 200.00, 20 FROM DUAL UNION ALL
    SELECT 'VIT Main Gate', 'Bagayam', 350.00, 35 FROM DUAL UNION ALL
    SELECT 'Bagayam', 'VIT Main Gate', 350.00, 35 FROM DUAL UNION ALL
    SELECT 'VIT Main Gate', 'CMC Hospital', 220.00, 20 FROM DUAL UNION ALL
    SELECT 'CMC Hospital', 'VIT Main Gate', 220.00, 20 FROM DUAL UNION ALL
    SELECT 'VIT Main Gate', 'Green Circle', 180.00, 15 FROM DUAL UNION ALL
    SELECT 'Green Circle', 'VIT Main Gate', 180.00, 15 FROM DUAL UNION ALL
    SELECT 'VIT Main Gate', 'Chennai Airport (MAA)', 3200.00, 180 FROM DUAL UNION ALL
    SELECT 'Chennai Airport (MAA)', 'VIT Main Gate', 3200.00, 180 FROM DUAL UNION ALL
    SELECT 'VIT Main Gate', 'Bengaluru Airport (BLR)', 4500.00, 240 FROM DUAL UNION ALL
    SELECT 'Bengaluru Airport (BLR)', 'VIT Main Gate', 4500.00, 240 FROM DUAL UNION ALL
    SELECT 'Katpadi Railway Station', 'Vellore New Bus Stand', 150.00, 15 FROM DUAL UNION ALL
    SELECT 'Vellore New Bus Stand', 'Katpadi Railway Station', 150.00, 15 FROM DUAL
) src
ON (target.pickup_location = src.pickup AND target.destination = src.dest)
WHEN MATCHED THEN
    UPDATE SET 
        target.estimated_fare = src.fare,
        target.estimated_duration_minutes = src.duration,
        target.is_active = 'Y',
        target.updated_at = SYSTIMESTAMP
WHEN NOT MATCHED THEN
    INSERT (pickup_location, destination, estimated_fare, estimated_duration_minutes, is_active, updated_at)
    VALUES (src.pickup, src.dest, src.fare, src.duration, 'Y', SYSTIMESTAMP);

COMMIT;
