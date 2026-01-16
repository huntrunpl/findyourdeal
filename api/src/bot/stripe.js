// extracted from api/telegram-bot.js (NO behavior change)

// ---------- stripe helpers ----------
async function stripeGet(path, qs = {}) {
  if (!STRIPE_SECRET_KEY) throw new Error("NO_STRIPE_SECRET_KEY");
  const u = new URL(`https://api.stripe.com${path}`);
  for (const [k, v] of Object.entries(qs)) if (v != null) u.searchParams.append(k, String(v));
  const res = await fetch(u.toString(), { method: "GET", headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` } });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(j?.error?.message || `STRIPE_GET_${res.status}`);
  return j;
}

async function stripePostForm(path, paramsObj = {}) {
  if (!STRIPE_SECRET_KEY) throw new Error("NO_STRIPE_SECRET_KEY");
  const body = new URLSearchParams();
  for (const [k, v] of Object.entries(paramsObj)) if (v != null) body.append(k, String(v));
  const res = await fetch(`https://api.stripe.com${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}`, "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(j?.error?.message || `STRIPE_POST_${res.status}`);
  return j;
}


export { stripeGet, stripePostForm };
