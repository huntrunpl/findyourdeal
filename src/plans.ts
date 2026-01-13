// src/plans.ts

export type PlanName = "none" | "trial" | "starter" | "growth" | "platinum";

export interface UserPlanInfo {
  plan_name: PlanName;
  plan_expires_at: Date | null;
  trial_used: boolean;
  extra_link_packs: number;
}

interface PlanConfig {
  name: PlanName;
  displayName: string;
  baseLinkLimit: number;
  durationDays: number | null;   // null = brak czasu trwania (np. "none")
  allowExtras: boolean;
}

export const PLANS: Record<PlanName, PlanConfig> = {
  none: {
    name: "none",
    displayName: "Brak planu",
    baseLinkLimit: 0,
    durationDays: null,
    allowExtras: false,
  },
  trial: {
    name: "trial",
    displayName: "Trial",
    baseLinkLimit: 5,
    durationDays: 3,
    allowExtras: false,
  },
  starter: {
    name: "starter",
    displayName: "Starter",
    baseLinkLimit: 10,
    durationDays: 30,
    allowExtras: false,
  },
  growth: {
    name: "growth",
    displayName: "Growth",
    baseLinkLimit: 25,
    durationDays: 30,
    allowExtras: false,
  },
  platinum: {
    name: "platinum",
    displayName: "Platinum",
    baseLinkLimit: 50,
    durationDays: 30,
    allowExtras: true,
  },
};

export function getPlanConfig(planName: PlanName | null | undefined): PlanConfig {
  if (!planName) return PLANS.none;
  return PLANS[planName] ?? PLANS.none;
}

export function isPlanActive(user: UserPlanInfo, now: Date = new Date()): boolean {
  if (!user.plan_expires_at) return false;
  return user.plan_expires_at.getTime() >= now.getTime();
}

export function getEffectiveLinkLimit(user: UserPlanInfo): number {
  const cfg = getPlanConfig(user.plan_name);
  const base = cfg.baseLinkLimit;

  if (cfg.name === "platinum") {
    const extras = (user.extra_link_packs || 0) * 10;
    return base + extras;
  }

  return base;
}

export function formatPlanStatus(user: UserPlanInfo): string {
  const cfg = getPlanConfig(user.plan_name);
  const active = isPlanActive(user);

  const dateStr = user.plan_expires_at
    ? user.plan_expires_at.toLocaleDateString("pl-PL", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : null;

  if (cfg.name === "none") {
    return "Plan: brak aktywnego planu";
  }

  if (!dateStr) {
    return `Plan: ${cfg.displayName}`;
  }

  if (active) {
    return `Plan: ${cfg.displayName} (ważny do ${dateStr})`;
  } else {
    return `Plan: ${cfg.displayName} (wygasł ${dateStr})`;
  }
}

export function buildLimitReachedMessage(
  user: UserPlanInfo,
  activeCount: number,
  limit: number
): string {
  const cfg = getPlanConfig(user.plan_name);

  if (cfg.name === "trial") {
    return [
      "🔒 Limit linków w planie Trial został wyczerpany.",
      `Masz już ${activeCount}/${limit} aktywnych wyszukiwań.`,
      "",
      "Użyj komendy /usun ID, aby zwolnić miejsce albo przejdź na wyższy plan (Starter / Growth / Platinum), żeby dodać więcej linków.",
    ].join("\n");
  }

  if (cfg.name === "starter") {
    return [
      "🔒 Limit linków w planie Starter został wyczerpany.",
      `Masz ${activeCount}/${limit} aktywnych wyszukiwań.`,
      "",
      "Usuń któryś link komendą /usun ID albo przejdź na plan Growth (25 linków) lub Platinum (50 linków), żeby monitorować więcej wyszukiwań.",
    ].join("\n");
  }

  if (cfg.name === "growth") {
    return [
      "🔒 Limit linków w planie Growth został wyczerpany.",
      `Masz ${activeCount}/${limit} aktywnych wyszukiwań.`,
      "",
      "Usuń link komendą /usun ID albo przejdź na plan Platinum (50 linków + możliwość dokupienia dodatkowych linków).",
    ].join("\n");
  }

  if (cfg.name === "platinum") {
    return [
      "🔒 Limit linków w planie Platinum został wyczerpany.",
      `Masz teraz ${activeCount}/${limit} aktywnych linków.`,
      "",
      "Możesz:",
      "• usunąć link komendą /usun ID, żeby zwolnić miejsce, albo",
      "• dokupić dodatkowe 10 linków (np. przez panel www).",
    ].join("\n");
  }

  // fallback dla none
  return [
    "Nie możesz dodać kolejnych linków w obecnym planie.",
    "Wykup plan Starter / Growth / Platinum, aby korzystać z monitora.",
  ].join("\n");
}
