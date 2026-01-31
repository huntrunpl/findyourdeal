import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { pool } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";
import { randomBytes } from "crypto";

export const runtime = "nodejs";

const STRIPE_KEY = process.env.STRIPE_SECRET_KEY || "sk_test_fake_key_for_build";

const stripe = new Stripe(STRIPE_KEY, {
  apiVersion: "2026-01-28.clover",
});

const STRIPE_PRICE_IDS = {
  starter: process.env.STRIPE_PRICE_STARTER || "",
  growth: process.env.STRIPE_PRICE_GROWTH || "",
  platinum: process.env.STRIPE_PRICE_PLATINUM || "",
  links_10: process.env.STRIPE_PRICE_ADDON_LINKS_10 || "",
};

function normalizePlan(code: any): "trial" | "starter" | "growth" | "platinum" {
  const c = String(code || "trial").toLowerCase();
  if (c === "basic") return "starter";
  if (c === "pro") return "growth";
  if (c === "trial" || c === "starter" || c === "growth" || c === "platinum") return c;
  return "trial";
}

function allowedUpgrades(current: "trial" | "starter" | "growth" | "platinum"): string[] {
  if (current === "trial") return ["starter", "growth", "platinum"];
  if (current === "starter") return ["growth", "platinum"];
  if (current === "growth") return ["platinum"];
  return []; // platinum -> only addons
}

export async function POST(req: NextRequest) {
  const requestId = randomBytes(8).toString("hex");
  
  try {
    const sessionUserId = await getSessionUserId();
    if (!sessionUserId) {
      console.error(`[checkout][${requestId}] No session user ID`);
      return NextResponse.json(
        { error: "unauthorized", message: "Musisz być zalogowany", requestId },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { type, plan, addon } = body;

    console.log(`[checkout][${requestId}] type=${type} plan=${plan} addon=${addon} userId=${sessionUserId}`);

    // Get user data
    const userQ = await pool.query(
      `SELECT telegram_user_id FROM users WHERE id=$1 LIMIT 1`,
      [sessionUserId]
    );
    const telegramUserId = Number(userQ.rows[0]?.telegram_user_id || 0);

    if (!telegramUserId) {
      console.error(`[checkout][${requestId}] No telegram_user_id for userId=${sessionUserId}`);
      return NextResponse.json(
        { error: "invalid_user", message: "Brak telegram_user_id", requestId },
        { status: 400 }
      );
    }

    // Get current plan
    const entQ = await pool.query(
      `SELECT plan_code FROM user_entitlements_v WHERE user_id=$1 LIMIT 1`,
      [sessionUserId]
    );
    const currentPlan = normalizePlan(entQ.rows[0]?.plan_code);

    let priceId = "";
    let quantity = 1;

    if (type === "plan") {
      const allowed = allowedUpgrades(currentPlan);
      if (!allowed.includes(plan)) {
        console.error(`[checkout][${requestId}] Plan ${plan} not allowed for current=${currentPlan}`);
        return NextResponse.json(
          { 
            error: "invalid_plan", 
            message: `Plan ${plan} nie jest dostępny dla twojego obecnego planu`, 
            requestId 
          },
          { status: 400 }
        );
      }

      priceId = STRIPE_PRICE_IDS[plan as keyof typeof STRIPE_PRICE_IDS] || "";
      if (!priceId) {
        console.error(`[checkout][${requestId}] Missing Stripe price ID for plan=${plan}`);
        return NextResponse.json(
          { error: "config_error", message: `Brak konfiguracji dla planu ${plan}`, requestId },
          { status: 500 }
        );
      }
    } else if (type === "addon") {
      if (currentPlan !== "platinum") {
        console.error(`[checkout][${requestId}] Addon requires platinum, current=${currentPlan}`);
        return NextResponse.json(
          { 
            error: "invalid_addon", 
            message: "Dodatki są dostępne tylko dla planu Platinum", 
            requestId 
          },
          { status: 400 }
        );
      }

      priceId = STRIPE_PRICE_IDS[addon as keyof typeof STRIPE_PRICE_IDS] || "";
      if (!priceId) {
        console.error(`[checkout][${requestId}] Missing Stripe price ID for addon=${addon}`);
        return NextResponse.json(
          { error: "config_error", message: `Brak konfiguracji dla dodatku ${addon}`, requestId },
          { status: 500 }
        );
      }
    } else {
      console.error(`[checkout][${requestId}] Invalid type=${type}`);
      return NextResponse.json(
        { error: "invalid_type", message: "Nieprawidłowy typ (plan lub addon)", requestId },
        { status: 400 }
      );
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price: priceId,
          quantity,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_PANEL_URL || "http://localhost:3000"}/billing?success=1`,
      cancel_url: `${process.env.NEXT_PUBLIC_PANEL_URL || "http://localhost:3000"}/billing?canceled=1`,
      metadata: {
        telegram_user_id: String(telegramUserId),
        user_id: String(sessionUserId),
        type,
        plan: plan || "",
        addon: addon || "",
        request_id: requestId,
      },
    });

    console.log(`[checkout][${requestId}] Created Stripe session=${session.id} url=${session.url}`);

    return NextResponse.json({
      url: session.url,
      requestId,
    });

  } catch (error) {
    console.error(`[checkout][${requestId}] Error:`, error);
    const message = error instanceof Error ? error.message : "Unknown error";
    
    return NextResponse.json(
      { 
        error: "checkout_failed", 
        message: `Nie udało się utworzyć sesji checkout: ${message}`, 
        requestId 
      },
      { status: 500 }
    );
  }
}
