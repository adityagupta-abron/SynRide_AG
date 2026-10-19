-- ============================================================================
-- SYNRIDE — ACADEMIC DATABASE VIEWS
-- Oracle AI Database 26ai Free / FREEPDB1 / Schema: SYNRIDE
-- ============================================================================

-- 1. V_USER_PROFILES
-- Demonstrates Relational Specialization / Supertype-Subtype Joins (EER mapping)
CREATE OR REPLACE VIEW V_USER_PROFILES AS
SELECT
    u.user_id,
    u.full_name,
    u.email,
    u.user_role,
    u.account_status,
    u.created_at,
    CASE 
        WHEN s.user_id IS NOT NULL THEN 'STUDENT'
        WHEN f.user_id IS NOT NULL THEN 'FACULTY'
        ELSE 'ADMIN'
    END AS profile_type,
    COALESCE(s.registration_no, f.employee_id, 'N/A') AS institutional_id,
    s.programme,
    s.study_year,
    f.staff_category,
    f.department
FROM APP_USER u
LEFT JOIN STUDENT_PROFILE s ON u.user_id = s.user_id
LEFT JOIN FACULTY_PROFILE f ON u.user_id = f.user_id;

-- 2. V_ACTIVE_RIDE_GROUPS
-- Joins RIDE_GROUP, RIDE_REQUEST, coordinator details, and computes member counts
CREATE OR REPLACE VIEW V_ACTIVE_RIDE_GROUPS AS
SELECT
    g.group_id,
    g.request_id,
    r.request_type,
    r.pickup_location,
    r.destination,
    g.departure_time,
    g.group_status,
    g.estimated_fare,
    g.actual_fare,
    g.confirmation_deadline,
    g.created_at,
    g.coordinator_id,
    cu.full_name AS coordinator_name,
    cu.email AS coordinator_email,
    NVL(rf.estimated_duration_minutes, 15) AS estimated_duration_minutes,
    (
        SELECT COUNT(*)
        FROM RIDE_GROUP_MEMBER m
        WHERE m.group_id = g.group_id
          AND m.membership_status IN ('PENDING', 'CONFIRMED')
    ) AS active_member_count,
    (
        SELECT COUNT(*)
        FROM RIDE_GROUP_MEMBER m
        JOIN RIDE_CONFIRMATION c ON c.membership_id = m.membership_id
        WHERE m.group_id = g.group_id
          AND m.membership_status IN ('PENDING', 'CONFIRMED')
          AND c.confirmation_status = 'CONFIRMED'
    ) AS confirmed_member_count
FROM RIDE_GROUP g
JOIN RIDE_REQUEST r ON g.request_id = r.request_id
JOIN APP_USER cu ON g.coordinator_id = cu.user_id
LEFT JOIN ROUTE_FARE rf ON rf.pickup_location = r.pickup_location AND rf.destination = r.destination;

-- 3. V_RIDE_GROUP_MEMBERS_DETAIL
-- Comprehensive membership breakdown with confirmation and fare share statuses
CREATE OR REPLACE VIEW V_RIDE_GROUP_MEMBERS_DETAIL AS
SELECT
    m.group_id,
    m.membership_id,
    m.user_id,
    u.full_name,
    u.email,
    u.user_role,
    m.member_role,
    m.membership_status,
    m.joined_at,
    c.confirmation_status,
    c.confirmed_at,
    fs.share_amount,
    fs.payment_status
FROM RIDE_GROUP_MEMBER m
JOIN APP_USER u ON m.user_id = u.user_id
LEFT JOIN RIDE_CONFIRMATION c ON m.membership_id = c.membership_id
LEFT JOIN FARE_SHARE fs ON m.membership_id = fs.membership_id;

-- 4. V_USER_RATINGS_SUMMARY
-- Post-ride peer reviews aggregation: average stars, counts, and breakdown
CREATE OR REPLACE VIEW V_USER_RATINGS_SUMMARY AS
SELECT
    reviewed_m.user_id AS user_id,
    ROUND(AVG(r.rating), 2) AS average_rating,
    COUNT(r.rating_id) AS total_reviews,
    SUM(CASE WHEN r.rating = 5 THEN 1 ELSE 0 END) AS five_star_count,
    SUM(CASE WHEN r.rating = 4 THEN 1 ELSE 0 END) AS four_star_count,
    SUM(CASE WHEN r.rating = 3 THEN 1 ELSE 0 END) AS three_star_count,
    SUM(CASE WHEN r.rating = 2 THEN 1 ELSE 0 END) AS two_star_count,
    SUM(CASE WHEN r.rating = 1 THEN 1 ELSE 0 END) AS one_star_count
FROM RIDE_RATING r
JOIN RIDE_GROUP_MEMBER reviewed_m ON r.reviewed_membership_id = reviewed_m.membership_id
GROUP BY reviewed_m.user_id;

-- 5. V_ADMIN_REVIEW_QUEUE
-- Consolidates open issues, reports, and cancellations for administrators
CREATE OR REPLACE VIEW V_ADMIN_REVIEW_QUEUE AS
SELECT
    ar.review_id,
    ar.review_reason,
    ar.review_status,
    ar.created_at,
    ar.group_id,
    ar.cancellation_id,
    ar.report_id,
    ar.assigned_admin_id,
    admin_u.full_name AS assigned_admin_name,
    ar.outcome_note,
    ar.reviewed_at,
    rep.report_reason,
    rep.description AS report_description,
    reporter_u.full_name AS reporter_name,
    reported_u.full_name AS reported_user_name,
    canc.cancellation_type,
    canc.cancellation_reason,
    canc_u.full_name AS cancelled_by_name
FROM ADMIN_REVIEW ar
LEFT JOIN APP_USER admin_u ON ar.assigned_admin_id = admin_u.user_id
LEFT JOIN RIDE_REPORT rep ON ar.report_id = rep.report_id
LEFT JOIN APP_USER reporter_u ON rep.reporter_id = reporter_u.user_id
LEFT JOIN APP_USER reported_u ON rep.reported_user_id = reported_u.user_id
LEFT JOIN RIDE_CANCELLATION canc ON ar.cancellation_id = canc.cancellation_id
LEFT JOIN APP_USER canc_u ON canc.cancelled_by = canc_u.user_id;
