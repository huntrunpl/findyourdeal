-- Migration: Support all 11 languages in language functions
-- Date: 2025-01-27
-- Previous: Supported only 2 languages (en, pl) - blocking de/fr/es/etc
-- After: All 11 languages (en,pl,de,fr,it,es,pt,ru,cs,hu,sk) are supported

-- 1. Update fyd_normalize_lang() to support all 11 languages
CREATE OR REPLACE FUNCTION public.fyd_normalize_lang(l text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $func$
BEGIN
  -- Normalize: en-US -> en, pt-BR -> pt, etc
  l := LOWER(SUBSTRING(l, 1, 2));
  
  -- Validate against all 11 supported languages
  IF l NOT IN ('en','pl','de','fr','it','es','pt','ru','cs','hu','sk') THEN
    RETURN 'en'; -- fallback
  END IF;
  
  RETURN l;
END;
$func$;

-- 2. Update fyd_users_lang_sync() to support all 11 languages
-- This trigger function synchronizes lang, language, language_code columns
CREATE OR REPLACE FUNCTION public.fyd_users_lang_sync()
RETURNS trigger
LANGUAGE plpgsql
AS $func$
BEGIN
  -- Extract language code from full tag: de-DE -> de
  IF NEW.language_code IS NOT NULL THEN
    NEW.lang := LOWER(SUBSTRING(NEW.language_code, 1, 2));
    -- Support all 11 languages
    IF NEW.lang NOT IN ('en','pl','de','fr','it','es','pt','ru','cs','hu','sk') THEN
      NEW.lang := 'en'; -- fallback for unknown languages
    END IF;
  ELSIF NEW.lang IS NULL THEN
    NEW.lang := 'en';
  END IF;
  
  -- Sync language column as backup
  IF NEW.language IS NULL THEN
    NEW.language := NEW.lang;
  END IF;
  
  RETURN NEW;
END;
$func$;

-- 3. Verify triggers exist and are attached to fyd_users_lang_sync
-- (They should already exist from previous migrations)
-- If needed, they can be recreated:
-- 
-- DROP TRIGGER IF EXISTS trg_users_lang_sync ON users;
-- CREATE TRIGGER trg_users_lang_sync
--   BEFORE INSERT OR UPDATE ON users
--   FOR EACH ROW
--   EXECUTE FUNCTION fyd_users_lang_sync();

-- 4. Relax users.language CHECK constraint to allow all 11 languages
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_language_chk;
ALTER TABLE public.users
  ADD CONSTRAINT users_language_chk
  CHECK (language IN ('en','pl','de','fr','it','es','pt','ru','cs','hu','sk'));

-- Test the fixes with all languages:
-- SELECT fyd_normalize_lang('de') AS test_de,
--        fyd_normalize_lang('fr') AS test_fr,
--        fyd_normalize_lang('pt-BR') AS test_pt,
--        fyd_normalize_lang('sk') AS test_sk;
