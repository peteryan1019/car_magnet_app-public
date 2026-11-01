import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GET } from "./route";
import * as nodeRuntime from "@/lib/node-runtime.mjs";

// Mock the neon serverless driver (health check now imports neon directly)
const { mockSql } = vi.hoisted(() => ({
  mockSql: vi.fn(),
}));

vi.mock("@neondatabase/serverless", () => ({
  neon: () => mockSql,
}));

function makeRequest(authHeader?: string): Request {
  const headers: Record<string, string> = {};
  if (authHeader) headers["authorization"] = authHeader;
  return new Request("http://localhost:3000/api/health", { headers });
}

describe("GET /api/health", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("HEALTH_CHECK_TOKEN", "test-token");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("rejects a missing configured token even if the caller sends Bearer undefined", async () => {
    vi.stubEnv("HEALTH_CHECK_TOKEN", "");
    const response = await GET(makeRequest("Bearer undefined"));
    expect(response.status).toBe(401);
    expect(mockSql).not.toHaveBeenCalled();
  });

  it("rejects an unsafe server runtime before contacting the database", async () => {
    vi.spyOn(nodeRuntime, "assertSafeNodeRuntime").mockImplementationOnce(() => {
      throw new Error("Unsafe Node.js runtime");
    });
    const response = await GET(makeRequest("Bearer test-token"));
    expect(response.status).toBe(500);
    expect(mockSql).not.toHaveBeenCalled();
  });

  it("returns 401 when no authorization header is provided", async () => {
    const res = await GET(makeRequest());
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toBe("Unauthorized");
  });

  it("returns 401 when the token is incorrect", async () => {
    const res = await GET(makeRequest("Bearer wrong-token"));
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toBe("Unauthorized");
  });

  it("returns 500 when the database ping fails", async () => {
    process.env.HEALTH_CHECK_TOKEN = "test-token";
    mockSql.mockRejectedValueOnce(new Error("Connection refused"));

    const res = await GET(makeRequest("Bearer test-token"));
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.status).toBe("error");
    expect(json.error).toBe("Connection refused");
  });

  it("returns 200 with ok status when all checks pass", async () => {
    process.env.HEALTH_CHECK_TOKEN = "test-token";
    process.env.DATABASE_URL = "postgresql://test";
    process.env.GEMINI_API_KEY = "test";
    process.env.STRIPE_SECRET_KEY = "test";
    process.env.STRIPE_WEBHOOK_SECRET = "test";
    process.env.GOOGLE_CLOUD_STORAGE_BUCKET = "test";
    process.env.GMAIL_USER = "test@example.com";
    process.env.GMAIL_APP_PASSWORD = "test";

    mockSql.mockResolvedValueOnce([{ "?column?": 1 }]);

    const res = await GET(makeRequest("Bearer test-token"));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.status).toBe("ok");
    expect(json.runtime).toEqual({ node: process.versions.node, node2shellPatched: true });
    expect(json.database.status).toBe("connected");
    expect(typeof json.database.latencyMs).toBe("number");
  });
});
