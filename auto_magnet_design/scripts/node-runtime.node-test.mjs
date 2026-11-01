import assert from "node:assert/strict";
import test from "node:test";
import { assertSafeNodeRuntime } from "../lib/node-runtime.mjs";

test("accepts the patched Node 24 boundary and subsequent releases", () => {
  for (const version of ["24.22.1", "24.22.2", "24.23.0", "24.30.0"]) {
    assert.equal(assertSafeNodeRuntime(version), version);
  }
});

test("rejects vulnerable, unsupported, and unverified versions", () => {
  for (const version of ["24.22.0", "24.21.9", "24.0.0", "20.20.0", "22.23.3", "26.3.0", "24.22.1-rc.1", "", "unknown"]) {
    assert.throws(() => assertSafeNodeRuntime(version));
  }
});
