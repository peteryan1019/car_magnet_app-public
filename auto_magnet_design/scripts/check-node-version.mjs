import { assertSafeNodeRuntime } from "../lib/node-runtime.mjs";
console.log(`Verified Node.js ${assertSafeNodeRuntime()} (Node2Shell security baseline).`);
