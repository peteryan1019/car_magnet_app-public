import { assertSafeNodeRuntime } from "../lib/node-runtime.mjs";

const url = new URL(process.argv[2]);
if (url.protocol !== "https:" || !url.hostname.endsWith(".vercel.app") || url.username || url.password) {
  throw new Error("Expected an HTTPS Vercel deployment URL.");
}
if (!process.env.HEALTH_CHECK_TOKEN) throw new Error("HEALTH_CHECK_TOKEN is required.");
url.pathname = "/api/health";
url.search = "";
url.hash = "";
let failure;
for (let attempt = 0; attempt < 6; attempt++) {
  try {
    const response = await fetch(url, {
      headers: { authorization: `Bearer ${process.env.HEALTH_CHECK_TOKEN}` },
      redirect: "error",
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error(`Health check returned HTTP ${response.status}.`);
    const health = await response.json();
    if (health.status !== "ok" || health.runtime?.node2shellPatched !== true || typeof health.runtime?.node !== "string") {
      throw new Error("Deployment did not provide a healthy, verified Node.js runtime.");
    }
    assertSafeNodeRuntime(health.runtime.node);
    console.log(`Verified ${url.origin}: Node.js ${health.runtime.node}, healthy, Node2Shell baseline passed.`);
    process.exit(0);
  } catch (error) {
    failure = error;
    if (attempt < 5) await new Promise(resolve => setTimeout(resolve, 5000));
  }
}
throw failure;
