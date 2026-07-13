import * as esbuild from "esbuild";

// Uses esbuild's JS API rather than the `esbuild` CLI: pnpm's generated
// node_modules/.bin/esbuild shim always execs its target via `node <path>`,
// but esbuild's own installer replaces bin/esbuild with the raw native
// binary (not JS) for speed - Node then fails trying to parse the binary
// as JavaScript. Importing the package directly sidesteps that shim.
await esbuild.build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  outfile: "dist/index.js",
  external: [
    "bcryptjs",
    "better-sqlite3",
    "better-sqlite3-session-store",
    "cors",
    "dotenv",
    "express",
    "express-session",
    "passport",
    "passport-local",
    "zod",
  ],
});
