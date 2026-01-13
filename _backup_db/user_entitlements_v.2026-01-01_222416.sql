 SELECT u.id AS user_id,
    u.telegram_user_id,
    t.pc AS plan_code,
        CASE
            WHEN t.pc = 'trial'::text THEN u.created_at + '3 days'::interval
            ELSE sub.exp
        END AS expires_at,
    NULL::integer AS base_links_limit,
    NULL::integer AS extra_links,
        CASE
            WHEN t.pc = 'trial'::text THEN COALESCE(f.links_limit, 3)
            ELSE COALESCE(f.links_limit, 0)
        END AS links_limit_total,
    NULL::integer AS fast_slots,
    NULL::integer AS refresh_normal_s,
    NULL::integer AS refresh_fast_s,
    NULL::boolean AS group_chat_allowed,
    t.pn AS plan_name,
        CASE
            WHEN t.pc = 'trial'::text THEN COALESCE(f.history_limit, 200)
            ELSE COALESCE(f.history_limit, 0)
        END AS history_limit_total,
        CASE
            WHEN t.pc = 'trial'::text THEN COALESCE(f.daily_limit, 50)
            ELSE COALESCE(f.daily_limit, 0)
        END AS daily_notifications_limit
   FROM users u
     LEFT JOIN plans p ON p.id = u.plan_id OR p.code = u.plan
     CROSS JOIN LATERAL ( SELECT COALESCE(p.code, u.plan, 'trial'::text) AS pc,
            COALESCE(p.name, initcap(COALESCE(p.code, u.plan, 'trial'::text))) AS pn) t
     LEFT JOIN LATERAL ( SELECT max(
                CASE
                    WHEN pf.feature_key = ANY (ARRAY['links_limit_total'::text, 'links_limit'::text, 'max_links'::text]) THEN NULLIF(regexp_replace(pf.feature_value::text, '[^0-9]'::text, ''::text, 'g'::text), ''::text)::integer
                    ELSE NULL::integer
                END) AS links_limit,
            max(
                CASE
                    WHEN pf.feature_key = ANY (ARRAY['history_limit_total'::text, 'history_limit'::text, 'items_history_limit'::text, 'items_limit_total'::text]) THEN NULLIF(regexp_replace(pf.feature_value::text, '[^0-9]'::text, ''::text, 'g'::text), ''::text)::integer
                    ELSE NULL::integer
                END) AS history_limit,
            max(
                CASE
                    WHEN pf.feature_key = ANY (ARRAY['daily_notifications_limit'::text, 'daily_limit'::text, 'notifications_daily_limit'::text]) THEN NULLIF(regexp_replace(pf.feature_value::text, '[^0-9]'::text, ''::text, 'g'::text), ''::text)::integer
                    ELSE NULL::integer
                END) AS daily_limit
           FROM plan_features pf
          WHERE pf.plan_id = COALESCE(u.plan_id, p.id)) f ON true
     LEFT JOIN LATERAL ( SELECT NULL::timestamp with time zone AS exp
           FROM subscriptions s
          WHERE s.user_id = u.id
          ORDER BY NULL::timestamp with time zone DESC NULLS LAST
         LIMIT 1) sub ON true;
