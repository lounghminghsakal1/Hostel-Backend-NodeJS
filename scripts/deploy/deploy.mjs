#!/usr/bin/env node
// One-command deploy from your PC:  npm run deploy
// SSHes into the EC2 server with your key and runs scripts/deploy/remote-deploy.sh there
// (git pull, npm ci, prisma migrate deploy, prisma generate, pm2 restart, health check).
//
// Settings come from .env.deploy in the project root (git-ignored; copy .env.deploy.example).
// Options:
//   --dry-run   show what would run, without connecting
//   --force     skip the "on main and pushed" checks
import { execSync, spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const force = args.has("--force");

const color = (code, text) => (process.stdout.isTTY ? `\x1b[${code}m${text}\x1b[0m` : text);
const info = (text) => console.log(color("1;34", "==> ") + text);
const stop = (text) => {
  console.error(color("1;31", `\nDeploy stopped: ${text}`));
  process.exit(1);
};

// ── settings: .env.deploy, overridable by environment variables ──
const readEnvFile = (file) => {
  if (!fs.existsSync(file)) return {};
  const values = {};
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (match) values[match[1]] = match[2].replace(/^(["'])(.*)\1$/, "$2");
  }
  return values;
};
const fileValues = readEnvFile(path.join(root, ".env.deploy"));
const setting = (name, fallback = "") => process.env[name] || fileValues[name] || fallback;

const host = setting("EC2_HOST");
const user = setting("EC2_USER", "ubuntu");
const keyPath = setting("EC2_SSH_KEY").replace(/^~(?=$|[\\/])/, os.homedir());
const appDir = setting("APP_DIR", "/home/ubuntu/Hostel-Backend-NodeJS");
const pm2App = setting("PM2_APP", "hostel-backend");
const branch = setting("DEPLOY_BRANCH", "main");
const port = setting("APP_PORT", "2471");

if (!host) stop("EC2_HOST isn't set. Copy .env.deploy.example to .env.deploy and fill it in.");
if (keyPath && !fs.existsSync(keyPath)) stop(`SSH key not found at ${keyPath} (EC2_SSH_KEY in .env.deploy).`);

// ── safety checks: the server pulls from GitHub, so only pushed commits get deployed ──
const git = (command) => execSync(`git ${command}`, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
if (!force) {
  const current = git("rev-parse --abbrev-ref HEAD");
  if (current !== branch) stop(`you're on '${current}', but the server deploys '${branch}'. Switch branch or use --force.`);
  const uncommitted = git("status --porcelain --untracked-files=no");
  if (uncommitted) console.log(color("33", "Note: you have uncommitted changes. They won't be deployed (the server pulls from GitHub)."));
  info(`Checking origin/${branch} is up to date with your commits`);
  try {
    git(`fetch --quiet origin ${branch}`);
  } catch {
    stop("couldn't reach GitHub to check what's pushed (git fetch failed).");
  }
  const notPushed = Number(git(`rev-list --count origin/${branch}..HEAD`));
  if (notPushed > 0) stop(`${notPushed} commit(s) aren't pushed yet. Run 'git push' first, then deploy.`);
  console.log(`Deploying ${git(`rev-parse --short origin/${branch}`)}: ${git(`log -1 --format=%s origin/${branch}`)}`);
}

// ── run the server script over SSH (sent on stdin, so the server always runs this exact version) ──
const script = fs.readFileSync(path.join(root, "scripts/deploy/remote-deploy.sh"), "utf8").replace(/\r\n/g, "\n");
const quote = (value) => `'${String(value).replace(/'/g, `'\\''`)}'`;
const remoteCommand = `bash -s -- ${[appDir, pm2App, branch, port].map(quote).join(" ")}`;
const sshArgs = [
  ...(keyPath ? ["-i", keyPath] : []),
  "-o", "StrictHostKeyChecking=accept-new",
  "-o", "ServerAliveInterval=30",
  "-o", "ConnectTimeout=15",
  `${user}@${host}`,
  remoteCommand,
];

info(`Connecting to ${user}@${host} (${appDir}, pm2 app '${pm2App}')`);
if (dryRun) {
  console.log(`\n[dry run] would run: ssh ${sshArgs.map((a) => (/\s/.test(a) ? JSON.stringify(a) : a)).join(" ")}`);
  console.log(`[dry run] and send scripts/deploy/remote-deploy.sh (${script.split("\n").length} lines) to it.`);
  process.exit(0);
}

const ssh = spawn("ssh", sshArgs, { stdio: ["pipe", "inherit", "inherit"] });
ssh.on("error", (err) => stop(`couldn't start ssh (${err.message}). Windows 10/11 include it; otherwise install "OpenSSH Client".`));
ssh.stdin.end(script);
ssh.on("exit", (code) => {
  if (code === 0) console.log(color("1;32", "\nDone."));
  else if (code === 255) stop("SSH connection failed. Check EC2_HOST, EC2_USER and EC2_SSH_KEY, and that the security group allows SSH from your IP.");
  process.exit(code ?? 1);
});
