-- Fix fyd_normalize_lang to support Slovak (sk) instead of Ukrainian (uk)
-- Before: supported uk (Ukrainian)
-- After: supports sk (Slovak) - aligns with Telegram and Panel language lists

DROP FUNCTION IF EXISTS public.fyd_normalize_lang(text);

CREATE OR REPLACE FUNCTION public.fyd_normalize_lang(l text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $func$
DECLARE v text;
BEGIN
  v := lower(coalesce(l,''));
  v := split_part(v,'-',1);
  IF v = '' THEN RETURN 'en'; END IF;
  -- Supported languages: en,pl,de,fr,it,es,pt,ru,cs,hu,sk
  IF v IN ('en','pl','de','fr','it','es','pt','ru','cs','hu','sk') THEN RETURN v; END IF;
  RETURN 'en';
END;
$func$;
