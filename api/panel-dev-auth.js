/**
 * DEV-only auth for panel endpoints: allows spoofing telegram_user_id via header/query.
 * MUST be disabled in production.
 */
export function makeRequireUser(ctx) {
  const { ensureUser, getUserWithPlanByTelegramId, getUserEntitlementsByTelegramId } = ctx;

  return async function requireUser(req, res, next) {
    // SECURITY: disable spoofable dev auth in production
    if (process.env.NODE_ENV === "production") {
      return res.status(401).json({ error: "UNAUTHORIZED" });
    }

    const tgIdRaw =
      req.headers["x-telegram-user-id"] ||
      req.headers["x-telegram-userid"] ||
      req.query.telegram_user_id;

    const tgId = tgIdRaw ? Number(tgIdRaw) : null;
    if (!tgId || !Number.isFinite(tgId)) {
      return res.status(401).json({
        error: "UNAUTHORIZED",
        hint: "Dodaj nagłówek X-Telegram-User-Id albo ?telegram_user_id=..."
      });
    }

    await ensureUser(tgId, null, null, null, null);

    const user = await getUserWithPlanByTelegramId(tgId);
    if (!user) return res.status(404).json({ error: "USER_NOT_FOUND" });

    req.user = user;
    const ent = await getUserEntitlementsByTelegramId(tgId);
    req.entitlements = ent;
    req.telegramUserId = tgId;
    next();
  };
}
