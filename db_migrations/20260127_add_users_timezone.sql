-- Add timezone column to users table
-- Default: Europe/Warsaw (production default)
ALTER TABLE users ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Europe/Warsaw';

-- Add index for faster timezone lookups
CREATE INDEX IF NOT EXISTS users_timezone_idx ON users(timezone);

-- Update existing NULL values to default
UPDATE users SET timezone = 'Europe/Warsaw' WHERE timezone IS NULL;
