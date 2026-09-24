/**
 * run-prisma.js
 * Loads backend/.env then runs the Prisma CLI (Windows-safe).
 */

require("../loadEnv");
const path = require("path");
const { spawnSync } = require("child_process");

const result = spawnSync("npx", ["prisma", ...process.argv.slice(2)], {
  stdio: "inherit",
  shell: true,
  env: process.env,
  cwd: path.join(__dirname, ".."),
});

process.exit(result.status ?? 1);
