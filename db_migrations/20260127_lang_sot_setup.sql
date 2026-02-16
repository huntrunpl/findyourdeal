-- Migration: Setup users.lang as Source of Truth (SoT)
-- Date: 2026-01-27
-- Purpose: Enforce users.lang as the single source of truth for UI/bot language
--          legacy language_code and language are kept for compatibility only

-- 1. Normalize all existing users.lang values to match supported list
UPDATE users 
SET lang = fyd_normalize_lang(COALESCE(lang, language_code, language, 'en'))
WHERE lang IS NULL OR lang NOT IN ('en','pl','de','fr','it','es','pt','ru','cs','hu','sk','ro','nl');

-- 2. Drop old constraint if exists (may have been added in previous migration)
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_language_chk;

-- 3. Add new constraint on users.lang (not language column)
ALTER TABLE public.users
  ADD CONSTRAINT users_lang_sot_chk
  CHECK (lang IN ('en','pl','de','fr','it','es','pt','ru','cs','hu','sk','ro','nl'));

-- 4. Verify trigger fyd_users_lang_sync exists (synchronizes lang, language_code, language)
-- This trigger ensures backward compatibility for legacy columns
-- Trigger was created in previous migration, verify it's active:
-- SELECT trigger_name FROM information_schema.triggers WHERE trigger_name='trg_users_lang_sync';

-- 5. Set NOT NULL default on users.lang
ALTER TABLE public.users ALTER COLUMN lang SET DEFAULT 'en';

-- Test that all columns are properly synced:
-- SELECT id, lang, language_code, language FROM users LIMIT 5;
