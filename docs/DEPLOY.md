# Deploying to EC2

No Docker needed. A deploy runs these steps on the server, in `/home/ubuntu/Hostel-Backend-NodeJS`:

1. Stops if files were edited directly on the server.
2. `git pull --ff-only origin main`
3. `npm ci`
4. `npx prisma migrate deploy`
5. `npx prisma generate`
6. `pm2 restart hostel-backend --update-env`
7. Waits for `GET /health` to answer, which also checks the database. If it doesn't, it prints the last 40 pm2 log lines.

All of this is in [`scripts/deploy/remote-deploy.sh`](../scripts/deploy/remote-deploy.sh). The server pulls from GitHub, so **commit and push first**.

## One command from your PC

One-time setup:

1. Copy `.env.deploy.example` to `.env.deploy` (git-ignored) and fill in:
   - `EC2_HOST`: the server's public IP or DNS name
   - `EC2_SSH_KEY`: the path to your `.pem` key, e.g. `C:/Users/you/keys/hostel-ec2.pem`
   - `EC2_USER`: `ubuntu`
2. On Windows, OpenSSH refuses a key other users can read. If ssh says "UNPROTECTED PRIVATE KEY FILE", run this in PowerShell (change the path):
   ```powershell
   icacls "C:\Users\you\keys\hostel-ec2.pem" /inheritance:r /grant:r "$($env:USERNAME):(R)"
   ```

Then, every time:

```bash
git push
npm run deploy
```

`npm run deploy -- --dry-run` shows what would run without connecting. `--force` skips the "on main and pushed" checks.

## From GitHub (Actions)

`.github/workflows/deploy.yml` runs the same script: **Actions > Deploy to EC2 > Run workflow**.

One-time setup, in repo **Settings > Secrets and variables > Actions**:
- Secrets: `EC2_HOST`, and `EC2_SSH_KEY` (the full contents of the `.pem` file). Add `EC2_USER` if it isn't `ubuntu`.
- Variables (optional): `APP_DIR`, `PM2_APP`.
- The EC2 security group must allow SSH from GitHub's runners. If port 22 is open only to your IP, use `npm run deploy` instead.
- To deploy on every push to `main`, uncomment the `push:` trigger in the workflow.

## Check what's live

```bash
curl https://api.ourhostel.in/health
```

It returns `{"status":"ok","database":"ok","version":"<git commit>","startedAt":"..."}`.
