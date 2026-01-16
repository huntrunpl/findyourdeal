// extracted from api/telegram-bot.js (NO behavior change)

// ---------- plans ----------
async function getPlanIdByCode(code) {
  const c = String(code || "").toLowerCase();
  const aliases = { starter: "basic", growth: "pro" };
  const norm = aliases[c] || c;
  try {
    const q = await dbQuery(`SELECT id FROM plans WHERE LOWER(code)=LOWER($1) LIMIT 1`, [norm]);
    if (q.rowCount) return Number(q.rows[0].id);
  } catch {}
  return 0;
}

function planLabel(code) {
  const c = String(code || "").toLowerCase();
  if (c === "starter" || c === "basic") return "Starter";
  if (c === "growth" || c === "pro") return "Growth";
  if (c === "platinum") return "Platinum";
  if (c === "trial") return "Trial";
  return "Plan";
}

function nowPlusMinutes(min) {
  return new Date(Date.now() + Number(min) * 60 * 1000).toISOString();
}

async function createActivationToken({ planId, kind, checkoutSessionId, tgUserId }) {
  const token = randomBytes(24).toString("hex");
  const provider = "stripe";
  const providerRef = `kind:${kind};cs:${checkoutSessionId};tg:${String(tgUserId)}`;
  const expiresAt = nowPlusMinutes(90);
  await dbQuery(
    `INSERT INTO activation_tokens (token, plan_id, provider, provider_ref, expires_at)
     VALUES ($1,$2,$3,$4,$5::timestamptz)`,
    [token, Number(planId), provider, providerRef, expiresAt]
  );
  return token;
}

async function createPlanCheckoutSession({ user, planCode, priceId, chatId }) {
  if (!BOT_USERNAME) throw new Error("NO_BOT_USERNAME");
  if (!priceId) throw new Error("NO_PRICE_ID");
  const planId = await getPlanIdByCode(planCode);
  if (!planId) throw new Error(`NO_PLAN_ID_FOR_${planCode}`);

  let existingCustomer = null;
  let existingSub = null;
  try {
    const r = await dbQuery(
      `SELECT provider_customer_id, provider_subscription_id
       FROM subscriptions
       WHERE user_id=$1 AND status='active'
       ORDER BY updated_at DESC
       LIMIT 1`,
      [Number(user.id)]
    );
    if (r.rowCount) {
      existingCustomer = r.rows[0].provider_customer_id || null;
      existingSub = r.rows[0].provider_subscription_id || null;
    }
  } catch {}

  const params = {
    mode: "subscription",
    "line_items[0][price]": priceId,
    "line_items[0][quantity]": "1",
    client_reference_id: String(user.telegram_user_id || user.telegram_id || user.id),
    "metadata[plan_code]": String(planCode),
    "metadata[user_id]": String(user.id),
    "metadata[tg_user_id]": String(user.telegram_user_id || ""),
    "metadata[chat_id]": String(chatId || ""),
    ...(existingCustomer ? { customer: existingCustomer } : {}),
    ...(existingSub ? { "subscription_data[metadata][upgrade_from]": existingSub } : {}),
  };

  params.success_url = `https://t.me/${BOT_USERNAME}?start=act_TOKEN_REPLACE`;
  params.cancel_url = `https://t.me/${BOT_USERNAME}`;

  const session = await stripePostForm("/v1/checkout/sessions", params);
  if (!session?.id || !session?.url) throw new Error("STRIPE_SESSION_CREATE_FAILED");

  const token = await createActivationToken({ planId, kind: "plan", checkoutSessionId: session.id, tgUserId: user.telegram_user_id });

  try {
    await stripePostForm(`/v1/checkout/sessions/${encodeURIComponent(session.id)}`, {
      success_url: `https://t.me/${BOT_USERNAME}?start=act_${token}`,
    });
  } catch {}

  return { url: session.url, token, planId };
}

async function createAddon10CheckoutSession({ user, chatId }) {
  if (!BOT_USERNAME) throw new Error("NO_BOT_USERNAME");
  if (!PRICE_ADDON10) throw new Error("NO_PRICE_ADDON10");

  const platinumId = await getPlanIdByCode("platinum");
  if (!platinumId) throw new Error("NO_PLATINUM_PLAN_ID");

  const ent = await getUserEntitlementsByTelegramId(user.telegram_user_id).catch(() => null);
  const code = String(ent?.plan_code || "").toLowerCase();
  if (code !== "platinum") throw new Error("ADDON_ONLY_PLATINUM");

  let existingCustomer = null;
  try {
    const r = await dbQuery(
      `SELECT provider_customer_id
       FROM subscriptions
       WHERE user_id=$1 AND status='active'
       ORDER BY updated_at DESC
       LIMIT 1`,
      [Number(user.id)]
    );
    if (r.rowCount) existingCustomer = r.rows[0].provider_customer_id || null;
  } catch {}

  const params = {
    mode: "subscription",
    "line_items[0][price]": PRICE_ADDON10,
    "line_items[0][quantity]": "1",
    client_reference_id: String(user.telegram_user_id || user.id),
    "metadata[kind]": "addon10",
    "metadata[user_id]": String(user.id),
    "metadata[tg_user_id]": String(user.telegram_user_id || ""),
    "metadata[chat_id]": String(chatId || ""),
    ...(existingCustomer ? { customer: existingCustomer } : {}),
  };

  params.success_url = `https://t.me/${BOT_USERNAME}?start=act_TOKEN_REPLACE`;
  params.cancel_url = `https://t.me/${BOT_USERNAME}`;

  const session = await stripePostForm("/v1/checkout/sessions", params);
  if (!session?.id || !session?.url) throw new Error("STRIPE_SESSION_CREATE_FAILED");

  const token = await createActivationToken({
    planId: platinumId,
    kind: "addon10",
    checkoutSessionId: session.id,
    tgUserId: user.telegram_user_id,
  });

  try {
    await stripePostForm(`/v1/checkout/sessions/${encodeURIComponent(session.id)}`, {
      success_url: `https://t.me/${BOT_USERNAME}?start=act_${token}`,
    });
  } catch {}

  return { url: session.url, token };
}


export { getPlanIdByCode, planLabel, nowPlusMinutes, createActivationToken, createPlanCheckoutSession, createAddon10CheckoutSession };
