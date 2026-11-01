export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { assertSafeNodeRuntime } = await import("./lib/node-runtime.mjs");
    assertSafeNodeRuntime();
  }
}
