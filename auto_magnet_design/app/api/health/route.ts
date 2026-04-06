import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET(request: Request) {
  // 1. Authenticate the Request
  const authHeader = request.headers.get("authorization");
  const expectedToken = `Bearer ${process.env.HEALTH_CHECK_TOKEN}`;

  if (!authHeader || authHeader !== expectedToken) {
    // If it's a random guy, pretend this page doesn't even exist or deny them
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Run the Deep Health Check (for the GitHub Robot)
  try {
    const dbPingStart = Date.now();
    await sql`SELECT 1;`;
    const dbPingTime = Date.now() - dbPingStart;

    const requiredEnvs =[
      "DATABASE_URL",
      "GEMINI_API_KEY",
      "STRIPE_SECRET_KEY",
      "STRIPE_WEBHOOK_SECRET",
      "GOOGLE_CLOUD_STORAGE_BUCKET"
    ];
    
    const missingEnvs = requiredEnvs.filter((env) => !process.env[env]);

    if (missingEnvs.length > 0) {
      // Robot gets the exact missing variables so you can read them in GitHub Actions logs!
      return NextResponse.json(
        { 
          status: "degraded",
          message: "Missing essential environment variables.",
          missing: missingEnvs
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        status: "ok", 
        timestamp: new Date().toISOString(),
        database: { status: "connected", latencyMs: dbPingTime },
        services: "healthy"
      },
      { status: 200 }
    );
  } catch (error) {
    // Robot gets the raw database error
    return NextResponse.json(
      { 
        status: "error", 
        message: "Critical infrastructure failure",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}