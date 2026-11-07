import express from "express";
import { execSync } from "child_process";
import { prisma } from "../../configs/db.js";

//GET /health - used by the deploy script to confirm the new version is up and can reach the database
const healthRouter = express.Router();

//the git commit this process is running, read once at startup (shows which deploy is live)
const version = (() => {
  try {
    return execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch {
    return "unknown";
  }
})();
const startedAt = new Date().toISOString();

healthRouter.get("/health", async (req, res) => {
  res.set("Cache-Control", "no-store");
  try {
    await prisma.$queryRaw`SELECT 1`;
    return res.json({ status: "ok", database: "ok", version, startedAt });
  } catch (err) {
    console.error("[HEALTH] database check failed:", err?.message ?? err);
    return res.status(503).json({ status: "error", database: "unreachable", version, startedAt });
  }
});

export default healthRouter;
