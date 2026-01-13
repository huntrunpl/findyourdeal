import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-06-20",
});

export function priceToPlanId(priceId) {
  // Mapowanie Stripe -> DB
  // Starter -> basic (2), Growth -> pro (3), Platinum -> platinum (4)
  if (!priceId) return null;
  if (priceId === process.env.STRIPE_PRICE_STARTER) return 2;
  if (priceId === process.env.STRIPE_PRICE_GROWTH) return 3;
  if (priceId === process.env.STRIPE_PRICE_PLATINUM) return 4;
  return null;
}

export function isAddonPrice(priceId) {
  return !!priceId && priceId === process.env.STRIPE_PRICE_ADDON;
}

export function isPlanSubscription(sub) {
  // plan subskrypcja ma w itemach jedną z cen planów
  const items = sub?.items?.data || [];
  for (const it of items) {
    const pid = it?.price?.id;
    if (priceToPlanId(pid)) return true;
  }
  return false;
}

export async function computeAddonQtyForCustomer(stripeCustomerId) {
  const addonPrice = process.env.STRIPE_PRICE_ADDON;
  if (!addonPrice) return 0;

  const subs = await stripe.subscriptions.list({
    customer: stripeCustomerId,
    status: "all",
    limit: 100,
    expand: ["data.items.data.price"],
  });

  let qty = 0;
  for (const s of subs.data) {
    if (!["active", "trialing", "past_due"].includes(s.status)) continue;
    for (const it of s.items.data) {
      if (it.price?.id === addonPrice) qty += (it.quantity || 0);
    }
  }
  return qty;
}

export async function upsertPlanSubscriptionRow(db, userId, stripeCustomerId, stripeSub) {
  // stripeSub to obiekt subskrypcji Stripe (subscriptions.retrieve / event.data.object)
  const items = stripeSub?.items?.data || [];
  let planId = null;

  for (const it of items) {
    const pid = it?.price?.id;
    const mapped = priceToPlanId(pid);
    if (mapped) {
      planId = mapped;
      break;
    }
  }

  if (!planId) {
    // To nie jest subskrypcja planu — nie zapisujemy jako subskrypcji planowej
    return;
  }

  const addonQty = await computeAddonQtyForCustomer(stripeCustomerId);
  const currentPeriodEnd = stripeSub.current_period_end
    ? new Date(stripeSub.current_period_end * 1000)
    : null;

  // Upsert po UNIQUE(provider, provider_subscription_id)
  await db.query(
    `
    INSERT INTO subscriptions
      (user_id, plan_id, provider, provider_customer_id, provider_subscription_id, status, current_period_end, addon_qty, created_at, updated_at)
    VALUES
      ($1, $2, 'stripe', $3, $4, $5, $6, $7, now(), now())
    ON CONFLICT (provider, provider_subscription_id)
    DO UPDATE SET
      user_id = EXCLUDED.user_id,
      plan_id = EXCLUDED.plan_id,
      provider_customer_id = EXCLUDED.provider_customer_id,
      status = EXCLUDED.status,
      current_period_end = EXCLUDED.current_period_end,
      addon_qty = EXCLUDED.addon_qty,
      updated_at = now()
    `,
    [
      userId,
      planId,
      stripeCustomerId,
      stripeSub.id,
      stripeSub.status,
      currentPeriodEnd,
      addonQty,
    ]
  );
}

export async function updateAddonQtyOnUsersPlan(db, userId, stripeCustomerId) {
  const addonQty = await computeAddonQtyForCustomer(stripeCustomerId);

  // Ustaw addon_qty na najnowszej aktywnej subskrypcji planu (plan_id 2/3/4)
  await db.query(
    `
    UPDATE subscriptions s
    SET addon_qty = $1,
        updated_at = now()
    WHERE s.id = (
      SELECT s2.id
      FROM subscriptions s2
      WHERE s2.user_id = $2
        AND s2.provider = 'stripe'
        AND s2.plan_id IN (2,3,4)
      ORDER BY s2.current_period_end DESC NULLS LAST, s2.updated_at DESC
      LIMIT 1
    )
    `,
    [addonQty, userId]
  );
}
