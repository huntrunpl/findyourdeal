/**
 * Plany i limity (bez DB) – muszą zgadzać się z kodami planów z tabeli plans.code
 * U Ciebie: trial, basic, pro, platinum, none
 */

const BASE_LINK_LIMITS = {
  trial: 5,
  basic: 10,
  pro: 50,
  platinum: 200,
};

const PER_LINK_LIMITS = {
  trial: 20,
  basic: 20,
  pro: 20,
  platinum: 20,
};

function isUserObject(obj) {
  return obj && typeof obj === "object" && !Number.isFinite(obj);
}

function getPlanName(userOrId) {
  if (!isUserObject(userOrId)) {
    return "platinum"; // dev/test
  }
  const raw = userOrId.plan_name || "none";
  return String(raw).toLowerCase();
}

function getExtraLinkPacks(userOrId) {
  if (!isUserObject(userOrId)) return 0;
  return Number(userOrId.extra_link_packs || 0);
}

function getPlanExpiresAt(userOrId) {
  if (!isUserObject(userOrId)) return null;
  const v = userOrId.plan_expires_at;
  if (!v) return null;
  try { return new Date(v); } catch { return null; }
}

function getTrialUsed(userOrId) {
  if (!isUserObject(userOrId)) return false;
  return !!userOrId.trial_used;
}

function toTitleCase(str) {
  if (!str) return "";
  return String(str)
    .toLowerCase()
    .replace(/(^|\s)([a-ząćęłńóśżź])/g, (m, sp, ch) => sp + ch.toUpperCase());
}

export function getEffectiveLinkLimit(userOrId) {
  const plan = getPlanName(userOrId);
  if (plan === "none") return 0;

  const base = BASE_LINK_LIMITS[plan] ?? 0;

  // opcjonalne pakiety tylko dla platinum (zostawiamy, bo masz kolumnę extra_link_packs)
  if (plan === "platinum") {
    const packs = getExtraLinkPacks(userOrId);
    return base + packs * 10;
  }
  return base;
}

export function getPerLinkItemLimit(userOrId) {
  const plan = getPlanName(userOrId);
  if (plan === "none") return 0;
  return typeof PER_LINK_LIMITS[plan] === "number" ? PER_LINK_LIMITS[plan] : 20;
}

export function isPlanActive(userOrId, now = new Date()) {
  if (!isUserObject(userOrId)) return true; // dev/test

  const plan = getPlanName(userOrId);
  if (plan === "none") return false;

  const expires = getPlanExpiresAt(userOrId);
  if (!expires) return true;

  return expires.getTime() >= now.getTime();
}

export function buildLimitReachedMessage(userOrId, currentActive, maxAllowed) {
  const plan = getPlanName(userOrId);
  const prettyPlan = plan === "none" ? "brak aktywnego planu" : `plan ${toTitleCase(plan)}`;
  const packs = getExtraLinkPacks(userOrId);

  const lines = [];
  lines.push("❌ Osiągnąłeś limit wyszukiwań (łącznie) dla swojego planu.");
  lines.push("");

  if (plan === "platinum") {
    const base = BASE_LINK_LIMITS.platinum;
    lines.push(`Aktualny limit: ${maxAllowed} linków łącznie (Plan Platinum ${base} + ${packs} × dodatkowe 10 linków).`);
  } else if (plan === "none") {
    lines.push(`Aktualny limit: ${maxAllowed} linków łącznie (obecnie nie masz żadnego planu).`);
  } else {
    lines.push(`Aktualny limit: ${maxAllowed} linków łącznie (${prettyPlan}).`);
  }

  lines.push(`Masz już: ${currentActive} wyszukiwań.`);
  lines.push("");
  lines.push("Aby dodać nowe wyszukiwanie, usuń któreś z istniejących linków (/lista, /usun ID).");
  return lines.join("\n");
}

export function formatPlanStatus(userOrId) {
  const plan = getPlanName(userOrId);
  const prettyPlan = plan === "none" ? "Brak planu" : toTitleCase(plan);
  const expires = getPlanExpiresAt(userOrId);
  const trialUsed = getTrialUsed(userOrId);
  const active = isPlanActive(userOrId);

  const lines = [];

  if (plan === "none") {
    lines.push("Plan: brak aktywnego planu.");
  } else {
    lines.push(`Plan: ${prettyPlan}.`);
    if (expires) {
      const iso = expires.toISOString();
      lines.push(`Plan ważny do: ${iso.slice(0, 10)}.`);
    } else {
      lines.push("Plan nie ma ustawionej daty wygaśnięcia (bezterminowy lub środowisko testowe).");
    }
    if (!active) lines.push("Status: plan jest obecnie nieaktywny (wygasł).");
  }

  if (plan === "trial") {
    lines.push("Trial: AKTYWNY (3 dni / 5 linków). Po wygaśnięciu triala monitoring zostanie zatrzymany, dopóki nie wybierzesz planu płatnego.");
  } else if (plan === "none") {
    lines.push(trialUsed
      ? "Trial: został już wykorzystany i nie będzie dostępny ponownie."
      : "Trial: dostępny jednorazowo (3 dni / 5 linków). Możesz go uruchomić w panelu klienta.");
  } else {
    lines.push("Trial: jednorazowy (3 dni / 5 linków). Ten status dotyczy tylko pierwszej aktywacji.");
  }

  return lines.join("\n");
}
