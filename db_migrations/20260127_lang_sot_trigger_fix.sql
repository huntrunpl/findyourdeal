-- Migration: Fix trigger to use users.lang as SoT
-- Date: 2026-01-27
-- Purpose: Trigger synchronizes FROM lang TO language_code and language (not the other way)

CREATE OR REPLACE FUNCTION public.fyd_users_lang_sync()
RETURNS trigger
LANGUAGE plpgsql
AS $func$
BEGIN
  -- SoT: users.lang jest źródłem prawdy
  -- Synchronizuj lang -> language_code i language (kompatybilność)
  
  -- Jeśli lang jest ustawiony, użyj go
  IF NEW.lang IS NOT NULL THEN
    NEW.language_code := NEW.lang;
    NEW.language := NEW.lang;
  -- Jeśli lang jest NULL, ale language_code jest, normalizuj language_code -> lang
  ELSIF NEW.language_code IS NOT NULL THEN
    NEW.lang := LOWER(SUBSTRING(NEW.language_code, 1, 2));
    IF NEW.lang NOT IN ('en','pl','de','fr','it','es','pt','ru','cs','hu','sk','ro','nl') THEN
      NEW.lang := 'en';
    END IF;
    NEW.language_code := NEW.lang;
    NEW.language := NEW.lang;
  -- Fallback: jeśli wszystko NULL
  ELSE
    NEW.lang := 'en';
    NEW.language_code := 'en';
    NEW.language := 'en';
  END IF;
  
  RETURN NEW;
END;
$func$;
