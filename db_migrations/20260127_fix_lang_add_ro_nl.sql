-- Migration: Add ro/nl to language normalization and sync
-- Date: 2026-01-27
-- Purpose: Keep users.lang as source of truth; allow panel/telegram languages (pl,en,de,fr,es,it,pt,ro,nl,cs,sk)

-- 1) Normalize helper: accepts only the 11 panel languages, fallback to 'en'
CREATE OR REPLACE FUNCTION public.fyd_normalize_lang(l text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $func$
BEGIN
  l := LOWER(TRIM(COALESCE(l, '')));
  -- extract primary subtag (ro-RO -> ro)
  l := SUBSTRING(l, 1, 2);

  IF l NOT IN ('en','pl','de','fr','es','it','pt','ro','nl','cs','sk') THEN
    RETURN 'en';
  END IF;
  RETURN l;
END;
$func$;

-- 2) Trigger: lang is SoT -> sync language_code/language, normalize inputs
CREATE OR REPLACE FUNCTION public.fyd_users_lang_sync()
RETURNS trigger
LANGUAGE plpgsql
AS $func$
DECLARE
  norm text;
BEGIN
  norm := fyd_normalize_lang(COALESCE(NEW.lang, NEW.language_code, 'en'));
  NEW.lang := norm;
  NEW.language_code := norm;
  NEW.language := norm;
  RETURN NEW;
END;
$func$;

-- 3) Re-normalize existing rows (idempotent)
UPDATE users
SET lang = fyd_normalize_lang(lang),
    language_code = fyd_normalize_lang(language_code),
    language = fyd_normalize_lang(language)
WHERE TRUE;

-- 4) Refresh constraints (on lang only)
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_lang_sot_chk;
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_language_chk;
ALTER TABLE public.users
  ADD CONSTRAINT users_lang_sot_chk
  CHECK (lang IN ('en','pl','de','fr','es','it','pt','ro','nl','cs','sk'));

-- 5) Ensure default
ALTER TABLE public.users ALTER COLUMN lang SET DEFAULT 'en';
