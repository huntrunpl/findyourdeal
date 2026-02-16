-- Migration: Add columns for all commands implementation (NO /timezone)
-- Date: 2026-02-02
-- Purpose: Support /priorytet, /ukry, /config, /zapis, filters, /usun_uzytkownika
-- Note: Table is 'links' (not user_links), already has 'filters' JSONB column

-- links: priority (low|normal|high, default normal)
ALTER TABLE links 
ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'normal';

-- links: hidden (boolean, default false)
ALTER TABLE links 
ADD COLUMN IF NOT EXISTS hidden BOOLEAN DEFAULT FALSE;

-- links: saved_preset (TEXT/JSON snapshot of link settings)
ALTER TABLE links 
ADD COLUMN IF NOT EXISTS saved_preset TEXT DEFAULT NULL;

-- users: disabled (soft-delete for /usun_uzytkownika)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS disabled BOOLEAN DEFAULT FALSE;

-- Add index on hidden for fast filtering
CREATE INDEX IF NOT EXISTS idx_links_hidden ON links(hidden);

-- Add index on disabled for user queries
CREATE INDEX IF NOT EXISTS idx_users_disabled ON users(disabled);

-- Comment on columns
COMMENT ON COLUMN links.priority IS 'Link priority: low|normal|high (default: normal)';
COMMENT ON COLUMN links.hidden IS 'Hidden link: not shown in /lista, no notifications';
COMMENT ON COLUMN links.filters IS 'JSON filters: {price:{min,max}, size:[], brand:[], maxPerRun:n} (already exists)';
COMMENT ON COLUMN links.saved_preset IS 'Saved preset snapshot (JSON) from /zapis command';
COMMENT ON COLUMN users.disabled IS 'Soft-delete flag for /usun_uzytkownika (admin only)';
