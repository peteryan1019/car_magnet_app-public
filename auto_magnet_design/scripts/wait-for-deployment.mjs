const deployment = new URL(process.argv[2]);
if (deployment.protocol !== "https:" || !deployment.hostname.endsWith(".vercel.app") || deployment.username || deployment.password) {
  throw new Error("Expected an HTTPS Vercel deployment URL.");
}
if (!process.env.VERCEL_TOKEN) throw new Error("VERCEL_TOKEN is required.");
const endpoint = new URL(`https://api.vercel.com/v13/deployments/${encodeURIComponent(deployment.hostname)}`);
if (process.env.VERCEL_ORG_ID?.startsWith("team_")) endpoint.searchParams.set("teamId", process.env.VERCEL_ORG_ID);
const headers = { authorization: `Bearer ${process.env.VERCEL_TOKEN}` };
let previousState;
const deadline = Date.now() + 15 * 60 * 1000;
while (Date.now() < deadline) {
  const response = await fetch(endpoint, { headers, redirect: "error", signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error(`Vercel deployment status: HTTP ${response.status}`);
  const result = await response.json();
  if (result.readyState !== previousState) console.log(`Hosting deployment state: ${result.readyState}`);
  previousState = result.readyState;
  if (result.readyState === "READY") process.exit(0);
  if (["ERROR", "CANCELED", "BLOCKED"].includes(result.readyState)) {
    throw new Error(`Hosting deployment cannot proceed: ${result.readyState}. ${result.readyStateReason || "Check the Vercel deployment logs."}`);
  }
  await new Promise(resolve => setTimeout(resolve, 5000));
}
throw new Error("Hosting deployment did not become ready within 15 minutes.");
