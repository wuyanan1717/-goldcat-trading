-- 1. Create table to log registration attempts by IP (IF NOT EXISTS)
CREATE TABLE IF NOT EXISTS registration_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ip_address TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Index for fast lookups (IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_registration_logs_ip_created 
ON registration_logs(ip_address, created_at);

-- 3. Function to check and log registration (Updated for LIFETIME LIMIT)
-- Returns TRUE if allowed, FALSE if limit exceeded
CREATE OR REPLACE FUNCTION check_registration_limit(client_ip TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    reg_count INT;
    LIMIT_TOTAL INT := 4; -- MAX 4 accounts per IP LIFETIME (Revised per user request)
BEGIN
    -- Count TOTAL registrations from this IP all time
    SELECT COUNT(*) INTO reg_count
    FROM registration_logs
    WHERE ip_address = client_ip;

    -- If limit exceeded, return FALSE
    IF reg_count >= LIMIT_TOTAL THEN
        RETURN FALSE;
    END IF;

    -- Otherwise, log this attempt and return TRUE
    INSERT INTO registration_logs (ip_address) VALUES (client_ip);
    RETURN TRUE;
END;
$$;
