// CVE-2026-111497: https://nodejs.org/en/blog/vulnerability/october-2026-security-releases
// Keep this policy aligned with package.json engines and .nvmrc.
export function assertSafeNodeRuntime(version = process.versions.node) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  if (!match) throw new Error("Cannot verify the Node.js runtime version.");
  const [, major, minor, patch] = match.map(Number);
  if (major !== 24 || minor < 22 || (minor === 22 && patch < 1)) {
    throw new Error(
      `Unsupported Node.js ${version}. Use Node.js 24.22.1 or later in the 24.x line to address Node2Shell (CVE-2026-111497).`,
    );
  }
  return version;
}
