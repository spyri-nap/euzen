import { spawnSync } from "node:child_process";
// A separate output prevents experimental settings from contaminating normal builds.
for (const args of [
  ["node_modules/typescript/bin/tsc", "-b"],
  ["node_modules/vite/bin/vite.js", "build", "--outDir", "dist-test"],
  ["scripts/pwa-build.mjs", "dist-test"],
]) {
  const result = spawnSync(process.execPath, args, {
    stdio: "inherit",
    env: { ...process.env, VITE_ACCOUNT_SYNC_ENABLED: "true" },
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
