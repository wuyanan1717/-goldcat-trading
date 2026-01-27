-- 1. Create a dedicated counter table (Prevent infinite growth)
CREATE TABLE IF NOT EXISTS registration_ip_limits (
    ip_address TEXT PRIMARY KEY,
    reg_count INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    first_seen TIMESTAMPTZ DEFAULT NOW() -- Audit trail
);

-- 2. Enable RLS (Security Best Practice)
ALTER TABLE registration_ip_limits ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policy (Strict: Deny all direct access)
-- Users can only modify this table via the SECURITY DEFINER function
CREATE POLICY deny_all_direct_access
ON registration_ip_limits
FOR ALL
USING (false)
WITH CHECK (false);

-- 4. Create Atomic Check Function (Concurrency Safe + Secure)
-- Returns TRUE if allowed, FALSE if limit exceeded
CREATE OR REPLACE FUNCTION check_registration_limit(client_ip TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public -- Secure search_path
AS $$
DECLARE
    LIMIT_TOTAL CONSTANT INT := 4; -- MAX 4 accounts per IP LIFETIME
BEGIN
    -- Input Validation
    IF client_ip IS NULL OR length(client_ip) > 45 THEN
        RETURN FALSE;
    END IF;

    -- Atomic UPSERT: Try to insert or update count if below limit
    INSERT INTO registration_ip_limits (ip_address, reg_count)
    VALUES (client_ip, 1)
    ON CONFLICT (ip_address)
    DO UPDATE
      SET reg_count = registration_ip_limits.reg_count + 1,
          updated_at = NOW()
      WHERE registration_ip_limits.reg_count < LIMIT_TOTAL;

    -- If no row was inserted or updated, it means the WHERE condition failed (Limit Reached)
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    RETURN TRUE;
END;
$$;

-- 5. Grant Permissions (Minimal Privilege)
REVOKE ALL ON FUNCTION check_registration_limit(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION check_registration_limit(TEXT) TO anon, authenticated, service_role;
