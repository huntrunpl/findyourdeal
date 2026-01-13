"use server";

import { redirect } from "next/navigation";
import { pool } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";

const API_BASE =
  process.env.INTERNAL_API_BASE_URL ||
  process.env.API_BASE_URL ||
  "https://api.findyourdeal.app";

const INTERNAL_KEY = process.env.INTERNAL_API_KEY || "";

function normalizePlan(code: any): "free" | "trial" | "starter" | "growth" | "platinum" {
  const c = String(code || "free").toLowerCase();
  if (c === "basic") return "starter";
  if (c === "pro") return "growth";
  if (c === "trial" || c === "starter" || c === "growth" || c === "platinum") return c;
  return "free";
}

function allowedUpgrades(current: ReturnType<typeof normalizePlan>) {
  if (current === "trial" || current === "free") return ["starter", "growth", "platinum"];
  if (current === "starter") return ["growth", "platinum"];
  if (current === "growth") return ["platinum"];
  return []; // platinum -> tylko addon
}

export async function startCheckout(formData: FormData) {
  const sessionUserId = await getSessionUserId();
  if (!sessionUserId) return;

  if (!INTERNAL_KEY) {
    throw new Error("missing_INTERNAL_API_KEY_in_panel_env");
  }

  const u = await pool.query(`SELECT telegram_user_id FROM users WHERE id=$1 LIMIT 1`, [sessionUserId]);
  const telegramUserId = Number(u.rows[0]?.telegram_user_id || 0);
  if (!telegramUserId) {
    throw new Error("missing_telegram_user_id_for_session_user");
  }

  const entQ = await pool.query(`SELECT plan_code FROM user_entitlements_v WHERE user_id=$1 LIMIT 1`, [sessionUserId]);
  const current = normalizePlan(entQ.rows[0]?.plan_code);

  const rawPlan = String(formData.get("plan_code") || "").toLowerCase();

  const payload: any = {
    telegram_user_id: telegramUserId,
  };

  if (rawPlan === "addon") {
    if (current !== "platinum") {
      throw new Error("addon_requires_platinum");
    }
    const qty = Math.max(1, Math.min(50, parseInt(String(formData.get("addon_qty") || "1"), 10) || 1));
    payload.plan_code = "addon";
    payload.addon_qty = qty;
  } else {
    const allowed = allowedUpgrades(current);
    if (!allowed.includes(rawPlan as any)) {
      throw new Error(`plan_not_allowed_current=${current}_wanted=${rawPlan}`);
    }
    payload.plan_code = rawPlan;
  }

  const r = await fetch(`${API_BASE}/billing/stripe/checkout`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-internal-key": INTERNAL_KEY,
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!r.ok) {
    const t = await r.text().catch(() => "");
    throw new Error(`checkout_failed_${r.status}_${t.slice(0, 200)}`);
  }

  const data = await r.json().catch(() => null);
  const url = data?.url ? String(data.url) : "";
  if (!url) throw new Error("missing_checkout_url");

  redirect(url);
}
