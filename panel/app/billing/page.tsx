import { pool } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";
import getPanelLang from "../_lib/getPanelLang";
import {t, normLang} from "../_lib/i18n";
import BillingCTA from "./_components/BillingCTA";

export const dynamic = "force-dynamic";

function formatWarsaw(dt: any) {
  if (!dt) return null;
  const d = dt instanceof Date ? dt : new Date(dt);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat("pl-PL", {
    timeZone: "Europe/Warsaw",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

function normalizePlan(
  code: any
): "free" | "trial" | "starter" | "growth" | "platinum" {
  const c = String(code || "free").toLowerCase();
  if (c === "basic") return "starter";
  if (c === "pro") return "growth";
  if (c === "trial" || c === "starter" || c === "growth" || c === "platinum")
    return c;
  return "free";
}

function allowedUpgrades(current: ReturnType<typeof normalizePlan>) {
  if (current === "trial" || current === "free")
    return ["starter", "growth", "platinum"] as const;
  if (current === "starter") return ["growth", "platinum"] as const;
  if (current === "growth") return ["platinum"] as const;
  return [] as const; // platinum -> brak upgrade (tylko addon)
}

function planLabel(code: string) {
  if (code === "starter") return "Starter";
  if (code === "growth") return "Growth";
  if (code === "platinum") return "Platinum";
  if (code === "trial") return "Trial";
  return "Free";
}

function clampInt(n: any, def = 0) {
  const x = Number(n);
  if (!Number.isFinite(x)) return def;
  return x;
}

export default async function BillingPage() {
  const lang = normLang(await getPanelLang());
  const L = new Proxy({}, { get: (_t, k) => t(lang, String(k)) }) as any;

  const sessionUserId = await getSessionUserId();
  if (!sessionUserId) return null;

  const entQ = await pool.query(
    `
    SELECT plan_code, expires_at, links_limit_total, base_links_limit, extra_links
    FROM user_entitlements_v
    WHERE user_id = $1
    LIMIT 1
    `,
    [sessionUserId]
  );
  const ent = entQ.rows[0] || null;


  // FYD: BILLING_SUBS_FALLBACK_V1 (expires + addons from subscriptions)
  const subQ = await pool.query(
    `
    SELECT status, current_period_end, addon_qty
    FROM subscriptions
    WHERE user_id=$1
    ORDER BY (status='active') DESC, current_period_end DESC NULLS LAST, id DESC
    LIMIT 1
    `,
    [sessionUserId]
  );
  const sub = subQ.rows[0] || null;

  const expiresAt = ent?.expires_at || sub?.current_period_end || null;
  const expiresLabel = expiresAt ? formatWarsaw(expiresAt) : null;

  const enabledQ = await pool.query(
    `SELECT COUNT(*)::int AS cnt FROM links WHERE user_id=$1 AND active=true`,
    [sessionUserId]
  );
  const enabledCount = clampInt(enabledQ.rows[0]?.cnt, 0);

  const currentPlan = normalizePlan(ent?.plan_code);
  const upgrades = allowedUpgrades(currentPlan);
  const __entBase = clampInt(ent?.base_links_limit, 0);
  const __entExtra = clampInt(ent?.extra_links, 0);
  const __entTotal = clampInt(ent?.links_limit_total, 0);

  const addonQty = clampInt(sub?.addon_qty, 0);
  const addonExtraLinks = addonQty * 10;

  let baseLinks = __entBase;
  let extraLinks = __entExtra;
  let limitTotal = __entTotal;

  if (!baseLinks && limitTotal) baseLinks = limitTotal;

  const usedAddonExtra = (!extraLinks && addonExtraLinks);
  if (usedAddonExtra) extraLinks = addonExtraLinks;

  if (limitTotal <= 0) limitTotal = baseLinks + extraLinks;
  if (usedAddonExtra && limitTotal === baseLinks) limitTotal = baseLinks + addonExtraLinks;

  const remaining = Math.max(limitTotal - enabledCount, 0);
  const pct =
    limitTotal > 0
      ? Math.min(100, Math.max(0, Math.round((enabledCount / limitTotal) * 100)))
      : 0;

  const addonPacks = extraLinks > 0 ? Math.floor(extraLinks / 10) : 0;

  return (
    <main className="p-6 space-y-6">

      <section className="border rounded p-4 space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="font-semibold">{L.billing_plan_title}</h2>
            <div className="text-sm opacity-80">
              {L.billing_plan_prefix} <b>{planLabel(currentPlan)}</b>
              {expiresLabel ? (
                <>
                  {" "}
                  · {L.billing_valid_until} <b>{expiresLabel}</b>
                </>
              ) : (
                <> · {L.billing_valid_until} <b>—</b></>
              )}
            </div>
          </div>

          <div className="text-sm opacity-80 text-right">
            {L.billing_link_limit} <b>{limitTotal}</b>
            <div className="text-xs opacity-70">
              {L.billing_base} <b>{baseLinks}</b> · {L.billing_addons} <b>+{extraLinks}</b>
              {addonPacks ? (
                <>
                  {" "}
                  · {L.billing_packs} <b>{addonPacks}</b>
                </>
              ) : null}
            </div>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="border rounded p-3">
            <div className="text-xs opacity-70">{L.billing_enabled_links}</div>
            <div className="text-lg font-semibold">
              {enabledCount} / {limitTotal}
            </div>
          </div>

          <div className="border rounded p-3">
            <div className="text-xs opacity-70">{L.billing_remaining}</div>
            <div className="text-lg font-semibold">{remaining}</div>
          </div>

          <div className="border rounded p-3">
            <div className="text-xs opacity-70">{L.billing_usage}</div>
            <div className="text-lg font-semibold">{pct}%</div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="h-2 w-full rounded bg-black/10 overflow-hidden">
            <div
              className="h-2 bg-black/60"
              style={{ width: `${pct}%` }}
              aria-label={L.billing_usage}
            />
          </div>
          <div className="text-xs opacity-60">
            {L.billing_note_active}
          </div>
        </div>
      </section>

      <BillingCTA currentPlan={currentPlan} lang={lang} />
    </main>
  );
}
