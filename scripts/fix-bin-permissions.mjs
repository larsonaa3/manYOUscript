// Some deploy pipelines (seen on Hostinger's Git-based Node.js app deploy)
// strip the executable bit off files during transfer/extraction, breaking
// any tool invoked as a binary (turbo, tsc, vite, etc.) with EACCES. This
// walks node_modules looking for "bin"/".bin" directories and restores
// 0o755 on every file inside them. Runs as a postinstall hook and again
// right before "build" so it's guaranteed to happen after any step that
// might have stripped permissions - harmless no-op on Windows and when
// permissions are already correct.

import { readdirSync, chmodSync } from "node:fs";
import { join } from "node:path";

const MAX_DEPTH = 10;

function chmodFilesIn(dir) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = join(dir, entry.name);
    try {
      if (entry.isFile() || entry.isSymbolicLink()) {
        chmodSync(full, 0o755);
      }
    } catch {
      // best-effort; ignore files/platforms where this doesn't apply
    }
  }
}

function walk(dir, depth) {
  if (depth > MAX_DEPTH) return;
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const full = join(dir, entry.name);
    if (entry.name === "bin" || entry.name === ".bin") {
      chmodFilesIn(full);
    } else {
      walk(full, depth + 1);
    }
  }
}

walk("node_modules", 0);
