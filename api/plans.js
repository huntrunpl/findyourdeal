/**
 * plans.js – zostawiony tylko jako lekki helper/kompatybilność.
 * Realne limity bierzemy z DB (user_entitlements_v + plan_features + addon_qty).
 */

function isUserObject(obj) {
  return obj && typeof obj === "object" && !Number.isFinite(obj);
}

function toTitleCase(str) {
  if (!str) return "";
  return String(str)
    .toLowerCase()
    .replace(/(^|\s)([a-ząćęłńóśżź])/g, (m, sp, ch) => sp + ch.toUpperCase());
}

export function getEffectiveLinkLimit(userOrEntitlements) {
  // jeśli mamy policzone z DB – użyj
  if (isUserObject(userOrEntitlements)) {
    const v = userOrEntitlements.links_limit_total ?? userOrEntitlements.links_limit;
    const n = Number(v);
    if (Number.isFinite(n) && n >= 0) return n;
  }
  // dev/test
  return 0;
}

export function getPerLinkItemLimit() {
  // to i tak jest kontrolowane w workerze / features
  return 20;
}

export function formatPlanStatus(ent) {
  if (!isUserObject(ent)) return "Plan: (brak danych).";
  const plan = ent.plan_code ? String(ent.plan_code) : "brak";
  const pretty = plan === "brak" ? "Brak planu" : toTitleCase(plan);
  return `Plan: ${pretty}.`;
}
