import "./env.js";
import {
  initDb,
  ensureUser,
  getUserWithPlanByTelegramId,
  getUserEntitlementsByTelegramId
} from "./db.js";
import { registerStripeWebhookRoutes } from "./stripe-webhook.js";
import Stripe from "stripe";
const stripeApi = new Stripe(process.env.STRIPE_SECRET_KEY || process.env.STRIPE_API_KEY || "", { apiVersion: "2023-10-16" });

function ensureStripe() { return stripeApi; }
console.warn("[MARK] index.js start", new Date().toISOString());

// ===== FYD_COMPAT_AUTOFIX (auto-added) =====
const __FYD_COMPAT = globalThis.__FYD_COMPAT || (globalThis.__FYD_COMPAT = {});
async function __fydGetPool() {
  if (__FYD_COMPAT.pool) return __FYD_COMPAT.pool;
  const pg = await import('pg');
  const Pool = (pg.default && pg.default.Pool) ? pg.default.Pool : (pg.Pool ? pg.Pool : pg.default);
  __FYD_COMPAT.pool = new Pool({ connectionString: process.env.DATABASE_URL });
  return __FYD_COMPAT.pool;
}
async function __fydQuery(text, params=[]) { const pool = await __fydGetPool(); return pool.query(text, params); }

const sqlPool = { query: (text, params) => __fydQuery(text, params) };

async function countEnabledLinksForUserId(userId) {
  const { rows } = await __fydQuery(
    'SELECT COUNT(*)::int AS c FROM links WHERE user_id=$1 AND active=TRUE',
    [Number(userId)]
  );
  return rows[0]?.c || 0;
}

// ===== /FYD_COMPAT_AUTOFIX =====


import express from "express";

import { makeRequireUser } from "./panel-dev-auth.js";
import { createTelegramClient } from "./telegram.js";
import { createLinkCounters } from "./link-counters.js";
import pg__fyd from "pg";
const { Pool: Pool__fyd } = pg__fyd;

// FYD hotfix: db dla endpointów używających db.query(...)
const db =
  globalThis.__FYD_API_DB__ ||
  (globalThis.__FYD_API_DB__ =
    process.env.DATABASE_URL
      ? new Pool__fyd({ connectionString: process.env.DATABASE_URL })
      : new Pool__fyd());

const { countActiveLinksForUserId, countAllLinksForUserId } = createLinkCounters(db);



// Auto-detekcja tabeli z linkami + liczniki dla /me i /status (żeby nie wywalało API)
let __fydLinksMetaPromise = null;

function __fydIdent(x) {
  const v = String(x ?? "");
  return '"' + v.replace(/"/g, '""') + '"';
}

function __fydPickFirst(cols, names) {
  for (const n of names) if (cols.has(n)) return n;
  return null;
}

async function __fydDetectLinksMeta() {
  if (__fydLinksMetaPromise) return __fydLinksMetaPromise;

  __fydLinksMetaPromise = (async () => {
    const { rows } = await db.query(`
      SELECT table_name, column_name
      FROM information_schema.columns
      WHERE table_schema='public'
      ORDER BY table_name, ordinal_position
    `);

    const tables = new Map(); // table -> Set(columns)
    for (const r of rows) {
      if (!tables.has(r.table_name)) tables.set(r.table_name, new Set());
      tables.get(r.table_name).add(r.column_name);
    }

    let best = null;
    let bestScore = -1;

    for (const [t, cols] of tables.entries()) {
      const userCol = __fydPickFirst(cols, ["user_id", "telegram_user_id"]);
      const urlCol  = __fydPickFirst(cols, ["url", "link", "link_url", "search_url", "query_url"]);
      if (!userCol || !urlCol) continue;

      const enabledCol = __fydPickFirst(cols, ["enabled","is_enabled","active","is_active","disabled","is_disabled"]);
      const deletedCol = __fydPickFirst(cols, ["deleted_at","removed_at","deleted"]);

      let score = 0;
      score += 10; // ma user+url
      if (cols.has("id")) score += 2;
      if (enabledCol) score += 2;
      if (cols.has("title") || cols.has("name") || cols.has("label")) score += 1;
      const tl = String(t).toLowerCase();
      if (tl.includes("link")) score += 2;

      if (score > bestScore) {
        bestScore = score;
        best = { table: t, userCol, urlCol, enabledCol, deletedCol };
      }
    }

    if (!best) {
      throw new Error("[FYD] Nie wykryłem tabeli z linkami (brak tabeli z user_id/telegram_user_id + url/link)");
    }
    return best;
  })();

  return __fydLinksMetaPromise;
}

async function __fydCountLinks(userId, onlyEnabled) {
  const meta = await __fydDetectLinksMeta();

  const where = [`${__fydIdent(meta.userCol)} = $1`];

  if (meta.deletedCol) {
    where.push(`${__fydIdent(meta.deletedCol)} IS NULL`);
  }

  if (onlyEnabled && meta.enabledCol) {
    const c = meta.enabledCol;
    if (c.includes("disabled")) where.push(`${__fydIdent(c)} = false`);
    else where.push(`${__fydIdent(c)} = true`);
  }

  const q = `SELECT COUNT(*)::int AS c FROM ${__fydIdent(meta.table)} WHERE ${where.join(" AND ")}`;
  const { rows } = await db.query(q, [userId]);
  return (rows && rows[0] && rows[0].c) ? rows[0].c : 0;
}

// Te nazwy woła Twoje api/index.js:
async function countActiveLinksForUserId(userId) {
  return __fydCountLinks(userId, true);
}
async function countAllLinksForUserId(userId) {
  return __fydCountLinks(userId, false);
}
const app = express();


function isPlanSubscription(sub) {
  try {
    const addonPriceId =
      process.env.FYD_PRICE_ADDON10 ||
      process.env.STRIPE_PRICE_ADDON ||
      process.env.STRIPE_ADDON_PRICE_ID ||
      process.env.STRIPE_FYD_ADDON_PRICE_ID ||
      "";

    const items = Array.isArray(sub?.items?.data) ? sub.items.data : [];
    const priceIds = items.map(x => x?.price?.id).filter(Boolean).map(String);

    if (!priceIds.length) return true;
    if (addonPriceId && priceIds.includes(String(addonPriceId))) return false;

    return true;
  } catch {
    return true;
  }
}




async function upsertPlanSubscriptionRow(sqlPoolArg, userIdArg, stripeCustomerIdArg, subArg) {
  const db =
    (sqlPoolArg && typeof sqlPoolArg.query === "function") ? sqlPoolArg :
    (typeof sqlPool !== "undefined" && sqlPool && typeof sqlPool.query === "function") ? sqlPool :
    null;

  const userId = Number(userIdArg);
  const stripeCustomerId = stripeCustomerIdArg ? String(stripeCustomerIdArg) : null;
  const sub = subArg || null;
  const subId = sub?.id ? String(sub.id) : null;

  if (!db) throw new Error("upsertPlanSubscriptionRow: missing db pool");
  if (!Number.isFinite(userId) || userId <= 0) throw new Error("upsertPlanSubscriptionRow: bad userId");
  if (!subId) throw new Error("upsertPlanSubscriptionRow: missing subId");

  // mapowanie PRICE -> plan_id (fallback na hardcoded LIVE ids z pliku)
  const starterPrice = String(process.env.FYD_PRICE_STARTER || process.env.STRIPE_PRICE_STARTER || "price_1SHql9JoZ7gqc85wcoraiZTZ");
  const growthPrice  = String(process.env.FYD_PRICE_GROWTH  || process.env.STRIPE_PRICE_GROWTH  || "price_1SHql9JoZ7gqc85wctFb985k");
  const platPrice    = String(process.env.FYD_PRICE_PLATINUM|| process.env.STRIPE_PRICE_PLATINUM|| "price_1SHql9JoZ7gqc85wu6GC6JzR");

  const priceId = (
    sub?.items?.data?.[0]?.price?.id ||
    sub?.items?.data?.[0]?.price ||
    null
  );
  const pid = priceId ? String(priceId) : "";

  let planId = 0;
  if (pid === starterPrice) planId = 2;
  else if (pid === growthPrice) planId = 3;
  else if (pid === platPrice) planId = 4;

  if (!planId) {
    const code = String(sub?.metadata?.plan_code || sub?.metadata?.plan || "").toLowerCase();
    if (code === "starter" || code === "basic") planId = 2;
    else if (code === "growth" || code === "pro") planId = 3;
    else if (code === "platinum") planId = 4;
  }

  if (!planId) throw new Error("upsertPlanSubscriptionRow: cannot map price to plan_id: " + pid);

  const status = String(sub?.status || "active");
  const currentPeriodEnd = sub?.current_period_end ? new Date(Number(sub.current_period_end) * 1000) : null;

  // UPDATE -> INSERT (bez ON CONFLICT, bo nie zakładamy constraintu)
  try {
    const upd = await db.query(
      `UPDATE public.subscriptions
          SET user_id=$1,
              plan_id=$2,
              provider_customer_id=COALESCE($3, provider_customer_id),
              status=COALESCE($4, status),
              current_period_end=COALESCE($5, current_period_end)
        WHERE provider='stripe' AND provider_subscription_id=$6
        RETURNING id`,
      [userId, planId, stripeCustomerId, status, currentPeriodEnd, subId]
    );

    if ((upd?.rowCount || 0) == 0) {
      await db.query(
        `INSERT INTO public.subscriptions
           (user_id, plan_id, provider, provider_subscription_id, provider_customer_id, status, current_period_end, created_at)
         VALUES
           ($1,$2,'stripe',$3,$4,$5,$6,NOW())`,
        [userId, planId, subId, stripeCustomerId, status, currentPeriodEnd]
      );
    }
  } catch (e) {
    // fallback minimalny (gdy brakuje kolumn typu provider_customer_id/status/current_period_end)
    const upd2 = await db.query(
      `UPDATE public.subscriptions
          SET user_id=$1, plan_id=$2
        WHERE provider='stripe' AND provider_subscription_id=$3
        RETURNING id`,
      [userId, planId, subId]
    );
    if ((upd2?.rowCount || 0) == 0) {
      await db.query(
        `INSERT INTO public.subscriptions (user_id, plan_id, provider, provider_subscription_id, created_at)
         VALUES ($1,$2,'stripe',$3,NOW())`,
        [userId, planId, subId]
      );
    }
  }

  // users: plan + expiry (jak się da)
  try {
    if (stripeCustomerId) {
      await db.query(
        `UPDATE public.users
            SET stripe_customer_id=$1, updated_at=NOW()
          WHERE id=$2 AND (stripe_customer_id IS NULL OR stripe_customer_id=$1)`,
        [stripeCustomerId, userId]
      );
    }
  } catch {}

  try {
    await db.query(
      `UPDATE public.users u
          SET plan_name=p.code,
              plan_expires_at=$2,
              updated_at=NOW()
         FROM public.plans p
        WHERE u.id=$1 AND p.id=$3`,
      [userId, currentPeriodEnd, planId]
    );
  } catch {}

  try { await db.query(`UPDATE public.users SET trial_used=TRUE, updated_at=NOW() WHERE id=$1`, [userId]); } catch {}

  return true;
}





app.post(
  "/api/store/stripe/webhook-fyd",
  express.raw({ type: "application/json", limit: "2mb" }),
  async (req, res) => {
    try {
      const stripeApi = ensureStripe();
      const secret = process.env.STRIPE_FYD_WEBHOOK_SECRET || "";
      const sig = req.headers["stripe-signature"];

      const raw = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body || "");
      let event;

      if (secret && sig) {
        event = stripeApi.webhooks.constructEvent(raw, sig, secret);
      } else {
        if (secret && !sig) console.log("[stripe-fyd] WARN: missing stripe-signature header (test mode?)");
        event = JSON.parse(raw.toString("utf8") || "{}");
      }

      if (event.type !== "checkout.session.completed") return;

      const session = event?.data?.object;
      if (!session || session.mode !== "subscription") return;

      const subId = session.subscription || "";
      const customerId = session.customer || "";
      const csId = session.id || "";
      const meta = session.metadata || {};

      const planId = parseInt(meta.fyd_plan_id || "0", 10) || 0;
      const addonPacks = parseInt(meta.fyd_addon_packs || "0", 10) || 0;
      const activationToken = String(meta.fyd_activation_token || "").trim();

      if (!subId || !planId) return;

      const providerRef =
        `sub:${subId}|customer:${customerId || "?"}|addon_packs=${addonPacks}|cs:${csId || "?"}`;

      const db = sqlPool;

      if (activationToken) {
        const row = await db.query(
          `SELECT token FROM activation_tokens WHERE token=$1 LIMIT 1`,
          [activationToken]
        );

        if (row.rowCount) {
          await db.query(
            `UPDATE activation_tokens
             SET provider='stripe',
                 provider_ref=$2
             WHERE token=$1`,
            [activationToken, providerRef]
          );
          console.log(`[stripe-fyd] TOKEN_CONFIRMED=${activationToken} sub=${subId} plan_id=${planId} addon_packs=${addonPacks}`);
          return;
        }

        await db.query(
          `INSERT INTO activation_tokens (token, plan_id, provider, provider_ref, expires_at)
           VALUES ($1, $2, 'stripe', $3, NOW() + INTERVAL '7 days')`,
          [activationToken, planId, providerRef]
        );
        console.log(`[stripe-fyd] TOKEN_INSERTED_FROM_META=${activationToken} sub=${subId} plan_id=${planId} addon_packs=${addonPacks}`);
        return;
      }

      const { randomBytes } = await import("node:crypto");
      const token = randomBytes(28).toString("hex");

      await db.query(
        `INSERT INTO activation_tokens (token, plan_id, provider, provider_ref, expires_at)
         VALUES ($1, $2, 'stripe', $3, NOW() + INTERVAL '7 days')`,
        [token, planId, providerRef]
      );

      console.log(`[stripe-fyd] TOKEN_CREATED=${token} sub=${subId} plan_id=${planId} addon_packs=${addonPacks}`);
      return;
    } catch (e) {
      console.log("[stripe-fyd] webhook error", e?.message || e);
      return res.sendStatus(500);
    }
  }
);
// --- end Stripe webhook ---

const port = process.env.PORT || 3000;

// =================== STRIPE WEBHOOK (MUST BE BEFORE express.json) ===================

async function markWebhookProcessed(sqlPool, eventId) {
  await db.query(
    `UPDATE stripe_webhook_events
     SET status='processed', processed_at=now(), last_error=NULL
     WHERE event_id=$1`,
    [eventId]
  );
}

async function markWebhookError(sqlPool, eventId, err) {
  const msg = String(err?.message || err || "").slice(0, 1800);
  await db.query(
    `UPDATE stripe_webhook_events
     SET status='error', last_error=$2
     WHERE event_id=$1`,
    [eventId, msg]
  );
}

async function handleStripeEvent(sqlPool, event) {
  const t = event.type;

  // checkout.session.completed
  if (t === "checkout.session.completed") {
    
    // __FYD_STRIPE_IDEMPOTENCY_V1__
    try {
      const sessionObj = event && event.data && event.data.object ? event.data.object : null;
      const idemK = (sessionObj && sessionObj.payment_intent) ? `pi:${sessionObj.payment_intent}`
        : (sessionObj && sessionObj.id) ? `cs:${sessionObj.id}`
        : `evt:${event.id}`;
      const rr = await db.query(
        "INSERT INTO public.stripe_idempotency(k,event_id,event_type) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING RETURNING k",
        [idemK, event.id, t]
      );
      if (!rr || !rr.rowCount) {
        console.log("[stripe] duplicate event ignored", { t, idemK, eventId: event.id });
        return;
      }
    } catch (e) {
      console.error("[stripe] idempotency insert failed", e?.message || e);
    }
const session = event.data.object;
    const stripeCustomerId = session?.customer ? String(session.customer) : null;
    const stripeSubscriptionId = session?.subscription ? String(session.subscription) : null;

    const metaUserId = session?.metadata?.user_id ? Number(session.metadata.user_id) : null;
    const metaTg = session?.metadata?.telegram_user_id ? String(session.metadata.telegram_user_id) : null;

    let userId = metaUserId;
    if (!userId && metaTg) {
      const r = await db.query(
        "SELECT id FROM users WHERE telegram_user_id=$1 LIMIT 1",
        [Number(metaTg)]
      );
      userId = r.rows[0]?.id || null;
    }
    if (!userId) {
      console.error("[stripe] cannot resolve user for checkout.session.completed", { metaUserId, metaTg });
      return;
    }

    if (stripeCustomerId) {
      await db.query("UPDATE users SET stripe_customer_id=$1 WHERE id=$2 AND (stripe_customer_id IS NULL OR stripe_customer_id=$1)", [stripeCustomerId, userId]);
    }

    // ADDON purchase: apply packs directly from checkout.session (idempotent by addon_purchases)
    const kind = String(session?.metadata?.kind || "");
    const planCode = String(session?.metadata?.plan_code || "");
    if (kind === "addon" || planCode === "addon") {
      const csId = String(session?.id || "");
      let packs = 0;
      try {
        const li = await stripeApi.checkout.sessions.listLineItems(csId, { limit: 100 });
        for (const x of (li?.data || [])) packs += Number(x.quantity || 0) || 0;
      } catch (e) {
        console.error("[addon] listLineItems error", e?.message || e);
      }
      packs = Math.max(1, packs || 0);

      const ins = await db.query(
        `INSERT INTO addon_purchases (stripe_checkout_session_id, user_id, packs)
         VALUES ($1, $2, $3)
         ON CONFLICT (stripe_checkout_session_id) DO NOTHING`,
        [csId, userId, packs]
      );

      if (ins.rowCount === 1) {
        const upd = await db.query(
          `UPDATE subscriptions s
           SET addon_qty = COALESCE(s.addon_qty,0) + $2,
               updated_at = NOW()
           FROM plans p
           WHERE p.id = s.plan_id
             AND p.code = 'platinum'
             AND s.user_id = $1
             AND s.status = 'active'
           RETURNING s.id, s.addon_qty`,
          [userId, packs]
        );
        console.log(`[addon] applied packs=${packs} cs=${csId} updated_rows=${upd.rowCount}`);
      } else {
        console.log(`[addon] already applied cs=${csId}`);
      }
      return;
    }


    if (stripeCustomerId && stripeSubscriptionId) {
      const sub = await stripeApi.subscriptions.retrieve(stripeSubscriptionId, { expand: ["items.data.price"] });
      if (isPlanSubscription(sub)) {
        await upsertPlanSubscriptionRow(sqlPool, userId, stripeCustomerId, sub);
      } else {
      // addon handled by checkout.session.completed
    }
    } else if (stripeCustomerId) {
      // fallback (np. addon): przelicz addony po customer
      // addon handled by checkout.session.completed
    }
    return;
  }

  // customer.subscription.*
  if (
    t === "customer.subscription.created" ||
    t === "customer.subscription.updated" ||
    t === "customer.subscription.deleted"
  ) {
    const obj = event.data.object;
    const stripeCustomerId = obj?.customer ? String(obj.customer) : null;
    const stripeSubscriptionId = obj?.id ? String(obj.id) : null;
    if (!stripeCustomerId) return;

    // czasem invoice.* nie niesie subscription (np. przy resend) — wtedy aktualizujemy addon po customer
    if (!stripeSubscriptionId) {
      // addon handled by checkout.session.completed
      return;
    }

    const ur = await db.query("SELECT id FROM users WHERE stripe_customer_id=$1 LIMIT 1", [stripeCustomerId]);
    const userId = ur.rows[0]?.id || null;
    if (!userId) return;

    // invoice.* czasem nie niesie subscription (np. addon) – wtedy przeliczamy addon_qty po customerze
    if (!stripeSubscriptionId) {
      // addon handled by checkout.session.completed
      return;
    }

    const sub = await stripeApi.subscriptions.retrieve(stripeSubscriptionId, { expand: ["items.data.price"] });
    if (isPlanSubscription(sub)) {
      await upsertPlanSubscriptionRow(sqlPool, userId, stripeCustomerId, sub);
    } else {
      // addon handled by checkout.session.completed
    }
    return
  }

  // invoice.*
  // Addon rozliczamy po invoice (bo payload bywa bez subscription/lines)
  if (t === "invoice.paid" || t === "invoice.payment_succeeded" || t === "invoice.payment_failed") {
    const invoice = event.data.object;
    const invoiceId = invoice?.id ? String(invoice.id) : null;
    const stripeCustomerId = invoice?.customer ? String(invoice.customer) : null;
    if (!invoiceId || !stripeCustomerId) return;

    const ur = await db.query("SELECT id FROM users WHERE stripe_customer_id=$1 LIMIT 1", [stripeCustomerId]);
    const userId = ur.rows[0]?.id || null;
    if (!userId) return;

    const addonPriceId = process.env.FYD_PRICE_ADDON10 || process.env.STRIPE_PRICE_ADDON || "";

    // jeśli opłacone: nalicz addon(y) po liniach faktury (idempotencja po invoice_id)
    if (addonPriceId && (t === "invoice.paid" || t === "invoice.payment_succeeded")) {
      
      // __FYD_ADDON_INVOICE_SKIP_V1__
      console.log("[stripe] addon invoice ignored (handled by checkout.session.completed)");
      return;
try {
        const inv = await stripeApi.invoices.retrieve(invoiceId, { expand: ["lines.data.price"] });

        let packs = 0;
        for (const line of (inv?.lines?.data || [])) {
          const pid = line?.price?.id ? String(line.price.id) : "";
          if (pid === addonPriceId) packs += Number(line.quantity || 0) || 0;
        }

        if (packs > 0) {
          const ins = await db.query(
            `INSERT INTO addon_invoice_applied (stripe_invoice_id, user_id, packs)
             VALUES ($1,$2,$3)
             ON CONFLICT (stripe_invoice_id) DO NOTHING
             RETURNING stripe_invoice_id`,
            [invoiceId, userId, packs]
          );

          if (ins.rowCount > 0) {
            await db.query(
              `UPDATE subscriptions s
               SET addon_qty = COALESCE(s.addon_qty,0) + $2,
                   updated_at = NOW()
               FROM plans p
               WHERE p.id = s.plan_id
                 AND p.code = 'platinum'
                 AND s.user_id = $1
                 AND s.status = 'active'`,
              [userId, packs]
            );
            console.log("[stripe] addon applied from invoice", { invoiceId, userId, packs });
          }
        }
      } catch (e) {
        console.error("[stripe] addon invoice handling error", e?.message || e);
      }
    }

    // standard: jak mamy subscription, aktualizuj sub row / addon qty
    let stripeSubscriptionId = invoice?.subscription ? String(invoice.subscription) : null;
    if (!stripeSubscriptionId) {
      try {
        const inv2 = await stripeApi.invoices.retrieve(invoiceId);
        if (inv2?.subscription) stripeSubscriptionId = String(inv2.subscription);
      } catch (_) {}
    }
    if (!stripeSubscriptionId) return;

    const sub = await stripeApi.subscriptions.retrieve(stripeSubscriptionId, { expand: ["items.data.price"] });
    if (isPlanSubscription(sub)) {
      await upsertPlanSubscriptionRow(sqlPool, userId, stripeCustomerId, sub);
    } else {
      // addon handled by checkout.session.completed
    }
    return;
  }

  // inne eventy: logujemy w DB i kończymy
}


registerStripeWebhookRoutes(app, express, { db, sqlPool, stripeApi, handleStripeEvent, markWebhookProcessed, markWebhookError });

// JSON dla reszty API (webhook musi być wyżej)

// --- CORS for /api/store (WordPress activation page) ---
app.use((req, res, next) => {
  if (req.path && req.path.startsWith("/api/store/")) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") return res.sendStatus(204);
  }
  next();
});
// --- /CORS for /api/store ---

app.use(express.json());

// =================== HELPERS: plan_features ===================
function formatEntitlementsStatus(ent) {
  if (!ent) return "Plan: unknown";
  const code = String(ent.plan_code || "free").toLowerCase();
  const exp = ent.expires_at ? new Date(ent.expires_at).toISOString() : null;
  if (code === "free") return "Plan: Free";
  return `Plan: ${code}${exp ? " (do " + exp + ")" : ""}`;
}

async function getPlanRowByCode(code) {
  if (!code || String(code).toLowerCase() === "none") return null;
  const q = `SELECT id, code, name, active FROM plans WHERE code=$1 LIMIT 1;`;
  const { rows } = await db.query(q, [String(code).toLowerCase()]);
  return rows[0] || null;
}

async function getPlanFeaturesByPlanId(planId) {
  if (!planId) return {};
  const q = `SELECT feature_key, feature_value FROM plan_features WHERE plan_id=$1;`;
  const { rows } = await db.query(q, [planId]);
  const out = {};
  for (const r of rows) out[r.feature_key] = r.feature_value;
  return out;
}

function detectSourceFromUrl(url) {
  const u = String(url || "").toLowerCase();
  if (u.includes("olx.")) return "olx";
  if (u.includes("vinted.")) return "vinted";
  return "unknown";
}

function getLinksLimitFromFeatures(features, user) {
  // priorytet: features.links_limit (z DB)
  const base = Number(features?.links_limit);
  let limit = Number.isFinite(base) ? base : getEffectiveLinkLimit(user);

  // opcjonalnie + pakiety (masz to w users)
  if (String(user?.plan_name || "").toLowerCase() === "platinum") {
    const packs = Number(user?.extra_link_packs || 0);
    if (Number.isFinite(packs) && packs > 0) limit += packs * 10;
  }
  return limit;
}

function getDurationDays(planCode, features) {
  // jeśli kiedyś dodasz feature duration_days – zadziała automatycznie
  const v = features?.duration_days;
  const n = Number(v?.days ?? v?.value ?? v);
  if (Number.isFinite(n) && n > 0) return n;

  // fallback (u Ciebie w DB nie ma duration_days)
  const code = String(planCode || "").toLowerCase();
  if (code === "trial") return 3;
  return 30; // basic/pro/platinum
}

// =================== HEALTHCHECK ===================
app.get("/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// =================== BILLING: STRIPE CHECKOUT (internal) ===================
app.post("/billing/stripe/checkout", async (req, res) => {
  try {
    const key = req.headers["x-internal-key"];
    if (!key || key !== process.env.INTERNAL_API_KEY) {
      return res.status(401).json({ ok: false });
    }

    const planCode = String(req.body?.plan_code || "").toLowerCase().trim();
    const telegramUserId = req.body?.telegram_user_id ? Number(req.body.telegram_user_id) : null;
    const addonQty = req.body?.addon_qty ? Number(req.body.addon_qty) : 1;

    if (!telegramUserId) return res.status(400).json({ ok: false, error: "missing_telegram_user_id" });

    const ur = await db.query(
      "SELECT id, stripe_customer_id FROM users WHERE telegram_user_id=$1 LIMIT 1",
      [telegramUserId]
    );
    const user = ur.rows[0];
    if (!user) return res.status(404).json({ ok: false, error: "user_not_found" });

    const successUrl = `${process.env.PUBLIC_APP_URL}/billing/success`;
    const cancelUrl  = `${process.env.PUBLIC_APP_URL}/billing/cancel`;

    let priceId = null;
    if (planCode === "starter")  priceId = process.env.FYD_PRICE_STARTER  || process.env.STRIPE_PRICE_STARTER;
    else if (planCode === "growth")   priceId = process.env.FYD_PRICE_GROWTH   || process.env.STRIPE_PRICE_GROWTH;
    else if (planCode === "platinum") priceId = process.env.FYD_PRICE_PLATINUM || process.env.STRIPE_PRICE_PLATINUM;
    else if (planCode === "addon")    priceId = process.env.FYD_PRICE_ADDON10  || process.env.STRIPE_PRICE_ADDON;

    if (!priceId) return res.status(400).json({ ok: false, error: "invalid_plan_or_missing_price" });

    const session = await ensureStripe().checkout.sessions.create({

      // __FYD_CHECKOUT_META_PATCH_V1__
      allow_promotion_codes: true,
      ...(() => {
        const uid =
          (typeof userId !== "undefined" && userId) ||
          (typeof user !== "undefined" && user && user.id) ||
          (typeof req !== "undefined" && req && req.user && req.user.id) ||
          null;

        const tg =
          (typeof telegramUserId !== "undefined" && telegramUserId) ||
          (typeof tgUserId !== "undefined" && tgUserId) ||
          (typeof tgId !== "undefined" && tgId) ||
          (typeof user !== "undefined" && user && user.telegram_user_id) ||
          (typeof req !== "undefined" && req && req.user && req.user.telegram_user_id) ||
          null;

        const meta = {};
        if (uid) meta.user_id = String(uid);
        if (tg) meta.telegram_user_id = String(tg);

        return Object.keys(meta).length ? { metadata: meta } : {};
      })(),
      ...(() => {
        const ref =
          (typeof telegramUserId !== "undefined" && telegramUserId) ||
          (typeof tgUserId !== "undefined" && tgUserId) ||
          (typeof tgId !== "undefined" && tgId) ||
          (typeof user !== "undefined" && user && user.telegram_user_id) ||
          (typeof req !== "undefined" && req && req.user && req.user.telegram_user_id) ||
          (typeof userId !== "undefined" && userId) ||
          (typeof user !== "undefined" && user && user.id) ||
          (typeof req !== "undefined" && req && req.user && req.user.id) ||
          null;

        return ref ? { client_reference_id: String(ref) } : {};
      })(),

      allow_promotion_codes: true,
mode: "subscription",
      customer: user.stripe_customer_id || undefined,
      line_items: [{ price: priceId, quantity: planCode === "addon" ? Math.max(1, addonQty) : 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        user_id: String(user.id),
        telegram_user_id: String(telegramUserId),
        kind: planCode === "addon" ? "addon" : "plan",
        plan_code: planCode,
      },
    });

    return res.json({ ok: true, url: session.url });
  } catch (e) {
    console.error("[billing/stripe/checkout] error", e?.message || e);
    return res.status(500).json({ ok: false, error: "checkout_error" });
  }
});

// =================== TELEGRAM CONFIG ===================
const { sendMessage: tgSend } = createTelegramClient();

// =================== PANEL AUTH (DEV) ===================
const requireUser = makeRequireUser({ ensureUser, getUserWithPlanByTelegramId, getUserEntitlementsByTelegramId });

// =================== PANEL: /plans ===================
app.get("/plans", async (req, res) => {
  try {
    const q = `
      SELECT
        p.id,
        p.code,
        p.name,
        p.active,
        COALESCE(
          jsonb_object_agg(f.feature_key, f.feature_value)
            FILTER (WHERE f.feature_key IS NOT NULL),
          '{}'::jsonb
        ) AS features
      FROM plans p
      LEFT JOIN plan_features f ON f.plan_id = p.id
      WHERE p.active = true
      GROUP BY p.id
      ORDER BY p.id ASC;
    `;
    const { rows } = await db.query(q);
    res.json(rows);
  } catch (e) {
    console.error("GET /plans error:", e);
    res.status(500).json({ error: "PLANS_QUERY_FAILED" });
  }
});

// =================== PANEL: /me ===================
app.get("/me", requireUser, async (req, res) => {
  const user = req.user;

  const ent = req.entitlements;
  const planRow = await getPlanRowByCode(ent?.plan_code || user.plan_name);
  const features = await getPlanFeaturesByPlanId(planRow?.id);

  const totalLinks = await countAllLinksForUserId(user.id); // wszystkie linki (limit)
  const enabledLinks = await countEnabledLinksForUserId(user.id); // tylko active=TRUE

  const maxTotalLinks = Number(ent?.links_limit_total ?? 0);

  res.json({
    id: user.id,
    telegram_user_id: user.telegram_user_id,
    username: user.username,
    first_name: user.first_name,
    last_name: user.last_name,
    language_code: user.language_code,

    plan: planRow ? { id: planRow.id, code: planRow.code, name: planRow.name } : { code: "none" },
    plan_expires_at: ent?.expires_at ?? null,
    extra_link_packs: user.extra_link_packs,
    trial_used: user.trial_used,

    features,
    limits: {
      total_links: totalLinks,
      max_total_links: maxTotalLinks,
      active_links: enabledLinks,
      max_active_links: maxTotalLinks
    },

    status_text: formatEntitlementsStatus(ent)
  });
});

// =================== PANEL: /links ===================
app.get("/links", requireUser, async (req, res) => {
  const rows = await getLinksByUser(req.telegramUserId);
  res.json(rows);
});

app.post("/links", requireUser, async (req, res) => {
  const { url, name } = req.body || {};
  if (!url) return res.status(400).json({ error: "MISSING_URL" });

  const user = req.user;

  const ent = req.entitlements;
  const limitFromEnt = Number(ent?.links_limit_total ?? 0);
  if (!ent || limitFromEnt <= 0) return res.status(403).json({ error: "PLAN_INACTIVE" });

  const planRow = await getPlanRowByCode(ent?.plan_code || user.plan_name);
  const features = await getPlanFeaturesByPlanId(planRow?.id);

  // enforce sources_allowed
  const src = detectSourceFromUrl(url);
  const allowed = Array.isArray(features?.sources_allowed) ? features.sources_allowed : null;
  if (allowed && !allowed.includes(src)) {
    return res.status(400).json({
      error: "SOURCE_NOT_ALLOWED",
      source: src,
      allowed_sources: allowed
    });
  }

  const totalLinks = await countActiveLinksForUserId(user.id); // UWAGA: liczy ŁĄCZNIE (limit)
  const enabledLinks = await countEnabledLinksForUserId(user.id); // tylko active=TRUE

  const limit = limitFromEnt;

  if (totalLinks >= limit) {
    return res.status(403).json({
      error: "LINK_LIMIT_REACHED",
      message: `Osiągnięto limit linków: ${totalLinks}/${limit}`
    });
  }

  const row = await insertLink(req.telegramUserId, name || "Monitorowanie", url);
  if (!row) return res.status(500).json({ error: "INSERT_LINK_FAILED" });

  res.json({ ok: true, link: row });
});

app.delete("/links/:id", requireUser, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "BAD_ID" });

  const ok = await deleteLink(id, req.telegramUserId);
  res.json({ ok });
});

// =================== PANEL: /activate ===================
app.post("/activate", requireUser, async (req, res) => {
  const token = String(req.body?.token || "").trim();
  if (!token) return res.status(400).json({ error: "MISSING_TOKEN" });

  const tgId = req.telegramUserId;

  try {
    await db.query("BEGIN");

    const tokQ = `
      SELECT token, plan_id, provider, provider_ref, expires_at, used_at
      FROM activation_tokens
      WHERE token = $1
      FOR UPDATE;
    `;
    const tok = await db.query(tokQ, [token]);
    if (!tok.rows.length) {
      await db.query("ROLLBACK");
      return res.status(404).json({ error: "TOKEN_NOT_FOUND" });
    }

    const t = tok.rows[0];
    if (t.used_at) {
      await db.query("ROLLBACK");
      return res.status(409).json({ error: "TOKEN_ALREADY_USED" });
    }
    if (new Date(t.expires_at).getTime() < Date.now()) {
      await db.query("ROLLBACK");
      return res.status(410).json({ error: "TOKEN_EXPIRED" });
    }

    const uQ = `SELECT id FROM users WHERE telegram_user_id = $1 LIMIT 1;`;
    const u = await db.query(uQ, [tgId]);
    if (!u.rows.length) {
      await db.query("ROLLBACK");
      return res.status(404).json({ error: "USER_NOT_FOUND" });
    }
    const userId = u.rows[0].id;

    const pQ = `SELECT id, code, name FROM plans WHERE id = $1 LIMIT 1;`;
    const p = await db.query(pQ, [t.plan_id]);
    if (!p.rows.length) {
      await db.query("ROLLBACK");
      return res.status(404).json({ error: "PLAN_NOT_FOUND" });
    }
    const plan = p.rows[0];

    const features = await getPlanFeaturesByPlanId(plan.id);
    const durationDays = getDurationDays(plan.code, features);

    const now = new Date();
    const periodEnd = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

    await db.query(
      `UPDATE activation_tokens SET used_at=now(), used_by_telegram_user_id=$2 WHERE token=$1;`,
      [token, tgId]
    );

    const providerSubId = t.provider_ref || `token:${token}`;
    const subQ = `
      INSERT INTO subscriptions
        (user_id, plan_id, provider, provider_customer_id, provider_subscription_id, status, current_period_end)
      VALUES
        ($1, $2, $3, NULL, $4, 'active', $5)
      RETURNING *;
    `;
    const sub = await db.query(subQ, [userId, plan.id, t.provider, providerSubId, periodEnd]);

    await db.query(
      `
      UPDATE users
      SET plan_name=$2,
          plan_started_at=$3,
          plan_expires_at=$4,
          updated_at=now()
      WHERE id=$1;
      `,
      [userId, plan.code, now, periodEnd]
    );

    await db.query("COMMIT");

    return res.json({
      ok: true,
      activated: {
        plan: { id: plan.id, code: plan.code, name: plan.name },
        features,
        period_end: periodEnd.toISOString()
      },
      subscription: sub.rows[0]
    });
  } catch (e) {
    console.error("POST /activate error:", e);
    try { await db.query("ROLLBACK"); } catch {}
    return res.status(500).json({ error: "ACTIVATE_FAILED" });
  }
});

// =================== TELEGRAM WEBHOOK (zostaje) ===================
app.post("/telegram-webhook", async (req, res) => {
  console.log("Webhook:", JSON.stringify(req.body, null, 2));
  res.sendStatus(200);

  try {
    const msg = req.body?.message;
    if (!msg) return;

    const chatId = msg.chat?.id;
    const text = msg.text ?? "";
    const from = msg.from;

    if (!chatId || !from?.id) return;

    await ensureUser(
      from.id,
      from.username || null,
      from.first_name || null,
      from.last_name || null,
      from.language_code || null
    );

    if (text.startsWith("/start")) {
      await tgSend(
        chatId,
        "👋 Cześć!\n\nBot FindYourDeal działa.\n\nKomendy:\n" +
          "/dodaj <link> <nazwa>\n" +
          "/lista\n" +
          "/usun <id>\n" +
          "/status"
      );
      return;
    }

    if (text.startsWith("/status")) {
      const user = await getUserWithPlanByTelegramId(from.id);
      if (!user) {
        await tgSend(chatId, "❗ Nie znaleziono użytkownika w bazie. Spróbuj użyć /start.");
        return;
      }

      const ent = await getUserEntitlementsByTelegramId(from.id);

      const enabledLinks = await countEnabledLinksForUserId(user.id);
      const limit = Number(ent?.links_limit_total ?? 0);

      const planLine = formatEntitlementsStatus(ent);
      const linksLine = `Aktywne linki: ${enabledLinks}/${limit}`;

      const out = ["ℹ️ Status bota", "", planLine, linksLine].join("\n");
      await tgSend(chatId, out);
      return;
    }

    await tgSend(chatId, "❓ Nieznana komenda.");
  } catch (e) {
    console.error("ERR:", e);
  }
});

// START SERVER
initDb().then(() => {
  console.log("DB OK");
  

// --- WooCommerce webhook (create activation token) ---
let __wcPool = null;
async function wcDb() {
  if (__wcPool) return __wcPool;
  const pgMod = await import("pg");
  const pgAny = (pgMod && (pgMod.default || pgMod)) || pgMod;
  const Pool = pgAny.Pool || (pgAny.default && pgAny.default.Pool);
  if (!Pool) throw new Error("pg Pool not found");
  __wcPool = new Pool({ connectionString: process.env.DATABASE_URL });
  return __wcPool;
}

async function wcRandomToken() {
  const cryptoMod = await import("crypto");
  const cryptoAny = (cryptoMod && (cryptoMod.default || cryptoMod)) || cryptoMod;
  const rb = cryptoAny.randomBytes;
  if (!rb) throw new Error("crypto.randomBytes not found");
  return rb(24).toString("hex");
}

function wcExtract(body) {
  const b = (body && typeof body === "object") ? body : {};
  const orderId = b.id || b.order_id || (b.order && (b.order.id || b.order.order_id)) || "";
  const status  = (b.status || (b.order && b.order.status) || "").toString();
  const email   = ((b.billing && b.billing.email) || (b.order && b.order.billing && b.order.billing.email) || "").toString();
  const items   = b.line_items || (b.order && b.order.line_items) || [];
  const skus    = Array.isArray(items) ? items.map(x => x && x.sku).filter(Boolean) : [];
  return { orderId, status, email, skus };
}

function wcPlanIdFromSkus(skus) {
  // mapowanie Twoich produktów (SKU)
  // Starter -> plans.id=2 (code=basic)
  // Growth  -> plans.id=3 (code=pro)
  // Platinum-> plans.id=4 (code=platinum)
  const set = new Set((skus || []).map(s => String(s).trim().toUpperCase()));

  if (set.has("PLAN_PLATINUM")) return 4;
  if (set.has("PLAN_GROWTH"))   return 3;
  if (set.has("PLAN_STARTER"))  return 2;

  // jeżeli klient kupił tylko dodatek (platinum links) – tworzymy token z plan_id=4,
  // a w provider_ref zostawimy znacznik, że to addon (obsłużymy przy redeem w bocie).
  if (set.has("ADD_PLATINUM_LINKS_10")) return 4;

  return null;
}

function wcAddonPacksFromSkus(skus) {
  const set = new Set((skus || []).map(s => String(s).trim().toUpperCase()));
  return set.has("ADD_PLATINUM_LINKS_10") ? 1 : 0;
}

app.all("/api/store/woocommerce/webhook", (req, res, next) => {
  if (req.method !== "POST") return res.sendStatus(405);
  return next();
});

app.post(
  "/api/store/woocommerce/webhook",
  express.json({ limit: "2mb" }),
  express.urlencoded({ extended: false, limit: "2mb" }),
  async (req, res) => {
    try {
      const { orderId, status, email, skus } = wcExtract(req.body);

      // obsługujemy tylko opłacone / aktywujące statusy
      const st = status.toLowerCase();
      const isPaid = (st === "processing" || st === "completed");

      const planId = wcPlanIdFromSkus(skus);
      const addonPacks = wcAddonPacksFromSkus(skus);

      const refBase = `wc:${orderId || ""}`.trim();
      const providerRef = `${refBase}|addon_packs=${addonPacks}|email=${email || ""}`;

      console.log(`[woocommerce] order="${orderId}" status="${status}" skus=${(skus||[]).join(",")} paid=${isPaid} planId=${planId} addonPacks=${addonPacks}`);

      if (!orderId) return;          // bez order_id nic nie robimy
      if (!isPaid)  return;          // nieopłacone -> ignorujemy
      if (!planId)  return;          // nieznane SKU -> ignorujemy

      const db = await wcDb();

      // idempotencja: jeśli już wygenerowaliśmy token dla tego zamówienia -> nic nie rób
      const exists = await db.query(
        "SELECT token FROM activation_tokens WHERE provider='manual' AND provider_ref LIKE $1 AND used_at IS NULL LIMIT 1",
        [`wc:${orderId}|%`]
      );
      if (exists.rowCount > 0) {
        console.log(`[woocommerce] activation token already exists for order=${orderId} token=${exists.rows[0].token}`);
        return;
      }

      const token = await wcRandomToken();
      await db.query(
        "INSERT INTO activation_tokens (token, plan_id, provider, provider_ref, expires_at) VALUES ($1,$2,'manual',$3, NOW() + INTERVAL '7 days')",
        [token, planId, providerRef]
      );

      console.log(`[woocommerce] ACTIVATION_TOKEN=${token} (order=${orderId})`);
      return;
    } catch (e) {
      console.log("[woocommerce] error", e && e.message ? e.message : e);
      return; // webhook zawsze 200, żeby WC nie spamował retry
    }
  }
);
// --- end WooCommerce webhook ---

// =================== STRIPE CHECKOUT (subscriptions) – FindYourDeal ===================
// Price IDs (LIVE) – możesz też nadpisać ENV
const FYD_PRICE_STARTER  = process.env.FYD_PRICE_STARTER  || "price_1SHql9JoZ7gqc85wcoraiZTZ";
const FYD_PRICE_GROWTH   = process.env.FYD_PRICE_GROWTH   || "price_1SHql9JoZ7gqc85wctFb985k";
const FYD_PRICE_PLATINUM = process.env.FYD_PRICE_PLATINUM || "price_1SHql9JoZ7gqc85wu6GC6JzR";

// DB plan_id mapping (plans table)
const FYD_PLAN_ID_STARTER  = 2; // basic/starter
const FYD_PLAN_ID_GROWTH   = 3; // pro/growth
const FYD_PLAN_ID_PLATINUM = 4; // platinum

let __fydStripeCheckout = null;
function fydStripeCheckout() {
  if (__fydStripeCheckout) return __fydStripeCheckout;
  const key =
    process.env.STRIPE_FYD_SECRET_KEY ||
    process.env.STRIPE_SECRET_KEY ||
    process.env.STRIPE_API_KEY ||
    "";
  if (!key) throw new Error("missing STRIPE_SECRET_KEY");
  __fydStripeCheckout = new Stripe(key, { apiVersion: "2024-06-20" });
  return __fydStripeCheckout;
}

function withSessionId(url) {
  const base = String(url || "").trim();
  if (!base) return "";
  if (base.includes("{CHECKOUT_SESSION_ID}")) return base;
  const glue = base.includes("?") ? "&" : "?";
  return `${base}${glue}session_id={CHECKOUT_SESSION_ID}`;
}

// GET /api/store/stripe/checkout?plan=starter|growth|platinum&addon_packs=0..N
app.get("/api/store/stripe/checkout", async (req, res) => {
  try {
    const plan = String(req.query.plan || "").toLowerCase().trim();
    const addonPacks = Math.max(0, parseInt(String(req.query.addon_packs || "0"), 10) || 0);

    let priceId = "";
    let planId = 0;

    if (plan === "starter")  { priceId = FYD_PRICE_STARTER;  planId = FYD_PLAN_ID_STARTER; }
    else if (plan === "growth")   { priceId = FYD_PRICE_GROWTH;   planId = FYD_PLAN_ID_GROWTH; }
    else if (plan === "platinum") { priceId = FYD_PRICE_PLATINUM; planId = FYD_PLAN_ID_PLATINUM; }

    if (!priceId || !planId) return res.status(400).send("invalid plan");

    const successBase =
      process.env.FYD_STORE_SUCCESS_URL ||
      process.env.STORE_SUCCESS_URL ||
      process.env.SUCCESS_URL ||
      "https://findyourdeal.app/aktywuj";

    const cancelBase =
      process.env.FYD_STORE_CANCEL_URL ||
      process.env.STORE_CANCEL_URL ||
      process.env.CANCEL_URL ||
      "https://findyourdeal.app/anulowano";

    const stripe = fydStripeCheckout();

    const session = await stripe.checkout.sessions.create({

      // __FYD_CHECKOUT_META_PATCH_V1__
      allow_promotion_codes: true,
      ...(() => {
        const uid =
          (typeof userId !== "undefined" && userId) ||
          (typeof user !== "undefined" && user && user.id) ||
          (typeof req !== "undefined" && req && req.user && req.user.id) ||
          null;

        const tg =
          (typeof telegramUserId !== "undefined" && telegramUserId) ||
          (typeof tgUserId !== "undefined" && tgUserId) ||
          (typeof tgId !== "undefined" && tgId) ||
          (typeof user !== "undefined" && user && user.telegram_user_id) ||
          (typeof req !== "undefined" && req && req.user && req.user.telegram_user_id) ||
          null;

        const meta = {};
        if (uid) meta.user_id = String(uid);
        if (tg) meta.telegram_user_id = String(tg);

        return Object.keys(meta).length ? { metadata: meta } : {};
      })(),
      ...(() => {
        const ref =
          (typeof telegramUserId !== "undefined" && telegramUserId) ||
          (typeof tgUserId !== "undefined" && tgUserId) ||
          (typeof tgId !== "undefined" && tgId) ||
          (typeof user !== "undefined" && user && user.telegram_user_id) ||
          (typeof req !== "undefined" && req && req.user && req.user.telegram_user_id) ||
          (typeof userId !== "undefined" && userId) ||
          (typeof user !== "undefined" && user && user.id) ||
          (typeof req !== "undefined" && req && req.user && req.user.id) ||
          null;

        return ref ? { client_reference_id: String(ref) } : {};
      })(),

      allow_promotion_codes: true,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      success_url: withSessionId(successBase),
      cancel_url: cancelBase,
      metadata: {
        fyd_plan_id: String(planId),
        fyd_addon_packs: String(addonPacks),
        fyd_kind: "plan",
      },
    });

    if (!session?.url) return res.status(500).send("stripe session url missing");
    return res.redirect(303, session.url);
  } catch (e) {
    console.log("[stripe-checkout] error", e?.message || e);
    return res.status(500).send("checkout_error");
  }
});

// =================== /STRIPE CHECKOUT (subscriptions) – FindYourDeal ===================

app.listen(port, "0.0.0.0", () => console.log("API listening on " + port));
});

// --- Activation link helper (returns Telegram deep-link) ---
// --- Activation link helper (returns Telegram deep-link) ---
// GET /api/store/activation-link?token=...   OR   /api/store/activation-link?session_id=cs_...
app.get("/api/store/activation-link", async (req, res) => {
  try {
    const token = String(req.query.token || "").trim();
    const sessionId = String(req.query.session_id || "").trim();

    const bot = process.env.TELEGRAM_BOT_USERNAME || "";
    if (!bot) return res.status(500).json({ ok: false, error: "missing_TELEGRAM_BOT_USERNAME" });

    const db = sqlPool;

    let row = null;

    if (token) {
      const r = await db.query(
        `SELECT token, expires_at, used_at
         FROM activation_tokens
         WHERE token = $1
         LIMIT 1`,
        [token]
      );
      row = r.rows[0] || null;
      if (!row) return res.status(404).json({ ok: false, error: "token_not_found" });
    } else if (sessionId) {
      const r = await db.query(
        `SELECT token, expires_at, used_at
         FROM activation_tokens
         WHERE provider = 'stripe'
           AND provider_ref LIKE $1
         ORDER BY expires_at DESC
         LIMIT 1`,
        [`%|cs:${sessionId}%`]
      );
      row = r.rows[0] || null;
      if (!row) return res.status(404).json({ ok: false, error: "pending_payment" });
    } else {
      return res.status(400).json({ ok: false, error: "missing_token_or_session_id" });
    }

    const tg_link = `https://t.me/${bot}?start=act_${row.token}`;

    return res.json({
      ok: true,
      token: row.token,
      expires_at: row.expires_at ? new Date(row.expires_at).toISOString() : null,
      used_at: row.used_at ? new Date(row.used_at).toISOString() : null,
      tg_link
    });
  } catch (e) {
    console.log("[activation-link] error", e?.message || e);
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});
// --- end Activation link helper ---

// --- ADDON10 product link (redirect to Telegram deep-link) ---
app.get("/api/store/addon10-link", (req, res) => {
  const bot = process.env.TELEGRAM_BOT_USERNAME || "FindYourDealServerBot";
  return res.redirect(302, `https://t.me/${bot}?start=addon10`);
});

// =================== STRIPE CHECKOUT ADDON10 (Platinum only) ===================
app.get("/api/store/stripe/checkout-addon10", async (req, res) => {
  try {
stripe = await fydStripe();

    const tg = String(req.query.tg || "").trim();
    const qty = Math.max(1, Math.min(50, parseInt(String(req.query.qty || "1"), 10) || 1));

    if (!tg || !/^\d+$/.test(tg)) return res.status(400).send("missing_tg");

    // weryfikacja: tylko użytkownik Platinum może kupić addon
    const db = sqlPool;
    const ent = await db.query(
      `SELECT plan_code
         FROM user_entitlements
        WHERE user_id = (SELECT id FROM users WHERE telegram_user_id = $1 LIMIT 1)
        LIMIT 1`,
      [Number(tg)]
    );

    const planCode = String(ent.rows[0]?.plan_code || "").toLowerCase();
    if (planCode !== "platinum") {
      return res.status(403).send("platinum_only");
    }

    const successBase = process.env.FYD_STORE_SUCCESS_URL || "https://findyourdeal.app/aktywuj";
    const cancelBase  = process.env.FYD_STORE_CANCEL_URL  || "https://findyourdeal.app/anulowano";

    const successUrl = successBase + (successBase.includes("?") ? "&" : "?") + "session_id={CHECKOUT_SESSION_ID}";
    const cancelUrl  = cancelBase;

    const priceAddon = FYD_PRICE_ADDON10;
    if (!priceAddon) return res.status(500).send("missing_addon_price");

    const session = await ensureStripe().checkout.sessions.create({

      // __FYD_CHECKOUT_META_PATCH_V1__
      allow_promotion_codes: true,
      ...(() => {
        const uid =
          (typeof userId !== "undefined" && userId) ||
          (typeof user !== "undefined" && user && user.id) ||
          (typeof req !== "undefined" && req && req.user && req.user.id) ||
          null;

        const tg =
          (typeof telegramUserId !== "undefined" && telegramUserId) ||
          (typeof tgUserId !== "undefined" && tgUserId) ||
          (typeof tgId !== "undefined" && tgId) ||
          (typeof user !== "undefined" && user && user.telegram_user_id) ||
          (typeof req !== "undefined" && req && req.user && req.user.telegram_user_id) ||
          null;

        const meta = {};
        if (uid) meta.user_id = String(uid);
        if (tg) meta.telegram_user_id = String(tg);

        return Object.keys(meta).length ? { metadata: meta } : {};
      })(),
      ...(() => {
        const ref =
          (typeof telegramUserId !== "undefined" && telegramUserId) ||
          (typeof tgUserId !== "undefined" && tgUserId) ||
          (typeof tgId !== "undefined" && tgId) ||
          (typeof user !== "undefined" && user && user.telegram_user_id) ||
          (typeof req !== "undefined" && req && req.user && req.user.telegram_user_id) ||
          (typeof userId !== "undefined" && userId) ||
          (typeof user !== "undefined" && user && user.id) ||
          (typeof req !== "undefined" && req && req.user && req.user.id) ||
          null;

        return ref ? { client_reference_id: String(ref) } : {};
      })(),

      allow_promotion_codes: true,
mode: "subscription",
      line_items: [{ price: priceAddon, quantity: qty }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        fyd_kind: "addon10",
        fyd_telegram_user_id: String(tg),
        fyd_addon_packs: String(qty)
      }
    });

    return res.redirect(303, session.url);
  } catch (e) {
    console.log("[stripe-addon10] error", e?.message || e);
    return res.status(500).send("server_error");
  }
});
// =================== /STRIPE CHECKOUT ADDON10 (Platinum only) ===================

