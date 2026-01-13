/**
 * Stripe webhook extracted from api/index.js
 * Keeps idempotency + DB logging exactly as before.
 */
export function registerStripeWebhookRoutes(app, express, ctx) {
  const { db, sqlPool, stripeApi, handleStripeEvent, markWebhookProcessed, markWebhookError } = ctx;

  async function stripeWebhookRoute(req, res) {
    const sig = req.headers["stripe-signature"];
    const whsec = process.env.STRIPE_WEBHOOK_SECRET || "";
    if (!sig || !whsec) return res.status(400).send("Missing stripe signature/secret");

    let event;
    try {
      event = stripeApi.webhooks.constructEvent(req.body, sig, whsec);
    } catch (e) {
      console.error("[stripe] signature error:", e?.message || e);
      return res.status(400).send("Bad signature");
    }

    const eventId = String(event.id || "");
    const eventType = String(event.type || "");
    const apiVersion = event.api_version ? String(event.api_version) : null;
    const liveMode = typeof event.livemode === "boolean" ? event.livemode : null;
    const eventCreated = event.created ? new Date(Number(event.created) * 1000) : null;

    console.log(`[stripe] webhook in: ${eventType} ${eventId}`);

    // payload JSON do DB (opcjonalnie)
    let payloadObj = null;
    try {
      payloadObj = JSON.parse(Buffer.isBuffer(req.body) ? req.body.toString("utf8") : String(req.body || ""));
    } catch (_) {
      payloadObj = null;
    }

    try {
      // UPSERT + idempotencja po status=processed
      const q = `
        INSERT INTO stripe_webhook_events
          (event_id, type, livemode, api_version, event_created, payload, attempts, status)
        VALUES
          ($1, $2, $3, $4, $5, $6, 1, 'received')
        ON CONFLICT (event_id) DO UPDATE SET
          attempts    = stripe_webhook_events.attempts + 1,
          received_at = now(),
          type        = EXCLUDED.type,
          livemode    = EXCLUDED.livemode,
          api_version = EXCLUDED.api_version,
          event_created = COALESCE(EXCLUDED.event_created, stripe_webhook_events.event_created),
          payload     = COALESCE(EXCLUDED.payload, stripe_webhook_events.payload)
        RETURNING status, attempts;
      `;
      const ins = await db.query(q, [eventId, eventType, liveMode, apiVersion, eventCreated, payloadObj]);
      const currentStatus = ins.rows[0]?.status || "received";

      if (currentStatus === "processed") {
        // idempotencja: już przetworzone, ale odnotuj ponowną dostawę (resend)
        try { await markWebhookProcessed(sqlPool, eventId); } catch (_) {}
        return res.json({ ok: true });
      }

      // oznacz jako processing (opcjonalnie, ale czytelne)
      await db.query(
        `UPDATE stripe_webhook_events SET status='processing' WHERE event_id=$1 AND status<>'processed'`,
        [eventId]
      );

      await handleStripeEvent(sqlPool, event);

      await markWebhookProcessed(sqlPool, eventId);
      return res.json({ ok: true });
    } catch (e) {
      console.error("[stripe] webhook error:", e);
      try { await markWebhookError(sqlPool, eventId, e); } catch (_) {}
      return res.status(500).json({ ok: false });
    }
  }

  // dwa endpointy → jeden wspólny handler (żeby nie było rozjazdów)
  // webhook MUST be before express.json()
  app.post("/stripe/webhook", express.raw({ type: "application/json" }), stripeWebhookRoute);
  app.post("/billing/stripe/webhook", express.raw({ type: "application/json" }), stripeWebhookRoute);
}
