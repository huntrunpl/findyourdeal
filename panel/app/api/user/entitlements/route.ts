import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { pool } from "@/lib/db";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await pool.query(
    `SELECT plan_code, expires_at, links_limit_total 
     FROM user_entitlements_v 
     WHERE user_id = $1 LIMIT 1`,
    [userId]
  );
  
  const ent = result.rows[0];
  if (!ent) return NextResponse.json({ planName: "Free", expiresAt: null, linkLimit: 0, activeLinksCount: 0 });

  const linksResult = await pool.query(
    `SELECT COUNT(*)::int AS cnt FROM links WHERE user_id = $1 AND active = true`,
    [userId]
  );

  return NextResponse.json({
    planName: ent.plan_code,
    expiresAt: ent.expires_at,
    linkLimit: ent.links_limit_total || 0,
    activeLinksCount: linksResult.rows[0]?.cnt || 0
  });
}
