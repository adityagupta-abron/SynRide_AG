-- ============================================================================
-- SYNRIDE — STORED PROCEDURES & PL/SQL BUSINESS LOGIC
-- Oracle AI Database 26ai Free / FREEPDB1 / Schema: SYNRIDE
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. JOIN_RIDE_GROUP (Enhanced)
-- Serializes concurrent joins, verifies capacity <= 3, adds membership and
-- initializes corresponding pending confirmation record.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE JOIN_RIDE_GROUP (
    p_group_id        IN  NUMBER,
    p_user_id         IN  NUMBER,
    p_membership_id   OUT NUMBER
)
AS
    v_group_status    RIDE_GROUP.group_status%TYPE;
    v_member_count    NUMBER;
    v_existing        NUMBER;
    v_user_exists     NUMBER;
    v_new_mem_id      NUMBER;
BEGIN
    -- 1. Row-lock the group to serialize concurrent join attempts
    SELECT group_status
    INTO v_group_status
    FROM RIDE_GROUP
    WHERE group_id = p_group_id
    FOR UPDATE;

    IF v_group_status <> 'PENDING' THEN
        RAISE_APPLICATION_ERROR(-20001, 'This group is not open for new members.');
    END IF;

    -- 2. Confirm the user exists and is active
    SELECT COUNT(*)
    INTO v_user_exists
    FROM APP_USER
    WHERE user_id = p_user_id
      AND account_status = 'ACTIVE';

    IF v_user_exists = 0 THEN
        RAISE_APPLICATION_ERROR(-20002, 'User does not exist or account is not active.');
    END IF;

    -- 3. Prevent duplicate active memberships
    SELECT COUNT(*)
    INTO v_existing
    FROM RIDE_GROUP_MEMBER
    WHERE group_id = p_group_id
      AND user_id = p_user_id
      AND membership_status IN ('PENDING', 'CONFIRMED');

    IF v_existing > 0 THEN
        RAISE_APPLICATION_ERROR(-20003, 'User already has an active membership in this group.');
    END IF;

    -- 4. Count current active members (including coordinator)
    SELECT COUNT(*)
    INTO v_member_count
    FROM RIDE_GROUP_MEMBER
    WHERE group_id = p_group_id
      AND membership_status IN ('PENDING', 'CONFIRMED');

    IF v_member_count >= 3 THEN
        RAISE_APPLICATION_ERROR(-20004, 'This group has reached its maximum capacity of 3 members.');
    END IF;

    -- 5. Insert the new member
    INSERT INTO RIDE_GROUP_MEMBER (
        group_id,
        user_id,
        member_role,
        membership_status,
        joined_at
    )
    VALUES (
        p_group_id,
        p_user_id,
        'PASSENGER',
        'PENDING',
        SYSTIMESTAMP
    )
    RETURNING membership_id INTO v_new_mem_id;

    -- 6. Initialize corresponding pending confirmation record
    INSERT INTO RIDE_CONFIRMATION (
        membership_id,
        confirmation_status,
        created_at
    )
    VALUES (
        v_new_mem_id,
        'PENDING',
        SYSTIMESTAMP
    );

    p_membership_id := v_new_mem_id;

EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RAISE_APPLICATION_ERROR(-20005, 'Ride group does not exist.');
END JOIN_RIDE_GROUP;
/

-- ----------------------------------------------------------------------------
-- 2. SET_CONFIRMATION_DEADLINE
-- Sets a 10-minute confirmation window for a forming group
-- ----------------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE SET_CONFIRMATION_DEADLINE (
    p_group_id IN NUMBER
)
AS
    v_status RIDE_GROUP.group_status%TYPE;
BEGIN
    SELECT group_status
    INTO v_status
    FROM RIDE_GROUP
    WHERE group_id = p_group_id
    FOR UPDATE;

    IF v_status <> 'PENDING' THEN
        RAISE_APPLICATION_ERROR(-20010, 'Only pending groups can receive a confirmation deadline.');
    END IF;

    UPDATE RIDE_GROUP
    SET confirmation_deadline = SYSTIMESTAMP + INTERVAL '10' MINUTE
    WHERE group_id = p_group_id;

EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RAISE_APPLICATION_ERROR(-20011, 'Ride group does not exist.');
END SET_CONFIRMATION_DEADLINE;
/

-- ----------------------------------------------------------------------------
-- 3. RECORD_RIDE_CONFIRMATION
-- Records explicit member confirmation before the deadline
-- ----------------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE RECORD_RIDE_CONFIRMATION (
    p_membership_id IN NUMBER
)
AS
    v_group_id            RIDE_GROUP.group_id%TYPE;
    v_group_status        RIDE_GROUP.group_status%TYPE;
    v_deadline            RIDE_GROUP.confirmation_deadline%TYPE;
    v_confirmation_status RIDE_CONFIRMATION.confirmation_status%TYPE;
BEGIN
    SELECT m.group_id
    INTO v_group_id
    FROM RIDE_GROUP_MEMBER m
    WHERE m.membership_id = p_membership_id
      AND m.membership_status = 'PENDING';

    SELECT group_status, confirmation_deadline
    INTO v_group_status, v_deadline
    FROM RIDE_GROUP
    WHERE group_id = v_group_id
    FOR UPDATE;

    IF v_group_status <> 'PENDING' THEN
        RAISE_APPLICATION_ERROR(-20031, 'Group is not awaiting confirmations.');
    END IF;

    IF v_deadline IS NOT NULL AND SYSTIMESTAMP > v_deadline THEN
        RAISE_APPLICATION_ERROR(-20032, 'Confirmation deadline has passed.');
    END IF;

    SELECT confirmation_status
    INTO v_confirmation_status
    FROM RIDE_CONFIRMATION
    WHERE membership_id = p_membership_id
    FOR UPDATE;

    IF v_confirmation_status <> 'PENDING' THEN
        RAISE_APPLICATION_ERROR(-20033, 'Confirmation is not pending.');
    END IF;

    UPDATE RIDE_CONFIRMATION
    SET confirmation_status = 'CONFIRMED',
        confirmed_at = SYSTIMESTAMP
    WHERE membership_id = p_membership_id;

EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RAISE_APPLICATION_ERROR(-20034, 'Pending membership or confirmation record not found.');
END RECORD_RIDE_CONFIRMATION;
/

-- ----------------------------------------------------------------------------
-- 4. DECLINE_RIDE_CONFIRMATION
-- Marks confirmation as DECLINED. Does not immediately expire the group.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE DECLINE_RIDE_CONFIRMATION (
    p_membership_id IN NUMBER
)
AS
    v_group_id            RIDE_GROUP.group_id%TYPE;
    v_group_status        RIDE_GROUP.group_status%TYPE;
    v_confirmation_status RIDE_CONFIRMATION.confirmation_status%TYPE;
BEGIN
    SELECT m.group_id
    INTO v_group_id
    FROM RIDE_GROUP_MEMBER m
    WHERE m.membership_id = p_membership_id
      AND m.membership_status = 'PENDING';

    SELECT group_status
    INTO v_group_status
    FROM RIDE_GROUP
    WHERE group_id = v_group_id
    FOR UPDATE;

    IF v_group_status <> 'PENDING' THEN
        RAISE_APPLICATION_ERROR(-20041, 'Group is not awaiting confirmations.');
    END IF;

    SELECT confirmation_status
    INTO v_confirmation_status
    FROM RIDE_CONFIRMATION
    WHERE membership_id = p_membership_id
    FOR UPDATE;

    IF v_confirmation_status <> 'PENDING' THEN
        RAISE_APPLICATION_ERROR(-20042, 'Confirmation is not pending.');
    END IF;

    UPDATE RIDE_CONFIRMATION
    SET confirmation_status = 'DECLINED'
    WHERE membership_id = p_membership_id;

EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RAISE_APPLICATION_ERROR(-20044, 'Pending membership or confirmation record not found.');
END DECLINE_RIDE_CONFIRMATION;
/

-- ----------------------------------------------------------------------------
-- 5. CONFIRM_RIDE_GROUP
-- Transitions group to CONFIRMED only if every active member confirmed
-- ----------------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE CONFIRM_RIDE_GROUP (
    p_group_id IN NUMBER
)
AS
    v_status    RIDE_GROUP.group_status%TYPE;
    v_deadline  RIDE_GROUP.confirmation_deadline%TYPE;
    v_total     NUMBER;
    v_confirmed NUMBER;
BEGIN
    SELECT group_status, confirmation_deadline
    INTO v_status, v_deadline
    FROM RIDE_GROUP
    WHERE group_id = p_group_id
    FOR UPDATE;

    IF v_status <> 'PENDING' THEN
        RAISE_APPLICATION_ERROR(-20021, 'Group is not pending.');
    END IF;

    IF v_deadline IS NOT NULL AND SYSTIMESTAMP > v_deadline THEN
        RAISE_APPLICATION_ERROR(-20022, 'Confirmation deadline has passed.');
    END IF;

    SELECT 
        COUNT(*),
        SUM(CASE WHEN c.confirmation_status = 'CONFIRMED' THEN 1 ELSE 0 END)
    INTO v_total, v_confirmed
    FROM RIDE_GROUP_MEMBER m
    JOIN RIDE_CONFIRMATION c ON c.membership_id = m.membership_id
    WHERE m.group_id = p_group_id
      AND m.membership_status IN ('PENDING', 'CONFIRMED');

    IF v_total < 2 THEN
        RAISE_APPLICATION_ERROR(-20023, 'At least two members with confirmation records are required.');
    END IF;

    IF v_confirmed = v_total THEN
        UPDATE RIDE_GROUP
        SET group_status = 'CONFIRMED'
        WHERE group_id = p_group_id;

        UPDATE RIDE_GROUP_MEMBER
        SET membership_status = 'CONFIRMED'
        WHERE group_id = p_group_id
          AND membership_status = 'PENDING';
    ELSE
        RAISE_APPLICATION_ERROR(-20024, 'Not all active members have confirmed participation.');
    END IF;

EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RAISE_APPLICATION_ERROR(-20025, 'Group not found.');
END CONFIRM_RIDE_GROUP;
/

-- ----------------------------------------------------------------------------
-- 6. EXPIRE_UNCONFIRMED_GROUP
-- Sets group and pending confirmation records to EXPIRED if deadline passed
-- ----------------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE EXPIRE_UNCONFIRMED_GROUP (
    p_group_id IN NUMBER
)
AS
    v_status   RIDE_GROUP.group_status%TYPE;
    v_deadline RIDE_GROUP.confirmation_deadline%TYPE;
    v_pending  NUMBER;
BEGIN
    SELECT group_status, confirmation_deadline
    INTO v_status, v_deadline
    FROM RIDE_GROUP
    WHERE group_id = p_group_id
    FOR UPDATE;

    IF v_status <> 'PENDING' THEN
        RAISE_APPLICATION_ERROR(-20011, 'Group is not pending.');
    END IF;

    IF v_deadline IS NULL OR SYSTIMESTAMP <= v_deadline THEN
        RAISE_APPLICATION_ERROR(-20012, 'Confirmation deadline has not passed.');
    END IF;

    SELECT COUNT(*)
    INTO v_pending
    FROM RIDE_CONFIRMATION c
    JOIN RIDE_GROUP_MEMBER m ON m.membership_id = c.membership_id
    WHERE m.group_id = p_group_id
      AND m.membership_status = 'PENDING'
      AND c.confirmation_status = 'PENDING';

    IF v_pending > 0 THEN
        UPDATE RIDE_GROUP
        SET group_status = 'EXPIRED'
        WHERE group_id = p_group_id;

        UPDATE RIDE_CONFIRMATION c
        SET confirmation_status = 'EXPIRED'
        WHERE c.membership_id IN (
            SELECT m.membership_id
            FROM RIDE_GROUP_MEMBER m
            WHERE m.group_id = p_group_id
        )
        AND c.confirmation_status = 'PENDING';
    ELSE
        RAISE_APPLICATION_ERROR(-20013, 'No pending confirmations; group need not expire.');
    END IF;

EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RAISE_APPLICATION_ERROR(-20014, 'Group not found.');
END EXPIRE_UNCONFIRMED_GROUP;
/

-- ----------------------------------------------------------------------------
-- 7. REPLACE_COORDINATOR
-- Reassigns coordinator: first to volunteer, else earliest joining participant
-- ----------------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE REPLACE_COORDINATOR (
    p_group_id           IN  NUMBER,
    p_volunteer_user_id  IN  NUMBER DEFAULT NULL,
    p_new_coordinator_id OUT NUMBER
)
AS
    v_new_coord_mem_id NUMBER;
    v_new_coord_user_id NUMBER;
BEGIN
    -- If a volunteer is specified and eligible, appoint them
    IF p_volunteer_user_id IS NOT NULL THEN
        SELECT membership_id, user_id
        INTO v_new_coord_mem_id, v_new_coord_user_id
        FROM RIDE_GROUP_MEMBER
        WHERE group_id = p_group_id
          AND user_id = p_volunteer_user_id
          AND membership_status IN ('PENDING', 'CONFIRMED')
          AND member_role <> 'COORDINATOR';
    ELSE
        -- Fallback: Earliest joined participant, break ties with lowest membership_id
        SELECT membership_id, user_id
        INTO v_new_coord_mem_id, v_new_coord_user_id
        FROM (
            SELECT membership_id, user_id
            FROM RIDE_GROUP_MEMBER
            WHERE group_id = p_group_id
              AND membership_status IN ('PENDING', 'CONFIRMED')
              AND member_role <> 'COORDINATOR'
            ORDER BY joined_at ASC, membership_id ASC
        )
        WHERE ROWNUM = 1;
    END IF;

    -- Update RIDE_GROUP coordinator
    UPDATE RIDE_GROUP
    SET coordinator_id = v_new_coord_user_id
    WHERE group_id = p_group_id;

    -- Update member roles
    UPDATE RIDE_GROUP_MEMBER
    SET member_role = 'PASSENGER'
    WHERE group_id = p_group_id
      AND member_role = 'COORDINATOR';

    UPDATE RIDE_GROUP_MEMBER
    SET member_role = 'COORDINATOR'
    WHERE membership_id = v_new_coord_mem_id;

    p_new_coordinator_id := v_new_coord_user_id;

EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RAISE_APPLICATION_ERROR(-20051, 'No eligible participants available for coordinator replacement.');
END REPLACE_COORDINATOR;
/

-- ----------------------------------------------------------------------------
-- 8. CALCULATE_AND_ALLOCATE_FARE
-- Calculates exact shares summing to actual fare, remainder to coordinator.
-- Flags discrepancy if difference > 25% from estimated fare.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE CALCULATE_AND_ALLOCATE_FARE (
    p_group_id         IN  NUMBER,
    p_actual_fare      IN  NUMBER,
    p_discrepancy_flag OUT CHAR
)
AS
    v_est_fare        NUMBER(10,2);
    v_active_count    NUMBER;
    v_base_share      NUMBER(10,2);
    v_remainder       NUMBER(10,2);
    v_coord_mem_id    NUMBER;
    v_diff_pct        NUMBER;
BEGIN
    SELECT estimated_fare
    INTO v_est_fare
    FROM RIDE_GROUP
    WHERE group_id = p_group_id
    FOR UPDATE;

    -- Discrepancy check: flag if > 25% difference
    IF v_est_fare IS NOT NULL AND v_est_fare > 0 THEN
        v_diff_pct := ABS(p_actual_fare - v_est_fare) / v_est_fare;
        IF v_diff_pct > 0.25 THEN
            p_discrepancy_flag := 'Y';
        ELSE
            p_discrepancy_flag := 'N';
        END IF;
    ELSE
        p_discrepancy_flag := 'N';
    END IF;

    -- Update actual fare on the group
    UPDATE RIDE_GROUP
    SET actual_fare = p_actual_fare
    WHERE group_id = p_group_id;

    -- Count active members
    SELECT COUNT(*)
    INTO v_active_count
    FROM RIDE_GROUP_MEMBER
    WHERE group_id = p_group_id
      AND membership_status = 'CONFIRMED';

    IF v_active_count = 0 THEN
        RAISE_APPLICATION_ERROR(-20061, 'No confirmed members in group to allocate fare.');
    END IF;

    -- Individual equal share (rounded down to 2 decimals)
    v_base_share := TRUNC(p_actual_fare / v_active_count, 2);
    -- Remainder allocated to coordinator
    v_remainder := p_actual_fare - (v_base_share * v_active_count);

    -- Identify coordinator membership
    SELECT membership_id
    INTO v_coord_mem_id
    FROM RIDE_GROUP_MEMBER
    WHERE group_id = p_group_id
      AND member_role = 'COORDINATOR'
      AND membership_status = 'CONFIRMED';

    -- Upsert FARE_SHARE records
    FOR m IN (
        SELECT membership_id, member_role
        FROM RIDE_GROUP_MEMBER
        WHERE group_id = p_group_id
          AND membership_status = 'CONFIRMED'
    ) LOOP
        MERGE INTO FARE_SHARE fs
        USING DUAL
        ON (fs.membership_id = m.membership_id)
        WHEN MATCHED THEN
            UPDATE SET 
                fs.share_amount = CASE 
                    WHEN m.membership_id = v_coord_mem_id THEN v_base_share + v_remainder 
                    ELSE v_base_share 
                END,
                fs.payment_status = 'PENDING'
        WHEN NOT MATCHED THEN
            INSERT (group_id, membership_id, share_amount, payment_status, created_at)
            VALUES (
                p_group_id,
                m.membership_id,
                CASE 
                    WHEN m.membership_id = v_coord_mem_id THEN v_base_share + v_remainder 
                    ELSE v_base_share 
                END,
                'PENDING',
                SYSTIMESTAMP
            );
    END LOOP;

EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RAISE_APPLICATION_ERROR(-20062, 'Ride group or coordinator record not found.');
END CALCULATE_AND_ALLOCATE_FARE;
/
