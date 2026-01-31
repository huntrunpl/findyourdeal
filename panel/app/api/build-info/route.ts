import { NextResponse } from "next/server";
import os from "os";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    buildId: process.env.BUILD_ID || "dev",
    hostname: os.hostname(),
    cwd: process.cwd(),
    timestamp: new Date().toISOString(),
  });
}
